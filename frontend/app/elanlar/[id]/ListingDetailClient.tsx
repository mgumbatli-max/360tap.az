'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, formatPrice, timeAgo } from '@/lib/api';
import {
  MapPin, Eye, Heart, Phone, MessageCircle, Star, Calendar, Share2,
  AlertTriangle, ChevronLeft, ChevronRight, Shield, Truck, Crown,
} from 'lucide-react';
import ReportModal from '@/components/ReportModal';
import { toggleFavorite, getLocalFavorites, setLocalFavorite, checkFavorites } from '@/lib/favorites';
import { pushRecent } from '@/lib/recent';
import { addCompare, isInCompare, removeCompare } from '@/lib/compare';
import { useAuth } from '@/lib/auth';
import AISummary from '@/components/AISummary';
import AITranslate from '@/components/AITranslate';
import AISimilar from '@/components/AISimilar';
// SAXTA KOMPONENTLƏR SÖNDÜRÜLDÜ (bildiriş işi, 2026-09-06).
// Aşağıdakı komponentlər istifadəçiyə REAL VƏD verirdi, amma heç nə etmirdi:
// serverə bir sorğu belə atmır, yalnız `localStorage`-a yazır və ya sadəcə toast
// göstərirdilər. Yəni istifadəçi xəbərdarlıq qurub brauzerini bağlayır və heç vaxt
// heç nə almırdı — bu, işləməyən düymədən daha pisdir, çünki gözlənti yaradır.
// Fayllar SİLİNMƏDİ: real endpoint hazır olanda import və render bir sətirlə qaytarılır.
// PriceHistory: qrafiki `Math.random()` ilə uydururdu. PriceDropAlert: yalnız localStorage.
// import PriceDropAlert from '@/components/PriceDropAlert';
import LiveViewerStats from '@/components/LiveViewerStats';
// import PriceHistory from '@/components/PriceHistory';
import SellerReviews from '@/components/SellerReviews';
import SimilarSearches from '@/components/SimilarSearches';
import QRCodeShare from '@/components/QRCodeShare';
import AINegotiator from '@/components/AINegotiator';
import BuyerGuarantee from '@/components/BuyerGuarantee';
import EscrowBadge from '@/components/EscrowBadge';
import ListingQA from '@/components/ListingQA';
import MapMiniPreview from '@/components/MapMiniPreview';
import CompareWithSimilar from '@/components/CompareWithSimilar';
import GroupBuy from '@/components/GroupBuy';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [fav, setFav] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    api<{ listing: any }>(`/listings/${id}`)
      .then((d) => {
        setListing(d.listing);
        // Recently viewed
        pushRecent({
          id: d.listing.id,
          title: d.listing.title,
          price: d.listing.price ? Number(d.listing.price) : null,
          currency: d.listing.currency,
          cover: d.listing.media?.[0]?.url,
          city: d.listing.city_name,
        });
        // Real similar endpoint
        api<{ items: any[] }>(`/listings/${id}/similar`)
          .then((r) => setSimilar(r.items ?? []))
          .catch(() => setSimilar([]));
      })
      .finally(() => setLoading(false));

    // Favorit statusu
    if (user) {
      checkFavorites([id]).then((s) => setFav(s.has(id)));
    } else {
      setFav(getLocalFavorites().has(id));
    }
  }, [id, user]);

  const onFav = async () => {
    if (user) {
      const next = await toggleFavorite(id, fav);
      setFav(next);
    } else {
      setLocalFavorite(id, !fav);
      setFav(!fav);
    }
  };

  const onShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: listing?.title, url: window.location.href }); } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link kopyalandı');
    }
  };

  if (loading) return <div className="p-12 text-center text-ink-500">Yüklənir...</div>;
  if (!listing)
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <p className="text-ink-500 text-lg mb-4">Elan tapılmadı</p>
        <Link href="/elanlar" className="btn-tap inline-flex">Bütün elanlara qayıt</Link>
      </div>
    );

  const images = listing.media || [];
  const cover = images[activeImg]?.url;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-ink-500 mb-3 overflow-x-auto">
        <Link href="/" className="hover:text-tap">Ana</Link>
        <span>/</span>
        <Link href="/elanlar" className="hover:text-tap">Elanlar</Link>
        {listing.category_name && (
          <>
            <span>/</span>
            <Link href={`/elanlar?category=${listing.category_slug}`} className="hover:text-tap">
              {listing.category_name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink-700 truncate max-w-md">{listing.title}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* SOL */}
        <div className="space-y-5">
          {/* Şəkil qalereyası */}
          <div className="card overflow-hidden">
            <div className="relative aspect-[4/3] bg-ink-100">
              {cover ? (
                <img src={cover} alt={listing.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-400">
                  Şəkil yoxdur
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((activeImg - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow"
                    aria-label="Əvvəlki"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImg((activeImg + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow"
                    aria-label="Növbəti"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <span className="absolute bottom-3 right-3 px-2 py-1 rounded-md text-xs font-medium text-white bg-black/60">
                    {activeImg + 1} / {images.length}
                  </span>
                </>
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {listing.is_vip && <span className="badge badge-trusted"><Crown className="w-3 h-3" /> VIP</span>}
                {listing.is_premium && !listing.is_vip && <span className="badge badge-trusted">Premium</span>}
                {listing.is_urgent && <span className="badge badge-active">Təcili</span>}
              </div>
            </div>

            {/* Mini şəkillər */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-ink-50">
                {images.map((m: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden shrink-0 transition ${
                      i === activeImg ? 'ring-2 ring-tap' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={m.url} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Başlıq + meta */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl md:text-2xl font-extrabold text-ink-900 leading-tight">
                {listing.title}
              </h1>
              <button
                onClick={onFav}
                className={`btn-icon shrink-0 ${fav ? 'text-red-500' : ''}`}
                aria-label="Sevimliyə əlavə et"
              >
                <Heart className={`w-5 h-5 ${fav ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="text-3xl md:text-4xl font-extrabold text-ink-900 mt-3">
              {formatPrice(listing.price, listing.currency)}
              {listing.price_type === 'negotiable' && (
                <span className="ml-2 text-sm font-normal text-ink-500">razılaşma yolu ilə</span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-ink-500">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {timeAgo(listing.created_at)}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {listing.views ?? 0} baxış</span>
              {listing.city_name && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {listing.city_name}</span>}
              <span className="text-ink-400">№ {String(listing.id).slice(0, 8)}</span>
            </div>

            {/* Fərqləndirici xüsusiyyətlər */}
            {(listing.has_delivery || listing.has_credit || listing.has_barter) && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-ink-100">
                {listing.has_delivery && <span className="badge badge-deliver"><Truck className="w-3 h-3" /> Çatdırılma var</span>}
                {listing.has_credit && <span className="badge badge-active">Kredit mümkündür</span>}
                {listing.has_barter && <span className="badge badge-active">Barter</span>}
              </div>
            )}
          </div>

          {/* Atributlar */}
          {listing.attributes && Object.keys(listing.attributes).length > 0 && (
            <div className="card p-5 sm:p-6">
              <h2 className="font-bold text-lg text-ink-900 mb-3">Xüsusiyyətlər</h2>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {Object.entries(listing.attributes).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-dashed border-ink-200 py-1.5">
                    <dt className="text-ink-500 capitalize">{k.replace(/_/g, ' ')}</dt>
                    <dd className="font-medium text-ink-900">{Array.isArray(v) ? v.join(', ') : String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Canlı baxış + Price history */}
          <div className="grid md:grid-cols-2 gap-3">
            <LiveViewerStats listingId={listing.id} />
            <CompareWithSimilar listingId={listing.id} />
          </div>

          {/* Price history */}
          

          {/* Group buy */}
          {listing.price > 0 && <GroupBuy price={Number(listing.price)} />}

          {/* Təsvir */}
          <div className="card p-5 sm:p-6">
            <h2 className="font-bold text-lg text-ink-900 mb-3">Təsvir</h2>
            <p className="text-ink-700 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
            <AISummary text={listing.description ?? ''} />
            <AITranslate text={listing.description ?? ''} />
          </div>

          {/* Suallar və cavablar */}
          <ListingQA />

          {/* Rəylər */}
          <SellerReviews />

          {/* Bənzər axtarışlar */}
          <SimilarSearches category={listing.category_slug} title={listing.title} />

          {/* Sağ tərəf üçün şərtli blok — desktop */}
          <div className="hidden lg:block space-y-3">
            <BuyerGuarantee />
            <EscrowBadge />
            <MapMiniPreview city={listing.city_name} district={listing.district} />
            <div className="grid grid-cols-2 gap-2">
              <QRCodeShare url={`/elanlar/${listing.id}`} title={listing.title} />
              
            </div>
            {listing.price > 0 && <AINegotiator price={Number(listing.price)} listingId={listing.id} />}
          </div>

          {/* Təhlükəsizlik */}
          <div className="card p-5 bg-amber-50 border-amber-200">
            <h3 className="font-bold text-ink-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Təhlükəsizlik məsləhətləri
            </h3>
            <ul className="text-sm text-ink-700 space-y-1 list-disc pl-5">
              <li>Əvvəlcədən pul köçürməyin, məhsulu yoxlayın</li>
              <li>Görüşü ictimai yerdə təşkil edin</li>
              <li>Şübhəli linklərə klikləməyin</li>
              <li>Məhsul barədə suallar verin, sənədləri yoxlayın</li>
            </ul>
          </div>

          {/* AI bənzər elanlar */}
          <AISimilar listingId={id as string} />

          {/* Oxşar elanlar */}
          {similar.length > 0 && (
            <div className="card p-5">
              <h2 className="font-bold text-lg text-ink-900 mb-4">Oxşar elanlar</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {similar.map((s) => (
                  <Link key={s.id} href={`/elanlar/${s.id}`} className="block group">
                    <div className="aspect-square bg-ink-100 rounded-lg overflow-hidden mb-1.5">
                      {s.cover && (
                        <img src={s.cover} alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition" />
                      )}
                    </div>
                    <div className="text-sm font-bold text-ink-900">{formatPrice(s.price, s.currency)}</div>
                    <div className="text-xs text-ink-600 line-clamp-2 mt-0.5">{s.title}</div>
                    <div className="text-[11px] text-ink-400 mt-0.5">{s.city_name}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SAĞ — Satıcı kartı */}
        <aside className="space-y-4">
          <div className="card p-5 lg:sticky lg:top-20 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-ink-200">
              <div className="w-12 h-12 rounded-full bg-tap-100 text-tap flex items-center justify-center font-bold text-xl shrink-0">
                {(listing.owner_name ?? '?').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/istifadeci/${listing.owner_id}`} className="font-bold text-ink-900 hover:text-tap truncate block">
                  {listing.owner_name}
                </Link>
                <div className="text-xs text-ink-500 flex items-center gap-1">
                  {listing.owner_rating && Number(listing.owner_rating) > 0 && (
                    <>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-ink-700">
                        {Number(listing.owner_rating).toFixed(1)}
                      </span>
                      <span className="mx-1">·</span>
                    </>
                  )}
                  <span>{listing.owner_reviews_count ?? 0} rəy</span>
                </div>
              </div>
            </div>

            {listing.owner_is_business && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tap-50 text-tap-700 text-xs">
                <Shield className="w-4 h-4" />
                Şirkət təsdiqlənib
              </div>
            )}

            <button
              onClick={() => setShowPhone(true)}
              className="btn-tap w-full"
            >
              <Phone className="w-4 h-4" />
              {showPhone ? listing.contact_phone || 'Nömrə yoxdur' : 'Nömrəni göstər'}
            </button>

            <button className="btn-secondary w-full">
              <MessageCircle className="w-4 h-4" />
              Saytdaxili yaz
            </button>

            {listing.contact_phone && showPhone && (
              <a
                href={`https://wa.me/${listing.contact_phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full !bg-emerald-500 !text-white !border-emerald-500 hover:!bg-emerald-600"
              >
                WhatsApp
              </a>
            )}

            <div className="flex gap-2 pt-2 border-t border-ink-200">
              <button onClick={onShare} className="flex-1 btn-secondary !py-2 text-xs justify-center">
                <Share2 className="w-3.5 h-3.5" /> Paylaş
              </button>
              <button onClick={() => setReportOpen(true)} className="flex-1 btn-secondary !py-2 text-xs justify-center !text-red-600 !border-red-200 hover:!bg-red-50">
                <AlertTriangle className="w-3.5 h-3.5" /> Şikayət
              </button>
            </div>
          </div>

          {listing.lat && listing.lng && (
            <div className="card p-5">
              <h3 className="font-bold text-ink-900 mb-2 text-sm">Yerləşmə</h3>
              <div className="aspect-video bg-ink-100 rounded-lg flex items-center justify-center text-ink-400 text-sm">
                <MapPin className="w-5 h-5 mr-2" />
                {listing.address ?? 'Xəritə'}
              </div>
            </div>
          )}
        </aside>
      </div>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} listingId={String(id)} />
    </div>
  );
}
