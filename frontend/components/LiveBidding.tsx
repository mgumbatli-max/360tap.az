'use client';
import { useState } from 'react';
import { Gavel, TrendingUp } from 'lucide-react';
import { useToast } from '@/lib/toast';

export default function LiveBidding({ basePrice }: { basePrice: number }) {
  const [bids, setBids] = useState<{ amount: number; user: string; time: string }[]>([
    { amount: basePrice * 0.92, user: 'Anonim 1', time: '12 dəq öncə' },
    { amount: basePrice * 0.85, user: 'Anonim 2', time: '25 dəq öncə' },
  ]);
  const [myBid, setMyBid] = useState(bids[0].amount + 100);
  const toast = useToast();

  const place = () => {
    if (myBid <= bids[0]?.amount) { toast.error('Təklifiniz ən yüksəkdən böyük olmalıdır'); return; }
    setBids([{ amount: myBid, user: 'Siz', time: 'indi' }, ...bids]);
    toast.success('Təklif yerləşdirildi');
    setMyBid(myBid + 100);
  };

  return (
    <div className="card p-4 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
      <h3 className="font-bold flex items-center gap-2 mb-3"><Gavel className="w-4 h-4 text-amber-600" /> Canlı təklif (auksion rejimi)</h3>
      <div className="text-xs text-ink-600 mb-2">Hazırkı ən yüksək: <strong className="text-amber-700 text-base">{bids[0]?.amount.toLocaleString('az-AZ')}₼</strong></div>
      <div className="flex gap-2 mb-3">
        <input type="number" value={myBid} onChange={(e) => setMyBid(Number(e.target.value))}
          min={bids[0]?.amount + 50} className="input flex-1 !py-2 font-bold" />
        <button onClick={place} className="btn-tap !py-2">
          <TrendingUp className="w-4 h-4" /> Təklif et
        </button>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {bids.map((b, i) => (
          <div key={i} className={`flex justify-between text-xs p-1.5 rounded ${i === 0 ? 'bg-amber-100 font-bold' : 'bg-white/60'}`}>
            <span>{b.user}</span>
            <span>{b.amount.toLocaleString('az-AZ')}₼</span>
            <span className="text-ink-500">{b.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
