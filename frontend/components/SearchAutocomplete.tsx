'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { api } from '@/lib/api';

const RECENT_KEY = 'avito_recent_searches';

function getRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}
function pushRecent(q: string) {
  if (typeof window === 'undefined') return;
  const list = getRecent().filter((x) => x !== q);
  list.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
}

export default function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [popular, setPopular] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<{ title: string; id: string }[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api<{ popular: string[] }>('/search/popular').then((d) => setPopular(d.popular ?? []));
    setRecent(getRecent());
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      api<{ suggestions: { title: string; id: string }[] }>(`/search/suggestions?q=${encodeURIComponent(value)}`)
        .then((d) => setSuggestions(d.suggestions ?? []))
        .catch(() => setSuggestions([]));
    }, 200);
  }, [value]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (q: string) => {
    if (!q.trim()) return;
    pushRecent(q);
    if (onSubmit) onSubmit(q);
    else router.push(`/elanlar?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  const removeRecent = (q: string) => {
    const list = recent.filter((x) => x !== q);
    setRecent(list);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  };

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(value); }}
        placeholder={placeholder ?? 'Elan üzrə axtarış'}
        className="search-input pl-9"
      />

      {open && (suggestions.length > 0 || recent.length > 0 || popular.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-ink-200 rounded-xl shadow-menu max-h-[420px] overflow-y-auto z-50 animate-slide-down">
          {suggestions.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-bold uppercase text-ink-400">Tövsiyələr</div>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => submit(s.title)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-ink-50 text-left text-sm"
                >
                  <Search className="w-4 h-4 text-ink-400" />
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          )}
          {!value && recent.length > 0 && (
            <div className="py-2 border-t border-ink-100">
              <div className="px-3 py-1 text-[11px] font-bold uppercase text-ink-400">Son axtarışlar</div>
              {recent.map((q) => (
                <div key={q} className="flex items-center hover:bg-ink-50 group">
                  <button
                    onClick={() => submit(q)}
                    className="flex-1 flex items-center gap-2 px-3 py-2 text-left text-sm"
                  >
                    <Clock className="w-4 h-4 text-ink-400" />
                    <span>{q}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeRecent(q); }}
                    className="px-2 opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3 text-ink-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {!value && popular.length > 0 && (
            <div className="py-2 border-t border-ink-100">
              <div className="px-3 py-1 text-[11px] font-bold uppercase text-ink-400">Populyar</div>
              <div className="px-3 py-2 flex flex-wrap gap-1.5">
                {popular.slice(0, 8).map((p) => (
                  <button
                    key={p}
                    onClick={() => submit(p)}
                    className="px-3 py-1.5 rounded-full bg-ink-100 text-xs hover:bg-tap-50 hover:text-tap"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
