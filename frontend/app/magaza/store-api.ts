/**
 * MAĞAZA API KONTRAKTI — tək mənbə.
 *
 * Backend `GET /stores/:slug` cavabı curl ilə yoxlanılıb (Faza 1 gövdəsi):
 *   { ok, data: { id, slug, name, logoUrl, coverUrl, description, status, isVerified,
 *                 source, rating, reviewsCount, phone, whatsapp, instagram,
 *                 workingHours, deliveryTerms, warrantyTerms, createdAt, activeListings } }
 *
 * DİQQƏT: `rating` Prisma `Decimal`-dır və JSON-a STRİNG kimi düşür («"0"», «"4.80"»),
 * number yox. Ona görə hər yerdə `Number(...)` ilə oxunur — əks halda `.toFixed()`
 * çağırışı runtime-da çökərdi.
 */

export type StoreStatus = 'pending' | 'active' | 'suspended';

export interface StoreBranch {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  status: StoreStatus;
  isVerified: boolean;
  source?: string | null;
  /** Decimal → string. Number() ilə oxunmalıdır. */
  rating: string | number;
  reviewsCount: number;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  workingHours?: unknown;
  deliveryTerms?: string | null;
  warrantyTerms?: string | null;
  createdAt: string;
  activeListings?: number;
  /**
   * Filiallar hazırda `GET /stores/:slug` seçimində YOXDUR (STORE_PUBLIC_SELECT-ə
   * daxil deyil). Backend əlavə edən kimi bölmə özü görünəcək — opsional saxlanır ki,
   * indi uydurma filial göstərilməsin.
   */
  branches?: StoreBranch[] | null;
}

/** `GET /stores/:slug/listings` elementi (toListingResponse zərfindən). */
export interface StoreListing {
  id: string;
  title: string;
  slug?: string;
  price: number | null;
  currency: string;
  priceType: string;
  isVip?: boolean;
  isDemo?: boolean;
  isPremium?: boolean;
  hasDelivery?: boolean;
  views?: number;
  favoritesCount?: number;
  createdAt: string;
  categoryName?: string | null;
  categorySlug?: string | null;
  regionName?: string | null;
  districtName?: string | null;
  images?: { url: string; sortOrder: number }[];
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/** Rəyi/reytinqi yalnız REAL rəy varsa göstər — 0 rəylə «0.0 ulduz» yalan siqnaldır. */
export function hasRating(store: Pick<Store, 'rating' | 'reviewsCount'>): boolean {
  return store.reviewsCount > 0 && Number(store.rating) > 0;
}

/** Telefon nömrəsini `tel:`/`wa.me` üçün normallaşdırır (yalnız rəqəm və baş «+»). */
export function telHref(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, '');
  return `tel:${cleaned}`;
}

export function whatsappHref(raw: string): string {
  // wa.me «+» və boşluq qəbul etmir — yalnız rəqəmlər.
  return `https://wa.me/${raw.replace(/\D/g, '')}`;
}

/** Instagram sahəsi həm «@ad», həm tam URL kimi yazıla bilər — hər ikisi işləsin. */
export function instagramHref(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      return u.hostname.endsWith('instagram.com') ? u.toString() : null;
    } catch {
      return null;
    }
  }
  const handle = v.replace(/^@/, '').replace(/\/+$/, '');
  // Yalnız Instagram-ın icazə verdiyi simvollar — əks halda ixtiyari yol qurula bilər.
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `https://instagram.com/${handle}` : null;
}
