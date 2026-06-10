'use client';
import { useEffect, useState } from 'react';
import { Sparkles, Check } from 'lucide-react';

const RULES: { kw: string[]; cat: string; name: string }[] = [
  { kw: ['iphone','samsung','xiaomi','telefon','smartfon'], cat: 'telefon', name: 'Telefon' },
  { kw: ['noutbuk','laptop','macbook','asus','hp ','lenovo'], cat: 'noutbuk', name: 'Noutbuk' },
  { kw: ['kompüter','kompyuter','pc','desktop'], cat: 'kompyuter', name: 'Kompüter' },
  { kw: ['bmw','mercedes','toyota','hyundai','kia','lada','avtomobil','maşın'], cat: 'avtomobil', name: 'Avtomobil' },
  { kw: ['mənzil','menzil','ev','kirayə','daşınmaz'], cat: 'menzil-satilir', name: 'Mənzil' },
  { kw: ['saat','rolex','casio','seiko'], cat: 'saat-zinet', name: 'Saat' },
  { kw: ['paltar','geyim','nike','adidas','ayaqqabı'], cat: 'geyim', name: 'Geyim' },
  { kw: ['it','pişik','köpək','heyvan'], cat: 'heyvanlar', name: 'Heyvanlar' },
];

export default function AutoCategorize({ title, onSuggest }: { title: string; onSuggest: (slug: string) => void }) {
  const [suggestion, setSuggestion] = useState<{ slug: string; name: string } | null>(null);

  useEffect(() => {
    if (!title || title.length < 4) { setSuggestion(null); return; }
    const lower = title.toLowerCase();
    for (const r of RULES) {
      if (r.kw.some(k => lower.includes(k))) {
        setSuggestion({ slug: r.cat, name: r.name });
        return;
      }
    }
    setSuggestion(null);
  }, [title]);

  if (!suggestion) return null;
  return (
    <div className="card p-3 bg-gradient-to-r from-tap-50 to-violet-50 border-tap/30 flex items-center gap-2 animate-fade-in-up">
      <Sparkles className="w-4 h-4 text-tap shrink-0" />
      <div className="flex-1 text-sm">
        <strong className="text-tap">AI təklifi:</strong> Kateqoriya "{suggestion.name}" ola bilər
      </div>
      <button onClick={() => onSuggest(suggestion.slug)} className="text-xs btn-tap !py-1 !px-2">
        <Check className="w-3 h-3" /> Tətbiq
      </button>
    </div>
  );
}
