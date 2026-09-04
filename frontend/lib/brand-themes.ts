/**
 * BREND TEMALARI — İSTİFADƏÇİ TƏRƏFİNDƏN DƏYİŞİLƏ BİLƏN RƏNG SİSTEMİ.
 *
 * NİYƏ BELƏ: əvvəl brend rəngi `tailwind.config.ts`-də sabit hex idi, yəni dəyişmək
 * üçün kodu redaktə edib YENİDƏN BUILD etmək lazım gəlirdi. İndi Tailwind-in `tap-*`
 * çalarları CSS dəyişənlərinə bağlıdır (`rgb(var(--tap-500) / <alpha-value>)`), ona görə
 * `<html data-brand="...">` atributunu dəyişmək bütün saytın rəngini ANINDA dəyişir —
 * build tələb olunmur.
 *
 * Alfa dəstəyi vacibdir: layihədə `bg-tap/10`, `border-tap/20` kimi 30-dan çox istifadə
 * var. Ona görə dəyişənlər hex DEYİL, boşluqla ayrılmış RGB üçlüyüdür («224 43 49») —
 * yalnız bu formada Tailwind `<alpha-value>` yerinə şəffaflıq yerləşdirə bilir.
 *
 * ⚠️ BU SİYAHI `app/globals.css`-dəki `[data-brand="..."]` bloklarının EYNİSİDİR.
 * Yeni tema əlavə edəndə HƏR İKİ yer yenilənməlidir (CSS TypeScript-i import edə bilmir).
 */

export type BrandTheme = {
  /** `data-brand` atributunun dəyəri — CSS blokunun açarı. */
  id: string;
  /** Seçicidə göstərilən ad. */
  label: string;
  /** Seçicidə nümunə dairəsi üçün əsas çalar (500). */
  swatch: string;
  /** Qısa izah — hansı hiss/mesaj daşıyır. */
  note: string;
};

export const BRAND_THEMES: BrandTheme[] = [
  { id: 'qirmizi', label: 'Qırmızı', swatch: '#E02B31', note: 'Enerjili, ticarət — diqqəti CTA-ya çəkir' },
  { id: 'benovseyi', label: 'Bənövşəyi', swatch: '#5B4BE0', note: 'Müasir, premium — rəqiblərdə yoxdur' },
  { id: 'goy', label: 'Göy', swatch: '#2563EB', note: 'Klassik etibar — ən neytral variant' },
  { id: 'zumrud', label: 'Zümrüd', swatch: '#059669', note: 'Təhlükəsizlik, təravət' },
  { id: 'narinci', label: 'Narıncı', swatch: '#EA580C', note: 'İsti, dostyana, marketpleys' },
  { id: 'firuzeyi', label: 'Firuzəyi', swatch: '#0891B2', note: 'Texnoloji, sakit' },
];

export const DEFAULT_BRAND = 'qirmizi';

/** `localStorage` açarı — tema init skripti (layout.tsx) ilə eyni olmalıdır. */
export const BRAND_STORAGE_KEY = 'tap_brand';

export function isValidBrand(id: unknown): id is string {
  return typeof id === 'string' && BRAND_THEMES.some((t) => t.id === id);
}
