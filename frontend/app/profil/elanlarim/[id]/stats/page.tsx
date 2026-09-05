'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProfileLayout from '@/components/ProfileLayout';
import { api, unwrap } from '@/lib/api';
import { Eye, Heart, TrendingUp, ArrowLeft, BarChart3 } from 'lucide-react';
import { azNumber } from '@/lib/format';

export default function ListingStatsPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Faza 0: köhnə `d.listing` → `{ ok, data }`. Əvvəl səhifə sonsuz "Yüklənir..."də qalırdı.
    api<any>(`/listings/${id}`)
      .then((d) => setListing(unwrap<any>(d, null)))
      .catch(() => setLoadError(true));
  }, [id]);

  // Faza 0 (§10): xəta halında sonsuz spinner YOX — aydın mesaj + geri yolu.
  if (loadError) {
    return (
      <ProfileLayout>
        <div className="p-8 text-center">
          <p className="font-bold text-ink-900 dark:text-white">Statistika yüklənmədi</p>
          <p className="text-ink-500 mt-1 text-sm">
            Xidmətdə qısamüddətli problem ola bilər. Bir azdan yenidən cəhd edin.
          </p>
          <Link href="/profil/elanlarim" className="btn-secondary inline-flex mt-4">
            <ArrowLeft className="w-4 h-4" /> Elanlarıma qayıt
          </Link>
        </div>
      </ProfileLayout>
    );
  }

  if (!listing) return <ProfileLayout><div className="p-8 text-center">Yüklənir...</div></ProfileLayout>;

  // Sabitləşdirmə: burada 14 günlük `Math.random()` massivi vardı və 14 günlük «baxış»
  // qrafikini o uydurma rəqəmlərlə cızırdı — hər səhifə yüklənməsində dəyişir, heç bir
  // yerdə «demo» kimi etiketlənmirdi. Uydurma rəqəmi başqa uydurma rəqəmlə əvəz etmək
  // yerinə blok tamamilə çıxarıldı; gündəlik data mənbəyi (listing_stat_daily cədvəli
  // boşdur, GET /listings/:id/stats endpoint-i də yoxdur) hazır olana qədər boş vəziyyət
  // göstərilir. `max` dəyişəni də qrafiklə birlikdə silindi (istinadsız qalırdı).

  return (
    <ProfileLayout>
      <Link href="/profil/elanlarim" className="text-sm text-ink-500 hover:text-tap inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="w-4 h-4" /> Mənim elanlarıma qayıt
      </Link>

      <h1 className="text-2xl font-extrabold text-ink-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-tap" />
        Statistika
      </h1>

      <div className="card p-4 mb-5 flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg bg-ink-100 overflow-hidden shrink-0">
          {/* API şəkilləri `images` altında verir — köhnə `media` açarı daimi boş idi. */}
          {listing.images?.[0]?.url && <img src={listing.images[0].url} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{listing.title}</div>
          <div className="text-sm text-ink-500">{listing.price ? `${azNumber(listing.price)} ${listing.currency}` : 'Razılaşma'}</div>
        </div>
      </div>

      {/* KPI — yalnız API-nin HƏQİQƏTƏN qaytardığı sahələr.
          `favorites_count` → `favoritesCount` (API camelCase verir, snake_case daimi 0 idi).
          «Mesajlar» (literal 0) və «Telefon klik» (`phone_clicks` — belə sahə API-də yoxdur)
          KPI-ları çıxarıldı: onları dolduran ölçmə backend-də mövcud deyil, daimi 0
          göstərmək satıcını yanıldır. Ölçmə əlavə olunanda geri qaytarılmalıdır. */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Cəmi baxış', value: listing.views ?? 0, icon: Eye, color: 'bg-blue-500' },
          { label: 'Sevimliyə əlavə', value: listing.favoritesCount ?? 0, icon: Heart, color: 'bg-pink-500' },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <div className={`w-10 h-10 rounded-xl ${k.color} text-white flex items-center justify-center mb-2`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-extrabold">{k.value}</div>
            <div className="text-xs text-ink-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Gündəlik statistika — boş vəziyyət (uydurma qrafikin yeri) */}
      <div className="card p-8 text-center">
        <BarChart3 className="w-12 h-12 mx-auto text-ink-300 mb-3" />
        <p className="font-bold text-ink-900 dark:text-white">Gündəlik statistika hazırlanır</p>
        <p className="text-sm text-ink-500 mt-1">
          Günlük baxış və müraciət dinamikası tezliklə burada görünəcək.
          Hələlik yuxarıdakı ümumi göstəricilər elanın real nəticəsini əks etdirir.
        </p>
      </div>
    </ProfileLayout>
  );
}
