import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import { buildMetadata, jsonLdItemList, jsonLdScript } from '@/lib/seo';

const API = 'http://localhost:5400';

async function getCity(slug: string) {
  const r = await fetch(`${API}/api/cities`, { cache: 'no-store' });
  if (!r.ok) return null;
  const d = await r.json();
  return (d.cities || []).find((c: any) => c.slug === slug);
}
async function getListings(citySlug: string) {
  const r = await fetch(`${API}/api/listings?city=${citySlug}&limit=24`, { cache: 'no-store' });
  if (!r.ok) return { items: [], total: 0 };
  return r.json();
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const c = await getCity(city);
  if (!c) return buildMetadata({ title: 'Tapılmadı', noindex: true });

  const data = await getListings(city);
  return buildMetadata({
    title: `${c.name_az}da elanlar — alqı-satqı, kirayə, iş`,
    description: `${c.name_az} şəhərində ${data.total ?? 0} aktiv elan. Avtomobil, mənzil, telefon, iş və xidmət — pulsuz axtar.`,
    path: `/seher/${city}`,
    keywords: [`${c.name_az} elanları`, `${c.name_az} satılır`, `${c.name_az} kirayə`, `${c.name_az} alqı-satqı`],
  });
}

const POPULAR_CATS = [
  { slug: 'avtomobil', name: 'Avtomobil', emoji: '🚗' },
  { slug: 'menzil-satilir', name: 'Mənzil satılır', emoji: '🏠' },
  { slug: 'menzil-kiraye', name: 'Mənzil kirayə', emoji: '🏘' },
  { slug: 'telefon', name: 'Telefon', emoji: '📱' },
  { slug: 'noutbuk', name: 'Noutbuk', emoji: '💻' },
  { slug: 'is-elanlari', name: 'İş elanları', emoji: '💼' },
  { slug: 'xidmetler', name: 'Xidmətlər', emoji: '🛠' },
  { slug: 'ev-ve-bag', name: 'Ev və bağ', emoji: '🛋' },
];

export default async function CityLandingPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const c = await getCity(city);
  if (!c) notFound();

  const { items, total } = await getListings(city);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ name: 'Şəhərlər' }, { name: c.name_az }]} />

      <header className="mt-4 mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900 mb-2">
          {c.name_az}da elanlar — {total.toLocaleString('az-AZ')} aktiv elan
        </h1>
        <p className="text-ink-600">
          Avtomobil, mənzil, telefon, iş, xidmət — {c.name_az} şəhəri üzrə bütün kateqoriyalarda elanlar tapın.
        </p>
      </header>

      {/* Populyar kateqoriyalar bu şəhər üzrə */}
      <section className="mb-6">
        <h2 className="font-bold text-xl mb-3">Populyar kateqoriyalar — {c.name_az}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {POPULAR_CATS.map((cat) => (
            <Link key={cat.slug} href={`/seher/${city}/${cat.slug}`}
              className="card p-4 text-center hover:border-tap transition">
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <div className="font-semibold">{cat.name}</div>
              <div className="text-xs text-ink-500 mt-0.5">{c.name_az}</div>
            </Link>
          ))}
        </div>
      </section>

      <h2 className="font-bold text-xl mb-3">Son elanlar — {c.name_az}</h2>
      {items.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">Bu şəhərdə hələ elan yoxdur.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it: any) => (
            <Link key={it.id} href={`/elanlar/${it.id}`} className="card p-2 group">
              <div className="aspect-square bg-ink-100 rounded-lg overflow-hidden mb-2">
                {it.media?.[0]?.url && <img src={it.media[0].url} alt={it.title} className="w-full h-full object-cover group-hover:scale-105 transition" />}
              </div>
              <div className="font-bold text-base">
                {it.price ? `${Number(it.price).toLocaleString('az-AZ')} ${it.currency}` : 'Razılaşma'}
              </div>
              <div className="text-sm text-ink-600 line-clamp-2 mt-0.5 leading-tight">{it.title}</div>
            </Link>
          ))}
        </div>
      )}

      <script type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLdItemList(items.map((i: any) => ({ id: i.id, title: i.title }))))}
      />
    </div>
  );
}
