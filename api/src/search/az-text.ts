import type { Prisma } from '@prisma/client';

/**
 * Azərbaycan dilinə uyğun mətn normalizasiyası və Postgres (ILIKE) axtarış
 * şərtlərinin qurulması.
 *
 * NİYƏ AYRI FAYL: eyni məntiq həm `SearchService.fallbackSearch()`, həm də
 * `ListingsService.list()` keyword axtarışında lazımdır. Kopyalamaq əvəzinə
 * burada bir dəfə yazılır və ixrac olunur.
 *
 * HƏLL OLUNAN İKİ ÖLÇÜLMÜŞ DEFEKT:
 *  1) Diakritiksiz yazılış — istifadəçilərin böyük hissəsi «menzil», «seher»
 *     yazır, baza isə «mənzil», «şəhər» saxlayır → nəticə 0 idi.
 *  2) Böyük hərflə yazılış — `'MƏNZİL'.toLowerCase()` = `'mənzi̇l'`
 *     (i + U+0307 birləşən nöqtə), `'MAŞINLARI'.toLowerCase()` = `'maşinlari'`
 *     (I → i, halbuki AZ-də I → ı) → yenə 0 idi.
 *
 * NİYƏ `toLocaleLowerCase('az')` DEYİL: TRANSLIT/REGION_TOKENS lüğətlərinin
 * açarları ASCII latındır ('mashin', 'menzil', 'baki'). AZ locale ilə 'MASHIN'
 * → 'mashın' olur və hazırda İŞLƏYƏN latın-yazılış axtarışı sınır. Ona görə
 * normalizasiya ASCII-təhlükəsiz saxlanılır, I/ı və digər cütlər isə
 * normalizasiyada yox, YALNIZ ILIKE budaqlarında əlavə variant kimi verilir.
 */

/** Birləşən yuxarı nöqtə (U+0307) — 'İ'.toLowerCase() nəticəsində yaranır. */
const COMBINING_DOT_ABOVE = /̇/g;

/** AZ hərf → ASCII qarşılığı (yalnız qatlama üçün). */
const FOLD: Record<string, string> = {
  ə: 'e', ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
};

/**
 * ASCII hərf → həmin mövqedə mümkün olan bütün yazılışlar.
 * Hər siyahı ASCII formanın özünü də saxlayır — bu sayədə istifadəçinin
 * yazdığı orijinal söz HƏMİŞƏ variantlar arasında qalır (reqressiya olmaz).
 */
const EXPAND: Record<string, readonly string[]> = {
  c: ['c', 'ç'], e: ['e', 'ə'], g: ['g', 'ğ'], i: ['i', 'ı'],
  o: ['o', 'ö'], s: ['s', 'ş'], u: ['u', 'ü'],
};

/**
 * Bir sözdə açılan (variant verilən) mövqelərin maksimum sayı.
 * 4 mövqe → ≤16 variant. NİYƏ məhdudiyyət: hər variant ayrıca ILIKE budağıdır,
 * `attributes` və mətn sahələri üzrə indeks olmadığı üçün budaq sayı birbaşa
 * seq-scan qiymətinə çevrilir. 4 mövqe real AZ sözlərini örtür
 * («menzil»=2, «seher»=3, «gence»=4, «komputer»=3), amma partlayışa yol vermir.
 */
const MAX_EXPANDED_POSITIONS = 4;

/**
 * Sorğunun normalizasiyası: kiçik hərf + NFC + birləşən nöqtənin silinməsi.
 * Diakritikaya TOXUNMUR — 'ə', 'ş' olduğu kimi qalır (region/translit
 * lüğətləri məhz bu formaları gözləyir).
 */
export function normalizeAzQuery(q: string): string {
  return q.normalize('NFC').toLowerCase().replace(COMBINING_DOT_ABOVE, '').trim();
}

/** AZ diakritikasını ASCII-yə qatlayır: «şəhər» → «seher». */
export function foldAz(s: string): string {
  let out = '';
  for (const ch of normalizeAzQuery(s)) out += FOLD[ch] ?? ch;
  return out;
}

/**
 * LIKE/ILIKE meta-simvollarını neytrallaşdırır.
 * Prisma-nın `contains` filtri Postgres-də ILIKE-a çevrilir və dəyəri escape
 * ETMİR — ölçüldü: `q=ip%ne` və `q=ipho_e` hazırda «iPhone» tapır, yəni
 * istifadəçinin `%`/`_` simvolları naxış kimi işləyir. Postgres-in default
 * escape simvolu `\` olduğu üçün ayrıca ESCAPE bəndi lazım deyil.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * Sözün mümkün AZ/ASCII yazılış variantları.
 *
 * Alqoritm: söz ASCII-yə qatlanır, hər qatlanan mövqe üçün {ascii, az} cütü
 * götürülür və dekart hasili qurulur. Büdcədən kənarda qalan mövqelərdə
 * İSTİFADƏÇİNİN yazdığı simvol saxlanılır — buna görə orijinal söz nəticə
 * dəstində həmişə var, yəni bu dəyişiklik yalnız nəticə ƏLAVƏ edir, silmir.
 */
export function azTextVariants(word: string): string[] {
  const chars = [...normalizeAzQuery(word)];
  let budget = MAX_EXPANDED_POSITIONS;
  const slots: readonly string[][] = chars.map((ch) => {
    const base = FOLD[ch] ?? ch;
    const options = EXPAND[base];
    if (!options || budget === 0) return [ch];
    budget -= 1;
    return [...options];
  });

  let variants: string[] = [''];
  for (const slot of slots) {
    if (slot.length === 1) {
      variants = variants.map((v) => v + slot[0]);
      continue;
    }
    const next: string[] = [];
    for (const v of variants) for (const c of slot) next.push(v + c);
    variants = next;
  }
  // Orijinal forma başda dursun — plan/oxunuş üçün daha aydındır.
  const original = chars.join('');
  return [original, ...variants.filter((v) => v !== original)];
}

/** Brend/model üçün registr variantları: «apple» → apple / Apple / APPLE. */
function caseVariants(word: string): string[] {
  const lower = word.toLowerCase();
  const title = lower.charAt(0).toUpperCase() + lower.slice(1);
  return [...new Set([lower, title, lower.toUpperCase()])];
}

/**
 * Bir söz üçün OR budaqları: başlıq, təsvir, kateqoriya adı + atribut
 * brend/model.
 *
 * NİYƏ brend/model ayrı: Prisma-nın JSON `string_contains` filtri
 * `mode: 'insensitive'` DƏSTƏKLƏMİR, ona görə orada diakritik variantlar
 * əvəzinə registr variantları verilir (brendlər praktikada ASCII latındır:
 * Apple, Samsung, BMW). Metasimvollu sözlərdə JSON budaqları buraxılır —
 * `string_contains` üçün escape davranışı zəmanətli deyil.
 */
export function azKeywordOr(word: string): Prisma.ListingWhereInput[] {
  const branches: Prisma.ListingWhereInput[] = [];
  const variants = azTextVariants(word);
  for (const variant of variants) {
    const needle = escapeLike(variant);
    branches.push(
      { title: { contains: needle, mode: 'insensitive' } },
      { description: { contains: needle, mode: 'insensitive' } },
    );
  }
  /**
   * KATEQORİYA ADI — TƏK ƏLAQƏ BUDAĞI, hər variant üçün ayrıca DEYİL.
   *
   * Əvvəl hər diakritik variant öz `{ category: { nameAz: ... } }` budağını
   * yaradırdı. «telefon» sözü 8 variant verir, yəni Prisma 8 ayrı korrelyasiyalı
   * `EXISTS (SELECT ... FROM categories ...)` alt-sorğusu qururdu. Ölçüldü
   * (2306 elanlı baza): yalnız bu 8 budaq `findMany` üçün **629 ms** tuturdu,
   * bütün sorğu isə ~1.9 saniyə çəkirdi (`q`-siz siyahı 0.05 s).
   *
   * Variantları alt-sorğunun İÇİNƏ salmaq eyni nəticəni verir (məntiq eynidir:
   * «kateqoriya adı variantlardan hər hansı birini ehtiva edir»), amma cəmi bir
   * alt-sorğu qurur.
   */
  branches.push({
    category: {
      OR: variants.map((v) => ({ nameAz: { contains: escapeLike(v), mode: 'insensitive' as const } })),
    },
  });
  if (!/[\\%_]/.test(word)) {
    for (const variant of caseVariants(word)) {
      branches.push(
        { attributes: { path: ['brand'], string_contains: variant } },
        { attributes: { path: ['model'], string_contains: variant } },
      );
    }
  }
  return branches;
}

/** Sorğunu axtarış sözlərinə bölür (normalizasiya + uzunluq/say limiti). */
export function azSearchWords(query: string, minLength = 2, maxWords = 5): string[] {
  return normalizeAzQuery(query)
    .split(/\s+/)
    .filter((w) => w.length >= minLength)
    .slice(0, maxWords);
}

/**
 * «Bütün sözlər uyğun gəlməlidir» semantikası — `where.AND` üçün.
 * (SearchService.fallbackSearch bu formanı istifadə edir.)
 */
export function azKeywordAnd(query: string): Prisma.ListingWhereInput[] {
  return azSearchWords(query).map((w) => ({ OR: azKeywordOr(w) }));
}
