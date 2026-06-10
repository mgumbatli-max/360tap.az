'use client';
import ProfileLayout from '@/components/ProfileLayout';
import { useAuth } from '@/lib/auth';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const DEMO_TX = [
  { type: 'topup',    label: 'Balans artırma', amount: 50,  date: '8 May', positive: true },
  { type: 'vip',      label: 'VIP elan 7 gün',  amount: -5,  date: '7 May', positive: false },
  { type: 'boost',    label: 'Boost (Yuxarı qaldır)', amount: -1, date: '6 May', positive: false },
  { type: 'topup',    label: 'Balans artırma', amount: 25,  date: '5 May', positive: true },
];

export default function BalancePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <ProfileLayout>
      <h1 className="text-2xl font-extrabold text-ink-900 mb-4">Balans</h1>

      {/* Balans kartı */}
      <div className="card p-6 mb-5"
           style={{ background: 'linear-gradient(135deg, #00AAFF, #0060F0)' }}>
        <div className="flex items-center gap-2 text-white/90">
          <Wallet className="w-5 h-5" />
          <span className="text-sm font-medium">Mövcud balans</span>
        </div>
        <div className="text-4xl font-extrabold text-white mt-2">25.00 ₼</div>
        <div className="flex gap-2 mt-5">
          <button className="btn-secondary !bg-white !text-tap-700 font-bold">
            <Plus className="w-4 h-4" /> Balansı artır
          </button>
          <button className="btn-secondary !bg-white/20 !text-white !border-white/30 hover:!bg-white/30">
            Promo kod
          </button>
        </div>
      </div>

      {/* Sürətli paketlər */}
      <h2 className="font-bold text-ink-900 mb-3">Premium xidmətlər</h2>
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {[
          { name: 'Boost — Yuxarı qaldır', price: 1, desc: 'Bir dəfə üst sıraya çıxar' },
          { name: 'VIP 7 gün', price: 5, desc: 'Vitrində VIP rozetlə görün' },
          { name: 'Premium 7 gün', price: 12, desc: 'Kateqoriyada üst sıralarda' },
        ].map((p) => (
          <div key={p.name} className="card p-4">
            <h3 className="font-bold text-ink-900">{p.name}</h3>
            <div className="text-2xl font-extrabold mt-1">{p.price} ₼</div>
            <p className="text-xs text-ink-500 mt-1">{p.desc}</p>
            <button className="btn-tap w-full mt-3 text-sm">Almaq</button>
          </div>
        ))}
      </div>

      {/* Tarixçə */}
      <h2 className="font-bold text-ink-900 mb-3">Tranzaksiya tarixçəsi</h2>
      <div className="card divide-y divide-ink-100">
        {DEMO_TX.map((t, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              t.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {t.positive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{t.label}</div>
              <div className="text-xs text-ink-400">{t.date}</div>
            </div>
            <div className={`font-bold ${t.positive ? 'text-emerald-600' : 'text-ink-900'}`}>
              {t.positive ? '+' : ''}{t.amount} ₼
            </div>
          </div>
        ))}
      </div>
    </ProfileLayout>
  );
}
