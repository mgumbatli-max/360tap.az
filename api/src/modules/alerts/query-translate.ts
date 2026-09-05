import type { QueryListingsDto } from '../listings/dto/query-listings.dto';

/**
 * SAXLANMIŞ AXTARIŞ → ELAN SORĞUSU DTO-su.
 *
 * NİYƏ AYRICA ÇEVRİLMƏ LAZIMDIR: `SavedSearch.query` sütunu frontend-in URL lüğətini
 * olduğu kimi saxlayır (`SaveSearchButton.tsx:25` — `a_<açar>=<dəyər>` formatında
 * atribut filtrləri, dəyərlər həmişə MƏTN). Backend isə atributları `attrs` adlı TƏK
 * JSON sətrində gözləyir (`query-listings.dto.ts:21`) və qiyməti RƏQƏM kimi.
 *
 * Çevrilmə olmasa uyğunlaşdırıcı atribut filtrlərini səssizcə itirər: «BMW»
 * axtarışına abunə olan istifadəçi BÜTÜN avtomobillər üçün bildiriş alardı — yəni
 * funksiya işləyirmiş kimi görünüb yanlış nəticə verərdi. Ona görə bu, ayrıca
 * funksiyadır və ayrıca testlə (`query-translate.spec.ts`) qorunur.
 *
 * NİYƏ AĞ SİYAHI (icazəli açarlar): `query` bir JSON sütunudur — ora istənilən şey
 * düşə bilər (köhnə frontend versiyaları, əl ilə redaktə). Tanımadığımız açarı
 * ötürsək backend `ValidationPipe` 422 verər və cron hər dövrədə sınardı.
 */

/** Backend axtarış DTO-sunun qəbul etdiyi sadə (mətn) açarlar. */
const TEXT_KEYS = ['q', 'region', 'district', 'category', 'vertical'] as const;

/** Rəqəmə çevrilməli açarlar. */
const NUMBER_KEYS = ['priceMin', 'priceMax'] as const;

/** Atribut filtri prefiksi (frontend URL formatı). */
const ATTR_PREFIX = 'a_';

/**
 * QƏSDƏN ÖTÜRÜLMƏYƏNLƏR:
 *  · `condition` — frontend saxlayır, LAKİN axtarış DTO-sunda belə sahə yoxdur
 *    (yalnız elan yaratma/yeniləmədə var). Ötürülsə 422 olardı.
 *  · `page`, `limit`, `sort`, `view` — görünüş parametrləridir; uyğunlaşdırıcı
 *    onları özü təyin edir (ən yenilər, məhdud say).
 * Bu siyahı sənədləşdirmə üçündür — kod ağ siyahı ilə işlədiyi üçün onsuz da atılırlar.
 */

function asText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed.length) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function savedQueryToDto(query: Record<string, unknown> | null | undefined): QueryListingsDto {
  const dto: QueryListingsDto = {};
  if (!query || typeof query !== 'object' || Array.isArray(query)) return dto;

  for (const key of TEXT_KEYS) {
    const value = asText(query[key]);
    if (value !== undefined) (dto as Record<string, unknown>)[key] = value;
  }

  for (const key of NUMBER_KEYS) {
    const value = asNumber(query[key]);
    if (value !== undefined) (dto as Record<string, unknown>)[key] = value;
  }

  const attrs: Record<string, string> = {};
  for (const [key, raw] of Object.entries(query)) {
    if (!key.startsWith(ATTR_PREFIX)) continue;
    const name = key.slice(ATTR_PREFIX.length);
    const value = asText(raw);
    if (name.length && value !== undefined) attrs[name] = value;
  }
  // Boş `attrs` göndərmirik: `JSON.parse('{}')` backend-də boş şərt siyahısı yaradır,
  // yəni zərərsizdir, amma sorğunu oxuyanı çaşdırır.
  if (Object.keys(attrs).length) dto.attrs = JSON.stringify(attrs);

  return dto;
}
