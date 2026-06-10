'use client';
import { useState } from 'react';
import { QrCode, X, Download } from 'lucide-react';

export default function QrShare({ url, title }: { url: string; title?: string }) {
  const [open, setOpen] = useState(false);

  // Google Charts API (server-side) — heç bir kitabxana lazım deyil
  const fullUrl = url.startsWith('http') ? url : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(fullUrl)}&color=0a0a0a&bgcolor=ffffff&qzone=2`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary text-sm"
        aria-label="QR kod"
      >
        <QrCode className="w-4 h-4" /> QR
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-ink-100 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-center mb-1">QR ilə paylaş</h2>
            <p className="text-sm text-ink-500 text-center mb-4">
              Telefon kamerası ilə skan edib elana baxa bilərlər
            </p>

            <div className="bg-white p-4 rounded-2xl border-2 border-ink-200 flex items-center justify-center">
              <img src={qrUrl} alt="QR code" className="w-full max-w-[280px]" loading="lazy" />
            </div>

            {title && (
              <p className="text-center text-sm text-ink-700 mt-3 font-semibold line-clamp-2">{title}</p>
            )}

            <a
              href={qrUrl}
              download="qr-360tap.png"
              className="btn-tap w-full mt-4 text-center justify-center"
            >
              <Download className="w-4 h-4" /> Yüklə (PNG)
            </a>
          </div>
        </div>
      )}
    </>
  );
}
