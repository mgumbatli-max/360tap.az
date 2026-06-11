'use client';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatPrice2 } from '@/lib/currency';

export default function AISimilar({ listingId }: { listingId: string }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api<{ items: any[] }>(`/ai/similar/${listingId}`).then(d => setItems(d.items)).catch(() => setItems([]));
  }, [listingId]);

  if (!items.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-tap" />
        AI seçimi: bənzər elanlar
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((l) => (
          <Link key={l.id} href={`/elanlar/${l.id}`} className="card p-2 hover:border-tap group">
            <div className="relative aspect-square bg-ink-100 rounded-lg overflow-hidden mb-2">
              {l.cover?.url && <Image src={l.cover.url} alt={l.title} fill sizes="(max-width: 768px) 50vw, 180px" className="object-cover group-hover:scale-105 transition" />}
            </div>
            <div className="font-bold text-sm">{formatPrice2(l.price, l.currency)}</div>
            <div className="text-xs text-ink-500 line-clamp-2 mt-0.5">{l.title}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
