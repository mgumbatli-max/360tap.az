import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Gallery from '@/components/Gallery';
import ListingCard, { type Listing } from '@/components/ListingCard';
import MessageSeller from '@/components/MessageSeller';
import SellerReviews from '@/components/SellerReviews';
import ReportButton from '@/components/ReportButton';
import { serverGet } from '@/lib/server-fetch';
import { buildMetadata, jsonLdScript } from '@/lib/seo';

function mapSimilar(l: any): Listing {
  return {
    id: l.id, title: l.title, slug: l.slug, price: l.price ?? null,
    currency: l.currency ?? 'AZN', price_type: l.priceType ?? 'fixed',
    is_vip: l.isVip, is_premium: l.isPremium, has_delivery: l.hasDelivery,
    created_at: l.createdAt, city_name: l.regionName ?? undefined, district: l.districtName ?? undefined,
    media: (l.images ?? []).map((i: any) => ({ url: i.url, sort_order: i.sortOrder ?? 0 })),
  };
}

// Faza 0: timeout-lu — "oxşar elanlar" bloku backend asılı qalanda bütün
// detal səhifəsini gözlədə bilməz (ikinci dərəcəli məzmundur).
async function getSimilar(id: string): Promise<Listing[]> {
  const r = await serverGet<any[]>(`/listings/${id}/similar`, {
    next: { revalidate: 60 },
    timeoutMs: 3_000,
  });
  return (r.data ?? []).map(mapSimilar);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { listing: l } = await getListing(id);
  if (!l) return { title: 'Elan tapılmadı — 360tap.az' };
  const price = l.price != null ? `${Number(l.price).toLocaleString('az-AZ')} ${l.currency}` : 'Razılaşma';
  const loc = [l.districtName, l.regionName].filter(Boolean).join(', ');
  const desc = (l.description ?? '').slice(0, 160).replace(/\s+/g, ' ');
  const cover = l.images?.[0]?.url;

  // SEO — SELF-REFERENCING CANONICAL.
  // Əvvəl canonical yalnız root layout-da (mütləq `SITE.url`) təyin olunurdu və miras
  // yolu ilə bura da düşürdü: hər elan özünü ana səhifənin dublikatı elan edirdi.
  // Canonical URL-i `buildMetadata()` `path`-dan qurur (`SITE.url + path`), ona görə
  // burada URL birləşdirmə məntiqi TƏKRARLANMIR — layihədə digər route-lar da (məs.
  // `app/elanlar/page.tsx`) eyni köməkçidən istifadə edir.
  // Başlıqda ' | 360tap.az' suffiksi ƏL İLƏ YAZILMAMALIDIR: root layout-da
  // `title.template = '%s | 360tap.az'` var və Next onu string başlığa tətbiq edir,
  // nəticədə suffiks İKİ dəfə düşürdü ('... | 360tap.az | 360tap.az').
  const base = buildMetadata({
    title: `${l.title} — ${price}${loc ? ' · ' + loc : ''}`,
    description: desc,
    path: `/elanlar/${id}`,
    ...(cover ? { image: cover } : {}),
    type: 'product',
  });

  return {
    ...base,
    // og bloku əvvəlki davranışı saxlayır: sosial kartda başlıq qiymət/şəhər suffiksi
    // olmadan daha oxunaqlıdır, ona görə köməkçinin uzun başlığı burada üzərinə yazılır.
    openGraph: { ...base.openGraph, title: l.title },
  };
}

type Detail = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  oldPrice: number | null;
  currency: string;
  priceType: string;
  condition?: string | null;
  hasDelivery?: boolean;
  hasWarranty?: boolean;
  hasCredit?: boolean;
  inStock?: boolean;
  source?: string;
  isVip?: boolean;
  isPremium?: boolean;
  views?: number;
  contactName?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: boolean;
  address?: string | null;
  regionName?: string | null;
  districtName?: string | null;
  ownerId: string;
  createdAt: string;
  images?: { url: string }[];
};

/**
 * Faza 0: timeout-lu. `unavailable` ayrıca qaytarılır ki, səhifə
 * "elan tapılmadı" (404) ilə "backend əlçatmaz" (503) hallarını ayırd etsin —
 * əks halda backend düşəndə bütün mövcud elanlar 404 kimi göstərilirdi.
 */
async function getListing(id: string): Promise<{ listing: Detail | null; unavailable: boolean }> {
  const r = await serverGet<Detail>(`/listings/${id}`, { cache: 'no-store' });
  return { listing: r.data, unavailable: r.unavailable };
}

/**
 * SEO — BU ROUTE-UN ÜZƏRİNDƏ SUSPENSE SƏRHƏDİ OLMAMALIDIR.
 *
 * ƏVVƏL: `app/loading.tsx` (root) və `app/elanlar/loading.tsx` — HƏR İKİSİ bu route-un
 * əcdadı idi və Next shell-i `getListing()` bitmədən flush edirdi. Shell flush olunanda
 * HTTP statusu artıq göndərilmiş olur, ona görə aşağıdakı `notFound()` cavabın kodunu
 * dəyişə bilmirdi: mövcud olmayan elan HTTP 200 qaytarırdı və 404 yalnız klientdə
 * `$RX("B:2","NEXT_HTTP_ERROR_FALLBACK;404")` kimi render olunurdu (SOFT-404 —
 * axtarış motorları belə səhifəni "mövcud" sayıb indeksləyir).
 *
 * İNDİ: hər iki `loading.tsx` silindi (onların skeleton-ları öz səhifələrinin İÇİNDƏKİ
 * `<Suspense>` sərhədlərinə köçdü), yəni `getListing()` shell flush-dan ƏVVƏL bitir və
 * `notFound()` real HTTP 404 qaytarır.
 *
 * Aşağıdakı yeganə Suspense sərhədi "Oxşar elanlar" blokunun ətrafındadır — o, status
 * kodu artıq təyin ediləndən SONRA render olunur, ona görə təhlükəsizdir və eyni
 * zamanda ikinci dərəcəli sorğunun 3 saniyəsini kritik yoldan çıxarır.
 */
export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { listing: l, unavailable } = await getListing(id);
  if (!l) {
    if (unavailable) {
      // Backend əlçatmazdır — elanı "yoxdur" kimi göstərmək yanlışdır.
      return (
        <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
          <div className="max-w-3xl mx-auto px-4 py-16">
            <div className="card p-12 text-center">
              <p className="text-ink-900 dark:text-white text-lg font-bold">
                Elan müvəqqəti yüklənmir
              </p>
              <p className="text-ink-500 mt-2">
                Xidmətdə qısamüddətli problem var. Bir neçə dəqiqədən sonra yenidən yoxlayın.
              </p>
              <Link href="/elanlar" className="btn-secondary inline-flex mt-4">
                Bütün elanlara bax
              </Link>
            </div>
          </div>
        </div>
      );
    }
    notFound();
  }

  const cover = l.images?.[0]?.url;
  const price =
    l.price != null ? `${Number(l.price).toLocaleString('az-AZ')} ${l.currency}` : 'Razılaşma yolu ilə';
  const phone = l.contactPhone ?? undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: l.title,
    description: (l.description ?? '').slice(0, 300),
    ...(cover ? { image: cover } : {}),
    ...(l.price != null
      ? { offers: { '@type': 'Offer', price: l.price, priceCurrency: l.currency, availability: 'https://schema.org/InStock' } }
      : {}),
  };

  return (
    <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
      {/*
        TƏHLÜKƏSİZLİK: burada `JSON.stringify(jsonLd)` BİRBAŞA verilə bilməz.
        Elan başlığı/təsviri istifadəçi mətnidir; içində `</script>` olsa, HTML parser-i
        skript blokunu həmin yerdə bağlayır və ardınca gələn hər şeyi REAL DOM elementi
        kimi icra edir (saxlanılan XSS — token localStorage-dədir, CSP yoxdur).
        `jsonLdScript()` `<` simvolunu `<`-ə çevirir; JSON semantikası dəyişmir,
        amma mətn heç bir halda HTML parser-ini tərk edə bilmir.
        Eyni köməkçi layout.tsx və Breadcrumb.tsx-də artıq istifadə olunur.
      */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link href="/elanlar" className="text-tap text-sm font-medium">
          ← Elanlara qayıt
        </Link>

        <div className="grid md:grid-cols-[1fr_340px] gap-6 mt-3">
          {/* Sol: qalereya + təsvir */}
          <div>
            <Gallery images={l.images ?? []} title={l.title} />

            <div className="card p-5 mt-4">
              <h2 className="font-bold text-ink-900 dark:text-white mb-2">Təsvir</h2>
              <p className="text-ink-700 dark:text-ink-300 whitespace-pre-line leading-relaxed">
                {l.description}
              </p>
            </div>

            <SellerReviews sellerId={l.ownerId} listingId={l.id} />
          </div>

          {/* Sağ: qiymət + əlaqə */}
          <aside>
            <div className="card p-5 md:sticky md:top-24">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {l.source === 'erp' && l.inStock && (
                  <span className="badge badge-trusted">ERP təsdiqlənmiş stok</span>
                )}
                {l.isVip && <span className="badge badge-trusted">VIP</span>}
                {l.isPremium && !l.isVip && <span className="badge badge-trusted">Premium</span>}
              </div>

              <div className="text-2xl font-extrabold text-ink-900 dark:text-white">{price}</div>
              {l.oldPrice != null && (
                <div className="text-ink-400 line-through text-sm">
                  {Number(l.oldPrice).toLocaleString('az-AZ')} {l.currency}
                </div>
              )}

              <h1 className="text-lg font-bold text-ink-900 dark:text-white mt-2 leading-snug">
                {l.title}
              </h1>
              {(l.address || l.regionName || l.districtName) && (
                <p className="text-ink-500 text-sm mt-1">
                  📍 {l.address || [l.districtName, l.regionName].filter(Boolean).join(', ')}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5 mt-3 text-xs">
                {l.hasDelivery && <span className="badge badge-deliver">Çatdırılma</span>}
                {l.hasWarranty && <span className="badge">Zəmanət</span>}
                {l.hasCredit && <span className="badge">Kredit</span>}
                {l.inStock ? (
                  <span className="badge badge-deliver">Stokda var</span>
                ) : (
                  <span className="badge">Stokda yox</span>
                )}
              </div>

              {phone && (
                <div className="mt-4 space-y-2">
                  <a
                    href={`tel:${phone}`}
                    className="btn-tap w-full flex items-center justify-center"
                  >
                    📞 Zəng et
                  </a>
                  {l.contactWhatsapp && (
                    <a
                      href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary w-full flex items-center justify-center"
                    >
                      WhatsApp ilə yaz
                    </a>
                  )}
                </div>
              )}

              <MessageSeller listingId={l.id} ownerId={l.ownerId} />

              <p className="text-ink-400 text-xs mt-3">Baxış sayı: {l.views ?? 0}</p>
              <ReportButton listingId={l.id} />
            </div>
          </aside>
        </div>

        {/* Oxşar elanlar — ikinci dərəcəli məzmun, ayrıca stream olunur.
            Status kodu (200/404) bu nöqtəyə çatanda artıq təyin olunub. */}
        <Suspense fallback={null}>
          <SimilarListings id={l.id} />
        </Suspense>
      </div>
    </div>
  );
}

async function SimilarListings({ id }: { id: string }) {
  const similar = await getSimilar(id);
  if (similar.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold text-ink-900 dark:text-white mb-4">Oxşar elanlar</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {similar.map((s) => (
          <ListingCard key={s.id} item={s} />
        ))}
      </div>
    </section>
  );
}
