import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/**
 * Faza 0: layihədə ESLint ÜMUMİYYƏTLƏ quraşdırılmamışdı — yəni
 * `next.config.ts`-dəki `eslint.ignoreDuringBuilds: true` heç nə gizlətmirdi,
 * sadəcə mövcud olmayan bir yoxlamanı söndürürdü.
 *
 * İndi Next.js-in rəsmi `core-web-vitals` dəsti aktivdir və build-də işləyir.
 * Prinsip: REAL səhvlər build-i bloklasın; üslub/keyfiyyət qeydləri isə
 * xəbərdarlıq kimi görünsün (blanket disable YOXDUR).
 */
const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'public/**'],
  },
  {
    rules: {
      // Bunlar keyfiyyət borcudur (Faza 1-də təmizlənəcək), amma production
      // build-ini bloklamamalıdır — bloklayanlar real səhvlərdir.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@next/next/no-img-element': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    /**
     * PLAYWRIGHT FIXTURE-LARI REACT DEYİL.
     *
     * `e2e/fixtures.ts`-də Playwright-ın standart naxışı `async ({ page }, use) => {
     * ... await use(value) }` şəklindədir. ESLint-in `react-hooks` qaydası buradakı
     * `use(...)` çağırışını React-in `use` HOOK-u sanır və «hook komponent olmayan
     * funksiyada çağırılıb» deyə XƏTA verir. Bu, yalançı pozitivdir: fayl brauzerdə
     * deyil, Node-da, test qoşqusu kimi işləyir və React-ə heç bir aidiyyəti yoxdur.
     *
     * Qayda YALNIZ `e2e/` üçün söndürülür — tətbiq kodunda o, real dəyər verir.
     */
    files: ['e2e/**/*.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];

export default eslintConfig;
