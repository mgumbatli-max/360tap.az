'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type Insight = {
  position: number | null;
  median: number;
  avg: number;
  sample: number;
  myPrice: number;
  assessment: 'low' | 'medium' | 'high';
  label: string;
};

export default function PriceInsight({ listingId }: { listingId: string }) {
  const [data, setData] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Insight & { position: any }>(`/insights/listing/${listingId}/price-position`)
      .then((d) => setData(d as any))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) {
    return (
      <div className="card p-3 text-sm text-ink-500 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Bazar qiymətlərinə görə təhlil...
      </div>
    );
  }
  if (!data || !data.median) return null;

  const Icon = data.assessment === 'low' ? TrendingDown
             : data.assessment === 'high' ? TrendingUp : Minus;
  const colors = data.assessment === 'low'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : data.assessment === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200'
              :                              'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div className={`card p-4 ${colors}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-bold">{data.label}</div>
          <div className="text-xs mt-1.5 space-y-0.5">
            <div>Bazar median: <strong>{Math.round(data.median).toLocaleString('az-AZ')} ₼</strong></div>
            <div>Bənzər elan sayı: <strong>{data.sample}</strong></div>
            {data.position != null && (
              <div>Sizin qiymət: bütün bənzər elanların {data.position}%-dən aşağıdadır</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
