'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, Users, Clock, Sparkles } from 'lucide-react';

const STATS = [
  { icon: TrendingUp, label: 'bu gün satıldı', from: 1200, to: 1450, color: 'text-emerald-500' },
  { icon: Users,      label: 'indi onlayn',    from: 340, to: 480, color: 'text-blue-500' },
  { icon: Clock,      label: 'yeni elan saatda', from: 45, to: 95, color: 'text-amber-500' },
  { icon: Sparkles,   label: 'AI tövsiyə bu gün', from: 320, to: 480, color: 'text-violet-500' },
];

export default function LiveDealsTicker() {
  const [vals, setVals] = useState<number[]>(STATS.map((s) => s.from));
  useEffect(() => {
    const t = setInterval(() => {
      setVals((v) => v.map((x, i) => {
        const target = STATS[i].to;
        if (x >= target) return STATS[i].from;
        return x + Math.floor(Math.random() * 3) + 1;
      }));
    }, 2500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="card p-3 bg-gradient-to-r from-tap/5 via-violet-50 to-pink-50 dark:from-tap/10 dark:via-violet-500/10 dark:to-pink-500/10 border-tap/20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((s, i) => {
          const I = s.icon;
          return (
            <div key={i} className="flex items-center gap-2">
              <I className={`w-5 h-5 ${s.color}`} />
              <div>
                <div className="font-extrabold text-base">{vals[i].toLocaleString('az-AZ')}</div>
                <div className="text-[10px] text-ink-500">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
