'use client';
import { useEffect, useState } from 'react';
import { Sparkles, Heart, MapPin } from 'lucide-react';
import Link from 'next/link';
import { api, formatPrice } from '@/lib/api';

export default function SmartSuggestionsForYou() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api<{ items: any[] }>(`/listings?sort=popular&limit=6`).then((d) => setItems(d.items || []));
  }, []);
  if (!items.length) return null;
  return (
    <section className="my-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-tap" />
          <h2 className="text-xl font-extrabold">AI sizin üçün seçdi</h2>
          <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-tap to-violet-500 text-white rounded-full font-bold">Yenı</span>
        </div>
        <Link href="/elanlar" className="text-sm text-tap hover:underline">Hamısı →</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((it) => (
          <Link key={it.id} href={`/elanlar/${it.id}`} className="card p-2 group hover:-translate-y-0.5 transition relative">
            <span className="absolute top-3 left-3 z-10 px-1.5 py-0.5 bg-violet-500 text-white text-[9px] font-bold rounded backdrop-blur">AI</span>
            <div className="aspect-square bg-ink-100 rounded-lg overflow-hidden mb-2">
              {it.media?.[0]?.url && <img src={it.media[0].url} alt={it.title} className="w-full h-full object-cover group-hover:scale-105 transition" />}
            </div>
            <div className="font-bold text-sm">{formatPrice(it.price, it.currency)}</div>
            <div className="text-xs text-ink-600 line-clamp-1">{it.title}</div>
            {it.city_name && <div className="text-[10px] text-ink-500 flex items-center gap-0.5 mt-0.5"><MapPin className="w-2.5 h-2.5" />{it.city_name}</div>}
          </Link>
        ))}
      </div>
    </section>
  );
}
