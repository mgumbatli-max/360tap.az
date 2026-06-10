'use client';
import { useState, useEffect } from 'react';
import { X, MapPin, Eye, Heart, Phone, MessageCircle, ExternalLink, Calendar, Star } from 'lucide-react';
import Link from 'next/link';
import { api, formatPrice, timeAgo } from '@/lib/api';

export default function QuickViewModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api<{ listing: any }>(`/listings/${id}`)
      .then((d) => setData(d.listing))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!id) return null;
  const media = data?.media || [];

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c2128] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-up grid sm:grid-cols-[1fr_360px]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 dark:bg-ink-800 rounded-full flex items-center justify-center shadow hover:bg-white">
          <X className="w-5 h-5" />
        </button>
        {/* Image */}
        <div className="bg-ink-100 dark:bg-ink-800 aspect-square sm:aspect-auto sm:h-[600px] relative">
          {loading ? (
            <div className="w-full h-full animate-pulse" />
          ) : media[activeImg]?.url ? (
            <img src={media[activeImg].url} alt={data?.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-400">Şəkil yoxdur</div>
          )}
          {media.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {media.map((_: any, i: number) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-2 h-2 rounded-full ${i===activeImg ? 'bg-white' : 'bg-white/50'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="p-5 overflow-y-auto flex flex-col">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-ink-100 rounded w-3/4" />
              <div className="h-10 bg-ink-100 rounded w-1/2" />
              <div className="h-4 bg-ink-100 rounded w-full" />
            </div>
          ) : !data ? (
            <p className="text-ink-500">Yüklənmədi</p>
          ) : (
            <>
              <div className="flex-1">
                <div className="text-3xl font-extrabold text-tap mb-1">{formatPrice(data.price, data.currency)}</div>
                <h2 className="text-lg font-bold text-ink-900 dark:text-white mb-3 line-clamp-2">{data.title}</h2>
                <div className="text-xs text-ink-500 space-y-1 mb-4">
                  {data.city_name && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{data.city_name}</div>}
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{timeAgo(data.created_at)}</div>
                  <div className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{data.views || 0} baxış</div>
                </div>
                {data.description && (
                  <p className="text-sm text-ink-700 dark:text-ink-300 line-clamp-4 mb-4">{data.description}</p>
                )}
                {data.owner_name && (
                  <div className="card p-3 bg-ink-50 dark:bg-ink-800/50 mb-4">
                    <div className="text-xs text-ink-500 mb-0.5">Satıcı</div>
                    <div className="font-semibold flex items-center gap-1.5">
                      {data.owner_name}
                      {data.owner_rating && <span className="text-xs flex items-center gap-0.5 text-amber-500"><Star className="w-3 h-3 fill-current" />{data.owner_rating}</span>}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2 pt-3 border-t border-ink-100">
                <Link href={`/elanlar/${data.id}`} className="btn-tap w-full">
                  <ExternalLink className="w-4 h-4" /> Tam səhifəyə bax
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-secondary text-xs"><Phone className="w-3.5 h-3.5" /> Zəng</button>
                  <button className="btn-secondary text-xs"><MessageCircle className="w-3.5 h-3.5" /> Mesaj</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
