import type { NextConfig } from 'next';

const config: NextConfig = {
  // Faza 0: build gate BƏRPA OLUNDU.
  //  · `typescript.ignoreBuildErrors` çıxarıldı — real tip borcu iddia edildiyi kimi
  //    "~140 komponent" deyil, cəmi 11 xəta idi (hamısı TransportFullFilter.tsx-də,
  //    səbəb köməkçi komponentlərin `any` proplarıydı). Düzəldildi → tsc təmizdir.
  //  · `eslint.ignoreDuringBuilds` çıxarıldı — layihədə ESLint ümumiyyətlə
  //    quraşdırılmamışdı, yəni bu bayraq mövcud olmayan yoxlamanı söndürürdü.
  //    İndi `eslint.config.mjs` (next/core-web-vitals) var və build-də işləyir.
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '5400', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '5500', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'tap360-api.onrender.com' }, // backend yüklənmiş şəkillər
      { protocol: 'https', hostname: '*.onrender.com' },
    ],
  },
  async rewrites() {
    // Faza 0 — DEV ↔ PROD PARİTETİ.
    //
    // ƏVVƏL: dev-də yalnız /api/health, /api/geo/*, /api/media/* NestJS-ə (5500),
    // QALAN HƏR ŞEY isə köhnə Express-ə (5400) gedirdi. Production-da isə bütün
    // /api/* NestJS-ə gedir. Nəticə: 30-dan çox endpoint lokalda "işləyirmiş kimi"
    // görünürdü, canlıda isə 404 verirdi (məs. /api/ai/*, /api/realestate/*,
    // /api/voice/*, /api/import/*, /api/cities, /api/auth/send-otp, /api/insights/*).
    // Bu, sınıq funksiyaların aylarla fərq edilməməsinin əsas səbəbi idi.
    //
    // İNDİ: dev və prod EYNİ hədəfə (NestJS) yönləndirir. Express-də qalan, NestJS-ə
    // köçürülməmiş endpoint-lər artıq lokalda da 404 verir — bu, REALLIQDIR və
    // problemin gizlənməsindən yaxşıdır. `backend/` qovluğu SİLİNMİR (Faza 1).
    const API = process.env.API_ORIGIN ?? 'http://localhost:5500';
    return [
      { source: '/api/health', destination: `${API}/health` },
      { source: '/api/health/ready', destination: `${API}/health/ready` },
      { source: '/api/:path*', destination: `${API}/api/v1/:path*` },
    ];
  },
  async redirects() {
    // SEO — SIRF-YÖNLƏNDİRMƏ ROUTE-LARI PLATFORMA SƏVİYYƏSİNDƏ.
    //
    // ƏVVƏL: /emlak, /neqliyyat, /register hər biri `redirect()` çağıran page.tsx idi.
    // Bu route-lar statik prerender olunduğu üçün Next onları HTML faylı kimi yazırdı və
    // cavab HTTP 200 + `<meta http-equiv="refresh" content="1;url=...">` olurdu.
    // Nəticə: axtarış motorları üçün bu, yönləndirmə DEYİL — 200-lük dublikat səhifədir
    // (link equity ötürülmür, indeksdə boş səhifə qalır, istifadəçi 1 saniyə gözləyir).
    //
    // İNDİ: yönləndirmə routing mərhələsində baş verir → HTTP 308 + `Location` başlığı,
    // heç bir React render-i olmadan. `permanent: true` = 308 (307 deyil), yəni
    // "bu ünvan həmişəlik köçüb" siqnalı. Sorğu string-i avtomatik ötürülür
    // (məs. /neqliyyat?brand=BMW → /elanlar?category=neqliyyat&brand=BMW).
    //
    // Qeyd: /emlak və /neqliyyat-ın SEO metadata-sı itmir — hədəf kateqoriyalar üçün
    // `app/elanlar/page.tsx`-dəki `generateMetadata` onu bərpa edir (VERTICAL_SEO).
    //
    // Qeyd: /k/[category] və /seher/* DİNAMİKDİR (statik pattern-ə sığmır), ona görə
    // onlar `redirect()` ilə qalır; onların 200-lük meta-refresh problemi isə
    // route-un üzərindəki `loading.tsx` Suspense sərhədinin götürülməsi ilə həll olunub
    // (shell flush olunmadığı üçün Next artıq real 307 + Location qaytara bilir).
    return [
      { source: '/emlak', destination: '/elanlar?category=dasinmaz-emlak', permanent: true },
      { source: '/neqliyyat', destination: '/elanlar?category=neqliyyat', permanent: true },
      { source: '/register', destination: '/qeydiyyat', permanent: true },
    ];
  },
};

export default config;
