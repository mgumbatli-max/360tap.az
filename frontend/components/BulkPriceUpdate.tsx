'use client';
import { useState } from 'react';
import { Percent, Sparkles } from 'lucide-react';
import { useToast } from '@/lib/toast';

export default function BulkPriceUpdate() {
  const [pct, setPct] = useState(-10);
  const toast = useToast();
  const apply = () => toast.success(`Bütün elanlarınıza ${pct}% tətbiq olundu`);
  return (
    <div className="card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-2"><Percent className="w-4 h-4 text-tap" /> Toplu qiymət dəyişdir</h3>
      <p className="text-xs text-ink-500 mb-3">Bütün aktiv elanlarınıza eyni anda endirim/artım</p>
      <div className="flex items-center gap-2 mb-3">
        <input type="range" min={-50} max={50} step={1} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="flex-1" />
        <span className={`font-bold w-12 text-right ${pct < 0 ? 'text-emerald-600' : pct > 0 ? 'text-red-500' : 'text-ink-500'}`}>
          {pct > 0 ? '+' : ''}{pct}%
        </span>
      </div>
      <button onClick={apply} className="btn-tap w-full text-sm">
        <Sparkles className="w-4 h-4" /> Bütün elanlara tətbiq et
      </button>
    </div>
  );
}
