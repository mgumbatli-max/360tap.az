import Link from 'next/link';

const FOOTER_COLS = [
  {
    title: 'Avadanlıq',
    links: ['Avadanlıq biznes üçün', 'Alətlər', 'Avadanlıq icarəsi', 'Quraşdırma'],
  },
  {
    title: 'Tikinti materialları',
    links: ['Tikinti materialları', 'Santexnika', 'Qapılar', 'Tavanlar', 'Bağ üçün'],
  },
  {
    title: 'Məhsullar',
    links: ['Elektronika', 'Geyim, ayaqqabı', 'Uşaq mallar və oyuncaqlar', 'Gözəllik və sağlamlıq', 'Ev üçün'],
  },
  {
    title: 'Bütün ofis üçün',
    links: ['Noutbuklar', 'Stolüstü kompüter', 'Kompüter masaları', 'Texniki dəstək'],
  },
  {
    title: 'Xidmətlər',
    links: ['Logistika', 'İş xidmətləri', 'Təmir və quraşdırma', 'Texnika xidməti', 'Məişət xidmətləri'],
  },
  {
    title: 'Nəqliyyat',
    links: ['Avtomobil', 'Yük və xüsusi texnika', 'Su nəqliyyatı', 'Ehtiyat hissələri', 'Avtoservis'],
  },
];

const APP_STORES = [
  { name: 'App Store', icon: '' },
  { name: 'Google Play', icon: '▶' },
  { name: 'Galaxy Store', icon: '◯' },
  { name: 'AppGallery', icon: '◇' },
];

export default function Footer() {
  return (
    <footer className="bg-ink-50 border-t border-ink-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-bold text-ink-900 text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2 text-sm text-ink-600">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link href="#" className="hover:text-tap transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-ink-200">
          <h4 className="font-bold text-ink-900 text-sm mb-3">Tətbiqi yüklə</h4>
          <p className="text-sm text-ink-600 mb-3">Müvafiq mağazadan və ya birbaşa saytdan APK-faylı.</p>
          <div className="flex flex-wrap gap-2">
            {APP_STORES.map((s) => (
              <button key={s.name} className="btn-secondary text-sm flex items-center gap-2">
                <span className="text-base">{s.icon}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-ink-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-ink-500">
          <div>
            <p>360tap.az — Azərbaycan elanlar saytı.</p>
            <p className="mt-1">© 2026 — Bütün hüquqlar qorunur. <Link href="/qaydalar" className="hover:text-tap">İstifadə qaydaları</Link>. <Link href="/mexfilik" className="hover:text-tap">Məxfilik siyasəti</Link>.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#" aria-label="Facebook" className="w-8 h-8 rounded-full bg-white border border-ink-200 hover:border-tap hover:text-tap flex items-center justify-center font-bold">f</Link>
            <Link href="#" aria-label="Instagram" className="w-8 h-8 rounded-full bg-white border border-ink-200 hover:border-tap hover:text-tap flex items-center justify-center font-bold">ig</Link>
            <Link href="#" aria-label="Telegram" className="w-8 h-8 rounded-full bg-white border border-ink-200 hover:border-tap hover:text-tap flex items-center justify-center font-bold">t</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
