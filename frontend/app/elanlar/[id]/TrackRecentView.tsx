'use client';
import { useEffect } from 'react';
import { pushRecent, type RecentItem } from '@/lib/recent';

/**
 * «Son baxılanlar» izləyicisi.
 *
 * NİYƏ AYRICA KOMPONENT: `/elanlar/[id]` server komponentidir və localStorage-a
 * yaza bilmir. `lib/recent.ts` (pushRecent) və onu OXUYAN `/profil/baxilanlar`
 * səhifəsi ARTIQ VAR idi, amma yazan yeganə çağırış ölü `ListingDetailClient.tsx`
 * faylında qalmışdı — nəticədə səhifə həmişə boş görünürdü. Burada minimal
 * klient qatı əlavə olunur: heç bir görünüş render etmir, yalnız yan təsir.
 *
 * `id` asılılığı: eyni elanda təkrar effekt işə düşmür; başqa elana keçəndə isə
 * yeni yazı gedir. `pushRecent` özü dublikatı silib başa köçürür.
 */
export default function TrackRecentView({ item }: { item: Omit<RecentItem, 'viewedAt'> }) {
  const { id, title, price, currency, cover, city } = item;
  useEffect(() => {
    try {
      pushRecent({ id, title, price, currency, ...(cover ? { cover } : {}), ...(city ? { city } : {}) });
    } catch {
      // localStorage bağlıdırsa (private rejim, kvota) səhifə pozulmamalıdır.
    }
  }, [id, title, price, currency, cover, city]);

  return null;
}
