'use client';
import { useState } from 'react';
import { MapPin, ChevronDown, SlidersHorizontal } from 'lucide-react';
import LocationPicker from './LocationPicker';
import { PROPERTY_TYPES } from '@/lib/realestate-data';
import type { RealEstateFilters } from './RealEstateFilter';

export default function RealEstateTopBar({
  filters,
  setFilters,
  onOpenAdvanced,
  totalCount,
  onApply,
}: {
  filters: RealEstateFilters;
  setFilters: (f: RealEstateFilters) => void;
  onOpenAdvanced: () => void;
  totalCount?: number;
  onApply: () => void;
}) {
  const [locOpen, setLocOpen] = useState(false);
  const totalLoc = filters.districts.length + filters.metros.length + filters.landmarks.length;
  const locLabel = totalLoc === 0 ? 'Rayon, metro, nişangah' :
    [...filters.districts, ...filters.metros, ...filters.landmarks].slice(0, 2).join(', ') +
    (totalLoc > 2 ? ` +${totalLoc - 2}` : '');

  const toggleRoom = (n: number) => {
    setFilters({
      ...filters,
      rooms: filters.rooms.includes(n) ? filters.rooms.filter((x) => x !== n) : [...filters.rooms, n],
    });
  };

  return (
    <div className="card p-3 sm:p-4 mb-4 sticky top-16 z-30 bg-white/95 backdrop-blur dark:bg-[#1c2128]/95">
      {/* Rəsm 1: Əməliyyat növü + Əmlak növü */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex bg-ink-100 dark:bg-ink-800 rounded-lg p-0.5">
          {(['sale', 'rent'] as const).map((t) => (
            <button key={t}
              onClick={() => setFilters({ ...filters, deal_type: t })}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${
                filters.deal_type === t ? 'bg-white dark:bg-ink-700 text-tap shadow' : 'text-ink-600 dark:text-ink-300'
              }`}>
              {t === 'sale' ? 'Alış' : 'Kirayə'}
            </button>
          ))}
        </div>
        <select
          value={filters.property_type}
          onChange={(e) => setFilters({ ...filters, property_type: e.target.value })}
          className="input !w-auto !py-1.5 !text-sm"
        >
          {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
        </select>
        <select
          value={filters.rooms.join(',')}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) { setFilters({ ...filters, rooms: [] }); return; }
            setFilters({ ...filters, rooms: v.split(',').map(Number) });
          }}
          className="input !w-auto !py-1.5 !text-sm"
        >
          <option value="">Otaq sayı</option>
          <option value="1">1 otaq</option>
          <option value="2">2 otaq</option>
          <option value="3">3 otaq</option>
          <option value="4">4 otaq</option>
          <option value="5">5+ otaq</option>
        </select>
        <input
          type="number" placeholder="min ₼" value={filters.min_price ?? ''}
          onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
          className="input !w-24 !py-1.5 !text-sm"
        />
        <input
          type="number" placeholder="max ₼" value={filters.max_price ?? ''}
          onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
          className="input !w-24 !py-1.5 !text-sm"
        />
        <button
          onClick={() => setLocOpen(true)}
          className="input !w-auto !py-1.5 !text-sm flex items-center gap-1.5 min-w-[200px]"
        >
          <MapPin className="w-3.5 h-3.5 text-tap shrink-0" />
          <span className={`truncate ${totalLoc > 0 ? 'text-tap font-semibold' : 'text-ink-500'}`}>{locLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 ml-auto text-ink-400" />
        </button>
        <button onClick={onOpenAdvanced} className="btn-secondary !py-1.5 !text-sm">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Ətraflı
        </button>
        <button onClick={onApply} className="btn-tap !py-1.5 !text-sm flex-1 sm:flex-initial min-w-[120px]">
          {totalCount != null ? `${totalCount.toLocaleString('az-AZ')} elan` : 'Axtar'}
        </button>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-1.5">
        {filters.property_type === 'menzil' && (
          <>
            <Chip active={filters.building_type === 'new'} onClick={() => setFilters({ ...filters, building_type: filters.building_type === 'new' ? '' : 'new' })}>🆕 Yeni tikili</Chip>
            <Chip active={filters.building_type === 'old'} onClick={() => setFilters({ ...filters, building_type: filters.building_type === 'old' ? '' : 'old' })}>🏛 Köhnə tikili</Chip>
          </>
        )}
        <Chip active={filters.has_cixaris} onClick={() => setFilters({ ...filters, has_cixaris: !filters.has_cixaris })}>📄 Çıxarış var</Chip>
        <Chip active={filters.has_ipoteka} onClick={() => setFilters({ ...filters, has_ipoteka: !filters.has_ipoteka })}>🏦 İpoteka var</Chip>
        <Chip active={filters.recently_dropped} onClick={() => setFilters({ ...filters, recently_dropped: !filters.recently_dropped })}>📉 Endirilib</Chip>
        <Chip active={filters.with_video} onClick={() => setFilters({ ...filters, with_video: !filters.with_video })}>🎥 Video</Chip>
        <Chip active={filters.with_360} onClick={() => setFilters({ ...filters, with_360: !filters.with_360 })}>🌐 360°</Chip>
      </div>

      <LocationPicker
        open={locOpen}
        onClose={() => setLocOpen(false)}
        selected={{ districts: filters.districts, metros: filters.metros, landmarks: filters.landmarks }}
        onApply={(s) => setFilters({ ...filters, districts: s.districts, metros: s.metros, landmarks: s.landmarks })}
      />
    </div>
  );
}

function Chip({ active, onClick, children }: any) {
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
        active ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap text-ink-700'
      }`}>
      {children}
    </button>
  );
}
