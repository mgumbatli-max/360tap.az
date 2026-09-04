/**
 * Elan siyahısı skeleton-u.
 *
 * ƏVVƏL bu markup `app/elanlar/loading.tsx` idi. Route-səviyyəli `loading.tsx`
 * Next-in route seqmentinin ÜZƏRİNƏ Suspense sərhədi qoyur — yəni shell (və onunla
 * birlikdə HTTP status kodu + başlıqlar) data gəlməmişdən ƏVVƏL flush olunur.
 * Bu, /elanlar üçün zərərsiz idi, amma eyni sərhəd `/elanlar/[id]`-ə də miras qalırdı
 * və orada `notFound()` artıq HTTP 404 qaytara bilmirdi (soft-404: 200 + klient xətası).
 *
 * İNDİ: eyni skeleton `page.tsx` İÇİNDƏ `<Suspense fallback={...}>` ilə istifadə olunur.
 * Sərhəd yalnız bu səhifənin daxilindədir, alt route-lara miras qalmır — UX eynidir,
 * status kodu isə düzgündür.
 */
export default function ListingsSkeleton() {
  return (
    <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
        {/* başlıq */}
        <div className="h-8 w-56 bg-ink-200 dark:bg-ink-700 rounded-lg mb-3" />
        <div className="h-4 w-32 bg-ink-200 dark:bg-ink-700 rounded mb-5" />

        {/* region / sort çipləri */}
        <div className="flex flex-wrap gap-2 mb-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-ink-200 dark:bg-ink-700 rounded-full" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-7 w-24 bg-ink-200 dark:bg-ink-700 rounded-full" />
          ))}
        </div>

        {/* kart şəbəkəsi */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700">
              <div className="aspect-[4/3] bg-ink-200 dark:bg-ink-700" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-ink-200 dark:bg-ink-700 rounded" />
                <div className="h-5 w-1/2 bg-ink-200 dark:bg-ink-700 rounded" />
                <div className="h-3 w-2/3 bg-ink-200 dark:bg-ink-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
