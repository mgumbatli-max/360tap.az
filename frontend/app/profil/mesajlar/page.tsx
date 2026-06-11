'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProfileLayout from '@/components/ProfileLayout';
import { MessageCircle, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type Conv = {
  id: string;
  listing: { id: string; title: string; cover: string | null; price: number | null; currency: string };
  otherUser: { id: string; fullName: string };
  lastMessage: string | null;
  lastMessageAt: string | null;
};
type Msg = { id: string; content: string; senderId: string; mine: boolean; createdAt: string };

function MesajlarInner() {
  const params = useSearchParams();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(params.get('c'));
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvs = () =>
    api<{ data?: Conv[] }>('/conversations')
      .then((d) => setConvs(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    loadConvs();
  }, []);

  const loadMessages = (id: string) =>
    api<{ data?: Msg[] }>(`/conversations/${id}/messages`)
      .then((d) => setMessages(d.data ?? []))
      .catch(() => {});

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeId), 5000);
    return () => clearInterval(t);
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!activeId || !content) return;
    setSending(true);
    setText('');
    try {
      await api(`/conversations/${activeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      await loadMessages(activeId);
      loadConvs();
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const active = convs.find((c) => c.id === activeId);

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-0 border border-ink-200 dark:border-ink-700 rounded-2xl overflow-hidden h-[70vh] bg-white dark:bg-ink-900">
      {/* Söhbət siyahısı */}
      <div className={`${activeId ? 'hidden md:block' : ''} border-r border-ink-200 dark:border-ink-700 overflow-y-auto`}>
        <div className="p-4 font-extrabold text-ink-900 dark:text-white border-b border-ink-200 dark:border-ink-700">
          Mesajlar
        </div>
        {loading ? (
          <div className="p-6 text-center text-ink-400 text-sm">Yüklənir...</div>
        ) : convs.length === 0 ? (
          <div className="p-6 text-center text-ink-500 text-sm">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-ink-300" />
            Hələ mesajınız yoxdur. Elan səhifəsindən satıcıya yazın.
          </div>
        ) : (
          convs.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full flex gap-3 p-3 text-left border-b border-ink-100 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-800 ${
                activeId === c.id ? 'bg-tap-50 dark:bg-ink-800' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-ink-100 dark:bg-ink-700 overflow-hidden shrink-0">
                {c.listing.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.listing.cover} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-ink-900 dark:text-white truncate">{c.otherUser.fullName}</div>
                <div className="text-xs text-ink-500 truncate">{c.listing.title}</div>
                {c.lastMessage && <div className="text-xs text-ink-400 truncate mt-0.5">{c.lastMessage}</div>}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Chat */}
      <div className={`${activeId ? '' : 'hidden md:flex'} flex flex-col`}>
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-ink-400 text-sm">
            Söhbət seçin
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-ink-200 dark:border-ink-700 flex items-center gap-2">
              <button onClick={() => setActiveId(null)} className="md:hidden p-1">
                <ArrowLeft className="w-5 h-5 text-ink-600" />
              </button>
              <Link href={`/elanlar/${active.listing.id}`} className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-ink-100 dark:bg-ink-700 overflow-hidden shrink-0">
                  {active.listing.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={active.listing.cover} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-ink-900 dark:text-white truncate">{active.otherUser.fullName}</div>
                  <div className="text-xs text-ink-500 truncate">{active.listing.title}</div>
                </div>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-ink-50 dark:bg-ink-950">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      m.mine
                        ? 'bg-tap text-white rounded-br-sm'
                        : 'bg-white dark:bg-ink-800 text-ink-900 dark:text-white rounded-bl-sm border border-ink-200 dark:border-ink-700'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-ink-200 dark:border-ink-700 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Mesaj yazın..."
                className="flex-1 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-tap text-ink-900 dark:text-white"
              />
              <button onClick={send} disabled={sending || !text.trim()} className="btn-tap px-4 disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MesajlarPage() {
  return (
    <ProfileLayout>
      <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white mb-4">Mesajlar</h1>
      <Suspense fallback={<div className="text-ink-400">Yüklənir...</div>}>
        <MesajlarInner />
      </Suspense>
    </ProfileLayout>
  );
}
