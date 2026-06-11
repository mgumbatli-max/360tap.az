'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice2 } from '@/lib/currency';

export default function FeaturedCarousel() {
  const [items, setItems] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ items: any[] }>('/listings?limit=12&sort=popular').then((d) => {
      const vips = (d.items ?? []).filter((i) => i.is_vip || i.is_premium);
      setItems(vips.length > 0 ? vips : d.items.slice(0, 8));
    }).catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const w = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -w * 0.7 : w * 0.7, behavior: 'smooth' });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-8" data-pro-only="true">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-ink-900 flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" />
          Premium elanlar
        </h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="btn-icon" aria-label="Sol"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => scroll('right')} className="btn-icon" aria-label="Sağ"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-thin pb-2 snap-x snap-mandatory">
        {items.map((it) => (
          <Link
            key={it.id}
            href={`/elanlar/${it.id}`}
            className="card p-2 shrink-0 w-[200px] sm:w-[240px] snap-start group hover:border-amber-400 ring-2 ring-amber-200/50"
          >
            <div className="relative aspect-square bg-ink-100 rounded-lg overflow-hidden mb-2">
              {it.media?.[0]?.url && (
                <Image src={it.media[0].url} alt={it.title} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover group-hover:scale-105 transition" />
              )}
              {it.is_vip && (
                <span className="absolute top-2 left-2 badge badge-trusted">
                  <Crown className="w-3 h-3" /> VIP
                </span>
              )}
            </div>
            <div className="font-bold text-lg gradient-aurora-text">
              {formatPrice2(it.price, it.currency)}
            </div>
            <div className="text-sm text-ink-700 line-clamp-2 mt-0.5 leading-tight">{it.title}</div>
            <div className="text-xs text-ink-400 mt-1">{it.city_name ?? ''}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
