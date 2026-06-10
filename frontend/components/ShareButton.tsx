'use client';
import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/lib/toast';

export default function ShareButton({
  title,
  url,
  className,
}: {
  title: string;
  url: string;
  className?: string;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith('http') ? url : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`;

  const onNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, url: fullUrl });
        return;
      } catch {}
    }
    setOpen(true);
  };

  const onCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('Link kopyalandı');
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title}\n${fullUrl}`)}`;
  const telegram = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
  const twitter = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;

  return (
    <>
      <button onClick={onNativeShare} className={className ?? 'btn-secondary text-sm'}>
        <Share2 className="w-4 h-4" /> Paylaş
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Paylaş</h2>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                 className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-ink-50">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="text-xs">WhatsApp</span>
              </a>
              <a href={telegram} target="_blank" rel="noopener noreferrer"
                 className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-ink-50">
                <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center">
                  <Send className="w-6 h-6" />
                </div>
                <span className="text-xs">Telegram</span>
              </a>
              <a href={facebook} target="_blank" rel="noopener noreferrer"
                 className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-ink-50">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">f</div>
                <span className="text-xs">Facebook</span>
              </a>
              <a href={twitter} target="_blank" rel="noopener noreferrer"
                 className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-ink-50">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold">𝕏</div>
                <span className="text-xs">Twitter</span>
              </a>
            </div>

            <div className="flex gap-2 p-2 bg-ink-50 rounded-lg">
              <input value={fullUrl} readOnly className="flex-1 bg-transparent text-sm outline-none" />
              <button onClick={onCopy} className="btn-tap text-sm py-1.5">
                {copied ? <><Check className="w-4 h-4" /> Kopyalandı</> : <><Copy className="w-4 h-4" /> Kopyala</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
