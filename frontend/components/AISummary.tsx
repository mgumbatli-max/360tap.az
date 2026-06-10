'use client';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function AISummary({ text }: { text: string }) {
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);

  if (!text || text.length < 100) return null;

  const generate = async () => {
    setOpened(true);
    if (bullets.length) return;
    setLoading(true);
    try {
      const d = await api<{ bullets: string[] }>('/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setBullets(d.bullets);
    } finally { setLoading(false); }
  };

  return (
    <div className="card p-4 mt-3 bg-gradient-to-br from-tap-50 to-violet-50 border-tap/20">
      <button onClick={generate} className="flex items-center gap-2 font-bold text-tap text-sm hover:underline">
        <Sparkles className="w-4 h-4" /> AI ilə əsas məqamlar
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      </button>
      {opened && bullets.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-tap font-bold">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
