'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: { conversationId?: string } | null;
  read: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notif[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const loadCount = () => {
    api<{ data?: { count: number } }>('/notifications/unread-count')
      .then((d) => setCount(d.data?.count ?? 0))
      .catch(() => {});
  };

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    loadCount();
    const t = setInterval(loadCount, 30000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      api<{ data?: Notif[] }>('/notifications')
        .then((d) => setItems(d.data ?? []))
        .catch(() => {});
    }
  };

  const markAll = async () => {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
    setCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const hrefFor = (n: Notif) =>
    n.type === 'message' && n.data?.conversationId
      ? `/profil/mesajlar?c=${n.data.conversationId}`
      : '/profil/bildirisler';

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800"
        aria-label="Bildirişlər"
      >
        <Bell className="w-5 h-5 text-ink-700 dark:text-ink-200" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] max-h-[70vh] overflow-y-auto bg-white dark:bg-ink-900 rounded-2xl shadow-xl border border-ink-200 dark:border-ink-700 z-50">
          <div className="flex items-center justify-between p-3 border-b border-ink-100 dark:border-ink-800 sticky top-0 bg-white dark:bg-ink-900">
            <span className="font-bold text-ink-900 dark:text-white">Bildirişlər</span>
            {items.some((n) => !n.read) && (
              <button onClick={markAll} className="text-xs text-tap hover:underline">
                Hamısını oxu
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="p-6 text-center text-ink-400 text-sm">Bildiriş yoxdur</div>
          ) : (
            items.map((n) => (
              <Link
                key={n.id}
                href={hrefFor(n)}
                onClick={() => setOpen(false)}
                className={`block p-3 border-b border-ink-50 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-800 ${
                  !n.read ? 'bg-tap-50/40 dark:bg-ink-800/50' : ''
                }`}
              >
                <div className="font-semibold text-sm text-ink-900 dark:text-white">{n.title}</div>
                {n.body && <div className="text-xs text-ink-500 mt-0.5 line-clamp-2">{n.body}</div>}
              </Link>
            ))
          )}
          <Link
            href="/profil/bildirisler"
            onClick={() => setOpen(false)}
            className="block p-3 text-center text-sm text-tap hover:underline border-t border-ink-100 dark:border-ink-800"
          >
            Hamısına bax
          </Link>
        </div>
      )}
    </div>
  );
}
