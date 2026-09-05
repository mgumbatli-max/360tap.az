import { test as base, expect, type Page, type ConsoleMessage } from '@playwright/test';

/**
 * E2E QOŞQUSU — SƏHİFƏ SƏVİYYƏSİNDƏ AVTOMATİK SAĞLAMLIQ YOXLAMASI.
 *
 * NİYƏ FIXTURE: tələb olunan yoxlamaların çoxu (konsol xətası, uğursuz sorğu,
 * hydration xətası, üfüqi daşma, sınıq şəkil) HƏR səhifədə eynidir. Onları hər
 * testdə təkrar yazmaq əvəzinə burada bir dəfə toplanır və test bitəndə
 * avtomatik yoxlanılır — beləliklə heç bir ssenari «yoxlamağı unutmur».
 *
 * NİYƏ SÜZGƏC VAR: brauzer bəzi xətaları bizim koddan asılı olmayaraq yazır
 * (uzantılar, üçüncü tərəf, favicon). Onları bloklamaq testi «həmişə qırmızı»
 * edərdi — ona görə yalnız MƏLUM zərərsiz nümunələr susdurulur, qalan hər şey
 * defekt sayılır.
 */

/** Bizim koda aid olmayan, susdurulması təhlükəsiz xətalar. */
const IGNORED_CONSOLE = [
  /favicon/i,
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  // Meili instansı qəsdən yoxdur — axtarış Postgres fallback ilə işləyir (A-1).
  /meilisearch/i,
];

const IGNORED_REQUESTS = [
  /favicon/i,
  /\/_next\/static\/.*\.map$/,
  // Backend oyaq saxlama ping-i (layout.tsx) — uğursuzluğu UX-ə təsir etmir.
  /\/api\/health$/,
  // Next.js App Router `<Link>` görünəndə RSC yükünü ÖNCƏDƏN çəkir (`?_rsc=`).
  // Səhifə dəyişəndə uçuşdakı prefetch-lər ləğv olunur → `net::ERR_ABORTED`.
  // Bu, dizaynın özüdür: prefetch spekulyativdir və ləğvi istifadəçiyə heç bir
  // şəkildə görünmür. Defekt kimi saymaq bütün naviqasiya testlərini yalançı
  // qırmızıya çevirər. QEYD: yalnız `_rsc` prefetch-i susdurulur — adi RSC
  // naviqasiya sorğusunun uğursuzluğu hələ də tutulur, çünki o ləğv olunmur.
  /[?&]_rsc=/,
];

export type PageHealth = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  badResponses: string[];
};

function attachHealth(page: Page): PageHealth {
  const health: PageHealth = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: [],
  };

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return;
    const text = msg.text();
    if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
    // Hydration uyğunsuzluğu React-də `error` kimi gəlir — ayrıca tutulur ki,
    // hesabatda görünsün.
    if (msg.type() === 'error') health.consoleErrors.push(text.slice(0, 300));
  });

  page.on('pageerror', (err) => {
    health.pageErrors.push(String(err.message).slice(0, 300));
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (IGNORED_REQUESTS.some((re) => re.test(url))) return;
    health.failedRequests.push(`${req.method()} ${url} — ${req.failure()?.errorText ?? '?'}`);
  });

  page.on('response', (res) => {
    const url = res.url();
    if (IGNORED_REQUESTS.some((re) => re.test(url))) return;
    // 4xx/5xx yalnız BİZİM origin-lər üçün defekt sayılır.
    if (res.status() >= 400 && /localhost:(5401|5500)|360tap\.az|tap360-api/.test(url)) {
      health.badResponses.push(`${res.status()} ${res.request().method()} ${url}`);
    }
  });

  return health;
}

/**
 * THROTTLE KEÇİDİ — YALNIZ ÖZ ORIGIN-İMİZƏ.
 *
 * NİYƏ LAZIMDIR: dəst tam paralel icrada `POST /auth/register`-ə 12 sorğu göndərir
 * (03-auth × 3 viewport + 04-account × 3 test × 3 viewport), backend limiti isə 5/60s-dir.
 * Bütün worker-lər eyni soketdən gəldiyi üçün tracker də eynidir (`ip:::1`) — yəni worker
 * sayını azaltmaq problemi gizlədir, həll etmir (ölçüldü: `--workers=1` ilə də 6-cı
 * qeydiyyat 429 alır, 7-ci də, sonra 60s TTL sıfırlanır və növbətilər keçir).
 *
 * NİYƏ `use.extraHTTPHeaders` DEYİL: o, başlığı İSTİSNASIZ hər sorğuya qoyur, o cümlədən
 * `fonts.gstatic.com`-a — və brauzer preflight-da onu rədd edir
 * («Request header field x-e2e-throttle-bypass is not allowed by
 * Access-Control-Allow-Headers»). Ölçüldü: 121 yalançı «konsol xətası» sınığı.
 * Ona görə başlıq YALNIZ test hədəfimizin origin-inə əlavə olunur.
 *
 * Backend bu başlığı yalnız `NODE_ENV !== 'production'` VƏ açar uyğun gələndə qəbul edir,
 * ona görə canlıya qarşı icrada (`E2E_BASE_URL=https://360tap.az`) təsiri yoxdur.
 */
const BYPASS_KEY = process.env.E2E_THROTTLE_BYPASS;
const TARGET_ORIGIN = new URL(process.env.E2E_BASE_URL || 'http://localhost:5401').origin;

export const test = base.extend<{ health: PageHealth }>({
  page: async ({ page }, use) => {
    if (BYPASS_KEY) {
      await page.route('**/*', async (route) => {
        const url = route.request().url();
        if (url.startsWith(TARGET_ORIGIN)) {
          await route.continue({
            headers: { ...route.request().headers(), 'x-e2e-throttle-bypass': BYPASS_KEY },
          });
          return;
        }
        await route.continue();
      });
    }
    await use(page);
  },
  health: async ({ page }, use) => {
    const health = attachHealth(page);
    await use(health);
  },
});

export { expect };

/**
 * ÜFÜQİ DAŞMA — mobil ekranda ən çox rast gəlinən düzüm defekti.
 * `documentElement.scrollWidth` viewport-dan geniş olarsa səhifə yana sürüşür.
 * 1px tolerantlıq: sub-piksel yuvarlaqlaşdırma yanlış siqnal verməsin.
 */
export async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(
    overflow.scroll - overflow.client,
    `${label}: üfüqi daşma (scrollWidth ${overflow.scroll} > clientWidth ${overflow.client})`,
  ).toBeLessThanOrEqual(1);
}

/** Yüklənməyən (broken) şəkillər — `naturalWidth === 0` yüklənmə uğursuzluğudur. */
export async function expectNoBrokenImages(page: Page, label: string): Promise<void> {
  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0 && !!img.currentSrc)
      .map((img) => img.currentSrc)
      .slice(0, 5),
  );
  expect(broken, `${label}: sınıq şəkil`).toEqual([]);
}

/** Testin sonunda toplanmış sağlamlıq siqnallarını yoxlayır. */
export function expectHealthy(health: PageHealth, label: string): void {
  expect(health.pageErrors, `${label}: JS istisnası`).toEqual([]);
  expect(health.consoleErrors, `${label}: konsol xətası`).toEqual([]);
  expect(health.failedRequests, `${label}: uğursuz şəbəkə sorğusu`).toEqual([]);
  expect(health.badResponses, `${label}: 4xx/5xx cavab`).toEqual([]);
}

/** Səhifəni aç + bütün baza yoxlamalarını bir addımda apar. */
export async function visit(page: Page, path: string, label = path): Promise<void> {
  const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(res?.status(), `${label}: HTTP status`).toBeLessThan(400);
  await page.waitForLoadState('networkidle').catch(() => {});
  await expectNoHorizontalOverflow(page, label);
  await expectNoBrokenImages(page, label);
}

/**
 * Hər icrada təkrarlanmayan test istifadəçisi.
 *
 * NİYƏ BURADA: iki spec (auth və hesab axınları) eyni köməkçiyə ehtiyac duyur,
 * lakin Playwright bir spec faylından digərini import etməyi qadağan edir —
 * ortaq kod fixture faylında yaşamalıdır.
 */
export function freshUser(): { name: string; email: string; password: string } {
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    name: `E2E Test ${id.slice(-6)}`,
    email: `e2e+${id}@360tap.test`,
    password: 'E2eTest!2026',
  };
}
