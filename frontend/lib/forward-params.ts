/**
 * YÖNLƏNDİRMƏDƏ SORĞU STRING-İNİN SAXLANMASI.
 *
 * PROBLEM: `/k/<slug>`, `/seher/<sehir>` və `/seher/<sehir>/<kateqoriya>` marşrutları
 * `/elanlar`-a `redirect()` edir, LAKİN yalnız öz seqmentlərini ötürürdü. Nəticədə
 * `/k/neqliyyat?priceMin=5000&sort=price_asc` → `/elanlar?category=neqliyyat` olurdu:
 * istifadəçinin (və ya paylaşılan linkin) daşıdığı BÜTÜN filtrlər səssizcə itirdi.
 * `next.config.ts`-dəki statik yönləndirmələr sorğu string-ini avtomatik saxlayır —
 * bu dinamik marşrutlar isə saxlamırdı, yəni davranış ziddiyyətli idi.
 *
 * NİYƏ BAZA PARAMETRLƏRİ ÜSTÜNDÜR: `/seher/baki?region=gence` kimi ziddiyyətli linkdə
 * marşrutun öz seqmenti həqiqət mənbəyidir — əks halda URL-in yolu ilə məzmunu
 * bir-birinə uyğun gəlməzdi.
 */
export type IncomingParams = Record<string, string | string[] | undefined>;

export function buildRedirectUrl(
  base: Record<string, string>,
  incoming: IncomingParams | undefined,
): string {
  const p = new URLSearchParams();

  for (const [k, v] of Object.entries(incoming ?? {})) {
    if (v == null) continue;
    // Təkrarlanan açar (`?a=1&a=2`) massiv kimi gəlir — hamısı saxlanılır.
    for (const one of Array.isArray(v) ? v : [v]) {
      if (one !== '') p.append(k, one);
    }
  }

  // Marşrutun öz seqmentləri ƏN SONDA yazılır ki, gələn eyniadlı parametri üstələsin.
  for (const [k, v] of Object.entries(base)) p.set(k, v);

  return `/elanlar?${p.toString()}`;
}
