'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import ListingCard, { type Listing } from '@/components/ListingCard';
import type { ListMeta, StoreListing } from '../store-api';
import { azNumber } from '@/lib/format';

/**
 * MAĞAZANIN ELANLARI — şəbəkə + sonsuz scroll + mağaza daxilində axtarış/kateqoriya filtri.
 *
 * NİYƏ `InfiniteListings` birbaşa istifadə olunmur: o komponent filtr qəbul etmir,
 * backend `GET /stores/:slug/listings` isə YALNIZ `page`/`limit` dəstəkləyir
 * (curl ilə yoxlanılıb — `q`/`category` parametri yoxdur). Yəni axtarış server tərəfdə
 * mümkün deyil.
 *
 * DÜRÜSTLÜK QAYDASI: klient tərəf filtr yalnız YÜKLƏNMİŞ elanlara baxa bilər. Ona görə
 * istifadəçi axtarışa başlayan kimi qalan səhifələr AVTOMATİK çəkilir (limitə qədər) —
 * əks halda «tapılmadı» cavabı yalan olardı. Limit aşılırsa bu açıq şəkildə yazılır.
 */

const PAGE_SIZE = 50; // backend clamp-i (limit ≤ 50)
const MAX_PAGES = 10; // axtarış üçün maksimum çəkilən səhifə (≈500 elan)
const REVEAL_STEP = 24;

function mapListing(l: StoreListing): Listing {
  return {
    id: l.id,
    title: l.title,
    slug: l.slug ?? '',
    price: l.price ?? null,
    currency: l.currency ?? 'AZN',
    price_type: l.priceType ?? 'fixed',
    is_vip: l.isVip, is_demo: l.isDemo,
    is_premium: l.isPremium,
    has_delivery: l.hasDelivery,
    views: l.views,
    favorites_count: l.favoritesCount,
    created_at: l.createdAt,
    category_name: l.categoryName ?? undefined,
    city_name: l.regionName ?? undefined,
    district: l.districtName ?? undefined,
    media: (l.images ?? []).map((i) => ({ url: i.url, sort_order: i.sortOrder ?? 0 })),
  };
}

export default function StoreListings({
  slug,
  initialItems,
  initialMeta,
}: {
  slug: string;
  initialItems: StoreListing[];
  initialMeta: ListMeta;
}) {
  const [raw, setRaw] = useState<StoreListing[]>(initialItems);
  // Səhifə nömrəsi render-də İSTİFADƏ OLUNMUR → state deyil, ref. State olsaydı, onu
  // yeniləyən effekt öz asılılığını dəyişib təkrar işə düşərdi (döngə riski).
  const page = useRef(2); // server 1-ci səhifəni render edib
  const [hasMore, setHasMore] = useState(initialMeta.hasMore);
  const [loading, setLoading] = useState(false);
  const [capped, setCapped] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [visible, setVisible] = useState(REVEAL_STEP * 2);

  const busy = useRef(false);
  const seen = useRef<Set<string>>(new Set(initialItems.map((i) => i.id)));
  const sentinel = useRef<HTMLDivElement>(null);

  const filtering = q.trim().length > 0 || cat !== '';

  /** Bir səhifə çəkir və yeni elementlərin sayını qaytarır. */
  const fetchPage = useCallback(
    async (p: number): Promise<boolean> => {
      const r = await fetch(`/api/stores/${encodeURIComponent(slug)}/listings?page=${p}&limit=${PAGE_SIZE}`, {
        cache: 'no-store',
      });
      if (!r.ok) return false;
      const d = (await r.json()) as { data?: StoreListing[]; meta?: Partial<ListMeta> };
      const fresh = (d.data ?? []).filter((l) => !seen.current.has(l.id));
      fresh.forEach((l) => seen.current.add(l.id));
      if (fresh.length) setRaw((prev) => [...prev, ...fresh]);
      const more = d.meta?.hasMore ?? false;
      setHasMore(more);
      return more;
    },
    [slug],
  );

  const loadNext = useCallback(async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoading(true);
    try {
      await fetchPage(page.current);
      page.current += 1;
    } catch {
      /* şəbəkə xətası — növbəti scroll/klik təkrar cəhd edir */
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [fetchPage, hasMore]);

  /** Axtarış/filtr aktivləşəndə qalan səhifələri sona (və ya limitə) qədər çək. */
  const fullLoadStarted = useRef(false);
  useEffect(() => {
    if (!filtering || !hasMore || fullLoadStarted.current) return;
    fullLoadStarted.current = true;
    busy.current = true;
    setLoading(true);
    void (async () => {
      try {
        let more = true;
        while (more && page.current <= MAX_PAGES) {
          more = await fetchPage(page.current);
          page.current += 1;
        }
        // `capped` yalnız GERÇƏKDƏN qalan səhifə varsa doğrudur — əks halda
        // istifadəçiyə əsassız «axtarış natamamdır» xəbərdarlığı göstərilərdi.
        if (more) setCapped(true);
      } catch {
        /* qismən yüklənmiş nəticələr qalır — istifadəçi nə tapıldığını görür */
      } finally {
        busy.current = false;
        setLoading(false);
      }
    })();
  }, [filtering, hasMore, fetchPage]);

  // Sonsuz scroll yalnız filtrsiz görünüşdə — filtrdə onsuz da hamısı çəkilir.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || filtering || !hasMore || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadNext();
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtering, hasMore, loading, loadNext]);

  /** Kateqoriya seçimləri YÜKLƏNMİŞ elanlardan qurulur — uydurma siyahı yoxdur. */
  const categories = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; count: number }>();
    for (const l of raw) {
      if (!l.categorySlug || !l.categoryName) continue;
      const cur = map.get(l.categorySlug);
      if (cur) cur.count += 1;
      else map.set(l.categorySlug, { slug: l.categorySlug, name: l.categoryName, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [raw]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('az');
    return raw.filter((l) => {
      if (cat && l.categorySlug !== cat) return false;
      if (needle && !l.title.toLocaleLowerCase('az').includes(needle)) return false;
      return true;
    });
  }, [raw, q, cat]);

  const shown = filtering ? filtered.slice(0, visible) : filtered;
  const canReveal = filtering && filtered.length > shown.length;

  // Filtr dəyişəndə göstərilən pəncərə sıfırlanır — əks halda yeni nəticələr
  // əvvəlki «daha çox» vəziyyətini miras alardı.
  useEffect(() => {
    setVisible(REVEAL_STEP * 2);
  }, [q, cat]);

  const resultLabel = filtering
    ? `${filtered.length} nəticə`
    : `${azNumber(initialMeta.total)} elan`;

  return (
    <section aria-labelledby="magaza-elanlari">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="magaza-elanlari"
          className="text-lg font-extrabold text-ink-900 dark:text-white md:text-xl"
        >
          Mağazanın elanları
          <span className="ml-2 text-sm font-semibold text-ink-400">{resultLabel}</span>
        </h2>

        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mağazada axtar"
            aria-label="Mağaza daxilində axtarış"
            className="w-full rounded-full border border-ink-200 bg-white py-2 pl-9 pr-9 text-sm text-ink-900 placeholder:text-ink-400 focus:border-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-tap dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Axtarışı təmizlə"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tap dark:hover:bg-ink-700 dark:hover:text-ink-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {categories.length > 1 && (
        <div className="mb-4 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex w-max gap-1.5" role="group" aria-label="Kateqoriya filtri">
            <CatChip active={cat === ''} onClick={() => setCat('')} label="Hamısı" />
            {categories.map((c) => (
              <CatChip
                key={c.slug}
                active={cat === c.slug}
                onClick={() => setCat(cat === c.slug ? '' : c.slug)}
                label={`${c.name} (${c.count})`}
              />
            ))}
          </div>
        </div>
      )}

      {capped && (
        <p className="mb-3 text-xs text-ink-500 dark:text-ink-400">
          Axtarış ilk {MAX_PAGES * PAGE_SIZE} elan üzrə aparılır.
        </p>
      )}

      {shown.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
          {shown.map((l) => (
            <ListingCard key={l.id} item={mapListing(l)} />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="card p-10 text-center">
            <p className="font-semibold text-ink-700 dark:text-ink-200">
              {filtering ? 'Bu şərtlərə uyğun elan tapılmadı' : 'Mağazada hələ aktiv elan yoxdur'}
            </p>
            {filtering && (
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  setCat('');
                }}
                className="btn-secondary mt-4 text-sm"
              >
                Filtrləri sıfırla
              </button>
            )}
          </div>
        )
      )}

      {loading && (
        <div className="flex justify-center py-8" role="status" aria-live="polite">
          <span className="sr-only">Yüklənir</span>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-tap border-t-transparent" />
        </div>
      )}

      {canReveal && (
        <div className="flex justify-center py-6">
          <button
            type="button"
            onClick={() => setVisible((v) => v + REVEAL_STEP)}
            className="btn-secondary text-sm"
          >
            Daha çox göstər
          </button>
        </div>
      )}

      {!filtering && !loading && hasMore && <div ref={sentinel} className="h-12" />}
    </section>
  );
}

function CatChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tap focus-visible:ring-offset-1 ${
        active
          ? 'bg-tap text-white'
          : 'bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700'
      }`}
    >
      {label}
    </button>
  );
}
