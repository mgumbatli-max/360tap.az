'use client';
import { useState, useEffect, useRef } from 'react';
import { Sparkles, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AISmartSuggest({ value, onPick }: { value: string; onPick: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ suggestions: string[]; keywords: string[] }>({ suggestions: [], keywords: [] });
  const router = useRouter();
  const t = useRef<any>(null);

  useEffect(() => {
    if (!value || value.trim().length < 2) { setOpen(false); return; }
    clearTimeout(t.current);
    t.current = setTimeout(async () => {
      try {
        const d = await api<typeof data>(`/ai/suggest?q=${encodeURIComponent(value)}`);
        setData(d);
        setOpen((d.suggestions?.length || 0) + (d.keywords?.length || 0) > 0);
      } catch {}
    }, 200);
    return () => clearTimeout(t.current);
  }, [value]);

  if (!open) return null;
  return (
    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1c2128] border border-ink-200 dark:border-ink-700 rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-tap-50 dark:bg-tap/10 border-b border-ink-200">
        <span className="text-xs font-bold text-tap flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> AI təklifləri
        </span>
        <button onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-700">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {data.suggestions.length > 0 && (
        <div className="py-1">
          {data.suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={(e) => { e.preventDefault(); onPick(s); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-tap-50 text-sm flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5 text-ink-400" />
              <span className="line-clamp-1">{s}</span>
            </button>
          ))}
        </div>
      )}
      {data.keywords.length > 0 && (
        <div className="px-3 py-2 border-t border-ink-100">
          <div className="text-[10px] font-semibold text-ink-400 uppercase mb-1">Açar sözlər</div>
          <div className="flex flex-wrap gap-1.5">
            {data.keywords.map((k, i) => (
              <button
                key={i}
                onMouseDown={(e) => { e.preventDefault(); onPick(k); setOpen(false); }}
                className="px-2 py-0.5 rounded-full bg-ink-100 hover:bg-tap-50 text-xs"
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
