'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { azNumber } from '@/lib/format';

const FAKE_SOLD = [
  { title: 'BMW X5 2020', price: 78000, time: '2 dəq əvvəl', city: 'Bakı' },
  { title: 'iPhone 14 Pro 256GB', price: 2400, time: '5 dəq əvvəl', city: 'Sumqayıt' },
  { title: 'MacBook Pro M2', price: 3200, time: '8 dəq əvvəl', city: 'Bakı' },
  { title: '3 otaqlı mənzil Nəsimi', price: 145000, time: '12 dəq əvvəl', city: 'Bakı' },
  { title: 'Toyota Camry 2019', price: 38000, time: '15 dəq əvvəl', city: 'Gəncə' },
  { title: 'Samsung Galaxy S23', price: 1600, time: '18 dəq əvvəl', city: 'Bakı' },
];

export default function RecentlySoldFeed() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % FAKE_SOLD.length), 4500);
    return () => clearInterval(t);
  }, []);
  const item = FAKE_SOLD[idx];
  return (
    <div className="fixed bottom-40 left-6 z-30 card p-3 max-w-xs animate-fade-in-up bg-white dark:bg-[#1c2128] shadow-2xl border-emerald-200">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-emerald-600 font-bold uppercase">İndi satıldı</div>
          <div className="font-semibold text-sm line-clamp-1">{item.title}</div>
          <div className="text-xs text-tap font-bold">{azNumber(item.price)} ₼</div>
          <div className="text-[10px] text-ink-500 flex items-center gap-1 mt-0.5">
            <Clock className="w-2.5 h-2.5" /> {item.time} · 📍 {item.city}
          </div>
        </div>
      </div>
    </div>
  );
}
