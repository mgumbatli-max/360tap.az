'use client';
import { useState } from 'react';
import { MessageCircleQuestion, ThumbsUp, Send } from 'lucide-react';

const SEEDED = [
  { id: 1, q: 'Vurğusu var mı?', a: 'Xeyr, ümumiyyətlə yoxdur. Çıxarış sənədi var.', votes: 12, asker: 'Anar', answerer: 'Satıcı' },
  { id: 2, q: 'Qiymətdə endirim olar mı?', a: 'Razıyam, görüşəndə danışarıq.', votes: 8, asker: 'Pərvin', answerer: 'Satıcı' },
];

export default function ListingQA() {
  const [items, setItems] = useState(SEEDED);
  const [newQ, setNewQ] = useState('');
  const ask = () => {
    if (!newQ.trim()) return;
    setItems([{ id: Date.now(), q: newQ, a: '', votes: 0, asker: 'Siz', answerer: '' }, ...items]);
    setNewQ('');
  };
  return (
    <div className="card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-3"><MessageCircleQuestion className="w-4 h-4 text-tap" /> Suallar və cavablar ({items.length})</h3>
      <div className="flex gap-2 mb-4">
        <input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Sualınızı yazın..."
          onKeyDown={(e) => e.key === 'Enter' && ask()} className="input flex-1 !py-2 !text-sm" />
        <button onClick={ask} className="btn-tap !py-2 !text-sm"><Send className="w-4 h-4" /></button>
      </div>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="border-b border-ink-100 pb-3 last:border-b-0">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-tap text-white flex items-center justify-center text-xs font-bold">{it.asker[0]}</div>
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs"><strong>{it.asker}</strong> <span className="text-ink-500">soruşur:</span></div>
                <p className="text-sm mt-0.5">{it.q}</p>
                {it.a && (
                  <div className="bg-tap-50 dark:bg-tap/10 rounded-lg p-2 mt-2">
                    <div className="text-xs flex items-center gap-1"><strong>{it.answerer}</strong>:</div>
                    <p className="text-sm mt-0.5">{it.a}</p>
                  </div>
                )}
                {!it.a && <span className="text-xs text-amber-600">Cavab gözlənilir...</span>}
                <button className="text-xs text-ink-500 hover:text-tap mt-1 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> {it.votes} faydalı
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
