'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, Star, Truck, Crown, Shield, GitCompareArrows, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatPrice, timeAgo } from '@/lib/api';
import { toggleFavorite, getLocalFavorites, setLocalFavorite } from '@/lib/favorites';
import { addCompare, isInCompare, removeCompare } from '@/lib/compare';
import { useAuth } from '@/lib/auth';
import { safeImageUrl } from '@/lib/image-hosts';
import StoreBadge from '@/components/StoreBadge';
import { DemoTag } from '@/components/DemoBadge';

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
  /** Nümunə (seed) elan — kartda açıq DEMO nişanı ilə göstərilir. */
  is_demo?: boolean;
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
  // Mağaza konteksti — YALNIZ ƏLAVƏ olunan sahələr (mövcud sahələr toxunulmayıb,
  // bu tipi 6-dan çox səhifə import edir). Backend elan cavabında mağaza adını/slug-ını
  // verməyə başlayanda nişan avtomatik görünür; olmayanda kart əvvəlki kimi render olunur.
  store_id?: string | null;
  store_slug?: string | null;
  store_name?: string | null;
  store_is_verified?: boolean;
  media: { url: string; sort_order: number }[];
};

// Şəklin üstündəki rozetlər: spesifikasiya §6 — rəngli deyil, ağ yarımşəffaf pill.
// Fərqləndirmə rəngli fonla yox, ikonla aparılır ki, şəkil önə çıxsın.
const PILL =
  'inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-ink-900/85 px-2 py-0.5 ' +
  'text-[11px] font-semibold text-ink-800 dark:text-ink-100 backdrop-blur-sm';

// ♥ və ⋯ artıq şəklin üstündə deyil, mətn sətrindədir — ona görə şəffaf fonlu ikon düymə.
const ACTION_BTN =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 ' +
  'transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-100 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tap focus-visible:ring-offset-1';

export default function ListingCard({ item }: { item: Listing }) {
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const [cmp, setCmp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // `safeImageUrl` — NİYƏ xam URL birbaşa `next/image`-ə verilmir:
  // `remotePatterns`-də olmayan host üçün `next/image` dəyər qaytarmır, İSTİSNA ATIR.
  // Şəkil URL-i isə elan sahibinin yazdığı ixtiyari mətndir → bircə pis elan bütün
  // kart şəbəkəsini çökdürürdü. Süzgəcdən keçməyən URL üçün placeholder göstərilir.
  const cover = safeImageUrl(item.media?.[0]?.url);

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

  // Kontekst menyusu çöl klik və Esc ilə bağlanır — açıq menyu kart şəbəkəsində
  // digər kartların üstünə düşdüyü üçün qlobal dinləyici lazımdır.
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnClick = () => setMenuOpen(false);
    const closeOnEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('click', closeOnClick);
    window.addEventListener('keydown', closeOnEsc);
    return () => {
      window.removeEventListener('click', closeOnClick);
      window.removeEventListener('keydown', closeOnEsc);
    };
  }, [menuOpen]);

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
    setMenuOpen(false);
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

  const location = item.district ? `${item.district}, ${item.city_name}` : item.city_name;
  const rating = Number(item.owner_rating);

  return (
    // Kölgə/sərhəd yoxdur (§1, §6) — kart şəffaf fonda boşluqla ayrılır.
    // `relative` başlıq linkinin bütün kartı əhatə edən ::after örtüyü üçün lazımdır.
    <article className="group relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-200 dark:bg-ink-800">
        {cover ? (
          <Image
            src={cover}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink-500 dark:text-ink-400">
            Şəkil yoxdur
          </div>
        )}

        {/* Bütün rozetlər sol-yuxarı küncdə toplanır (§6) */}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
          {item.is_demo && <DemoTag />}
          {item.is_vip && (
            <span className={PILL}>
              <Crown className="h-3 w-3 text-gold" aria-hidden="true" /> VIP
            </span>
          )}
          {item.is_premium && !item.is_vip && <span className={PILL}>Premium</span>}
          {item.is_pro && <span className={PILL}>PRO</span>}
          {item.has_delivery && (
            <span className={PILL}>
              <Truck className="h-3 w-3 text-tap" aria-hidden="true" /> Çatdırılma
            </span>
          )}
          {item.is_ad && <span className={PILL}>Reklam</span>}
        </div>
      </div>

      {/* Mətn hissə — ardıcıllıq: başlıq → qiymət → məkan (§6) */}
      <div className="mt-2">
        <div className="flex items-start gap-1">
          {/* ::after bütün kartı örtür — kartın hər yeri klikləniblidir, amma
              DOM-da tək link var və düymələr linkin içində yuvalanmır. */}
          <Link
            href={`/elanlar/${item.id}`}
            prefetch={true}
            className="min-w-0 flex-1 rounded after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tap focus-visible:ring-offset-2"
          >
            <h3 className="line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug text-ink-900 transition-colors group-hover:text-tap dark:text-ink-50">
              {item.title}
            </h3>
          </Link>

          {/* z-10 örtüyün üstündə qalmaq üçün — əks halda kliklər linkə düşərdi */}
          <div className="relative z-10 flex shrink-0 items-center">
            <button
              type="button"
              onClick={onFav}
              disabled={busy}
              className={ACTION_BTN}
              aria-pressed={fav}
              aria-label={fav ? 'Sevimlilərdən çıxar' : 'Sevimliyə əlavə et'}
              title={fav ? 'Sevimlilərdən çıxar' : 'Sevimliyə əlavə et'}
            >
              <Heart
                className={`h-[18px] w-[18px] transition-colors ${fav ? 'fill-danger text-danger' : ''}`}
                aria-hidden="true"
              />
            </button>

            {/* Müqayisə lite rejimdə gizlidir — ⋯ düyməsi də onunla birlikdə gedir,
                əks halda boş menyu qalardı. */}
            <div className="relative" data-pro-only="true">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className={ACTION_BTN}
                aria-label="Elan üzrə əməliyyatlar"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1 w-max overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-menu dark:border-ink-700 dark:bg-ink-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={onCompare}
                    className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-[13px] text-ink-700 transition-colors hover:bg-ink-100 focus-visible:bg-ink-100 focus-visible:outline-none dark:text-ink-100 dark:hover:bg-ink-700 dark:focus-visible:bg-ink-700"
                  >
                    <GitCompareArrows
                      className={`h-4 w-4 ${cmp ? 'text-tap' : 'text-ink-400'}`}
                      aria-hidden="true"
                    />
                    {cmp ? 'Müqayisədən sil' : 'Müqayisəyə əlavə'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-1 text-base font-bold leading-tight text-ink-900 dark:text-ink-50">
          {formatPrice(item.price, item.currency)}
          {item.price_type === 'negotiable' && (
            <span className="ml-1 text-xs font-normal text-ink-400 dark:text-ink-400">razılaşma</span>
          )}
        </div>

        {/* Mağaza nişanı — `relative z-10`, çünki başlıq linkinin ::after örtüyü
            bütün kartı əhatə edir; onsuz mağaza keçidi kliklənə bilməzdi. */}
        {item.store_name && (
          <div className="relative z-10 mt-1 flex">
            <StoreBadge
              name={item.store_name}
              slug={item.store_slug}
              isVerified={item.store_is_verified}
            />
          </div>
        )}

        {location && (
          <div className="mt-1 flex items-center gap-1 text-[13px] text-ink-500 dark:text-ink-400">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </div>
        )}

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-ink-500 dark:text-ink-400">
          <span suppressHydrationWarning>{timeAgo(item.created_at)}</span>
          {rating > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-gold text-gold" aria-hidden="true" />
              <span className="font-medium text-ink-700 dark:text-ink-200">{rating.toFixed(1)}</span>
            </span>
          )}
          {item.owner_is_verified && (
            <span className="flex items-center gap-1 text-tap">
              <Shield className="h-3 w-3 shrink-0" aria-hidden="true" />
              Şirkət təsdiqlənib
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
