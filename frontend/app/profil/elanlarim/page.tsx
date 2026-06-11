'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProfileLayout from '@/components/ProfileLayout';
import { api } from '@/lib/api';
import { Eye, Heart, Plus, Pencil } from 'lucide-react';

type Item = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  status: string;
  views?: number;
  favoritesCount?: number;
  createdAt: string;
  images?: { url: string }[];
};

const TABS = [
  { value: 'all', label: 'Hamısı' },
  { value: 'active', label: 'Aktiv' },
  { value: 'sold', label: 'Satıldı' },
  { value: 'archived', label: 'Arxiv' },
];

const STATUS_AZ: Record<string, string> = {
  active: 'Aktiv',
  review: 'Moderasiyada',
  sold: 'Satıldı',
  archived: 'Arxiv',
  out_of_stock: 'Stokda yox',
};

export default function MyListingsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    // NestJS: { data: ListingResponse[] }
    api<{ data?: Item[] }>('/listings/me/list')
      .then((d) => setItems(d.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'all' ? items : items.filter((i) => i.status === tab);

  return (
    <ProfileLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white">Mənim elanlarım</h1>
          <Link href="/elan-yerlesdir" className="btn-tap text-sm">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Yeni elan</span>
          </Link>
        </div>

        <div className="flex gap-1 overflow-x-auto bg-white dark:bg-ink-800 rounded-lg border border-ink-200 dark:border-ink-700 p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition ${
                tab === t.value ? 'bg-tap text-white' : 'text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-70">
                {t.value === 'all' ? items.length : items.filter((i) => i.status === t.value).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-10 text-center text-ink-500">Yüklənir...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-ink-500 mb-3">
              {tab === 'all' ? 'Hələ heç bir elanın yoxdur' : 'Bu kateqoriyada elan yoxdur'}
            </p>
            <Link href="/elan-yerlesdir" className="btn-tap inline-flex">
              İlk elanını yarat
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((it) => (
              <div key={it.id} className="card p-3 flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/elanlar/${it.id}`}
                  className="w-full sm:w-32 h-32 rounded-lg bg-ink-100 dark:bg-ink-800 overflow-hidden shrink-0"
                >
                  {it.images?.[0]?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.images[0].url} alt="" className="w-full h-full object-cover" />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/elanlar/${it.id}`} className="font-bold text-ink-900 dark:text-white hover:text-tap line-clamp-1">
                    {it.title}
                  </Link>
                  <div className="text-xl font-extrabold mt-1 text-ink-900 dark:text-white">
                    {it.price ? `${Number(it.price).toLocaleString('az-AZ')} ${it.currency}` : 'Razılaşma'}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-ink-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {it.views ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" /> {it.favoritesCount ?? 0}
                    </span>
                    <span>· {new Date(it.createdAt).toLocaleDateString('az-AZ')}</span>
                    <span
                      className={`badge ${
                        it.status === 'active'
                          ? 'badge-deliver'
                          : it.status === 'sold'
                            ? 'badge-trusted'
                            : 'badge-ad'
                      }`}
                    >
                      {STATUS_AZ[it.status] ?? it.status}
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 sm:w-32 shrink-0">
                  <Link href={`/elanlar/${it.id}`} className="btn-secondary text-xs flex-1 justify-center">
                    <Pencil className="w-3.5 h-3.5" /> Bax
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
