import Link from 'next/link';

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Kateqoriyalar',
    links: [
      { label: 'Nəqliyyat', href: '/elanlar?category=neqliyyat' },
      { label: 'Daşınmaz əmlak', href: '/elanlar?category=dasinmaz-emlak' },
      { label: 'Elektronika', href: '/elanlar?category=elektronika' },
      { label: 'İş elanları', href: '/elanlar?category=is-elanlari' },
      { label: 'Ev və bağ', href: '/elanlar?category=ev-bag' },
      { label: 'Xidmətlər', href: '/elanlar?category=xidmetler' },
    ],
  },
  {
    title: 'Regionlar',
    links: [
      { label: 'Bakı', href: '/elanlar?region=baki' },
      { label: 'Gəncə', href: '/elanlar?region=gence' },
      { label: 'Sumqayıt', href: '/elanlar?region=sumqayit' },
      { label: 'Qəbələ', href: '/elanlar?region=qebele' },
      { label: 'Lənkəran', href: '/elanlar?region=lenkeran' },
      { label: 'Bütün regionlar', href: '/elanlar' },
    ],
  },
  {
    title: '360tap.az',
    links: [
      { label: 'Bütün elanlar', href: '/elanlar' },
      { label: 'AI ilə elan yarat', href: '/ai-elan' },
      { label: 'Şəkillə axtar', href: '/sekille-axtar' },
      { label: 'Elan yerləşdir', href: '/elan-yerlesdir' },
      { label: 'Biznes üçün', href: '/biznes' },
    ],
  },
  {
    title: 'Kömək',
    links: [
      { label: 'Yardım mərkəzi', href: '/komek' },
      { label: 'Karyera', href: '/karyera' },
      { label: 'İstifadə qaydaları', href: '/qaydalar' },
      { label: 'Məxfilik siyasəti', href: '/mexfilik' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink-50 dark:bg-ink-900 border-t border-ink-200 dark:border-ink-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-bold text-ink-900 dark:text-white text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2 text-sm text-ink-600 dark:text-ink-400">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-tap transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-ink-200 dark:border-ink-800 text-xs text-ink-500">
          <p className="font-bold text-ink-700 dark:text-ink-300">360tap.az — Azərbaycanda region-first elanlar və ticarət platforması.</p>
          <p className="mt-1">© 2026 360tap.az — Bütün hüquqlar qorunur.</p>
        </div>
      </div>
    </footer>
  );
}
