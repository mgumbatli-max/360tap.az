import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Baby, Briefcase, Building2, Car, Cpu, Drill, Home, Layers, PawPrint, Shirt, Sofa,
  Sparkles, Wrench, Bot, ImageIcon, Scale, Store,
} from 'lucide-react';
import ListingCard, { type Listing } from '@/components/ListingCard';
import CategoryFilters, { type CatAttr } from '@/components/CategoryFilters';
import FilterChips from '@/components/FilterChips';
import InfiniteListings from '@/components/InfiniteListings';
import MapView from '@/components/MapView';
import SaveSearchButton from '@/components/SaveSearchButton';
import ListingsSkeleton from './ListingsSkeleton';
import { meiliSearch, type MeiliHit } from '@/lib/meili';
import CategoryIcon from '@/components/CategoryIcon';
import { serverGet } from '@/lib/server-fetch';
import { buildMetadata } from '@/lib/seo';

/** Header/ana səhifə ilə eyni işçi sahə — sütunlar səhifələr arasında sıçramasın. */
const SHELL = 'mx-auto w-full max-w-[1360px] px-4 md:px-6';

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
  view?: string;
  [key: string]: string | undefined; // a_* atribut filtrləri
}

type NestListing = {
  id: string; title: string; slug: string; price: number | null; currency: string;
  priceType: string; isVip?: boolean; isPremium?: boolean; hasDelivery?: boolean;
  views?: number; favoritesCount?: number; createdAt: string;
  regionName?: string | null; districtName?: string | null;
  images?: { url: string; sortOrder: number }[];
};

/** `/categories` ağacının bizə lazım olan hissəsi (vertikal landinq üçün). */
type CatNode = {
  id: string;
  slug: string;
  nameAz: string;
  listingsCount?: number;
  children?: CatNode[];
};

/**
 * `/search` zərfi `/listings`-dən FƏRQLİDİR: `images[]` yerinə tək `cover`,
 * `createdAt` isə ISO string yox, epoch ms-dir. Ona görə ayrıca tip + mapper —
 * `mapListing`-i təxminlə yenidən istifadə etmək səssiz sıfır-şəkil/NaN-tarix verərdi.
 */
type SearchHit = {
  id: string; title: string; price: number | null; currency: string; priceType: string;
  cover?: string | null; categoryName?: string | null; regionName?: string | null;
  isVip?: boolean; createdAt: number;
};

function mapSearchHit(h: SearchHit): Listing {
  return {
    id: h.id, title: h.title, slug: '', price: h.price ?? null,
    currency: h.currency ?? 'AZN', price_type: h.priceType ?? 'fixed',
    is_vip: h.isVip, created_at: new Date(h.createdAt).toISOString(),
    category_name: h.categoryName ?? undefined,
    city_name: h.regionName ?? undefined,
    media: h.cover ? [{ url: h.cover, sort_order: 0 }] : [],
  };
}

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

/**
 * Vertikal landinqin şüarları — ÖZ mətnlərimizdir (hüquqi sərhəd: heç bir xarici
 * platformanın sloqanı təkrarlanmır). Naməlum kateqoriya üçün generik fallback var.
 */
const CAT_SLOGAN: Record<string, string> = {
  neqliyyat: 'Avtomobil, motosiklet və ehtiyat hissələri — yoxlanılmış satıcılardan',
  'dasinmaz-emlak': 'Mənzil, həyət evi, ofis və torpaq — Azərbaycanın hər yerində',
  'is-elanlari': 'Sənə uyğun vakansiya və namizədlər bir yerdə',
  xidmetler: 'Ustadan tərcüməçiyə qədər — peşəkarlar bir kliklə',
  elektronika: 'Telefon, noutbuk və texnika — yeni və işlənmiş',
  'ev-ve-bag': 'Mebel, məişət texnikası və bağ üçün hər şey',
  geyim: 'Geyim, ayaqqabı və aksesuarlar — hər büdcəyə',
  usaq: 'Uşaq geyimi, oyuncaq və nəqliyyat vasitələri',
  heyvanlar: 'Ev heyvanları və onlara qulluq üçün hər şey',
  biznes: 'Hazır biznes, avadanlıq və kommersiya obyektləri',
  hobby: 'Hobbi, idman və istirahət üçün elanlar',
  ehtiyat: 'Ehtiyat hissələri və aksesuarlar — marka üzrə seç',
};

/** Plitə ikonları — alt kateqoriyalar valideynin ikonunu miras alır (§0: öz ikonlarımız). */
const CAT_ICON: Record<string, typeof Car> = {
  neqliyyat: Car,
  'dasinmaz-emlak': Home,
  'is-elanlari': Briefcase,
  xidmetler: Wrench,
  geyim: Shirt,
  'ev-ve-bag': Sofa,
  ehtiyat: Drill,
  elektronika: Cpu,
  usaq: Baby,
  heyvanlar: PawPrint,
  biznes: Building2,
  hobby: Sparkles,
};

const SERVICES = [
  { href: '/ai-elan', name: 'AI ilə elan yarat', Icon: Bot },
  { href: '/sekille-axtar', name: 'Şəkillə axtar', Icon: ImageIcon },
  { href: '/muqayise', name: 'Müqayisə', Icon: Scale },
  { href: '/biznes', name: 'Biznes üçün', Icon: Store },
];

/** Ağacda kateqoriyanı və valideynini tap (seqment tabları sərhəd hallarında da işləsin). */
function findCategory(
  nodes: CatNode[],
  slug: string,
  parent: CatNode | null = null,
): { node: CatNode; parent: CatNode | null } | null {
  for (const n of nodes) {
    if (n.slug === slug) return { node: n, parent };
    const hit = findCategory(n.children ?? [], slug, n);
    if (hit) return hit;
  }
  return null;
}

/**
 * Vertikal landing SEO-su.
 *
 * `/emlak` və `/neqliyyat` route-ları silindi (indi `next.config.ts` → 308 redirect),
 * amma onların `metadata` ixracı SEO dəyəri daşıyırdı. Həmin başlıq/təsvir/açar sözlər
 * burada — YÖNLƏNDİRMƏNİN HƏDƏFİNDƏ — bərpa olunur, yəni indekslənən səhifə artıq
 * boş meta-refresh səhifəsi yox, real kateqoriya nəticələridir.
 */
const VERTICAL_SEO: Record<string, { title: string; description: string; keywords: string[] }> = {
  'dasinmaz-emlak': {
    title: 'Daşınmaz əmlak — Alqı, Kirayə, Yeni tikili',
    description:
      'Bakı və regionlarda mənzil, həyət evi, ofis, qaraj, torpaq elanları. 360tap.az',
    keywords: ['daşınmaz əmlak', 'mənzil', 'kirayə', 'yeni tikili', 'həyət evi', 'ofis', 'bakı'],
  },
  neqliyyat: {
    title: 'Nəqliyyat — Avtomobil alqı-satqı, kredit, barter',
    description:
      'Bakı və Azərbaycanda avtomobil elanları. Marka, model üzrə axtarış, kredit, barter. 360tap.az',
    keywords: ['avtomobil', 'maşın', 'nəqliyyat', 'bmw', 'mercedes', 'toyota', 'kredit', 'barter'],
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;

  if (sp.category && VERTICAL_SEO[sp.category]) {
    const v = VERTICAL_SEO[sp.category];
    return buildMetadata({ ...v, path: `/elanlar?category=${sp.category}` });
  }
  if (sp.q) {
    // Axtarış nəticələri indekslənməməlidir (sonsuz sayda dublikat URL).
    return buildMetadata({
      title: `«${sp.q}» üzrə axtarış nəticələri`,
      path: '/elanlar',
      noindex: true,
    });
  }
  return buildMetadata({
    title: 'Bütün elanlar — Azərbaycan üzrə alqı-satqı',
    description:
      'Azərbaycanın bütün regionlarından elanlar: avtomobil, daşınmaz əmlak, elektronika, iş və xidmətlər. 360tap.az',
    path: '/elanlar',
  });
}

/**
 * Route-un giriş nöqtəsi: SÜRƏTLİ SHELL.
 *
 * `searchParams` promise-i AWAIT EDİLMİR — burada heç nə gözlənilmir, ona görə
 * shell dərhal flush olunur və istifadəçi ani skeleton görür (əvvəl bunu
 * `app/elanlar/loading.tsx` edirdi). Fərq: bu Suspense sərhədi route seqmentinin
 * ÜZƏRİNDƏ deyil, İÇİNDƏDİR — yəni `/elanlar/[id]` alt route-una MİRAS QALMIR,
 * və orada `notFound()` artıq real HTTP 404 qaytara bilir.
 */
export default function ListingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <Suspense fallback={<ListingsSkeleton />}>
      <ListingsResults searchParams={searchParams} />
    </Suspense>
  );
}

async function ListingsResults({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  let items: Listing[] = [];
  let total = 0;
  let hasMore = false;
  let baseQuery = ''; // client sonsuz scroll üçün API sorğusu (page/limit-siz)
  // Axtarış budağında sonsuz scroll üçün sorğu — YALNIZ nəticələr səhifələnə bilən
  // `/search` mənbəyindən gəldikdə dolur (Meili/AI cavabları səhifələnmir).
  let searchQuery = '';
  let catAttrs: CatAttr[] = [];
  let catName = ''; // backend meta-dan kateqoriya adı (h1)
  let catTree: CatNode[] = []; // vertikal landinq: seqment tabları + plitələr
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
    // İlk batch browse budağı ilə eyni ölçüdə (50) — əvvəl 24 idi və nəticə sayı
    // ondan çox olanda qalanına heç bir yol qalmırdı.
    const SEARCH_LIMIT = 50;

    const hits = await meiliSearch(sp.q, SEARCH_LIMIT, Math.min(4_000, left()));
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
    // Fallback: AI heç nə tapmadısa — `/search`.
    //
    // ƏVVƏL burada `/listings?q=` çağırılırdı, yəni XAM mətn uyğunluğu: "mashin",
    // "menzil", "kiraye" kimi latın yazılışlar 0 nəticə verirdi, halbuki backend-də
    // transliterasiya (search.service.ts → TRANSLIT + understand()) ARTIQ VAR — sadəcə
    // frontend həmin endpoint-i heç vaxt çağırmırdı. `/search` sorğunu normallaşdırır
    // (mashin→maşın) və səhifələnir, ona görə keyword fallback ora yönləndirildi.
    if (items.length === 0) {
      searchQuery = `q=${encodeURIComponent(sp.q)}`;
      const kw = await serverGet<SearchHit[], { total: number; degraded?: boolean }>(
        `/search?${searchQuery}&page=1&limit=${SEARCH_LIMIT}`,
        { cache: 'no-store', timeoutMs: Math.max(2_000, Math.min(4_000, left())) },
      );
      if (kw.data) {
        items = kw.data.map(mapSearchHit);
        total = kw.meta?.total ?? items.length;
        // `/search` meta-da `hasMore` yoxdur → total-dan hesablanır.
        // `meta.degraded` (Meili ölü, Postgres fallback) NORMAL cavabdır — nəticələr
        // etibarlıdır, ona görə xəta/“tapılmadı” kimi qiymətləndirilmir.
        hasMore = total > items.length;
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
    // Listings, kateqoriya atributları VƏ kateqoriya ağacını PARALEL çək (waterfall yox).
    // Hər üçü timeout-ludur: backend asılı qalsa da render bir neçə saniyəyə tamamlanır.
    // Ağac yalnız vertikal landinqdə lazımdır (tablar/plitələr) — filtrsiz siyahıda yox.
    const [listD, attrD, treeD] = await Promise.all([
      serverGet<NestListing[], { total: number; hasMore: boolean; categoryName?: string }>(
        `/listings?${params}`,
        { next: { revalidate: 30 } },
      ),
      sp.category
        ? serverGet<CatAttr[]>(`/categories/${sp.category}/attributes`, {
            next: { revalidate: 600 },
          })
        : Promise.resolve({ data: null, meta: null, unavailable: false }),
      sp.category
        ? serverGet<CatNode[]>('/categories', { next: { revalidate: 300 } })
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
    if (treeD.data) catTree = treeD.data;
  }

  const uChips = understanding
    ? Object.entries(understanding).filter(([, v]) => v != null && v !== '')
    : [];

  // ——— Vertikal landinq konteksti ———
  const isVertical = Boolean(sp.category) && !sp.q;
  const found = sp.category ? findCategory(catTree, sp.category) : null;
  const heading = found?.node.nameAz || catName || (sp.category ?? '').replace(/-/g, ' ');
  const regionName = sp.region
    ? REGIONS.find((r) => r.slug === sp.region)?.name ?? sp.region
    : '';
  // Seqment tabları: alt kateqoriyalar; yarpaq kateqoriyadasınsa QARDAŞLAR göstərilir,
  // yəni bir səviyyə aşağı düşəndə naviqasiya itmir (Avito vertikal modeli).
  const segParent = (found?.node.children?.length ? found.node : found?.parent) ?? null;
  const segments = segParent?.children ?? [];
  const tiles = found?.node.children ?? [];
  const tileIcon =
    CAT_ICON[sp.category ?? ''] ?? CAT_ICON[found?.parent?.slug ?? ''] ?? Layers;
  const slogan =
    CAT_SLOGAN[sp.category ?? ''] ??
    (heading ? `${heading} üzrə bütün elanlar — axtar, müqayisə et, əlaqə saxla` : '');

  // Çiplər yalnız SİLİNƏ BİLƏN filtrlərdən ibarətdir: kateqoriya/axtarış səhifənin
  // kimliyidir (H1 + tablarda görünür), `sort`/`view` isə görünüş parametridir.
  const chipFilters: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (!v || k === 'q' || k === 'category' || k === 'vertical') continue;
    if (k === 'region' || k === 'priceMin' || k === 'priceMax' || k.startsWith('a_')) {
      chipFilters[k] = v;
    }
  }
  const attrLabels = Object.fromEntries(catAttrs.map((a) => [a.key, a.labelAz]));
  const regionLabels = Object.fromEntries(REGIONS.filter((r) => r.slug).map((r) => [r.slug, r.name]));

  /** Seqment/tab keçidi: atribut filtrləri kateqoriyaya bağlıdır → yeni tabda sıfırlanır. */
  const segHref = (slug: string): string => {
    const p = new URLSearchParams();
    if (slug) p.set('category', slug);
    if (sp.region) p.set('region', sp.region);
    if (sp.sort) p.set('sort', sp.sort);
    if (sp.priceMin) p.set('priceMin', sp.priceMin);
    if (sp.priceMax) p.set('priceMax', sp.priceMax);
    const s = p.toString();
    return s ? `/elanlar?${s}` : '/elanlar';
  };

  // `view=map` yalnız GÖRÜNÜŞ açarıdır — data eyni sorğudan gəlir, ona görə
  // xəritəyə keçid heç bir əlavə fetch tələb etmir.
  const isMap = sp.view === 'map' && !sp.q;

  return (
    <div className="min-h-screen bg-white dark:bg-ink-900">
      <div className={`${SHELL} py-6 md:py-8`}>
        {sp.q ? (
          <>
            <h1 className="mb-1 text-2xl font-extrabold text-ink-900 dark:text-white md:text-[32px]">
              «{sp.q}»
            </h1>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-sm font-bold text-tap">
                🤖 AI axtarışı
              </span>
              {uChips.map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-full border border-tap/20 bg-tap-50 px-2.5 py-1 text-xs font-medium text-ink-700 dark:bg-ink-800 dark:text-ink-200"
                >
                  {U_LABELS[k] ?? ''} {String(v)}
                </span>
              ))}
            </div>
            <p className="mb-5 text-sm text-ink-500">{total} nəticə tapıldı</p>
          </>
        ) : isVertical ? (
          <>
            {/* ——— §8.1 mərkəzləşmiş böyük H1 + şüar ——— */}
            <header className="mx-auto mb-6 max-w-3xl text-center md:mb-8">
              <h1 className="text-[28px] font-extrabold leading-[1.1] tracking-tight text-ink-900 dark:text-white md:text-[44px]">
                {heading}
                {regionName && <span className="font-extrabold text-ink-400"> — {regionName}</span>}
                {total > 0 && (
                  <span className="ml-2.5 whitespace-nowrap font-extrabold text-ink-400">
                    {total.toLocaleString('az-AZ')}
                  </span>
                )}
              </h1>
              {slogan && (
                <p className="mt-3 text-sm text-ink-500 dark:text-ink-400 md:text-base">{slogan}</p>
              )}
            </header>

            {/* ——— §8.2 seqment tabları (alt-vertikallar) ——— */}
            {segments.length > 0 && segParent && (
              <nav aria-label="Alt bölmələr" className="mb-5 flex md:justify-center">
                <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-ink-100 p-1 dark:bg-ink-800">
                  <SegmentTab
                    href={segHref(segParent.slug)}
                    active={sp.category === segParent.slug}
                    label="Hamısı"
                  />
                  {segments.map((c) => (
                    <SegmentTab
                      key={c.id}
                      href={segHref(c.slug)}
                      active={sp.category === c.slug}
                      label={c.nameAz}
                    />
                  ))}
                </div>
              </nav>
            )}
          </>
        ) : (
          <header className="mb-5">
            <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white md:text-[32px]">
              Bütün elanlar
              {regionName && <span className="text-ink-400"> — {regionName}</span>}
              {total > 0 && (
                <span className="ml-2.5 font-extrabold text-ink-400">
                  {total.toLocaleString('az-AZ')}
                </span>
              )}
            </h1>
          </header>
        )}

        {/* ——— §8.3 üfüqi filtr paneli + silinə bilən çiplər ——— */}
        {!sp.q && (
          <>
            <CategoryFilters
              attributes={catAttrs}
              regions={REGIONS}
              sorts={SORTS}
              total={total}
            />
            <FilterChips
              filters={chipFilters}
              keyLabels={attrLabels}
              valueLabels={{ region: regionLabels }}
            />
          </>
        )}

        {/* ——— §8.4 kateqoriya plitələri + servislər ——— */}
        {isVertical && tiles.length > 0 && (
          <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_300px]">
            <section>
              <h2 className="mb-3 text-[22px] font-bold text-ink-900 dark:text-white">
                Kateqoriyalar
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {tiles.map((c) => {
                  return (
                    <Link
                      key={c.id}
                      href={segHref(c.slug)}
                      className="relative flex h-[120px] flex-col overflow-hidden rounded-2xl bg-ink-100 p-4 transition hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700"
                    >
                      <span className="relative z-10 line-clamp-2 pr-12 text-[15px] font-semibold leading-tight text-ink-900 dark:text-white">
                        {c.nameAz}
                      </span>
                      {typeof c.listingsCount === 'number' && c.listingsCount > 0 && (
                        <span className="relative z-10 mt-1 text-[13px] text-ink-400">
                          {c.listingsCount.toLocaleString('az-AZ')}
                        </span>
                      )}
                      {/* Vahid ikon sistemi — hər alt-kateqoriyanın ÖZ qlifi var.
                          Əvvəl naməlum slug valideynin ikonuna düşürdü, ona görə
                          «Su nəqliyyatı», «Təkərlər», «Ehtiyat hissələri» — hamısı
                          eyni maşın ikonu göstərirdi. */}
                      <span className="absolute bottom-3 right-3">
                        <CategoryIcon slug={c.slug} name={c.nameAz} size="lg" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-[22px] font-bold text-ink-900 dark:text-white">Servislər</h2>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-tap-50 p-3 lg:grid-cols-1">
                {SERVICES.map(({ href, name, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-ink-800 transition hover:text-tap dark:text-ink-200"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-tap" aria-hidden="true" />
                    <span className="truncate">{name}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ——— §8.5 «Ən yenilər» ——— */}
        {!sp.q && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[22px] font-bold text-ink-900 dark:text-white">
              {isMap ? 'Xəritədə' : 'Ən yenilər'}
            </h2>
            <SaveSearchButton filters={sp as Record<string, string>} />
          </div>
        )}

        <div id="netice" className="scroll-mt-24">
          {items.length === 0 && backendDown ? (
            // Backend əlçatmazdır — bu, "nəticə yoxdur"dan fərqli haldır və
            // istifadəçiyə düzgün mesaj + təkrar cəhd yolu göstərilməlidir.
            <div className="rounded-2xl bg-ink-100 p-12 text-center dark:bg-ink-800">
              <p className="text-lg font-bold text-ink-900 dark:text-white">
                Elanlar müvəqqəti yüklənmir
              </p>
              <p className="mt-2 text-ink-500">
                Xidmətdə qısamüddətli problem var. Bir neçə dəqiqədən sonra yenidən yoxlayın.
              </p>
              <Link href="/elanlar" className="btn-secondary mt-4 inline-flex">
                Yenidən cəhd et
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-ink-100 p-12 text-center dark:bg-ink-800">
              <p className="text-lg text-ink-500">
                {sp.q ? 'AI bu sorğuya uyğun elan tapmadı' : 'Bu filtrlə elan tapılmadı'}
              </p>
              <Link href="/elanlar" className="btn-secondary mt-4 inline-flex">
                Bütün elanlara bax
              </Link>
            </div>
          ) : isMap ? (
            <MapView listings={items} />
          ) : sp.q ? (
            searchQuery ? (
              // Axtarış nəticələri də səhifələnir: əvvəl bu budaq sadə grid idi və
              // meta.total 64 olsa belə yalnız ilk batch görünürdü, "daha çox" yolu yox idi.
              <InfiniteListings
                key={searchQuery}
                initialItems={items}
                baseQuery={searchQuery}
                initialHasMore={hasMore}
                endpoint="/api/search"
              />
            ) : (
              // Meili/AI cavabları səhifələnən mənbə deyil (ranking bir dəfəlikdir),
              // ona görə onlar sadə grid kimi qalır — yanlış "daha çox" vədi verilmir.
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((l) => (
                  <ListingCard key={l.id} item={l} />
                ))}
              </div>
            )
          ) : (
            // `key` = filtr imzası: filtr dəyişəndə komponent REMOUNT olunur, yəni
            // `useState(initialItems)` yenidən oxunur (komponent daxilindəki sıfırlama
            // effekti ilə birlikdə ikiqat zəmanət).
            <InfiniteListings
              key={baseQuery}
              initialItems={items}
              baseQuery={baseQuery}
              initialHasMore={hasMore}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Pill tab — aktiv olan ağ fonlu (§8.2). */
function SegmentTab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border border-ink-200 bg-white text-ink-900 dark:border-ink-700 dark:text-white'
          : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white'
      }`}
    >
      {label}
    </Link>
  );
}
