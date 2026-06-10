'use client';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export default function PriceHistory({ currentPrice }: { currentPrice: number }) {
  // Mock: 6 nöqtə son 6 ay üçün
  const history = Array.from({ length: 6 }).map((_, i) => {
    const variance = (Math.random() - 0.5) * 0.15;
    return Math.round(currentPrice * (1 + variance + (i * 0.01)));
  }).concat(currentPrice);

  const min = Math.min(...history);
  const max = Math.max(...history);
  const change = ((currentPrice - history[0]) / history[0]) * 100;
  const months = ['6 ay öncə', '5', '4', '3', '2', '1 ay öncə', 'İndi'];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Qiymət tarixçəsi</h3>
        <div className={`text-xs font-bold flex items-center gap-1 ${change > 1 ? 'text-red-500' : change < -1 ? 'text-emerald-500' : 'text-ink-500'}`}>
          {change > 1 ? <TrendingUp className="w-3.5 h-3.5" /> : change < -1 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </div>
      </div>
      <div className="relative h-24 flex items-end gap-1.5">
        {history.map((p, i) => {
          const h = ((p - min) / (max - min || 1)) * 100;
          const isLast = i === history.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer">
              <div
                style={{ height: `${Math.max(h, 4)}%` }}
                className={`w-full rounded-t transition ${
                  isLast ? 'bg-tap' : 'bg-tap/30 group-hover:bg-tap/60'
                }`}
              />
              <div className="text-[9px] text-ink-400 mt-1 -rotate-45 whitespace-nowrap">{months[i]}</div>
              <div className="absolute -top-6 text-[10px] font-bold opacity-0 group-hover:opacity-100 bg-ink-900 text-white px-1.5 py-0.5 rounded">
                {p.toLocaleString('az-AZ')} ₼
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-ink-500 mt-2">Son 6 ay üzrə qiymət dinamikası</p>
    </div>
  );
}
