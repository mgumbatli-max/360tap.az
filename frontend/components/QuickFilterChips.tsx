'use client';
import { Truck, Image, Crown, Award, Calendar } from 'lucide-react';

/**
 * SÜRƏTLİ FİLTRLƏR — hamısı REAL backend filtrinə bağlıdır.
 *
 * ƏVVƏL 8 çipdən 7-si backend-də MÖVCUD OLMAYAN parametrlər göndərirdi
 * (`has_delivery=1`, `sort=price_dropped`, `with_photo=1`, `sort=vip`, `verified=1`,
 * `sort=fast`, `ai=1`) və hər biri HTTP 422 alırdı — istifadəçi düyməyə basıb
 * «elan tapılmadı» görürdü. Ölçüldü və backend-də real filtrlər quruldu
 * (`query-listings.dto.ts`: hasDelivery / withPhoto / vip / verified).
 *
 * ÇIXARILAN ÜÇ ÇİP və səbəbi:
 *  · «Endirimli» — `oldPrice > price` şərtinə uyğun elan sayı SIFIRDIR (ölçüldü);
 *    satıcılar köhnə qiyməti doldurmur. Filtri qurub həmişə boş nəticə vermək
 *    istifadəçini iki dəfə aldadardı. Data yarananda geri qaytarmaq bir sətirlikdir.
 *  · «Sürətli satılır» — satılma sürətini proqnozlaşdıran heç bir data/model yoxdur.
 *  · «AI tövsiyəsi» — şəxsiləşdirmə mühərriki yoxdur.
 */
const CHIPS = [
  { id: 'today',     icon: Calendar,  label: 'Bu gün',           param: 'sort=new' },
  { id: 'delivery',  icon: Truck,     label: 'Çatdırılma var',   param: 'hasDelivery=1' },
  { id: 'photo',     icon: Image,     label: 'Şəkilli',           param: 'withPhoto=1' },
  { id: 'vip',       icon: Crown,     label: 'VIP',               param: 'vip=1' },
  { id: 'verified',  icon: Award,     label: 'Təsdiqli satıcı',   param: 'verified=1' },
];

export default function QuickFilterChips({ onApply }: { onApply: (param: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
      {CHIPS.map((c) => {
        const I = c.icon;
        return (
          <button key={c.id} onClick={() => onApply(c.param)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-white dark:bg-ink-800 border border-ink-200 hover:border-tap hover:bg-tap-50 text-sm font-medium transition flex items-center gap-1.5">
            <I className="w-3.5 h-3.5 text-tap" />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
