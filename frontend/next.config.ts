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
    // ŞƏKİL MƏNBƏYİ ALLOWLIST-İ — `lib/image-hosts.ts` ilə EYNİ SAXLANILMALIDIR
    // (konfiq faylı oradan import edə bilmir, ona görə siyahı iki yerdə təkrarlanır).
    //
    // `*.onrender.com` JOKERİ ÇIXARILDI. O, /_next/image-i Render-də hostlanan
    // İSTƏNİLƏN sayt üçün açıq proxy-ə çevirirdi: mövcud olmayan alt-domenlə sorğu
    // belə allowlist-dən keçib upstream-i 7 saniyə gözləyirdi (HTTP 504 + boş yerə
    // sərf olunan funksiya vaxtı). Konkret `tap360-api.onrender.com` qeydi onsuz da
    // aşağıdadır, yəni joker heç bir işlək ssenariyə xidmət etmirdi.
    //
    // `localhost:5400` qeydi də ÇIXARILDI — 5400 portundakı köhnə Express ləğv
    // olunub (aşağıdakı `rewrites()` şərhinə bax), yəni ölü konfiq idi.
    //
    // picsum.photos / images.unsplash.com QƏSDƏN SAXLANILDI. Onları production-da
    // bağlamaq təklif olunmuşdu, lakin ölçdüm: canlı bazadakı elan şəkillərinin
    // hamısı (50/50 media → picsum.photos/seed/…) məhz bu hostlardadır. Silinsəydi
    // canlıda BÜTÜN elan şəkilləri 400 verərdi. Doğru ardıcıllıq: əvvəlcə şəkilləri
    // öz storage-ımıza köçürmək, SONRA hostları çıxarmaq.
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '5500', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      // Backend-ə yüklənmiş şəkillər YALNIZ /uploads/ altında verilir
      // (api/src/main.ts:48 `prefix: '/uploads/'`), ona görə yol məhdudiyyəti
      // bu host-u da tam proxy olmaqdan çıxarır — localhost qeydləri ilə eyni üslub.
      { protocol: 'https', hostname: 'tap360-api.onrender.com', pathname: '/uploads/**' },
      // magazam.az kataloqunun şəkilləri (bax `lib/image-hosts.ts`). Yol yalnız
      // həmin hesabın buludu ilə məhdudlaşır — açıq Cloudinary proxy-si olmasın.
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/di8zz8sc1/**' },
    ],
    // Optimallaşdırılmış variantın keşi defolt 60 saniyə idi — eyni şəkil üçün
    // gün ərzində dəfələrlə yenidən transformasiya deməkdir (hər biri billable).
    // Şəkil URL-ləri dəyişməz olduğuna görə 1 gün təhlükəsizdir.
    minimumCacheTTL: 86_400,
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
