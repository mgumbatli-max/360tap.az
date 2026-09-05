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

/**
 * Saxtalaşdırıla bilməyən müştəri IP-si.
 * NİYƏ "birinci XFF elementi" YANLIŞDIR: zəncirin əvvəlini müştərinin özü yazır.
 * Uydurula bilməyən yeganə element bizim etibar etdiyimiz proxy-nin ƏLAVƏ ETDİYİDİR —
 * yəni sondan TRUST_PROXY_HOPS-uncu. Zəncir gözləniləndən qısadırsa (sorğu proxy-dən
 * keçməyib) tək həqiqət soket IP-sidir.
 */
export function clientIp(req: ProxyAwareRequest): string {
  const socketIp = req.socket?.remoteAddress ?? 'unknown';
  if (TRUST_PROXY_HOPS <= 0) return socketIp;

  const chain = forwardedChain(req);
  const index = chain.length - TRUST_PROXY_HOPS;
  return index >= 0 ? chain[index] : socketIp;
}
