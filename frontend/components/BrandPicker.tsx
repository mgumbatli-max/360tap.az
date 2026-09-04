'use client';
import { useEffect, useState } from 'react';
import { Palette, X } from 'lucide-react';
import { BRAND_THEMES, BRAND_STORAGE_KEY, DEFAULT_BRAND, isValidBrand } from '@/lib/brand-themes';

/**
 * BREND RƏNGİ SEÇİCİSİ — DİZAYN ALƏTİ.
 *
 * NƏ EDİR: `<html data-brand="...">` atributunu dəyişir. Bütün `tap-*` çalarları
 * CSS dəyişənlərinə bağlı olduğu üçün (bax `tailwind.config.ts`) rəng ANINDA,
 * yenidən build olmadan dəyişir. Seçim `localStorage`-də qalır.
 *
 * NİYƏ HƏR ZİYARƏTÇİYƏ GÖSTƏRİLMİR: brend rəngi məhsul qərarıdır, istifadəçi
 * tənzimləməsi deyil — adi ziyarətçi saytın rəngini dəyişməməlidir. Ona görə
 * yalnız İKİ halda görünür:
 *   1. `NODE_ENV !== 'production'` (lokal dizayn işi),
 *   2. URL-də `?brand-picker=1` (canlı önizləmədə qərar vermək üçün).
 * Hər iki halda `?brand=<id>` sorğu açarı ilə birbaşa link paylaşmaq da mümkündür.
 *
 * Görünmə şərti QƏSDƏN `useEffect` içindədir: server render zamanı `location`
 * mövcud deyil, şərti render isə hidratasiya uyğunsuzluğu verərdi.
 */
export default function BrandPicker() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>(DEFAULT_BRAND);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get('brand-picker') === '1';
    setVisible(process.env.NODE_ENV !== 'production' || forced);
    const current = document.documentElement.dataset.brand;
    if (isValidBrand(current)) setActive(current);
  }, []);

  const apply = (id: string) => {
    document.documentElement.dataset.brand = id;
    setActive(id);
    try {
      localStorage.setItem(BRAND_STORAGE_KEY, id);
    } catch {
      // Şəxsi rejimdə localStorage bloklana bilər — seçim yenə də cari sessiyada işləyir.
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[60] print:hidden">
      {open ? (
        <div className="w-[248px] rounded-2xl border border-ink-200 bg-white p-3 shadow-menu dark:border-ink-700 dark:bg-ink-800">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-bold text-ink-900 dark:text-white">Brend rəngi</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Bağla"
              className="grid h-6 w-6 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tap dark:hover:bg-ink-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="space-y-1">
            {BRAND_THEMES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => apply(t.id)}
                  aria-pressed={active === t.id}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tap ${
                    active === t.id
                      ? 'bg-ink-100 dark:bg-ink-700'
                      : 'hover:bg-ink-50 dark:hover:bg-ink-700/60'
                  }`}
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-ink-900 dark:text-white">
                      {t.label}
                    </span>
                    <span className="block truncate text-[11px] text-ink-500 dark:text-ink-400">
                      {t.note}
                    </span>
                  </span>
                  {active === t.id && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-tap" aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-2 border-t border-ink-100 pt-2 text-[11px] leading-snug text-ink-400 dark:border-ink-700">
            Linkdə paylaşmaq üçün: <code className="text-ink-500">?brand={active}</code>
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Brend rəngini dəyiş"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink-600 shadow-menu ring-1 ring-ink-200 transition-colors hover:text-tap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tap dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-700"
        >
          <Palette className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
