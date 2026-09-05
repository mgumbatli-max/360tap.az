'use client';
import { useMemo, type ReactNode } from 'react';
import { X } from 'lucide-react';
import {
  CAR_BRANDS, BODY_TYPES, FUEL_TYPES, TRANSMISSION_TYPES, DRIVETRAIN_TYPES,
  COLORS, MARKET_FROM, SELLER_KIND, EQUIPMENT,
} from '@/lib/transport-data';
import { azNumber } from '@/lib/format';

export type TransportFilters = {
  brand?: string;
  model?: string;
  condition?: string;
  city?: string;
  min_price?: string;
  max_price?: string;
  currency?: string;
  credit?: boolean;
  barter?: boolean;
  body?: string;
  year_from?: string;
  year_to?: string;
  color?: string;
  fuel?: string;
  transmission?: string;
  drivetrain?: string;
  engine_min?: string;
  engine_max?: string;
  power_min?: string;
  power_max?: string;
  mileage_min?: string;
  mileage_max?: string;
  seats?: string;
  market_from?: string;
  seller_kind?: string;
  no_crash?: boolean;
  not_painted?: boolean;
  only_damaged?: boolean;
  dealers_only?: boolean;
  local?: boolean;
  equipment?: string[];
};

export default function TransportFullFilter({
  open, onClose, filters, setFilters, totalCount, onApply,
}: {
  open: boolean;
  onClose: () => void;
  filters: TransportFilters;
  setFilters: (f: TransportFilters) => void;
  totalCount?: number;
  onApply: () => void;
}) {
  const F = filters;
  const set = <K extends keyof TransportFilters>(k: K, v: TransportFilters[K]) => setFilters({ ...F, [k]: v });

  const models = useMemo(() => {
    if (!F.brand) return [];
    return CAR_BRANDS.find((b) => b.name === F.brand)?.models || [];
  }, [F.brand]);

  const toggleEq = (e: string) => {
    const arr = F.equipment || [];
    set('equipment', arr.includes(e) ? arr.filter((x) => x !== e) : [...arr, e]);
  };

  const reset = () => setFilters({});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/55 backdrop-blur-sm flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c2128] rounded-t-3xl sm:rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl my-0 sm:my-8 min-h-[90vh] sm:min-h-0"
        onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between px-6 py-5 border-b border-ink-100 dark:border-ink-700 sticky top-0 bg-white dark:bg-[#1c2128] z-10 rounded-t-3xl sm:rounded-t-2xl">
          <h2 className="text-2xl font-extrabold">🚗 Avtomobil filteri</h2>
          <button onClick={onClose} className="w-9 h-9 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-full flex items-center justify-center"><X className="w-5 h-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Marka və Model */}
          <Section title="Marka və Model">
            <div className="grid grid-cols-2 gap-3">
              <Select label="Marka" value={F.brand} onChange={(v) => setFilters({ ...F, brand: v, model: '' })}
                options={[{ value: '', label: 'Hamısı' }, ...CAR_BRANDS.map((b) => ({ value: b.name, label: b.name }))]} />
              <Select label="Model" value={F.model} onChange={(v) => set('model', v)} disabled={!F.brand}
                options={[{ value: '', label: 'Hamısı' }, ...models.map((m) => ({ value: m, label: m }))]} />
            </div>
          </Section>

          {/* Qiymət + valyuta + kredit/barter */}
          <Section title="Qiymət">
            <div className="grid grid-cols-3 gap-3">
              <input type="number" placeholder="min" value={F.min_price || ''}
                onChange={(e) => set('min_price', e.target.value)} className="input" />
              <input type="number" placeholder="max" value={F.max_price || ''}
                onChange={(e) => set('max_price', e.target.value)} className="input" />
              <select value={F.currency || 'AZN'} onChange={(e) => set('currency', e.target.value)} className="input">
                <option value="AZN">AZN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Pill active={!!F.credit} onClick={() => set('credit', !F.credit)}>Kredit</Pill>
              <Pill active={!!F.barter} onClick={() => set('barter', !F.barter)}>Barter</Pill>
            </div>
          </Section>

          {/* Ban növü + İl */}
          <Section title="Ban növü">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {BODY_TYPES.map((b) => (
                <Pill key={b} active={F.body === b} onClick={() => set('body', F.body === b ? '' : b)}>{b}</Pill>
              ))}
            </div>
          </Section>

          <Section title="İl">
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="min" value={F.year_from || ''}
                onChange={(e) => set('year_from', e.target.value)} className="input" />
              <input type="number" placeholder="max" value={F.year_to || ''}
                onChange={(e) => set('year_to', e.target.value)} className="input" />
            </div>
          </Section>

          {/* Rəng + Yanacaq + Ötürücü + Sürətlər qutusu */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Section title="Rəng">
              <Select value={F.color} onChange={(v) => set('color', v)}
                options={[{ value: '', label: 'Hamısı' }, ...COLORS.map((c) => ({ value: c, label: c }))]} />
            </Section>
            <Section title="Yanacaq növü">
              <Select value={F.fuel} onChange={(v) => set('fuel', v)}
                options={[{ value: '', label: 'Hamısı' }, ...FUEL_TYPES.map((f) => ({ value: f, label: f }))]} />
            </Section>
            <Section title="Ötürücü">
              <Select value={F.drivetrain} onChange={(v) => set('drivetrain', v)}
                options={[{ value: '', label: 'Hamısı' }, ...DRIVETRAIN_TYPES.map((d) => ({ value: d.value, label: d.label }))]} />
            </Section>
            <Section title="Sürətlər qutusu">
              <Select value={F.transmission} onChange={(v) => set('transmission', v)}
                options={[{ value: '', label: 'Hamısı' }, ...TRANSMISSION_TYPES.map((t) => ({ value: t, label: t }))]} />
            </Section>
          </div>

          {/* Həcm + Güc + Yürüş */}
          <Section title="Mühərrik həcmi (sm³)">
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="min" value={F.engine_min || ''}
                onChange={(e) => set('engine_min', e.target.value)} className="input" />
              <input type="number" placeholder="max" value={F.engine_max || ''}
                onChange={(e) => set('engine_max', e.target.value)} className="input" />
            </div>
          </Section>

          <Section title="Güc (a.g.)">
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="min" value={F.power_min || ''}
                onChange={(e) => set('power_min', e.target.value)} className="input" />
              <input type="number" placeholder="max" value={F.power_max || ''}
                onChange={(e) => set('power_max', e.target.value)} className="input" />
            </div>
          </Section>

          <Section title="Yürüş (km)">
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="min" value={F.mileage_min || ''}
                onChange={(e) => set('mileage_min', e.target.value)} className="input" />
              <input type="number" placeholder="max" value={F.mileage_max || ''}
                onChange={(e) => set('mileage_max', e.target.value)} className="input" />
            </div>
          </Section>

          {/* Yerlər sayı */}
          <Section title="Yerlər sayı">
            <div className="flex gap-1.5 flex-wrap">
              {['2','4','5','6','7','8','9+'].map((n) => (
                <Pill key={n} active={F.seats === n} onClick={() => set('seats', F.seats === n ? '' : n)}>{n}</Pill>
              ))}
            </div>
          </Section>

          {/* Hansı bazardan + Satıcı */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Section title="Hansı bazar üçün yığılıb">
              <Select value={F.market_from} onChange={(v) => set('market_from', v)}
                options={[{ value: '', label: 'Hamısı' }, ...MARKET_FROM]} />
            </Section>
            <Section title="Satıcı növü">
              <Select value={F.seller_kind} onChange={(v) => set('seller_kind', v)}
                options={[{ value: '', label: 'Hamısı' }, ...SELLER_KIND]} />
            </Section>
          </div>

          {/* Vəziyyət */}
          <Section title="Vəziyyət">
            <div className="space-y-2">
              <Check label="Vurğusu yoxdur" checked={F.no_crash} onChange={(v) => set('no_crash', v)} />
              <Check label="Rənglənməyib" checked={F.not_painted} onChange={(v) => set('not_painted', v)} />
              <Check label="Yalnız qəzalı avtomobillər" checked={F.only_damaged} onChange={(v) => set('only_damaged', v)} />
            </div>
          </Section>

          {/* Avtomobilin təchizatı */}
          <Section title={`Avtomobilin təchizatı (${F.equipment?.length || 0} seçilib)`}>
            <div className="grid grid-cols-2 gap-1">
              {EQUIPMENT.map((e) => {
                const on = (F.equipment || []).includes(e);
                return (
                  <label key={e} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-ink-50 dark:hover:bg-ink-800 rounded px-1.5">
                    <input type="checkbox" checked={on} onChange={() => toggleEq(e)} className="w-4 h-4 accent-tap" />
                    <span className="text-sm">{e}</span>
                  </label>
                );
              })}
            </div>
          </Section>
        </div>

        <footer className="border-t border-ink-100 dark:border-ink-700 px-6 py-4 flex gap-3 bg-white dark:bg-[#1c2128] sticky bottom-0 rounded-b-3xl sm:rounded-b-2xl">
          <button onClick={reset} className="px-5 py-3.5 bg-ink-100 dark:bg-ink-700 rounded-xl font-semibold">Sıfırla</button>
          <button onClick={() => { onApply(); onClose(); }} className="flex-1 py-3.5 bg-tap text-white rounded-xl font-semibold hover:opacity-90">
            {totalCount != null ? `${azNumber(totalCount)} elanı göstər` : 'Tətbiq et'}
          </button>
        </footer>
      </div>
    </div>
  );
}

// Faza 0: bu köməkçi komponentlərin propsları `any` idi — buna görə hər
// `onChange={(v) => ...}` callback-ində `v` implicit any olurdu (11 TS7006 xətası).
// Kök səbəb propsların tiplənməməsi idi; xətalar suppress edilmədi, tiplər verildi.

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="font-bold text-ink-900 dark:text-white mb-3 text-base">{title}</div>
      {children}
    </div>
  );
}

type SelectOption = { value: string; label: string };

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  disabled?: boolean;
}) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-ink-500 mb-1">{label}</label>}
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="input disabled:opacity-50">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
        active ? 'bg-ink-900 dark:bg-white dark:text-ink-900 text-white border-ink-900' : 'border-ink-200 hover:border-tap text-ink-700'
      }`}>{children}</button>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="w-[18px] h-[18px] accent-tap" />
      <span className="text-base">{label}</span>
    </label>
  );
}
