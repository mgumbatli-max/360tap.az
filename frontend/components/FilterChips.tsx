'use client';
import { X } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useResilientPush } from '@/lib/resilient-navigation';
import { dependentAttributeKeys } from '@/lib/attribute-taxonomy';

const LABELS: Record<string, string> = {
  q: 'Axtarış',
  category: 'Kateqoriya',
  vertical: 'Bölmə',
  region: 'Region',
  city: 'Şəhər',
  priceMin: 'Qiymət ≥',
  priceMax: 'Qiymət ≤',
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

const BOOL_KEYS = new Set([
  'has_delivery', 'has_credit', 'has_barter', 'with_photo', 'only_shops',
]);

/**
 * Görünüş/naviqasiya parametrləri çip kimi göstərilmir — onlar «filtr» deyil,
 * silinməsi də istifadəçi üçün mənasızdır (`sort` həmişə bir dəyərdədir).
 */
const HIDDEN_KEYS = new Set(['sort', 'page', 'limit', 'view']);

export default function FilterChips({
  filters, onRemove, onClearAll, keyLabels, valueLabels,
}: {
  filters: Record<string, string>;
  /** Verilmirsə komponent birbaşa URL üzərindən işləyir (server-render edilmiş səhifələr). */
  onRemove?: (key: string) => void;
  onClearAll?: () => void;
  /** `a_<key>` atributları üçün oxunaqlı adlar: `{ rooms: 'Otaq sayı' }`. */
  keyLabels?: Record<string, string>;
  /** Slug → ad tərcüməsi: `{ region: { baki: 'Bakı' } }`. */
  valueLabels?: Record<string, Record<string, string>>;
}) {
  // Atılan naviqasiyaya qarşı qoruma — bax `lib/resilient-navigation.ts`.
  const push = useResilientPush();
  const pathname = usePathname();
  const params = useSearchParams();

  const active = Object.entries(filters).filter(
    ([k, v]) => v && !HIDDEN_KEYS.has(k),
  );
  if (active.length === 0) return null;

  // Callback verilməyibsə URL tək həqiqət mənbəyidir — server komponentindən
  // funksiya ötürmək mümkün olmadığı üçün bu budaq lazımdır.
  const removeKey = (k: string) => {
    if (onRemove) return onRemove(k);
    const p = new URLSearchParams(params.toString());
    p.delete(k);
    // Valideyn atribut silinəndə ondan asılı olan da getməlidir (marka → model):
    // əks halda URL-də tək «Model: X» qalır və heç bir nəticə vermir.
    if (k.startsWith('a_')) {
      for (const dep of dependentAttributeKeys(k.slice(2))) p.delete(`a_${dep}`);
    }
    p.delete('page');
    const s = p.toString();
    push(s ? `${pathname}?${s}` : pathname);
  };

  const clearAll = () => {
    if (onClearAll) return onClearAll();
    const p = new URLSearchParams();
    // Kateqoriya səhifənin kimliyidir — «hamısını sıfırla» onu silməməlidir.
    for (const k of ['q', 'category', 'vertical']) {
      const v = params.get(k);
      if (v) p.set(k, v);
    }
    const s = p.toString();
    push(s ? `${pathname}?${s}` : pathname);
  };

  const chipLabel = (k: string, v: string): string => {
    if (k.startsWith('a_') || k.startsWith('attr_')) {
      const raw = k.replace(/^a_|^attr_/, '');
      const bound = raw.endsWith('_min') ? '≥' : raw.endsWith('_max') ? '≤' : '';
      const base = raw.replace(/_min$|_max$/, '');
      const name = keyLabels?.[base] ?? base;
      if (v === 'true') return name;
      return bound ? `${name} ${bound} ${v}` : `${name}: ${v}`;
    }
    if (BOOL_KEYS.has(k)) return v === 'true' ? (LABELS[k] ?? k) : '';
    const name = LABELS[k] ?? k;
    const shown =
      valueLabels?.[k]?.[v] ?? (k === 'condition' ? CONDITION_LABELS[v] ?? v : v);
    return `${name}: ${shown}`;
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {active.map(([k, v]) => {
        const label = chipLabel(k, v);
        if (!label) return null;
        return (
          <button
            key={k}
            type="button"
            onClick={() => removeKey(k)}
            aria-label={`${label} filtrini sil`}
            className="group inline-flex max-w-full items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1.5 text-[13px] font-medium text-ink-700 transition hover:bg-ink-200 hover:text-danger dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
          >
            <span className="truncate">{label}</span>
            <X className="h-3.5 w-3.5 shrink-0 opacity-60 transition group-hover:opacity-100" aria-hidden="true" />
          </button>
        );
      })}
      {active.length > 1 && (
        <button
          type="button"
          onClick={clearAll}
          className="rounded-full px-2 py-1.5 text-[13px] font-semibold text-ink-500 transition hover:text-danger dark:text-ink-400"
        >
          Hamısını sıfırla
        </button>
      )}
    </div>
  );
}
