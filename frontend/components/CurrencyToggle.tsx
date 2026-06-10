'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, Coins } from 'lucide-react';
import { CURRENCIES, getCurrency, setCurrency, type Currency } from '@/lib/currency';
import { useToast } from '@/lib/toast';

export default function CurrencyToggle() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Currency>('AZN');

  useEffect(() => {
    setCurrent(getCurrency());
    const handler = () => setCurrent(getCurrency());
    window.addEventListener('currency-changed', handler);
    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('[data-currency-toggle]')) setOpen(false);
    });
    return () => window.removeEventListener('currency-changed', handler);
  }, []);

  const onChange = (c: Currency) => {
    setCurrency(c);
    setCurrent(c);
    setOpen(false);
    toast.success(`Valyuta dəyişdirildi: ${CURRENCIES.find((x) => x.code === c)?.name}`);
  };

  const sym = CURRENCIES.find((c) => c.code === current)?.symbol;

  return (
    <div className="relative" data-currency-toggle>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-ink-50 text-sm font-semibold text-ink-700"
        aria-label="Valyuta"
      >
        <Coins className="w-4 h-4" />
        <span>{current} {sym}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-ink-200 rounded-lg shadow-menu py-1 z-50 animate-slide-down">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => onChange(c.code)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-ink-50 ${
                current === c.code ? 'text-tap font-semibold' : 'text-ink-700'
              }`}
            >
              <span>{c.code} · {c.name}</span>
              <span className="text-ink-400">{c.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
