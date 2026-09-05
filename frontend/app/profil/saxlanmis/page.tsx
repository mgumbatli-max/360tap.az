'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfileLayout from '@/components/ProfileLayout';
import { api, timeAgo } from '@/lib/api';
import { Bookmark, Trash2, Search, Bell, BellOff } from 'lucide-react';

type Saved = {
  id: string;
  name: string | null;
  query: Record<string, string> | null;
  notify: boolean;
  createdAt: string;
};

export default function SavedSearchesPage() {
  const [items, setItems] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api<{ data?: Saved[] }>('/saved-searches')
      .then((d) => setItems(d.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm('Bu saxlanmış axtarışı silmək istəyirsiniz?')) return;
    await api(`/saved-searches/${id}`, { method: 'DELETE' }).catch(() => {});
    setItems((p) => p.filter((x) => x.id !== id));
  };

  /**
   * Bildiriş açarı. Backend endpointi (`PATCH /saved-searches/:id`) ilk gündən
   * hazır idi, lakin UI-dan heç vaxt çağırılmırdı — istifadəçi bildirişi söndürə
   * bilmirdi. Uyğunlaşdırıcı (backend: alerts/saved-search.service.ts) məhz bu
   * bayrağa baxır: `notify=false` olan axtarış üçün bildiriş yaradılmır.
   *
   * Vəziyyət DƏRHAL yenilənir (optimistik), sorğu sınsa geri qaytarılır — şəbəkə
   * gecikməsində açarın "ilişməsi" istifadəçiyə sınıq təsiri bağışlayır.
   */
  const toggleNotify = async (s: Saved) => {
    const next = !s.notify;
    setItems((p) => p.map((x) => (x.id === s.id ? { ...x, notify: next } : x)));
    try {
      await api(`/saved-searches/${s.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notify: next }),
      });
    } catch {
      setItems((p) => p.map((x) => (x.id === s.id ? { ...x, notify: !next } : x)));
    }
  };

  const buildUrl = (s: Saved): string => {
    const params = new URLSearchParams();
    Object.entries(s.query || {}).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    return `/elanlar?${params.toString()}`;
  };

  return (
    <ProfileLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white">Saxlanmış axtarışlar</h1>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-500">Yüklənir...</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Bookmark className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-600 dark:text-ink-300 mb-3">Saxlanmış axtarış yoxdur</p>
          <p className="text-sm text-ink-400 mb-5">
            Elanlar səhifəsində filtr tətbiq edib “Bu axtarışı yadda saxla” düyməsinə basın.
          </p>
          <Link href="/elanlar" className="btn-tap inline-flex">
            Elanlara bax
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-ink-100 dark:divide-ink-800">
          {items.map((s) => (
            <div key={s.id} className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-tap-50 dark:bg-ink-800 text-tap flex items-center justify-center shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={buildUrl(s)} className="font-semibold text-ink-900 dark:text-white hover:text-tap">
                  {s.name || 'Axtarış'}
                </Link>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(s.query || {}).map(([k, v]) =>
                    v ? (
                      <span key={k} className="badge badge-ad">
                        {k === 'q' ? `"${v}"` : `${k}: ${String(v)}`}
                      </span>
                    ) : null,
                  )}
                </div>
                <div className="text-xs text-ink-400 mt-1.5" suppressHydrationWarning>Yaradılıb: {timeAgo(s.createdAt)}</div>
              </div>
              <button
                onClick={() => toggleNotify(s)}
                className={`p-2 rounded shrink-0 ${
                  s.notify
                    ? 'text-tap hover:bg-tap-50 dark:hover:bg-ink-800'
                    : 'text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
                }`}
                aria-label={s.notify ? 'Bildirişi söndür' : 'Bildirişi aç'}
                title={
                  s.notify
                    ? 'Yeni uyğun elan çıxanda bildiriş alırsınız'
                    : 'Bu axtarış üçün bildiriş söndürülüb'
                }
              >
                {s.notify ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => remove(s.id)}
                className="p-2 rounded text-red-500 hover:bg-red-50 dark:hover:bg-ink-800 shrink-0"
                aria-label="Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ProfileLayout>
  );
}
