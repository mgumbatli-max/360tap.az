import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { ModeProvider } from '@/lib/mode';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BrandPicker from '@/components/BrandPicker';
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
  // SEO: BURADA MÜTLƏQ `canonical` OLMAMALIDIR.
  // Root layout metadata-sı bütün alt seqmentlərə miras keçir, ona görə `canonical: SITE.url`
  // hər səhifəni — elan detalı daxil — özünü ANA SƏHİFƏ elan etməyə məcbur edirdi
  // (hər cavabda `<link rel="canonical" href="https://360tap.az"/>`). Nəticədə axtarış
  // motorları üçün bütün sayt tək bir URL-ə yığılırdı: alt səhifələr indeksdən düşür.
  // Canonical artıq hər səhifənin ÖZ metadata-sında qurulur (`buildMetadata({ path })`).
  //
  // `alternates.languages` BLOKU TAMAMİLƏ SİLİNDİ. O, hər səhifədə üç hreflang elan
  // edirdi: `az-AZ` → ANA SƏHİFƏ (yəni elan detalı özünü ana səhifənin az variantı
  // sayırdı), `ru-RU` → /ru və `en-US` → /en — hər ikisi 404. Mövcud olmayan
  // dil versiyalarına hreflang vermək axtarış motorlarında xəta yaradır və heç bir
  // fayda vermir. Ru/En real qurulanda hreflang hər səhifə üçün ÖZ yolu ilə
  // (`/ru/elanlar/<id>`) + `x-default` ilə bərpa olunmalı və `buildMetadata`-nın
  // `alternates`-inə də əlavə edilməlidir.
  // DİQQƏT: bura `canonical` GERİ QOYULMAMALIDIR — yuxarıdakı şərh səbəbi izah edir.
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    // `alternateLocale: ['ru_RU','en_US']` silindi — mövcud olmayan dil versiyalarını
    // elan edirdi (yuxarıdakı hreflang qeydi ilə eyni səbəb).
    siteName: '360tap.az',
    title: '360tap.az — Universal elanlar marketplace',
    description: SITE.description,
    url: SITE.url,
    // `images: [/og-default.png]` silindi — həmin fayl `public/`-də YOXDUR (404).
    // Onun yerinə Next-in fayl-konvensiyalı `app/opengraph-image.tsx`-i (işləyir,
    // ~190 KB PNG) qüvvəyə minir və bütün alt marşrutlara miras keçir — bu davranış
    // /biznes, /komek, /ai-elan səhifələrində onsuz da müşahidə olunub.
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
  themeColor: '#E02B31',
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

    // BREND RƏNGİ — boyanmadan ƏVVƏL təyin olunur, əks halda səhifə əvvəl defolt
    // rənglə görünüb sonra «sıçrayardı» (FOUC). ?brand= sorğu açarı localStorage-i
    // üstələyir və dərhal yadda saxlanılır — linki paylaşmaqla temanı göstərmək üçün.
    var ALLOWED = ['qirmizi','benovseyi','goy','zumrud','narinci','firuzeyi'];
    var q = new URLSearchParams(location.search).get('brand');
    var b = ALLOWED.indexOf(q) >= 0 ? q : localStorage.getItem('tap_brand');
    if (ALLOWED.indexOf(b) < 0) b = 'qirmizi';
    if (q && ALLOWED.indexOf(q) >= 0) localStorage.setItem('tap_brand', q);
    document.documentElement.dataset.brand = b;
  } catch(e) {
    document.documentElement.classList.add('light');
    document.documentElement.dataset.mode = 'lite';
    document.documentElement.dataset.brand = 'qirmizi';
  }
})();
// Faza 0 qeydi: burada hər brauzer xətasını /api/clientlog ünvanına göndərən blok var idi.
// Həmin endpoint NestJS-də mövcud deyil (yalnız deploy olunmayan legacy Express-də idi),
// yəni hər xəta əlavə bir 404 sorğusu yaradırdı. Blok çıxarıldı; xətalar brauzer
// konsolunda onsuz da görünür. Real klient-telemetriyası Faza 1-də ayrıca qurulacaq.

// === BACKEND-İ OYAQ SAXLA (Render free cold-start qarşısı) ===
// Səhifə açılan kimi backend oyadılır ki, növbəti naviqasiya soyuq olmasın; sonra hər 10 dəq.
(function() {
  function ping() {
    if (document.visibilityState === 'hidden') return; // gizli tab-larda lazımsız ping yox
    try { fetch('/api/health', { cache: 'no-store' }).catch(function(){}); } catch(e) {}
  }
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
              {/* Dizayn aləti — yalnız dev-də və ya ?brand-picker=1 ilə görünür. */}
              <BrandPicker />
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
