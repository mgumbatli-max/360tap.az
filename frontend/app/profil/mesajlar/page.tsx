'use client';
import { useState, useEffect, useRef } from 'react';
import ProfileLayout from '@/components/ProfileLayout';
import { MessageCircle, Send, Search, Sparkles, Mic, MicOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';

const DEMO = [
  { id: '1', name: 'Anar Ə.', last: 'Salam, məhsul hələ də mövcuddur?', time: '14:23', unread: 2, avatar: 'A' },
  { id: '2', name: 'Pərvin K.', last: 'Çatdırılma var?', time: 'dünən', unread: 0, avatar: 'P' },
  { id: '3', name: 'Lalə M.', last: 'Razılaşırıq, sabah görüşək.', time: '8 May', unread: 0, avatar: 'L' },
];

type Msg = { who: 'me' | 'other'; text: string };
const INITIAL: Msg[] = [
  { who: 'other', text: 'Salam, məhsul hələ də mövcuddur?' },
  { who: 'me', text: 'Salam, bəli mövcuddur. Hansı sual var?' },
  { who: 'other', text: 'Qiymətdə endirim olarmı? 😊' },
];

export default function MessagesPage() {
  const [active, setActive] = useState<string | null>('1');
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState('');
  const [replies, setReplies] = useState<string[]>([]);
  const [voiceListening, setVoiceListening] = useState(false);
  const toast = useToast();
  const recRef = useRef<any>(null);
  const transcriptRef = useRef('');

  // AI smart-reply hər mesajdan sonra
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.who !== 'other') { setReplies([]); return; }
    api<{ replies: string[] }>('/ai/smart-reply', {
      method: 'POST',
      body: JSON.stringify({ lastMessage: last.text, context: 'seller' }),
    }).then((d) => setReplies(d.replies)).catch(() => {});
  }, [messages]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { who: 'me', text: t }]);
    setInput('');
    setReplies([]);
    // Mock cavab — 1.5s sonra
    setTimeout(() => {
      const responses = ['Sağ olun, baxım.', 'Razıyam.', 'Gəlirəm yarım saata.', 'Şəkil göndərin zəhmət olmasa.'];
      setMessages((m) => [...m, { who: 'other', text: responses[Math.floor(Math.random() * responses.length)] }]);
    }, 1500);
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error('Brauzeriniz səs tanımanı dəstəkləmir');
      return;
    }
    if (voiceListening) { recRef.current?.stop(); return; }
    transcriptRef.current = '';
    const r = new SR();
    r.lang = 'az-AZ';
    r.interimResults = true;
    r.onstart = () => setVoiceListening(true);
    r.onresult = (e: any) => {
      const text = Array.from(e.results).map((res: any) => res[0].transcript).join(' ');
      transcriptRef.current = text;
      setInput(text);
    };
    r.onerror = () => { setVoiceListening(false); };
    r.onend = () => {
      setVoiceListening(false);
      const final = transcriptRef.current.trim();
      if (final) setInput(final);
    };
    recRef.current = r;
    r.start();
  };

  return (
    <ProfileLayout>
      <h1 className="sr-only">Mesajlar — 360tap.az</h1>
      <div className="card overflow-hidden grid sm:grid-cols-[280px_1fr] h-[70vh]">
        <aside className="border-r border-ink-200 flex flex-col">
          <div className="p-3 border-b border-ink-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input className="input pl-9" placeholder="Söhbət axtar..." />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {DEMO.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`w-full flex items-start gap-3 p-3 border-b border-ink-100 hover:bg-ink-50 text-left ${active === c.id ? 'bg-tap-50' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-tap text-white flex items-center justify-center font-bold shrink-0">{c.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <span className="text-[10px] text-ink-400 shrink-0">{c.time}</span>
                  </div>
                  <div className="text-xs text-ink-600 truncate mt-0.5">{c.last}</div>
                </div>
                {c.unread > 0 && (
                  <span className="bg-tap text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">{c.unread}</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {active ? (
          <section className="flex flex-col">
            <header className="p-3 border-b border-ink-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tap text-white flex items-center justify-center font-bold">A</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">Anar Ə.</div>
                <div className="text-[11px] text-emerald-600">Online</div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-50">
              {messages.map((m, i) => <Bubble key={i} who={m.who}>{m.text}</Bubble>)}
            </div>

            {/* AI smart replies */}
            {replies.length > 0 && (
              <div className="px-3 py-2 border-t border-ink-200 bg-gradient-to-r from-tap-50 to-violet-50">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-tap mb-1.5">
                  <Sparkles className="w-3 h-3" /> AI cavab təklifləri
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {replies.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => send(r)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white border border-tap/30 hover:bg-tap hover:text-white transition"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form className="p-3 border-t border-ink-200 flex gap-2"
                  onSubmit={(e) => { e.preventDefault(); send(input); }}>
              <button type="button" onClick={startVoice}
                className={`p-2 rounded-lg ${voiceListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-ink-100 text-ink-600'}`}
                title="Səslə yaz">
                {voiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="input"
                placeholder={voiceListening ? 'Dinlənilir...' : 'Mesaj yaz və ya 🎙 düyməsini sıx'}
              />
              <button className="btn-tap"><Send className="w-4 h-4" /></button>
            </form>
          </section>
        ) : (
          <section className="flex items-center justify-center text-ink-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-ink-300" />
              <p>Söhbət seçin</p>
            </div>
          </section>
        )}
      </div>
    </ProfileLayout>
  );
}

function Bubble({ who, children }: { who: 'me' | 'other'; children: React.ReactNode }) {
  return (
    <div className={`flex ${who === 'me' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
        who === 'me' ? 'bg-tap text-white rounded-br-sm' : 'bg-white text-ink-900 border border-ink-200 rounded-bl-sm'
      }`}>
        {children}
      </div>
    </div>
  );
}
