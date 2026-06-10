import type { Metadata } from 'next';

export const SITE = {
  name: '360tap.az',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://360tap.az',
  locale: 'az_AZ',
  twitter: '@360tap',
  logo: '/logo.png',
  description:
    'Azərbaycanda elanlar və alqı-satqı platforması. Avtomobil, mənzil, iş, telefon, xidmət və minlərlə kateqoriya. Pulsuz elan yerləşdir, milyonlarla insana çatdır.',
  keywords: [
    'elan', 'azərbaycan', 'satış', 'alqı-satqı', 'kirayə', 'iş elanları',
    'avtomobil', 'mənzil', 'telefon', 'xidmət', 'bakı', 'gəncə', '360tap',
  ],
};

interface PageSEO {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  keywords?: string[];
  type?: 'website' | 'article' | 'product';
}

export function buildMetadata(p: PageSEO): Metadata {
  const url = p.path ? `${SITE.url}${p.path}` : SITE.url;
  const description = p.description ?? SITE.description;
  const image = p.image ?? `${SITE.url}/og-default.png`;

  return {
    title: p.title,
    description,
    keywords: [...(p.keywords ?? []), ...SITE.keywords],
    alternates: { canonical: url },
    robots: p.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    openGraph: {
      type: p.type === 'product' ? 'website' : (p.type ?? 'website'),
      url,
      siteName: SITE.name,
      title: p.title,
      description,
      locale: SITE.locale,
      images: [{ url: image, width: 1200, height: 630, alt: p.title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE.twitter,
      title: p.title,
      description,
      images: [image],
    },
  };
}

// === JSON-LD helpers ===

export function jsonLdOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}${SITE.logo}`,
    sameAs: [
      'https://facebook.com/360tap.az',
      'https://instagram.com/360tap.az',
      'https://t.me/360tap_az',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+994-50-000-0000',
      contactType: 'customer service',
      areaServed: 'AZ',
      availableLanguage: ['az', 'ru', 'en'],
    },
  };
}

export function jsonLdWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'az-AZ',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/elanlar?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function jsonLdBreadcrumb(items: Array<{ name: string; url?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: it.url.startsWith('http') ? it.url : `${SITE.url}${it.url}` } : {}),
    })),
  };
}

interface ListingForJsonLd {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  condition?: string | null;
  category_name?: string;
  category_slug?: string;
  city_name?: string;
  owner_name?: string;
  owner_rating?: number;
  created_at: string;
  media?: Array<{ url: string }>;
}

export function jsonLdProduct(listing: ListingForJsonLd) {
  const image = listing.media?.[0]?.url;
  const conditionMap: Record<string, string> = {
    new: 'https://schema.org/NewCondition',
    like_new: 'https://schema.org/NewCondition',
    used: 'https://schema.org/UsedCondition',
    for_parts: 'https://schema.org/DamagedCondition',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description.slice(0, 5000),
    sku: listing.id,
    ...(image ? { image: [image] } : {}),
    ...(listing.category_name ? { category: listing.category_name } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE.url}/elanlar/${listing.id}`,
      priceCurrency: listing.currency || 'AZN',
      price: listing.price ?? 0,
      availability: 'https://schema.org/InStock',
      itemCondition: listing.condition ? conditionMap[listing.condition] : 'https://schema.org/UsedCondition',
      ...(listing.owner_name ? {
        seller: {
          '@type': 'Person',
          name: listing.owner_name,
          ...(listing.owner_rating && Number(listing.owner_rating) > 0 ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: Number(listing.owner_rating).toFixed(1),
              bestRating: 5,
            },
          } : {}),
        },
      } : {}),
      ...(listing.city_name ? {
        areaServed: { '@type': 'City', name: listing.city_name },
      } : {}),
    },
  };
}

export function jsonLdItemList(listings: Array<{ id: string; title: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: listings.length,
    itemListElement: listings.map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/elanlar/${l.id}`,
      name: l.title,
    })),
  };
}

export function jsonLdFAQ(qa: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function jsonLdLocalBusiness(shop: { name: string; slug: string; address?: string; phone?: string; rating?: number; reviewsCount?: number }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: shop.name,
    url: `${SITE.url}/magaza/${shop.slug}`,
    ...(shop.phone ? { telephone: shop.phone } : {}),
    ...(shop.address ? { address: { '@type': 'PostalAddress', streetAddress: shop.address, addressCountry: 'AZ' } } : {}),
    ...(shop.rating && shop.reviewsCount ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(shop.rating).toFixed(1),
        reviewCount: shop.reviewsCount,
      },
    } : {}),
  };
}

// JSON-LD render helper komponenti
export function jsonLdScript(data: unknown) {
  return {
    __html: JSON.stringify(data).replace(/</g, '\\u003c'),
  };
}
