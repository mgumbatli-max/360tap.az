'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, ArrowRight, Hash, MapPin, Tag, Clock, Mic, Camera, X, Loader2 } from 'lucide-react';
import { api, formatPrice } from '@/lib/api';
import Link from 'next/link';

type SearchResult = {
  query: string;
  expanded_variants: string[];
  filters_detected: { price: number | null; year: number | null };
  items: any[];
  categories: { slug: string; name_az: string }[];
  cities: { slug: string; name: string }[];
  pages: { slug: string; title: string }[];
  suggestions: string[];
  total: number;
};

const RECENT_KEY = 'tap_search_recent';
const TRENDING = ['BMW X5', 'iPhone 14', 'Mənzil Nəsimi', 'MacBook', 'Toyota Camry'];

export default function SuperSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debTimer = useRef<any>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')); } catch {}
    } else {
      setQ(''); setData(null); setHighlight(0);
    }
  }, [open]);

  useEffect(() => {
    if (!q.trim() || q.length < 2) { setData(null); return; }
    clearTimeout(debTimer.current);
    debTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api<SearchResult>(`/search-smart/smart?q=${encodeURIComponent(q)}`);
        setData(r);
        setHighlight(0);
      } finally { setLoading(false); }
    }, 200);
    return () => clearTimeout(debTimer.current);
  }, [q]);

  // Build flat result list for keyboard nav
  const flatResults = data ? [
    ...data.pages.map((p) => ({ kind: 'page' as const, item: p })),
    ...data.categories.map((c) => ({ kind: 'category' as const, item: c })),
    ...data.cities.map((c) => ({ kind: 'city' as const, item: c })),
    ...data.items.map((i) => ({ kind: 'listing' as const, item: i })),
  ] : [];

  const submit = (text?: string) => {
    const final = (text || q).trim();
    if (!final) return;
    const next = [final, ...recent.filter((x) => x !== final)].slice(0, 8);
    setRecent(next); localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    onClose();
    router.push(`/elanlar?q=${encodeURIComponent(final)}`);
  };

  const go = (r: any) => {
    onClose();
    if (r.kind === 'listing') router.push(`/elanlar/${r.item.id}`);
    else if (r.kind === 'page') router.push(r.item.slug);
    else if (r.kind === 'category') router.push(`/elanlar?category=${r.item.slug}`);
    else if (r.kind === 'city') router.push(`/elanlar?city=${r.item.slug}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, flatResults.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[highlight]) go(flatResults[highlight]);
      else submit();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-fade-in" />
      <div className="relative bg-white dark:bg-[#1c2128] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-ink-200/60 dark:border-ink-700 animate-fade-in-up"
           onClick={(e) => e.stopPropagation()}>

        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-100 dark:border-ink-700">
          {loading ? <Loader2 className="w-5 h-5 text-tap animate-spin" /> : <Search className="w-5 h-5 text-ink-400" />}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Nə axtarırsız? — BMW, mənzil, iPhone, iş..."
            className="flex-1 bg-transparent text-lg outline-none placeholder-ink-400"
          />
          <Link href="/sekille-axtar" onClick={onClose} className="p-1.5 hover:bg-ink-100 rounded-lg" title="Şəkillə axtar"><Camera className="w-4 h-4 text-ink-500" /></Link>
          <kbd className="px-2 py-0.5 bg-ink-100 dark:bg-ink-800 rounded text-xs font-mono">ESC</kbd>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!q && (
            <div className="p-5 space-y-4">
              {recent.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-ink-400 uppercase mb-2 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Son axtarışlar</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <button key={r} onClick={() => submit(r)} className="px-3 py-1.5 rounded-full bg-ink-100 dark:bg-ink-800 text-sm hover:bg-tap-50">{r}</button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold text-ink-400 uppercase mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Trend axtarışlar</h4>
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING.map((t) => (
                    <button key={t} onClick={() => submit(t)} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-tap-50 to-violet-50 border border-tap/20 text-sm font-medium">{t}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Link href="/sekille-axtar" onClick={onClose} className="card p-3 text-center hover:border-tap">
                  <Camera className="w-5 h-5 mx-auto text-tap mb-1" />
                  <div className="text-xs font-bold">Şəkillə axtar</div>
                </Link>
                <Link href="/elanlar" onClick={onClose} className="card p-3 text-center hover:border-tap">
                  <Tag className="w-5 h-5 mx-auto text-tap mb-1" />
                  <div className="text-xs font-bold">Bütün elanlar</div>
                </Link>
                <Link href="/lab" onClick={onClose} className="card p-3 text-center hover:border-violet-300 bg-gradient-to-r from-tap-50 to-violet-50">
                  <Sparkles className="w-5 h-5 mx-auto text-violet-500 mb-1" />
                  <div className="text-xs font-bold">360 Lab</div>
                </Link>
              </div>
            </div>
          )}

          {q && data && (
            <div className="py-2">
              {/* Filter detected */}
              {(data.filters_detected.price || data.filters_detected.year) && (
                <div className="px-5 py-2 bg-tap-50 dark:bg-tap/10 border-y border-tap/20 text-xs">
                  <Sparkles className="w-3 h-3 inline mr-1 text-tap" /> AI tanıdı: {
                    data.filters_detected.price && <strong>{data.filters_detected.price.toLocaleString('az-AZ')}₼ ətrafı</strong>
                  } {data.filters_detected.year && <strong>{data.filters_detected.year}-ci il</strong>}
                </div>
              )}

              {/* Pages */}
              {data.pages.length > 0 && (
                <Section title="Səhifələr" emoji="📄">
                  {data.pages.map((p, i) => {
                    const idx = flatResults.findIndex((x) => x.kind === 'page' && (x.item as any).slug === p.slug);
                    return (
                      <Row key={p.slug} active={idx === highlight} onClick={() => go({ kind: 'page', item: p })} icon={<ArrowRight className="w-3.5 h-3.5" />}>
                        <span className="font-medium">{p.title}</span>
                        <span className="text-xs text-ink-500 ml-2">{p.slug}</span>
                      </Row>
                    );
                  })}
                </Section>
              )}

              {/* Categories */}
              {data.categories.length > 0 && (
                <Section title="Kateqoriyalar" emoji="📁">
                  {data.categories.map((c) => {
                    const idx = flatResults.findIndex((x) => x.kind === 'category' && (x.item as any).slug === c.slug);
                    return (
                      <Row key={c.slug} active={idx === highlight} onClick={() => go({ kind: 'category', item: c })} icon={<Tag className="w-3.5 h-3.5" />}>
                        <span className="font-medium">{c.name_az}</span>
                      </Row>
                    );
                  })}
                </Section>
              )}

              {/* Cities */}
              {data.cities.length > 0 && (
                <Section title="Şəhərlər" emoji="📍">
                  {data.cities.map((c) => {
                    const idx = flatResults.findIndex((x) => x.kind === 'city' && (x.item as any).slug === c.slug);
                    return (
                      <Row key={c.slug} active={idx === highlight} onClick={() => go({ kind: 'city', item: c })} icon={<MapPin className="w-3.5 h-3.5" />}>
                        <span className="font-medium">{c.name}</span>
                      </Row>
                    );
                  })}
                </Section>
              )}

              {/* Listings */}
              {data.items.length > 0 && (
                <Section title={`Elanlar (${data.total})`} emoji="🛍">
                  {data.items.map((it, i) => {
                    const idx = flatResults.findIndex((x) => x.kind === 'listing' && (x.item as any).id === it.id);
                    return (
                      <button key={it.id} onMouseEnter={() => setHighlight(idx)} onClick={() => go({ kind: 'listing', item: it })}
                        className={`w-full text-left px-5 py-2.5 flex items-center gap-3 transition ${idx === highlight ? 'bg-tap-50 dark:bg-tap/10' : 'hover:bg-ink-50 dark:hover:bg-ink-800'}`}>
                        <div className="w-12 h-12 bg-ink-100 rounded-lg overflow-hidden shrink-0">
                          {it.cover?.url && <img src={it.cover.url} alt={it.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm line-clamp-1">{it.title}</div>
                          <div className="text-xs text-ink-500 flex items-center gap-2 mt-0.5">
                            <span className="font-bold text-tap">{formatPrice(it.price, it.currency)}</span>
                            {it.city_name && <span>📍 {it.city_name}</span>}
                            {it.is_vip && <span className="text-amber-600 font-bold">VIP</span>}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-ink-300" />
                      </button>
                    );
                  })}
                </Section>
              )}

              {/* Empty */}
              {data.items.length === 0 && data.categories.length === 0 && data.pages.length === 0 && (
                <div className="py-12 text-center px-5">
                  <Search className="w-10 h-10 mx-auto text-ink-300 mb-2" />
                  <p className="text-sm text-ink-500">"<strong>{q}</strong>" üzrə nəticə tapılmadı</p>
                  {data.suggestions.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-ink-400 mb-2">Bəlkə bunu axtarırsınız?</div>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {data.suggestions.map((s) => (
                          <button key={s} onClick={() => setQ(s)} className="px-2 py-1 rounded-full bg-tap-50 text-tap text-xs font-medium">{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* "Bütün nəticələrə bax" */}
              {(data.items.length > 0 || data.categories.length > 0) && (
                <div className="px-5 py-3 border-t border-ink-100 sticky bottom-0 bg-white dark:bg-[#1c2128]">
                  <button onClick={() => submit()} className="btn-tap w-full text-sm">
                    "{q}" üzrə bütün nəticələri göstər <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, emoji, children }: any) {
  return (
    <div>
      <div className="px-5 pt-3 pb-1 text-[10px] font-bold text-ink-400 uppercase tracking-wider">
        <span className="mr-1">{emoji}</span>{title}
      </div>
      {children}
    </div>
  );
}

function Row({ active, onClick, icon, children }: any) {
  return (
    <button onClick={onClick}
      className={`w-full px-5 py-2.5 flex items-center gap-2.5 text-left transition ${active ? 'bg-tap-50 dark:bg-tap/10 text-tap' : 'hover:bg-ink-50 dark:hover:bg-ink-800'}`}>
      <span className={active ? 'text-tap' : 'text-ink-400'}>{icon}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </button>
  );
}
