'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function MessageSeller({ listingId, ownerId }: { listingId: string; ownerId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Öz elanına mesaj yazmaq olmaz
  if (user && user.id === ownerId) return null;

  const onClick = () => {
    if (!user) {
      setError('Mesaj yazmaq üçün yuxarıdan "Daxil ol" düyməsi ilə hesabınıza daxil olun.');
      return;
    }
    setOpen(true);
  };

  const send = async () => {
    if (text.trim().length < 1) return;
    setSending(true);
    setError('');
    try {
      const r = await api<{ data?: { id: string } }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ listingId, message: text.trim() }),
      });
      const id = r.data?.id;
      if (id) router.push(`/profil/mesajlar?c=${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mesaj göndərilə bilmədi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={onClick}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" /> Satıcıya mesaj yaz
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Salam, bu elan hələ aktualdırmı?"
            autoFocus
            className="w-full border border-ink-200 dark:border-ink-700 rounded-lg p-2.5 text-sm bg-ink-50 dark:bg-ink-800 text-ink-900 dark:text-white outline-none focus:border-tap resize-none"
          />
          <button onClick={send} disabled={sending} className="btn-tap w-full justify-center disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Göndər'}
          </button>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
