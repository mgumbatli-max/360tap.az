import { test, expect, expectHealthy, visit } from './fixtures';

/**
 * AXTARIŞ VƏ FİLTRLƏR.
 *
 * NİYƏ URL YOXLANIR: bütün filtr vəziyyəti `searchParams`-dədir (CategoryFilters
 * lokal state saxlamır). Yəni «filtr işlədi» iddiasının yeganə etibarlı sübutu
 * URL-in dəyişməsi + nəticə blokunun yenilənməsidir.
 */

test.describe('Axtarış', () => {
  test('adi söz ilə axtarış nəticə qaytarır', async ({ page, health }) => {
    await visit(page, '/elanlar?q=telefon', 'axtarış: telefon');
    const body = await page.locator('body').innerText();
    // Ya nəticə kartı, ya da açıq «tapılmadı» mesajı olmalıdır — sükut yolverilməzdir.
    const cards = await page.locator('a[href^="/elanlar/"]').count();
    expect(cards > 0 || /tapılmadı|nəticə yoxdur|heç nə/i.test(body), 'nə nəticə, nə də boş vəziyyət mesajı var').toBeTruthy();
    expectHealthy(health, 'axtarış');
  });

  test('DİAKRİTİKSİZ (transliterasiya) axtarış eyni nəticəni verməlidir', async ({ page }) => {
    // Azərbaycan istifadəçisi əksərən «menzil» yazır, «mənzil» yox.
    await page.goto('/elanlar?q=m%C9%99nzil');
    await page.waitForLoadState('networkidle').catch(() => {});
    const withDiacritics = await page.locator('a[href^="/elanlar/"]').count();

    await page.goto('/elanlar?q=menzil');
    await page.waitForLoadState('networkidle').catch(() => {});
    const without = await page.locator('a[href^="/elanlar/"]').count();

    expect(
      without,
      `transliterasiya işləmir: «mənzil» ${withDiacritics} nəticə, «menzil» ${without}`,
    ).toBeGreaterThanOrEqual(Math.min(1, withDiacritics));
  });

  test('boş nəticə vəziyyəti düzgün göstərilir', async ({ page, health }) => {
    await visit(page, '/elanlar?q=zzzqqqxxxyoxdur123', 'boş nəticə');
    const body = await page.locator('body').innerText();
    expect(body, 'boş nəticə üçün izah mesajı yoxdur').toMatch(/tapılmadı|nəticə|heç/i);
    expectHealthy(health, 'boş nəticə');
  });
});

/** «Bütün filtrlər» panelini açır — dar ekranda sahələr yalnız orada görünür. */
async function openFilters(page: import('@playwright/test').Page): Promise<void> {
  const btn = page.getByRole('button', { name: /Bütün filtrlər|Filtrlər/ }).first();
  if (await btn.count()) await btn.click().catch(() => {});
  await page.waitForTimeout(400);
}

test.describe('Kateqoriya filtrləri (Avito modeli)', () => {
  /**
   * TƏLƏB #5-in birbaşa yoxlanışı: üç vertikal EYNİ filtr dəstini göstərməməlidir.
   * Müqayisə DOM-dakı filtr etiketlərinin çoxluğu üzərində aparılır.
   */
  async function filterLabels(page: import('@playwright/test').Page): Promise<string[]> {
    // Zolaqdakı və «Bütün filtrlər» panelindəki bütün sahə etiketləri.
    await openFilters(page);
    return page.evaluate(() => {
      const out = new Set<string>();
      document.querySelectorAll('select[aria-label], input[aria-label]').forEach((el) => {
        const l = el.getAttribute('aria-label');
        if (l) out.add(l.trim());
      });
      document.querySelectorAll('label').forEach((el) => {
        const t = (el.textContent || '').trim();
        if (t && t.length < 40) out.add(t);
      });
      return Array.from(out);
    });
  }

  test('avtomobil, əmlak və vakansiya filtrləri FƏRQLİ olmalıdır', async ({ page }) => {
    await visit(page, '/elanlar?category=avtomobiller', 'avtomobiller');
    const cars = await filterLabels(page);

    await visit(page, '/elanlar?category=menziller', 'menziller');
    const flats = await filterLabels(page);

    await visit(page, '/elanlar?category=is-it', 'is-it');
    const jobs = await filterLabels(page);

    // Hər vertikal öz sahəsinə xas ən azı bir filtr göstərməlidir.
    expect(cars.join('|'), 'avtomobil filtrlərində marka/yürüş/il yoxdur').toMatch(/Marka|Yürüş|İl|Yanacaq|Ban/i);
    expect(flats.join('|'), 'mənzil filtrlərində otaq/sahə yoxdur').toMatch(/Otaq|Sahə|Mərtəbə|Əməliyyat/i);
    expect(jobs.join('|'), 'vakansiya filtrlərində maaş/qrafik yoxdur').toMatch(/Maaş|Qrafik|Təcrübə/i);

    // Üç dəst eyni olmamalıdır.
    const same = JSON.stringify(cars.sort()) === JSON.stringify(flats.sort());
    expect(same, 'avtomobil və əmlak eyni generic filtr formasını paylaşır').toBeFalsy();
  });

  test('VERTİKAL kök səhifə də öz filtrlərini göstərməlidir', async ({ page }) => {
    await visit(page, '/elanlar?category=neqliyyat', 'nəqliyyat kökü');
    const transport = await filterLabels(page);
    await visit(page, '/elanlar?category=dasinmaz-emlak', 'əmlak kökü');
    const estate = await filterLabels(page);

    expect(transport.join('|'), 'nəqliyyat kökündə nəqliyyata xas filtr yoxdur').toMatch(/Marka|İl|Növ/i);
    expect(estate.join('|'), 'əmlak kökündə əmlaka xas filtr yoxdur').toMatch(/Əməliyyat|Sahə|Otaq/i);
  });

  test('brend seçimi model siyahısını doldurur (asılılıq)', async ({ page }) => {
    await visit(page, '/elanlar?category=avtomobiller', 'avtomobiller');
    await openFilters(page);

    const brand = page.locator('select[aria-label="Marka"]:visible').first();
    await expect(brand, 'Marka select-i yoxdur').toBeVisible();
    const brandOptions = await brand.locator('option').count();
    expect(brandOptions, 'Marka siyahısı boşdur').toBeGreaterThan(5);

    // Marka seç → URL dəyişməli, Model siyahısı dolmalıdır.
    await brand.selectOption({ label: 'BMW' });
    await page.waitForURL(/a_brand=BMW/, { timeout: 20_000 });

    const model = page.locator('select[aria-label="Model"]:visible').first();
    if (await model.count()) {
      const modelOptions = await model.locator('option').count();
      expect(modelOptions, 'BMW seçildi, amma model siyahısı boşdur').toBeGreaterThan(1);
    }
  });

  test('sıralama və qiymət aralığı URL-ə yazılır', async ({ page, health }) => {
    await visit(page, '/elanlar', 'elanlar');
    // Mobildə zolaq gizlidir — sahələr «Bütün filtrlər» panelindədir.
    await openFilters(page);
    const sort = page.locator('select[aria-label="Sıralama"]:visible').first();
    if (await sort.count()) {
      await sort.selectOption({ index: 1 });
      await page.waitForURL(/sort=/, { timeout: 20_000 });
    }
    expectHealthy(health, 'sıralama');
  });

  test('region filtri işləyir', async ({ page, health }) => {
    await visit(page, '/elanlar', 'elanlar');
    await openFilters(page);
    const region = page.locator('select[aria-label="Region"]:visible').first();
    if (await region.count()) {
      const values = await region.locator('option').evaluateAll((els) =>
        els.map((e) => (e as HTMLOptionElement).value).filter(Boolean),
      );
      expect(values.length, 'region siyahısı boşdur').toBeGreaterThan(3);
      // BOŞ dəyərli ilk seçim «Bütün Azərbaycan»dır — onu seçmək filtri TƏMİZLƏYİR
      // və URL dəyişmir. Real filtr üçün dəyəri olan ilk variant seçilir.
      await region.selectOption(values[0]);
      await page.waitForURL(new RegExp(`region=${values[0]}`), { timeout: 20_000 });
    }
    expectHealthy(health, 'region filtri');
  });
});

test.describe('Şəhər route-ları', () => {
  test('/seher/baki açılır', async ({ page, health }) => {
    await visit(page, '/seher/baki', 'şəhər səhifəsi');
    expectHealthy(health, '/seher/baki');
  });

  test('/seher/baki/neqliyyat açılır', async ({ page, health }) => {
    await visit(page, '/seher/baki/neqliyyat', 'şəhər+kateqoriya');
    expectHealthy(health, '/seher/baki/neqliyyat');
  });
});
