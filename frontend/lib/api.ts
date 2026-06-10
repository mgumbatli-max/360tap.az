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
