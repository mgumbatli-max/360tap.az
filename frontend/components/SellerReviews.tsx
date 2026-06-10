'use client';
import { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';

const REVIEWS = [
  { id: 1, user: 'Anar Ə.', rating: 5, text: 'Çox dürüst satıcı, məhsul təsvirə uyğun idi.', date: '2 həftə öncə', votes: 14 },
  { id: 2, user: 'Lalə M.', rating: 4, text: 'Sürətli cavab verir, görüş asan oldu.',         date: '1 ay öncə',    votes: 8 },
  { id: 3, user: 'Pərvin K.', rating: 5, text: 'Mükəmməl təcrübə, məsləhət görürəm.',        date: '2 ay öncə',    votes: 21 },
];

export default function SellerReviews({ totalRating = 4.8, totalCount = 156 }: { totalRating?: number; totalCount?: number }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">Rəylər ({totalCount})</h3>
        <div className="flex items-center gap-1 text-amber-500 font-bold">
          <Star className="w-4 h-4 fill-current" /> {totalRating}
        </div>
      </div>
      <div className="space-y-3">
        {REVIEWS.map((r) => (
          <div key={r.id} className="border-b border-ink-100 pb-3 last:border-b-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-tap text-white flex items-center justify-center text-xs font-bold">{r.user[0]}</div>
                <div>
                  <div className="font-semibold text-sm">{r.user}</div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-current' : 'text-ink-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-xs text-ink-500">{r.date}</span>
            </div>
            <p className="text-sm text-ink-700 dark:text-ink-300">{r.text}</p>
            <button className="text-xs text-ink-500 hover:text-tap mt-1 flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> {r.votes}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
