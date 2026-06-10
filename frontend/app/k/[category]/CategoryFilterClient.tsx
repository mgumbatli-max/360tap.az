'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UniversalTopBar from '@/components/UniversalTopBar';
import UniversalFullFilter from '@/components/UniversalFullFilter';
import type { FiltersState } from '@/components/FilterSidebar';

export default function CategoryFilterClient({ category }: { category: string }) {
  const router = useRouter();
  const [advOpen, setAdvOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({
    q: '', category, city: '', min_price: '', max_price: '', condition: '',
    sort: 'new', has_delivery: '', has_credit: '', has_barter: '',
    with_photo: '', only_shops: '',
  });

  const applyAndGo = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v as string); });
    router.push(`/elanlar?${params.toString()}`);
  };

  return (
    <div className="mb-6">
      <UniversalTopBar
        filters={filters}
        setFilters={(f) => { setFilters(f); }}
        onOpenAdvanced={() => setAdvOpen(true)}
      />
      <div className="flex justify-end -mt-2">
        <button onClick={applyAndGo} className="btn-tap text-sm">
          Filtrlə bax →
        </button>
      </div>
      <UniversalFullFilter
        open={advOpen}
        onClose={() => setAdvOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={applyAndGo}
      />
    </div>
  );
}
