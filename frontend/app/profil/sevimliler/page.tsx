'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfileLayout from '@/components/ProfileLayout';
import { Heart, Trash2, CheckSquare, Square } from 'lucide-react';
import { getMyFavorites, toggleFavorite } from '@/lib/favorites';
import { formatPrice2 } from '@/lib/currency';
import { useToast } from '@/lib/toast';
import WishlistGroups from '@/components/WishlistGroups';

export default function FavoritesPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = () => {
    setLoading(true);
    getMyFavorites().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const removeSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} elanı sevimlilərdən silmək istəyirsiniz?`)) return;
    for (const id of selected) {
      await toggleFavorite(id, true).catch(() => {});
    }
    toast.success(`${selected.size} elan silindi`);
    setSelected(new Set());
    load();
  };

  return (
    <ProfileLayout>
      <div className="mb-4"><WishlistGroups /></div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-extrabold text-ink-900">
          Sevimlilər <span className="text-ink-400 font-normal">{items.length}</span>
        </h1>
        {items.length > 0 && (
          <div className="flex gap-2">
            <button onClick={selectAll} className="btn-secondary text-sm">
              {selected.size === items.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selected.size === items.length ? 'Heçbiri' : 'Hamısı'}
            </button>
            {selected.size > 0 && (
              <button onClick={removeSelected} className="btn-secondary text-sm !text-red-600 !border-red-200 hover:!bg-red-50">
                <Trash2 className="w-4 h-4" /> Sil ({selected.size})
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-ink-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Heart className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-600 mb-3">Sevimlilər siyahısı boşdur</p>
          <Link href="/elanlar" className="btn-tap inline-flex">Elanlara bax</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((l: any) => (
            <div key={l.id} className="relative">
              <button
                onClick={() => toggleSelect(l.id)}
                className="absolute top-2 left-2 z-10 w-6 h-6 rounded bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white"
                aria-label="Seç"
              >
                {selected.has(l.id)
                  ? <CheckSquare className="w-4 h-4 text-tap" />
                  : <Square className="w-4 h-4 text-ink-400" />}
              </button>
              <Link href={`/elanlar/${l.id}`} className={`card p-2 block group ${selected.has(l.id) ? 'ring-2 ring-tap' : ''}`}>
                <div className="aspect-square bg-ink-100 rounded-lg overflow-hidden mb-2">
                  {l.media?.[0]?.url && (
                    <img src={l.media[0].url} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  )}
                </div>
                <div className="font-bold">{formatPrice2(l.price, l.currency)}</div>
                <div className="text-sm text-ink-600 line-clamp-2 mt-0.5 leading-tight">{l.title}</div>
                <div className="text-[11px] text-ink-400 mt-0.5">{l.city_name ?? ''}</div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </ProfileLayout>
  );
}
