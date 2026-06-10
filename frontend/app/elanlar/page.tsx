import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildMetadata, jsonLdScript, jsonLdBreadcrumb, SITE } from '@/lib/seo';
import ListingsClient from './ListingsClient';

const API = 'http://localhost:5400';

// Daşınmaz əmlak slug-ları — avito-stil /emlak səhifəsinə yönləndir
const RE_CATEGORIES = [
  'menzil-satilir', 'menzil-kiraye', 'menzil',
  'hayat-evi', 'ofis', 'qaraj', 'torpaq', 'obyekt',
  'dasinmaz-emlak', 'daşinmaz-əmlak',
];

interface SP {
  q?: string; category?: string; city?: string;
  min_price?: string; max_price?: string;
  condition?: string; sort?: string;
  page?: string;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const cat = sp.category;
  const city = sp.city;

  let total = 0;
  try {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat) params.set('category', cat);
    if (city) params.set('city', city);
    const r = await fetch(`${API}/api/listings?${params}&limit=1`, { cache: 'no-store' });
    if (r.ok) total = (await r.json()).total ?? 0;
  } catch {}

  const parts: string[] = [];
  if (q) parts.push(`"${q}"`);
  if (cat) parts.push(cat.replace(/-/g, ' '));
  if (city) parts.push(city);

  const titleSuffix = parts.length ? `${parts.join(' · ')} — ${total} elan` : `Bütün elanlar`;
  const title = q
    ? `"${q}" üzrə ${total} nəticə${city ? ` (${city})` : ''}`
    : `${cat ? cat.replace(/-/g, ' ') + ' elanları' : 'Bütün elanlar'}${city ? ` — ${city}` : ''}`;

  const description = q
    ? `360tap.az üzrə "${q}" axtarışına ${total} elan tapıldı. Pulsuz baxış, satıcı ilə birbaşa əlaqə.`
    : `Azərbaycanda ${total > 0 ? total + ' aktiv ' : ''}elan. Avtomobil, mənzil, telefon, iş, xidmət və minlərlə kateqoriya.`;

  // canonical: filter parametrləri olmadan
  const canonicalPath = q || cat || city
    ? `/elanlar?${new URLSearchParams({ ...(q && { q }), ...(cat && { category: cat }), ...(city && { city }) }).toString()}`
    : '/elanlar';

  return buildMetadata({
    title,
    description,
    path: canonicalPath,
    keywords: [
      ...(q ? [q, `${q} satılır`, `${q} bakı`] : []),
      ...(cat ? [cat] : []),
      ...(city ? [city] : []),
      'axtarış', 'elan', '360tap',
    ],
  });
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  // next.config.ts redirect-i əsas mexanizmdir; bu ehtiyat olaraq
  if (sp.category && RE_CATEGORIES.includes(sp.category)) {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    redirect(`/emlak?${params.toString()}`);
  }

  const q = sp.q?.trim();

  // SearchResultsPage JSON-LD
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    url: `${SITE.url}/elanlar${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    name: q ? `"${q}" üzrə nəticələr` : 'Bütün elanlar',
    inLanguage: 'az-AZ',
    isPartOf: { '@type': 'WebSite', url: SITE.url, name: SITE.name },
    ...(q ? {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: 0,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
      },
    } : {}),
  };

  const breadcrumb = jsonLdBreadcrumb([
    { name: 'Ana', url: '/' },
    { name: 'Elanlar', url: '/elanlar' },
    ...(q ? [{ name: `"${q}"` }] : []),
  ]);

  // Server-side initial data fetch — Safari və SEO üçün
  let initialItems: any[] = [];
  let initialTotal = 0;
  try {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    params.set('limit', '24');
    const r = await fetch(`${API}/api/listings?${params}`, { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      initialItems = d.items || [];
      initialTotal = d.total ?? initialItems.length;
    }
  } catch {}

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumb)} />
      <ListingsClient initialItems={initialItems} initialTotal={initialTotal} />
    </>
  );
}
