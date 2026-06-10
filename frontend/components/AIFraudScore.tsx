'use client';
import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type Score = {
  score: number;
  level: 'high' | 'medium' | 'low';
  flags: { type: string; text: string }[];
  label: string;
};

export default function AIFraudScore({ payload }: { payload: any }) {
  const [data, setData] = useState<Score | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!payload?.title) return;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const d = await api<Score>('/ai/fraud-score', { method: 'POST', body: JSON.stringify(payload) });
        setData(d);
      } finally { setLoading(false); }
    }, 800);
    return () => clearTimeout(id);
  }, [payload?.title, payload?.description, payload?.price, payload?.media?.length]);

  if (loading) {
    return <div className="card p-3 text-sm text-ink-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> AI keyfiyyət yoxlaması...</div>;
  }
  if (!data) return null;

  const Icon = data.level === 'high' ? ShieldCheck : data.level === 'medium' ? ShieldAlert : ShieldX;
  const colors = data.level === 'high' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : data.level === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200'
              :                            'bg-red-50 text-red-700 border-red-200';

  return (
    <div className={`card p-4 ${colors}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-bold flex items-center gap-2">
            {data.label}
            <span className="text-xs font-mono opacity-75">{data.score}/100</span>
          </div>
          {data.flags.length > 0 && (
            <ul className="text-xs mt-2 space-y-1">
              {data.flags.map((f, i) => <li key={i}>• {f.text}</li>)}
            </ul>
          )}
          {data.flags.length === 0 && (
            <div className="text-xs mt-1">Elanınız bütün AI yoxlamalarından keçdi 🎉</div>
          )}
        </div>
      </div>
    </div>
  );
}
