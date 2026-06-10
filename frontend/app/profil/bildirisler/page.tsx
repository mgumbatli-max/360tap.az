'use client';
import { useEffect, useState } from 'react';
import ProfileLayout from '@/components/ProfileLayout';
import { api, timeAgo } from '@/lib/api';
import { Bell, Check, MessageCircle, Heart, Wallet, AlertTriangle } from 'lucide-react';

const ICON: Record<string, any> = {
  message:  { icon: MessageCircle, color: 'text-blue-500'    },
  favorite: { icon: Heart,         color: 'text-pink-500'    },
  fav:      { icon: Heart,         color: 'text-pink-500'    },
  pay:      { icon: Wallet,        color: 'text-emerald-500' },
  mod:      { icon: Check,         color: 'text-emerald-500' },
  expire:   { icon: AlertTriangle, color: 'text-amber-500'   },
};

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api<{ items: any[] }>('/notifications')
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await api(`/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {});
    setItems((p) => p.map((it) => (it.id === id ? { ...it, is_read: true } : it)));
  };

  const markAll = async () => {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
    setItems((p) => p.map((it) => ({ ...it, is_read: true })));
  };

  const unread = items.filter((i) => !i.is_read).length;

  return (
    <ProfileLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-ink-900">
          Bildirişlər {unread > 0 && <span className="ml-2 badge badge-active">{unread} yeni</span>}
        </h1>
        {unread > 0 && (
          <button onClick={markAll} className="btn-secondary text-sm">Hamısını oxundu et</button>
        )}
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-500">Yüklənir...</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-600">Bildiriş yoxdur</p>
          <p className="text-sm text-ink-400 mt-1">Yeni elan, mesaj və ya statistik dəyişiklik haqqında burada xəbər tutacaqsınız.</p>
        </div>
      ) : (
        <div className="card divide-y divide-ink-100">
          {items.map((n) => {
            const cfg = ICON[n.type] ?? { icon: Bell, color: 'text-ink-500' };
            const Icon = cfg.icon;
            return (
              <div key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-ink-50 ${!n.is_read ? 'bg-tap-50/50' : ''}`}
              >
                <div className={`w-9 h-9 rounded-full bg-ink-50 flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{n.title}</p>
                  {n.body && <p className="text-sm text-ink-600 mt-0.5">{n.body}</p>}
                  <p className="text-xs text-ink-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-tap mt-2 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </ProfileLayout>
  );
}
