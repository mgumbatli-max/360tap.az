'use client';
import { Clock, TrendingUp } from 'lucide-react';

const HOURS = [
  { h: '08:00', traffic: 30 },
  { h: '12:00', traffic: 65 },
  { h: '15:00', traffic: 78 },
  { h: '18:00', traffic: 95 },
  { h: '21:00', traffic: 88 },
  { h: '00:00', traffic: 25 },
];

export default function BestTimeToPublish() {
  const best = HOURS.reduce((a, b) => b.traffic > a.traffic ? b : a, HOURS[0]);
  return (
    <div className="card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-tap" /> Ən yaxşı yerləşdirmə vaxtı</h3>
      <div className="flex items-end gap-1 h-20 mb-2">
        {HOURS.map((h) => (
          <div key={h.h} className="flex-1 flex flex-col items-center">
            <div className={`w-full rounded-t transition ${h === best ? 'bg-tap' : 'bg-tap/30'}`}
              style={{ height: `${h.traffic}%` }} />
            <div className="text-[9px] text-ink-500 mt-1">{h.h}</div>
          </div>
        ))}
      </div>
      <div className="bg-tap-50 dark:bg-tap/10 rounded-lg p-2 text-center">
        <span className="text-xs text-ink-600">Ən çox aktiv: </span>
        <strong className="text-tap">{best.h}</strong>
        <span className="text-xs text-emerald-600 ml-2">+{best.traffic}% baxış</span>
      </div>
    </div>
  );
}
