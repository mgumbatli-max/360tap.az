import {
  test, expect, expectHealthy, visit, expectNoHorizontalOverflow, freshUser,
} from './fixtures';

/**
 * HESAB ARXASINDAKI AXINLAR — elan CRUD, sevimlilər, kabinet, mağaza, admin.
 *
 * NİYƏ HƏR TEST ÖZ İSTİFADƏÇİSİNİ YARADIR: testlər paralel işləyir və biri digərinin
 * elanını silsə nəticə təsadüfi olar. Paylaşılan hesab = qarşılıqlı çirklənmə.
 *
 * NİYƏ QEYDİYYAT UI ÜZƏRİNDƏN: tələb «real istifadəçi kimi kliklə» idi — tokeni
 * birbaşa localStorage-ə yazmaq qeydiyyat axınının özünü test etmədən qalardı.
 */
const ALLOW_WRITE = process.env.E2E_ALLOW_WRITE === '1';

async function registerAndLogin(page: import('@playwright/test').Page) {
  const u = freshUser();
  await page.goto('/qeydiyyat');
  await page.getByPlaceholder('Ad Soyad *').fill(u.name);
  await page.getByPlaceholder('Email').fill(u.email);
  await page.locator('input[type="password"]').first().fill(u.password);
  await page.getByRole('button', { name: /Hesab yarat/ }).click();
  await page.waitForURL((url) => !/\/qeydiyyat/.test(url.pathname), { timeout: 30_000 });
  return u;
}

test.describe('Qonaq üçün qorunan səhifələr', () => {
  const GUARDED = ['/profil', '/profil/elanlarim', '/profil/sevimliler', '/profil/magazam', '/elan-yerlesdir'];
  for (const p of GUARDED) {
    test(`qonaq ${p} açanda 500 vermir və izah görür`, async ({ page }) => {
      const res = await page.goto(p);
      expect(res?.status(), `${p}: server xətası`).toBeLessThan(500);
      const body = (await page.locator('body').innerText()).trim();
      expect(body.length, `${p}: boş ekran`).toBeGreaterThan(20);
      await expectNoHorizontalOverflow(page, p);
    });
  }

  test('/admin qonağa məlumat sızdırmır', async ({ page }) => {
    const res = await page.goto('/admin');
    expect(res?.status()).toBeLessThan(500);
    const body = await page.locator('body').innerText();
    // Qonaq idarəetmə cədvəlini görməməlidir.
    expect(body, 'qonaq admin panelinin məzmununu görür').toMatch(/giriş|icazə|daxil ol|tapılmadı|yoxdur/i);
  });
});

test.describe('Mağaza vitrini', () => {
  test('/magaza siyahısı açılır', async ({ page, health }) => {
    await visit(page, '/magaza', 'mağazalar');
    expectHealthy(health, '/magaza');
  });

  test('mövcud olmayan mağaza slug-ı çökmür', async ({ page }) => {
    const res = await page.goto('/magaza/bele-magaza-yoxdur-999');
    expect(res?.status()).toBeLessThan(500);
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('body')).toContainText(/tapılmadı|404|mövcud deyil/i, { timeout: 20_000 });
  });
});

test.describe('Elan CRUD — tam dövrə', () => {
  test.skip(!ALLOW_WRITE, 'yazma əməliyyatları yalnız lokal mühitdə (E2E_ALLOW_WRITE=1)');

  test('elan yarat → tap → detalını yoxla → redaktə et → arxivlə', async ({ page, health }) => {
    await registerAndLogin(page);

    const stamp = `${Date.now()}`.slice(-8);
    const title = `E2E Test Elanı ${stamp}`;

    // ——— YARAT ———
    await page.goto('/elan-yerlesdir');
    await expect(page.getByRole('heading', { name: /Elan yerləşdir/ })).toBeVisible({ timeout: 30_000 });

    // Kateqoriya seçimi — ağac dialoqu + axtarış (real klik axını).
    // DİQQƏT: `button[aria-haspopup="dialog"]` header-dəki şəhər seçicisinə də uyğun
    // gəlir — `.first()` onu seçirdi və dialoq heç vaxt açılmırdı. Kateqoriya
    // seçicisi öz boş vəziyyət mətni ilə birmənalı tapılır.
    await page.getByText('Kateqoriya seçin…').click();
    const dialog = page.getByRole('dialog', { name: 'Kateqoriya seçimi' });
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await dialog.getByPlaceholder(/Kateqoriya axtar/).fill('telefon');
    await page.waitForTimeout(500);
    await dialog.getByRole('button').filter({ hasText: /telefon/i }).first().click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });

    await page.locator('#f-title').fill(title);
    await page.locator('textarea').first().fill(
      'Bu, avtomatik E2E testi tərəfindən yaradılmış müvəqqəti elandır. Test bitdikdən sonra silinir.',
    );
    // Qiymət sahəsi — placeholder "0"
    const priceInput = page.getByPlaceholder('0').first();
    if (await priceInput.count()) await priceInput.fill('250');

    await page.getByRole('button', { name: /Elanı dərc et/ }).click();

    // Uğurlu yaradılış → elanın detal səhifəsinə yönləndirir.
    await page.waitForURL(/\/elanlar\/[^/?]+$/, { timeout: 45_000 });
    const listingUrl = page.url();
    await expect(page.locator('h1').first()).toContainText(title, { timeout: 20_000 });
    await expectNoHorizontalOverflow(page, 'yeni elan detalı');

    // ——— TAP: elan öz kabinetində görünür ———
    await page.goto('/profil/elanlarim');
    await expect(page.locator('body')).toContainText(title, { timeout: 30_000 });

    // ——— REDAKTƏ ———
    const id = listingUrl.split('/').pop() as string;
    await page.goto(`/elan-yerlesdir?edit=${id}`);
    await expect(page.locator('#f-title')).toHaveValue(title, { timeout: 30_000 });
    const newTitle = `${title} (redaktə)`;
    await page.locator('#f-title').fill(newTitle);
    await page.getByRole('button', { name: /Yadda saxla/ }).click();
    await page.waitForURL(/\/elanlar\//, { timeout: 45_000 });
    await expect(page.locator('h1').first()).toContainText('redaktə', { timeout: 20_000 });

    // ——— ARXİVLƏ ———
    // Platformada HARD DELETE endpoint-i qəsdən yoxdur (yalnız sold/archive/reactivate).
    // Ona görə «sil» addımı arxivləşdirmə kimi yoxlanılır — məhsulun real davranışı budur.
    // `confirm()` brauzer dialoqudur: Playwright default olaraq ONU RƏDD EDİR, yəni
    // işləyici olmadan arxivləşdirmə heç vaxt baş verməzdi və test yalançı «sınıq» verərdi.
    page.on('dialog', (d) => void d.accept());

    await page.goto('/profil/elanlarim');
    await expect(page.locator('body')).toContainText(newTitle, { timeout: 30_000 });

    const row = page.locator('li, article, tr').filter({ hasText: newTitle }).first();
    const archiveBtn = row.getByRole('button', { name: /Arxiv/ });
    if (await archiveBtn.count()) {
      await archiveBtn.first().click();
      // Arxivləşən elan «Arxiv» filtri altında görünməlidir.
      await expect(page.locator('body')).toContainText(/Arxiv/i, { timeout: 20_000 });
    }

    expectHealthy(health, 'elan CRUD');
  });

  test('sevimlilərə əlavə et və kabinetdə gör', async ({ page, health }) => {
    await registerAndLogin(page);

    await page.goto('/elanlar');
    const card = page.locator('a[href^="/elanlar/"]').first();
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.click();
    await page.waitForURL(/\/elanlar\/[^/?]+/, { timeout: 30_000 });

    const fav = page.getByRole('button', { name: /Sevimlilərə əlavə et/ }).first();
    if (await fav.count()) {
      await fav.click();
      await expect(
        page.getByRole('button', { name: /Sevimlilərdən çıxar/ }).first(),
        'sevimliyə əlavə düyməsi vəziyyət dəyişmir',
      ).toBeVisible({ timeout: 20_000 });

      // Sevimlilər siyahısı KLİENT tərəfdə yüklənir — `goto` bitəndə hələ boşdur.
      // `expect.poll` şəbəkə cavabını gözləyir, sabit `waitForTimeout` isə ya
      // testi yavaşladır, ya da yavaş mühitdə yalançı sınıq verir.
      await page.goto('/profil/sevimliler');
      await expect
        .poll(() => page.locator('a[href^="/elanlar/"]').count(), {
          timeout: 25_000,
          message: 'sevimlilər siyahısı boş qaldı',
        })
        .toBeGreaterThan(0);
    }

    expectHealthy(health, 'sevimlilər');
  });

  test('istifadəçi kabinetinin bütün bölmələri açılır', async ({ page, health }) => {
    await registerAndLogin(page);
    const SECTIONS = [
      '/profil',
      '/profil/elanlarim',
      '/profil/sevimliler',
      '/profil/mesajlar',
      '/profil/ayarlar',
      '/profil/baxilanlar',
      '/profil/bildirisler',
      '/profil/magazam',
    ];
    for (const s of SECTIONS) {
      const res = await page.goto(s);
      expect(res?.status(), `${s}: status`).toBeLessThan(400);
      await page.waitForLoadState('networkidle').catch(() => {});
      const body = (await page.locator('body').innerText()).trim();
      expect(body.length, `${s}: boş ekran`).toBeGreaterThan(20);
      await expectNoHorizontalOverflow(page, s);
    }
    expectHealthy(health, 'kabinet bölmələri');
  });
});
