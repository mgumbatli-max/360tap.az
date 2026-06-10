'use client';
import { Award, Star, Zap, Crown, Heart, TrendingUp, ShoppingBag, Users } from 'lucide-react';

const BADGES = [
  { id: 1, icon: Star, name: '5 ulduz satıcı', desc: '4.8+ rating', unlocked: true, color: 'text-amber-500' },
  { id: 2, icon: Zap, name: 'Sürətli', desc: '< 5 dəq cavab', unlocked: true, color: 'text-blue-500' },
  { id: 3, icon: Crown, name: 'Premium', desc: '10 satış üzərində', unlocked: true, color: 'text-violet-500' },
  { id: 4, icon: Heart, name: 'Sevimli', desc: '50 favorit', unlocked: false, color: 'text-pink-500' },
  { id: 5, icon: TrendingUp, name: 'Top satıcı', desc: 'TOP 100-də', unlocked: false, color: 'text-emerald-500' },
  { id: 6, icon: ShoppingBag, name: '100 elan', desc: '100 elan dərc', unlocked: false, color: 'text-orange-500' },
  { id: 7, icon: Users, name: 'Sosial', desc: '50 izləyici', unlocked: false, color: 'text-cyan-500' },
  { id: 8, icon: Award, name: 'Verified', desc: 'Şəxsi sənəd', unlocked: true, color: 'text-emerald-500' },
];

export default function AchievementBadges() {
  const unlocked = BADGES.filter((b) => b.unlocked).length;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Nailiyyətlər</h3>
        <span className="text-xs font-bold text-tap">{unlocked}/{BADGES.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {BADGES.map((b) => {
          const I = b.icon;
          return (
            <div key={b.id} title={b.desc}
              className={`p-2 rounded-lg text-center transition ${b.unlocked ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200' : 'opacity-30 grayscale'}`}>
              <I className={`w-5 h-5 mx-auto ${b.color}`} />
              <div className="text-[9px] font-bold mt-1 line-clamp-1">{b.name}</div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-ink-500 mt-2">Yeni nailiyyət açın və premium status əldə edin</p>
    </div>
  );
}
