import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata, jsonLdProduct, jsonLdBreadcrumb, jsonLdScript, SITE } from '@/lib/seo';
import ListingDetailClient from './ListingDetailClient';

const API = 'http://localhost:5400';

async function getListing(id: string) {
  try {
    const r = await fetch(`${API}/api/listings/${id}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()).listing;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return buildMetadata({ title: 'Elan tapılmadı', noindex: true });

  const priceText = listing.price ? `${Number(listing.price).toLocaleString('az-AZ')} ${listing.currency}` : 'Razılaşma';
  const cityText = listing.city_name ? `, ${listing.city_name}` : '';
  const cover = listing.media?.[0]?.url;

  return buildMetadata({
    title: `${listing.title} — ${priceText}${cityText}`,
    description: listing.description.slice(0, 160).replace(/\s+/g, ' '),
    path: `/elanlar/${listing.id}`,
    image: cover,
    type: 'product',
    keywords: [
      listing.title,
      listing.category_name,
      listing.city_name,
      ...(listing.attributes?.brand ? [String(listing.attributes.brand)] : []),
    ].filter(Boolean) as string[],
  });
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const breadcrumb = jsonLdBreadcrumb([
    { name: 'Ana', url: '/' },
    { name: 'Elanlar', url: '/elanlar' },
    ...(listing.category_name && listing.category_slug
      ? [{ name: listing.category_name, url: `/k/${listing.category_slug}` }]
      : []),
    { name: listing.title },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLdProduct(listing))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumb)} />
      <ListingDetailClient />
    </>
  );
}
