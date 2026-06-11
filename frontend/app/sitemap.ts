import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

const STATIC_PATHS = [
  { path: '/', priority: 1, change: 'daily' as const },
  { path: '/elanlar', priority: 0.9, change: 'hourly' as const },
  { path: '/ai-elan', priority: 0.7, change: 'weekly' as const },
  { path: '/biznes', priority: 0.8, change: 'weekly' as const },
  { path: '/komek', priority: 0.6, change: 'monthly' as const },
];

const API = process.env.API_ORIGIN
  ? `${process.env.API_ORIGIN}/api/v1`
  : 'http://localhost:5500/api/v1';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  STATIC_PATHS.forEach((p) => {
    urls.push({ url: `${SITE.url}${p.path}`, lastModified: now, changeFrequency: p.change, priority: p.priority });
  });

  // Kateqoriyalar → /elanlar?category=
  try {
    const r = await fetch(`${API}/categories`, { next: { revalidate: 3600 } });
    if (r.ok) {
      const d = await r.json();
      const flat: { slug: string }[] = [];
      const walk = (arr: { slug: string; children?: unknown[] }[]) =>
        arr.forEach((c) => {
          flat.push(c);
          if (Array.isArray(c.children)) walk(c.children as typeof arr);
        });
      walk(d.data ?? []);
      flat.forEach((c) =>
        urls.push({ url: `${SITE.url}/elanlar?category=${c.slug}`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 }),
      );
    }
  } catch {
    /* ignore */
  }

  // Regionlar → /elanlar?region=
  try {
    const cr = await fetch(`${API}/geo/regions`, { next: { revalidate: 86400 } });
    if (cr.ok) {
      const regions = (await cr.json()).data ?? [];
      regions.forEach((c: { slug: string }) =>
        urls.push({ url: `${SITE.url}/elanlar?region=${c.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.7 }),
      );
    }
  } catch {
    /* ignore */
  }

  // Elanlar
  try {
    const lr = await fetch(`${API}/listings?limit=50`, { next: { revalidate: 600 } });
    if (lr.ok) {
      const items = (await lr.json()).data ?? [];
      items.forEach((l: { id: string; updatedAt?: string; createdAt?: string }) =>
        urls.push({
          url: `${SITE.url}/elanlar/${l.id}`,
          lastModified: l.updatedAt ? new Date(l.updatedAt) : l.createdAt ? new Date(l.createdAt) : now,
          changeFrequency: 'weekly',
          priority: 0.6,
        }),
      );
    }
  } catch {
    /* ignore */
  }

  return urls;
}
