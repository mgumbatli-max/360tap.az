'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Sparkles, X } from 'lucide-react';
import DynamicFilters from './DynamicFilters';
import { azNumber } from '@/lib/format';

export type FiltersState = {
  q: string;
  category: string;
  city: string;
  min_price: string;
  max_price: string;
  condition: string;
  sort: string;
  has_delivery: string;
  has_credit: string;
  has_barter: string;
  with_photo: string;
  only_shops: string;
  [key: string]: string;
};

const SORT_OPTIONS = [
  { value: 'new', label: 'Yenilərinə görə' },
  { value: 'price_asc', label: 'Əvvəl ucuz' },
  { value: 'price_desc', label: 'Əvvəl baha' },
  { value: 'popular', label: 'Daha populyar' },
];

const CONDITION_OPTIONS = [
  { value: '', label: 'Hamısı' },
  { value: 'new', label: 'Yeni' },
  { value: 'like_new', label: 'Az işlənmiş' },
  { value: 'used', label: 'İşlənmiş' },
];

export default function FilterSidebar({
  filters,
  setFilters,
  onReset,
  totalCount,
}: {
  filters: FiltersState;
  setFilters: (f: FiltersState) => void;
  onReset: () => void;
  totalCount?: number;
}) {
  const [cities, setCities] = useState<{ slug: string; name_az: string }[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    api('/categories').then((d: any) => setCategories(d.categories || []));
    api('/cities').then((d: any) => setCities(d.cities || []));
  }, []);

  const update = (k: string, v: string) => setFilters({ ...filters, [k]: v });

  const activeCount = Object.entries(filters).filter(([k, v]) =>
    v && k !== 'sort' && k !== 'q'
  ).length;

  return (
    <aside className="card p-4 space-y-5 sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-ink-900">Filtrlər</h3>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-tap hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Sıfırla ({activeCount})
          </button>
        )}
      </div>

      {typeof totalCount === 'number' && (
        <div className="text-sm bg-tap-50 text-tap-700 px-3 py-2 rounded-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {azNumber(totalCount)} elan tapıldı
        </div>
      )}

      {/* Sort */}
      <div>
        <label className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-2 block">
          Sıralama
        </label>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((s) => (
            <label key={s.value} className="flex items-center gap-2 cursor-pointer text-sm hover:text-tap">
              <input
                type="radio"
                name="sort"
                value={s.value}
                checked={filters.sort === s.value}
                onChange={(e) => update('sort', e.target.value)}
                className="accent-tap"
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {/* Kateqoriya */}
      <div>
        <label className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-2 block">
          Kateqoriya
        </label>
        <select
          value={filters.category}
          onChange={(e) => update('category', e.target.value)}
          className="input"
        >
          <option value="">Bütün kateqoriyalar</option>
          {categories.map((c: any) => (
            <optgroup key={c.id} label={c.name_az}>
              <option value={c.slug}>{c.name_az}</option>
              {(c.children ?? []).map((s: any) => (
                <option key={s.id} value={s.slug}>
                  &nbsp;&nbsp;— {s.name_az}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Şəhər */}
      <div>
        <label className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-2 block">
          Şəhər
        </label>
        <select
          value={filters.city}
          onChange={(e) => update('city', e.target.value)}
          className="input"
        >
          <option value="">Bütün şəhərlər</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name_az}</option>
          ))}
        </select>
      </div>

      {/* Qiymət */}
      <div>
        <label className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-2 block">
          Qiymət, ₼
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="-dən"
            value={filters.min_price}
            onChange={(e) => update('min_price', e.target.value)}
            className="input"
          />
          <input
            type="number"
            placeholder="-ə"
            value={filters.max_price}
            onChange={(e) => update('max_price', e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Vəziyyət */}
      <div>
        <label className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-2 block">
          Vəziyyət
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CONDITION_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => update('condition', c.value)}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                filters.condition === c.value
                  ? 'bg-tap text-white border-tap'
                  : 'bg-white text-ink-700 border-ink-200 hover:border-tap'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Əlavə — Pro-only */}
      <div className="pt-3 border-t border-ink-200 space-y-2 text-sm" data-pro-only="true">
        <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Əlavə</p>
        <Toggle label="Çatdırılma var" value={filters.has_delivery === 'true'} onChange={(v) => update('has_delivery', v ? 'true' : '')} />
        <Toggle label="Foto ilə"        value={filters.with_photo === 'true'}   onChange={(v) => update('with_photo', v ? 'true' : '')} />
        <Toggle label="Yalnız mağazadan" value={filters.only_shops === 'true'}  onChange={(v) => update('only_shops', v ? 'true' : '')} />
        <Toggle label="Kredit mümkündür" value={filters.has_credit === 'true'}  onChange={(v) => update('has_credit', v ? 'true' : '')} />
        <Toggle label="Barter"           value={filters.has_barter === 'true'}  onChange={(v) => update('has_barter', v ? 'true' : '')} />
      </div>

      {/* Dinamik atributlar (kateqoriyaya görə) — Pro-only */}
      {filters.category && (
        <div data-pro-only="true">
          <DynamicFilters
            categorySlug={filters.category}
            values={filters as Record<string, string>}
            onChange={(k, v) => update(k, v)}
          />
        </div>
      )}
    </aside>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-tap w-4 h-4"
      />
      <span>{label}</span>
    </label>
  );
}
