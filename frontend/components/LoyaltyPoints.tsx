'use client';
import { Sparkles, Award } from 'lucide-react';
import { azNumber } from '@/lib/format';

export default function LoyaltyPoints({ points = 1240, level = 'Silver' }: { points?: number; level?: string }) {
  const next = level === 'Silver' ? 'Gold' : level === 'Gold' ? 'Platinum' : 'Diamond';
  const nextAt = points < 2500 ? 2500 : points < 5000 ? 5000 : 10000;
  const pct = (points / nextAt) * 100;
  return (
    <div className="card p-4 bg-gradient-to-br from-violet-50 to-pink-50 border-violet-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold flex items-center gap-2"><Award className="w-4 h-4 text-violet-600" /> Sadiqlik xalları</h3>
        <span className="text-xs font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{level}</span>
      </div>
      <div className="text-3xl font-extrabold text-violet-700">{azNumber(points)} <span className="text-sm">xal</span></div>
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-ink-600 mb-1">
          <span>İndi {level}</span>
          <span>{next} → {azNumber(nextAt)}</span>
        </div>
        <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <p className="text-[10px] text-ink-500 mt-2">Hər elan +10, hər satış +50, hər rəy +20 xal</p>
    </div>
  );
}
