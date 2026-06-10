'use client';
import { useState } from 'react';
import { QrCode, X } from 'lucide-react';

export default function QRCodeShare({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const fullUrl = typeof window !== 'undefined' ? window.location.origin + url : url;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`;
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
        <QrCode className="w-4 h-4" /> QR kod
      </button>
      {open && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-[#1c2128] rounded-2xl p-6 text-center shadow-2xl max-w-xs" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3"><X className="w-4 h-4" /></button>
            <h3 className="font-bold mb-3">📱 QR ilə paylaş</h3>
            <img src={qrSrc} alt="QR" className="w-full rounded-lg bg-white" />
            <p className="text-xs text-ink-600 mt-3 line-clamp-2">{title}</p>
            <p className="text-[10px] text-ink-400 mt-1 break-all">{fullUrl}</p>
          </div>
        </div>
      )}
    </>
  );
}
