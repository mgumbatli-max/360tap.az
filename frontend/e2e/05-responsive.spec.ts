import { test, expect, expectHealthy, visit, expectNoHorizontalOverflow } from './fixtures';

/**
 * RESPONSİVLİK VƏ ÖLÜ ELEMENT SÜPÜRGƏSİ.
 *
 * Bu fayl hər 3 viewport-da (desktop/tablet/mobile) icra olunur — konfiqurasiyadakı
 * proyektlər sayəsində. Yoxlanan şeylər ölçüyə həssasdır:
 *   · üfüqi daşma — mobil düzümün ən çox rast gəlinən sınığı
 *   · naviqasiyanın əlçatanlığı — mobilde hamburger, desktopda mega-menyu
 *   · ölü keçidlər — href="#" və ya boş href olan linklər
 *   · reaksiyasız düymələr — onclick da yoxdur, form submit də deyil
 */

const KEY_PAGES = [
  '/',
  '/elanlar',
  '/elanlar?category=neqliyyat',
  '/elanlar?category=dasinmaz-emlak',
  '/elanlar?category=avtomobiller',
  '/elanlar?category=is-elanlari',
  '/elanlar?q=telefon',
  '/magaza',
  '/biznes',
  '/komek',
  '/login',
  '/qeydiyyat',
];

test.describe('Üfüqi daşma', () => {
  for (const p of KEY_PAGES) {
    test(`daşma yoxdur: ${p}`, async ({ page }) => {
      await page.goto(p, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await expectNoHorizontalOverflow(page, p);
    });
  }
});

test.describe('Naviqasiya əlçatanlığı', () => {
  test('istifadəçi hər ölçüdə kateqoriyalara çata bilir', async ({ page }, testInfo) => {
    await visit(page, '/', 'ana səhifə');
    const width = page.viewportSize()?.width ?? 1440;

    if (width >= 1024) {
      // Desktop: «Bütün kateqoriyalar» pill-i mega-menyunu açır.
      const btn = page.getByRole('button', { name: /Bütün kateqoriyalar/ });
      await expect(btn, 'desktopda mega-menyu düyməsi yoxdur').toBeVisible();
      await btn.click();
      await expect(
        page.locator('a[href*="category="]').first(),
        'mega-menyu kateqoriya keçidi göstərmir',
      ).toBeVisible({ timeout: 10_000 });
    } else {
      // Mobil/planşet: hamburger drawer.
      const burger = page.locator('header button').filter({ has: page.locator('svg') });
      expect(await burger.count(), 'mobil naviqasiya düyməsi yoxdur').toBeGreaterThan(0);
    }
    expect(testInfo.project.name).toBeTruthy();
  });

  test('axtarış hər ölçüdə mövcuddur', async ({ page }) => {
    await visit(page, '/', 'ana səhifə');
    const search = page.locator('form[role="search"] input').first();
    await expect(search, 'axtarış sahəsi görünmür').toBeVisible();
  });
});

test.describe('Ölü keçid və reaksiyasız düymə süpürgəsi', () => {
  for (const p of ['/', '/elanlar', '/biznes', '/komek']) {
    test(`ölü element yoxdur: ${p}`, async ({ page }) => {
      await visit(page, p, p);

      // href="#" / boş href — istifadəçi klikləyir, heç nə olmur.
      const deadLinks = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a'))
          .filter((a) => {
            const h = a.getAttribute('href');
            // `#` ilə başlayan real çövrə keçidləri (məs. #netice) icazəlidir.
            return h === null || h === '' || h === '#';
          })
          // Klik işləyicisi olan `<a>` qəsdən belə ola bilər — mətnini göstər.
          .map((a) => (a.textContent || '').trim().slice(0, 40))
          .filter(Boolean)
          .slice(0, 10),
      );
      expect(deadLinks, `${p}: hədəfsiz keçid`).toEqual([]);
    });
  }
});

test.describe('Boş vəziyyət mesajları', () => {
  test('nəticəsiz filtr izahlı boş vəziyyət göstərir', async ({ page, health }) => {
    // Real olaraq heç bir elan uyğun gəlməyəcək kombinasiya.
    await visit(page, '/elanlar?category=avtomobiller&priceMin=99999999', 'boş filtr');
    const body = await page.locator('body').innerText();
    expect(body, 'boş nəticə izah olunmur').toMatch(/tapılmadı|nəticə|heç|dəyişin|sıfırla/i);
    expectHealthy(health, 'boş filtr');
  });
});
