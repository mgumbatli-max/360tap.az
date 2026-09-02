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

// Faza 0: sitemap generasiyası backend asılı qalanda build/ISR revalidate-i
// bloklaya bilməz. Həmçinin uğursuzluqlar artıq SƏSSİZ udulmur — loglanır,
// çünki canlıda sitemap sükutla 5 URL-ə düşmüşdü və bunu heç nə göstərmirdi.
const SITEMAP_TIMEOUT_MS = 8_000;

async function fetchJson(url: string, revalidate: number, label: string): Promise<any | null> {
  try {
    const r = await fetch(url, {
      next: { revalidate },
      signal: AbortSignal.timeout(SITEMAP_TIMEOUT_MS),
    });
    if (!r.ok) {
      console.warn(`[sitemap] ${label} → HTTP ${r.status}`);
      return null;
    }
    return await r.json();
  } catch (e) {
    console.warn(`[sitemap] ${label} → alınmadı: ${e instanceof Error ? e.name : String(e)}`);
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  STATIC_PATHS.forEach((p) => {
    urls.push({ url: `${SITE.url}${p.path}`, lastModified: now, changeFrequency: p.change, priority: p.priority });
  });

  // Kateqoriyalar → /elanlar?category=
  const catD = await fetchJson(`${API}/categories`, 3600, 'categories');
  const flat: { slug: string }[] = [];
  const walk = (arr: { slug: string; children?: unknown[] }[]) =>
    arr.forEach((c) => {
      flat.push(c);
      if (Array.isArray(c.children)) walk(c.children as typeof arr);
    });
  walk(catD?.data ?? []);
  flat.forEach((c) =>
    urls.push({ url: `${SITE.url}/elanlar?category=${c.slug}`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 }),
  );

  // Regionlar → /elanlar?region=
  const regionsD = await fetchJson(`${API}/geo/regions`, 86400, 'geo/regions');
  const regions = regionsD?.data ?? [];
  regions.forEach((c: { slug: string }) =>
    urls.push({ url: `${SITE.url}/elanlar?region=${c.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.7 }),
  );

  // Elanlar
  const listD = await fetchJson(`${API}/listings?limit=50`, 600, 'listings');
  const items = listD?.data ?? [];
  items.forEach((l: { id: string; updatedAt?: string; createdAt?: string }) =>
    urls.push({
      url: `${SITE.url}/elanlar/${l.id}`,
      lastModified: l.updatedAt ? new Date(l.updatedAt) : l.createdAt ? new Date(l.createdAt) : now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }),
  );

  console.log(`[sitemap] ${urls.length} URL (statik ${STATIC_PATHS.length}, kateqoriya ${flat.length}, region ${regions.length}, elan ${items.length})`);
  return urls;
}
