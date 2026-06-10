'use client';
import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { api } from '@/lib/api';
import type { FiltersState } from './FilterSidebar';

export default function UniversalFullFilter({
  open,
  onClose,
  filters,
  setFilters,
  totalCount,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  filters: FiltersState;
  setFilters: (f: FiltersState) => void;
  totalCount?: number;
  onApply: () => void;
}) {
  const [cats, setCats] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    api<any>('/categories').then((d) => setCats(Array.isArray(d) ? d : (d.categories || d.items || []))).catch(() => setCats([]));
    api<any>('/cities').then((d) => setCities(Array.isArray(d) ? d : (d.cities || d.items || []))).catch(() => setCities([]));
  }, [open]);

  const F = filters;
  const set = (k: keyof FiltersState, v: any) => setFilters({ ...F, [k]: v });
  const reset = () => setFilters({
    q: '', category: '', city: '', min_price: '', max_price: '',
    condition: '', sort: 'new',
    has_delivery: '', has_credit: '', has_barter: '',
    with_photo: '', only_shops: '',
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1c2128] rounded-t-3xl sm:rounded-2xl w-full max-w-[460px] flex flex-col shadow-2xl my-0 sm:my-8 min-h-[80vh] sm:min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-ink-100 dark:border-ink-700 sticky top-0 bg-white dark:bg-[#1c2128] z-10 rounded-t-3xl sm:rounded-t-2xl">
          <h2 className="text-2xl font-extrabold text-ink-900 dark:text-white">Bütün filtrlər</h2>
          <button onClick={onClose} className="w-9 h-9 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-full flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          {/* Açar söz */}
          <Section title="Açar söz">
            <input
              type="text"
              placeholder="məs: 'iPhone 14', 'BMW X5'"
              value={F.q ?? ''}
              onChange={(e) => set('q', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base"
            />
          </Section>

          {/* Kateqoriya */}
          <Section title="Kateqoriya">
            <select value={F.category} onChange={(e) => set('category', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base">
              <option value="">Bütün kateqoriyalar</option>
              {cats.map((c) => <option key={c.slug || c.id} value={c.slug || c.id}>{c.name_az || c.name}</option>)}
            </select>
          </Section>

          {/* Şəhər */}
          <Section title="Şəhər">
            <select value={F.city} onChange={(e) => set('city', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base">
              <option value="">Bütün şəhərlər</option>
              {cities.map((c) => <option key={c.slug || c.id} value={c.slug || c.id}>{c.name_az || c.name}</option>)}
            </select>
          </Section>

          {/* Qiymət */}
          <Section title="Qiymət, ₼">
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="min" value={F.min_price ?? ''}
                onChange={(e) => set('min_price', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base" />
              <input type="number" placeholder="max" value={F.max_price ?? ''}
                onChange={(e) => set('max_price', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base" />
            </div>
          </Section>

          {/* Vəziyyət */}
          <Section title="Vəziyyət">
            <div className="space-y-2">
              {[
                { v: 'new', label: 'Yeni' },
                { v: 'like_new', label: 'Az işlənmiş' },
                { v: 'used', label: 'İşlənmiş' },
              ].map((o) => (
                <Check key={o.v} label={o.label}
                  checked={F.condition === o.v}
                  onChange={(v) => set('condition', v ? o.v : '')} />
              ))}
            </div>
          </Section>

          {/* Əlavə */}
          <Section title="Əlavə imkanlar">
            <div className="space-y-2">
              <Check label="Çatdırılma var" checked={!!F.has_delivery} onChange={(v) => set('has_delivery', v ? '1' : '')} />
              <Check label="Kredit imkanı" checked={!!F.has_credit} onChange={(v) => set('has_credit', v ? '1' : '')} />
              <Check label="Barter olar" checked={!!F.has_barter} onChange={(v) => set('has_barter', v ? '1' : '')} />
              <Check label="Yalnız şəkilli elanlar" checked={!!F.with_photo} onChange={(v) => set('with_photo', v ? '1' : '')} />
              <Check label="Yalnız mağazalardan" checked={!!F.only_shops} onChange={(v) => set('only_shops', v ? '1' : '')} />
            </div>
          </Section>

          {/* Sıralama */}
          <Section title="Sıralama">
            <select value={F.sort} onChange={(e) => set('sort', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-ink-800 border border-ink-200 rounded-xl text-base">
              <option value="new">Yenilərinə görə</option>
              <option value="price_asc">Əvvəl ucuz</option>
              <option value="price_desc">Əvvəl baha</option>
              <option value="popular">Daha populyar</option>
            </select>
          </Section>
        </div>

        <footer className="border-t border-ink-100 dark:border-ink-700 px-6 py-4 flex gap-3 bg-white dark:bg-[#1c2128] rounded-b-3xl sm:rounded-b-2xl sticky bottom-0">
          <button onClick={reset} className="px-5 py-3.5 bg-ink-100 dark:bg-ink-700 text-ink-900 dark:text-white rounded-xl font-semibold">
            Sıfırla
          </button>
          <button onClick={() => { onApply(); onClose(); }} className="flex-1 py-3.5 bg-tap text-white rounded-xl font-semibold hover:opacity-90">
            {totalCount != null ? `${totalCount.toLocaleString('az-AZ')}+ elan göstər` : 'Tətbiq et'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-bold text-ink-900 dark:text-white mb-3 text-base">{title}</div>
      {children}
    </div>
  );
}

function Check({ checked, onChange, label }: { checked?: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-0.5 select-none">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)}
        className="w-[18px] h-[18px] rounded border-ink-300 text-tap focus:ring-tap accent-tap" />
      <span className="text-base text-ink-900 dark:text-white">{label}</span>
    </label>
  );
}
