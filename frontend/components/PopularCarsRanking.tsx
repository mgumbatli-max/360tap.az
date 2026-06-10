'use client';
import { Trophy, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const POPULAR = [
  { rank: 1, brand: 'Toyota',   model: 'Camry',     count: 1840, avg: 28500, change: '+12%' },
  { rank: 2, brand: 'Hyundai',  model: 'Sonata',    count: 1420, avg: 22000, change: '+8%' },
  { rank: 3, brand: 'BMW',      model: '3 Series',  count: 1180, avg: 35000, change: '+15%' },
  { rank: 4, brand: 'Mercedes', model: 'E-Class',   count: 980,  avg: 42000, change: '+5%' },
  { rank: 5, brand: 'Kia',      model: 'K5',        count: 920,  avg: 25000, change: '+18%' },
  { rank: 6, brand: 'Toyota',   model: 'Prius',     count: 870,  avg: 18000, change: '+22%' },
  { rank: 7, brand: 'Mercedes', model: 'C-Class',   count: 810,  avg: 30000, change: '+3%' },
  { rank: 8, brand: 'BMW',      model: 'X5',        count: 760,  avg: 55000, change: '+10%' },
  { rank: 9, brand: 'Lada',     model: 'Niva',      count: 720,  avg: 12000, change: '+25%' },
  { rank: 10,brand: 'Hyundai',  model: 'Tucson',    count: 680,  avg: 32000, change: '+7%' },
];

export default function PopularCarsRanking() {
  return (
    <div className="card p-5">
      <h3 className="font-bold flex items-center gap-2 mb-4"><Trophy className="w-5 h-5 text-amber-500" /> Azərbaycanda ən populyar modellər</h3>
      <div className="space-y-2">
        {POPULAR.map((c) => (
          <Link key={c.rank} href={`/neqliyyat?brand=${c.brand}&model=${c.model}`}
            className="flex items-center gap-3 p-2 hover:bg-ink-50 rounded-lg group">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm ${
              c.rank === 1 ? 'bg-amber-100 text-amber-700' :
              c.rank === 2 ? 'bg-slate-100 text-slate-700' :
              c.rank === 3 ? 'bg-orange-100 text-orange-700' :
              'bg-ink-100 text-ink-600'
            }`}>{c.rank}</div>
            <div className="flex-1">
              <div className="font-bold text-sm group-hover:text-tap">{c.brand} {c.model}</div>
              <div className="text-[11px] text-ink-500">{c.count.toLocaleString('az-AZ')} elan · orta {c.avg.toLocaleString('az-AZ')}₼</div>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> {c.change}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
