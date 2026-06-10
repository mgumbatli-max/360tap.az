'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
    // Send to server log
    try {
      fetch('/api/clientlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message || 'unknown',
          stack: error.stack || '',
          type: 'react.error.boundary',
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      });
    } catch {}
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-10">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 mb-2">
          Nəsə pozuldu
        </h1>
        <p className="text-ink-600 mb-2">
          Səhifə yüklənərkən gözlənilməz xəta baş verdi.
        </p>
        {error.digest && (
          <p className="text-xs text-ink-400 mb-2 font-mono">Kod: {error.digest}</p>
        )}
        <details className="text-left mb-4 mx-auto max-w-full bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-red-700">Texniki detallar</summary>
          <div className="mt-2 font-mono text-red-800 whitespace-pre-wrap break-all">
            <strong>Mesaj:</strong> {error.message || 'naməlum'}
            {error.stack && (
              <>
                {'\n\n'}
                <strong>Stack:</strong>
                {'\n'}
                {error.stack.slice(0, 600)}
              </>
            )}
          </div>
        </details>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
          <button onClick={reset} className="btn-tap">
            <RefreshCw className="w-4 h-4" /> Yenidən cəhd et
          </button>
          <Link href="/" className="btn-secondary">
            <Home className="w-4 h-4" /> Ana səhifə
          </Link>
        </div>
      </div>
    </div>
  );
}
