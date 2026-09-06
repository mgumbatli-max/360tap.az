import { test, expect, expectHealthy, visit } from './fixtures';

/**
 * FİLTR AXINI — REAL BRAUZERDƏ.
 *
 * NİYƏ AYRICA FAYL: filtrlər backend-də mövcud olmayan parametrlər göndərəndə
 * iki cür sınırdı və hər ikisi GÖRÜNMÜRDÜ:
 *   · HTTP 422 → səhifə «elan tapılmadı» göstərirdi (ölçüldü: 7 sürətli filtrdən 7-si);
 *   · parametr ötürülmürdü → filtr SƏSSİZCƏ tətbiq olunmurdu və istifadəçi bütün
 *     kataloqu görüb filtrin işlədiyini sanırdı (ölçüldü: has_credit=1 → 50 elan).
 * İkincisi daha təhlükəlidir, çünki heç bir xəta əlaməti vermir.
 *
 * `health` fixture-u hər testdə konsol xətasını, uğursuz sorğunu və 4xx/5xx cavabı
 * avtomatik tutur — yəni 422 qayıtsa test onsuz da sınır.
 *
 * ƏHATƏ QEYDİ: `QuickFilterChips` əvvəllər yalnız `app/elanlar/ListingsClient.tsx`-dən
 * çağırılırdı, HƏMİN FAYL İSƏ HEÇ YERDƏN import olunmurdu (ölü kod) — yəni çiplər
 * istifadəçiyə görünmürdü. Fayl silindi, çiplər `/elanlar` səhifəsinə birbaşa qoşuldu;
 * aşağıdakı «Sürətli filtr çipləri» dəsti onların GÖRÜNDÜYÜNÜ də qoruyur.
 * `UniversalTopBar`/`UniversalFullFilter` isə `/k/<kateqoriya>` və `/seher/*`
 * səhifələrində işlədilir — onlar ölü kod deyil.
 */

/** Filtrli səhifədə görünən elan kartlarının sayı. */
async function cardCount(page: import('@playwright/test').Page): Promise<number> {
  return page.locator('a[href^="/elanlar/"]').count();
}

/**
 * HƏR İKİ AD ÜSLUBU EYNİ NƏTİCƏNİ VERMƏLİDİR.
 *
 * URL-ə yazan komponentlər tarixən iki üslub işlədib (çiplər camelCase, panel və
 * saxlanmış linklər snake_case). Səhifə qatı hər ikisini backend-in bildiyi tək ada
 * çevirir; bu testlər həmin çevrilmənin sınmadığını qoruyur.
 */
test.describe('Filtr URL-ləri', () => {
  const CASES = [
    { param: 'hasDelivery=1', alias: 'has_delivery=1', label: 'çatdırılma' },
    { param: 'withPhoto=1', alias: 'with_photo=1', label: 'şəkilli' },
    { param: 'vip=1', alias: 'is_vip=1', label: 'VIP' },
    { param: 'hasCredit=1', alias: 'has_credit=1', label: 'kredit' },
    { param: 'hasBarter=1', alias: 'has_barter=1', label: 'barter' },
    { param: 'onlyShops=1', alias: 'only_shops=1', label: 'mağazalardan' },
  ];

  for (const c of CASES) {
    test(`${c.label}: camelCase və snake_case eyni nəticə verir, xəta yoxdur`, async ({
      page,
      health,
    }) => {
      await visit(page, `/elanlar?${c.param}`, c.param);
      const a = await cardCount(page);
      expectHealthy(health, c.param);

      await visit(page, `/elanlar?${c.alias}`, c.alias);
      const b = await cardCount(page);
      expectHealthy(health, c.alias);

      expect(a, `${c.param} və ${c.alias} fərqli nəticə verdi`).toBe(b);
    });
  }

  test('filtr NƏTİCƏNİ DARALDIR — səssizcə nəzərə alınmamazlıq olmamalıdır', async ({
    page,
    health,
  }) => {
    await visit(page, '/elanlar', 'filtrsiz');
    const all = await cardCount(page);

    // `vip=1` üçün lokal və canlı bazada elan sayı filtrsizdən AZDIR. Bərabər olsa,
    // parametr ötürülmür deməkdir — məhz bu, `has_credit` nasazlığının əlaməti idi.
    await visit(page, '/elanlar?vip=1', 'vip filtri');
    const vip = await cardCount(page);
    expectHealthy(health, 'vip filtri');

    expect(vip, 'VIP filtri nəticəni daraltmadı — parametr ötürülmür ola bilər').toBeLessThan(all);
  });

  test('«mağazalardan» və «təsdiqli satıcı» FƏRQLİ filtrlərdir', async ({ page, health }) => {
    await visit(page, '/elanlar?onlyShops=1', 'onlyShops');
    const shops = await cardCount(page);
    expectHealthy(health, 'onlyShops');

    await visit(page, '/elanlar?verified=1', 'verified');
    const verified = await cardCount(page);
    expectHealthy(health, 'verified');

    // Təsdiqli mağazalar mağazaların ALT ÇOXLUĞUDUR, ona görə çox ola bilməz.
    expect(verified, 'təsdiqli mağaza sayı mağaza sayından çox ola bilməz').toBeLessThanOrEqual(
      shops,
    );
  });

  test('yararsız filtr dəyəri səhifəni sındırmır', async ({ page }) => {
    // Köhnə/əl ilə redaktə olunmuş linklər gözlənilməz dəyər daşıya bilər.
    const res = await page.goto('/elanlar?hasDelivery=xxx&vip=');
    expect(res?.status(), 'yararsız filtr 5xx verməməlidir').toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Canlı filtr paneli (CategoryFilters)', () => {
  test('«Bütün filtrlər» düyməsi mövcuddur və panel açılır', async ({ page, health }) => {
    await visit(page, '/elanlar', 'elanlar');

    const open = page.getByRole('button', { name: /Bütün filtrlər|Filtrlər/ }).first();
    await expect(open, 'filtr paneli düyməsi').toBeVisible({ timeout: 15_000 });
    await open.click();

    // Panel `id="butun-filtrler"` olan bloka açılır (başlıq elementi işlətmir).
    // Düymədəki mətn mobil ekranda `hidden sm:inline` ilə gizlədildiyi üçün mətnə
    // görə axtarmaq da işləmir — açılışın yeganə etibarlı əlaməti panelin özüdür.
    await expect(page.locator('#butun-filtrler')).toBeVisible({ timeout: 15_000 });

    // Panel daxilində real filtr sahəsi olmalıdır — boş panel «açıldı» sayılmaz.
    await expect(
      page.locator('#butun-filtrler select, #butun-filtrler input').first(),
    ).toBeVisible({ timeout: 10_000 });

    expectHealthy(health, 'filtr paneli');
  });

  test('aktiv filtr göstəricisi (FilterChips) səhifəni sındırmır', async ({ page, health }) => {
    await visit(page, '/elanlar?hasDelivery=1&withPhoto=1', 'iki filtr');
    expectHealthy(health, 'aktiv filtr göstəricisi');
  });
});

/**
 * SÜRƏTLİ FİLTR ÇİPLƏRİ — İSTİFADƏÇİYƏ GÖRÜNMƏSİ.
 *
 * NİYƏ AYRICA: çiplərin backend tərəfi işlək olsa da (yuxarıdakı URL testləri),
 * onları render edən `app/elanlar/ListingsClient.tsx` HEÇ YERDƏN import olunmurdu —
 * yəni düymələr istifadəçiyə ÜMUMİYYƏTLƏ görünmürdü (ölçüldü: `/elanlar` HTML-ində
 * çip mətnlərinin heç biri yox idi). Filtrin «işləməsi» üçün onun UI-da MÖVCUD
 * olması da yoxlanılmalıdır, əks halda eyni defekt səssizcə qayıda bilər.
 */
test.describe('Sürətli filtr çipləri', () => {
  test('çiplər görünür və real `<a href>` keçidləridir', async ({ page, health }) => {
    await visit(page, '/elanlar', 'elanlar');

    const chips = page.getByTestId('sürətli-filtrlər');
    await expect(chips, 'sürətli filtr zolağı').toBeVisible({ timeout: 15_000 });

    for (const label of ['Ən yeni', 'Çatdırılma var', 'Şəkilli', 'VIP', 'Təsdiqli satıcı']) {
      const chip = chips.getByRole('link', { name: label });
      await expect(chip, `«${label}» çipi`).toBeVisible();
      // Real ünvan: paylaşıla bilir, orta düymə ilə yeni tabda açılır, JS-siz işləyir.
      expect(await chip.getAttribute('href'), `«${label}» çipində href yoxdur`).toContain('/elanlar');
    }

    expectHealthy(health, 'sürətli filtr çipləri');
  });

  test('çipə klik filtri TƏTBİQ edir və nəticəni daraldır', async ({ page, health }) => {
    await visit(page, '/elanlar', 'elanlar');
    const all = await cardCount(page);

    await page.getByTestId('sürətli-filtrlər').getByRole('link', { name: 'VIP' }).click();
    await expect(page).toHaveURL(/vip=1/, { timeout: 20_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const vip = await cardCount(page);
    expect(vip, 'VIP çipi nəticəni daraltmadı').toBeLessThan(all);
    expectHealthy(health, 'VIP çipi');
  });

  test('aktiv çip TOGGLE olunur — ikinci klik filtri silir', async ({ page, health }) => {
    await visit(page, '/elanlar?vip=1', 'vip aktiv');

    const vipChip = page.getByTestId('sürətli-filtrlər').getByRole('link', { name: 'VIP' });
    // Aktiv vəziyyət istifadəçiyə görünməlidir, yoxsa filtrin açıq olduğu bilinmir.
    await expect(vipChip, 'aktiv çip nişanlanmayıb').toHaveAttribute('aria-pressed', 'true');
    // Aktiv çipin ünvanı filtri SİLİR.
    expect(await vipChip.getAttribute('href'), 'aktiv çip toggle etmir').not.toContain('vip=1');

    await vipChip.click();
    await expect(page).not.toHaveURL(/vip=1/, { timeout: 20_000 });
    expectHealthy(health, 'çip toggle');
  });

  test('snake_case link ilə gələndə də çip aktiv görünür', async ({ page, health }) => {
    // Paylaşılmış köhnə linklər snake_case daşıyır; səhifə onu qəbul edir, ona görə
    // çip də aktiv görünməlidir — əks halda filtr işləyir, amma UI onu inkar edir.
    await visit(page, '/elanlar?is_vip=1', 'snake_case vip');
    await expect(
      page.getByTestId('sürətli-filtrlər').getByRole('link', { name: 'VIP' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expectHealthy(health, 'snake_case çip');
  });
});
