'use client';
import { Shield, Star, CheckCircle, Award } from 'lucide-react';

export default function TrustScore({ user }: { user: any }) {
  let score = 50;
  if (user.is_verified) score += 20;
  if (user.phone_verified) score += 10;
  if (user.email_verified) score += 10;
  if ((user.rating || 0) >= 4.5) score += 15;
  if ((user.listings_count || 0) >= 10) score += 10;
  if ((user.successful_deals || 0) >= 5) score += 15;
  score = Math.min(100, score);
  const level = score >= 90 ? 'platinum' : score >= 75 ? 'gold' : score >= 60 ? 'silver' : 'bronze';
  const colors: Record<string, string> = {
    platinum: 'from-violet-500 to-tap',
    gold:     'from-amber-400 to-orange-500',
    silver:   'from-slate-400 to-slate-500',
    bronze:   'from-orange-300 to-amber-400',
  };
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[level]} flex items-center justify-center text-white`}>
          <Award className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-ink-500 font-bold uppercase">Etibar balı</div>
          <div className="font-extrabold text-lg">{score}/100 <span className="text-xs uppercase ml-1">{level}</span></div>
        </div>
      </div>
      <div className="w-full h-2 bg-ink-100 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${colors[level]}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
