import { redirect } from 'next/navigation';

/**
 * SEO — DİNAMİK YÖNLƏNDİRMƏ, ÜZƏRİNDƏ SUSPENSE SƏRHƏDİ OLMAMALIDIR.
 *
 * `/emlak`, `/neqliyyat`, `/register` `next.config.ts` → `redirects()` bölməsinə köçdü
 * (statik pattern, 308). Bu route isə DİNAMİKDİR — `[category]` seqmenti sərbəst dəyər
 * alır və hədəf URL-ə `encodeURIComponent` ilə yazılır, yəni next.config-in statik
 * source/destination pattern-ləri ilə düzgün ifadə oluna bilməz (`:category` yalnız
 * xam ötürmə edərdi, kodlaşdırma olmadan).
 *
 * Ona görə burada `redirect()` saxlanılır. Əvvəlki 200 + meta-refresh problemi bu
 * çağırışdan deyil, route-un üzərindəki `app/loading.tsx` Suspense sərhədindən gəlirdi:
 * shell data (params) gəlməmişdən flush olunurdu və Next artıq `Location` başlığı
 * göndərə bilmirdi. Həmin `loading.tsx` silindi → indi real HTTP 307 + `Location`.
 *
 * DİQQƏT: bu route-un üzərinə (app/ və ya app/k/ səviyyəsinə) `loading.tsx` əlavə etmək
 * defekti geri gətirər.
 */
export default async function CategoryLandingPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  redirect(`/elanlar?category=${encodeURIComponent(category)}`);
}
