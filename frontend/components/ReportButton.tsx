'use client';
import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

const REASONS = [
  { v: 'fraud', l: 'Saxtakarlıq / aldatma' },
  { v: 'spam', l: 'Spam / təkrar elan' },
  { v: 'prohibited', l: 'Qadağan olunmuş mal' },
  { v: 'wrong_category', l: 'Yanlış kateqoriya' },
  { v: 'offensive', l: 'Təhqiramiz məzmun' },
  { v: 'other', l: 'Digər' },
];

export default function ReportButton({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('fraud');
  const [detail, setDetail] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await api('/reports', {
        method: 'POST',
        body: JSON.stringify({ listingId, reason, detail: detail.trim() || undefined }),
      });
      setDone(true);
      setTimeout(() => setOpen(false), 1300);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => (user ? setOpen(true) : alert('Şikayət üçün hesaba daxil olun'))}
        className="flex items-center gap-1 text-xs text-ink-400 hover:text-red-600 mt-3"
      >
        <Flag className="w-3.5 h-3.5" /> Şikayət et
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-ink-900 rounded-2xl p-5 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-ink-900 dark:text-white mb-3">Elanı şikayət et</h3>
            {done ? (
              <p className="text-green-600 text-sm py-4">Şikayətiniz qəbul olundu. Təşəkkürlər!</p>
            ) : (
              <>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg px-3 py-2 text-sm mb-2 text-ink-900 dark:text-white"
                >
                  {REASONS.map((r) => (
                    <option key={r.v} value={r.v}>
                      {r.l}
                    </option>
                  ))}
                </select>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  rows={3}
                  placeholder="Əlavə məlumat (istəyə bağlı)"
                  className="w-full bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-tap text-ink-900 dark:text-white"
                />
                <div className="flex gap-2">
                  <button onClick={() => setOpen(false)} className="btn-secondary flex-1">
                    Ləğv et
                  </button>
                  <button onClick={submit} disabled={sending} className="btn-tap flex-1 disabled:opacity-50">
                    {sending ? '…' : 'Göndər'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
