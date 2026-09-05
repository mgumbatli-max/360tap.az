'use client';
import { Wrench, AlertCircle } from 'lucide-react';
import { azNumber } from '@/lib/format';

const SERVICES = [
  { km: 10000, items: ['Motor yağı', 'Yağ filtri'] },
  { km: 20000, items: ['Motor yağı', 'Yağ filtri', 'Hava filtri', 'Salon filtri'] },
  { km: 40000, items: ['Tam servis', 'Yanacaq filtri', 'Şamlar'] },
  { km: 60000, items: ['Tam servis', 'Sürətlər qutusu yağı', 'Diferensial yağı'] },
  { km: 100000, items: ['Tam revizion', 'Vaxt kəməri', 'Pompası'] },
  { km: 150000, items: ['Asılma sistemi', 'Tormoz disk və kalodka'] },
];

export default function ServiceReminder({ mileage = 0 }: { mileage?: number }) {
  const next = SERVICES.find((s) => mileage < s.km);
  const overdue = SERVICES.filter((s) => mileage >= s.km && mileage - s.km < 10000);

  if (!mileage) return null;
  return (
    <div className="card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-3"><Wrench className="w-4 h-4 text-tap" /> Servis cədvəli</h3>
      {next && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
          <div className="text-xs text-blue-700 font-bold">Növbəti servis</div>
          <div className="font-bold mt-1">{azNumber(next.km)} km</div>
          <div className="text-xs text-ink-600 mt-1">{next.items.join(', ')}</div>
          <div className="text-[11px] text-ink-500 mt-1">Qalıb: {azNumber((next.km - mileage))} km</div>
        </div>
      )}
      {overdue.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-xs text-amber-700 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Vaxtı keçən servislər</div>
          {overdue.map((o) => (
            <div key={o.km} className="text-xs mt-1">{azNumber(o.km)} km: {o.items[0]}</div>
          ))}
        </div>
      )}
    </div>
  );
}
