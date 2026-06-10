'use client';
import Link from 'next/link';
import { Heart, MapPin, Star, Truck, Crown, Shield, GitCompareArrows } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatPrice, timeAgo } from '@/lib/api';
import { toggleFavorite, getLocalFavorites, setLocalFavorite } from '@/lib/favorites';
import { addCompare, isInCompare, removeCompare } from '@/lib/compare';
import { useAuth } from '@/lib/auth';

export type Listing = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  price_type: string;
  condition?: string;
  is_vip?: boolean;
  is_premium?: boolean;
  is_highlight?: boolean;
  is_urgent?: boolean;
  is_pro?: boolean;
  is_ad?: boolean;
  has_delivery?: boolean;
  views?: number;
  favorites_count?: number;
  created_at: string;
  category_name?: string;
  city_name?: string;
  district?: string;
  owner_name?: string;
  owner_rating?: number;
  owner_is_verified?: boolean;
  media: { url: string; sort_order: number }[];
};

export default function ListingCard({ item }: { item: Listing }) {
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const [cmp, setCmp] = useState(false);
  const [busy, setBusy] = useState(false);
  const cover = item.media?.[0]?.url;

  useEffect(() => {
    if (user) {
      // Auth user: server-də yoxla
      import('@/lib/favorites').then(({ checkFavorites }) =>
        checkFavorites([item.id]).then((s) => setFav(s.has(item.id)))
      );
    } else {
      setFav(getLocalFavorites().has(item.id));
    }
    setCmp(isInCompare(item.id));
  }, [user, item.id]);

  const onFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (user) {
        const next = await toggleFavorite(item.id, fav);
        setFav(next);
      } else {
        setLocalFavorite(item.id, !fav);
        setFav(!fav);
      }
    } catch (err) {
      console.error('Favorite error', err);
    } finally {
      setBusy(false);
    }
  };

  const onCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cmp) {
      removeCompare(item.id);
      setCmp(false);
    } else {
      const ok = addCompare({
        id: item.id,
        title: item.title,
        price: item.price,
        currency: item.currency,
        cover,
        city: item.city_name,
        category: item.category_name,
      });
      if (ok) setCmp(true);
      else alert('Müqayisə siyahısı doludur (max 4 elan)');
    }
  };

  return (
    <Link href={`/elanlar/${item.id}`} prefetch={true} className="group block transition-transform hover:-translate-y-0.5 duration-300">
      <div className="relative aspect-square bg-gradient-to-br from-ink-100 to-ink-200 dark:from-ink-800 dark:to-ink-700 rounded-2xl overflow-hidden mb-2.5 shadow-sm">
        {cover ? (
          <img
            src={cover}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-400 text-xs">
            Şəkil yoxdur
          </div>
        )}
        {/* Subtle vignette gradient — Airbnb stil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Compare düyməsi (hover-də görünür) */}
        <button
          type="button"
          onClick={onCompare}
          data-pro-only="true"
          className={`absolute top-2 right-12 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition opacity-0 group-hover:opacity-100 ${
            cmp ? 'bg-tap text-white opacity-100' : 'bg-white/85 text-ink-700 hover:bg-white'
          }`}
          aria-label="Müqayisəyə əlavə"
          title={cmp ? 'Müqayisədən sil' : 'Müqayisəyə əlavə'}
        >
          <GitCompareArrows className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onFav}
          disabled={busy}
          className="fav-btn"
          aria-label="Sevimliyə əlavə et"
        >
          <Heart
            className={`w-4 h-4 transition-all ${fav ? 'fill-red-500 text-red-500 scale-110' : 'text-ink-700'}`}
          />
        </button>

        {/* Sol-üst badge stack */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.is_pro && <span className="badge badge-pro">PRO</span>}
          {item.is_vip && <span className="badge badge-trusted"><Crown className="w-3 h-3" /> VIP</span>}
          {item.is_premium && !item.is_vip && <span className="badge badge-trusted">Premium</span>}
        </div>

        {/* Sol-alt mini etiketlər */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-1">
          {item.has_delivery && (
            <span className="badge badge-deliver">
              <Truck className="w-3 h-3" /> Çatdırılma
            </span>
          )}
          {item.is_ad && <span className="badge badge-ad">Реклама</span>}
        </div>
      </div>

      {/* Mətn hissə */}
      <div className="px-1">
        <div className="font-bold text-base sm:text-lg text-ink-900 leading-tight">
          {formatPrice(item.price, item.currency)}
          {item.price_type === 'negotiable' && (
            <span className="ml-1 text-xs text-ink-400 font-normal">razılaşma</span>
          )}
        </div>

        <h3 className="text-sm text-ink-800 mt-1 leading-snug line-clamp-2 min-h-[2.5em] group-hover:text-tap transition-colors">
          {item.title}
        </h3>

        <div className="text-xs text-ink-500 mt-1.5 leading-tight space-y-0.5">
          {(item.city_name || item.district) && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {item.district ? `${item.district}, ${item.city_name}` : item.city_name}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>{timeAgo(item.created_at)}</span>
            {item.owner_rating && Number(item.owner_rating) > 0 && (
              <span className="flex items-center gap-0.5 text-amber-500">
                <Star className="w-3 h-3 fill-amber-400" />
                <span className="text-ink-700 font-medium">{Number(item.owner_rating).toFixed(1)}</span>
              </span>
            )}
          </div>
          {item.owner_is_verified && (
            <div className="flex items-center gap-1 text-tap">
              <Shield className="w-3 h-3" />
              <span>Şirkət təsdiqlənib</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
