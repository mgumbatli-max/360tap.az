'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, MapPin, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import type { FiltersState } from './FilterSidebar';
import { azNumber } from '@/lib/format';

export default function UniversalTopBar({
  filters,
  setFilters,
  onOpenAdvanced,
  totalCount,
}: {
  filters: FiltersState;
  setFilters: (f: FiltersState) => void;
  onOpenAdvanced: () => void;
  totalCount?: number;
}) {
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    api<any>('/categories').then((d) => setCats(Array.isArray(d) ? d : (d.categories || d.items || []))).catch(() => setCats([]));
    api<any>('/cities').then((d) => setCities(Array.isArray(d) ? d : (d.cities || d.items || []))).catch(() => setCities([]));
  }, []);

  // Daşınmaz əmlak kateqoriyaları → /emlak-a yönləndir
  const RE_CATS = ['menzil-satilir', 'menzil-kiraye', 'menzil', 'hayat-evi', 'ofis', 'qaraj', 'torpaq', 'obyekt', 'dasinmaz-emlak'];
  const onCatChange = (slug: string) => {
    if (RE_CATS.includes(slug)) {
      router.push(`/emlak?category=${slug}`);
      return;
    }
    setFilters({ ...filters, category: slug });
  };

  return (
    <div className="card p-3 sm:p-4 mb-4 sticky top-16 z-30 bg-white/95 backdrop-blur dark:bg-[#1c2128]/95">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Kateqoriya */}
        <select
          value={filters.category}
          onChange={(e) => onCatChange(e.target.value)}
          className="bg-white dark:bg-ink-800 border border-ink-200 rounded-xl px-3 py-2 text-sm font-medium min-w-[140px]"
        >
          <option value="">Bütün kateqoriyalar</option>
          {cats.map((c) => <option key={c.slug || c.id} value={c.slug || c.id}>{c.name_az || c.name}</option>)}
        </select>

        {/* Şəhər */}
        <select
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          className="bg-white dark:bg-ink-800 border border-ink-200 rounded-xl px-3 py-2 text-sm font-medium"
        >
          <option value="">Bütün şəhərlər</option>
          {cities.map((c) => <option key={c.slug || c.id} value={c.slug || c.id}>{c.name_az || c.name}</option>)}
        </select>

        {/* Qiymət */}
        <input
          type="number" placeholder="min ₼" value={filters.min_price}
          onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
          className="bg-white dark:bg-ink-800 border border-ink-200 rounded-xl px-3 py-2 text-sm w-24"
        />
        <input
          type="number" placeholder="max ₼" value={filters.max_price}
          onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
          className="bg-white dark:bg-ink-800 border border-ink-200 rounded-xl px-3 py-2 text-sm w-24"
        />

        {/* Vəziyyət */}
        <select
          value={filters.condition}
          onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
          className="bg-white dark:bg-ink-800 border border-ink-200 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Vəziyyət</option>
          <option value="new">Yeni</option>
          <option value="like_new">Az işlənmiş</option>
          <option value="used">İşlənmiş</option>
        </select>

        {/* Sıralama */}
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          className="bg-white dark:bg-ink-800 border border-ink-200 rounded-xl px-3 py-2 text-sm"
        >
          <option value="new">Yenilərinə görə</option>
          <option value="price_asc">Əvvəl ucuz</option>
          <option value="price_desc">Əvvəl baha</option>
          <option value="popular">Daha populyar</option>
        </select>

        {/* Ətraflı */}
        <button
          onClick={onOpenAdvanced}
          className="btn-secondary !py-2 !text-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> Ətraflı
        </button>

        {/* Sayğac */}
        <span className="text-sm text-ink-500 ml-auto">
          {totalCount != null && `${azNumber(totalCount)} elan`}
        </span>
      </div>

      {/* Sürətli chip-lər */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        <Chip active={!!filters.has_delivery} onClick={() => setFilters({ ...filters, has_delivery: filters.has_delivery ? '' : '1' })}>🚚 Çatdırılma</Chip>
        <Chip active={!!filters.has_credit} onClick={() => setFilters({ ...filters, has_credit: filters.has_credit ? '' : '1' })}>🏦 Kredit</Chip>
        <Chip active={!!filters.has_barter} onClick={() => setFilters({ ...filters, has_barter: filters.has_barter ? '' : '1' })}>🔄 Barter</Chip>
        <Chip active={!!filters.with_photo} onClick={() => setFilters({ ...filters, with_photo: filters.with_photo ? '' : '1' })}>📷 Şəkilli</Chip>
        <Chip active={!!filters.only_shops} onClick={() => setFilters({ ...filters, only_shops: filters.only_shops ? '' : '1' })}>🏪 Mağazalardan</Chip>
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
