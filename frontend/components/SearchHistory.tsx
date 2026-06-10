'use client';
import { useEffect, useState } from 'react';
import { Clock, X } from 'lucide-react';
import Link from 'next/link';

const KEY = 'tap_search_history';

export default function SearchHistory() {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => { try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {} }, []);
  const remove = (q: string) => { const next = items.filter(x => x !== q); setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  if (!items.length) return null;
  return (
    <div className="card p-3">
      <h4 className="font-bold text-xs flex items-center gap-1.5 mb-2 text-ink-500 uppercase"><Clock className="w-3 h-3" /> Son axtarışlar</h4>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 8).map((q) => (
          <span key={q} className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink-100 dark:bg-ink-800 text-xs hover:bg-tap-50">
            <Link href={`/elanlar?q=${encodeURIComponent(q)}`}>{q}</Link>
            <button onClick={() => remove(q)} className="opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}
