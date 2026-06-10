'use client';
import { Trophy, Award, Crown, Star, Zap } from 'lucide-react';

export type Level = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface UserStats {
  listings: number;
  sales: number;
  reviews: number;
  rating?: number;
}

export function calculateXP(stats: UserStats): { xp: number; level: Level; nextThreshold: number; progress: number; title: string } {
  const xp = stats.listings * 10 + stats.sales * 50 + stats.reviews * 20;
  const thresholds = [
    { level: 'bronze' as Level,   min: 0,    title: 'Yeni başlayan',    icon: Star },
    { level: 'silver' as Level,   min: 200,  title: 'Aktiv satıcı',     icon: Award },
    { level: 'gold' as Level,     min: 800,  title: 'Etibarlı satıcı',  icon: Trophy },
    { level: 'platinum' as Level, min: 2500, title: 'Premium satıcı',   icon: Crown },
    { level: 'diamond' as Level,  min: 8000, title: 'Top satıcı',       icon: Zap },
  ];
  const current = [...thresholds].reverse().find((t) => xp >= t.min) ?? thresholds[0];
  const next = thresholds.find((t) => t.min > xp);
  const progress = next ? ((xp - current.min) / (next.min - current.min)) * 100 : 100;

  return {
    xp,
    level: current.level,
    nextThreshold: next?.min ?? current.min,
    progress: Math.min(100, progress),
    title: current.title,
  };
}

const COLORS: Record<Level, { bg: string; text: string; border: string; icon: any }> = {
  bronze:   { bg: 'bg-orange-100',   text: 'text-orange-700',   border: 'border-orange-200', icon: Star },
  silver:   { bg: 'bg-slate-100',    text: 'text-slate-700',    border: 'border-slate-200',  icon: Award },
  gold:     { bg: 'bg-amber-100',    text: 'text-amber-700',    border: 'border-amber-200',  icon: Trophy },
  platinum: { bg: 'bg-blue-100',     text: 'text-blue-700',     border: 'border-blue-200',   icon: Crown },
  diamond:  { bg: 'bg-violet-100',   text: 'text-violet-700',   border: 'border-violet-200', icon: Zap },
};

export default function XPBadge({ stats, compact = false }: { stats: UserStats; compact?: boolean }) {
  const { xp, level, nextThreshold, progress, title } = calculateXP(stats);
  const c = COLORS[level];
  const Icon = c.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} ${c.text} text-xs font-bold border ${c.border}`}>
        <Icon className="w-3 h-3" />
        {title}
      </span>
    );
  }

  return (
    <div className={`card p-4 ${c.bg} ${c.border}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center border-2 ${c.border}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className={`font-bold ${c.text} capitalize`}>{title}</div>
          <div className="text-xs text-ink-500">{xp.toLocaleString()} XP</div>
        </div>
      </div>

      {nextThreshold > xp && (
        <>
          <div className="h-2 rounded-full bg-white/60 overflow-hidden">
            <div
              className={`h-full ${c.text.replace('text-', 'bg-')} transition-all duration-700`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-ink-600 mt-1.5">
            Növbəti səviyyəyə: {(nextThreshold - xp).toLocaleString()} XP
          </div>
        </>
      )}
    </div>
  );
}
