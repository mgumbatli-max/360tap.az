'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type AppMode = 'lite' | 'pro';

interface ModeCtx {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  isLite: boolean;
  isPro: boolean;
  toggle: () => void;
}

const Ctx = createContext<ModeCtx | null>(null);

const KEY = 'tap_mode';

export function ModeProvider({ children }: { children: ReactNode }) {
  // Default Lite — sadə başlanğıc
  const [mode, setModeState] = useState<AppMode>('lite');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as AppMode | null;
      if (saved === 'lite' || saved === 'pro') setModeState(saved);
    } catch {}
  }, []);

  const setMode = (m: AppMode) => {
    setModeState(m);
    try { localStorage.setItem(KEY, m); } catch {}
    document.documentElement.dataset.mode = m;
  };

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  const toggle = () => setMode(mode === 'lite' ? 'pro' : 'lite');

  return (
    <Ctx.Provider value={{ mode, setMode, isLite: mode === 'lite', isPro: mode === 'pro', toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMode(): ModeCtx {
  const c = useContext(Ctx);
  if (!c) {
    return { mode: 'lite', setMode: () => {}, isLite: true, isPro: false, toggle: () => {} };
  }
  return c;
}
