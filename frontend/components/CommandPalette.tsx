'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Home, Plus, Heart, MessageCircle, Settings, MapPin, Car, Phone, Briefcase, Sparkles, Mic, ArrowRight, Hash } from 'lucide-react';
import { api } from '@/lib/api';
import { azNumber } from '@/lib/format';

type Item = { id: string; title: string; subtitle?: string; icon: any; href?: string; action?: () => void; section: string; shortcut?: string };

const STATIC_ITEMS: Item[] = [
  { id: 'home',       title: 'Ana səhifə',         icon: Home, href: '/', section: 'Naviqasiya', shortcut: 'g h' },
  { id: 'new',        title: 'Yeni elan yerləşdir', icon: Plus, href: '/elan-yerlesdir', section: 'Naviqasiya', shortcut: 'g n' },
  { id: 'fav',        title: 'Sevimlilərim',       icon: Heart, href: '/profil/sevimliler', section: 'Naviqasiya', shortcut: 'g f' },
  { id: 'msg',        title: 'Mesajlarım',         icon: MessageCircle, href: '/profil/mesajlar', section: 'Naviqasiya' },
  { id: 'profile',    title: 'Profilim',           icon: Settings, href: '/profil', section: 'Naviqasiya' },
  { id: 'settings',   title: 'Tənzimləmələr',      icon: Settings, href: '/profil/ayarlar', section: 'Tənzimləmələr' },
  { id: 'cat-emlak',  title: 'Daşınmaz əmlak',     icon: MapPin, href: '/emlak', section: 'Kateqoriyalar' },
  { id: 'cat-auto',   title: 'Avtomobil',          icon: Car, href: '/elanlar?category=avtomobil', section: 'Kateqoriyalar' },
  { id: 'cat-phone',  title: 'Telefon',            icon: Phone, href: '/elanlar?category=telefon', section: 'Kateqoriyalar' },
  { id: 'cat-job',    title: 'İş elanları',        icon: Briefcase, href: '/elanlar?category=is-elanlari', section: 'Kateqoriyalar' },
  { id: 'voice',      title: 'AI səsli axtarış',   icon: Mic, section: 'AI', subtitle: 'Mikrofona klikləyin' },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K / Ctrl+K toggle + ESC close + / shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      } else if (e.key === '/' && !open && !['INPUT','TEXTAREA'].includes((e.target as any)?.tagName)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQ(''); setHighlight(0); }
  }, [open]);

  // Listing live search
  useEffect(() => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const d = await api<{ items: any[] }>(`/listings?q=${encodeURIComponent(q)}&limit=5`);
        setResults(d.items || []);
      } catch { setResults([]); }
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = STATIC_ITEMS.filter((it) => !q || it.title.toLowerCase().includes(q.toLowerCase()));
  const all = [
    ...filtered,
    ...results.map((r): Item => ({ id: 'l-'+r.id, title: r.title, subtitle: `${azNumber(r.price||0)} ${r.currency||'₼'}`, icon: Hash, href: `/elanlar/${r.id}`, section: 'Elanlar' }))
  ];

  // Group by section
  const grouped = all.reduce((acc, it) => {
    (acc[it.section] = acc[it.section] || []).push(it); return acc;
  }, {} as Record<string, Item[]>);

  const flatList = Object.values(grouped).flat();
  const onSelect = (it: Item) => {
    setOpen(false);
    if (it.href) router.push(it.href);
    else if (it.action) it.action();
  };

  const onKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h+1, flatList.length-1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h-1, 0)); }
    if (e.key === 'Enter' && flatList[highlight]) { e.preventDefault(); onSelect(flatList[highlight]); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[12vh] px-4 animate-fade-in" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-[#1c2128] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-ink-200/60 dark:border-ink-700"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-100 dark:border-ink-700">
          <Search className="w-5 h-5 text-ink-400 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setHighlight(0); }}
            onKeyDown={onKeyNav}
            placeholder="Sürətli axtarış · Elanlar · Səhifələr · Komandalar"
            className="flex-1 bg-transparent text-base outline-none placeholder-ink-400 text-ink-900 dark:text-white"
          />
          <kbd className="px-2 py-0.5 bg-ink-100 dark:bg-ink-800 rounded text-xs font-mono text-ink-500">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {flatList.length === 0 ? (
            <div className="py-12 text-center text-ink-400 text-sm">Nəticə tapılmadı</div>
          ) : (
            Object.entries(grouped).map(([section, items]) => (
              <div key={section}>
                <div className="px-5 pt-3 pb-1 text-[10px] font-bold text-ink-400 uppercase tracking-wider">{section}</div>
                {items.map((it) => {
                  const idx = flatList.indexOf(it);
                  const active = idx === highlight;
                  const Icon = it.icon;
                  return (
                    <button key={it.id}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => onSelect(it)}
                      className={`w-full px-5 py-2.5 flex items-center gap-3 text-left transition ${
                        active ? 'bg-tap-50 dark:bg-tap/10' : 'hover:bg-ink-50 dark:hover:bg-ink-800'
                      }`}>
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-tap' : 'text-ink-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${active ? 'text-tap' : 'text-ink-900 dark:text-white'}`}>{it.title}</div>
                        {it.subtitle && <div className="text-xs text-ink-500 truncate">{it.subtitle}</div>}
                      </div>
                      {it.shortcut && (
                        <kbd className="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded text-[10px] font-mono text-ink-500">{it.shortcut}</kbd>
                      )}
                      <ArrowRight className={`w-3.5 h-3.5 ${active ? 'text-tap' : 'text-ink-300'} ${active ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="px-5 py-2.5 border-t border-ink-100 dark:border-ink-700 flex items-center justify-between text-[11px] text-ink-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-ink-100 dark:bg-ink-800 rounded font-mono">↑↓</kbd> gəz</span>
            <span><kbd className="px-1 py-0.5 bg-ink-100 dark:bg-ink-800 rounded font-mono">⏎</kbd> seç</span>
            <span><kbd className="px-1 py-0.5 bg-ink-100 dark:bg-ink-800 rounded font-mono">/</kbd> aç</span>
          </div>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> 360tap.az</span>
        </div>
      </div>
    </div>
  );
}
