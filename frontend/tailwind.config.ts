import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Avito-style brand
        tap: {
          DEFAULT: '#00AAFF',
          50:  '#E6F7FF',
          100: '#CCEFFF',
          200: '#99DEFF',
          300: '#66CEFF',
          400: '#33BEFF',
          500: '#00AAFF',
          600: '#0090DD',
          700: '#0076B8',
          800: '#005C92',
          900: '#003F66',
        },
        // Login/CTA dərin mavi
        royal: {
          DEFAULT: '#0060F0',
          50:  '#E6F0FE',
          100: '#CCDFFE',
          500: '#0060F0',
          600: '#0050D0',
          700: '#0040B0',
        },
        // Search açıq mavi background
        sky: {
          search: '#A5DDFE',
        },
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
