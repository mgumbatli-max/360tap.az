'use client';
import { useEffect, useState } from 'react';
import ProfileLayout from '@/components/ProfileLayout';
import { useAuth } from '@/lib/auth';
import { api, timeAgo } from '@/lib/api';
import { Star } from 'lucide-react';

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; fullName: string };
};
type Data = { summary: { avg: number; count: number }; reviews: Review[] };

export default function ReviewsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = (user as { id?: string } | null)?.id;
    if (!id) {
      setLoading(false);
      return;
    }
    api<{ data?: Data }>(`/reviews/user/${id}`)
      .then((d) => setData(d.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user]);

  const reviews = data?.reviews ?? [];
  const avg = data?.summary.avg ?? 0;
  const count = data?.summary.count ?? 0;

  return (
    <ProfileLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white">Rəylər</h1>
        {count > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-ink-800 rounded-full">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-bold text-ink-900 dark:text-white">{avg.toFixed(1)}</span>
            <span className="text-xs text-ink-500">({count} rəy)</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-500">Yüklənir...</div>
      ) : reviews.length === 0 ? (
        <div className="card p-12 text-center">
          <Star className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-600 dark:text-ink-300">Hələ rəyiniz yoxdur</p>
          <p className="text-sm text-ink-400 mt-1">
            Alıcılar sizinlə əməliyyatdan sonra elan səhifəsində rəy yaza bilər.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tap-100 dark:bg-ink-800 text-tap flex items-center justify-center font-bold">
                    {r.reviewer.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-ink-900 dark:text-white">{r.reviewer.fullName}</div>
                    <div className="text-xs text-ink-400" suppressHydrationWarning>{timeAgo(r.createdAt)}</div>
                  </div>
                </div>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${j < r.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}`}
                    />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-ink-700 dark:text-ink-300 mt-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </ProfileLayout>
  );
}
