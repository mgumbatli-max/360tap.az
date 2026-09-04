// Meilisearch Cloud — birbaşa axtarış (search key read-only, public-safe).
// SSR-də server tərəfdən çağırılır. Typo-dözüm + sinonim Meili-də konfiqurasiya olunub.
//
// HOST/KEY ARTIQ KODA YAZILMIR — hər ikisi ENV-dən gəlir, yoxdursa Meili SÖNÜLÜDÜR.
// Səbəb: kodda sabit yazılmış instans (ms-71ea7f55541b-49783.jpn.meilisearch.io) ÖLÜDÜR,
// lakin `meiliSearch()` hər axtarışda ona sorğu atıb timeout-a düşürdü — `/elanlar?q=`
// 1.29 s çəkirdi (digər route-lar 0.03-0.05 s). İndi konfiqurasiya olunmayanda sorğu
// ÜMUMİYYƏTLƏ göndərilmir və zəncir birbaşa backend `/search`-a keçir (o, həm
// transliterasiya, həm Postgres fallback verir). Bonus: axtarış açarı repo-dan çıxdı.
//
// Meili bərpa olunanda kifayətdir: Vercel-də NEXT_PUBLIC_MEILI_HOST + _SEARCH_KEY təyin et.
const MEILI_HOST = process.env.NEXT_PUBLIC_MEILI_HOST ?? '';
const MEILI_SEARCH_KEY = process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY ?? '';
const MEILI_ENABLED = MEILI_HOST !== '' && MEILI_SEARCH_KEY !== '';

export type MeiliHit = {
  id: string;
  title: string;
  price: number | null;
  currency?: string;
  priceType?: string;
  categoryName?: string | null;
  regionName?: string | null;
  brand?: string | null;
  cover?: string | null;
  isVip?: boolean;
  createdAt?: string;
};

/**
 * Faza 0: timeout parametrləşdirildi. Axtarış zənciri (Meili → AI → keyword)
 * ardıcıl işlədiyi üçün hər mərhələnin sabit timeout-u cəmlənib səhifəni
 * 15-20 saniyə gözlədə bilirdi; indi çağıran tərəf ümumi büdcədən pay ayırır.
 * timeoutMs <= 0 olduqda sorğu ümumiyyətlə göndərilmir.
 */
export async function meiliSearch(q: string, limit = 24, timeoutMs = 4000): Promise<MeiliHit[]> {
  if (!MEILI_ENABLED || timeoutMs <= 0) return [];
  try {
    const r = await fetch(`${MEILI_HOST}/indexes/listings/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MEILI_SEARCH_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q, limit }),
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) return [];
    const d = (await r.json()) as { hits?: MeiliHit[] };
    return d.hits ?? [];
  } catch {
    return [];
  }
}
