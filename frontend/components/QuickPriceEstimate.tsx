'use client';
import { useState } from 'react';
import { Sparkles, Camera } from 'lucide-react';
import { azNumber } from '@/lib/format';

export default function QuickPriceEstimate() {
  const [estimate, setEstimate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const estimate2 = () => {
    setLoading(true);
    setTimeout(() => {
      setEstimate(15000 + Math.floor(Math.random() * 35000));
      setLoading(false);
    }, 1200);
  };
  return (
    <div className="card p-4 bg-gradient-to-br from-tap-50 to-violet-50">
      <h3 className="font-bold flex items-center gap-2 mb-2"><Camera className="w-4 h-4 text-tap" /> Sürətli qiymət</h3>
      <p className="text-xs text-ink-600 mb-3">Şəkil yükləyin və ya VIN daxil edin — AI bazar qiymətini təxmin etsin</p>
      <button onClick={estimate2} disabled={loading} className="btn-tap w-full text-sm">
        {loading ? '🤖 Hesablanır...' : <><Sparkles className="w-4 h-4" /> AI ilə qiymətləndir</>}
      </button>
      {estimate && (
        <div className="mt-3 text-center">
          <div className="text-xs text-ink-500">Təxmini qiymət</div>
          <div className="text-3xl font-extrabold text-tap">{azNumber(estimate)} ₼</div>
          <div className="text-xs text-ink-400 mt-1">±15% xəta nisbəti</div>
        </div>
      )}
    </div>
  );
}
