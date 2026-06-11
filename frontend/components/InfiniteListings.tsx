'use client';
// Tap.az-stil sonsuz scroll + say seçici (20/50/100/∞).
// Server ilk batch-i (50) render edir (SEO + sürətli ilk açılış), client scroll-da davam etdirir.
import { useCallback, useEffect, useRef, useState } from 'react';
import ListingCard, { type Listing } from '@/components/ListingCard';

type NestListing = {
  id: string; title: string; slug: string; price: number | null; currency: string;
  priceType: string; isVip?: boolean; isPremium?: boolean; hasDelivery?: boolean;
  views?: number; favoritesCount?: number; createdAt: string;
  regionName?: string | null; districtName?: string | null;
  images?: { url: string; sortOrder: number }[];
};

function mapListing(l: NestListing): Listing {
  return {
    id: l.id, title: l.title, slug: l.slug, price: l.price ?? null,
    currency: l.currency ?? 'AZN', price_type: l.priceType ?? 'fixed',
    is_vip: l.isVip, is_premium: l.isPremium, has_delivery: l.hasDelivery,
    views: l.views, favorites_count: l.favoritesCount, created_at: l.createdAt,
    city_name: l.regionName ?? undefined, district: l.districtName ?? undefined,
    media: (l.images ?? []).map((i) => ({ url: i.url, sort_order: i.sortOrder ?? 0 })),
  };
}

const PER = [
  { v: '20', label: '20' },
  { v: '50', label: '50' },
  { v: '100', label: '100' },
  { v: 'inf', label: '∞' },
] as const;
const PAGE_SIZE = 50; // backend limit clamp-i (chunk ölçüsü)

export default function InfiniteListings({
  initialItems,
  baseQuery,
  initialHasMore,
  defaultPer = 'inf',
}: {
  initialItems: Listing[];
  baseQuery: string;
  initialHasMore: boolean;
  defaultPer?: string;
}) {
  const [items, setItems] = useState<Listing[]>(initialItems);
  const [per, setPer] = useState<string>(defaultPer);
  const [page, setPage] = useState(2); // server səhifə 1-i render edib
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<string>>(new Set(initialItems.map((i) => i.id)));
  const busy = useRef(false);

  const cap = per === 'inf' ? Infinity : Number(per);
  const pageLimit = per === 'inf' ? PAGE_SIZE : Math.min(PAGE_SIZE, Number(per));

  const load = useCallback(
    async (p: number, replace: boolean, limit: number) => {
      if (busy.current) return;
      busy.current = true;
      setLoading(true);
      try {
        const r = await fetch(`/api/listings?${baseQuery}&page=${p}&limit=${limit}`, {
          cache: 'no-store',
        });
        if (r.ok) {
          const d = (await r.json()) as { data?: NestListing[]; meta?: { hasMore?: boolean } };
          const mapped = (d.data ?? []).map(mapListing);
          if (replace) {
            seen.current = new Set(mapped.map((m) => m.id));
            setItems(mapped);
          } else {
            const fresh = mapped.filter((m) => !seen.current.has(m.id));
            fresh.forEach((m) => seen.current.add(m.id));
            if (fresh.length) setItems((prev) => [...prev, ...fresh]);
          }
          setHasMore(d.meta?.hasMore ?? false);
        }
      } catch {
        /* şəbəkə xətası — növbəti scroll-da təkrar cəhd */
      } finally {
        busy.current = false;
        setLoading(false);
      }
    },
    [baseQuery],
  );

  // Say seçicisi dəyişəndə — 1-ci səhifədən təzədən yüklə
  const changePer = (v: string) => {
    if (v === per || busy.current) return;
    setPer(v);
    setPage(2);
    const lim = v === 'inf' ? PAGE_SIZE : Math.min(PAGE_SIZE, Number(v));
    void load(1, true, lim);
  };

  // Sonsuz scroll — sentinel görünəndə növbəti batch
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    if (!hasMore || items.length >= cap || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (busy.current || !hasMore || items.length >= cap) return;
        const p = page;
        setPage(p + 1);
        void load(p, false, pageLimit);
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, items.length, cap, loading, page, pageLimit, load]);

  const reachedCap = items.length >= cap;
  const more = hasMore && !reachedCap;

  return (
    <>
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-sm text-ink-500 mr-1">Göstər:</span>
        {PER.map((o) => (
          <button
            key={o.v}
            onClick={() => changePer(o.v)}
            aria-pressed={per === o.v}
            className={`min-w-9 px-2.5 py-1 rounded-full text-sm font-bold transition ${
              per === o.v
                ? 'bg-tap text-white'
                : 'bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-200 hover:bg-ink-100'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map((l) => (
          <ListingCard key={l.id} item={l} />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 rounded-full border-2 border-tap border-t-transparent animate-spin" />
        </div>
      )}

      {/* Sentinel — görünəndə avtomatik yüklənir */}
      {!loading && more && <div ref={sentinel} className="h-12" />}

      {!loading && !more && items.length > 0 && (
        <div className="text-center py-8 text-ink-400 text-sm">
          {reachedCap && hasMore
            ? `${items.length} elan göstərildi — daha çoxu üçün ∞ seçin`
            : 'Hamısı göstərildi'}
        </div>
      )}
    </>
  );
}
