'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { History } from 'lucide-react';
import { getRecent } from '@/lib/recent';

export default function RecentlyViewed() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const r = getRecent().slice(0, 6);
    setItems(r);
  }, []);

  if (!items.length) return null;
  return (
    <section className="my-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-extrabold flex items-center gap-2">
          <History className="w-5 h-5 text-tap" /> Son baxdıqlarınız
        </h2>
        <button onClick={() => { localStorage.removeItem('tap_recent'); setItems([]); }} className="text-xs text-ink-500 hover:text-red-600">Təmizlə</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((it) => (
          <Link key={it.id} href={`/elanlar/${it.id}`} className="card p-2 group">
            <div className="aspect-square bg-ink-100 rounded-lg overflow-hidden mb-2">
              {it.cover && <img src={it.cover} alt={it.title} className="w-full h-full object-cover group-hover:scale-105 transition" />}
            </div>
            <div className="font-bold text-sm">{it.price ? `${Number(it.price).toLocaleString('az-AZ')} ${it.currency || '₼'}` : 'Razılaşma'}</div>
            <div className="text-xs text-ink-600 line-clamp-1 mt-0.5">{it.title}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
