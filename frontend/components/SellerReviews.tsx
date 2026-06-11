'use client';
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; fullName: string };
};
type Data = { summary: { avg: number; count: number }; reviews: Review[] };

function Stars({ value, size = 'w-4 h-4' }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-ink-300'}`}
        />
      ))}
    </div>
  );
}

// Real API ilə işləyir: GET /reviews/user/:sellerId, POST /reviews
export default function SellerReviews({ sellerId, listingId }: { sellerId?: string; listingId?: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const load = () => {
    if (!sellerId) return;
    api<{ data?: Data }>(`/reviews/user/${sellerId}`)
      .then((d) => setData(d.data ?? null))
      .catch(() => {});
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  if (!sellerId) return null;

  const submit = async () => {
    setSaving(true);
    try {
      await api('/reviews', {
        method: 'POST',
        body: JSON.stringify({ reviewedId: sellerId, listingId, rating, comment: comment.trim() || undefined }),
      });
      setDone(true);
      setComment('');
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const canReview = user && (user as { id?: string }).id !== sellerId;

  return (
    <div className="card p-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-ink-900 dark:text-white">Satıcı rəyləri</h2>
        {data && data.summary.count > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={data.summary.avg} />
            <span className="text-sm font-bold text-ink-900 dark:text-white">{data.summary.avg.toFixed(1)}</span>
            <span className="text-xs text-ink-500">({data.summary.count})</span>
          </div>
        )}
      </div>

      {canReview && !done && (
        <div className="mb-4 p-3 rounded-xl bg-ink-50 dark:bg-ink-800">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} ulduz`}>
                <Star className={`w-6 h-6 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-ink-300'}`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Rəyiniz (istəyə bağlı)"
            className="w-full bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-tap text-ink-900 dark:text-white"
          />
          <button onClick={submit} disabled={saving} className="btn-tap mt-2 disabled:opacity-50">
            {saving ? 'Göndərilir…' : 'Rəy göndər'}
          </button>
        </div>
      )}
      {done && <p className="text-sm text-green-600 mb-3">Rəyiniz üçün təşəkkürlər!</p>}

      {data && data.reviews.length > 0 ? (
        <div className="space-y-3">
          {data.reviews.map((r) => (
            <div key={r.id} className="border-b border-ink-100 dark:border-ink-800 pb-2 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-tap text-white flex items-center justify-center text-xs font-bold">
                  {r.reviewer.fullName[0]}
                </div>
                <span className="font-semibold text-sm text-ink-900 dark:text-white">{r.reviewer.fullName}</span>
                <Stars value={r.rating} size="w-3 h-3" />
              </div>
              {r.comment && <p className="text-sm text-ink-600 dark:text-ink-300 mt-1 ml-9">{r.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-400">Hələ rəy yoxdur.{canReview ? ' İlk rəyi siz yazın.' : ''}</p>
      )}
    </div>
  );
}
