/**
 * ADAPTERLƏR ÜÇÜN ORTAQ KÖMƏKÇİLƏR.
 *
 * NİYƏ MASKALAMA: OTP loqları dəstək üçün lazımdır, amma tam e-poçt/nömrə loga
 * düşsə, loq faylı şəxsi məlumat bazasına çevrilir (loqlar Render-də saxlanır və
 * paylaşılır). Ona görə identifikator YALNIZ maskalanmış formada yazılır —
 * dəstək sorğusunu tanımağa bəs edir, sızma üçün bəs etmir.
 */

/** Upstream asılanda qeydiyyat axını gözləməsin — 10 s-dən sonra sorğu kəsilir. */
export const REQUEST_TIMEOUT_MS = 10_000;

/** `aysel@360tap.az` → `a***@360tap.az`. Domen saxlanır: tipik səhv (yanlış domen) görünsün. */
export function maskEmail(raw: string): string {
  const at = raw.lastIndexOf('@');
  if (at <= 0) return '***';
  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1);
  return `${local.slice(0, 1)}***@${domain}`;
}

/** `+994501234567` → `+99450***4567`. Operator kodu və son 4 rəqəm qalır. */
export function maskPhone(raw: string): string {
  if (raw.length < 10) return '***';
  return `${raw.slice(0, 6)}***${raw.slice(-4)}`;
}

/** Şəbəkə/timeout istisnasını mətnə çevirir — adapter heç vaxt throw etmir. */
export function describeError(e: unknown): string {
  if (e instanceof Error) {
    // AbortSignal.timeout `TimeoutError` adı ilə atır — səbəb loqda dəqiq görünsün.
    return e.name === 'TimeoutError' ? `timeout (${REQUEST_TIMEOUT_MS} ms)` : e.message;
  }
  return String(e);
}

/** Upstream cavabının gövdəsi loqa gedir — həddindən artıq uzun olmasın. */
export async function readBody(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  return text.slice(0, 300);
}
