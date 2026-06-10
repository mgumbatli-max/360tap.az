'use client';
import { useState, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CAR_BRANDS } from '@/lib/transport-data';
import type { TransportFilters } from './TransportFullFilter';

export default function TransportTopBar({
  filters,
  setFilters,
  onOpenAdvanced,
  totalCount,
}: {
  filters: TransportFilters;
  setFilters: (f: TransportFilters) => void;
  onOpenAdvanced: () => void;
  totalCount?: number;
}) {
  const F = filters;
  const set = (k: keyof TransportFilters, v: any) => setFilters({ ...F, [k]: v });

  const models = useMemo(() => {
    if (!F.brand) return [];
    return CAR_BRANDS.find((b) => b.name === F.brand)?.models || [];
  }, [F.brand]);

  return (
    <div className="card p-3 sm:p-4 mb-4 sticky top-16 z-30 bg-white/95 backdrop-blur dark:bg-[#1c2128]/95">
      {/* Üst row — Marka, Model, Hamısı/Yeni/Sürünmüş, Şəhər */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
        <select value={F.brand || ''} onChange={(e) => setFilters({ ...F, brand: e.target.value, model: '' })}
          className="input !py-2 !text-sm">
          <option value="">Marka</option>
          {CAR_BRANDS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
        </select>

        <select value={F.model || ''} onChange={(e) => set('model', e.target.value)}
          disabled={!F.brand}
          className="input !py-2 !text-sm disabled:opacity-50">
          <option value="">Model</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <div className="flex bg-ink-100 dark:bg-ink-800 rounded-lg p-0.5 col-span-2 md:col-span-1">
          {[
            { v: '',    label: 'Hamısı' },
            { v: 'new',  label: 'Yeni' },
            { v: 'used', label: 'Sürünmüş' },
          ].map((o) => (
            <button key={o.v}
              onClick={() => set('condition', o.v)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold ${
                (F.condition || '') === o.v ? 'bg-white dark:bg-ink-700 text-tap shadow' : 'text-ink-600 dark:text-ink-300'
              }`}>{o.label}</button>
          ))}
        </div>

        <select value={F.city || ''} onChange={(e) => set('city', e.target.value)}
          className="input !py-2 !text-sm">
          <option value="">Şəhər</option>
          <option value="baki">Bakı</option>
          <option value="sumqayit">Sumqayıt</option>
          <option value="ganca">Gəncə</option>
          <option value="mingacevir">Mingəçevir</option>
          <option value="lenkeran">Lənkəran</option>
          <option value="seki">Şəki</option>
        </select>

        <button onClick={onOpenAdvanced} className="btn-secondary !py-2 !text-sm">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Daha çox filter
        </button>
      </div>

      {/* 2-ci row — Qiymət + AZN/Kredit/Barter + Ban növü + İl */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <input type="number" placeholder="Qiymət, min" value={F.min_price || ''}
          onChange={(e) => set('min_price', e.target.value)} className="input !py-2 !text-sm" />
        <input type="number" placeholder="max" value={F.max_price || ''}
          onChange={(e) => set('max_price', e.target.value)} className="input !py-2 !text-sm" />

        <select value={F.currency || 'AZN'} onChange={(e) => set('currency', e.target.value)}
          className="input !py-2 !text-sm">
          <option value="AZN">AZN ₼</option>
          <option value="USD">USD $</option>
          <option value="EUR">EUR €</option>
        </select>

        <select value={F.body || ''} onChange={(e) => set('body', e.target.value)}
          className="input !py-2 !text-sm">
          <option value="">Ban növü</option>
          <option value="sedan">Sedan</option>
          <option value="hatchback">Hetçbek</option>
          <option value="suv">SUV / Crossover</option>
          <option value="pickup">Pikap</option>
          <option value="van">Van</option>
          <option value="coupe">Kupe</option>
          <option value="cabriolet">Kabriolet</option>
        </select>

        <input type="number" placeholder="İl, min" value={F.year_from || ''}
          onChange={(e) => set('year_from', e.target.value)} className="input !py-2 !text-sm" />
        <input type="number" placeholder="max" value={F.year_to || ''}
          onChange={(e) => set('year_to', e.target.value)} className="input !py-2 !text-sm" />
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        <Chip active={!!F.credit} onClick={() => set('credit', !F.credit)}>💳 Kredit</Chip>
        <Chip active={!!F.barter} onClick={() => set('barter', !F.barter)}>🔄 Barter</Chip>
        <Chip active={!!F.no_crash} onClick={() => set('no_crash', !F.no_crash)}>✓ Vurğusu yox</Chip>
        <Chip active={!!F.not_painted} onClick={() => set('not_painted', !F.not_painted)}>✓ Rənglənməyib</Chip>
        <Chip active={!!F.dealers_only} onClick={() => set('dealers_only', !F.dealers_only)}>🏢 Salonlardan</Chip>
        <Chip active={!!F.local} onClick={() => set('local', !F.local)}>🇦🇿 Yerli bazar</Chip>
      </div>

      {/* Sayğac */}
      <div className="flex items-center justify-between mt-3 text-sm">
        <span className="text-ink-500">{totalCount != null ? `${totalCount.toLocaleString('az-AZ')} elan göstərilir` : ''}</span>
        <button onClick={onOpenAdvanced} className="text-tap font-semibold flex items-center gap-1 hover:underline">
          Daha çox filter <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: any) {
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
        active ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap text-ink-700'
      }`}>{children}</button>
  );
}
