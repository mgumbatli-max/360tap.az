// Meilisearch Cloud — birbaşa axtarış (search key read-only, public-safe).
// SSR-də server tərəfdən çağırılır. Typo-dözüm + sinonim Meili-də konfiqurasiya olunub.
const MEILI_HOST =
  process.env.NEXT_PUBLIC_MEILI_HOST || 'https://ms-71ea7f55541b-49783.jpn.meilisearch.io';
const MEILI_SEARCH_KEY =
  process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY ||
  '871c940a38f9a9c142a49b923323c1da324ca76dd2f2f023b05067203246f627';

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
  if (timeoutMs <= 0) return [];
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
