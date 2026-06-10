'use client';
import { useState } from 'react';
import { X, Crown, Zap, Star, TrendingUp, Check } from 'lucide-react';
import { useToast } from '@/lib/toast';

const PLANS = [
  { id: 'urgent',  name: 'Təcili',   icon: Zap,       color: 'red',    price: 2,  views: '×3',  days: 3,  features: ['Ən üstdə qırmızı bayraq', 'Ana səhifədə üstdə', '3 günlük'] },
  { id: 'vip',     name: 'VIP',      icon: Star,      color: 'amber',  price: 5,  views: '×5',  days: 7,  features: ['VIP zolaq + qızıl border', 'Ana səhifədə VIP bölmə', '7 günlük', 'Hər kateqoriyada üstdə'] },
  { id: 'premium', name: 'Premium',  icon: Crown,     color: 'violet', price: 12, views: '×10', days: 14, features: ['Premium yer (ən üstdə)', 'Kategorya kart sırasının başında', '14 günlük', 'Logoya yaxın yer', 'AI öncəlik'] },
  { id: 'top',     name: 'Ən üstdə', icon: TrendingUp,color: 'blue',   price: 1,  views: '×2',  days: 1,  features: ['1 günlük üstə qalxma', 'Yeni elan effekti', '24 saat'] },
];

export default function BoostModal({ listingId, onClose }: { listingId: string; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const toast = useToast();

  const buy = () => {
    if (!selected) return;
    toast.success(`${PLANS.find(p => p.id === selected)?.name} paketi aktivləşdirildi`);
    setTimeout(onClose, 800);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c2128] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-5 border-b border-ink-100 dark:border-ink-700">
          <div>
            <h2 className="text-2xl font-extrabold">Elanı qaldır 🚀</h2>
            <p className="text-sm text-ink-500 mt-0.5">Daha çox baxış, daha tez satış</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 hover:bg-ink-100 rounded-full flex items-center justify-center"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-5 grid sm:grid-cols-2 gap-3 overflow-y-auto max-h-[60vh]">
          {PLANS.map((p) => {
            const I = p.icon;
            const isActive = selected === p.id;
            return (
              <button key={p.id} onClick={() => setSelected(p.id)}
                className={`card p-4 text-left transition ${isActive ? '!border-tap shadow-lg' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-${p.color}-50 text-${p.color}-600 flex items-center justify-center`}>
                    <I className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-tap">{p.price} ₼</div>
                    <div className="text-xs text-ink-500">{p.days} gün</div>
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <div className="text-xs text-emerald-600 font-semibold mb-2">📈 Baxış {p.views}</div>
                <ul className="text-xs text-ink-600 dark:text-ink-400 space-y-1">
                  {p.features.map((f, i) => <li key={i} className="flex items-start gap-1"><Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />{f}</li>)}
                </ul>
              </button>
            );
          })}
        </div>
        <footer className="p-5 border-t border-ink-100 dark:border-ink-700 flex items-center justify-between gap-3">
          <div className="text-sm text-ink-500">
            {selected ? `${PLANS.find(p => p.id === selected)?.name} paketi: ${PLANS.find(p => p.id === selected)?.price} ₼` : 'Paket seçin'}
          </div>
          <button onClick={buy} disabled={!selected} className="btn-tap">
            Ödə və aktivləşdir
          </button>
        </footer>
      </div>
    </div>
  );
}
