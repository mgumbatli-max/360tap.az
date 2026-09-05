import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, ServerCrash, Star, Store as StoreIcon } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import StoreBadge from '@/components/StoreBadge';
import { serverGet } from '@/lib/server-fetch';
import { safeImageUrl } from '@/lib/image-hosts';
import { buildMetadata } from '@/lib/seo';
import { hasRating, type ListMeta, type Store } from './store-api';

const SHELL = 'mx-auto w-full max-w-[1360px] px-4 md:px-6';
const PER_PAGE = 24;

export const metadata: Metadata = buildMetadata({
  title: 'Mağazalar — 360tap.az',
  description:
    '360tap.az-da qeydiyyatdan keçmiş mağazalar: elektronika, geyim, avtomobil və digər sahələr. Mağaza vitrinlərinə bax, birbaşa əlaqə saxla.',
  path: '/magaza',
  keywords: ['mağaza', 'mağazalar', 'onlayn mağaza', 'satıcı', 'vitrin'],
});

/**
 * `GET /stores` (kataloq) BAŞQA İŞİN MÖVZUSUDUR və hazırda backend-də YOXDUR
 * (curl → 404). Ona görə burada üç vəziyyət AYRI-AYRI göstərilir:
 *   · `unavailable`  → 5xx/timeout: xidmət nasazlığı
 *   · `data === null`→ endpoint hələ yoxdur (404) : «hazırlanır»
 *   · `data === []`  → endpoint var, mağaza yoxdur : «hələ mağaza yoxdur»
 * Heç bir halda ağ ekran qalmır və uydurma mağaza göstərilmir.
 */
export default async function StoresCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const res = await serverGet<Store[] | { items?: Store[] }, ListMeta>(
    `/stores?page=${page}&limit=${PER_PAGE}`,
    { next: { revalidate: 120 } },
  );

  // Kontrakt hələ sabitləşməyib — həm düz massiv, həm `{ items }` forması qəbul edilir.
  const raw = res.data;
  const stores: Store[] | null = Array.isArray(raw)
    ? raw
    : raw && Array.isArray(raw.items)
      ? raw.items
      : null;

  const total = res.meta?.total ?? stores?.length ?? 0;
  const hasMore = res.meta?.hasMore ?? false;

  return (
    <div className="min-h-screen bg-white dark:bg-ink-900">
      <div className={`${SHELL} py-6 md:py-8`}>
        <Breadcrumb items={[{ name: 'Mağazalar' }]} />

        <header className="mb-6 mt-3">
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white md:text-[32px]">
            Mağazalar
            {stores && total > 0 && (
              <span className="ml-2.5 font-extrabold text-ink-400">
                {total.toLocaleString('az-AZ')}
              </span>
            )}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500 dark:text-ink-400">
            Mağaza vitrini öz linki ilə paylaşıla bilər — elanlar, əlaqə, iş saatları və
            çatdırılma şərtləri bir səhifədə.
          </p>
        </header>

        {res.unavailable ? (
          <EmptyState
            icon={<ServerCrash className="h-12 w-12 text-ink-300" aria-hidden="true" />}
            title="Mağazalar yüklənmədi"
            text="Xidmətdə müvəqqəti nasazlıq var. Bir azdan yenidən cəhd edin."
          />
        ) : stores === null ? (
          <EmptyState
            icon={<Building2 className="h-12 w-12 text-ink-300" aria-hidden="true" />}
            title="Mağaza kataloqu hazırlanır"
            text="Mağaza siyahısı hələ açıq deyil. Mağaza səhifələri isə artıq işləyir — birbaşa linklə açıla bilər."
          />
        ) : stores.length === 0 ? (
          <EmptyState
            icon={<StoreIcon className="h-12 w-12 text-ink-300" aria-hidden="true" />}
            title="Hələ mağaza yoxdur"
            text="Platformada aktiv mağaza yoxdur. İlk mağazanı sən aça bilərsən."
          />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4">
              {stores.map((s) => (
                <StoreCard key={s.id ?? s.slug} store={s} />
              ))}
            </ul>

            {(page > 1 || hasMore) && (
              <nav
                aria-label="Səhifələmə"
                className="mt-8 flex items-center justify-center gap-2"
              >
                {page > 1 ? (
                  <Link
                    href={page === 2 ? '/magaza' : `/magaza?page=${page - 1}`}
                    className="btn-secondary text-sm"
                    rel="prev"
                  >
                    Əvvəlki
                  </Link>
                ) : (
                  <span aria-hidden="true" />
                )}
                <span className="px-3 text-sm text-ink-500 dark:text-ink-400">{page}</span>
                {hasMore && (
                  <Link href={`/magaza?page=${page + 1}`} className="btn-secondary text-sm" rel="next">
                    Növbəti
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StoreCard({ store }: { store: Store }) {
  const cover = safeImageUrl(store.coverUrl);
  const logo = safeImageUrl(store.logoUrl);

  return (
    <li className="group relative overflow-hidden rounded-2xl border border-ink-200 bg-white transition-colors hover:border-ink-300 dark:border-ink-700 dark:bg-ink-800">
      <div className="relative h-24 w-full bg-ink-100 dark:bg-ink-700">
        {cover ? (
          <Image src={cover} alt="" fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-tap/20 to-tap/5" aria-hidden="true" />
        )}
      </div>

      <div className="p-3">
        <div className="-mt-9 mb-2 flex">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-white bg-ink-100 dark:border-ink-800 dark:bg-ink-700">
            {logo ? (
              <Image src={logo} alt="" fill sizes="48px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <StoreIcon className="h-5 w-5 text-ink-400" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        {/* Başlıq = mağaza nişanının özü: ad + təsdiq işarəsi elan kartındakı ilə
            EYNİ komponentdən gəlir, ona görə «təsdiqlənmiş» siqnalı hər yerdə eynidir.
            `after:` örtüyü bütün kartı kliklənibl edir — DOM-da tək link qalır. */}
        <h2 className="mb-1.5 line-clamp-1">
          <StoreBadge
            name={store.name}
            slug={store.slug}
            isVerified={store.isVerified}
            size="md"
            tone="strong"
            className="after:absolute after:inset-0 after:content-[''] focus-visible:ring-offset-2"
          />
        </h2>

        {store.description && (
          <p className="mb-2 line-clamp-2 text-[13px] text-ink-500 dark:text-ink-400">
            {store.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-500 dark:text-ink-400">
          {typeof store.activeListings === 'number' && (
            <span>{store.activeListings.toLocaleString('az-AZ')} elan</span>
          )}
          {hasRating(store) && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
              <span className="font-medium text-ink-700 dark:text-ink-200">
                {Number(store.rating).toFixed(1)}
              </span>
              <span>({store.reviewsCount})</span>
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="card p-12 text-center">
      <div className="mx-auto mb-3 flex justify-center">{icon}</div>
      <p className="mb-2 font-bold text-ink-900 dark:text-white">{title}</p>
      <p className="mx-auto max-w-md text-sm text-ink-500 dark:text-ink-400">{text}</p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Link href="/elanlar" className="btn-tap text-sm">
          Bütün elanlar
        </Link>
        <Link href="/biznes" className="btn-secondary text-sm">
          Biznes üçün
        </Link>
      </div>
    </div>
  );
}
