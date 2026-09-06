'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Truck, Image, Crown, Award, Clock } from 'lucide-react';

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
 *
 * NİYƏ `<Link>`, `<button onClick>` DEYİL: çip ünvanı dəyişdirən naviqasiyadır.
 * Real `<a href>` olduqda o, paylaşıla bilir, orta düymə ilə yeni tabda açılır,
 * ekran oxuyucusuna keçid kimi elan olunur və JS yüklənməmişdən əvvəl də işləyir.
 * Əvvəlki `onApply` prop-lu variant yalnız `app/elanlar/ListingsClient.tsx`-dən
 * çağırılırdı, HƏMİN FAYL İSƏ HEÇ YERDƏ import olunmurdu — yəni bu çiplər
 * istifadəçiyə ÜMUMİYYƏTLƏ görünmürdü (ölçüldü: `/elanlar` HTML-ində çip
 * mətnlərinin heç biri yox idi). İndi komponent özü-özünə yetərlidir.
 *
 * NİYƏ «Ən yeni», «Bu gün» DEYİL: çip `sort=new` göndərir, bu isə SIRALAMA-dır,
 * tarix filtri deyil — backend-də `createdAt >= bu gün` filtri yoxdur. «Bu gün»
 * yazmaq istifadəçiyə vermədiyimiz vədi verərdi (siyahıda köhnə elanlar da qalır).
 */
type Chip = {
  id: string;
  icon: typeof Truck;
  label: string;
  key: string;
  value: string;
};

const CHIPS: Chip[] = [
  { id: 'new', icon: Clock, label: 'Ən yeni', key: 'sort', value: 'new' },
  { id: 'delivery', icon: Truck, label: 'Çatdırılma var', key: 'hasDelivery', value: '1' },
  { id: 'photo', icon: Image, label: 'Şəkilli', key: 'withPhoto', value: '1' },
  { id: 'vip', icon: Crown, label: 'VIP', key: 'vip', value: '1' },
  { id: 'verified', icon: Award, label: 'Təsdiqli satıcı', key: 'verified', value: '1' },
];

/**
 * Səhifə qatı filtrləri həm camelCase, həm snake_case adla qəbul edir (paylaşılmış
 * köhnə linklər snake_case daşıyır). Çipin «aktivdir» qərarı da hər iki ada baxmalıdır,
 * əks halda snake_case link ilə gələn istifadəçi filtri işlək görür, amma çipi sönük.
 */
const SNAKE: Record<string, string> = {
  hasDelivery: 'has_delivery',
  withPhoto: 'with_photo',
  vip: 'is_vip',
  verified: 'verified',
};

export default function QuickFilterChips() {
  const pathname = usePathname();
  const params = useSearchParams();

  const isOn = (c: Chip): boolean => {
    const direct = params.get(c.key);
    if (direct === c.value) return true;
    const alias = SNAKE[c.key];
    return Boolean(alias && params.get(alias) === c.value);
  };

  /** Çipin ünvanı: aktivdirsə filtri SİLİR, deyilsə əlavə edir (toggle). */
  const hrefFor = (c: Chip): string => {
    const p = new URLSearchParams(params.toString());
    const alias = SNAKE[c.key];
    if (isOn(c)) {
      p.delete(c.key);
      if (alias) p.delete(alias);
    } else {
      p.set(c.key, c.value);
      if (alias) p.delete(alias);
    }
    // Filtr dəyişdi → 3-cü səhifədə qalıb boş nəticə görünməsin.
    p.delete('page');
    const s = p.toString();
    return s ? `${pathname}?${s}` : pathname;
  };

  return (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-2" data-testid="sürətli-filtrlər">
      {CHIPS.map((c) => {
        const I = c.icon;
        const on = isOn(c);
        return (
          <Link
            key={c.id}
            href={hrefFor(c)}
            scroll={false}
            aria-pressed={on}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              on
                ? 'border-tap bg-tap text-white'
                : 'border-ink-200 bg-white text-ink-800 hover:border-tap hover:bg-tap-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100'
            }`}
          >
            <I className={`h-3.5 w-3.5 ${on ? 'text-white' : 'text-tap'}`} aria-hidden="true" />
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
