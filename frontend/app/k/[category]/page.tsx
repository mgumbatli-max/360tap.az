import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import CategoryFilterClient from './CategoryFilterClient';
import { buildMetadata, jsonLdItemList, jsonLdScript, SITE } from '@/lib/seo';

const API = 'http://localhost:5400';

async function getCategory(slug: string) {
  const r = await fetch(`${API}/api/categories/${slug}`, { cache: 'no-store' });
  if (!r.ok) return null;
  return (await r.json()).category;
}
async function getListings(slug: string, limit = 24) {
  const r = await fetch(`${API}/api/listings?category=${slug}&limit=${limit}`, { cache: 'no-store' });
  if (!r.ok) return { items: [], total: 0 };
  return r.json();
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategory(category);
  if (!cat) return buildMetadata({ title: 'Tapılmadı', noindex: true });

  const data = await getListings(category, 1);
  return buildMetadata({
    title: `${cat.name_az} elanları — Azərbaycanda alqı-satqı`,
    description: `${cat.name_az} kateqoriyasında ${data.total ?? 0} aktiv elan. Bakı, Gəncə və bütün Azərbaycan şəhərləri üzrə pulsuz axtar, müqayisə et və əlaqə saxla.`,
    path: `/k/${category}`,
    keywords: [cat.name_az, `${cat.name_az} bakı`, `${cat.name_az} satılır`, `${cat.name_az} elan`],
  });
}

export default async function CategoryLandingPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = await getCategory(category);
  if (!cat) notFound();

  const { items, total } = await getListings(category, 24);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumb items={[
        { name: 'Kateqoriyalar', url: '/elanlar' },
        { name: cat.name_az },
      ]} />

      <header className="mt-4 mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900 mb-2">
          {cat.name_az} elanları Azərbaycanda
        </h1>
        <p className="text-ink-600">
          {total.toLocaleString('az-AZ')} aktiv elan tapıldı. Pulsuz axtar, müqayisə et, satıcı ilə birbaşa əlaqə saxla.
        </p>
      </header>

      {/* Universal yatay filter bar — avito stil */}
      <CategoryFilterClient category={category} />

      {/* Şəhər bağlantıları — internal link */}
      <section className="card p-4 mb-6">
        <h2 className="font-bold mb-3">Şəhər üzrə {cat.name_az.toLowerCase()}</h2>
        <div className="flex flex-wrap gap-2">
          {['baki', 'sumqayit', 'ganca', 'mingacevir', 'lenkeran', 'seki'].map((c) => (
            <Link key={c} href={`/seher/${c}/${category}`}
              className="px-3 py-1.5 rounded-full bg-ink-100 hover:bg-tap-50 hover:text-tap text-sm transition">
              {c === 'baki' ? 'Bakı' : c === 'ganca' ? 'Gəncə' : c.charAt(0).toUpperCase() + c.slice(1)}
            </Link>
          ))}
        </div>
      </section>

      {/* Listings grid (server-rendered üçün sadə kart) */}
      <h2 className="font-bold text-xl mb-3">Son elanlar</h2>
      {items.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">Bu kateqoriyada hələ elan yoxdur.</div>
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
              <div className="text-xs text-ink-400 mt-1">{it.city_name ?? ''}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="text-center mt-6">
        <Link href={`/elanlar?category=${category}`} className="btn-tap inline-flex">Filterlə bax →</Link>
      </div>

      {/* SEO mətn (internal link + content) */}
      <section className="mt-12 prose max-w-none">
        <h2 className="text-2xl font-bold text-ink-900">{cat.name_az} haqqında</h2>
        <p className="text-ink-700 leading-relaxed">
          360tap.az saytında {cat.name_az.toLowerCase()} bölməsində Azərbaycan üzrə geniş seçim mövcuddur.
          Yeni və işlənmiş variantlar, fərdi və biznes satıcılar, Bakı, Gəncə, Sumqayıt və digər şəhərlərdən elanlar.
          Pulsuz qeydiyyat, təhlükəsiz mesajlaşma və real qiymətlər.
        </p>
        <h3 className="text-xl font-bold mt-6">Tez-tez verilən suallar</h3>
        <details className="card p-4 my-2">
          <summary className="font-semibold cursor-pointer">{cat.name_az} elanı pulsuz yerləşdirə bilərəmmi?</summary>
          <p className="mt-2 text-ink-600">Bəli, ay başına 3 pulsuz elan yerləşdirə bilərsiniz. Premium yerləşdirmə üçün VIP paketi mövcuddur.</p>
        </details>
        <details className="card p-4 my-2">
          <summary className="font-semibold cursor-pointer">Necə təhlükəsiz əqd edim?</summary>
          <p className="mt-2 text-ink-600">Əvvəlcədən pul köçürməyin, məhsulu canlı yoxlayın, görüş ictimai yerdə təşkil edin.</p>
        </details>
      </section>

      <script type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLdItemList(items.map((i: any) => ({ id: i.id, title: i.title }))))}
      />
    </div>
  );
}
