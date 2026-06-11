'use client';
import { useState } from 'react';

export default function Gallery({ images, title }: { images: { url: string }[]; title: string }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-video bg-ink-100 dark:bg-ink-800 rounded-2xl flex items-center justify-center text-ink-400">
        Şəkil yoxdur
      </div>
    );
  }

  const idx = Math.min(active, images.length - 1);

  return (
    <div>
      <div className="aspect-video bg-ink-100 dark:bg-ink-800 rounded-2xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[idx].url} alt={title} className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                i === idx ? 'border-tap' : 'border-transparent hover:border-ink-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
