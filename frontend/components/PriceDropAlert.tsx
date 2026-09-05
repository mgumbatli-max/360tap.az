'use client';
import { useState } from 'react';
import { Bell, TrendingDown, X } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { azNumber } from '@/lib/format';

export default function PriceDropAlert({ listingId, currentPrice }: { listingId: string; currentPrice: number }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(Math.round(currentPrice * 0.9));
  const toast = useToast();

  const subscribe = () => {
    const list = JSON.parse(localStorage.getItem('tap_price_alerts') || '[]');
    list.push({ id: listingId, target, current: currentPrice, createdAt: Date.now() });
    localStorage.setItem('tap_price_alerts', JSON.stringify(list));
    toast.success(`Xəbərdar olacaqsınız: qiymət ${target}₼-ə düşəndə`);
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm">
        <TrendingDown className="w-4 h-4 text-emerald-500" /> Qiymət düşəndə xəbər ver
      </button>
      {open && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-[#1c2128] rounded-2xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2"><Bell className="w-4 h-4 text-tap" /> Qiymət xəbərdarlığı</h3>
              <button onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-ink-500 mb-3">Cari qiymət: <strong>{azNumber(currentPrice)}₼</strong></p>
            <label className="text-xs font-semibold text-ink-700">Hədəf qiymət</label>
            <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))}
              max={currentPrice} className="input mt-1" />
            <input type="range" min={currentPrice * 0.5} max={currentPrice * 0.99} step={50}
              value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full mt-2" />
            <div className="text-xs text-ink-500 text-center mt-1">-{Math.round((1 - target/currentPrice) * 100)}% endirim</div>
            <button onClick={subscribe} className="btn-tap w-full mt-3">Abunə ol</button>
          </div>
        </div>
      )}
    </>
  );
}
