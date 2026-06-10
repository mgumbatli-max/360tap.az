'use client';
import { useState } from 'react';
import { CreditCard, Loader2, MapPin, Calendar, Hash } from 'lucide-react';

export default function PlateLookup() {
  const [plate, setPlate] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const lookup = () => {
    const p = plate.trim().toUpperCase().replace(/\s/g, '');
    if (p.length < 6) { alert('Plaka tam olmalıdır'); return; }
    setLoading(true);
    setTimeout(() => {
      const code = p.slice(0, 2);
      const regions: Record<string, string> = {
        '10': 'Bakı', '20': 'Sumqayıt', '50': 'Bakı', '77': 'Bakı (yeni)',
        '60': 'Gəncə', '90': 'Naxçıvan',
      };
      setResult({
        plate: p,
        region: regions[code] || 'Azərbaycan',
        first_reg: 2018 + (p.charCodeAt(2) % 7),
        owners: (p.charCodeAt(3) % 3) + 1,
        ticket_count: p.charCodeAt(4) % 8,
        last_inspection: '2024-03-15',
      });
      setLoading(false);
    }, 700);
  };

  return (
    <div className="card p-5">
      <h3 className="font-bold flex items-center gap-2 mb-3"><CreditCard className="w-5 h-5 text-tap" /> Plaka ilə yoxla</h3>
      <div className="flex gap-2 mb-4">
        <input type="text" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder="10-AA-123" maxLength={10}
          className="input flex-1 text-center font-bold tracking-widest text-lg" />
        <button onClick={lookup} disabled={loading} className="btn-tap">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yoxla'}
        </button>
      </div>
      {result && (
        <div className="space-y-2 animate-fade-in-up">
          <div className="bg-tap text-white text-center py-2 px-4 rounded-lg font-mono font-bold text-lg tracking-widest">
            {result.plate.slice(0,2)} - {result.plate.slice(2,4)} - {result.plate.slice(4)}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="card p-2 bg-ink-50 dark:bg-ink-800/50"><div className="text-[10px] text-ink-500 uppercase">Region</div><div className="font-semibold flex items-center gap-1"><MapPin className="w-3 h-3" />{result.region}</div></div>
            <div className="card p-2 bg-ink-50 dark:bg-ink-800/50"><div className="text-[10px] text-ink-500 uppercase">İlk qeydiyyat</div><div className="font-semibold">{result.first_reg}</div></div>
            <div className="card p-2 bg-ink-50 dark:bg-ink-800/50"><div className="text-[10px] text-ink-500 uppercase">Sahibə sayı</div><div className="font-semibold">{result.owners}</div></div>
            <div className="card p-2 bg-ink-50 dark:bg-ink-800/50"><div className="text-[10px] text-ink-500 uppercase">Cərimələr</div><div className={`font-semibold ${result.ticket_count > 3 ? 'text-red-500' : 'text-emerald-500'}`}>{result.ticket_count} ədəd</div></div>
          </div>
          <p className="text-[10px] text-ink-400 mt-2">Demo məlumatlar — real inteqrasiya üçün API tələb olunur</p>
        </div>
      )}
    </div>
  );
}
