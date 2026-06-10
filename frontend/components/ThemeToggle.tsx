'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem('avito_theme') as Theme) || 'light';
    setTheme(saved);
    apply(saved);
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-theme-toggle]')) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const apply = (t: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (t === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(t);
    }
  };

  const onChange = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('avito_theme', t);
    apply(t);
    setOpen(false);
  };

  const quickToggle = () => onChange(theme === 'dark' ? 'light' : 'dark');

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const label = theme === 'dark' ? 'Tünd' : theme === 'light' ? 'Açıq' : 'Sistem';

  return (
    <div className="relative" data-theme-toggle>
      <button
        onClick={quickToggle}
        onContextMenu={(e) => { e.preventDefault(); setOpen(!open); }}
        className="p-2 hover:bg-ink-50 rounded-lg flex items-center gap-1"
        aria-label={`Tema: ${label}`}
        title={`${label} rejim — klik: dəyiş, sağ klik: seçimlər`}
      >
        <Icon className="w-5 h-5 text-ink-700" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-ink-200 rounded-lg shadow-menu py-1 z-50 animate-slide-down">
          {[
            { t: 'light', icon: Sun, label: 'Açıq rejim' },
            { t: 'dark', icon: Moon, label: 'Tünd rejim' },
            { t: 'system', icon: Monitor, label: 'Sistem' },
          ].map(({ t, icon: I, label }) => (
            <button
              key={t}
              onClick={() => onChange(t as Theme)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-ink-50 ${
                theme === t ? 'text-tap font-semibold' : 'text-ink-700'
              }`}
            >
              <I className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
