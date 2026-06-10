'use client';
import { useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/lib/toast';

export default function SoldReservedBadge({ listingId, initial }: { listingId: string; initial?: 'sold' | 'reserved' | null }) {
  const [status, setStatus] = useState<'sold' | 'reserved' | null>(initial || null);
  const toast = useToast();
  const setS = (s: 'sold' | 'reserved' | null) => { setStatus(s); toast.success(s === 'sold' ? 'Satıldı işarələndi' : s === 'reserved' ? 'Rezerv edildi' : 'Status təmizləndi'); };
  return (
    <div className="card p-3 flex gap-2">
      <button onClick={() => setS(status === 'reserved' ? null : 'reserved')} className={`flex-1 px-3 py-2 rounded-lg font-bold text-xs ${status === 'reserved' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700'}`}>
        <Clock className="w-3.5 h-3.5 inline mr-1" /> Rezerv
      </button>
      <button onClick={() => setS(status === 'sold' ? null : 'sold')} className={`flex-1 px-3 py-2 rounded-lg font-bold text-xs ${status === 'sold' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
        <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> Satıldı
      </button>
    </div>
  );
}
