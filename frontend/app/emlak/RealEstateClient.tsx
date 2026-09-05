'use client';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ListingCard, { type Listing } from '@/components/ListingCard';
import { type RealEstateFilters } from '@/components/RealEstateFilter';
import RealEstateTopBar from '@/components/RealEstateTopBar';
import RealEstateFullFilter from '@/components/RealEstateFullFilter';
import MapView from '@/components/MapView';
import PriceHeatmap from '@/components/PriceHeatmap';
import NeighborhoodScore from '@/components/NeighborhoodScore';
import MortgagePreapproval from '@/components/MortgagePreapproval';
import PropertyCompare from '@/components/PropertyCompare';
// SAXTA KOMPONENTLƏR SÖNDÜRÜLDÜ (bildiriş işi, 2026-09-06).
// Aşağıdakı komponentlər istifadəçiyə REAL VƏD verirdi, amma heç nə etmirdi:
// serverə bir sorğu belə atmır, yalnız `localStorage`-a yazır və ya sadəcə toast
// göstərirdilər. Yəni istifadəçi xəbərdarlıq qurub brauzerini bağlayır və heç vaxt
// heç nə almırdı — bu, işləməyən düymədən daha pisdir, çünki gözlənti yaradır.
// Fayllar SİLİNMƏDİ: real endpoint hazır olanda import və render bir sətirlə qaytarılır.
// SavedMatches: mövcud olmayan `/realestate/match-saved-searches` endpointinə sorğu atırdı (404).
// import SavedMatches from '@/components/SavedMatches';
import { api } from '@/lib/api';
import { Home, LayoutGrid, List, Map, TrendingDown, Sparkles, Calculator } from 'lucide-react';
import { azNumber } from '@/lib/format';

const DEFAULT_F: RealEstateFilters = {
  deal_type: 'sale',
  property_type: 'menzil',
  building_type: '',
  districts: [], metros: [], landmarks: [],
  rooms: [],
  repair: '',
  appliances: [],
  nearby: [],
};

const QUICK_TABS = [
  { id: 'all',  label: 'Hamısı',     icon: '🏠' },
  { id: 'menzil-yeni', label: 'Yeni tikili', icon: '🆕' },
  { id: 'menzil-kohne', label: 'Köhnə tikili', icon: '🏛' },
  { id: 'hayat-evi',   label: 'Həyət evi',   icon: '🏡' },
  { id: 'ofis',        label: 'Ofis',        icon: '🏢' },
  { id: 'qaraj',       label: 'Qaraj',       icon: '🚗' },
  { id: 'torpaq',      label: 'Torpaq',      icon: '🌳' },
];

export default function RealEstateClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [filters, setFilters] = useState<RealEstateFilters>(DEFAULT_F);
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list' | 'map'>('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [calcOpen, setCalcOpen] = useState(false);
  const [advOpen, setAdvOpen] = useState(false);
  const [widgetsOpen, setWidgetsOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.property_type === 'menzil') {
      params.set('category', filters.deal_type === 'sale' ? 'menzil-satilir' : 'menzil-kiraye');
    } else if (filters.property_type === 'hayat-evi') params.set('category', 'hayat-evi');
    else if (filters.property_type === 'ofis') params.set('category', 'ofis');
    else if (filters.property_type === 'qaraj') params.set('category', 'qaraj');
    else if (filters.property_type === 'torpaq') params.set('category', 'torpaq');
    if (filters.min_price) params.set('min_price', filters.min_price);
    if (filters.max_price) params.set('max_price', filters.max_price);
    if (filters.min_area) params.set('attr_area_min', filters.min_area);
    if (filters.max_area) params.set('attr_area_max', filters.max_area);
    if (filters.rooms.length) params.set('attr_rooms', filters.rooms.join(','));
    if (filters.building_type) params.set('attr_building_type', filters.building_type);
    if (filters.repair) params.set('attr_repair', filters.repair);
    if (filters.has_cixaris) params.set('attr_doc', 'cixaris');
    if (filters.has_ipoteka) params.set('attr_mortgage', '1');
    if (filters.districts.length) params.set('attr_district', filters.districts.join(','));
    if (filters.metros.length) params.set('attr_metro', filters.metros.join(','));
    params.set('limit', '24');
    try {
      const d = await api<{ items: Listing[]; total: number }>(`/listings?${params}`);
      setItems(d.items); setTotal(d.total ?? d.items.length);
    } catch { setItems([]); setTotal(0); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onQuickTab = (id: string) => {
    setActiveTab(id);
    const next = { ...filters };
    if (id === 'all') { next.property_type = 'menzil'; next.building_type = ''; }
    else if (id === 'menzil-yeni') { next.property_type = 'menzil'; next.building_type = 'new'; }
    else if (id === 'menzil-kohne') { next.property_type = 'menzil'; next.building_type = 'old'; }
    else { next.property_type = id; next.building_type = ''; }
    setFilters(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="text-sm text-ink-500 mb-3">
        <Link href="/" className="hover:text-tap">Ana</Link> / <span className="text-ink-900 font-medium">Daşınmaz əmlak</span>
      </nav>

      {/* Hero */}
      <div className="card p-5 mb-4 bg-gradient-to-br from-tap-50 via-violet-50 to-pink-50 border-tap/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 flex items-center gap-2">
              <Home className="w-7 h-7 text-tap" /> Daşınmaz əmlak
            </h1>
            <p className="text-sm text-ink-600 mt-1">
              50+ filter • AI smart match • Heatmap • İpoteka pre-approval • 360° tur
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCalcOpen(true)} className="btn-secondary text-sm">
              <Calculator className="w-4 h-4" /> İpoteka
            </button>
            <button onClick={() => setWidgetsOpen(!widgetsOpen)} className="btn-secondary text-sm">
              <Sparkles className="w-4 h-4" /> AI Alətlər
            </button>
            <a href="/elan-yerlesdir" className="btn-tap text-sm">+ Elan</a>
          </div>
        </div>
      </div>

      {/* Quick tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-thin">
        {QUICK_TABS.map((t) => (
          <button key={t.id} onClick={() => onQuickTab(t.id)}
            className={`shrink-0 px-3 py-2 rounded-lg border text-sm font-semibold transition ${
              activeTab === t.id ? 'bg-tap text-white border-tap' : 'bg-white border-ink-200 hover:border-tap'
            }`}>
            <span className="mr-1">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ⭐ Yatay üst filter bar — bina.az-vari */}
      <RealEstateTopBar
        filters={filters}
        setFilters={setFilters}
        onOpenAdvanced={() => setAdvOpen(true)}
        totalCount={total}
        onApply={fetchData}
      />

      {/* AI Alətlər paneli — açılır/bağlanır */}
      {widgetsOpen && (
        <div className="grid md:grid-cols-2 gap-3 mb-5">
          <MortgagePreapproval />
          {filters.districts[0] && <NeighborhoodScore district={filters.districts[0]} />}
        </div>
      )}

      

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="text-sm text-ink-500">
          {loading ? 'Yüklənir...' : `${azNumber(total)} əmlak elanı`}
          {filters.recently_dropped && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <TrendingDown className="w-3 h-3" /> Endirilənlər
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView('grid')} className={`btn-secondary !p-2 ${view==='grid' ? '!border-tap text-tap' : ''}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setView('list')} className={`btn-secondary !p-2 ${view==='list' ? '!border-tap text-tap' : ''}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setView('map')} className={`btn-secondary !p-2 ${view==='map' ? '!border-tap text-tap' : ''}`}><Map className="w-4 h-4" /></button>
        </div>
      </div>

      {/* AI tövsiyəsi banner */}
      <div className="card p-3 mb-4 bg-gradient-to-r from-tap-50 to-violet-50 border-tap/20 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-tap shrink-0" />
        <div className="text-sm">
          <strong className="text-tap">AI tövsiyəsi:</strong>{' '}
          <span className="text-ink-700">&quot;Bakı, 2-3 otaq, 80-120 m², 100-150K ₼ aralığı&quot; — sizin profilinizə görə ən çox baxılan diapazon</span>
        </div>
      </div>

      {/* ⭐ Nəticələr tam genişlikdə (grid 4 sütun) */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="card aspect-[3/4] animate-pulse bg-ink-100" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Home className="w-16 h-16 mx-auto text-ink-300 mb-3" />
          <p className="text-ink-500 text-lg mb-2">Filtrlərə uyğun əmlak elanı tapılmadı</p>
          <button onClick={() => setFilters(DEFAULT_F)} className="btn-secondary mt-3">Filtrləri sıfırla</button>
        </div>
      ) : view === 'map' ? (
        <MapView listings={items} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {items.map((l) => <ListingCard key={l.id} item={l} />)}
        </div>
      ) : (
        <div className="space-y-3">{items.map((l) => <ListingCard key={l.id} item={l} />)}</div>
      )}

      {/* Heatmap aşağıda */}
      <div className="mt-8">
        <PriceHeatmap propertyType={filters.deal_type === 'sale' ? 'menzil-satilir' : 'menzil-kiraye'} />
      </div>

      {/* Compare floating */}
      <PropertyCompare />

      {/* Bütün filtrlər modalı — avito.ru səviyyəsi */}
      <RealEstateFullFilter
        open={advOpen}
        onClose={() => setAdvOpen(false)}
        filters={filters as any}
        setFilters={setFilters as any}
        totalCount={total}
        onApply={fetchData}
        onShowMap={() => setView('map')}
      />

      {calcOpen && <MortgageCalc onClose={() => setCalcOpen(false)} />}
    </div>
  );
}

function MortgageCalc({ onClose }: { onClose: () => void }) {
  const [price, setPrice] = useState(100000);
  const [down, setDown] = useState(20000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(20);

  const principal = price - down;
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  const monthly = monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : principal / n;
  const total = monthly * n;
  const overpay = total - principal;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c2128] rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><Calculator className="w-5 h-5 text-tap" /> İpoteka kalkulyatoru</h2>
        <p className="text-sm text-ink-500 mb-4">Aylıq ödənişinizi hesablayın</p>
        <div className="space-y-3">
          <Range label="Əmlak qiyməti" value={price} setValue={setPrice} min={10000} max={1000000} step={5000} suffix="₼" />
          <Range label="İlkin ödəniş" value={down} setValue={setDown} min={0} max={price} step={1000} suffix="₼" />
          <Range label="Faiz dərəcəsi" value={rate} setValue={setRate} min={1} max={20} step={0.5} suffix="%" />
          <Range label="Müddət" value={years} setValue={setYears} min={1} max={30} step={1} suffix=" il" />
        </div>
        <div className="mt-5 p-4 bg-tap-50 rounded-xl">
          <div className="text-sm text-ink-600">Aylıq ödəniş</div>
          <div className="text-3xl font-extrabold text-tap">{azNumber(Math.round(monthly))} ₼</div>
          <div className="text-xs text-ink-500 mt-2 space-y-0.5">
            <div>Ümumi ödəniş: <strong>{azNumber(Math.round(total))} ₼</strong></div>
            <div>Əlavə ödəniş: <strong className="text-amber-600">{azNumber(Math.round(overpay))} ₼</strong></div>
          </div>
        </div>
        <button onClick={onClose} className="btn-tap w-full mt-4">Bağla</button>
      </div>
    </div>
  );
}

function Range({ label, value, setValue, min, max, step, suffix }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold text-ink-700 mb-1">
        <span>{label}</span>
        <span className="text-tap">{azNumber(value)}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => setValue(Number(e.target.value))} className="w-full" />
    </div>
  );
}
