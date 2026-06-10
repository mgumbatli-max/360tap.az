'use client';
import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function AITranslate({ text }: { text: string }) {
  const [target, setTarget] = useState<'ru' | 'en'>('ru');
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async (lang: 'ru' | 'en') => {
    setTarget(lang);
    setLoading(true);
    try {
      const d = await api<{ translated: string }>('/ai/translate', {
        method: 'POST',
        body: JSON.stringify({ text, target: lang }),
      });
      setTranslated(d.translated);
    } finally { setLoading(false); }
  };

  if (!text) return null;
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Languages className="w-4 h-4 text-tap" />
        <span className="text-sm font-bold text-ink-700">Tərcümə:</span>
        <button onClick={() => run('ru')} className={`text-xs px-2 py-0.5 rounded-full ${target==='ru' && translated ? 'bg-tap text-white' : 'bg-ink-100 hover:bg-tap-50'}`}>RU</button>
        <button onClick={() => run('en')} className={`text-xs px-2 py-0.5 rounded-full ${target==='en' && translated ? 'bg-tap text-white' : 'bg-ink-100 hover:bg-tap-50'}`}>EN</button>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-tap" />}
      </div>
      {translated && (
        <div className="card p-3 bg-blue-50 text-sm text-ink-800 border-blue-200">
          {translated}
          <div className="text-[10px] text-ink-400 mt-2">Avtomatik tərcümə — dəqiqlik təmin olunmur</div>
        </div>
      )}
    </div>
  );
}
