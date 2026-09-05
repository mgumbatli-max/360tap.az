'use client';
import { useState } from 'react';
import { Users, Sparkles } from 'lucide-react';
import { azNumber } from '@/lib/format';

export default function GroupBuy({ price }: { price: number }) {
  const [joined, setJoined] = useState(0);
  const target = 5;
  const discount = Math.min(20, joined * 4);
  const finalPrice = Math.round(price * (1 - discount / 100));
  return (
    <div className="card p-4 bg-gradient-to-r from-violet-50 to-pink-50 border-violet-200">
      <h3 className="font-bold flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-violet-600" /> Birgə alış (qrup endirimi)
      </h3>
      <p className="text-xs text-ink-600 mb-3">{target} nəfər birləşsə hər kəs üçün <strong>20% endirim</strong></p>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-3 bg-ink-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500" style={{ width: `${(joined/target)*100}%` }} />
        </div>
        <span className="text-xs font-bold">{joined}/{target}</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-ink-500 line-through">{azNumber(price)}₼</div>
          <div className="text-2xl font-extrabold text-tap">{azNumber(finalPrice)}₼</div>
          <div className="text-xs text-emerald-600 font-bold">-{discount}% endirim</div>
        </div>
        <button onClick={() => setJoined((j) => Math.min(target, j+1))} className="btn-tap">
          <Sparkles className="w-4 h-4" /> Qrupa qoşul
        </button>
      </div>
    </div>
  );
}
