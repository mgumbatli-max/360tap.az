'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/lib/toast';

export default function AutoRenewToggle({ listingId, initial = false }: { listingId: string; initial?: boolean }) {
  const [on, setOn] = useState(initial);
  const toast = useToast();
  const toggle = () => {
    setOn(!on);
    toast.success(on ? 'Avtomatik yeniləmə söndürüldü' : 'Avtomatik yeniləmə yandırıldı (30 gündə bir)');
  };
  return (
    <button onClick={toggle} className="card p-3 w-full flex items-center gap-3 hover:border-tap">
      <RefreshCw className={`w-5 h-5 ${on ? 'text-emerald-500 animate-spin-slow' : 'text-ink-400'}`} />
      <div className="flex-1 text-left">
        <div className="font-bold text-sm">Avtomatik yenilə</div>
        <div className="text-xs text-ink-500">{on ? 'Hər 30 gündə avtomatik yenilənir' : 'Elan vaxtı bitəcək'}</div>
      </div>
      <div className={`relative w-10 h-6 rounded-full transition ${on ? 'bg-emerald-500' : 'bg-ink-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
      </div>
    </button>
  );
}
