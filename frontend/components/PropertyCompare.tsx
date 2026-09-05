'use client';
import { useState, useEffect } from 'react';
import { Scale, X } from 'lucide-react';
import Link from 'next/link';
import { azNumber } from '@/lib/format';

const KEY = 'tap_property_compare';

export default function PropertyCompare() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {}
  }, []);

  if (items.length < 2) return null;

  const remove = (id: string) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-violet-600 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition">
        <Scale className="w-4 h-4" /> Müqayisə {items.length}
      </button>
      {open && (
        <div className="fixed inset-0 z-[200] bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-[#1c2128] rounded-2xl max-w-5xl mx-auto p-6 mt-10 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Scale className="w-5 h-5 text-violet-600" /> Əmlak müqayisəsi</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200">
                  <th className="p-2 text-left text-xs text-ink-500 font-bold uppercase">Xüsusiyyət</th>
                  {items.map((it) => (
                    <th key={it.id} className="p-2 min-w-[180px] text-left">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/elanlar/${it.id}`} className="font-bold text-tap hover:underline line-clamp-2">{it.title}</Link>
                        <button onClick={() => remove(it.id)} className="text-ink-400"><X className="w-3 h-3" /></button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['price','area','rooms','floor','district','repair','building_year'].map((k) => (
                  <tr key={k} className="border-b border-ink-100">
                    <td className="p-2 text-ink-500 capitalize">{k.replace('_', ' ')}</td>
                    {items.map((it) => (
                      <td key={it.id} className="p-2 font-medium">
                        {k === 'price' ? `${azNumber(it.price || 0)} ₼` :
                         it.attributes?.[k] || it[k] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
