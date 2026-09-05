import { CAR_BRANDS } from './transport-data';

/**
 * ATRİBUT TAKSONOMİYASI — SXEMDƏ İFADƏ OLUNA BİLMƏYƏN SEÇİM SİYAHILARI.
 *
 * NİYƏ AYRICA MODUL:
 * `category_attributes` sxemi hər atributu MÜSTƏQİL sayır — `options` sabit
 * siyahıdır və başqa sahədən asılı ola bilmir. Kataloqumuzda isə BİR real
 * asılılıq var: **marka → model**. «BMW» seçiləndə model siyahısı yalnız BMW
 * modelləri olmalıdır; bunu sxemə yazmaq üçün 63 markanın modelini tək massivə
 * yığmaq (2000+ element, hamısı hər markada göstərilir) lazım gələrdi.
 *
 * Ona görə bu asılılıq DATA kimi burada saxlanılır və UI komponentləri (filtr
 * paneli + elan forması) eyni funksiyanı çağırır. Alternativ — `CategoryFilters`
 * və `ListingAttributes` içinə «əgər avtomobildirsə…» şərtləri yazmaq — RƏDD
 * EDİLDİ: eyni qayda iki yerdə təkrarlanardı və üçüncü istifadə yerində
 * (məs. AI elan sehrbazı) yenidən yazılmalı olardı.
 *
 * QAYDA: bu modul YALNIZ sxemdə olmayanı tamamlayır. Backend `options` verirsə
 * (indi `brand` üçün verir) sxem üstündür — burada saxlanılan siyahı yalnız
 * fallback-dır, yəni seed geridə qalsa da filtr boş qalmır.
 */

/** Marka adı → model siyahısı (tək dəfə qurulur, hər render-də yox). */
const CAR_MODELS_BY_BRAND = new Map(CAR_BRANDS.map((b) => [b.name, b.models]));

const CAR_BRAND_NAMES = CAR_BRANDS.map((b) => b.name);

/**
 * `brand` açarı MİNİK AVTOMOBİLİ markası deməkdir — yalnız bu kateqoriyalarda.
 * Telefon/televizor kateqoriyalarında da `brand` var, amma orada siyahı tamam
 * başqadır (və sxemdə onsuz da doludur), ona görə slug ilə məhdudlaşdırılır:
 * yanlış kateqoriyaya 63 avtomobil markası düşməsi filtri gülünc edərdi.
 * `yuk-avtobus` (yük maşınları) QƏSDƏN yoxdur — onun öz marka siyahısı var.
 */
const CAR_CATEGORY_SLUGS = new Set(['avtomobiller', 'ehtiyat-hisseleri']);

/**
 * Atributun seçim siyahısının həlli:
 *  - `ready`        → istifadəyə hazır siyahı,
 *  - `needs-parent` → əvvəlcə valideyn atribut seçilməlidir (model üçün marka).
 * `null` = bu modulun bu atribut haqqında məlumatı yoxdur → sxem/mövcud davranış.
 */
export type AttrOptionResolution =
  | { status: 'ready'; options: string[] }
  | { status: 'needs-parent'; parentKey: string; parentLabelAz: string };

/**
 * Verilmiş atribut üçün klient tərəfli seçim siyahısını qaytarır.
 *
 * @param categorySlug aktiv kateqoriya (boş ola bilər)
 * @param attr         sxem sətrinin lazım olan hissəsi
 * @param getValue     digər atributun CARİ dəyərini oxuyan funksiya
 *                     (filtr paneli URL-dən, forma isə state-dən oxuyur)
 */
export function resolveAttributeOptions(
  categorySlug: string,
  attr: { key: string; options?: string[] | null },
  getValue: (key: string) => string,
): AttrOptionResolution | null {
  const schemaOptions = attr.options ?? [];

  if (attr.key === 'model') {
    // Model HƏMİŞƏ markadan asılıdır — sxemdə options olsa belə (hazırda yoxdur)
    // markaya görə süzülmüş siyahı daha dəqiqdir.
    const brand = getValue('brand').trim();
    if (!brand) {
      // Marka seçilməyib: yalnız avtomobil kateqoriyalarında «əvvəlcə marka seç»
      // deyirik, digər kateqoriyada `model` sərbəst mətn kimi qalır.
      if (!CAR_CATEGORY_SLUGS.has(categorySlug)) return null;
      return { status: 'needs-parent', parentKey: 'brand', parentLabelAz: 'Marka' };
    }
    const models = CAR_MODELS_BY_BRAND.get(brand);
    // Tanınmayan marka (məs. sxemə yeni əlavə olunmuş) → sərbəst davranış qalır,
    // istifadəçi boş siyahı ilə qıfılda qalmır.
    if (!models?.length) return null;
    return { status: 'ready', options: models };
  }

  if (attr.key === 'brand' && schemaOptions.length === 0) {
    if (!CAR_CATEGORY_SLUGS.has(categorySlug)) return null;
    return { status: 'ready', options: CAR_BRAND_NAMES };
  }

  return null;
}

/**
 * `key` dəyişəndə dəyəri ETİBARSIZ olan atributlar.
 * Marka dəyişəndə köhnə model («BMW» → «Corolla») saxlanmamalıdır; həm formada,
 * həm URL-də təmizlənir.
 */
export function dependentAttributeKeys(key: string): string[] {
  return key === 'brand' ? ['model'] : [];
}
