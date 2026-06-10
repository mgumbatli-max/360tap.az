'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check, Heart, MessageCircle, TrendingDown, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const MOCK_NOTIFICATIONS = [
  { id: '1', icon: Heart, color: 'text-pink-500 bg-pink-50', title: 'Yeni sevimliyə əlavə', body: 'BMW X5 sevimlilərinizə əlavə olundu', time: '5 dəq', unread: true, href: '/profil/sevimliler' },
  { id: '2', icon: MessageCircle, color: 'text-blue-500 bg-blue-50', title: 'Yeni mesaj', body: 'Anar Ə.: "Mövcuddurmu?"', time: '15 dəq', unread: true, href: '/profil/mesajlar' },
  { id: '3', icon: TrendingDown, color: 'text-emerald-500 bg-emerald-50', title: 'Qiymət düşdü!', body: 'iPhone 14 — 1500₼ → 1350₼', time: '1 saat', unread: true, href: '/elanlar' },
  { id: '4', icon: Sparkles, color: 'text-amber-500 bg-amber-50', title: 'AI tövsiyəsi', body: '3 yeni uyğun elan tapıldı', time: '2 saat', unread: false, href: '/elanlar' },
  { id: '5', icon: Bell, color: 'text-violet-500 bg-violet-50', title: 'Saxlanılmış axtarış', body: '"Mənzil Nəsimi" üzrə yeni elan', time: 'dünən', unread: false, href: '/profil/saxlanmis' },
];

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;
  const unreadCount = items.filter((i) => i.unread).length;

  const markAllRead = () => setItems((p) => p.map((i) => ({ ...i, unread: false })));
  const remove = (id: string) => setItems((p) => p.filter((i) => i.id !== id));

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 hover:bg-ink-50 dark:hover:bg-ink-800 rounded-lg" aria-label="Bildirişlər">
        <Bell className="w-5 h-5 text-ink-700 dark:text-ink-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1c2128]">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1c2128] rounded-2xl shadow-2xl border border-ink-200/60 dark:border-ink-700 overflow-hidden animate-fade-in-up z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-ink-700">
            <h3 className="font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-tap" /> Bildirişlər
              {unreadCount > 0 && <span className="text-xs bg-tap text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-tap hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" /> Hamısını oxu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-12 text-center text-ink-400">
                <Bell className="w-10 h-10 mx-auto mb-2 text-ink-300" />
                <p className="text-sm">Yeni bildiriş yoxdur</p>
              </div>
            ) : items.map((n) => {
              const I = n.icon;
              return (
                <Link key={n.id} href={n.href}
                  className={`group flex items-start gap-3 px-4 py-3 hover:bg-ink-50 dark:hover:bg-ink-800 border-b border-ink-50 dark:border-ink-800 last:border-b-0 ${n.unread ? 'bg-tap-50/30 dark:bg-tap/5' : ''}`}
                  onClick={() => setOpen(false)}>
                  <div className={`w-9 h-9 rounded-full ${n.color} flex items-center justify-center shrink-0`}>
                    <I className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-sm text-ink-900 dark:text-white">{n.title}</div>
                      {n.unread && <div className="w-2 h-2 bg-tap rounded-full shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-ink-600 dark:text-ink-400 mt-0.5 line-clamp-2">{n.body}</p>
                    <div className="text-[10px] text-ink-400 mt-1">{n.time}</div>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); remove(n.id); }}
                    className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-red-500 p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Link>
              );
            })}
          </div>
          <Link href="/profil/bildirisler" onClick={() => setOpen(false)}
            className="block text-center py-2.5 text-sm font-semibold text-tap hover:bg-tap-50 dark:hover:bg-tap/10 border-t border-ink-100 dark:border-ink-700">
            Hamısına bax →
          </Link>
        </div>
      )}
    </div>
  );
}
