'use client';
import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Sürətli axtarış (Command palette)' },
  { keys: ['/'], label: 'Axtarışı fokusla' },
  { keys: ['G', 'H'], label: 'Ana səhifəyə get' },
  { keys: ['G', 'N'], label: 'Yeni elan yarat' },
  { keys: ['G', 'F'], label: 'Sevimlilərə get' },
  { keys: ['G', 'M'], label: 'Mesajlara get' },
  { keys: ['?'], label: 'Klaviatura cədvəlini aç' },
  { keys: ['ESC'], label: 'Modal/panel bağla' },
  { keys: ['⌘', 'D'], label: 'Tündləşdirməni dəyiş' },
];

export default function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as any)?.tagName)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setOpen(false)}>
      <div className="bg-white dark:bg-[#1c2128] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-tap" /> Klaviatura qısayolları
          </h2>
          <button onClick={() => setOpen(false)} className="w-8 h-8 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-lg flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-ink-700 dark:text-ink-300">{s.label}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="min-w-[24px] px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-white rounded text-xs font-mono text-center border border-ink-200 dark:border-ink-700">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
