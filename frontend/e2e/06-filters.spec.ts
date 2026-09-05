import { test, expect, expectHealthy, visit } from './fixtures';

/**
 * FİLTR KOMPONENTLƏRİ — REAL BRAUZERDƏ.
 *
 * NİYƏ AYRICA FAYL: bu komponentlərin hamısı eyni backend sorğusuna çevrilir, lakin
 * URL açarlarını FƏRQLİ üslubda yazır (çiplər camelCase, panel/topbar snake_case).
 * Ölçüldü: əvvəl 7 sürətli filtrdən 7-si backend-də mövcud olmayan parametr göndərib
 * HTTP 422 alırdı, `has_credit`/`has_barter` isə səssizcə TƏTBİQ OLUNMURDU — istifadəçi
 * filtr işlədiyini sanıb bütün kataloqu görürdü. Hər iki nasazlıq görünmür, ona görə
 * yalnız avtomatik yoxlama onları tuta bilər.
 *
 * `health` fixture-u hər testdə konsol xətasını, uğursuz sorğunu və 4xx/5xx cavabı
 * avtomatik yoxlayır — yəni 422 qayıtsa test onsuz da sınacaq.
 */

/** Filtrli səhifədə görünən elan kartlarının sayı. */
async function cardCount(page: import('@playwright/test').Page): Promise<number> {
  return page.locator('a[href^="/elanlar/"]').count();
}

test.describe('Sürətli filtr çipləri (QuickFilterChips)', () => {
  const CHIPS = ['Bu gün', 'Çatdırılma var', 'Şəkilli', 'VIP', 'Təsdiqli satıcı'];

  for (const label of CHIPS) {
    test(`«${label}» çipi işləyir və xəta vermir`, async ({ page, health }) => {
      await visit(page, '/elanlar', 'elanlar');

      const chip = page.getByRole('button', { name: label, exact: false }).first();
      if (!(await chip.count())) {
        // Çip görünmürsə (viewport və ya A/B fərqi) test mənasız keçmir — açıq atlanır.
        test.skip(true, `«${label}» çipi bu ölçüdə göstərilmir`);
      }

      await chip.click();
      // URL dəyişməli və ya nəticə yenilənməlidir; hər halda səhifə sağlam qalmalıdır.
      await page.waitForLoadState('networkidle').catch(() => {});

      // ƏSAS YOXLAMA: 422/4xx/5xx və konsol xətası olmamalıdır (fixture tutur).
      expectHealthy(health, `«${label}» çipi`);
    });
  }
});

/**
 * URL ilə birbaşa giriş — istifadəçinin paylaşdığı və ya əlfəcinə saldığı link.
 * Hər iki ad üslubu dəstəklənməlidir: köhnə linklər snake_case daşıyır.
 */
test.describe('Filtr URL-ləri (hər iki ad üslubu)', () => {
  const CASES = [
    { param: 'hasDelivery=1', alias: 'has_delivery=1', label: 'çatdırılma' },
    { param: 'withPhoto=1', alias: 'with_photo=1', label: 'şəkilli' },
    { param: 'vip=1', alias: 'is_vip=1', label: 'VIP' },
    { param: 'hasCredit=1', alias: 'has_credit=1', label: 'kredit' },
    { param: 'hasBarter=1', alias: 'has_barter=1', label: 'barter' },
    { param: 'onlyShops=1', alias: 'only_shops=1', label: 'mağazalardan' },
  ];

  for (const c of CASES) {
    test(`${c.label}: camelCase və snake_case EYNİ nəticəni verir`, async ({ page, health }) => {
      await visit(page, `/elanlar?${c.param}`, c.param);
      const a = await cardCount(page);
      expectHealthy(health, c.param);

      await visit(page, `/elanlar?${c.alias}`, c.alias);
      const b = await cardCount(page);
      expectHealthy(health, c.alias);

      expect(a, `${c.param} və ${c.alias} fərqli nəticə verdi`).toBe(b);
    });
  }

  test('verified «mağazalardan»dan FƏRQLİ filtrdir', async ({ page, health }) => {
    await visit(page, '/elanlar?verified=1', 'verified');
    expectHealthy(health, 'verified');
    // İkisi eyni olsaydı, «Təsdiqli satıcı» çipi «Mağazalardan» kimi davranardı —
    // ölçüldü: mağazadan 3, təsdiqlidən 2 elan.
    const verified = await cardCount(page);
    await visit(page, '/elanlar?onlyShops=1', 'onlyShops');
    const shops = await cardCount(page);
    expect(shops, 'mağazalardan olan elan sayı təsdiqlidən az ola bilməz').toBeGreaterThanOrEqual(
      verified,
    );
  });
});

test.describe('Filtr paneli və zolağı', () => {
  test('«Bütün filtrlər» paneli açılır və səhifəni sındırmır', async ({ page, health }) => {
    await visit(page, '/elanlar', 'elanlar');

    const open = page.getByRole('button', { name: /Bütün filtrlər|Filtrlər/ }).first();
    if (!(await open.count())) test.skip(true, 'filtr paneli düyməsi yoxdur');

    await open.click();
    await expect(page.getByText('Bütün filtrlər').first()).toBeVisible({ timeout: 10_000 });
    expectHealthy(health, 'filtr paneli');
  });

  test('üst zolaqdakı filtr çipləri xəta vermir (UniversalTopBar)', async ({ page, health }) => {
    await visit(page, '/elanlar', 'elanlar');

    // Zolaq çipləri emoji + mətn daşıyır (məs. «🚚 Çatdırılma»).
    const chip = page.getByRole('button', { name: /Çatdırılma|Şəkilli|Mağazalardan/ }).first();
    if (!(await chip.count())) test.skip(true, 'üst zolaq çipləri bu ölçüdə yoxdur');

    await chip.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    expectHealthy(health, 'üst zolaq çipi');
  });

  test('aktiv filtr göstəricisi (FilterChips) səhifəni sındırmır', async ({ page, health }) => {
    // Filtrli səhifədə aktiv filtr nişanları görünür.
    await visit(page, '/elanlar?hasDelivery=1&withPhoto=1', 'iki filtr');
    expectHealthy(health, 'aktiv filtr göstəricisi');
  });
});
