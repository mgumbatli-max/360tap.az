'use client';
import { useState, useRef } from 'react';
import { Camera, Upload, X, Sparkles, Loader2 } from 'lucide-react';
import ListingCard, { type Listing } from '@/components/ListingCard';

type NestListing = {
  id: string; title: string; slug: string; price: number | null; currency: string;
  priceType: string; isVip?: boolean; isPremium?: boolean; hasDelivery?: boolean;
  views?: number; favoritesCount?: number; createdAt: string;
  images?: { url: string; sortOrder: number }[];
};
type Understanding = {
  keywords?: string | null; vertical?: string | null; category?: string | null;
  brand?: string | null; color?: string | null;
};

function mapListing(l: NestListing): Listing {
  return {
    id: l.id, title: l.title, slug: l.slug, price: l.price ?? null,
    currency: l.currency ?? 'AZN', price_type: l.priceType ?? 'fixed',
    is_vip: l.isVip, is_premium: l.isPremium, has_delivery: l.hasDelivery,
    views: l.views, favorites_count: l.favoritesCount, created_at: l.createdAt,
    media: (l.images ?? []).map((i) => ({ url: i.url, sort_order: i.sortOrder ?? 0 })),
  };
}

// Şəkli kiçilt (max 768px, jpeg) → kiçik base64
function resizeImage(file: File, maxSize = 768): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const U_LABELS: Record<string, string> = {
  keywords: '🔎', vertical: '📂', category: '📂', brand: '🏷️', color: '🎨',
};

export default function ImageSearchClient() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Listing[] | null>(null);
  const [understanding, setUnderstanding] = useState<Understanding | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setItems(null);
    setUnderstanding(null);
    setLoading(true);
    try {
      const dataUrl = await resizeImage(file);
      setPreview(dataUrl);
      const r = await fetch('/api/ai/image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const d = await r.json();
      if (r.ok) {
        setItems((d.data ?? []).map(mapListing));
        setUnderstanding(d.meta?.understanding ?? null);
      } else {
        setError(d.message || 'Şəkil analiz edilə bilmədi');
      }
    } catch {
      setError('Şəkil emal edilə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setItems(null);
    setUnderstanding(null);
    setError('');
  };

  const uChips = understanding
    ? Object.entries(understanding).filter(([, v]) => v != null && v !== '')
    : [];

  return (
    <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Camera className="w-6 h-6 text-tap" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 dark:text-white">
            Şəkillə axtarış
          </h1>
        </div>
        <p className="text-ink-500 mb-6">
          Məhsulun şəklini yükləyin — AI onu tanıyır və oxşar elanları tapır.
        </p>

        {!preview ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="card w-full p-12 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-ink-300 dark:border-ink-700 hover:border-tap transition"
          >
            <Upload className="w-10 h-10 text-tap" />
            <span className="font-bold text-ink-900 dark:text-white">Şəkil yüklə və ya çək</span>
            <span className="text-sm text-ink-500">JPG, PNG — AI tanıyacaq</span>
          </button>
        ) : (
          <div className="card p-4">
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="w-32 h-32 object-cover rounded-xl" />
              <div className="flex-1">
                {loading ? (
                  <div className="flex items-center gap-2 text-tap font-medium">
                    <Loader2 className="w-5 h-5 animate-spin" /> AI şəkli analiz edir…
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-tap font-bold text-sm mb-2">
                      <Sparkles className="w-4 h-4" /> AI tanıdı
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uChips.length ? (
                        uChips.map(([k, v]) => (
                          <span
                            key={k}
                            className="px-2.5 py-1 rounded-full bg-tap-50 dark:bg-ink-800 text-xs font-medium border border-tap/20"
                          >
                            {U_LABELS[k] ?? ''} {String(v)}
                          </span>
                        ))
                      ) : (
                        <span className="text-ink-500 text-sm">Məhsul dəqiq tanınmadı</span>
                      )}
                    </div>
                  </>
                )}
                <button onClick={reset} className="btn-secondary text-sm mt-3 inline-flex items-center gap-1">
                  <X className="w-4 h-4" /> Başqa şəkil
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => onPick(e.target.files?.[0])}
        />

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        {items && (
          <div className="mt-8">
            <h2 className="text-lg font-extrabold text-ink-900 dark:text-white mb-4">
              {items.length} oxşar elan tapıldı
            </h2>
            {items.length === 0 ? (
              <div className="card p-10 text-center text-ink-500">
                Bu məhsula uyğun elan tapılmadı
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {items.map((l) => (
                  <ListingCard key={l.id} item={l} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
