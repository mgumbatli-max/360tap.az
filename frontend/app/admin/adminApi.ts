/**
 * ADMİN PANELİ — API KONTRAKTI TƏK YERDƏ.
 *
 * NİYƏ: panel 7 bölmədən ibarətdir və hər bölmə ayrı endpoint dəstinə baxır.
 * Yolları komponentlərə səpsək, backend kontraktı dəyişəndə 7 faylı axtarmaq
 * lazım gələcək. Burada isə yol + cavab tipi yan-yana durur.
 *
 * NİYƏ `Result` (throw yox): bölmələrin bir hissəsi backend paralel yazılarkən
 * hələ mövcud olmaya bilər. Panel bu halda ÇÖKMƏMƏLİ, həmin bölməni «hazırlanır»
 * kimi göstərməlidir — bunun üçün «endpoint yoxdur» ilə «real xəta» fərqlənməlidir.
 */
import { api } from '@/lib/api';

// ─────────────── Ümumi ───────────────

export type FailKind = 'missing' | 'forbidden' | 'notFound' | 'network' | 'error';

export interface Fail {
  kind: FailKind;
  message: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; fail: Fail };

export interface PageMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  [key: string]: unknown;
}

/**
 * NestJS route tapmayanda «Cannot GET /api/v1/...» qaytarır; biznes xətaları isə
 * azərbaycanca mesajdır. `lib/api.ts` status kodunu ötürmədiyi üçün ayrıd edici budur.
 */
const MISSING_ROUTE_RE = /^Cannot (GET|POST|PATCH|PUT|DELETE)\s/i;

export function classifyError(e: unknown): Fail {
  const message = e instanceof Error ? e.message : 'Naməlum xəta';
  if (MISSING_ROUTE_RE.test(message)) return { kind: 'missing', message };
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return { kind: 'network', message: 'Serverlə əlaqə qurulmadı' };
  }
  if (/icazə|forbidden/i.test(message)) return { kind: 'forbidden', message };
  if (/tapılmadı|not found/i.test(message)) return { kind: 'notFound', message };
  return { kind: 'error', message };
}

function payload<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

interface RequestInitLite {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

function withQuery(path: string, query?: RequestInitLite['query']): string {
  if (!query) return path;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

export async function call<T>(path: string, init: RequestInitLite = {}): Promise<Result<T>> {
  try {
    const raw = await api<unknown>(withQuery(path, init.query), {
      method: init.method ?? 'GET',
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
    return { ok: true, value: payload<T>(raw) };
  } catch (e) {
    return { ok: false, fail: classifyError(e) };
  }
}

/** Səhifələnən siyahılar: `data` ilə yanaşı `meta` da lazımdır. */
export async function callList<T>(
  path: string,
  init: RequestInitLite = {},
): Promise<Result<{ items: T[]; meta: PageMeta }>> {
  try {
    const raw = await api<unknown>(withQuery(path, init.query), {
      method: init.method ?? 'GET',
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
    const items = payload<T[]>(raw);
    // `meta` yalnız zərfdə olduğu kimi götürülür: `unwrapMeta` köhnə formatlar üçün
    // meta tapmayanda BÜTÜN cavabı meta kimi qaytarır — burada bu, yanlış `total`
    // oxunmasına gətirər (siyahı endpoint-lərinin bir hissəsi meta göndərmir).
    const meta =
      raw && typeof raw === 'object' && 'meta' in (raw as Record<string, unknown>)
        ? ((raw as { meta?: PageMeta }).meta ?? {})
        : {};
    return { ok: true, value: { items: Array.isArray(items) ? items : [], meta } };
  } catch (e) {
    return { ok: false, fail: classifyError(e) };
  }
}

// ─────────────── Tiplər (backend select-ləri ilə birebir) ───────────────

export type StoreStatus = 'pending' | 'active' | 'suspended';
export type UserRole = 'user' | 'pro' | 'business' | 'moderator' | 'admin' | 'super_admin';
export type UserStatus = 'pending' | 'active' | 'suspended' | 'banned';

export type CountMap = Record<string, number>;

export interface AdminStats {
  listings: { total: number; byStatus: CountMap; withStore: number; last7d: number };
  users: { total: number; byRole: CountMap; byStatus: CountMap; last7d: number };
  stores: { total: number; byStatus: CountMap; verified: number; last7d: number };
  categories: { total: number; active: number };
  daily: { date: string; listings: number; users: number }[];
  /** Bayraq bağlıdırsa panel «limitlər hesablanır, tətbiq olunmur» xəbərdarlığı göstərir. */
  monetizationEnabled: boolean;
  generatedAt: string;
}

export interface AdminStore {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  status: StoreStatus;
  isVerified: boolean;
  source: string;
  rating: number;
  reviewsCount: number;
  phone: string | null;
  createdAt: string;
  owner: { id: string; fullName: string; email: string | null; phone: string | null; role: UserRole };
  listingsCount: number;
}

export interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  sellerType: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  store: { id: string; slug: string; status: StoreStatus } | null;
}

export interface PlatformSetting {
  key: string;
  value: unknown;
  label: string;
  hint: string;
}

export interface CategoryLimit {
  freePerMonth: number;
  storeFreePerMonth: number | null;
  extraListingPrice: number;
  enabled: boolean;
  updatedAt: string;
}

export interface CategoryLimitRow {
  id: string;
  parentId: string | null;
  slug: string;
  nameAz: string;
  vertical: string;
  isActive: boolean;
  listingsCount: number;
  limit: CategoryLimit | null;
}

export interface AdminPackage {
  id: string;
  code: string;
  name: string;
  priceMonthly: number;
  durationDays: number;
  serviceBalance: number;
  listingQuota: number;
  discountPercent: number;
  description: string | null;
  limits: Record<string, unknown>;
  features: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  /** Satılmış abunə sayı — paketi silmək olarmı sualına cavab verir. */
  subscriptionsCount: number;
}

/** `POST /admin/packages` gövdəsi (CreatePackageDto). `code` yalnız yaratmada. */
export interface PackagePayload {
  code: string;
  name: string;
  priceMonthly: number;
  durationDays?: number;
  serviceBalance?: number;
  listingQuota?: number;
  discountPercent?: number;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface AdminSubscription {
  id: string;
  userId: string;
  packageId: string;
  status: string;
  /** Saxlanan status köhnələ bilər — bu, faktiki (vaxt nəzərə alınmış) haldır. */
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  balanceLeft: number;
  quotaLeft: number;
  discountPercent: number;
  grantedBy: string | null;
  note: string | null;
  createdAt: string;
  package: { id: string; code: string; name: string };
  user: { id: string; fullName: string; email: string | null; phone: string | null } | null;
}

// ─────────────── Endpoint-lər ───────────────

export const AdminApi = {
  stats: () => call<AdminStats>('/admin/stats'),

  settings: () => call<PlatformSetting[]>('/admin/settings'),
  setSetting: (key: string, value: unknown) =>
    call<PlatformSetting>(`/admin/settings/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: { value },
    }),

  stores: (query: { status?: string; q?: string; verified?: string; page?: number; limit?: number }) =>
    callList<AdminStore>('/admin/stores', { query }),
  updateStore: (id: string, body: { status?: StoreStatus; isVerified?: boolean }) =>
    call<AdminStore>(`/admin/stores/${id}`, { method: 'PATCH', body }),

  users: (query: { q?: string; role?: string; status?: string; page?: number; limit?: number }) =>
    callList<AdminUser>('/admin/users', { query }),
  updateUser: (id: string, body: { role?: UserRole; status?: UserStatus }) =>
    call<AdminUser>(`/admin/users/${id}`, { method: 'PATCH', body }),

  categoryLimits: () => callList<CategoryLimitRow>('/admin/category-limits'),
  upsertCategoryLimit: (
    categoryId: string,
    body: {
      freePerMonth: number;
      storeFreePerMonth?: number;
      extraListingPrice: number;
      enabled: boolean;
    },
  ) => call<CategoryLimitRow>(`/admin/category-limits/${categoryId}`, { method: 'PUT', body }),

  packages: () => callList<AdminPackage>('/admin/packages'),
  createPackage: (body: PackagePayload) => call<AdminPackage>('/admin/packages', { method: 'POST', body }),
  /** `code` dəyişmir — o, inteqrasiyalarda açar kimi işlədilir. */
  updatePackage: (id: string, body: Partial<Omit<PackagePayload, 'code'>>) =>
    call<AdminPackage>(`/admin/packages/${id}`, { method: 'PATCH', body }),
  /** Abunəsi olan paket silinmir, deaktiv edilir — cavab hansı yolun seçildiyini deyir. */
  deletePackage: (id: string) =>
    call<{ id: string; deleted: boolean; deactivated: boolean; subscriptionsCount: number }>(
      `/admin/packages/${id}`,
      { method: 'DELETE' },
    ),

  subscriptions: (query: { page?: number; limit?: number; status?: string }) =>
    callList<AdminSubscription>('/admin/subscriptions', { query }),
  grantSubscription: (body: { userId: string; packageId: string; note?: string }) =>
    call<AdminSubscription>('/admin/subscriptions', { method: 'POST', body }),
};

// ─────────────── Etiketlər ───────────────

export const STORE_STATUS_LABEL: Record<StoreStatus, string> = {
  pending: 'Təsdiq gözləyir',
  active: 'Aktiv',
  suspended: 'Dayandırılıb',
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  user: 'İstifadəçi',
  pro: 'Pro satıcı',
  business: 'Biznes (mağaza)',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super admin',
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  pending: 'Gözləmədə',
  active: 'Aktiv',
  suspended: 'Dayandırılıb',
  banned: 'Bloklanıb',
};
