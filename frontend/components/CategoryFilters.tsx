'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export type CatAttr = {
  key: string;
  labelAz: string;
  type: 'select' | 'number' | 'boolean' | 'text';
  options?: string[] | null;
  isFilterable?: boolean;
};

export default function CategoryFilters({ attributes }: { attributes: CatAttr[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const setAttr = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(`a_${key}`, value);
    else p.delete(`a_${key}`);
    p.delete('page');
    router.push(`/elanlar?${p.toString()}`);
  };

  // Filtrlənə bilən select(opsiyalı), number(range) və boolean atributlar
  const selects = attributes.filter(
    (a) => a.isFilterable !== false && a.type === 'select' && (a.options?.length ?? 0) > 0,
  );
  const numbers = attributes.filter((a) => a.isFilterable !== false && a.type === 'number');
  const bools = attributes.filter((a) => a.isFilterable !== false && a.type === 'boolean');

  if (selects.length === 0 && numbers.length === 0 && bools.length === 0) return null;

  return (
    <div className="card p-4 mb-6">
      <div className="flex flex-wrap gap-3 items-center">
        {selects.map((a) => (
          <select
            key={a.key}
            value={params.get(`a_${a.key}`) ?? ''}
            onChange={(e) => setAttr(a.key, e.target.value)}
            className="bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-900 dark:text-white outline-none focus:border-tap"
          >
            <option value="">{a.labelAz}: hamısı</option>
            {(a.options ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ))}

        {numbers.map((a) => (
          <div key={a.key} className="flex items-center gap-1.5">
            <span className="text-xs text-ink-500 dark:text-ink-400">{a.labelAz}:</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="min"
              defaultValue={params.get(`a_${a.key}_min`) ?? ''}
              onBlur={(e) => setAttr(`${a.key}_min`, e.target.value)}
              className="w-20 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-tap"
            />
            <span className="text-ink-400">—</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="max"
              defaultValue={params.get(`a_${a.key}_max`) ?? ''}
              onBlur={(e) => setAttr(`${a.key}_max`, e.target.value)}
              className="w-20 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-tap"
            />
          </div>
        ))}

        {bools.map((a) => {
          const on = params.get(`a_${a.key}`) === 'true';
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => setAttr(a.key, on ? '' : 'true')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                on
                  ? 'bg-tap text-white border-tap'
                  : 'bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-200 border-ink-200 dark:border-ink-700 hover:border-tap'
              }`}
            >
              {a.labelAz}
            </button>
          );
        })}
      </div>
    </div>
  );
}
