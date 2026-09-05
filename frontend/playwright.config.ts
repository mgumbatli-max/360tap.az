import { defineConfig, devices } from '@playwright/test';

/**
 * E2E KONFİQURASİYASI — LOKAL VƏ PRODUCTION ÜÇÜN EYNİ TESTLƏR.
 *
 * NİYƏ BASE URL ENV-DƏN: eyni ssenarilər həm lokal build-ə (http://localhost:5401),
 * həm də canlı sayta (https://360tap.az) qarşı işləməlidir. Ayrı test dəsti saxlamaq
 * ikisinin bir-birindən sürüşməsinə gətirər.
 *
 * NİYƏ 3 PROYEKT: tələb desktop + planşet + mobil responsivliyidir. Hər viewport
 * ayrıca proyektdir ki, hesabatda hansı ölçüdə sındığı dərhal görünsün.
 *
 * NİYƏ workers=1 CANLIDA: production backend Render-in pulsuz planındadır; paralel
 * yük süni 5xx yaradar və test nəticəsini yalanlaşdırar.
 */
const BASE = process.env.E2E_BASE_URL || 'http://localhost:5401';
const IS_PROD = /360tap\.az/.test(BASE);

export default defineConfig({
  testDir: './e2e',
  // Elan yaratma axını çox addımlıdır (kateqoriya ağacı + şəkil + atributlar).
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: !IS_PROD,
  workers: IS_PROD ? 1 : 4,
  retries: IS_PROD ? 1 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'e2e-results/results.json' }],
    ['html', { outputFolder: 'e2e-results/html', open: 'never' }],
  ],
  use: {
    baseURL: BASE,
    // QEYD: throttle keçidi başlığı BURADA (`extraHTTPHeaders`) qoyulmur — o, başlığı
    // İSTİSNASIZ hər sorğuya, o cümlədən `fonts.gstatic.com`-a əlavə edir və şrift
    // yüklənməsini CORS preflight-da sındırır («Request header field
    // x-e2e-throttle-bypass is not allowed by Access-Control-Allow-Headers» — ölçüldü:
    // 121 yalançı konsol xətası). Başlıq yalnız öz origin-imizə, `fixtures.ts`-dəki
    // `page` fixture-unda route interception ilə əlavə olunur.
    // Uğursuz testin səbəbi hesabatda görünsün deyə iz və ekran görüntüsü saxlanılır.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    // Render soyuq start edərkən ilk sorğu uzun çəkir.
    ignoreHTTPSErrors: false,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 }, isMobile: false },
    },
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: false },
    },
  ],
});
