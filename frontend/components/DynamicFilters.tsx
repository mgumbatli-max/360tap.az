'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Attr = {
  key: string;
  label_az: string;
  type: 'string' | 'number' | 'select' | 'multiselect' | 'boolean';
  options: { choices?: string[] } | null;
  unit: string | null;
  is_filterable: boolean;
};

export default function DynamicFilters({
  categorySlug,
  values,
  onChange,
}: {
  categorySlug: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const [attrs, setAttrs] = useState<Attr[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categorySlug) { setAttrs([]); return; }
    setLoading(true);
    api<{ attributes: Attr[] }>(`/categories/${categorySlug}/attributes`)
      .then((d) => setAttrs((d.attributes ?? []).filter((a) => a.is_filterable)))
      .catch(() => setAttrs([]))
      .finally(() => setLoading(false));
  }, [categorySlug]);

  if (!categorySlug || loading || attrs.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-ink-200">
      <p className="text-xs font-bold text-ink-500 uppercase tracking-wide">
        {categorySlug.replace(/-/g, ' ')} üzrə filtrlər
      </p>
      {attrs.map((a) => {
        const val = values[`attr_${a.key}`] ?? '';
        return (
          <div key={a.key}>
            <label className="text-xs font-semibold text-ink-700 mb-1.5 block">
              {a.label_az}{a.unit ? ` (${a.unit})` : ''}
            </label>

            {a.type === 'select' && a.options?.choices ? (
              <select className="input" value={val} onChange={(e) => onChange(`attr_${a.key}`, e.target.value)}>
                <option value="">Hamısı</option>
                {a.options.choices.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : a.type === 'number' ? (
              <div className="flex gap-2">
                <input
                  type="number" placeholder="-dən"
                  value={values[`attr_${a.key}_min`] ?? ''}
                  onChange={(e) => onChange(`attr_${a.key}_min`, e.target.value)}
                  className="input"
                />
                <input
                  type="number" placeholder="-ə"
                  value={values[`attr_${a.key}_max`] ?? ''}
                  onChange={(e) => onChange(`attr_${a.key}_max`, e.target.value)}
                  className="input"
                />
              </div>
            ) : a.type === 'boolean' ? (
              <div className="flex gap-1.5">
                {[
                  ['', 'Hamısı'],
                  ['true', 'Bəli'],
                  ['false', 'Xeyr'],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onChange(`attr_${a.key}`, v)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                      val === v ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
                    }`}
                  >{l}</button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={val}
                onChange={(e) => onChange(`attr_${a.key}`, e.target.value)}
                className="input"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
