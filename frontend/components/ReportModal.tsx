'use client';
import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const REASONS = [
  { value: 'fake', label: 'Saxta elan' },
  { value: 'wrong_category', label: 'Yanlış kateqoriya' },
  { value: 'banned_item', label: 'Qadağan olunmuş məhsul' },
  { value: 'wrong_price', label: 'Qiymət düzgün deyil' },
  { value: 'spam', label: 'Spam' },
  { value: 'fraud', label: 'Fırıldaqçılıq ehtimalı' },
  { value: 'offensive', label: 'Təhqiramiz məzmun' },
  { value: 'duplicate', label: 'Təkrar elan' },
  { value: 'other', label: 'Digər' },
];

export default function ReportModal({
  open,
  onClose,
  listingId,
}: {
  open: boolean;
  onClose: () => void;
  listingId: string;
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Şikayət vermək üçün daxil olmalısınız');
      return;
    }
    if (!reason) {
      setError('Səbəb seçin');
      return;
    }
    setSubmitting(true); setError('');
    try {
      await api(`/listings/${listingId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason, detail }),
      });
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-ink-100 flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-ink-900 mb-2">Şikayətiniz qəbul edildi</h2>
            <p className="text-ink-600 mb-5">Moderatorlar 24 saat ərzində baxacaq. Əgər lazım olarsa, sizə geri qayıdacağıq.</p>
            <button onClick={onClose} className="btn-tap w-full">Bağla</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-ink-900">Şikayət et</h2>
            </div>
            <p className="text-sm text-ink-500 mb-5">Səbəbi seçin və əlavə məlumat yazın.</p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                {REASONS.map((r) => (
                  <label key={r.value} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-ink-50">
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="accent-tap"
                    />
                    <span className="text-sm">{r.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                  Əlavə məlumat <span className="text-ink-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  rows={3}
                  className="input resize-y"
                  placeholder="Detalları yazın..."
                  maxLength={1000}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-tap w-full disabled:opacity-50">
                {submitting ? 'Göndərilir...' : 'Şikayəti göndər'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
