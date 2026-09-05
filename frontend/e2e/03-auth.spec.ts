import { test, expect, expectHealthy, visit, freshUser } from './fixtures';

/**
 * AUTENTİFİKASİYA AXINLARI.
 *
 * NİYƏ YAZMA ƏMƏLİYYATLARI BAYRAQ ARXASINDADIR: qeydiyyat canlı bazada real
 * istifadəçi yaradır. Production-a qarşı işləyəndə bu, saytı zibilləyər — ona görə
 * yalnız `E2E_ALLOW_WRITE=1` (lokal build) olduqda icra olunur. Oxu axınları
 * (səhifə açılır, forma render olunur, validasiya işləyir) HƏR MÜHİTDƏ yoxlanılır.
 */
const ALLOW_WRITE = process.env.E2E_ALLOW_WRITE === '1';

test.describe('Giriş və qeydiyyat səhifələri', () => {
  test('/login render olunur', async ({ page, health }) => {
    await visit(page, '/login', 'giriş');
    await expect(page.getByPlaceholder('Telefon və ya e-poçt')).toBeVisible();
    await expect(page.getByPlaceholder('Parol')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Daxil ol', exact: true })).toBeVisible();
    expectHealthy(health, '/login');
  });

  test('/qeydiyyat render olunur', async ({ page, health }) => {
    await visit(page, '/qeydiyyat', 'qeydiyyat');
    await expect(page.getByPlaceholder('Ad Soyad *')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    expectHealthy(health, '/qeydiyyat');
  });

  test('/register köhnə ünvanı /qeydiyyat-a yönləndirir', async ({ page }) => {
    await page.goto('/register');
    expect(page.url()).toContain('/qeydiyyat');
  });

  test('səhv parolla giriş AÇIQ xəta mesajı verir (sükut yox)', async ({ page }) => {
    await visit(page, '/login', 'giriş');
    await page.getByPlaceholder('Telefon və ya e-poçt').fill('yoxdur@360tap.test');
    await page.getByPlaceholder('Parol').fill('SehvParol123');
    await page.getByRole('button', { name: 'Daxil ol', exact: true }).click();
    // İstifadəçi nə baş verdiyini görməlidir — səssiz uğursuzluq defektdir.
    await expect(page.locator('body')).toContainText(
      /yanlış|səhv|tapılmadı|xəta|doğru deyil|uyğun|etibarsız|düzgün deyil|mövcud deyil/i,
      { timeout: 20_000 },
    );
  });

  test('/sifre-unutdum forması işləyir', async ({ page, health }) => {
    await visit(page, '/sifre-unutdum', 'parol unutdum');
    const input = page.locator('input[type="email"], input[type="text"]').first();
    await expect(input, 'e-poçt sahəsi yoxdur').toBeVisible();
    expectHealthy(health, '/sifre-unutdum');
  });

  test('/parol-sifirla tokensiz açılanda çökmür', async ({ page }) => {
    const res = await page.goto('/parol-sifirla');
    expect(res?.status()).toBeLessThan(500);
    expect((await page.locator('body').innerText()).trim().length).toBeGreaterThan(20);
  });

  test('/e-poct-tesdiq tokensiz açılanda çökmür', async ({ page }) => {
    const res = await page.goto('/e-poct-tesdiq');
    expect(res?.status()).toBeLessThan(500);
    expect((await page.locator('body').innerText()).trim().length).toBeGreaterThan(20);
  });
});

test.describe('Tam qeydiyyat → giriş → çıxış dövrü', () => {
  test.skip(!ALLOW_WRITE, 'yazma əməliyyatları yalnız lokal mühitdə (E2E_ALLOW_WRITE=1)');

  test('yeni hesab yaradılır, giriş olunur, çıxış edilir', async ({ page, health }) => {
    const u = freshUser();

    await visit(page, '/qeydiyyat', 'qeydiyyat');
    await page.getByPlaceholder('Ad Soyad *').fill(u.name);
    await page.getByPlaceholder('Email').fill(u.email);
    await page.locator('input[type="password"]').first().fill(u.password);
    await page.getByRole('button', { name: /Hesab yarat/ }).click();

    // Qeydiyyatdan sonra istifadəçi daxil olmuş sayılmalıdır.
    await page.waitForURL((url) => !/\/qeydiyyat/.test(url.pathname), { timeout: 30_000 });
    await expect(page.locator('header')).toContainText(new RegExp(u.name.split(' ')[0], 'i'), {
      timeout: 20_000,
    });

    // ÇIXIŞ — yerləşməsi ekran ölçüsündən asılıdır: ≥1024px-də header-in utility
    // sətrindəki istifadəçi menyusunda, dar ekranda isə hamburger drawer-ində.
    // Test hər iki yolu dəstəkləməlidir, əks halda yalnız desktopda keçər.
    const width = page.viewportSize()?.width ?? 1440;
    if (width >= 1024) {
      await page.getByRole('button', { name: new RegExp(u.name.split(' ')[0], 'i') }).first().click();
    } else {
      await page.locator('header button').last().click();
      await page.waitForTimeout(500);
    }
    await page.getByRole('button', { name: /Çıxış/ }).first().click();
    await expect(page.locator('header')).toContainText(/Giriş/i, { timeout: 20_000 });

    // TƏKRAR GİRİŞ — parol həqiqətən saxlanıb.
    await visit(page, '/login', 'giriş');
    await page.getByPlaceholder('Telefon və ya e-poçt').fill(u.email);
    await page.getByPlaceholder('Parol').fill(u.password);
    await page.getByRole('button', { name: 'Daxil ol', exact: true }).click();
    await page.waitForURL((url) => !/\/login/.test(url.pathname), { timeout: 30_000 });

    expectHealthy(health, 'qeydiyyat dövrü');
  });
});
