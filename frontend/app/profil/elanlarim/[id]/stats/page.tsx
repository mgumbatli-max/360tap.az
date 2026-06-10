'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProfileLayout from '@/components/ProfileLayout';
import { api } from '@/lib/api';
import { Eye, Heart, MessageCircle, Phone, TrendingUp, ArrowLeft } from 'lucide-react';

export default function ListingStatsPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);

  useEffect(() => {
    api<{ listing: any }>(`/listings/${id}`).then((d) => setListing(d.listing));
  }, [id]);

  if (!listing) return <ProfileLayout><div className="p-8 text-center">Yüklənir...</div></ProfileLayout>;

  // Demo data — gələcəkdə backend stats endpoint
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d,
      views: Math.floor(Math.random() * 30) + 5,
      messages: Math.floor(Math.random() * 5),
    };
  });
  const max = Math.max(...days.map((d) => d.views), 1);

  return (
    <ProfileLayout>
      <Link href="/profil/elanlarim" className="text-sm text-ink-500 hover:text-tap inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="w-4 h-4" /> Mənim elanlarıma qayıt
      </Link>

      <h1 className="text-2xl font-extrabold text-ink-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-tap" />
        Statistika
      </h1>

      <div className="card p-4 mb-5 flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg bg-ink-100 overflow-hidden shrink-0">
          {listing.media?.[0]?.url && <img src={listing.media[0].url} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{listing.title}</div>
          <div className="text-sm text-ink-500">{listing.price ? `${Number(listing.price).toLocaleString('az-AZ')} ${listing.currency}` : 'Razılaşma'}</div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Cəmi baxış', value: listing.views ?? 0, icon: Eye, color: 'bg-blue-500' },
          { label: 'Sevimliyə əlavə', value: listing.favorites_count ?? 0, icon: Heart, color: 'bg-pink-500' },
          { label: 'Mesajlar', value: 0, icon: MessageCircle, color: 'bg-violet-500' },
          { label: 'Telefon klik', value: listing.phone_clicks ?? 0, icon: Phone, color: 'bg-emerald-500' },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <div className={`w-10 h-10 rounded-xl ${k.color} text-white flex items-center justify-center mb-2`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-extrabold">{k.value}</div>
            <div className="text-xs text-ink-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart 14 gün */}
      <div className="card p-5">
        <h3 className="font-bold mb-4">Son 14 gün — baxış</h3>
        <div className="flex items-end gap-1 h-40">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                className="w-full bg-tap-200 hover:bg-tap rounded-t transition relative"
                style={{ height: `${(d.views / max) * 100}%` }}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100">
                  {d.views}
                </span>
              </div>
              <span className="text-[10px] text-ink-400">{d.date.getDate()}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-ink-500 mt-3 text-center">
          Cəmi: {days.reduce((s, d) => s + d.views, 0)} baxış · {days.reduce((s, d) => s + d.messages, 0)} mesaj
        </div>
      </div>
    </ProfileLayout>
  );
}
