import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import CityCategoryFilterClient from './CityCategoryFilterClient';
import { buildMetadata, jsonLdItemList, jsonLdScript } from '@/lib/seo';

const API = 'http://localhost:5400';

async function fetchAll(citySlug: string, catSlug: string) {
  const [cats, cities, list] = await Promise.all([
    fetch(`${API}/api/categories/${catSlug}`, { cache: 'no-store' }),
    fetch(`${API}/api/cities`, { cache: 'no-store' }),
    fetch(`${API}/api/listings?city=${citySlug}&category=${catSlug}&limit=24`, { cache: 'no-store' }),
  ]);
  const cat = cats.ok ? (await cats.json()).category : null;
  const allCities = cities.ok ? (await cities.json()).cities : [];
  const city = allCities.find((c: any) => c.slug === citySlug);
  const data = list.ok ? await list.json() : { items: [], total: 0 };
  return { cat, city, data };
}

export async function generateMetadata({ params }: { params: Promise<{ city: string; category: string }> }): Promise<Metadata> {
  const { city, category } = await params;
  const { cat, city: c, data } = await fetchAll(city, category);
  if (!cat || !c) return buildMetadata({ title: 'Tapılmadı', noindex: true });

  return buildMetadata({
    title: `${c.name_az}da ${cat.name_az} — ${data.total} elan`,
    description: `${c.name_az} şəhəri ${cat.name_az.toLowerCase()} kateqoriyasında ${data.total} aktiv elan. Pulsuz axtarış, satıcı ilə birbaşa əlaqə.`,
    path: `/seher/${city}/${category}`,
    keywords: [
      `${c.name_az} ${cat.name_az.toLowerCase()}`,
      `${cat.name_az} ${c.name_az}`,
      `${c.name_az} ${cat.name_az.toLowerCase()} satılır`,
    ],
  });
}

export default async function CityCategoryLanding({ params }: { params: Promise<{ city: string; category: string }> }) {
  const { city, category } = await params;
  const { cat, city: c, data } = await fetchAll(city, category);
  if (!cat || !c) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumb items={[
        { name: 'Şəhərlər' },
        { name: c.name_az, url: `/seher/${city}` },
        { name: cat.name_az },
      ]} />

      <header className="mt-4 mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900 mb-2">
          {c.name_az}da {cat.name_az.toLowerCase()} elanları
        </h1>
        <p className="text-ink-600">
          {data.total.toLocaleString('az-AZ')} elan tapıldı. Filterlə daralt, qiymət üzrə sırala, satıcı ilə birbaşa əlaqə saxla.
        </p>
      </header>

      {/* Universal yatay filter bar — avito stil */}
      <CityCategoryFilterClient city={city} category={category} />

      {/* Listings */}
      {data.items.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">
          Bu meyarlara uyğun elan yoxdur.
          <Link href="/elan-yerlesdir" className="block mt-3 text-tap hover:underline">İlk elanı sən yerləşdir →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {data.items.map((it: any) => (
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

      <Link href={`/elanlar?city=${city}&category=${category}`} className="btn-tap inline-flex">
        Bütün filtrləri aç →
      </Link>

      <script type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLdItemList(data.items.map((i: any) => ({ id: i.id, title: i.title }))))}
      />
    </div>
  );
}
