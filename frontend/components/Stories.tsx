'use client';
import { useState } from 'react';
import { Plus, Play } from 'lucide-react';

const STORIES = [
  { id: 1, user: 'Anar', avatar: 'A', preview: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200' },
  { id: 2, user: 'Lalə', avatar: 'L', preview: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200' },
  { id: 3, user: 'BMW Salon', avatar: '🚗', preview: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200' },
  { id: 4, user: 'Mənzil', avatar: '🏠', preview: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200' },
];

export default function Stories() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <>
      <div className="card p-3 mb-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
          <button className="shrink-0 w-16 text-center group">
            <div className="w-14 h-14 rounded-full bg-ink-100 border-2 border-dashed border-tap flex items-center justify-center mx-auto">
              <Plus className="w-5 h-5 text-tap" />
            </div>
            <div className="text-[10px] text-ink-600 mt-1">Əlavə</div>
          </button>
          {STORIES.map((s) => (
            <button key={s.id} onClick={() => setActive(s.id)} className="shrink-0 w-16 text-center">
              <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-pink-500 to-tap mx-auto">
                <div className="w-full h-full rounded-full bg-cover bg-center bg-ink-100" style={{ backgroundImage: `url(${s.preview})` }} />
              </div>
              <div className="text-[10px] mt-1 truncate">{s.user}</div>
            </button>
          ))}
        </div>
      </div>
      {active && (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center" onClick={() => setActive(null)}>
          <div className="relative max-w-md w-full h-[80vh] mx-4">
            <img src={STORIES.find(s => s.id === active)?.preview} className="w-full h-full object-cover rounded-2xl" />
            <div className="absolute top-3 inset-x-3 h-1 bg-white/30 rounded-full">
              <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
