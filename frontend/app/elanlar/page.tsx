import Link from 'next/link';
import ListingCard, { type Listing } from '@/components/ListingCard';
import CategoryFilters, { type CatAttr } from '@/components/CategoryFilters';
import InfiniteListings from '@/components/InfiniteListings';
import SaveSearchButton from '@/components/SaveSearchButton';
import { meiliSearch, type MeiliHit } from '@/lib/meili';
import { serverGet } from '@/lib/server-fetch';

function mapMeiliHit(h: MeiliHit): Listing {
  return {
    id: h.id,
    title: h.title,
    slug: '',
    price: h.price ?? null,
    currency: h.currency ?? 'AZN',
    price_type: h.priceType ?? 'fixed',
    is_vip: h.isVip,
    created_at: h.createdAt ?? new Date(0).toISOString(),
    city_name: h.regionName ?? undefined,
    media: h.cover ? [{ url: h.cover, sort_order: 0 }] : [],
  };
}

interface SP {
  q?: string;
  region?: string;
  category?: string;
  vertical?: string;
  priceMin?: string;
  priceMax?: string;
  sort?: string;
  page?: string;
  [key: string]: string | undefined; // a_* atribut filtrləri
}

type NestListing = {
  id: string; title: string; slug: string; price: number | null; currency: string;
  priceType: string; isVip?: boolean; isPremium?: boolean; hasDelivery?: boolean;
  views?: number; favoritesCount?: number; createdAt: string;
  regionName?: string | null; districtName?: string | null;
  images?: { url: string; sortOrder: number }[];
};

type Understanding = {
  keywords?: string | null; region?: string | null; vertical?: string | null;
  category?: string | null; brand?: string | null; color?: string | null;
  condition?: string | null; priceMin?: number | null; priceMax?: number | null;
};

function mapListing(l: NestListing): Listing {
  return {
    id: l.id, title: l.title, slug: l.slug, price: l.price ?? null,
    currency: l.currency ?? 'AZN', price_type: l.priceType ?? 'fixed',
    is_vip: l.isVip, is_premium: l.isPremium, has_delivery: l.hasDelivery,
    views: l.views, favorites_count: l.favoritesCount, created_at: l.createdAt,
    city_name: l.regionName ?? undefined, district: l.districtName ?? undefined,
    media: (l.images ?? []).map((i) => ({ url: i.url, sort_order: i.sortOrder ?? 0 })),
  };
}

const REGIONS = [
  { slug: '', name: 'Bütün AZ' }, { slug: 'baki', name: 'Bakı' },
  { slug: 'sumqayit', name: 'Sumqayıt' }, { slug: 'gence', name: 'Gəncə' },
  { slug: 'qebele', name: 'Qəbələ' }, { slug: 'quba', name: 'Quba' },
  { slug: 'lenkeran', name: 'Lənkəran' }, { slug: 'seki', name: 'Şəki' },
];
const SORTS = [
  { v: 'new', name: 'Ən yeni' },
  { v: 'price_asc', name: 'Ucuz əvvəl' },
  { v: 'price_desc', name: 'Baha əvvəl' },
];

const U_LABELS: Record<string, string> = {
  keywords: '🔎', region: '📍', vertical: '📂', category: '📂',
  brand: '🏷️', color: '🎨', condition: '✨', priceMin: '≥', priceMax: '≤',
};

function qs(sp: SP, patch: Partial<SP>): string {
  const merged = { ...sp, ...patch, page: undefined };
  const p = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => {
    if (v) p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `/elanlar?${s}` : '/elanlar';
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  let items: Listing[] = [];
  let total = 0;
  let hasMore = false;
  let baseQuery = ''; // client sonsuz scroll üçün API sorğusu (page/limit-siz)
  let catAttrs: CatAttr[] = [];
  let catName = ''; // backend meta-dan kateqoriya adı (h1)
  let understanding: Understanding | null = null;
  let backendDown = false; // timeout/şəbəkə/5xx → "elan yoxdur"dan fərqli fallback

  if (sp.q) {
    // ---- Hibrid axtarış: Meili (typo+sinonim) → AI semantik → keyword ----
    // Faza 0: üç mərhələ ARDICIL işlədiyi üçün sabit timeout-lar cəmlənib səhifəni
    // 15-20 s gözlədə bilirdi. İndi ÜMUMİ büdcə var: hansı mərhələdə olursa olsun,
    // axtarış render-i bu həddi keçmir.
    const SEARCH_BUDGET_MS = 8_000;
    const deadline = Date.now() + SEARCH_BUDGET_MS;
    const left = (): number => Math.max(0, deadline - Date.now());

    const hits = await meiliSearch(sp.q, 24, Math.min(4_000, left()));
    if (hits.length) {
      items = hits.map(mapMeiliHit);
      total = hits.length;
    }
    // AI fallback (Meili heç nə tapmadısa — mürəkkəb təbii dil)
    if (items.length === 0 && left() > 500) {
      const ai = await serverGet<NestListing[], { total: number; understanding?: Understanding }>(
        '/ai/search',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: sp.q }),
          cache: 'no-store',
          timeoutMs: Math.min(5_000, left()),
        },
      );
      if (ai.data) {
        items = ai.data.map(mapListing);
        total = ai.meta?.total ?? items.length;
        understanding = ai.meta?.understanding ?? null;
      }
    }
    // Fallback: AI heç nə tapmadısa, ani DB keyword axtarışı
    if (items.length === 0) {
      const kw = await serverGet<NestListing[], { total: number }>(
        `/listings?q=${encodeURIComponent(sp.q)}&limit=24`,
        { cache: 'no-store', timeoutMs: Math.max(2_000, Math.min(4_000, left())) },
      );
      if (kw.data) {
        items = kw.data.map(mapListing);
        total = kw.meta?.total ?? items.length;
      }
      if (kw.unavailable) backendDown = true;
    }
  } else {
    // ---- Adi filter axtarış ----
    const params = new URLSearchParams();
    if (sp.region) params.set('region', sp.region);
    if (sp.category) params.set('category', sp.category);
    if (sp.vertical) params.set('vertical', sp.vertical);
    if (sp.priceMin) params.set('priceMin', sp.priceMin);
    if (sp.priceMax) params.set('priceMax', sp.priceMax);
    if (sp.sort) params.set('sort', sp.sort);
    // a_* atribut filtrləri → attrs JSON (scalar + range _min/_max)
    const attrsObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(sp)) {
      if (!k.startsWith('a_') || !v) continue;
      const key = k.slice(2);
      if (key.endsWith('_min')) {
        const base = key.slice(0, -4);
        attrsObj[base] = { ...(attrsObj[base] as object), min: Number(v) };
      } else if (key.endsWith('_max')) {
        const base = key.slice(0, -4);
        attrsObj[base] = { ...(attrsObj[base] as object), max: Number(v) };
      } else {
        // boolean filtrlər `a_<key>=true` STRING göndərir; seed JSON boolean saxlayır →
        // əsl boolean-a çevir ki, Prisma `equals` uyğunlaşsın (select dəyərləri olduğu kimi qalır)
        attrsObj[key] = v === 'true' ? true : v === 'false' ? false : v;
      }
    }
    if (Object.keys(attrsObj).length) params.set('attrs', JSON.stringify(attrsObj));
    baseQuery = params.toString(); // sonsuz scroll üçün (page/limit-siz)
    params.set('page', '1');
    params.set('limit', '50');
    // Listings VƏ kateqoriya atributlarını PARALEL çək (waterfall yox — bir round trip qənaət).
    // Hər ikisi timeout-ludur: backend asılı qalsa da render bir neçə saniyəyə tamamlanır.
    const [listD, attrD] = await Promise.all([
      serverGet<NestListing[], { total: number; hasMore: boolean; categoryName?: string }>(
        `/listings?${params}`,
        { next: { revalidate: 30 } },
      ),
      sp.category
        ? serverGet<CatAttr[]>(`/categories/${sp.category}/attributes`, {
            next: { revalidate: 600 },
          })
        : Promise.resolve({ data: null, meta: null, unavailable: false }),
    ]);
    if (listD.data) {
      items = listD.data.map(mapListing);
      total = listD.meta?.total ?? items.length;
      hasMore = listD.meta?.hasMore ?? false;
      catName = listD.meta?.categoryName ?? '';
    }
    if (listD.unavailable) backendDown = true;
    if (attrD.data) catAttrs = attrD.data;
  }

  const uChips = understanding
    ? Object.entries(understanding).filter(([, v]) => v != null && v !== '')
    : [];

  // Qeyd: catAttrs browse branch-də listings ilə PARALEL çəkilir (waterfall yox)

  return (
    <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {sp.q ? (
          <>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 dark:text-white mb-1">
              «{sp.q}»
            </h1>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-sm font-bold text-tap">
                🤖 AI axtarışı
              </span>
              {uChips.map(([k, v]) => (
                <span
                  key={k}
                  className="px-2.5 py-1 rounded-full bg-tap-50 dark:bg-ink-800 text-xs font-medium text-ink-700 dark:text-ink-200 border border-tap/20"
                >
                  {U_LABELS[k] ?? ''} {String(v)}
                </span>
              ))}
            </div>
            <p className="text-ink-500 text-sm mb-5">{total} nəticə tapıldı</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 dark:text-white mb-1">
              {sp.category ? (catName || sp.category.replace(/-/g, ' ')) : 'Bütün elanlar'}
              {sp.region ? ` — ${REGIONS.find((r) => r.slug === sp.region)?.name ?? sp.region}` : ''}
            </h1>
            <p className="text-ink-500 text-sm mb-4">{total} elan tapıldı</p>

            <div className="flex flex-wrap gap-2 mb-3">
              {REGIONS.map((r) => (
                <Link
                  key={r.slug || 'all'}
                  href={qs(sp, { region: r.slug || undefined })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    (sp.region ?? '') === r.slug
                      ? 'bg-tap text-white'
                      : 'bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-200 hover:bg-ink-100'
                  }`}
                >
                  {r.name}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {SORTS.map((s) => (
                <Link
                  key={s.v}
                  href={qs(sp, { sort: s.v })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    (sp.sort ?? 'new') === s.v
                      ? 'bg-ink-900 dark:bg-white text-white dark:text-ink-900'
                      : 'bg-white dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-100'
                  }`}
                >
                  {s.name}
                </Link>
              ))}
            </div>
            <div className="mb-4">
              <SaveSearchButton filters={sp as Record<string, string>} />
            </div>
            {catAttrs.length > 0 && <CategoryFilters attributes={catAttrs} />}
          </>
        )}

        {items.length === 0 && backendDown ? (
          // Backend əlçatmazdır — bu, "nəticə yoxdur"dan fərqli haldır və
          // istifadəçiyə düzgün mesaj + təkrar cəhd yolu göstərilməlidir.
          <div className="card p-12 text-center">
            <p className="text-ink-900 dark:text-white text-lg font-bold">
              Elanlar müvəqqəti yüklənmir
            </p>
            <p className="text-ink-500 mt-2">
              Xidmətdə qısamüddətli problem var. Bir neçə dəqiqədən sonra yenidən yoxlayın.
            </p>
            <Link href="/elanlar" className="btn-secondary inline-flex mt-4">
              Yenidən cəhd et
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-ink-500 text-lg">
              {sp.q ? 'AI bu sorğuya uyğun elan tapmadı' : 'Bu filtrlə elan tapılmadı'}
            </p>
            <Link href="/elanlar" className="btn-secondary inline-flex mt-4">
              Bütün elanlara bax
            </Link>
          </div>
        ) : sp.q ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {items.map((l) => (
              <ListingCard key={l.id} item={l} />
            ))}
          </div>
        ) : (
          <InfiniteListings initialItems={items} baseQuery={baseQuery} initialHasMore={hasMore} />
        )}
      </div>
    </div>
  );
}
