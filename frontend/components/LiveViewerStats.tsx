'use client';
import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

export default function LiveViewerStats({ listingId }: { listingId: string }) {
  const [now, setNow] = useState(1);
  const [today, setToday] = useState(0);
  useEffect(() => {
    setNow(1 + (listingId.charCodeAt(0) % 6));
    setToday(10 + (listingId.charCodeAt(0) % 50));
    const t = setInterval(() => {
      setNow((n) => Math.max(1, Math.min(15, n + (Math.random() > 0.5 ? 1 : -1))));
    }, 5000 + Math.random() * 5000);
    return () => clearInterval(t);
  }, [listingId]);
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-emerald-600">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
          </span>
          <strong>{now}</strong> indi baxır
        </span>
        <span className="flex items-center gap-1 text-ink-500">
          <Eye className="w-3 h-3" /> <strong>{today}</strong> bu gün
        </span>
      </div>
    </div>
  );
}
