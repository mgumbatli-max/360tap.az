'use client';
import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { api } from '@/lib/api';
import { azNumber } from '@/lib/format';

type District = { district: string; count: number; median: number; avg: number; price_per_sqm: number };

export default function PriceHeatmap({ propertyType = 'menzil-satilir' }: { propertyType?: string }) {
  const [data, setData] = useState<District[]>([]);
  useEffect(() => {
    api<{ districts: District[] }>(`/realestate/heatmap?property_type=${propertyType}`)
      .then((d) => setData(d.districts || []))
      .catch(() => setData([]));
  }, [propertyType]);

  if (!data.length) return null;
  const max = Math.max(...data.map((d) => Number(d.median)));
  const min = Math.min(...data.map((d) => Number(d.median)));

  const color = (val: number) => {
    const pct = (val - min) / (max - min || 1);
    if (pct > 0.8) return 'bg-red-500 text-white';
    if (pct > 0.6) return 'bg-orange-500 text-white';
    if (pct > 0.4) return 'bg-amber-400 text-ink-900';
    if (pct > 0.2) return 'bg-emerald-400 text-ink-900';
    return 'bg-emerald-200 text-ink-900';
  };

  return (
    <div className="card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-orange-500" />
        Bakı rayonları üzrə qiymət heatmap-i
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {data.slice(0, 15).map((d) => (
          <div key={d.district} className={`p-2.5 rounded-lg ${color(Number(d.median))}`}>
            <div className="text-xs font-bold">{d.district}</div>
            <div className="text-base font-extrabold">{azNumber(Math.round(Number(d.median)))} ₼</div>
            <div className="text-[10px] opacity-80">{d.count} elan</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-ink-500">
        <span>Aşağı</span>
        <div className="flex h-2 flex-1 rounded-full overflow-hidden">
          <div className="flex-1 bg-emerald-200" />
          <div className="flex-1 bg-emerald-400" />
          <div className="flex-1 bg-amber-400" />
          <div className="flex-1 bg-orange-500" />
          <div className="flex-1 bg-red-500" />
        </div>
        <span>Yüksək</span>
      </div>
    </div>
  );
}
