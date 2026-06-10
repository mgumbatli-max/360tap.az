'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProfileLayout from '@/components/ProfileLayout';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { Eye, Heart, MessageCircle, Pencil, Archive, Crown, Plus, CheckCircle, RefreshCw, ArrowUp, Trash2 } from 'lucide-react';
import BulkPriceUpdate from '@/components/BulkPriceUpdate';
import ListingForecast from '@/components/ListingForecast';
import MarketPriceAnalyzer from '@/components/MarketPriceAnalyzer';

const TABS = [
  { value: 'all', label: 'Hamısı' },
  { value: 'active', label: 'Aktiv' },
  { value: 'review', label: 'Moderasiyada' },
  { value: 'sold', label: 'Satıldı' },
  { value: 'archived', label: 'Arxiv' },
];

export default function MyListingsPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = () => {
    setLoading(true);
    api<{ items: any[] }>('/listings/me/list')
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const action = async (id: string, type: 'sold' | 'archive' | 'reactivate' | 'bump') => {
    const conf = type === 'archive' ? 'Bu elanı arxivləşdirmək istəyirsiniz?' :
                 type === 'sold'    ? 'Elan satılıb kimi qeyd edilsin?' : null;
    if (conf && !confirm(conf)) return;
    try {
      const url = type === 'archive' ? `/listings/${id}` : `/listings/${id}/${type}`;
      const method = type === 'archive' ? 'DELETE' : 'POST';
      await api(url, { method });
      toast.success(
        type === 'sold'       ? 'Satıldı kimi qeyd edildi' :
        type === 'archive'    ? 'Arxivə köçürüldü' :
        type === 'reactivate' ? 'Yenidən aktivləşdi' :
                                'Yuxarı qaldırıldı'
      );
      load();
    } catch (err: any) {
      toast.error(err.message || 'Xəta baş verdi');
    }
  };

  const filtered = tab === 'all' ? items : items.filter((i) => i.status === tab);

  return (
    <ProfileLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-ink-900">Mənim elanlarım</h1>
          <Link href="/elan-yerlesdir" className="btn-tap text-sm">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Yeni elan</span>
          </Link>
        </div>

        {/* Toplu alətlər + AI proqnoz */}
        <div className="grid md:grid-cols-3 gap-3">
          <BulkPriceUpdate />
          <ListingForecast />
          <MarketPriceAnalyzer />
        </div>

        <div className="flex gap-1 overflow-x-auto bg-white rounded-lg border border-ink-200 p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition ${
                tab === t.value ? 'bg-tap text-white' : 'text-ink-700 hover:bg-ink-50'
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
            <p className="text-ink-500 mb-3">{tab === 'all' ? 'Hələ heç bir elanın yoxdur' : 'Bu kateqoriyada elan yoxdur'}</p>
            <Link href="/elan-yerlesdir" className="btn-tap inline-flex">İlk elanını yarat</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((it) => (
              <div key={it.id} className="card p-3 flex flex-col sm:flex-row gap-4">
                <Link href={`/elanlar/${it.id}`} className="w-full sm:w-32 h-32 rounded-lg bg-ink-100 overflow-hidden shrink-0">
                  {it.cover && <img src={it.cover} className="w-full h-full object-cover" />}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/elanlar/${it.id}`} className="font-bold text-ink-900 hover:text-tap line-clamp-1">
                    {it.title}
                  </Link>
                  <div className="text-xl font-extrabold mt-1">
                    {it.price ? `${Number(it.price).toLocaleString('az-AZ')} ${it.currency}` : 'Razılaşma'}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-ink-500 mt-2">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {it.views ?? 0}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {it.favorites_count ?? 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> 0</span>
                    <span>· {new Date(it.created_at).toLocaleDateString('az-AZ')}</span>
                    <span className={`badge ${
                      it.status === 'active'   ? 'badge-active' :
                      it.status === 'review'   ? 'badge-reserv' :
                      it.status === 'sold'     ? 'badge-trusted' :
                      'badge-ad'
                    }`}>
                      {it.status === 'active' ? 'Aktiv' :
                       it.status === 'review' ? 'Moderasiyada' :
                       it.status === 'sold' ? 'Satıldı' :
                       it.status === 'archived' ? 'Arxiv' : it.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap sm:flex-col gap-2 sm:w-44 shrink-0">
                  {it.status === 'active' && (
                    <>
                      <button onClick={() => action(it.id, 'bump')} className="btn-tap text-xs flex-1 sm:flex-none justify-center">
                        <ArrowUp className="w-3.5 h-3.5" /> Yuxarı qaldır
                      </button>
                      <button onClick={() => action(it.id, 'sold')} className="btn-secondary text-xs flex-1 sm:flex-none justify-center">
                        <CheckCircle className="w-3.5 h-3.5" /> Satıldı
                      </button>
                    </>
                  )}
                  {it.status === 'archived' && (
                    <button onClick={() => action(it.id, 'reactivate')} className="btn-tap text-xs flex-1 sm:flex-none justify-center">
                      <RefreshCw className="w-3.5 h-3.5" /> Aktivləşdir
                    </button>
                  )}
                  <Link href={`/elanlar/${it.id}`} className="btn-secondary text-xs flex-1 sm:flex-none justify-center">
                    <Pencil className="w-3.5 h-3.5" /> Bax
                  </Link>
                  {it.status !== 'archived' && (
                    <button onClick={() => action(it.id, 'archive')} className="btn-secondary text-xs flex-1 sm:flex-none justify-center !text-red-600 !border-red-200 hover:!bg-red-50">
                      <Archive className="w-3.5 h-3.5" /> Arxiv
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
