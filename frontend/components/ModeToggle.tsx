'use client';
import { useState } from 'react';
import { useMode } from '@/lib/mode';
import { useToast } from '@/lib/toast';

export default function ModeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useMode();
  const toast = useToast();
  const [rippleKey, setRippleKey] = useState(0);

  const onChange = (m: 'lite' | 'pro') => {
    if (m === mode) return;

    // 1) Tam-ekran flash effekti — html-ə müvəqqəti class
    const root = document.documentElement;
    root.classList.add('mode-switching', `mode-switching-${m}`);
    setTimeout(() => {
      root.classList.remove('mode-switching', `mode-switching-${m}`);
    }, 700);

    // 2) Düymədə ripple
    setRippleKey((k) => k + 1);

    // 3) Toast bildiriş
    toast.success(
      m === 'pro'
        ? '⚡ Pro rejim — bütün funksiyalar açıldı'
        : '✨ Lite rejim — sadə görünüş'
    );

    // 4) State dəyiş (kiçik gecikmə ilə daha effektli)
    setTimeout(() => setMode(m), 50);
  };

  const W = compact ? 'w-12' : 'w-16';
  const H = compact ? 'py-0.5' : 'py-1';
  const TX = compact ? '48px' : '64px';

  return (
    <div className={`relative inline-flex items-center bg-ink-100 rounded-full p-0.5 ${compact ? 'text-xs' : 'text-sm'} overflow-hidden`}>
      {/* Slider arxa fon — yumşaq cubic-bezier */}
      <span
        className={`absolute top-0.5 bottom-0.5 ${W} rounded-full bg-white shadow-sm`}
        style={{
          transform: mode === 'pro' ? `translateX(${TX})` : 'translateX(0)',
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        aria-hidden
      />
      {/* Ripple effekti */}
      <span
        key={rippleKey}
        className={rippleKey > 0 ? `mode-ripple mode-ripple-${mode}` : ''}
        aria-hidden
      />
      <button
        onClick={() => onChange('lite')}
        className={`relative z-10 ${W} ${H} font-semibold text-center transition-colors duration-300 ${
          mode === 'lite' ? 'text-emerald-600' : 'text-ink-500 hover:text-ink-700'
        }`}
        aria-pressed={mode === 'lite'}
      >
        Lite
      </button>
      <button
        onClick={() => onChange('pro')}
        className={`relative z-10 ${W} ${H} font-semibold text-center transition-colors duration-300 ${
          mode === 'pro' ? 'text-amber-600' : 'text-ink-500 hover:text-ink-700'
        }`}
        aria-pressed={mode === 'pro'}
      >
        Pro
      </button>
    </div>
  );
}
