'use client';
import { useState } from 'react';
import { X, Info, MapPin } from 'lucide-react';
import LocationPicker from './LocationPicker';
import {
  PROPERTY_TYPES, ROOM_OPTIONS, HOUSING_TYPES, SALE_METHODS, CONTACT_METHODS,
  BATHROOM_TYPES, ROOM_LAYOUT, WINDOW_DIRECTIONS, BALCONY_TYPES, HOUSE_TYPES,
  LIFT_TYPES, PARKING_TYPES, CEILING_HEIGHTS, HIDE_OPTIONS, VERIFICATIONS,
  SELLER_TYPES, REPAIR_TYPES, DOC_TYPES,
} from '@/lib/realestate-data';
import type { RealEstateFilters } from './RealEstateFilter';

export type RealEstateFiltersV2 = RealEstateFilters & {
  housing_type?: string;
  sale_method?: string;
  contact_method?: string;
  bathroom?: string;
  room_layout?: string;
  windows?: string[];
  balcony_types?: string[];
  house_type?: string;
  lift_type?: string;
  parking_type?: string;
  ceiling_height?: string;
  hide?: string[];
  verifications?: string[];
  min_kitchen?: string;
  max_kitchen?: string;
  description_keywords?: string;
};

export default function RealEstateFullFilter({
  open,
  onClose,
  filters,
  setFilters,
  totalCount,
  onApply,
  onShowMap,
}: {
  open: boolean;
  onClose: () => void;
  filters: RealEstateFiltersV2;
  setFilters: (f: RealEstateFiltersV2) => void;
  totalCount?: number;
  onApply: () => void;
  onShowMap?: () => void;
}) {
  const [locOpen, setLocOpen] = useState(false);
  const F = filters;

  const set = <K extends keyof RealEstateFiltersV2>(k: K, v: RealEstateFiltersV2[K]) => setFilters({ ...F, [k]: v });
  const toggleArr = (key: keyof RealEstateFiltersV2, val: string) => {
    const arr = ((F[key] as string[]) || []);
    set(key, (arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]) as any);
  };
  const toggleRoom = (n: number) => set('rooms', F.rooms.includes(n) ? F.rooms.filter((x) => x !== n) : [...F.rooms, n]);

  if (!open) return null;

  const totalLoc = F.districts.length + F.metros.length + F.landmarks.length;
  const locLabel = totalLoc === 0 ? 'Rayon, metro, nişangah seçin' :
    [...F.districts, ...F.metros, ...F.landmarks].slice(0, 2).join(', ') + (totalLoc > 2 ? ` +${totalLoc - 2}` : '');

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1c2128] rounded-t-3xl sm:rounded-2xl w-full max-w-[460px] flex flex-col shadow-2xl my-0 sm:my-8 min-h-[80vh] sm:min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — avito style */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-ink-100 dark:border-ink-700 sticky top-0 bg-white dark:bg-[#1c2128] z-10 rounded-t-3xl sm:rounded-t-2xl">
          <h2 className="text-2xl font-extrabold text-ink-900 dark:text-white">Bütün filtrlər</h2>
          <button onClick={onClose} className="w-9 h-9 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-full flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable body — geniş paddinq, hər bölmə clearly separated */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          <div className="grid grid-cols-2 gap-3">
            <select value={F.property_type}
              onChange={(e) => set('property_type', e.target.value)}
              className="bg-white dark:bg-ink-800 border border-ink-200 rounded-xl px-4 py-3 text-base font-medium">
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={F.deal_type}
              onChange={(e) => set('deal_type', e.target.value as any)}
              className="bg-white dark:bg-ink-800 border border-ink-200 rounded-xl px-4 py-3 text-base font-medium">
              <option value="sale">Alış</option>
              <option value="rent">Kirayə</option>
            </select>
          </div>

          {F.property_type === 'menzil' && (
            <div className="flex gap-2 flex-wrap">
              {[
                { v: '',    label: 'Hamısı' },
                { v: 'old', label: 'Köhnə tikili' },
                { v: 'new', label: 'Yeni tikili' },
              ].map((o) => (
                <button key={o.v}
                  onClick={() => set('building_type', o.v)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    F.building_type === o.v ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                  }`}>{o.label}</button>
              ))}
            </div>
          )}

          <Section title="Otaq sayı">
            <div className="space-y-2">
              {ROOM_OPTIONS.map((r) => (
                <Check key={r.value} label={r.label}
                  checked={F.rooms.includes(Number(r.value))}
                  onChange={() => toggleRoom(Number(r.value))} />
              ))}
            </div>
          </Section>

          <Section title="Qiymət, ₼">
            <Range min={F.min_price} max={F.max_price} onMin={(v) => set('min_price', v)} onMax={(v) => set('max_price', v)} />
            <div className="mt-3 space-y-2">
              <Check label="İpoteka mümkündür" checked={F.has_ipoteka} onChange={(v) => set('has_ipoteka', v)} />
              <Check label="Yenicə endirilib" checked={F.recently_dropped} onChange={(v) => set('recently_dropped', v)} />
            </div>
          </Section>

          <Section title="Qiymət ₼/m²">
            <Range min={F.min_price_sqm} max={F.max_price_sqm} onMin={(v) => set('min_price_sqm', v)} onMax={(v) => set('max_price_sqm', v)} />
          </Section>

          <Section title="Yerləşmə">
            <button
              onClick={() => setLocOpen(true)}
              className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-left text-base hover:border-tap flex items-center gap-2">
              <MapPin className="w-4 h-4 text-tap" />
              <span className={`flex-1 truncate ${totalLoc > 0 ? 'text-ink-900 dark:text-white font-medium' : 'text-ink-500'}`}>
                {locLabel}
              </span>
            </button>
          </Section>

          <Section title="Yoxlamalar sizin üçün" info>
            <div className="space-y-2">
              {VERIFICATIONS.map((v) => (
                <Check key={v.value} label={v.label}
                  checked={(F.verifications || []).includes(v.value)}
                  onChange={() => toggleArr('verifications', v.value)} />
              ))}
            </div>
          </Section>

          <Section title="Ümumi sahə, m²">
            <Range min={F.min_area} max={F.max_area} onMin={(v) => set('min_area', v)} onMax={(v) => set('max_area', v)} />
          </Section>

          <Section title="Mərtəbə">
            <Range min={F.min_floor} max={F.max_floor} onMin={(v) => set('min_floor', v)} onMax={(v) => set('max_floor', v)} />
            <div className="mt-3 space-y-2">
              <Check label="1-ci olmasın" checked={F.not_first_floor} onChange={(v) => set('not_first_floor', v)} />
              <Check label="Sonuncu olmasın" checked={F.not_last_floor} onChange={(v) => set('not_last_floor', v)} />
              <Check label="Yalnız sonuncu" checked={F.only_last_floor} onChange={(v) => set('only_last_floor', v)} />
            </div>
          </Section>

          <Section title="Mənzil tipi" info>
            <div className="space-y-2">
              {HOUSING_TYPES.map((h) => (
                <Check key={h.value} label={h.label}
                  checked={F.housing_type === h.value}
                  onChange={(v) => set('housing_type', v ? h.value : '')} />
              ))}
            </div>
          </Section>

          <Section title="Satıcılar">
            <div className="space-y-2">
              {SELLER_TYPES.map((s) => (
                <Check key={s.value} label={s.label}
                  checked={F.seller_type === s.value}
                  onChange={(v) => set('seller_type', v ? s.value : '')} />
              ))}
            </div>
          </Section>

          <Section title="Əlaqə üsulları">
            <Segmented options={CONTACT_METHODS} value={F.contact_method || ''} onChange={(v) => set('contact_method', v)} />
          </Section>

          <Section title="Satış üsulu">
            <Segmented options={SALE_METHODS} value={F.sale_method || ''} onChange={(v) => set('sale_method', v)} />
          </Section>

          <Section title="Elanları gizlət">
            <div className="space-y-2">
              {HIDE_OPTIONS.map((h) => (
                <Check key={h.value} label={h.label}
                  checked={(F.hide || []).includes(h.value)}
                  onChange={() => toggleArr('hide', h.value)} />
              ))}
            </div>
          </Section>

          <Section title="Sanitar düyün">
            <div className="space-y-2">
              {BATHROOM_TYPES.map((b) => (
                <Check key={b.value} label={b.label}
                  checked={F.bathroom === b.value}
                  onChange={(v) => set('bathroom', v ? b.value : '')} />
              ))}
            </div>
          </Section>

          <Section title="Pəncərələr">
            <div className="space-y-2">
              {WINDOW_DIRECTIONS.map((w) => (
                <Check key={w.value} label={w.label}
                  checked={(F.windows || []).includes(w.value)}
                  onChange={() => toggleArr('windows', w.value)} />
              ))}
            </div>
          </Section>

          <Section title="Bina inşa ili">
            <Range min={F.building_year_from} max={F.building_year_to}
              onMin={(v) => set('building_year_from', v)} onMax={(v) => set('building_year_to', v)} />
          </Section>

          <Section title="Binadakı mərtəbə sayı">
            <input
              type="number" placeholder="məs. 9"
              value={F.building_floors ?? ''}
              onChange={(e) => set('building_floors', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base"
            />
          </Section>

          <Section title="Bina tipi">
            <div className="space-y-2">
              {HOUSE_TYPES.map((h) => (
                <Check key={h} label={h}
                  checked={F.house_type === h}
                  onChange={(v) => set('house_type', v ? h : '')} />
              ))}
            </div>
          </Section>

          <Section title="Lift">
            <div className="space-y-2">
              {LIFT_TYPES.map((l) => (
                <Check key={l.value} label={l.label}
                  checked={F.lift_type === l.value}
                  onChange={(v) => set('lift_type', v ? l.value : '')} />
              ))}
            </div>
          </Section>

          <Section title="Parking">
            <div className="space-y-2">
              {PARKING_TYPES.map((p) => (
                <Check key={p.value} label={p.label}
                  checked={F.parking_type === p.value}
                  onChange={(v) => set('parking_type', v ? p.value : '')} />
              ))}
            </div>
          </Section>

          <Section title="Təsvirdə açar söz">
            <input
              type="text"
              placeholder="vacib olan nədir?"
              value={F.description_keywords ?? ''}
              onChange={(e) => set('description_keywords', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base"
            />
          </Section>

          <Section title="Təmir">
            <div className="space-y-2">
              {REPAIR_TYPES.filter((r) => r.value).map((r) => (
                <Check key={r.value} label={r.label}
                  checked={F.repair === r.value}
                  onChange={(v) => set('repair', v ? r.value : '')} />
              ))}
            </div>
          </Section>

          <Section title="Mətbəx sahəsi">
            <Range min={F.min_kitchen} max={F.max_kitchen}
              onMin={(v) => set('min_kitchen', v)} onMax={(v) => set('max_kitchen', v)} />
          </Section>

          <Section title="Otaq düzümü">
            <div className="space-y-2">
              {ROOM_LAYOUT.map((r) => (
                <Check key={r.value} label={r.label}
                  checked={F.room_layout === r.value}
                  onChange={(v) => set('room_layout', v ? r.value : '')} />
              ))}
            </div>
          </Section>

          <Section title="Balkon və ya lojiya">
            <div className="space-y-2">
              {BALCONY_TYPES.map((b) => (
                <Check key={b.value} label={b.label}
                  checked={(F.balcony_types || []).includes(b.value)}
                  onChange={() => toggleArr('balcony_types', b.value)} />
              ))}
            </div>
          </Section>

          <Section title="Tavan hündürlüyü, m">
            <div className="space-y-2">
              {CEILING_HEIGHTS.map((c) => (
                <Check key={c.value} label={c.label}
                  checked={F.ceiling_height === c.value}
                  onChange={(v) => set('ceiling_height', v ? c.value : '')} />
              ))}
            </div>
          </Section>

          <Section title="Sənəd növü">
            <select value={F.doc_type ?? ''} onChange={(e) => set('doc_type', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base">
              <option value="">Hamısı</option>
              {DOC_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Section>

          <Section title="Elan nömrəsi">
            <input type="text" placeholder="123456"
              value={F.listing_id ?? ''}
              onChange={(e) => set('listing_id', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base" />
          </Section>
        </div>

        {/* Sticky footer — avito-style göy düymə + "Xəritədə" outline */}
        <footer className="border-t border-ink-100 dark:border-ink-700 px-6 py-4 flex gap-3 bg-white dark:bg-[#1c2128] rounded-b-3xl sm:rounded-b-2xl sticky bottom-0">
          <button
            onClick={() => { onApply(); onClose(); }}
            className="flex-1 py-3.5 bg-tap text-white rounded-xl font-semibold hover:opacity-90 transition"
          >
            {totalCount != null ? `${totalCount.toLocaleString('az-AZ')}+ elan göstər` : 'Tətbiq et'}
          </button>
          {onShowMap && (
            <button
              onClick={() => { onShowMap(); onClose(); }}
              className="px-5 py-3.5 bg-white dark:bg-ink-800 text-ink-900 dark:text-white border border-ink-300 rounded-xl font-semibold hover:bg-ink-50 transition flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" /> Xəritədə
            </button>
          )}
        </footer>

        <LocationPicker
          open={locOpen}
          onClose={() => setLocOpen(false)}
          selected={{ districts: F.districts, metros: F.metros, landmarks: F.landmarks }}
          onApply={(s) => setFilters({ ...F, districts: s.districts, metros: s.metros, landmarks: s.landmarks })}
        />
      </div>
    </div>
  );
}

// ===== Sub-komponentlər (avito-style) =====

function Section({ title, children, info }: { title: string; children: React.ReactNode; info?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-bold text-ink-900 dark:text-white mb-3 text-base">
        {title}
        {info && <Info className="w-3.5 h-3.5 text-ink-400" />}
      </div>
      {children}
    </div>
  );
}

function Check({ checked, onChange, label }: { checked?: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-0.5 select-none">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-[18px] h-[18px] rounded border-ink-300 text-tap focus:ring-tap accent-tap"
      />
      <span className="text-base text-ink-900 dark:text-white">{label}</span>
    </label>
  );
}

function Range({ min, max, onMin, onMax }: { min?: string; max?: string; onMin: (v: string) => void; onMax: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <input
        type="number" placeholder="min"
        value={min ?? ''} onChange={(e) => onMin(e.target.value)}
        className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base placeholder-ink-400"
      />
      <input
        type="number" placeholder="max"
        value={max ?? ''} onChange={(e) => onMax(e.target.value)}
        className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base placeholder-ink-400"
      />
    </div>
  );
}

function Segmented({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex bg-ink-100 dark:bg-ink-800 rounded-xl p-1">
      {options.map((o) => (
        <button key={o.value}
          onClick={() => onChange(value === o.value ? '' : o.value)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            value === o.value ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-white shadow' : 'text-ink-600 dark:text-ink-300'
          }`}>{o.label}</button>
      ))}
    </div>
  );
}
