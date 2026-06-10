'use client';
import { X } from 'lucide-react';
import RealEstateFilter, { type RealEstateFilters } from './RealEstateFilter';

export default function RealEstateAdvancedModal({
  open,
  onClose,
  filters,
  setFilters,
  totalCount,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  filters: RealEstateFilters;
  setFilters: (f: RealEstateFilters) => void;
  totalCount?: number;
  onApply: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c2128] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-5 border-b border-ink-200 sticky top-0 bg-white dark:bg-[#1c2128] z-10">
          <h2 className="text-xl font-bold">Ətraflı axtarış</h2>
          <button onClick={onClose} className="p-2 hover:bg-ink-100 rounded-lg"><X className="w-5 h-5" /></button>
        </header>
        <div className="overflow-y-auto p-4">
          <RealEstateFilter
            filters={filters}
            setFilters={setFilters}
            totalCount={totalCount}
            onApply={() => { onApply(); onClose(); }}
          />
        </div>
      </div>
    </div>
  );
}
