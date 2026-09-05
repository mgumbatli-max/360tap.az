import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * MÜŞTƏRİ IP-Sİ — RATE LIMIT AÇARININ TƏK MƏNBƏYİ.
 *
 * NİYƏ AYRICA FAYL: bu məntiq həm `SecureThrottlerGuard`-a (app.module.ts), həm də
 * diaqnostik `GET /health/net`-ə lazımdır. Onu app.module.ts-də saxlamaq health
 * modulundan import edildikdə dövri asılılıq yaradırdı (app.module → health.module →
 * health.controller → app.module).
 */

/**
 * Etibar edilən proxy hop sayı. NİYƏ sabit `1` deyil: sabit dəyər BİRBAŞA qoşulan
 * istənilən müştərini də "proxy" sayırdı — müştəri X-Forwarded-For yazaraq req.ip-i,
 * deməli rate-limit açarını, hər sorğuda dəyişə bilirdi (limit faktiki olaraq yox idi).
 * Render edge tək hop-dur, ona görə prod default 1; lokal/birbaşa işləmədə proxy yoxdur (0).
 */
export function resolveTrustProxyHops(): number {
  const raw = (process.env.TRUST_PROXY ?? '').trim().toLowerCase();
  if (raw === 'true') return 1;
  if (raw === 'false') return 0;
  if (raw !== '') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  }
  return process.env.NODE_ENV === 'production' ? 1 : 0;
}

export const TRUST_PROXY_HOPS = resolveTrustProxyHops();

export interface ProxyAwareRequest {
  socket?: { remoteAddress?: string };
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

/** XFF başlığını normallaşdırılmış zəncirə çevirir (boş elementlər atılır). */
export function forwardedChain(req: ProxyAwareRequest): string[] {
  const header = req.headers?.['x-forwarded-for'];
  return (Array.isArray(header) ? header.join(',') : (header ?? ''))
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Tək başlıq dəyəri (massiv gələrsə birincisi). */
function header(req: ProxyAwareRequest, name: string): string | null {
  const raw = req.headers?.[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && value.length > 0 ? value : null;
}

/** İmzanın qəbul edildiyi maksimum yaş — ələ keçən imza əbədi işləməsin. */
const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * FRONTEND-İN İMZALADIĞI MÜŞTƏRİ IP-Sİ.
 *
 * Vercel middleware (`frontend/middleware.ts`) hər `/api/*` sorğusuna istifadəçinin
 * edge-də oxunmuş IP-sini `x-client-ip` + `x-client-ip-ts` + `x-client-ip-sig` şəklində
 * qoyur. Burada imza yoxlanılır: uyğun gəlirsə IP etibarlıdır.
 *
 * NİYƏ İMZASIZ BAŞLIĞA ETİBAR ETMİRİK: backend `*.onrender.com` ünvanında ictimai
 * əlçatandır — kənar şəxs `x-client-ip`-i özü yazıb hər sorğuda başqa dəyər göndərərək
 * rate limit-i tamamilə keçə bilərdi.
 *
 * Sirr təyin olunmayıbsa (`INTERNAL_IP_SECRET` yoxdur) funksiya həmişə null qaytarır —
 * yəni davranış köhnə məntiqə düşür, «hamı keçir» halı yaranmır.
 */
function signedClientIp(req: ProxyAwareRequest): string | null {
  const secret = process.env.INTERNAL_IP_SECRET;
  if (!secret) return null;

  const ip = header(req, 'x-client-ip');
  const ts = header(req, 'x-client-ip-ts');
  const sig = header(req, 'x-client-ip-sig');
  if (!ip || !ts || !sig) return null;

  const issuedAt = Number.parseInt(ts, 10);
  if (!Number.isFinite(issuedAt)) return null;
  const age = Date.now() - issuedAt;
  // Mənfi yaş = gələcək tarixli imza (saat sürüşməsi və ya saxtakarlıq cəhdi).
  // Kiçik irəli sürüşməyə (30s) dözürük, böyüyünə yox.
  if (age > SIGNATURE_MAX_AGE_MS || age < -30_000) return null;

  const expected = createHmac('sha256', secret).update(`${ip}.${ts}`).digest();
  let received: Buffer;
  try {
    received = Buffer.from(sig, 'hex');
  } catch {
    return null;
  }
  // Uzunluqlar fərqlidirsə `timingSafeEqual` istisna atır — əvvəlcə yoxlanılır.
  if (received.length !== expected.length) return null;
  if (!timingSafeEqual(received, expected)) return null;

  return ip;
}

/**
 * ÖZ SSR RENDERİMİZDƏNDİR? — `frontend/lib/server-fetch.ts` hər sorğuya
 * `x-internal-ssr` + `x-internal-ssr-ts` + `x-internal-ssr-sig` qoyur.
 *
 * Eyni sirr və eyni yaş limiti ilə yoxlanılır (bax `signedClientIp`). Metod
 * yoxlaması ÇAĞIRANIN öhdəsindədir: bu funksiya yalnız «imza düzgündürmü» sualına
 * cavab verir.
 */
export function isInternalSsrRequest(req: ProxyAwareRequest): boolean {
  const secret = process.env.INTERNAL_IP_SECRET;
  if (!secret) return false;

  const method = (req as { method?: string }).method;
  // Yalnız oxu. SSR heç vaxt yazma etmir — POST/PUT/DELETE üçün keçid açmaq
  // qeydiyyat və giriş limitlərini də söndürərdi.
  if (method && method.toUpperCase() !== 'GET') return false;

  const marker = header(req, 'x-internal-ssr');
  const ts = header(req, 'x-internal-ssr-ts');
  const sig = header(req, 'x-internal-ssr-sig');
  if (marker !== '1' || !ts || !sig) return false;

  const issuedAt = Number.parseInt(ts, 10);
  if (!Number.isFinite(issuedAt)) return false;
  const age = Date.now() - issuedAt;
  if (age > SIGNATURE_MAX_AGE_MS || age < -30_000) return false;

  const expected = createHmac('sha256', secret).update(`ssr.${ts}`).digest();
  let received: Buffer;
  try {
    received = Buffer.from(sig, 'hex');
  } catch {
    return false;
  }
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}

/**
 * Saxtalaşdırıla bilməyən müştəri IP-si.
 *
 * PRİORİTET SIRASI (yuxarıdan aşağı):
 *  1. Frontend-in İMZALADIĞI IP — sayt üzərindən gələn real istifadəçilər üçün yeganə
 *     düzgün mənbə. Ölçüldü: proxy arxasında nə XFF hop məntiqi, nə də `cf-connecting-ip`
 *     istifadəçini ayırd edə bilmir (hər ikisi Vercel/Render infrastrukturunu göstərir).
 *  2. `cf-connecting-ip` — Cloudflare yazır və müştəri onu əvəzləyə bilmir. Backend-ə
 *     BİRBAŞA gələn sorğular (API-ni birbaşa çağıranlar, botlar) üçün düzgün dəyər verir.
 *  3. XFF hop məntiqi — köhnə davranış, fallback.
 *
 * NİYƏ "birinci XFF elementi" BACKEND-DƏ YANLIŞDIR: zəncirin əvvəlini müştərinin özü
 * yazır. Uydurula bilməyən yeganə element bizim etibar etdiyimiz proxy-nin ƏLAVƏ
 * ETDİYİDİR — yəni sondan TRUST_PROXY_HOPS-uncu. Zəncir gözləniləndən qısadırsa
 * (sorğu proxy-dən keçməyib) tək həqiqət soket IP-sidir.
 */
export function clientIp(req: ProxyAwareRequest): string {
  const signed = signedClientIp(req);
  if (signed) return signed;

  const cloudflare = header(req, 'cf-connecting-ip');
  if (cloudflare) return cloudflare;

  const socketIp = req.socket?.remoteAddress ?? 'unknown';
  if (TRUST_PROXY_HOPS <= 0) return socketIp;

  const chain = forwardedChain(req);
  const index = chain.length - TRUST_PROXY_HOPS;
  return index >= 0 ? chain[index] : socketIp;
}
