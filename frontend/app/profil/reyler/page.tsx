'use client';
import ProfileLayout from '@/components/ProfileLayout';
import { Star } from 'lucide-react';

const DEMO = [
  { from: 'Anar Ə.', rating: 5, date: '8 May', text: 'Hər şey əla idi! Məhsul təsvirə uyğundur.', listing: 'iPhone 15 Pro' },
  { from: 'Pərvin K.', rating: 4, date: '5 May', text: 'Yaxşı satıcı, sürətli cavab verir.', listing: 'BMW X5' },
];

export default function ReviewsPage() {
  return (
    <ProfileLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-ink-900">Rəylər</h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-bold">4.5</span>
          <span className="text-xs text-ink-500">({DEMO.length} rəy)</span>
        </div>
      </div>

      <div className="space-y-3">
        {DEMO.map((r, i) => (
          <div key={i} className="card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tap-100 text-tap flex items-center justify-center font-bold">
                  {r.from.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{r.from}</div>
                  <div className="text-xs text-ink-400">{r.date} · {r.listing}</div>
                </div>
              </div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`w-4 h-4 ${j < r.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-ink-700 mt-2">{r.text}</p>
            <button className="text-xs text-tap hover:underline mt-2">Cavab ver</button>
          </div>
        ))}
      </div>
    </ProfileLayout>
  );
}
