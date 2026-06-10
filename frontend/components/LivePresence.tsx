'use client';
import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

// Mock live presence — gerçəkdə Socket.io ilə "watching:join", "watching:leave"
// Hazırda random simulyasiya
export default function LivePresence({ listingId }: { listingId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Simulyasiya — random 1-8 nəfər, 5-10s-də dəyişir
    const seed = listingId.charCodeAt(0) % 7 + 1;
    setCount(seed);
    const interval = setInterval(() => {
      const change = Math.random() > 0.5 ? 1 : -1;
      setCount((c) => Math.max(1, Math.min(12, c + change)));
    }, 6000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [listingId]);

  if (count === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
      <span className="relative flex w-2 h-2">
        <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
      </span>
      <Eye className="w-3 h-3" />
      Bu elana baxan: <strong>{count}</strong>
    </div>
  );
}
