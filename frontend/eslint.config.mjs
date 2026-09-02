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
];

export default eslintConfig;
