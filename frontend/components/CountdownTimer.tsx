'use client';
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

export default function CountdownTimer({ endsAt }: { endsAt?: Date }) {
  const target = endsAt || new Date(Date.now() + 6 * 60 * 60 * 1000);
  const [diff, setDiff] = useState(target.getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold animate-pulse">
      <Zap className="w-3.5 h-3.5" />
      Flash: {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </div>
  );
}
