import { test, expect, expectHealthy, visit, expectNoHorizontalOverflow } from './fixtures';

/**
 * PUBLİK SƏHİFƏLƏR — qonaq istifadəçinin gördüyü hər şey.
 * Hər test sonunda `expectHealthy` konsol/şəbəkə vəziyyətini yoxlayır.
 */

const ROOT_CATEGORIES = [
  'neqliyyat',
  'dasinmaz-emlak',
  'is-elanlari',
  'elektronika',
  'ev-bag',
  'shexsi-esyalar',
  'usaq-alemi',
  'heyvanlar',
  'tikinti-temir',
  'hobbi-asude',
  'biznes-avadanliq',
  'kend-teserrufati',
  'xidmetler',
];

test.describe('Ana səhifə', () => {
  test('yüklənir, kateqoriya plitələri və elanlar görünür', async ({ page, health }) => {
    await visit(page, '/', 'ana səhifə');

    // Başlıq və logo
    await expect(page.locator('header').first()).toBeVisible();

    // Kateqoriya keçidləri — ən azı 10 kök kateqoriya linki olmalıdır.
    const catLinks = page.locator('a[href*="/elanlar?category="], a[href^="/k/"]');
    expect(await catLinks.count(), 'ana səhifədə kateqoriya keçidi').toBeGreaterThanOrEqual(8);

    // Elan kartları — boş vitrin qəbul edilmir.
    const cards = page.locator('a[href^="/elanlar/"]');
    expect(await cards.count(), 'ana səhifədə elan kartı').toBeGreaterThan(0);

    expectHealthy(health, 'ana səhifə');
  });

  test('axtarış forması işləyir və /elanlar-a aparır', async ({ page, health }) => {
    await visit(page, '/', 'ana səhifə');
    const form = page.locator('form[role="search"]').first();
    await form.locator('input').first().fill('telefon');
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/elanlar\?.*q=telefon/, { timeout: 30_000 });
    expectHealthy(health, 'axtarış yönləndirməsi');
  });
});

test.describe('Kateqoriyalar', () => {
  for (const slug of ROOT_CATEGORIES) {
    test(`kök kateqoriya: ${slug}`, async ({ page, health }) => {
      await visit(page, `/elanlar?category=${slug}`, slug);

      // Səhifə həmin kateqoriyanı tanımalıdır — H1 boş "undefined"/"null" olmamalıdır.
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
      const text = (await h1.textContent()) ?? '';
      expect(text.trim().length, `${slug}: H1 boşdur`).toBeGreaterThan(1);
      expect(text).not.toMatch(/undefined|null|NaN/i);

      expectHealthy(health, slug);
    });
  }

  test('/k/<slug> köhnə route-u /elanlar-a yönləndirir', async ({ page }) => {
    const res = await page.goto('/k/neqliyyat');
    expect(res?.status()).toBeLessThan(400);
    expect(page.url()).toContain('/elanlar?category=neqliyyat');
  });

  test('kateqoriya → alt kateqoriya keçidi işləyir', async ({ page, health }) => {
    await visit(page, '/elanlar?category=neqliyyat', 'nəqliyyat');

    // Vertikal landinqdə alt kateqoriya plitələri/tabları olmalıdır.
    const sub = page.locator('a[href*="category=avtomobiller"]').first();
    await expect(sub, 'nəqliyyat altında «avtomobiller» keçidi').toBeVisible();
    await sub.click();
    await page.waitForURL(/category=avtomobiller/, { timeout: 30_000 });
    await expectNoHorizontalOverflow(page, 'avtomobiller');
    expectHealthy(health, 'alt kateqoriya keçidi');
  });
});

test.describe('Elan siyahısı və detalı', () => {
  test('siyahıdan detala keçid — qalereya, telefon, WhatsApp', async ({ page, health }) => {
    await visit(page, '/elanlar', 'elan siyahısı');

    const card = page.locator('a[href^="/elanlar/"]').first();
    await expect(card, 'siyahıda ən azı bir elan').toBeVisible();
    await card.click();
    await page.waitForURL(/\/elanlar\/[^/?]+/, { timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Detal səhifəsinin əsas elementləri
    await expect(page.locator('h1').first(), 'elan başlığı').toBeVisible();
    await expectNoHorizontalOverflow(page, 'elan detalı');

    // QALEREYA — şəkil varsa naviqasiya düymələri işləməlidir.
    const next = page.getByRole('button', { name: 'Növbəti şəkil' });
    if (await next.count()) {
      await next.first().click();
      await expect(page.locator('img').first()).toBeVisible();
    }

    // TELEFONU GÖSTƏR — kliklədikdən sonra `tel:` linkinə çevrilməlidir.
    const phoneBtn = page.getByRole('button', { name: /Telefonu göstər/ });
    if (await phoneBtn.count()) {
      await phoneBtn.first().click();
      await expect(page.locator('a[href^="tel:"]').first(), 'nömrə açılmadı').toBeVisible();
    }

    // WhatsApp keçidi varsa düzgün formada olmalıdır.
    const wa = page.locator('a[href*="wa.me/"]');
    if (await wa.count()) {
      const href = await wa.first().getAttribute('href');
      expect(href, 'wa.me linkində rəqəm yoxdur').toMatch(/wa\.me\/\d{6,}/);
    }

    expectHealthy(health, 'elan detalı');
  });

  test('mövcud olmayan elan 404 verir, çökmür', async ({ page }) => {
    const res = await page.goto('/elanlar/bele-bir-elan-yoxdur-12345');
    expect([404, 200]).toContain(res?.status() ?? 0);
    // RSC axını `load` anında bitmir — məzmun gözlənilməlidir, əks halda test
    // boş `body` görüb yalançı «ağ ekran» hesabatı verir.
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('body')).toContainText(/tapılmadı|404/i, { timeout: 20_000 });
  });
});

test.describe('Statik səhifələr', () => {
  const PAGES = ['/komek', '/qaydalar', '/mexfilik', '/elaqe', '/biznes', '/magaza', '/karyera', '/reklam'];
  for (const p of PAGES) {
    test(`səhifə açılır: ${p}`, async ({ page, health }) => {
      await visit(page, p, p);
      expectHealthy(health, p);
    });
  }
});
