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

// ELAN SƏHİFƏLƏMƏSİ.
// Backend `limit`-i sərt 50-yə clamp edir (api/src/modules/listings/listings.service.ts),
// ona görə `?limit=200` yazmaq işə yaramırdı: sitemap-da elanların yalnız bir hissəsi
// (50/113) görünürdü. İndi `page` ilə dövr vurulur.
const LISTINGS_PAGE_SIZE = 50; // API-nin qəbul etdiyi maksimum
const LISTINGS_MAX_PAGES = 40; // təhlükəsizlik hədi: 40 × 50 = 2 000 elan
// Ümumi vaxt büdcəsi: sitemap ISR yolundadır, N ardıcıl sorğu revalidate-i uzada
// bilər. Büdcə bitəndə dövr dayanır və O ANA QƏDƏR toplanan URL-lər qaytarılır —
// natamam sitemap, boş sitemap-dan yaxşıdır.
const LISTINGS_BUDGET_MS = 20_000;

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

type ListingRow = { id: string; updatedAt?: string; createdAt?: string };

/** Bütün aktiv elanları səhifə-səhifə yığır; xəta/büdcə halında topladığını qaytarır. */
async function fetchAllListings(): Promise<ListingRow[]> {
  const items: ListingRow[] = [];
  // Səhifələr ardıcıl sorğularla gəlir; aralarında yeni elan əlavə olunsa eyni sətir
  // iki səhifədə görünə bilər. Sitemap-da təkrar URL istəmirik, ona görə id-lərə görə
  // süzürük (offset-əsaslı səhifələmənin bilinən sürüşmə problemi).
  const seen = new Set<string>();
  const startedAt = Date.now();

  for (let page = 1; page <= LISTINGS_MAX_PAGES; page++) {
    const d = await fetchJson(
      `${API}/listings?limit=${LISTINGS_PAGE_SIZE}&page=${page}`,
      600,
      `listings s${page}`,
    );
    // `fetchJson` xətada null qaytarır — dövrü dayandırıb topladığımızla kifayətlənirik
    // ki, bir uğursuz səhifə bütün sitemap-ı boşaltmasın.
    if (!d) break;

    const batch: ListingRow[] = d.data ?? [];
    batch.forEach((l) => {
      if (l?.id && !seen.has(l.id)) {
        seen.add(l.id);
        items.push(l);
      }
    });

    if (batch.length === 0 || !d.meta?.hasMore) break;
    if (Date.now() - startedAt > LISTINGS_BUDGET_MS) {
      console.warn(`[sitemap] elan səhifələməsi vaxt büdcəsini keçdi (s${page}) — ${items.length} elanla dayandı`);
      break;
    }
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];

  // `lastModified` QƏSDƏN VERİLMİR (statik, kateqoriya və region URL-lərində).
  // Əvvəl hamısına `new Date()` yazılırdı, yəni hər ISR regenerasiyasında 196 URL-in
  // damğası məzmun dəyişmədən yenilənirdi — bu, axtarış motorları üçün saxta siqnaldır
  // və nəticədə lastmod-a ümumiyyətlə etibar edilmir. Sahə sitemap sxemində
  // OPSİONALDIR, ona görə bilmədiyimiz tarixi uydurmaqdansa verməmək düzgündür.
  // Real tarix yalnız elanlarda var (updatedAt/createdAt) — aşağıda o saxlanılır.
  STATIC_PATHS.forEach((p) => {
    urls.push({ url: `${SITE.url}${p.path}`, changeFrequency: p.change, priority: p.priority });
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
    urls.push({ url: `${SITE.url}/elanlar?category=${c.slug}`, changeFrequency: 'hourly', priority: 0.8 }),
  );

  // Regionlar → /elanlar?region=
  const regionsD = await fetchJson(`${API}/geo/regions`, 86400, 'geo/regions');
  const regions = regionsD?.data ?? [];
  regions.forEach((c: { slug: string }) =>
    urls.push({ url: `${SITE.url}/elanlar?region=${c.slug}`, changeFrequency: 'daily', priority: 0.7 }),
  );

  // Elanlar — bütün səhifələr (bax: fetchAllListings)
  const items = await fetchAllListings();
  items.forEach((l) => {
    const stamp = l.updatedAt ?? l.createdAt;
    urls.push({
      url: `${SITE.url}/elanlar/${l.id}`,
      // Tarix yoxdursa sahə buraxılır — generasiya vaxtını yazmaq saxta lastmod olardı.
      ...(stamp ? { lastModified: new Date(stamp) } : {}),
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  });

  console.log(`[sitemap] ${urls.length} URL (statik ${STATIC_PATHS.length}, kateqoriya ${flat.length}, region ${regions.length}, elan ${items.length})`);
  return urls;
}
