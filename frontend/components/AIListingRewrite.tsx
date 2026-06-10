'use client';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AIListingRewrite({ title, description, onApply }: { title: string; description: string; onApply: (t: string, d: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{ title: string; description: string } | null>(null);

  const rewrite = () => {
    setLoading(true);
    setTimeout(() => {
      const better = {
        title: `${title.toUpperCase().slice(0, 50)} — Təcili satılır, ideal vəziyyət!`,
        description: `${description}\n\n✓ Tam komplekt vəziyyət\n✓ Bütün sənədlər mövcuddur\n✓ Görüşə bilərik istənilən vaxt\n✓ Çatdırılma mümkündür\n\nZəng edin, sürətli cavab veririk!`,
      };
      setSuggestion(better);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="card p-3 bg-gradient-to-r from-tap-50 to-violet-50 border-tap/30">
      <button onClick={rewrite} disabled={loading || !title} className="btn-tap w-full text-sm">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        AI ilə təkmilləşdir
      </button>
      {suggestion && (
        <div className="mt-3 space-y-2">
          <div className="card p-2 bg-white text-xs"><div className="text-[10px] text-ink-400">Başlıq:</div>{suggestion.title}</div>
          <div className="card p-2 bg-white text-xs"><div className="text-[10px] text-ink-400">Təsvir:</div><div className="whitespace-pre-line">{suggestion.description}</div></div>
          <button onClick={() => onApply(suggestion.title, suggestion.description)} className="btn-tap text-xs w-full !py-2">Tətbiq et</button>
        </div>
      )}
    </div>
  );
}
