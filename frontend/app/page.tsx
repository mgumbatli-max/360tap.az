import Link from 'next/link';
import ListingCard, { type Listing } from '@/components/ListingCard';

// SSR: production-da Vercel env API_ORIGIN = Render backend; dev-də lokal NestJS.
const API = process.env.API_ORIGIN
  ? `${process.env.API_ORIGIN}/api/v1`
  : 'http://localhost:5500/api/v1';

async function getJSON(path: string): Promise<{ data?: unknown } | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return (await res.json()) as { data?: unknown };
  } catch {
    return null;
  }
}

type Cat = { id: string; slug: string; nameAz: string; icon?: string | null };

type NestListing = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  priceType: string;
  isVip?: boolean;
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
    is_vip: l.isVip,
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

const CAT_ICONS: Record<string, string> = {
  neqliyyat: '🚗',
  'dasinmaz-emlak': '🏠',
  'is-elanlari': '💼',
  elektronika: '📱',
  'ev-bag': '🛋️',
  'shexsi-esyalar': '👕',
  'usaq-alemi': '🧸',
  heyvanlar: '🐾',
  'tikinti-temir': '🔨',
  'hobbi-asude': '🎯',
  'biznes-avadanliq': '🏢',
  'kend-teserrufati': '🌱',
  xidmetler: '🛠️',
};

export default async function HomePage() {
  const [catRes, listRes] = await Promise.all([
    getJSON('/categories'),
    getJSON('/listings?limit=12'),
  ]);
  const categories = (catRes?.data as Cat[] | undefined) ?? [];
  const listings = ((listRes?.data as NestListing[] | undefined) ?? []).map(mapListing);

  return (
    <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
      {/* Hero — region-first */}
      <section className="bg-gradient-to-br from-tap to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-3xl">
            Azərbaycanda hər şeyi öz regionunda tap
          </h1>
          <p className="mt-4 text-white/90 text-base md:text-lg max-w-2xl">
            Mağazalar, avtomobillər, evlər, iş elanları və xidmətlər — hamısı sənin şəhərində və
            yaxın rayonlarda.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <Link
                key={r.slug}
                href={`/elanlar?region=${r.slug}`}
                className="bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 rounded-full text-sm font-medium transition"
              >
                {r.name}
              </Link>
            ))}
            <Link
              href="/elanlar"
              className="bg-white text-tap hover:bg-white/90 px-4 py-2 rounded-full text-sm font-bold transition"
            >
              Bütün Azərbaycan üzrə →
            </Link>
          </div>
          <div className="mt-4">
            <Link
              href="/ai-elan"
              className="inline-flex items-center gap-2 bg-black/20 hover:bg-black/30 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold transition"
            >
              ✨ AI ilə elan yarat — sözlərlə yaz, AI qursun
            </Link>
          </div>
        </div>
      </section>

      {/* Kateqoriyalar */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-xl md:text-2xl font-extrabold text-ink-900 dark:text-white mb-4">
            Kateqoriyalar
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/elanlar?category=${c.slug}`}
                className="card p-4 text-center hover:border-tap transition"
              >
                <div className="text-3xl mb-2">{CAT_ICONS[c.slug] ?? '📦'}</div>
                <div className="text-xs font-semibold text-ink-800 dark:text-ink-200 leading-tight">
                  {c.nameAz}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Yeni elanlar */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-extrabold text-ink-900 dark:text-white">
            Yeni elanlar
          </h2>
          <Link href="/elanlar" className="text-tap font-semibold text-sm">
            Hamısı →
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-ink-500 text-lg">Hələ elan yoxdur</p>
            <Link href="/elan-yerlesdir" className="btn-tap inline-flex mt-4">
              İlk elanı sən yerləşdir →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {listings.map((l) => (
              <ListingCard key={l.id} item={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
