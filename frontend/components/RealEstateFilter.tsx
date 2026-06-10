'use client';
import { useState } from 'react';
import {
  MapPin, X, Home, Building, ChevronDown, ChevronUp, Sparkles,
  CheckSquare, Square, ArrowDownToLine, TrendingDown,
} from 'lucide-react';
import LocationPicker from './LocationPicker';
import {
  PROPERTY_TYPES, BUILDING_TYPES, REPAIR_TYPES, BUILDING_MATERIALS, DOC_TYPES,
  FURNITURE_OPTIONS, APPLIANCES, NEARBY_POI, SELLER_TYPES, RENT_PERIOD, COMMISSION, DEPOSIT,
} from '@/lib/realestate-data';

export type RealEstateFilters = {
  // Tip
  deal_type: 'sale' | 'rent';
  property_type: string;
  building_type: string;
  rent_period?: string;
  // Məkan
  districts: string[];
  metros: string[];
  landmarks: string[];
  // Qiymət
  min_price?: string;
  max_price?: string;
  min_price_sqm?: string;
  max_price_sqm?: string;
  has_ipoteka?: boolean;
  has_kreditka?: boolean;
  has_cixaris?: boolean;
  // Otaq və sahə
  rooms: number[];
  min_area?: string;
  max_area?: string;
  // Mərtəbə
  min_floor?: string;
  max_floor?: string;
  not_first_floor?: boolean;
  not_last_floor?: boolean;
  only_last_floor?: boolean;
  building_floors?: string;
  // Bina
  building_year_from?: string;
  building_year_to?: string;
  material?: string;
  repair: string;
  // Təchizat
  furniture?: string;
  appliances: string[];
  has_balcony?: boolean;
  has_parking?: boolean;
  has_lift?: boolean;
  // Yaxınlıqda
  nearby: string[];
  nearby_radius?: string;
  // Satıcı / kirayə
  seller_type?: string;
  commission?: string;
  deposit?: string;
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  // Media
  with_video?: boolean;
  with_360?: boolean;
  // Saqi
  doc_type?: string;
  listing_id?: string;
  // Sıralama
  recently_dropped?: boolean;
};

const DEFAULT: RealEstateFilters = {
  deal_type: 'sale',
  property_type: 'menzil',
  building_type: '',
  districts: [], metros: [], landmarks: [],
  rooms: [],
  repair: '',
  appliances: [],
  nearby: [],
};

export default function RealEstateFilter({
  filters,
  setFilters,
  totalCount,
  onApply,
}: {
  filters: RealEstateFilters;
  setFilters: (f: RealEstateFilters) => void;
  totalCount?: number;
  onApply?: () => void;
}) {
  const [locOpen, setLocOpen] = useState(false);
  const [advOpen, setAdvOpen] = useState(false);

  const F = { ...DEFAULT, ...filters };

  const set = <K extends keyof RealEstateFilters>(k: K, v: RealEstateFilters[K]) => {
    setFilters({ ...F, [k]: v });
  };
  const toggleRoom = (n: number) => {
    set('rooms', F.rooms.includes(n) ? F.rooms.filter((x) => x !== n) : [...F.rooms, n]);
  };
  const toggleApp = (a: string) => {
    set('appliances', F.appliances.includes(a) ? F.appliances.filter((x) => x !== a) : [...F.appliances, a]);
  };
  const toggleNearby = (n: string) => {
    set('nearby', F.nearby.includes(n) ? F.nearby.filter((x) => x !== n) : [...F.nearby, n]);
  };
  const reset = () => setFilters(DEFAULT);

  const totalLoc = F.districts.length + F.metros.length + F.landmarks.length;
  const locLabel = totalLoc === 0 ? 'Bütün Bakı' :
    [...F.districts, ...F.metros, ...F.landmarks].slice(0, 2).join(', ') +
    (totalLoc > 2 ? ` +${totalLoc - 2}` : '');

  return (
    <div className="card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-ink-900 flex items-center gap-2">
          <Home className="w-5 h-5 text-tap" /> Daşınmaz əmlak filtri
        </h3>
        <button onClick={reset} className="text-xs text-ink-500 hover:text-red-600">Sıfırla</button>
      </div>

      {/* 1. Alqı / Kirayə */}
      <div>
        <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Əməliyyat növü</div>
        <div className="flex bg-ink-100 rounded-lg p-1">
          {(['sale', 'rent'] as const).map((t) => (
            <button
              key={t}
              onClick={() => set('deal_type', t)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                F.deal_type === t ? 'bg-white text-tap shadow' : 'text-ink-600'
              }`}
            >
              {t === 'sale' ? 'Alqı-satqı' : 'Kirayə'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Əmlak növü */}
      <div>
        <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Əmlak növü</div>
        <div className="grid grid-cols-3 gap-1.5">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => set('property_type', t.value)}
              className={`px-2 py-2 rounded-lg border text-xs font-semibold transition ${
                F.property_type === t.value
                  ? 'bg-tap text-white border-tap'
                  : 'border-ink-200 hover:border-tap'
              }`}
            >
              <div className="text-base">{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Məkan */}
      <div>
        <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Məkan</div>
        <button
          onClick={() => setLocOpen(true)}
          className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-left text-sm hover:border-tap flex items-center justify-between"
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-tap shrink-0" />
            <span className={`truncate ${totalLoc > 0 ? 'text-ink-900 font-medium' : 'text-ink-500'}`}>
              {locLabel}
            </span>
          </span>
          <ChevronDown className="w-4 h-4 text-ink-400 shrink-0" />
        </button>
      </div>

      {/* 4. Tikilinin növü */}
      {F.property_type === 'menzil' && (
        <div>
          <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Tikilinin növü</div>
          <div className="flex gap-1.5">
            {BUILDING_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => set('building_type', F.building_type === t.value ? '' : t.value)}
                className={`flex-1 px-2 py-2 rounded-lg border text-xs font-semibold transition ${
                  F.building_type === t.value ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Qiymət */}
      <div>
        <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Qiymət, ₼</div>
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="number" placeholder="min" value={F.min_price ?? ''}
            onChange={(e) => set('min_price', e.target.value)}
            className="input !py-2 !text-sm"
          />
          <input
            type="number" placeholder="max" value={F.max_price ?? ''}
            onChange={(e) => set('max_price', e.target.value)}
            className="input !py-2 !text-sm"
          />
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <Chip active={F.has_cixaris} onClick={() => set('has_cixaris', !F.has_cixaris)}>Çıxarış var</Chip>
          <Chip active={F.has_ipoteka} onClick={() => set('has_ipoteka', !F.has_ipoteka)}>İpoteka var</Chip>
          <Chip active={F.recently_dropped} onClick={() => set('recently_dropped', !F.recently_dropped)} icon={<TrendingDown className="w-3 h-3" />}>
            Yenicə endirilib
          </Chip>
        </div>
      </div>

      {/* 6. Otaq sayı (mənzil) */}
      {(F.property_type === 'menzil' || F.property_type === 'hayat-evi') && (
        <div>
          <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Otaq sayı</div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => toggleRoom(n)}
                className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${
                  F.rooms.includes(n) ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
                }`}
              >
                {n === 5 ? '5+' : n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. Saha */}
      <div>
        <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Saha (m²)</div>
        <div className="grid grid-cols-2 gap-1.5">
          <input type="number" placeholder="min" value={F.min_area ?? ''}
            onChange={(e) => set('min_area', e.target.value)} className="input !py-2 !text-sm" />
          <input type="number" placeholder="max" value={F.max_area ?? ''}
            onChange={(e) => set('max_area', e.target.value)} className="input !py-2 !text-sm" />
        </div>
      </div>

      {/* 8. Mərtəbə */}
      {F.property_type === 'menzil' && (
        <div>
          <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Mərtəbə</div>
          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
            <input type="number" placeholder="min" value={F.min_floor ?? ''}
              onChange={(e) => set('min_floor', e.target.value)} className="input !py-2 !text-sm" />
            <input type="number" placeholder="max" value={F.max_floor ?? ''}
              onChange={(e) => set('max_floor', e.target.value)} className="input !py-2 !text-sm" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={F.not_first_floor} onClick={() => set('not_first_floor', !F.not_first_floor)}>1-ci olmasın</Chip>
            <Chip active={F.not_last_floor} onClick={() => set('not_last_floor', !F.not_last_floor)}>Ən üst olmasın</Chip>
            <Chip active={F.only_last_floor} onClick={() => set('only_last_floor', !F.only_last_floor)}>Yalnız ən üst</Chip>
          </div>
        </div>
      )}

      {/* 9. Təmir */}
      <div>
        <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Təmir</div>
        <div className="flex flex-wrap gap-1.5">
          {REPAIR_TYPES.map((r) => (
            <button key={r.value}
              onClick={() => set('repair', r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                F.repair === r.value ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
              }`}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* Ətraflı axtarış (toggle) */}
      <button
        onClick={() => setAdvOpen(!advOpen)}
        className="w-full py-2 border-2 border-dashed border-tap/30 rounded-lg text-tap font-bold text-sm flex items-center justify-center gap-2 hover:bg-tap-50"
      >
        {advOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Ətraflı axtarış (20+ filter)
        <Sparkles className="w-3.5 h-3.5" />
      </button>

      {advOpen && (
        <div className="space-y-4 pt-2 border-t border-ink-200">
          {/* Bina yaşı */}
          <div>
            <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Bina yaşı (il)</div>
            <div className="grid grid-cols-2 gap-1.5">
              <input type="number" placeholder="min" value={F.building_year_from ?? ''}
                onChange={(e) => set('building_year_from', e.target.value)} className="input !py-2 !text-sm" />
              <input type="number" placeholder="max" value={F.building_year_to ?? ''}
                onChange={(e) => set('building_year_to', e.target.value)} className="input !py-2 !text-sm" />
            </div>
          </div>

          {/* Tikinti materialı */}
          <div>
            <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Tikinti materialı</div>
            <select value={F.material ?? ''} onChange={(e) => set('material', e.target.value)} className="input !py-2 !text-sm">
              <option value="">Hamısı</option>
              {BUILDING_MATERIALS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Eyvan/parking/lift */}
          <div className="flex flex-wrap gap-1.5">
            <Chip active={F.has_balcony} onClick={() => set('has_balcony', !F.has_balcony)}>🪟 Eyvan/Balkon</Chip>
            <Chip active={F.has_parking} onClick={() => set('has_parking', !F.has_parking)}>🅿️ Parking</Chip>
            <Chip active={F.has_lift} onClick={() => set('has_lift', !F.has_lift)}>🛗 Lift</Chip>
          </div>

          {/* Mebel */}
          <div>
            <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Mebel</div>
            <div className="flex gap-1.5">
              {FURNITURE_OPTIONS.map((o) => (
                <button key={o.value}
                  onClick={() => set('furniture', F.furniture === o.value ? '' : o.value)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold border ${
                    F.furniture === o.value ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
                  }`}>{o.label}</button>
              ))}
            </div>
          </div>

          {/* Avadanlıq */}
          <div>
            <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Avadanlıq</div>
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto pr-1">
              {APPLIANCES.map((a) => {
                const on = F.appliances.includes(a);
                return (
                  <button key={a} onClick={() => toggleApp(a)}
                    className={`flex items-center gap-1.5 text-xs py-1 px-1.5 rounded hover:bg-ink-50 text-left ${on ? 'text-tap font-semibold' : 'text-ink-700'}`}>
                    {on ? <CheckSquare className="w-3.5 h-3.5 text-tap" /> : <Square className="w-3.5 h-3.5 text-ink-300" />}
                    <span className="truncate">{a}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Yaxınlıqda */}
          <div>
            <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">
              Yaxınlıqda <span className="font-normal lowercase">({F.nearby_radius || 500}m radiusunda)</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {NEARBY_POI.map((p) => (
                <button key={p.value} onClick={() => toggleNearby(p.value)}
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    F.nearby.includes(p.value) ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
                  }`}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
            {F.nearby.length > 0 && (
              <input
                type="range" min="100" max="3000" step="100"
                value={F.nearby_radius || '500'}
                onChange={(e) => set('nearby_radius', e.target.value)}
                className="w-full"
              />
            )}
          </div>

          {/* Satıcı */}
          <div>
            <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Satıcı</div>
            <div className="flex flex-wrap gap-1.5">
              {SELLER_TYPES.map((s) => (
                <button key={s.value}
                  onClick={() => set('seller_type', F.seller_type === s.value ? '' : s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    F.seller_type === s.value ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
                  }`}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Kirayə-ə özgu */}
          {F.deal_type === 'rent' && (
            <>
              <div>
                <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Kirayə müddəti</div>
                <div className="flex gap-1.5">
                  {RENT_PERIOD.map((p) => (
                    <button key={p.value}
                      onClick={() => set('rent_period', F.rent_period === p.value ? '' : p.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                        F.rent_period === p.value ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
                      }`}>{p.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Komissiya</div>
                <div className="flex gap-1.5">
                  {COMMISSION.map((c) => (
                    <button key={c.value}
                      onClick={() => set('commission', F.commission === c.value ? '' : c.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                        F.commission === c.value ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
                      }`}>{c.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Depozit</div>
                <div className="flex gap-1.5">
                  {DEPOSIT.map((d) => (
                    <button key={d.value}
                      onClick={() => set('deposit', F.deposit === d.value ? '' : d.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                        F.deposit === d.value ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
                      }`}>{d.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Chip active={F.pets_allowed} onClick={() => set('pets_allowed', !F.pets_allowed)}>🐶 Heyvanla olar</Chip>
                <Chip active={F.smoking_allowed} onClick={() => set('smoking_allowed', !F.smoking_allowed)}>🚬 Siqaret olar</Chip>
              </div>
            </>
          )}

          {/* Media */}
          <div className="flex flex-wrap gap-1.5">
            <Chip active={F.with_video} onClick={() => set('with_video', !F.with_video)}>🎥 Video var</Chip>
            <Chip active={F.with_360} onClick={() => set('with_360', !F.with_360)}>🌐 360° tur</Chip>
          </div>

          {/* Sənəd */}
          <div>
            <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Sənəd növü</div>
            <select value={F.doc_type ?? ''} onChange={(e) => set('doc_type', e.target.value)} className="input !py-2 !text-sm">
              <option value="">Hamısı</option>
              {DOC_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          {/* Elan nömrəsi */}
          <div>
            <div className="text-xs font-bold text-ink-500 uppercase mb-1.5">Elan nömrəsi</div>
            <input type="text" placeholder="123456" value={F.listing_id ?? ''}
              onChange={(e) => set('listing_id', e.target.value)} className="input !py-2 !text-sm" />
          </div>
        </div>
      )}

      {/* Apply */}
      <button onClick={onApply} className="btn-tap w-full">
        {totalCount != null ? `${totalCount.toLocaleString('az-AZ')} elan göstər` : 'Axtar'}
      </button>

      <LocationPicker
        open={locOpen}
        onClose={() => setLocOpen(false)}
        selected={{ districts: F.districts, metros: F.metros, landmarks: F.landmarks }}
        onApply={(s) => {
          setFilters({ ...F, districts: s.districts, metros: s.metros, landmarks: s.landmarks });
        }}
      />
    </div>
  );
}

function Chip({ active, onClick, children, icon }: { active?: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
        active ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap text-ink-700'
      }`}>
      {icon}
      {children}
    </button>
  );
}
