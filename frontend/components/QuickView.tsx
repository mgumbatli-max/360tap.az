'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Phone, MessageCircle, Heart, MapPin, Eye, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { api, formatPrice, timeAgo } from '@/lib/api';

export default function QuickView({
  listingId,
  open,
  onClose,
}: {
  listingId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!open || !listingId) return;
    setLoading(true);
    setImgIdx(0);
    api<{ listing: any }>(`/listings/${listingId}`)
      .then((d) => setListing(d.listing))
      .finally(() => setLoading(false));
  }, [open, listingId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && listing?.media) setImgIdx((i) => (i - 1 + listing.media.length) % listing.media.length);
      if (e.key === 'ArrowRight' && listing?.media) setImgIdx((i) => (i + 1) % listing.media.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, listing, onClose]);

  if (!open || !listingId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden grid sm:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Şəkil qalereyası (sol) */}
        <div className="relative bg-ink-100 aspect-square sm:aspect-auto">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-ink-400">Yüklənir...</div>
          ) : listing?.media?.[imgIdx]?.url ? (
            <>
              <img src={listing.media[imgIdx].url} alt={listing.title} className="w-full h-full object-cover" />
              {listing.media.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx((i) => (i - 1 + listing.media.length) % listing.media.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % listing.media.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                    {imgIdx + 1} / {listing.media.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-400">Şəkil yoxdur</div>
          )}
        </div>

        {/* Detal (sağ) */}
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          {listing && (
            <>
              <h2 className="text-xl font-bold text-ink-900">{listing.title}</h2>
              <div className="text-3xl font-extrabold mt-2">
                {formatPrice(listing.price, listing.currency)}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-ink-500 mt-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {listing.city_name ?? '—'}</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {listing.views ?? 0}</span>
                <span>{timeAgo(listing.created_at)}</span>
              </div>

              <p className="text-sm text-ink-700 mt-4 line-clamp-6">{listing.description}</p>

              <div className="space-y-2 mt-5">
                <button className="btn-tap w-full">
                  <Phone className="w-4 h-4" />
                  Nömrəni göstər
                </button>
                <button className="btn-secondary w-full">
                  <MessageCircle className="w-4 h-4" />
                  Yaz
                </button>
                <button className="btn-secondary w-full">
                  <Heart className="w-4 h-4" />
                  Sevimliyə əlavə
                </button>
              </div>

              <Link
                href={`/elanlar/${listing.id}`}
                onClick={onClose}
                className="block mt-4 text-center text-sm text-tap font-semibold hover:underline"
              >
                Tam detalları gör <ExternalLink className="w-3.5 h-3.5 inline" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
