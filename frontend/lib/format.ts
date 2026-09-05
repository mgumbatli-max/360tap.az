/**
 * DETERMİNİSTİK AZƏRBAYCAN FORMATLAMASI — SSR VƏ BRAUZER EYNİ NƏTİCƏNİ VERSİN.
 *
 * PROBLEM: `Number.toLocaleString('az-AZ')` və `Date.toLocaleDateString('az-AZ')`
 * nəticəni işlədiyi mühitin ICU məlumat bazasından alır. Ölçülmüş fərq:
 *
 *            Node 24 (server)      Chrome 153 (klient)
 *   ədəd     1.234.567,5           1,234,567.5
 *   tarix    15.01.2026            2026-01-15
 *
 * Yəni SSR-də çap olunan qiymət brauzerdə BAŞQA cür render olunurdu → React
 * hidratasiya uyğunsuzluğu (error #418) atır, SSR ağacını ATIR və bütün alt ağacı
 * klientdə yenidən qurur. Nəticə: hər qiymətli səhifədə konsol xətası, itirilmiş
 * SSR faydası və gözlə görünən titrəmə.
 *
 * HƏLL: formatlama ICU-dan tamamilə asılı olmayan öz kodumuzdur. Azərbaycan
 * konvensiyası saxlanılır (minlik ayırıcı «.», onluq ayırıcı «,», tarix
 * «gg.aa.iiii») — yəni istifadəçi eyni görünüşü alır, sadəcə hər iki tərəfdə eyni.
 *
 * QAYDA: layihədə `toLocaleString`/`toLocaleDateString`/`Intl.*Format` ilə
 * 'az-AZ' İŞLƏTMƏYİN. Bu faylı işlədin.
 */

/** Minlikləri «.» ilə qruplaşdırır, onluq hissəni «,» ilə verir. */
export function azNumber(value: number | string | null | undefined): string {
  if (value == null || value === '') return '';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '';

  const negative = n < 0;
  const abs = Math.abs(n);
  // Kəsr hissəsi yalnız real varsa göstərilir: qiymətlərin böyük hissəsi tamdır və
  // «250,00 AZN» süni görünür. Maksimum 2 rəqəm — pul üçün kifayətdir.
  const rounded = Math.round(abs * 100) / 100;
  const intPart = Math.floor(rounded);
  const fraction = Math.round((rounded - intPart) * 100);

  const grouped = String(intPart).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const frac = fraction === 0 ? '' : `,${String(fraction).padStart(2, '0').replace(/0$/, '')}`;
  return `${negative ? '-' : ''}${grouped}${frac}`;
}

/**
 * Qiymət + valyuta. `null` qiymət «Razılaşma yolu ilə» deməkdir — bu, bazada
 * qəsdən NULL saxlanılan haldır, sıfır deyil.
 */
export function azPrice(
  price: number | string | null | undefined,
  currency = 'AZN',
  fallback = 'Razılaşma yolu ilə',
): string {
  if (price == null || price === '') return fallback;
  const n = typeof price === 'number' ? price : Number(price);
  if (!Number.isFinite(n)) return fallback;
  return `${azNumber(n)} ${currency}`;
}

const AZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
];

function parse(input: string | number | Date | null | undefined): Date | null {
  if (input == null || input === '') return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** «15.01.2026» — siyahılarda və cədvəllərdə qısa forma. */
export function azDate(input: string | number | Date | null | undefined): string {
  const d = parse(input);
  if (!d) return '';
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** «15 yanvar 2026» — mətn içində oxunaqlı forma. */
export function azDateLong(input: string | number | Date | null | undefined): string {
  const d = parse(input);
  if (!d) return '';
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** «15.01.2026, 14:30» — audit/loq göstəricilərində. */
export function azDateTime(input: string | number | Date | null | undefined): string {
  const d = parse(input);
  if (!d) return '';
  return `${azDate(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
