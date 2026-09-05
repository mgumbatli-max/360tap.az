'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfileLayout from '@/components/ProfileLayout';
import { getRecent, clearRecent, type RecentItem } from '@/lib/recent';
import { formatPrice2 } from '@/lib/currency';
import { Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { azDate } from '@/lib/format';

export default function RecentlyViewedPage() {
  const toast = useToast();
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => { setItems(getRecent()); }, []);

  const onClear = () => {
    if (!confirm('Bütün son baxılan elanları silmək istəyirsiniz?')) return;
    clearRecent();
    setItems([]);
    toast.success('Son baxılanlar təmizləndi');
  };

  return (
    <ProfileLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-ink-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-tap" />
          Son baxılanlar <span className="text-ink-400 font-normal">{items.length}</span>
        </h1>
        {items.length > 0 && (
          <button onClick={onClear} className="btn-secondary text-sm !text-red-600 !border-red-200 hover:!bg-red-50">
            <Trash2 className="w-4 h-4" /> Hamısını sil
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <Clock className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-600 mb-3">Hələ heç bir elana baxmamısınız</p>
          <Link href="/elanlar" className="btn-tap inline-flex">Elanlara bax</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it) => (
            <Link key={it.id} href={`/elanlar/${it.id}`} className="card p-2 group">
              <div className="aspect-square bg-ink-100 rounded-lg overflow-hidden mb-2">
                {it.cover && (
                  <img src={it.cover} alt={it.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                )}
              </div>
              <div className="font-bold text-base">{formatPrice2(it.price, it.currency)}</div>
              <div className="text-sm text-ink-600 line-clamp-2 mt-0.5 leading-tight">{it.title}</div>
              <div className="text-[11px] text-ink-400 mt-1">
                {it.city ?? ''}
                {it.viewedAt ? ` · ${azDate(it.viewedAt)}` : ''}
              </div>
            </Link>
          ))}
        </div>
      )}
    </ProfileLayout>
  );
}
