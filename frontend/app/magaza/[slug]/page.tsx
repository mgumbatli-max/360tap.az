import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BadgeCheck,
  Building2,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  ServerCrash,
  ShieldCheck,
  Star,
  Store as StoreIcon,
  Truck,
} from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { serverGet } from '@/lib/server-fetch';
import { safeImageUrl } from '@/lib/image-hosts';
import { buildMetadata, jsonLdLocalBusiness, jsonLdScript, SITE } from '@/lib/seo';
import {
  hasRating,
  instagramHref,
  telHref,
  whatsappHref,
  type ListMeta,
  type Store,
  type StoreListing,
} from '../store-api';
import { parseWorkingHours } from '../working-hours';
import StoreHours from './StoreHours';
import StoreListings from './StoreListings';
import { azNumber } from '@/lib/format';

/** Elanlar/ana səhifə ilə eyni işçi sahə — səhifələr arası sıçrama olmasın. */
const SHELL = 'mx-auto w-full max-w-[1360px] px-4 md:px-6';
const FIRST_PAGE = 50; // InfiniteListings ilə eyni ilk batch ölçüsü

async function getStore(slug: string) {
  return serverGet<Store>(`/stores/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
}

/**
 * SEO. `notFound()` halında da metadata çağırılır, ona görə tapılmayan/aktiv olmayan
 * mağaza üçün `noindex` qaytarılır — əks halda 404 səhifəsi mağaza adı ilə indekslənərdi.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: store } = await getStore(slug);

  if (!store || store.status !== 'active') {
    return buildMetadata({ title: 'Mağaza tapılmadı', path: `/magaza/${slug}`, noindex: true });
  }

  const count = store.activeListings ?? 0;
  return buildMetadata({
    title: `${store.name} — mağaza`,
    description:
      store.description?.trim() ||
      `${store.name} mağazasının 360tap.az-dakı vitrini${count > 0 ? `: ${count} aktiv elan` : ''}. Əlaqə, iş saatları, çatdırılma və zəmanət şərtləri.`,
    // Self-referencing canonical — `buildMetadata` `path`-dan qurur.
    path: `/magaza/${store.slug}`,
    image: safeImageUrl(store.coverUrl) ?? safeImageUrl(store.logoUrl),
    keywords: [store.name, 'mağaza', 'vitrin', '360tap'],
  });
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [storeRes, listRes] = await Promise.all([
    getStore(slug),
    serverGet<StoreListing[], ListMeta>(
      `/stores/${encodeURIComponent(slug)}/listings?page=1&limit=${FIRST_PAGE}`,
      { next: { revalidate: 60 } },
    ),
  ]);

  // Backend əlçatmazdırsa 404 vermək YALANDIR — mağaza mövcud ola bilər.
  if (storeRes.unavailable) return <ServiceDown />;

  const store = storeRes.data;
  // Yoxdursa VƏ YA hələ moderasiyadan keçməyibsə (pending/suspended) — real 404.
  if (!store || store.status !== 'active') notFound();

  const cover = safeImageUrl(store.coverUrl);
  const logo = safeImageUrl(store.logoUrl);
  const hours = parseWorkingHours(store.workingHours);
  const instagram = store.instagram ? instagramHref(store.instagram) : null;
  const branches = store.branches ?? [];
  const initialItems = listRes.data ?? [];
  const meta: ListMeta = listRes.meta ?? {
    page: 1,
    limit: FIRST_PAGE,
    total: initialItems.length,
    hasMore: false,
  };

  const panelCount =
    (hours ? 1 : 0) +
    (store.deliveryTerms || store.warrantyTerms ? 1 : 0) +
    (branches.length > 0 ? 1 : 0);

  const ld = jsonLdLocalBusiness({
    name: store.name,
    slug: store.slug,
    phone: store.phone ?? undefined,
    address: branches[0]?.address,
    ...(hasRating(store)
      ? { rating: Number(store.rating), reviewsCount: store.reviewsCount }
      : {}),
  });

  return (
    <div className="min-h-screen bg-white dark:bg-ink-900">
      {/* JSON-LD `jsonLdScript()` ilə — xam `JSON.stringify` `</script>` ardıcıllığını
          qaçırmadığı üçün XSS açır (layihədə bir dəfə baş verib). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(ld)} />

      {/* ——— Örtük ——— */}
      <div className="relative h-32 w-full overflow-hidden bg-ink-100 dark:bg-ink-800 sm:h-44 md:h-56">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-tap/20 to-tap/5" aria-hidden="true" />
        )}
      </div>

      <div className={`${SHELL} pb-10`}>
        {/* ——— Başlıq: loqo + ad + nişanlar ——— */}
        <header className="-mt-10 mb-6 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-ink-100 dark:border-ink-900 dark:bg-ink-800 sm:h-24 sm:w-24">
            {logo ? (
              <Image src={logo} alt={`${store.name} loqosu`} fill sizes="96px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <StoreIcon className="h-8 w-8 text-ink-400" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1">
              <Breadcrumb items={[{ name: 'Mağazalar', url: '/magaza' }, { name: store.name }]} />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="text-2xl font-extrabold leading-tight text-ink-900 dark:text-white md:text-[32px]">
                {store.name}
              </h1>
              {store.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Təsdiqlənmiş
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500 dark:text-ink-400">
              {/* Reytinq YALNIZ real rəy varsa — 0 rəylə «0.0» göstərmək saxta siqnaldır. */}
              {hasRating(store) ? (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-gold text-gold" aria-hidden="true" />
                  <span className="font-semibold text-ink-900 dark:text-ink-50">
                    {Number(store.rating).toFixed(1)}
                  </span>
                  <span>({store.reviewsCount} rəy)</span>
                </span>
              ) : (
                <span>Hələ rəy yoxdur</span>
              )}
              <span>
                {azNumber((store.activeListings ?? meta.total))} aktiv elan
              </span>
              <span>{new Date(store.createdAt).getFullYear()}-dən 360tap.az-da</span>
            </div>
          </div>
        </header>

        {store.description && (
          <p className="mb-6 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-ink-700 dark:text-ink-200">
            {store.description}
          </p>
        )}

        {/* ——— Əlaqə ——— */}
        {(store.phone || store.whatsapp || instagram) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {store.phone && (
              <a href={telHref(store.phone)} className="btn-tap text-sm" aria-label={`${store.name}: zəng et`}>
                <Phone className="h-4 w-4" aria-hidden="true" /> {store.phone}
              </a>
            )}
            {store.whatsapp && (
              <a
                href={whatsappHref(store.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm"
                aria-label={`${store.name}: WhatsApp-da yaz`}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
              </a>
            )}
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm"
                aria-label={`${store.name}: Instagram səhifəsi`}
              >
                <Instagram className="h-4 w-4" aria-hidden="true" /> Instagram
              </a>
            )}
          </div>
        )}

        {/* ——— Şərtlər / saatlar / filiallar ———
            Sütun sayı MÖVCUD paneldən asılıdır: boş sütun buraxmaq səhifəni
            «yarımçıq doldurulmuş» göstərir. */}
        {panelCount > 0 && (
        <div className={`mb-8 grid gap-4 ${panelCount >= 3 ? 'lg:grid-cols-3' : panelCount === 2 ? 'lg:grid-cols-2' : ''}`}>
          {hours && <StoreHours days={hours} />}

          {(store.deliveryTerms || store.warrantyTerms) && (
            <section aria-labelledby="magaza-sertler" className="card p-4">
              <h2 id="magaza-sertler" className="mb-3 text-sm font-bold text-ink-900 dark:text-white">
                Şərtlər
              </h2>
              <div className="space-y-3 text-[13px]">
                {store.deliveryTerms && (
                  <div className="flex gap-2">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-tap" aria-hidden="true" />
                    <div>
                      <div className="font-semibold text-ink-900 dark:text-ink-50">Çatdırılma</div>
                      <p className="whitespace-pre-line text-ink-600 dark:text-ink-300">
                        {store.deliveryTerms}
                      </p>
                    </div>
                  </div>
                )}
                {store.warrantyTerms && (
                  <div className="flex gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-tap" aria-hidden="true" />
                    <div>
                      <div className="font-semibold text-ink-900 dark:text-ink-50">Zəmanət</div>
                      <p className="whitespace-pre-line text-ink-600 dark:text-ink-300">
                        {store.warrantyTerms}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {branches.length > 0 && (
            <section aria-labelledby="magaza-filiallar" className="card p-4">
              <h2 id="magaza-filiallar" className="mb-3 text-sm font-bold text-ink-900 dark:text-white">
                Filiallar ({branches.length})
              </h2>
              <ul className="space-y-3 text-[13px]">
                {branches.map((b) => (
                  <li key={b.id} className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="font-semibold text-ink-900 dark:text-ink-50">{b.name}</div>
                      <p className="text-ink-600 dark:text-ink-300">{b.address}</p>
                      {b.phone && (
                        <a
                          href={telHref(b.phone)}
                          className="text-tap hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tap"
                        >
                          {b.phone}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        )}

        {/* ——— Elanlar ——— */}
        {listRes.unavailable ? (
          <div className="card p-10 text-center">
            <p className="font-semibold text-ink-700 dark:text-ink-200">
              Elanlar hazırda yüklənmir
            </p>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Xidmətdə müvəqqəti nasazlıq var. Bir azdan yenidən yoxlayın.
            </p>
          </div>
        ) : (
          <StoreListings slug={store.slug} initialItems={initialItems} initialMeta={meta} />
        )}

        <p className="mt-8 text-center text-xs text-ink-400">
          Bu vitrini paylaş:{' '}
          <span className="font-medium text-ink-600 dark:text-ink-300">
            {SITE.url.replace(/^https?:\/\//, '')}/magaza/{store.slug}
          </span>
        </p>
      </div>
    </div>
  );
}

/** Backend əlçatmaz — ağ ekran yerinə izahlı vəziyyət. */
function ServiceDown() {
  return (
    <div className={`${SHELL} py-20`}>
      <div className="mx-auto max-w-md text-center">
        <ServerCrash className="mx-auto mb-4 h-12 w-12 text-ink-300" aria-hidden="true" />
        <h1 className="mb-2 text-xl font-extrabold text-ink-900 dark:text-white">
          Mağaza məlumatı yüklənmədi
        </h1>
        <p className="mb-6 text-sm text-ink-500 dark:text-ink-400">
          Xidmətdə müvəqqəti nasazlıq var. Mağaza silinməyib — bir azdan yenidən cəhd edin.
        </p>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/magaza" className="btn-secondary text-sm">
            <Building2 className="h-4 w-4" aria-hidden="true" /> Mağazalar
          </Link>
          <Link href="/elanlar" className="btn-tap text-sm">
            Bütün elanlar
          </Link>
        </div>
      </div>
    </div>
  );
}
