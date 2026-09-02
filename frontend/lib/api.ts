const BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export type ApiOptions = RequestInit & { token?: string };

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  const token = opts.token || (typeof window !== 'undefined' ? localStorage.getItem('avito_token') : null);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // NestJS xətası: { statusCode, error, message } — message daha faydalıdır
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new Error(msg || data.error || 'Server xətası');
  }
  return data as T;
}

/**
 * NestJS cavab zərfi: `{ ok, data, meta }` (TransformInterceptor).
 * Köhnə Express `{ items }` / `{ listing }` / `{ categories }` formatı hələ də
 * bəzi çağırış yerlərində gözlənilirdi — bu, canlıda 4 səhifəni sındırırdı
 * (profil statistikası, elan statistikası, müqayisə, admin KPI).
 *
 * Faza 0: mərkəzləşdirilmiş açıcı. Yeni format prioritetdir, köhnə açarlar
 * geriyə uyğunluq üçün saxlanılır ki, qalan çağırış yerləri sınmasın.
 */
export interface Envelope<T> {
  ok?: boolean;
  data?: T;
  meta?: Record<string, any>;
  // köhnə (legacy Express) açarlar
  items?: T;
  listing?: T;
  categories?: T;
  regions?: T;
  attributes?: T;
}

export function unwrap<T>(res: Envelope<T> | T, fallback: T): T {
  if (res == null) return fallback;
  if (Array.isArray(res)) return res as T;
  const e = res as Envelope<T>;
  const v = e.data ?? e.items ?? e.listing ?? e.categories ?? e.regions ?? e.attributes;
  return (v ?? (typeof res === 'object' && 'ok' in e ? fallback : (res as T))) ?? fallback;
}

/** `meta` (pagination və s.) — köhnə formatda kök səviyyədə ola bilər. */
export function unwrapMeta(res: any): Record<string, any> {
  return res?.meta ?? (res && typeof res === 'object' ? res : {});
}

export const formatPrice = (price: number | null | undefined, currency = 'AZN') => {
  if (price == null) return 'Razılaşma yolu ilə';
  return new Intl.NumberFormat('az-AZ').format(price) + ' ' + currency;
};

export const timeAgo = (date: string) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'indi';
  if (diff < 3600) return `${Math.floor(diff / 60)} dəq əvvəl`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} gün əvvəl`;
  return new Date(date).toLocaleDateString('az-AZ');
};
