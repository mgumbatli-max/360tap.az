'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ListingCard, { type Listing } from '@/components/ListingCard';
import TransportTopBar from '@/components/TransportTopBar';
import TransportFullFilter, { type TransportFilters } from '@/components/TransportFullFilter';
import ListingSkeleton from '@/components/ListingSkeleton';
import VINChecker from '@/components/VINChecker';
import PlateLookup from '@/components/PlateLookup';
import MarketPriceAnalyzer from '@/components/MarketPriceAnalyzer';
import CarCreditCalc from '@/components/CarCreditCalc';
import InsuranceCalc from '@/components/InsuranceCalc';
import MonthlyCostCalc from '@/components/MonthlyCostCalc';
import PopularCarsRanking from '@/components/PopularCarsRanking';
import { api } from '@/lib/api';
import { Car, LayoutGrid, List, Wrench, Sparkles } from 'lucide-react';
import { azNumber } from '@/lib/format';

export default function TransportClient({ initialItems = [], initialTotal = 0 }: { initialItems?: Listing[]; initialTotal?: number }) {
  const [filters, setFilters] = useState<TransportFilters>({});
  const [items, setItems] = useState<Listing[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [advOpen, setAdvOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('category', 'avtomobil');
    if (filters.brand) params.set('attr_brand', filters.brand);
    if (filters.model) params.set('attr_model', filters.model);
    if (filters.condition) params.set('condition', filters.condition);
    if (filters.city) params.set('city', filters.city);
    if (filters.min_price) params.set('min_price', filters.min_price);
    if (filters.max_price) params.set('max_price', filters.max_price);
    if (filters.body) params.set('attr_body', filters.body);
    if (filters.year_from) params.set('attr_year_min', filters.year_from);
    if (filters.year_to) params.set('attr_year_max', filters.year_to);
    if (filters.color) params.set('attr_color', filters.color);
    if (filters.fuel) params.set('attr_fuel', filters.fuel);
    if (filters.transmission) params.set('attr_transmission', filters.transmission);
    if (filters.drivetrain) params.set('attr_drivetrain', filters.drivetrain);
    if (filters.engine_min) params.set('attr_engine_min', filters.engine_min);
    if (filters.engine_max) params.set('attr_engine_max', filters.engine_max);
    if (filters.power_min) params.set('attr_power_min', filters.power_min);
    if (filters.power_max) params.set('attr_power_max', filters.power_max);
    if (filters.mileage_min) params.set('attr_mileage_min', filters.mileage_min);
    if (filters.mileage_max) params.set('attr_mileage_max', filters.mileage_max);
    if (filters.credit) params.set('has_credit', '1');
    if (filters.barter) params.set('has_barter', '1');
    if (filters.no_crash) params.set('attr_no_crash', '1');
    if (filters.not_painted) params.set('attr_not_painted', '1');
    if (filters.dealers_only) params.set('attr_seller', 'dealer');
    if (filters.local) params.set('attr_market', 'azerbaycan');
    if (filters.market_from) params.set('attr_market', filters.market_from);
    if (filters.equipment?.length) params.set('attr_equipment', filters.equipment.join(','));
    params.set('limit', '24');

    api<{ items: Listing[]; total: number }>(`/listings?${params}`)
      .then((d) => { setItems(d.items); setTotal(d.total ?? d.items.length); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  const isFirst = useState(true);
  useEffect(() => {
    if (isFirst[0]) { isFirst[1](false); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="text-sm text-ink-500 mb-3">
        <Link href="/" className="hover:text-tap">Ana</Link> / <span className="text-ink-900 font-medium">Nəqliyyat</span>
      </nav>

      <div className="card p-5 mb-4 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 border-red-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 flex items-center gap-2">
              <Car className="w-7 h-7 text-red-500" /> Nəqliyyat
            </h1>
            <p className="text-sm text-ink-600 mt-1">
              63+ marka · 800+ model · Kredit · Barter · AI axtarış
            </p>
          </div>
          <a href="/elan-yerlesdir" className="btn-tap text-sm">+ Elan yerləşdir</a>
        </div>
      </div>

      <TransportTopBar
        filters={filters}
        setFilters={setFilters}
        onOpenAdvanced={() => setAdvOpen(true)}
        totalCount={total}
      />

      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-sm text-ink-500">
          {loading ? 'Yüklənir...' : `${azNumber(total)} avtomobil`}
        </span>
        <div className="flex gap-1">
          <button onClick={() => setView('grid')} className={`btn-secondary !p-2 ${view==='grid' ? '!border-tap text-tap' : ''}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setView('list')} className={`btn-secondary !p-2 ${view==='list' ? '!border-tap text-tap' : ''}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {loading ? <ListingSkeleton count={12} /> :
        items.length === 0 ? (
          <div className="card p-12 text-center">
            <Car className="w-16 h-16 mx-auto text-ink-300 mb-3" />
            <p className="text-ink-500 mb-3">Filtrlərə uyğun avtomobil tapılmadı</p>
            <button onClick={() => setFilters({})} className="btn-secondary">Filtrləri sıfırla</button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
            {items.map((l) => <ListingCard key={l.id} item={l} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((l) => <ListingCard key={l.id} item={l} />)}
          </div>
        )}

      <TransportFullFilter
        open={advOpen}
        onClose={() => setAdvOpen(false)}
        filters={filters}
        setFilters={setFilters}
        totalCount={total}
        onApply={fetchData}
      />

      {/* 🛠 Faydalı alətlər — avtomobil saytı üçün 10 professional funksiya */}
      <section className="mt-12">
        <div className="flex items-center gap-2 mb-5">
          <Wrench className="w-6 h-6 text-tap" />
          <h2 className="text-2xl font-extrabold">Avtomobil alətləri</h2>
          <span className="text-xs bg-gradient-to-r from-tap to-violet-500 text-white px-2 py-0.5 rounded-full font-bold">10 funksiya</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <VINChecker />
          <PlateLookup />
          <MarketPriceAnalyzer />
          <CarCreditCalc />
          <InsuranceCalc />
          <MonthlyCostCalc />
          <div className="md:col-span-2">
            <PopularCarsRanking />
          </div>
        </div>
      </section>
    </div>
  );
}
