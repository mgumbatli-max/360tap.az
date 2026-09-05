'use client';
import { useState } from 'react';
import { Handshake, Send, Sparkles, X } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { azNumber } from '@/lib/format';

export default function AINegotiator({ price, listingId }: { price: number; listingId: string }) {
  const [open, setOpen] = useState(false);
  const [offer, setOffer] = useState(Math.round(price * 0.9));
  const [chat, setChat] = useState<{ from: 'me' | 'seller'; text: string }[]>([]);
  const toast = useToast();

  const sendOffer = () => {
    const pct = (price - offer) / price;
    setChat([...chat, { from: 'me', text: `${azNumber(offer)} ₼ təklif edirəm` }]);

    setTimeout(() => {
      let reply = '';
      if (pct < 0.05) reply = `Razıyam, ${offer} ₼ olsun. Görüşə bilərik.`;
      else if (pct < 0.15) reply = `Bir az ucuzdur. ${Math.round(price * 0.92)} ₼ olsa razıyam.`;
      else if (pct < 0.25) reply = `Çox aşağı təklifdir. Son qiymət ${Math.round(price * 0.85)} ₼ ola bilər.`;
      else reply = `Bağışlayın, bu qiymətdə sata bilmərəm. ${Math.round(price * 0.8)} ₼-dən aşağı düşə bilmərəm.`;
      setChat((c) => [...c, { from: 'seller', text: reply }]);
    }, 1200);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm w-full">
        <Handshake className="w-4 h-4 text-tap" /> Qiymət təklif et
      </button>
      {open && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-[#1c2128] rounded-2xl max-w-md w-full p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-tap" /> AI ilə qiymət müzakirəsi
              </h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 hover:bg-ink-100 rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold text-ink-700">Sizin təklifiniz</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="number" value={offer} onChange={(e) => setOffer(Number(e.target.value))}
                  min={price * 0.3} max={price} step={50}
                  className="input flex-1 !text-lg font-bold" />
                <span className="text-ink-500">₼</span>
              </div>
              <input type="range" min={price * 0.3} max={price} step={50}
                value={offer} onChange={(e) => setOffer(Number(e.target.value))}
                className="w-full mt-2" />
              <div className="flex justify-between text-xs text-ink-500 mt-1">
                <span>-{Math.round((1 - offer/price) * 100)}%</span>
                <span>Bazar qiyməti: {azNumber(price)} ₼</span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto bg-ink-50 dark:bg-ink-900 rounded-lg p-3 mb-3 space-y-2 min-h-[80px]">
              {chat.length === 0 ? (
                <div className="text-center text-xs text-ink-400 py-4">Aşağı təklif edib göndərin, satıcı AI cavab verəcək</div>
              ) : chat.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-xs ${
                    m.from === 'me' ? 'bg-tap text-white rounded-br-sm' : 'bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-bl-sm'
                  }`}>{m.text}</div>
                </div>
              ))}
            </div>

            <button onClick={sendOffer} className="btn-tap w-full">
              <Send className="w-4 h-4" /> Təklifi göndər
            </button>
            <p className="text-[10px] text-ink-400 mt-2 text-center">AI satıcının cavabını simulyasiya edir</p>
          </div>
        </div>
      )}
    </>
  );
}
