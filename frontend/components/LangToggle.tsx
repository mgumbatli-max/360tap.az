'use client';
import { useT, type Lang } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export default function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useT();

  if (compact) {
    return (
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="bg-transparent border-0 text-sm text-ink-700 dark:text-ink-300 cursor-pointer focus:outline-none uppercase font-semibold"
        aria-label="Dil"
      >
        <option value="az">AZ</option>
        <option value="ru">RU</option>
        <option value="en">EN</option>
      </select>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 bg-ink-100 dark:bg-ink-800 rounded-lg p-0.5">
      <Globe className="w-3.5 h-3.5 text-ink-500 ml-1.5" />
      {(['az', 'ru', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 rounded-md text-xs font-bold transition uppercase ${
            lang === l ? 'bg-white dark:bg-ink-700 text-tap shadow' : 'text-ink-600 dark:text-ink-300 hover:text-ink-900'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
