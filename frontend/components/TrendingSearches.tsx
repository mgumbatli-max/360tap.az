'use client';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { azNumber } from '@/lib/format';

const TRENDING = [
  { q: 'BMW X5 2020', count: 1840, change: '+45%' },
  { q: 'Kirayə mənzil Nəsimi', count: 1420, change: '+32%' },
  { q: 'iPhone 14 Pro Max', count: 1180, change: '+28%' },
  { q: 'Toyota Camry', count: 980, change: '+22%' },
  { q: 'PlayStation 5', count: 920, change: '+18%' },
  { q: 'MacBook Air M2', count: 870, change: '+15%' },
];

export default function TrendingSearches() {
  return (
    <div className="card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-amber-500" /> Bu həftə trend</h3>
      <div className="space-y-1.5">
        {TRENDING.map((t, i) => (
          <Link key={t.q} href={`/elanlar?q=${encodeURIComponent(t.q)}`}
            className="flex items-center gap-3 p-1.5 hover:bg-ink-50 rounded-lg group">
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">{i+1}</div>
            <div className="flex-1">
              <div className="text-sm font-medium group-hover:text-tap">{t.q}</div>
              <div className="text-[10px] text-ink-500">{azNumber(t.count)} axtarış</div>
            </div>
            <span className="text-xs font-bold text-emerald-600">{t.change}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
