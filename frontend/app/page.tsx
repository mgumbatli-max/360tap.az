import { Suspense } from 'react';
import Link from 'next/link';
import { Sparkles, Boxes, Store, Megaphone } from 'lucide-react';
import ListingCard, { type Listing } from '@/components/ListingCard';
import CategoryTiles, { type CategoryTile } from '@/components/CategoryTiles';
import { serverGet } from '@/lib/server-fetch';
import { buildMetadata } from '@/lib/seo';

/**
 * SEO — ANA SƏHİFƏNİN ÖZ METADATA-SI.
 *
 * Root layout-dan mütləq `canonical` silindi (o, miras yolu ilə HƏR səhifəyə düşür və
 * bütün elanları ana səhifənin dublikatı elan edirdi). Silinmə ana səhifəni də
 * canonical-sız qoyurdu — indeksləşdirmədə ən vacib səhifə məhz budur, ona görə
 * burada öz self-referencing canonical-ı ilə bərpa olunur.
 */
export const metadata = buildMetadata({
  title: 'Azərbaycanda elanlar — avtomobil, ev, iş, xidmət',
  description:
    'Azərbaycanın bütün regionlarından elanlar: avtomobil, daşınmaz əmlak, elektronika, iş və xidmətlər. Pulsuz elan yerləşdir — 360tap.az',
  path: '/',
});

type Cat = { id: string; slug: string; nameAz: string; icon?: string | null };

type NestListing = {
  id: string;
  title: string;
  slug: string;
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
  regionName?: string | null;
  districtName?: string | null;
  images?: { url: string; sortOrder: number }[];
};

function mapListing(l: NestListing): Listing {
  return {
    id: l.id,
    title: l.title,
    slug: l.slug,
    price: l.price ?? null,
    currency: l.currency ?? 'AZN',
    price_type: l.priceType ?? 'fixed',
    is_vip: l.isVip, is_demo: l.isDemo,
    is_premium: l.isPremium,
    has_delivery: l.hasDelivery,
    views: l.views,
    favorites_count: l.favoritesCount,
    created_at: l.createdAt,
    city_name: l.regionName ?? undefined,
    district: l.districtName ?? undefined,
    media: (l.images ?? []).map((i) => ({ url: i.url, sort_order: i.sortOrder ?? 0 })),
  };
}

const REGIONS = [
  { slug: 'baki', name: 'Bakı' },
  { slug: 'sumqayit', name: 'Sumqayıt' },
  { slug: 'gence', name: 'Gəncə' },
  { slug: 'qebele', name: 'Qəbələ' },
  { slug: 'quba', name: 'Quba' },
  { slug: 'lenkeran', name: 'Lənkəran' },
  { slug: 'seki', name: 'Şəki' },
  { slug: 'mingecevir', name: 'Mingəçevir' },
];

/**
 * Kateqoriya plitələri Avito modelində səhifənin ƏSAS naviqasiyasıdır — backend
 * düşəndə boş sahə qalmamalıdır. Ona görə `/categories` cavabı boş gələrsə bu
 * statik kök siyahı işlədilir (slug-lar backend seed-i ilə eynidir, ona görə
 * keçidlər backend qayıdan kimi də düzgün işləyir).
 */
const FALLBACK_CATEGORIES: CategoryTile[] = [
  { id: 'f-neqliyyat', slug: 'neqliyyat', nameAz: 'Nəqliyyat' },
  { id: 'f-emlak', slug: 'dasinmaz-emlak', nameAz: 'Daşınmaz əmlak' },
  { id: 'f-is', slug: 'is-elanlari', nameAz: 'İş elanları' },
  { id: 'f-elektronika', slug: 'elektronika', nameAz: 'Elektronika' },
  { id: 'f-ev-bag', slug: 'ev-bag', nameAz: 'Ev və bağ' },
  { id: 'f-shexsi', slug: 'shexsi-esyalar', nameAz: 'Şəxsi əşyalar' },
  { id: 'f-usaq', slug: 'usaq-alemi', nameAz: 'Uşaq aləmi' },
  { id: 'f-heyvan', slug: 'heyvanlar', nameAz: 'Heyvanlar' },
  { id: 'f-tikinti', slug: 'tikinti-temir', nameAz: 'Tikinti və təmir' },
  { id: 'f-xidmet', slug: 'xidmetler', nameAz: 'Xidmətlər' },
];

/** «Biznes üçün» panelinin mini plitələri (§5.1) — hamısı mövcud route-lara gedir. */
const BUSINESS_TILES = [
  { href: '/elanlar?category=biznes-avadanliq', label: 'Avadanlıq', Icon: Boxes },
  { href: '/elanlar?category=dasinmaz-emlak', label: 'Yer', Icon: Store },
  { href: '/elanlar', label: 'Mallar', Icon: Megaphone },
];

/** Spesifikasiya §1 — Avito işçi sahəsi 1360 px. */
const SHELL = 'mx-auto w-full max-w-[1360px] px-4 md:px-6';

/**
 * Səth sinifləri — NİYƏ CSS dəyişəni ilə, `bg-ink-*` tokeni ilə yox (§12):
 * 1) `globals.css` qaranlıq rejimdə `.dark .bg-ink-50/100/200/white` üçün `!important`
 *    override-lar saxlayır — həmin tokenlərdə `dark:` variantı heç vaxt tutmur;
 * 2) `layout.tsx`-dəki `main` fonu qaranlıqda `--bg-section`-ə bərabərdir, ona görə
 *    bölmə səthi qaranlıqda bir pillə yuxarı (`--bg-muted`) götürülür ki, itməsin.
 */
const SURFACE = 'bg-[var(--bg-section)] dark:bg-[var(--bg-muted)]';
const SURFACE_HOVER = 'hover:bg-ink-200 dark:hover:bg-ink-700';

/**
 * Ana səhifə — SÜRƏTLİ SHELL + STREAMING FEED.
 *
 * ƏVVƏL: bütün səhifə `await`-lə bloklanırdı, ani skeleton-u isə root `app/loading.tsx`
 * verirdi. Həmin root `loading.tsx` bütün app ağacının ÜZƏRİNDƏ Suspense sərhədi idi və
 * shell-i (HTTP status + başlıqlarla birlikdə) hər route üçün data gəlməmişdən əvvəl
 * flush edirdi — buna görə `/elanlar/[id]` 404 əvəzinə 200 (soft-404), `/k/[category]`
 * isə 307 əvəzinə 200 + meta-refresh qaytarırdı.
 *
 * İNDİ: hero dərhal render olunur (heç bir data asılılığı yoxdur), data asılı hissə isə
 * BU SƏHİFƏNİN İÇİNDƏKİ Suspense sərhədində stream olunur. UX eyni (hətta daha yaxşı —
 * hero ani görünür), sərhəd isə başqa route-lara sızmır.
 *
 * Fon sinfi qəsdən verilmir: §1-ə görə səhifə fonu ən açıq səthdir və onu
 * `layout.tsx`-dəki `main` (`bg-ink-50`) verir. Burada təkrar fon qoysaq
 * plitələrlə səhifə arasındakı yeganə ayırıcı olan ton fərqi itərdi.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HomeHero />
      <Suspense fallback={<HomeFeedSkeleton />}>
        <HomeFeed />
      </Suspense>
    </div>
  );
}

/**
 * Region keçidləri — Avito-da belə bir zolaq YOXDUR, amma region-first bizim əsas
 * fərqimizdir, ona görə köhnə qradiyentli hero-dan yeganə saxlanan hissədir və
 * plitələrin üstündə yığcam pill sətrinə çevrilib.
 *
 * Data asılılığı olmadığından Suspense-dən KƏNARDA qalır (ani render).
 */
function HomeHero() {
  return (
    <section className={`${SHELL} pb-2 pt-4 md:pt-5`}>
      {/* `flex-wrap` — mobil eni daralanda sətir qırılır, üfüqi sürüşmə yaranmır (§11). */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/elanlar"
          className="inline-flex h-9 items-center rounded-full bg-tap px-4 text-[13px] font-semibold text-white transition-colors hover:bg-tap-600"
        >
          Bütün Azərbaycan
        </Link>

        {REGIONS.map((r) => (
          <Link
            key={r.slug}
            href={`/elanlar?region=${r.slug}`}
            className={`inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium text-ink-700 transition-colors ${SURFACE} ${SURFACE_HOVER}`}
          >
            {r.name}
          </Link>
        ))}

        <Link
          href="/ai-elan"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-tap-50 px-4 text-[13px] font-semibold text-tap-700 transition-colors hover:bg-tap-100 dark:hover:bg-tap-800"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          AI ilə elan yarat
        </Link>
      </div>
    </section>
  );
}

/** Kateqoriya plitələri + elan lenti gələnə qədər göstərilən skeleton (eyni düzüm). */
function HomeFeedSkeleton() {
  return (
    <div className="animate-pulse">
      <section className={`${SHELL} py-6 md:py-8`}>
        <div className="grid gap-4 lg:grid-cols-[1fr_296px]">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`h-[120px] rounded-2xl ${SURFACE}`} />
            ))}
          </div>
          <div className={`h-[120px] rounded-2xl lg:h-auto ${SURFACE}`} />
        </div>
      </section>
      <section className={`${SHELL} pb-12`}>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <div className={`aspect-[4/3] rounded-xl ${SURFACE}`} />
              <div className={`mt-2 h-4 w-3/4 rounded ${SURFACE}`} />
              <div className={`mt-2 h-4 w-1/2 rounded ${SURFACE}`} />
              <div className={`mt-2 h-3 w-2/3 rounded ${SURFACE}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** «Biznes üçün» paneli — plitə şəbəkəsinin sağında, eyni fon və radiusla (§5.1). */
function BusinessPanel() {
  return (
    <aside className={`rounded-2xl p-4 ${SURFACE}`}>
      <h2 className="text-[17px] font-bold leading-tight text-ink-900">Biznes üçün</h2>
      <p className="mt-1 text-[13px] leading-snug text-ink-500">
        Mağazanı 360tap-da aç, elanlarını topluca idarə et.
      </p>

      {/*
        Mini plitə fonu panelin fonundan bir pillə AYRILIR: işıqlıda kart ağı
        (`--bg-card`), qaranlıqda isə səhifə fonu (`--bg`) — qaranlıqda `bg-white`
        `--bg-card`-a çevrildiyindən panelin fonu ilə eyniləşib itirdi.
      */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {BUSINESS_TILES.map(({ href, label, Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl bg-[var(--bg-card)] px-1 text-center transition-colors hover:bg-ink-200 dark:bg-[var(--bg)] dark:hover:bg-ink-800"
          >
            <Icon className="h-5 w-5 text-tap-700" aria-hidden="true" strokeWidth={1.75} />
            <span className="text-[12px] font-semibold leading-tight text-ink-800">{label}</span>
          </Link>
        ))}
      </div>

      <Link
        href="/biznes"
        className="mt-4 inline-flex h-10 items-center rounded-full bg-tap px-5 text-[13px] font-semibold text-white transition-colors hover:bg-tap-600"
      >
        Biznes hesabı aç
      </Link>
    </aside>
  );
}

async function HomeFeed() {
  // Hər ikisi timeout-lu və xəta udan (serverGet heç vaxt throw etmir) →
  // backend düşəndə səhifə asılı qalmır, dərhal fallback ilə render olunur.
  const [catRes, listRes] = await Promise.all([
    serverGet<Cat[]>('/categories', { next: { revalidate: 300 } }),
    serverGet<NestListing[]>('/listings?limit=12', { next: { revalidate: 30 } }),
  ]);
  const categories = catRes.data ?? [];
  const listings = (listRes.data ?? []).map(mapListing);
  // Backend əlçatmazdır (timeout/şəbəkə/5xx) — "elan yoxdur"dan fərqli haldır.
  const backendDown = listRes.unavailable && catRes.unavailable;
  const tiles: CategoryTile[] = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <>
      {/* §5.1 — plitə şəbəkəsi (5×2 lg) + sağda «Biznes üçün» paneli */}
      <section className={`${SHELL} py-6 md:py-8`}>
        <h1 className="sr-only">360tap.az — Azərbaycanda elanlar</h1>
        <div className="grid gap-4 lg:grid-cols-[1fr_296px]">
          <CategoryTiles categories={tiles} />
          <BusinessPanel />
        </div>
      </section>

      {/* §5.2 — plitələrdən sonra BAŞLIQSIZ elan lenti */}
      <section className={`${SHELL} pb-12`}>
        {backendDown ? (
          <div className={`rounded-2xl p-10 text-center ${SURFACE}`}>
            <p className="text-lg font-bold text-ink-900">Elanlar müvəqqəti yüklənmir</p>
            <p className="mt-2 text-ink-500">
              Xidmətdə qısamüddətli problem var. Bir neçə dəqiqədən sonra yenidən yoxlayın.
            </p>
            <Link href="/elanlar" className="btn-secondary mt-4 inline-flex">
              Yenidən cəhd et
            </Link>
          </div>
        ) : listings.length === 0 ? (
          <div className={`rounded-2xl p-10 text-center ${SURFACE}`}>
            <p className="text-lg text-ink-500">Hələ elan yoxdur</p>
            <Link href="/elan-yerlesdir" className="btn-tap mt-4 inline-flex">
              İlk elanı sən yerləşdir →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {listings.map((l) => (
                <ListingCard key={l.id} item={l} />
              ))}
            </div>
            {/*
              Bölmə başlığı §5.2-yə görə silindi, amma «hamısına keç» keçidi
              funksionallıqdır — lentin altına, mərkəzə köçürüldü.
            */}
            <div className="mt-8 text-center">
              <Link href="/elanlar" className="btn-secondary inline-flex">
                Bütün elanlar →
              </Link>
            </div>
          </>
        )}
      </section>
    </>
  );
}
