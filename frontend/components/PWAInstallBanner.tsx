'use client';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const KEY = 'tap_pwa_dismissed';

export default function PWAInstallBanner() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) === '1') return;
    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setShow(false);
    setDeferred(null);
  };
  const dismiss = () => {
    localStorage.setItem(KEY, '1');
    setShow(false);
  };

  if (!show) return null;
  return (
    <div className="fixed bottom-24 right-6 z-40 bg-white dark:bg-[#1c2128] rounded-2xl shadow-2xl border border-ink-200/60 dark:border-ink-700 p-4 max-w-sm animate-fade-in-up">
      <button onClick={dismiss} className="absolute top-2 right-2 p-1 hover:bg-ink-100 dark:hover:bg-ink-800 rounded">
        <X className="w-4 h-4 text-ink-400" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tap to-violet-500 flex items-center justify-center text-white font-bold shrink-0">360</div>
        <div className="flex-1">
          <h4 className="font-bold text-sm">360tap.az tətbiqi quraşdır</h4>
          <p className="text-xs text-ink-500 mt-0.5">Daha sürətli giriş + offline rejim + bildirişlər</p>
          <button onClick={install} className="mt-3 btn-tap text-xs !py-2">
            <Download className="w-3.5 h-3.5" /> Quraşdır
          </button>
        </div>
      </div>
    </div>
  );
}
