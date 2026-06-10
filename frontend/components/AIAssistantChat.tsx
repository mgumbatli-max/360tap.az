'use client';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Loader2, Mic } from 'lucide-react';
import { api } from '@/lib/api';

type Msg = { from: 'user' | 'ai'; text: string };

const SUGGESTIONS = [
  'Bakıda kirayə mənzil',
  'BMW 2020-dən sonra',
  'iPhone az işlənmiş',
  'Çatdırılma var noutbuk',
];

export default function AIAssistantChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'ai', text: '👋 Salam! Mən 360tap AI köməkçisiyəm. Nə axtardığınızı yazın, mən tapacam.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setMsgs((m) => [...m, { from: 'user', text: t }]);
    setInput('');
    setLoading(true);
    try {
      const r = await api<{ suggestion: string; url: string }>('/voice/parse', {
        method: 'POST',
        body: JSON.stringify({ text: t }),
      });
      setMsgs((m) => [...m, {
        from: 'ai',
        text: `${r.suggestion}\n\n🔗 [Nəticələrə bax](${r.url})`
      }]);
    } catch {
      setMsgs((m) => [...m, { from: 'ai', text: 'Bağışlayın, indi cavab verə bilmirəm.' }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-24 left-6 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-tap text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          title="AI köməkçi"
          aria-label="AI köməkçi">
          <Sparkles className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 left-6 z-30 w-[380px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-white dark:bg-[#1c2128] rounded-2xl shadow-2xl border border-ink-200/60 dark:border-ink-700 flex flex-col animate-fade-in-up">
          <header className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-ink-700 bg-gradient-to-r from-tap-50 to-violet-50 dark:from-tap/10 dark:to-violet-500/10 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-tap flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm">AI köməkçi</div>
                <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/50 dark:hover:bg-ink-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-50 dark:bg-ink-900">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${
                  m.from === 'user'
                    ? 'bg-tap text-white rounded-br-sm'
                    : 'bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-bl-sm'
                }`}
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-tap underline font-semibold">$1</a>') }} />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-tap" />
                </div>
              </div>
            )}

            {msgs.length === 1 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] font-bold text-ink-400 uppercase">Sürətli misallar</div>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="w-full text-left text-xs px-3 py-2 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg hover:border-tap hover:bg-tap-50 dark:hover:bg-tap/10 transition">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-3 border-t border-ink-100 dark:border-ink-700 flex gap-2 bg-white dark:bg-[#1c2128] rounded-b-2xl">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Nə axtarırsız?"
              className="flex-1 px-3 py-2 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl text-sm outline-none focus:border-tap" />
            <button type="submit" disabled={!input.trim() || loading} className="btn-tap !py-2 !px-3">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
