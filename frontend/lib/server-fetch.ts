import { createHmac } from 'node:crypto';

/**
 * Server-side (SSR/ISR) API çağırışları üçün ortaq helper — Faza 0.
 *
 * PROBLEM: Server komponentlərindəki `fetch()` çağırışlarının çoxunda timeout yox idi.
 * Backend cavab verməyəndə render sonsuz gözləyirdi → HTTP cavabı heç vaxt bitmirdi
 * (canlıda /elanlar 120 saniyəyə də tamamlanmırdı, istifadəçi skeleton-da qalırdı).
 *
 * HƏLL: hər server-side sorğu üçün sərt timeout + xəta udulması + strukturlu nəticə.
 * Səhifə "boş nəticə" ilə "backend əlçatmaz"ı ayırd edə və uyğun fallback göstərə bilir.
 */

export const SERVER_API = process.env.API_ORIGIN
  ? `${process.env.API_ORIGIN}/api/v1`
  : 'http://localhost:5500/api/v1';

/** Standart SSR timeout — istifadəçi heç bir halda bundan çox gözləməməlidir. */
export const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * E2E İCRASINDA THROTTLE KEÇİDİ — YALNIZ LOKAL.
 *
 * NİYƏ BURADA DA LAZIMDIR: Playwright-ın `page.route()` yalnız BRAUZER sorğularını tutur.
 * Səhifə render-i zamanı buradan gedən SSR sorğuları Next.js serverindən çıxır, brauzerdən
 * yox — yəni onlar keçid başlığını almırdı və rate limit-ə düşürdü. Diaqnostika ilə ölçüldü:
 * bir E2E icrasında `18 × HTTP 429 /api/v1/listings/<id>`. Limit route başına ayrı sayıldığı
 * üçün `/listings` normal cavab verirdi, `/listings/:id` isə dolmuşdu — problem buna görə
 * uzun müddət yanlış yerdə axtarıldı.
 *
 * NİYƏ TƏHLÜKƏSİZDİR: dəyişən yalnız lokal `.env.local`-dadır (Vercel-də təyin olunmur),
 * üstəlik backend başlığı `NODE_ENV === 'production'` olduqda ONSUZ DA rədd edir —
 * yəni canlıda heç bir şəraitdə keçid vermir.
 */
const E2E_HEADERS: Record<string, string> = process.env.E2E_THROTTLE_BYPASS
  ? { 'x-e2e-throttle-bypass': process.env.E2E_THROTTLE_BYPASS }
  : {};

/**
 * SSR SORĞUSUNUN İMZASI — «bu, öz serverimizdir».
 *
 * NİYƏ LAZIMDIR: buradan gedən sorğu brauzerdən gəlmir, ona görə `middleware.ts`-in
 * imzaladığı istifadəçi IP-sini daşımır. Nəticədə BÜTÜN səhifə render-ləri backend-də
 * tək rate-limit bucket-inə düşür. Ölçüldü (diaqnostik log, bir E2E icrası):
 * `18 × HTTP 429 /api/v1/listings/<id>` — mövcud elan səhifələri «Elan müvəqqəti
 * yüklənmir» ekranına düşdü. Canlıda eyni mexanizm populyar səhifələri sıradan çıxarardı.
 *
 * NİYƏ İSTİFADƏÇİNİN IP-Sİ İLƏ İMZALAMIRIQ: onu almaq üçün `headers()` çağırmaq lazımdır,
 * bu isə səhifəni DİNAMİK edir və bütün statik/ISR render-lərini söndürür. Ödəniləcək qiymət
 * problemin özündən böyükdür.
 *
 * TƏHLÜKƏSİZLİK: backend bu imzanı yalnız GET sorğularında qəbul edir — yazma və auth
 * limitləri toxunulmaz qalır. Sirr olmadan başlıq ümumiyyətlə göndərilmir.
 *
 * NİYƏ KEŞLƏNİR: hər sorğuda yeni imza hesablamaq render yoluna əlavə iş qoyur.
 * Backend imzanı 5 dəqiqəyə qədər qəbul etdiyi üçün 30 saniyəlik keş həm tamamilə
 * təhlükəsizdir, həm də bu yolu sinxron saxlayır.
 */
let ssrHeaderCache: { at: number; headers: Record<string, string> } | null = null;

function ssrSignature(): Record<string, string> {
  const secret = process.env.INTERNAL_IP_SECRET;
  if (!secret) return {};

  const now = Date.now();
  if (ssrHeaderCache && now - ssrHeaderCache.at < 30_000) return ssrHeaderCache.headers;

  const ts = String(now);
  const headers = {
    'x-internal-ssr': '1',
    'x-internal-ssr-ts': ts,
    'x-internal-ssr-sig': createHmac('sha256', secret).update(`ssr.${ts}`).digest('hex'),
  };
  ssrHeaderCache = { at: now, headers };
  return headers;
}

export type FetchOutcome = 'ok' | 'timeout' | 'network' | 'http';

export interface ServerFetchResult<T> {
  /** true → `body` etibarlıdır. */
  ok: boolean;
  outcome: FetchOutcome;
  status: number | null;
  body: T | null;
}

export type ServerFetchInit = Omit<RequestInit, 'signal'> & {
  next?: { revalidate?: number | false; tags?: string[] };
  timeoutMs?: number;
};

/**
 * Heç vaxt exception atmır. Uğursuzluqda `{ ok: false, body: null }` qaytarır.
 */
export async function serverFetch<T>(
  path: string,
  init: ServerFetchInit = {},
): Promise<ServerFetchResult<T>> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init;
  const url = path.startsWith('http') ? path : `${SERVER_API}${path}`;

  try {
    const res = await fetch(url, {
      ...rest,
      headers: {
        ...(rest.headers as Record<string, string> | undefined),
        ...ssrSignature(),
        ...E2E_HEADERS,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      // 404 gözlənilən haldır (məzmun yoxdur) — onu loglamaq səs-küy yaradır.
      // Qalan HTTP xətaları isə səhifədə fallback ekranına çevrilir, ona görə
      // səbəbi görünməlidir.
      if (res.status !== 404) {
        console.warn(`[serverFetch] HTTP ${res.status} ${url}`);
      }
      return { ok: false, outcome: 'http', status: res.status, body: null };
    }
    const body = (await res.json()) as T;
    return { ok: true, outcome: 'ok', status: res.status, body };
  } catch (e) {
    const isTimeout =
      e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
    // PRODUCTION-DA DA LOGLANIR. Əvvəl bu log yalnız dev-də çıxırdı və nəticədə
    // «Elan müvəqqəti yüklənmir» ekranının SƏBƏBİ (timeout? şəbəkə? 429?) heç yerdə
    // görünmürdü — canlıda da, E2E-də də yalnız simptom qalırdı. Səbəbsiz simptom
    // saatlarla yanlış istiqamətdə axtarışa səbəb olur.
    console.warn(`[serverFetch] ${isTimeout ? 'TIMEOUT' : 'ŞƏBƏKƏ XƏTASI'} ${url}`);
    return { ok: false, outcome: isTimeout ? 'timeout' : 'network', status: null, body: null };
  }
}

/** NestJS cavab zərfi: { ok, data, meta }. */
export interface Envelope<T, M = Record<string, unknown>> {
  ok?: boolean;
  data?: T;
  meta?: M;
}

/** Müvəqqəti uğursuzluqlar — məzmun problemi yox, «indi cavab verə bilmirəm» halı. */
const TRANSIENT_STATUSES = new Set([408, 425, 429]);

/**
 * Zərfli GET — `data` və `meta`-nı birbaşa qaytarır.
 * `unavailable` true olduqda səhifə "backend əlçatmazdır" fallback-i göstərməlidir
 * (boş siyahıdan fərqli haldır).
 *
 * `status` HTTP kodunu OLDUĞU KİMİ ötürür (uğursuzluqda `null` ola bilər: timeout/şəbəkə).
 * Səbəb: `unavailable` bayrağı yalnız 5xx/timeout/network-u ayırd edir, 4xx-i isə udurdu —
 * ona görə backend-in 404-ü (məs. «Region tapılmadı») səhifədə 200 + boş nəticə kimi görünürdü
 * (soft-404). Çağıran tərəf indi `status === 404` olduqda `notFound()` çağıra bilər.
 * ALTERNATİV RƏDD EDİLDİ: `unavailable`-ı 4xx-ə də şamil etmək — o zaman backend düşəndə və
 * məzmun tapılmayanda eyni fallback çıxardı, Faza 0-dakı qəsdli ayrım pozulardı.
 *
 * İSTİSNA — MÜVƏQQƏTİ 4xx-lər (429/408/425) `unavailable` sayılır.
 * NİYƏ: 429 «bu məzmun yoxdur» demir, «indi cavab verə bilmirəm» deyir. Onu ümumi 4xx
 * kimi ötürmək çağıranı `notFound()`-a aparırdı və rate limit dolan anda MÖVCUD elan
 * səhifəsi sərt HTTP 404 qaytarırdı. Ölçüldü: backend 429 → /elanlar/<slug> = 404
 * «Səhifə tapılmadı». Bu, iki dəfə zərərlidir — istifadəçi mövcud elanı itirir, və
 * axtarış motoru real səhifəni «silinmiş» sayıb indeksdən çıxarır.
 * 408 (request timeout) və 425 (too early) eyni məntiqlə: hər ikisi təkrar cəhdlə keçir.
 * 404/403/401/400 İSƏ OLDUĞU KİMİ QALIR — onlar həqiqətən məzmun/icazə problemidir.
 */
export async function serverGet<T, M = Record<string, unknown>>(
  path: string,
  init: ServerFetchInit = {},
): Promise<{ data: T | null; meta: M | null; unavailable: boolean; status: number | null }> {
  const res = await serverFetch<Envelope<T, M>>(path, init);
  if (!res.ok || !res.body) {
    // 4xx = məzmun problemi (məs. tapılmadı), 5xx/timeout/network = servis problemi,
    // müvəqqəti 4xx (429/408/425) = servis problemi (bax yuxarıdakı şərh).
    const unavailable =
      res.outcome === 'timeout' ||
      res.outcome === 'network' ||
      (res.status !== null && (res.status >= 500 || TRANSIENT_STATUSES.has(res.status)));
    return { data: null, meta: null, unavailable, status: res.status };
  }
  return {
    data: res.body.data ?? null,
    meta: res.body.meta ?? null,
    unavailable: false,
    status: res.status,
  };
}
