import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { ModeProvider } from '@/lib/mode';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CompareBar from '@/components/CompareBar';
import FloatingVoiceFAB from '@/components/FloatingVoiceFAB';
import BackToTop from '@/components/BackToTop';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import CommandPalette from '@/components/CommandPalette';
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import AIAssistantChat from '@/components/AIAssistantChat';
import { SITE, jsonLdOrganization, jsonLdWebSite, jsonLdScript } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: '360tap.az — Azərbaycanda elanlar, alqı-satqı və xidmətlər',
    template: '%s | 360tap.az',
  },
  description: SITE.description,
  keywords: SITE.keywords,
  manifest: '/manifest.webmanifest',
  applicationName: '360tap.az',
  authors: [{ name: '360tap.az komandası', url: SITE.url }],
  creator: '360tap.az',
  publisher: '360tap.az',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: SITE.url,
    languages: {
      'az-AZ': SITE.url,
      'ru-RU': `${SITE.url}/ru`,
      'en-US': `${SITE.url}/en`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    alternateLocale: ['ru_RU', 'en_US'],
    siteName: '360tap.az',
    title: '360tap.az — Universal elanlar marketplace',
    description: SITE.description,
    url: SITE.url,
    images: [{ url: `${SITE.url}/og-default.png`, width: 1200, height: 630, alt: '360tap.az' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitter,
    title: '360tap.az',
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true, follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFY,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFY,
  },
  category: 'classifieds',
};

export const viewport: Viewport = {
  themeColor: '#00AAFF',
  width: 'device-width',
  initialScale: 1,
};

const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('avito_theme') || 'light';
    var c = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    document.documentElement.classList.add(c);
    var m = localStorage.getItem('tap_mode') || 'lite';
    document.documentElement.dataset.mode = (m === 'pro' || m === 'lite') ? m : 'lite';
  } catch(e) {
    document.documentElement.classList.add('light');
    document.documentElement.dataset.mode = 'lite';
  }
})();
// === BRAUZER XƏTASINI SERVER-Ə GÖNDƏR ===
(function() {
  function send(error, stack, type) {
    try {
      fetch('/api/clientlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: String(error), stack: stack, type: type, url: location.href, userAgent: navigator.userAgent })
      }).catch(function(){});
    } catch(e) {}
  }
  window.addEventListener('error', function(e) { send(e.message, e.error && e.error.stack, 'window.error'); });
  window.addEventListener('unhandledrejection', function(e) { send(e.reason, e.reason && e.reason.stack, 'promise.reject'); });
})();
// === BACKEND-İ OYAQ SAXLA (Render free cold-start qarşısı) ===
// Səhifə açılan kimi backend oyadılır ki, növbəti naviqasiya soyuq olmasın; sonra hər 10 dəq.
(function() {
  function ping() { try { fetch('/api/health', { cache: 'no-store' }).catch(function(){}); } catch(e) {} }
  ping();
  setInterval(ping, 600000);
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-ink-100 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(jsonLdOrganization())}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(jsonLdWebSite())}
        />
        <ToastProvider>
          <ModeProvider>
            <AuthProvider>
              <Header />
              <main className="bg-ink-50 min-h-screen">{children}</main>
              <Footer />
              <div data-pro-only="true"><CompareBar /></div>
              <BackToTop />
              <WhatsAppFloat />
              {/* <FloatingVoiceFAB /> Safari debug */}
              {/* Müvəqqəti deinaktiv — debug üçün */}
              {/* <CommandPalette /> */}
              {/* <KeyboardShortcutsHelp /> */}
              {/* <PWAInstallBanner /> */}
              {/* <AIAssistantChat /> */}
            </AuthProvider>
          </ModeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
