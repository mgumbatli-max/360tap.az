'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

interface Ctx {
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
  warning: (msg: string) => void;
}

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, type, message, duration }]);
    if (duration > 0) {
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration);
    }
  }, []);

  const remove = (id: number) => setToasts((p) => p.filter((t) => t.id !== id));

  const value: Ctx = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
    warning: (m) => show(m, 'warning'),
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const Icon = t.type === 'success' ? CheckCircle :
                       t.type === 'error'   ? AlertTriangle :
                       t.type === 'warning' ? AlertTriangle : Info;
          const color = t.type === 'success' ? 'bg-emerald-500' :
                        t.type === 'error'   ? 'bg-red-500' :
                        t.type === 'warning' ? 'bg-amber-500' : 'bg-tap';
          return (
            <div
              key={t.id}
              className="card pointer-events-auto p-3 pl-4 flex items-start gap-3 animate-slide-down min-w-[280px] shadow-menu"
            >
              <div className={`w-8 h-8 rounded-full ${color} text-white flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="flex-1 text-sm text-ink-900 leading-relaxed pt-1">{t.message}</p>
              <button onClick={() => remove(t.id)} className="text-ink-400 hover:text-ink-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // SSR / fallback — silent
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
    };
  }
  return ctx;
}
