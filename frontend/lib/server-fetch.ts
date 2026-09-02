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
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      return { ok: false, outcome: 'http', status: res.status, body: null };
    }
    const body = (await res.json()) as T;
    return { ok: true, outcome: 'ok', status: res.status, body };
  } catch (e) {
    const isTimeout =
      e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[serverFetch] ${isTimeout ? 'TIMEOUT' : 'XƏTA'} ${url}`);
    }
    return { ok: false, outcome: isTimeout ? 'timeout' : 'network', status: null, body: null };
  }
}

/** NestJS cavab zərfi: { ok, data, meta }. */
export interface Envelope<T, M = Record<string, unknown>> {
  ok?: boolean;
  data?: T;
  meta?: M;
}

/**
 * Zərfli GET — `data` və `meta`-nı birbaşa qaytarır.
 * `unavailable` true olduqda səhifə "backend əlçatmazdır" fallback-i göstərməlidir
 * (boş siyahıdan fərqli haldır).
 */
export async function serverGet<T, M = Record<string, unknown>>(
  path: string,
  init: ServerFetchInit = {},
): Promise<{ data: T | null; meta: M | null; unavailable: boolean }> {
  const res = await serverFetch<Envelope<T, M>>(path, init);
  if (!res.ok || !res.body) {
    // 4xx = məzmun problemi (məs. tapılmadı), 5xx/timeout/network = servis problemi
    const unavailable =
      res.outcome === 'timeout' ||
      res.outcome === 'network' ||
      (res.status !== null && res.status >= 500);
    return { data: null, meta: null, unavailable };
  }
  return { data: res.body.data ?? null, meta: res.body.meta ?? null, unavailable: false };
}
