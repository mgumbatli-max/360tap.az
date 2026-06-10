import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

const STATIC_PATHS = [
  { path: '/', priority: 1, change: 'daily' as const },
  { path: '/elanlar', priority: 0.9, change: 'hourly' as const },
  { path: '/biznes', priority: 0.8, change: 'weekly' as const },
  { path: '/komek', priority: 0.6, change: 'monthly' as const },
  { path: '/karyera', priority: 0.6, change: 'weekly' as const },
  { path: '/reklam', priority: 0.6, change: 'monthly' as const },
  { path: '/elaqe', priority: 0.5, change: 'monthly' as const },
  { path: '/qaydalar', priority: 0.4, change: 'yearly' as const },
  { path: '/mexfilik', priority: 0.4, change: 'yearly' as const },
];

const API = 'http://localhost:5400';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  STATIC_PATHS.forEach((p) => {
    urls.push({ url: `${SITE.url}${p.path}`, lastModified: now, changeFrequency: p.change, priority: p.priority });
  });

  try {
    const r = await fetch(`${API}/api/categories`, { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      const flat: any[] = [];
      const walk = (arr: any[]) => arr.forEach((c) => { flat.push(c); if (c.children?.length) walk(c.children); });
      walk(d.categories ?? []);
      flat.forEach((c) => urls.push({
        url: `${SITE.url}/k/${c.slug}`,
        lastModified: now, changeFrequency: 'hourly', priority: 0.8,
      }));
    }
  } catch {}

  try {
    const cr = await fetch(`${API}/api/cities`, { cache: 'no-store' });
    if (cr.ok) {
      const cities = (await cr.json()).cities || [];
      cities.forEach((c: any) => {
        urls.push({
          url: `${SITE.url}/seher/${c.slug}`,
          lastModified: now, changeFrequency: 'daily', priority: 0.7,
        });
        ['avtomobil', 'menzil-satilir', 'menzil-kiraye', 'telefon', 'is-elanlari', 'xidmetler'].forEach((cat) => {
          urls.push({
            url: `${SITE.url}/seher/${c.slug}/${cat}`,
            lastModified: now, changeFrequency: 'daily', priority: 0.7,
          });
        });
      });
    }
  } catch {}

  try {
    const lr = await fetch(`${API}/api/listings?limit=60`, { cache: 'no-store' });
    if (lr.ok) {
      const items = (await lr.json()).items || [];
      items.forEach((l: any) => urls.push({
        url: `${SITE.url}/elanlar/${l.id}`,
        lastModified: l.updated_at ? new Date(l.updated_at) : new Date(l.created_at),
        changeFrequency: 'weekly', priority: 0.6,
      }));
    }
  } catch {}

  return urls;
}
