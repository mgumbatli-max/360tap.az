import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════════
        // BREND PALİTRASI — RUNTIME-DA DƏYİŞİLƏ BİLƏN.
        //
        // Çalarlar sabit hex DEYİL, CSS dəyişənlərinə bağlıdır. Faktiki dəyərlər
        // `app/globals.css`-dəki `[data-brand="..."]` bloklarındadır, seçim isə
        // `<html data-brand="...">` atributu ilə edilir → rəng dəyişmək üçün
        // YENİDƏN BUILD LAZIM DEYİL.
        //
        // `rgb(var(--x) / <alpha-value>)` forması QƏSDƏN seçilib: layihədə
        // `bg-tap/10`, `border-tap/20` kimi 30-dan çox alfa modifikatoru var və
        // yalnız bu formatda Tailwind şəffaflığı yerləşdirə bilir. Dəyişənlər
        // buna görə boşluqla ayrılmış RGB üçlüyüdür («224 43 49»), hex yox.
        // ═══════════════════════════════════════════════════════════════════
        tap: {
          DEFAULT: 'rgb(var(--tap-500) / <alpha-value>)',
          50:  'rgb(var(--tap-50) / <alpha-value>)',
          100: 'rgb(var(--tap-100) / <alpha-value>)',
          200: 'rgb(var(--tap-200) / <alpha-value>)',
          300: 'rgb(var(--tap-300) / <alpha-value>)',
          400: 'rgb(var(--tap-400) / <alpha-value>)',
          500: 'rgb(var(--tap-500) / <alpha-value>)',
          600: 'rgb(var(--tap-600) / <alpha-value>)',
          700: 'rgb(var(--tap-700) / <alpha-value>)',
          800: 'rgb(var(--tap-800) / <alpha-value>)',
          900: 'rgb(var(--tap-900) / <alpha-value>)',
        },
        // Login/CTA dərin mavi
        // `royal` — brendin tünd variantı (CTA/login). O da temadan qidalanır.
        royal: {
          DEFAULT: 'rgb(var(--tap-600) / <alpha-value>)',
          50:  'rgb(var(--tap-50) / <alpha-value>)',
          100: 'rgb(var(--tap-100) / <alpha-value>)',
          500: 'rgb(var(--tap-600) / <alpha-value>)',
          600: 'rgb(var(--tap-700) / <alpha-value>)',
          700: 'rgb(var(--tap-800) / <alpha-value>)',
        },
        // Search açıq mavi background
        sky: {
          search: 'rgb(var(--tap-100) / <alpha-value>)',
        },
        // Tünd akssent — «N elan göstər» kimi son-addım CTA-ları üçün.
        // Brend rəngi ilə yarışmasın deyə neytral-tünd, bənövşəyiyə çalan.
        onyx: { DEFAULT: '#1A1416', 600: '#2B2226' },
        // Status
        success: { DEFAULT: '#00C853', light: '#E6F7E6' },
        warning: { DEFAULT: '#FFAB00', light: '#FFF4E6' },
        danger:  { DEFAULT: '#E53935', light: '#FFEBEE' },
        gold:    { DEFAULT: '#FFD600', light: '#FFF9C4' },

        // Greyscale (Avito style)
        ink: {
          50:  '#FAFAFA',
          100: '#F2F3F5',  // səhifə arxa fonu
          200: '#E5E7EB',  // border
          300: '#D1D5DB',
          400: '#9CA3AF',  // muted text
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.06)',
        'card': '0 2px 8px 0 rgba(0,0,0,0.06)',
        'menu': '0 8px 24px -4px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
export default config;
