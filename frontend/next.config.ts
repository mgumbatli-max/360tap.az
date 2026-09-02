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
  // Qeyd: əvvəl /elanlar?category=dasinmaz-emlak → /emlak → /elanlar dairəvi redirect var idi
  // (lazımsız hop + döngə riski). /elanlar artıq kateqoriyanı birbaşa render edir (filtr + sonsuz scroll),
  // ona görə redirect-lər çıxarıldı. /emlak,/neqliyyat tək-yönlü /elanlar-a yönləndirir (öz page.tsx-lərində).
};

export default config;
