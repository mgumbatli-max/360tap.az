'use client';
import { Eye, Heart, Phone, MessageCircle, TrendingUp } from 'lucide-react';

export default function ListingMiniStats({ stats }: { stats?: { views?: number; favorites?: number; phone_reveals?: number; messages?: number; rank?: number } }) {
  if (!stats) return null;
  const items = [
    { v: stats.views || 0, icon: Eye, label: 'Baxış', color: 'text-blue-500 bg-blue-50' },
    { v: stats.favorites || 0, icon: Heart, label: 'Sevimli', color: 'text-pink-500 bg-pink-50' },
    { v: stats.phone_reveals || 0, icon: Phone, label: 'Zəng', color: 'text-emerald-500 bg-emerald-50' },
    { v: stats.messages || 0, icon: MessageCircle, label: 'Mesaj', color: 'text-amber-500 bg-amber-50' },
  ];
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Elanınız haqqında</h3>
        {stats.rank && (
          <span className="text-xs flex items-center gap-1 text-emerald-600 font-bold">
            <TrendingUp className="w-3 h-3" /> #{stats.rank} sıra
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {items.map((it, i) => {
          const I = it.icon;
          return (
            <div key={i} className="text-center">
              <div className={`w-9 h-9 rounded-xl ${it.color} flex items-center justify-center mx-auto mb-1`}>
                <I className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-base">{it.v}</div>
              <div className="text-[10px] text-ink-500">{it.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
