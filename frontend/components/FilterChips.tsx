'use client';
import { X } from 'lucide-react';

const LABELS: Record<string, string> = {
  q: 'Axtarış',
  category: 'Kateqoriya',
  city: 'Şəhər',
  min_price: 'Min ₼',
  max_price: 'Max ₼',
  condition: 'Vəziyyət',
  has_delivery: 'Çatdırılma',
  has_credit: 'Kredit',
  has_barter: 'Barter',
  with_photo: 'Foto ilə',
  only_shops: 'Mağazadan',
};

const CONDITION_LABELS: Record<string, string> = {
  new: 'Yeni', like_new: 'Az işlənmiş', used: 'İşlənmiş',
};

export default function FilterChips({
  filters, onRemove, onClearAll,
}: {
  filters: Record<string, string>;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}) {
  const active = Object.entries(filters).filter(([k, v]) => v && k !== 'sort');
  if (active.length === 0) return null;

  const formatValue = (k: string, v: string): string => {
    if (k === 'condition') return CONDITION_LABELS[v] || v;
    if (k.startsWith('attr_')) return `${k.replace('attr_', '').replace(/_min|_max/, '')}: ${v}`;
    if (k === 'has_delivery' || k === 'has_credit' || k === 'has_barter' || k === 'with_photo' || k === 'only_shops') {
      return v === 'true' ? '✓' : '';
    }
    return v;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      <span className="text-xs text-ink-500 font-semibold uppercase">Filtrlər:</span>
      {active.map(([k, v]) => {
        const formatted = formatValue(k, v);
        if (!formatted) return null;
        const label = k.startsWith('attr_') ? formatted : `${LABELS[k] || k}: ${formatted}`;
        return (
          <button
            key={k}
            onClick={() => onRemove(k)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-tap-50 text-tap-700 text-xs font-medium hover:bg-red-50 hover:text-red-600 transition group"
          >
            <span>{label}</span>
            <X className="w-3 h-3 group-hover:scale-110 transition" />
          </button>
        );
      })}
      {active.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-red-500 hover:underline font-semibold"
        >
          Hamısını sıfırla
        </button>
      )}
    </div>
  );
}
