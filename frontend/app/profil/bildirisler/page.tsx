'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileLayout from '@/components/ProfileLayout';
import { api, timeAgo } from '@/lib/api';
import { Bell, Check, MessageCircle, Star, AlertTriangle } from 'lucide-react';

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: { conversationId?: string } | null;
  read: boolean;
  createdAt: string;
};

const ICON: Record<string, { icon: typeof Bell; color: string }> = {
  message: { icon: MessageCircle, color: 'text-blue-500' },
  saved_search: { icon: Bell, color: 'text-tap' },
  system: { icon: Star, color: 'text-amber-500' },
  moderation: { icon: AlertTriangle, color: 'text-red-500' },
  price_drop: { icon: AlertTriangle, color: 'text-emerald-500' },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api<{ data?: Notif[] }>('/notifications')
      .then((d) => setItems(d.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await api(`/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
    setItems((p) => p.map((it) => (it.id === id ? { ...it, read: true } : it)));
  };

  const markAll = async () => {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
    setItems((p) => p.map((it) => ({ ...it, read: true })));
  };

  const onClick = (n: Notif) => {
    if (!n.read) markRead(n.id);
    if (n.type === 'message' && n.data?.conversationId) {
      router.push(`/profil/mesajlar?c=${n.data.conversationId}`);
    }
  };

  const unread = items.filter((i) => !i.read).length;

  return (
    <ProfileLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white">
          Bildirişlər {unread > 0 && <span className="ml-2 badge badge-active">{unread} yeni</span>}
        </h1>
        {unread > 0 && (
          <button onClick={markAll} className="btn-secondary text-sm">
            Hamısını oxundu et
          </button>
        )}
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-500">Yüklənir...</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-600 dark:text-ink-300">Bildiriş yoxdur</p>
          <p className="text-sm text-ink-400 mt-1">
            Yeni mesaj, rəy və ya status dəyişikliyi haqqında burada xəbər tutacaqsınız.
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-ink-100 dark:divide-ink-800">
          {items.map((n) => {
            const cfg = ICON[n.type] ?? { icon: Bell, color: 'text-ink-500' };
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                onClick={() => onClick(n)}
                className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-800 ${
                  !n.read ? 'bg-tap-50/50 dark:bg-ink-800/40' : ''
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full bg-ink-50 dark:bg-ink-800 flex items-center justify-center shrink-0 ${cfg.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{n.title}</p>
                  {n.body && <p className="text-sm text-ink-600 dark:text-ink-300 mt-0.5">{n.body}</p>}
                  <p className="text-xs text-ink-400 mt-1" suppressHydrationWarning>{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-tap mt-2 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </ProfileLayout>
  );
}
