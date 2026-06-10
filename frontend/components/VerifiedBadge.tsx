'use client';
import { ShieldCheck } from 'lucide-react';

export default function VerifiedBadge({ level = 'silver' }: { level?: 'silver' | 'gold' | 'platinum' }) {
  const colors = {
    silver:   'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
    gold:     'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
    platinum: 'bg-gradient-to-r from-violet-500 to-tap text-white',
  };
  const labels = { silver: 'Təsdiq', gold: 'Premium', platinum: 'Platinum' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[level]}`}>
      <ShieldCheck className="w-3 h-3" /> {labels[level]}
    </span>
  );
}
