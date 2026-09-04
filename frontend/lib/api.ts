const BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export type ApiOptions = RequestInit & { token?: string };

/**
 * TOKEN SAXLANMASI — tək mənbə.
 *
 * ƏVVƏL: backend `login`/`register` cavabında HƏM `accessToken`, HƏM `refreshToken`
 * qaytarırdı, lakin frontend yalnız access-i yazır, refresh-i ATIRDI. Access ömrü
 * 900 saniyədir (15 dəq) → o vaxtdan sonra bütün profil sorğuları 401 alırdı və
 * səhifələr 401-i `.catch(() => setItems([]))` ilə udduğu üçün istifadəçi heç bir
 * izahat olmadan BOŞ səhifə görürdü (sessiya faktiki 15 dəqiqəlik idi).
 *
 * İNDİ: hər iki token saxlanılır və 401-də sessiya şəffəf yenilənir.
 */
export const TOKEN_KEY = 'avito_token';
export const REFRESH_TOKEN_KEY = 'avito_refresh_token';

/** Sessiya bərpa olunmayanda AuthProvider-in MÖVCUD logout axınını işə salan hadisə. */
export const AUTH_EXPIRED_EVENT = 'tap:auth-expired';

/** Backend `POST /auth/refresh` cavabı: `{ ok, data: { accessToken, refreshToken, accessExpiresIn } }`. */
export type StoredTokens = { accessToken: string; refreshToken?: string | null };

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(tokens: StoredTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  // Backend refresh-i ROTASİYA edir (köhnəsi dərhal revoke olunur), ona görə
  // hər cavabda gələn yeni refresh mütləq köhnənin üzərinə yazılmalıdır.
  if (tokens.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Bu yollarda 401 "sessiya bitdi" demək DEYİL (səhv parol / etibarsız refresh token),
 * ona görə burada refresh cəhdi edilmir — əks halda yanlış parol cəhdi istifadəçinin
 * hələ etibarlı olan refresh tokenini boş yerə revoke edərdi.
 */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

/**
 * Paralel sorğular üçün TƏK uçuşan promise. Backend reuse-detection tətbiq edir:
 * eyni refresh tokeni ikinci dəfə göndərilsə 401 qaytarır və sessiyanı öldürür.
 * Deməli 5 sorğu eyni anda 401 alsa da, refresh CƏMİ BİR DƏFƏ getməlidir.
 */
let refreshInFlight: Promise<string | null> | null = null;

function hasRefreshToken(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem(REFRESH_TOKEN_KEY);
}

async function runRefresh(): Promise<string | null> {
  const refreshToken = typeof window === 'undefined' ? null : localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  let res: Response;
  try {
    // QƏSDƏN `api()` deyil, birbaşa `fetch`: refresh sorğusunun özü 401 alanda
    // yenidən refresh cəhdi edilməsin (sonsuz döngə strukturca mümkün deyil).
    res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
  } catch {
    // Şəbəkə xətası — sessiya hələ etibarlı ola bilər, offline halda logout etmək səhvdir.
    return null;
  }

  const body = await res.json().catch(() => null);
  const tokens = (body?.data ?? body) as StoredTokens | null;
  if (!res.ok || !tokens?.accessToken) {
    // Serverin özü rədd etdi → sessiya bərpa olunmur: tokenləri sil və logout axınını at.
    clearTokens();
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    return null;
  }
  setTokens(tokens);
  return tokens.accessToken;
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = runRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function send(path: string, opts: ApiOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    cache: 'no-store',
  });
}

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  let res = await send(path, opts, opts.token || getToken());

  // 401 → BİR DƏFƏ refresh cəhdi edib orijinal sorğunu təkrarla.
  // `opts.token` açıq verilibsə çağıran tərəf tokeni özü idarə edir — ona toxunmuruq.
  if (
    res.status === 401 &&
    !opts.token &&
    !NO_REFRESH_PATHS.includes(path) &&
    hasRefreshToken()
  ) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await send(path, opts, fresh);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // NestJS xətası: { statusCode, error, message } — message daha faydalıdır
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new Error(msg || data.error || 'Server xətası');
  }
  return data as T;
}

/**
 * FAYL YÜKLƏMƏ — `api()`-nin FormData qardaşı.
 *
 * `api()` başlığa sərt `Content-Type: application/json` qoyur, ona görə FormData ilə
 * istifadə oluna bilmir (brauzerin qoyacağı `multipart/form-data; boundary=…` itir).
 * Nəticədə yükləmə edən 4 yer öz `fetch`-ini yazmışdı və hamısı tokeni birbaşa
 * localStorage-dan oxuyurdu — yəni yuxarıdakı 401→refresh qatını TAM BYPASS edirdi
 * və 15 dəqiqədən sonra səssizcə uğursuz olurdu.
 *
 * Bu köməkçi eyni refresh məntiqini FormData üçün təkrar istifadə edir:
 * boundary-ni brauzer qoyur, yalnız Authorization əlavə olunur.
 */
export async function uploadWithAuth<T = any>(path: string, form: FormData): Promise<T> {
  const sendForm = (token: string | null) =>
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      cache: 'no-store',
    });

  let res = await sendForm(getToken());
  if (res.status === 401 && hasRefreshToken()) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await sendForm(fresh);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new Error(msg || data.error || 'Yükləmə alınmadı');
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
