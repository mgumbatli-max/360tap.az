'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ListingCard, { type Listing } from '@/components/ListingCard';
import { type FiltersState } from '@/components/FilterSidebar';
import UniversalTopBar from '@/components/UniversalTopBar';
import UniversalFullFilter from '@/components/UniversalFullFilter';
import SaveSearchButton from '@/components/SaveSearchButton';
import FilterChips from '@/components/FilterChips';
import QuickFilterChips from '@/components/QuickFilterChips';
import MapView from '@/components/MapView';
import ListingSkeleton from '@/components/ListingSkeleton';
import { api } from '@/lib/api';
import { Map, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';

type ViewMode = 'grid' | 'list' | 'map';

function ListingsContent({ initialItems = [], initialTotal = 0 }: { initialItems?: Listing[]; initialTotal?: number }) {
  const sp = useSearchParams();
  const [items, setItems] = useState<Listing[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(initialTotal);
  const [view, setView] = useState<ViewMode>('grid');
  const [advOpen, setAdvOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersState>(() => {
    const initial: any = {
      q: sp.get('q') ?? '',
      category: sp.get('category') ?? '',
      city: sp.get('city') ?? '',
      min_price: sp.get('min_price') ?? '',
      max_price: sp.get('max_price') ?? '',
      condition: sp.get('condition') ?? '',
      sort: sp.get('sort') ?? 'new',
      has_delivery: sp.get('has_delivery') ?? '',
      has_credit: sp.get('has_credit') ?? '',
      has_barter: sp.get('has_barter') ?? '',
      with_photo: sp.get('with_photo') ?? '',
      only_shops: sp.get('only_shops') ?? '',
    };
    sp.forEach((v, k) => { if (k.startsWith('attr_')) initial[k] = v; });
    return initial;
  });

  // Daşınmaz əmlak kateqoriyalarında /emlak-a yönləndir
  const RE_CATS = ['menzil-satilir', 'menzil-kiraye', 'menzil', 'hayat-evi', 'ofis', 'qaraj', 'torpaq', 'obyekt', 'dasinmaz-emlak'];

  const fetchData = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v as string));
    setLoading(true);
    api<{ items: Listing[]; total: number }>(`/listings?${params.toString()}`)
      .then((d) => { setItems(d.items); setTotal(d.total ?? d.items.length); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  // İlk render-də fetch etmə (server-side initial var)
  const isFirstRender = useState(true);
  useEffect(() => {
    if (filters.category && RE_CATS.includes(filters.category)) {
      window.location.href = `/emlak?category=${filters.category}`;
      return;
    }
    // URL sinxronu (page reload-suz)
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v as string));
    const qs = params.toString();
    if (typeof window !== 'undefined' && window.location.search !== (qs ? `?${qs}` : '')) {
      window.history.replaceState({}, '', `/elanlar${qs ? `?${qs}` : ''}`);
    }
    if (isFirstRender[0]) { isFirstRender[1](false); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const reset = () => {
    setFilters({
      q: '', category: '', city: '', min_price: '', max_price: '', condition: '', sort: 'new',
      has_delivery: '', has_credit: '', has_barter: '', with_photo: '', only_shops: '',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1 text-sm text-ink-500 mb-3 overflow-x-auto">
        <a href="/" className="hover:text-tap">Ana</a>
        <span>/</span>
        <span className="text-ink-900 font-medium">
          {filters.q ? `"${filters.q}" üzrə nəticə` : 'Bütün elanlar'}
        </span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 mb-4">
        {filters.q ? `"${filters.q}" üzrə tapıldı` : 'Bütün elanlar'}
        {total > 0 && (
          <span className="ml-2 text-base font-normal text-ink-500">
            {total.toLocaleString('az-AZ')}
          </span>
        )}
      </h1>

      {/* Sürətli filter chip-ləri */}
      <div className="mb-3">
        <QuickFilterChips onApply={(p) => {
          const [k, v] = p.split('=');
          setFilters({ ...filters, [k]: v });
        }} />
      </div>

      {/* ⭐ Yatay üst filter bar — avito.ru stil */}
      <UniversalTopBar
        filters={filters}
        setFilters={setFilters}
        onOpenAdvanced={() => setAdvOpen(true)}
        totalCount={total}
      />

      {/* Filter chips */}
      <FilterChips
        filters={filters as Record<string, string>}
        onRemove={(k) => setFilters({ ...filters, [k]: '' })}
        onClearAll={reset}
      />

      {/* Tam ekran nəticələr — sol sidebar yoxdur! */}
      <div>
        <div>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="text-sm text-ink-500">
              {loading ? 'Yüklənir...' : `${total.toLocaleString('az-AZ')} elan göstərilir`}
            </div>
            <div className="flex items-center gap-2">
              <SaveSearchButton filters={filters as Record<string, string>} />
              <button
                onClick={() => setView('grid')}
                className={`btn-secondary !p-2 ${view === 'grid' ? '!border-tap text-tap' : ''}`}
                aria-label="Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`btn-secondary !p-2 ${view === 'list' ? '!border-tap text-tap' : ''}`}
                aria-label="List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('map')}
                className={`btn-secondary !p-2 ${view === 'map' ? '!border-tap text-tap' : ''}`}
                aria-label="Xəritədə bax"
                title="Xəritədə bax"
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <ListingSkeleton count={12} />
          ) : items.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-ink-500 text-lg mb-2">Filtrlərə uyğun elan tapılmadı</p>
              <p className="text-sm text-ink-400 mb-4">Filtrləri dəyişdirin və ya başqa açar söz axtarın.</p>
              <button onClick={reset} className="btn-secondary">Filtrləri sıfırla</button>
            </div>
          ) : view === 'map' ? (
            <MapView listings={items} />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
              {items.map((l) => <ListingCard key={l.id} item={l} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((l) => <ListingRowCard key={l.id} item={l} />)}
            </div>
          )}
        </div>
      </div>

      {/* Ətraflı filter modal */}
      <UniversalFullFilter
        open={advOpen}
        onClose={() => setAdvOpen(false)}
        filters={filters}
        setFilters={setFilters}
        totalCount={total}
        onApply={() => fetchData()}
      />
    </div>
  );
}

function ListingRowCard({ item }: { item: Listing }) {
  const cover = item.media?.[0]?.url;
  return (
    <a href={`/elanlar/${item.id}`} className="card p-3 flex gap-4 hover:border-tap group">
      <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 bg-ink-100 rounded-lg overflow-hidden">
        {cover && <img src={cover} alt={item.title} className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-lg sm:text-xl text-ink-900">
          {item.price ? `${Number(item.price).toLocaleString('az-AZ')} ${item.currency}` : 'Razılaşma'}
        </div>
        <h3 className="text-sm text-ink-800 mt-1 group-hover:text-tap line-clamp-2">{item.title}</h3>
        <div className="text-xs text-ink-500 mt-2 space-y-0.5">
          {item.city_name && <div>📍 {item.city_name}</div>}
          <div>{new Date(item.created_at).toLocaleDateString('az-AZ')}</div>
        </div>
      </div>
    </a>
  );
}

export default function ListingsPage({ initialItems, initialTotal }: { initialItems?: Listing[]; initialTotal?: number } = {}) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-ink-500">Yüklənir...</div>}>
      <ListingsContent initialItems={initialItems} initialTotal={initialTotal} />
    </Suspense>
  );
}
