'use client';
import { useState, useRef, useEffect } from 'react';
import { Share2, Link2, Mail, MessageCircle, Send, X, Check } from 'lucide-react';
import { useToast } from '@/lib/toast';

export default function ShareMenu({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const fullUrl = typeof window !== 'undefined' ? window.location.origin + url : url;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Link kopyalandı');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Kopyalama mümkün olmadı'); }
  };

  const items = [
    { label: 'Linki kopyala', icon: copied ? Check : Link2, onClick: copyLink, color: copied ? 'text-emerald-600' : '' },
    { label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + fullUrl)}`, color: 'text-emerald-500' },
    { label: 'Telegram', icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`, color: 'text-blue-500' },
    { label: 'E-poçt', icon: Mail, href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullUrl)}`, color: 'text-orange-500' },
  ];

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="p-2 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-lg text-ink-600 dark:text-ink-400" aria-label="Paylaş">
        <Share2 className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-[#1c2128] rounded-xl shadow-2xl border border-ink-200/60 dark:border-ink-700 overflow-hidden z-50 animate-fade-in-up">
          <div className="px-3 py-2 text-[10px] font-bold text-ink-400 uppercase tracking-wider border-b border-ink-100 dark:border-ink-700">
            Paylaş
          </div>
          {items.map((it) => {
            const I = it.icon;
            const inner = (
              <>
                <I className={`w-4 h-4 ${it.color}`} />
                <span className="text-sm text-ink-900 dark:text-white">{it.label}</span>
              </>
            );
            return it.href ? (
              <a key={it.label} href={it.href} target="_blank" rel="noopener noreferrer"
                onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-800">
                {inner}
              </a>
            ) : (
              <button key={it.label} onClick={(e) => { e.stopPropagation(); it.onClick?.(); }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-800 text-left">
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
