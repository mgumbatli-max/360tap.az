'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfileLayout from '@/components/ProfileLayout';
import { api, timeAgo } from '@/lib/api';
import { Bookmark, Bell, Trash2, Search } from 'lucide-react';

export default function SavedSearchesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api<{ items: any[] }>('/saved-searches')
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm('Bu saxlanmış axtarışı silmək istəyirsiniz?')) return;
    await api(`/saved-searches/${id}`, { method: 'DELETE' });
    setItems((p) => p.filter((x) => x.id !== id));
  };

  const buildUrl = (s: any): string => {
    const params = new URLSearchParams();
    if (s.query) params.set('q', s.query);
    Object.entries(s.filters || {}).forEach(([k, v]) => v && params.set(k, String(v)));
    return `/elanlar?${params.toString()}`;
  };

  return (
    <ProfileLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-ink-900">Saxlanmış axtarışlar</h1>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-500">Yüklənir...</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Bookmark className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-600 mb-3">Saxlanmış axtarış yoxdur</p>
          <p className="text-sm text-ink-400 mb-5">
            Axtarış səhifəsində filtri tətbiq edib "Saxlamaq" düyməsinə basın — yeni uyğun elan gələndə bildiriş alacaqsınız.
          </p>
          <Link href="/elanlar" className="btn-tap inline-flex">Elanlara bax</Link>
        </div>
      ) : (
        <div className="card divide-y divide-ink-100">
          {items.map((s) => (
            <div key={s.id} className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-tap-50 text-tap flex items-center justify-center shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={buildUrl(s)} className="font-semibold hover:text-tap">
                  {s.name}
                </Link>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {s.query && <span className="badge badge-ad">"{s.query}"</span>}
                  {Object.entries(s.filters || {}).map(([k, v]) => (
                    v ? <span key={k} className="badge badge-ad">{k}: {String(v)}</span> : null
                  ))}
                </div>
                <div className="text-xs text-ink-400 mt-1.5">Yaradılıb: {timeAgo(s.created_at)}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  className={`p-2 rounded ${s.notify_email ? 'text-tap' : 'text-ink-400'} hover:bg-ink-50`}
                  aria-label="Bildirişi tənzimlə"
                >
                  <Bell className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="p-2 rounded text-red-500 hover:bg-red-50"
                  aria-label="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ProfileLayout>
  );
}
