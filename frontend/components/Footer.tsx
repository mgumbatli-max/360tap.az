import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, Facebook, Instagram, MessageCircle, Send } from 'lucide-react';

type FooterLink = { label: string; href: string };

// Klaviatura fokusu Header ilə eyni cür görünsün deyə həmin halqa sinfi təkrarlanır
// (offset rəngi footer fonuna görə ink-100-dir, əks halda halqa fonla qarışır).
const RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-tap focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-ink-100 dark:focus-visible:ring-offset-ink-900';

const ROW_ITEM =
  'inline-flex items-center gap-1 rounded text-ink-700 dark:text-ink-200 hover:text-tap transition-colors';

const PANEL =
  'z-40 mt-2 w-[220px] max-w-[calc(100vw-3rem)] rounded-xl border border-ink-200 dark:border-ink-700 ' +
  'bg-white dark:bg-ink-800 p-2 shadow-menu ' +
  // Mobildə açılan panel axın daxilində qalır — mütləq yerləşdirmə dar ekranda
  // sağa daşıb üfüqi sürüşmə yaradırdı. md-dən yuxarı isə adi dropdown olur.
  'md:absolute md:bottom-full md:right-0 md:mt-0 md:mb-2';

const PANEL_LINK =
  'block rounded-lg px-3 py-2 text-[14px] text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 hover:text-tap';

// Avito modelində footer tək sətirlik keçid zolağıdır. Köhnə 4 sütunun heç bir
// ünvanı itməsin deyə sütun məzmunu aşağıdakı «Regionlar»/«Daha» açılanlarına köçürülüb.
const PRIMARY: FooterLink[] = [
  { label: 'Kömək', href: '/komek' },
  { label: 'Təhlükəsizlik', href: '/qaydalar' },
  { label: 'Reklam', href: '/reklam' },
  { label: 'Biznes üçün', href: '/biznes' },
  { label: 'Şirkət haqqında', href: '/elaqe' },
  { label: 'Karyera', href: '/karyera' },
];

const REGIONS: FooterLink[] = [
  { label: 'Bakı', href: '/elanlar?region=baki' },
  { label: 'Gəncə', href: '/elanlar?region=gence' },
  { label: 'Sumqayıt', href: '/elanlar?region=sumqayit' },
  { label: 'Qəbələ', href: '/elanlar?region=qebele' },
  { label: 'Lənkəran', href: '/elanlar?region=lenkeran' },
  { label: 'Bütün regionlar', href: '/elanlar' },
];

const MORE: { title: string; links: FooterLink[] }[] = [
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
    title: '360tap.az',
    links: [
      { label: 'Bütün elanlar', href: '/elanlar' },
      { label: 'AI ilə elan yarat', href: '/ai-elan' },
      { label: 'Şəkillə axtar', href: '/sekille-axtar' },
      { label: 'Elan yerləşdir', href: '/elan-yerlesdir' },
    ],
  },
];

type Social = { label: string; href?: string; Icon: LucideIcon };

// Ölü «#» link göstərməmək üçün sosial hesablar env-dən oxunur və ünvanı olmayan
// ikon ümumiyyətlə render olunmur. WhatsApp-ın ehtiyat ünvanı WhatsAppFloat
// komponentindəki mövcud dəstək nömrəsidir — yeni ünvan uydurulmur.
const SOCIAL: Social[] = (
  [
    {
      label: 'WhatsApp',
      href: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP ?? 'https://wa.me/994500000000',
      Icon: MessageCircle,
    },
    { label: 'Telegram', href: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM, Icon: Send },
    { label: 'Instagram', href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, Icon: Instagram },
    { label: 'Facebook', href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK, Icon: Facebook },
  ] satisfies Social[]
).filter((s) => Boolean(s.href));

// Açılan siyahılar JS-siz <details> üzərində qurulub: komponent server komponenti
// olaraq qalır və summary klaviatura ilə onsuz da fokuslanıb açılır.
function FooterDropdown({
  label,
  panelClassName = '',
  children,
}: {
  label: string;
  panelClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group relative">
      <summary
        className={`${ROW_ITEM} ${RING} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        {label}
        <ChevronDown
          className="h-4 w-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className={`${PANEL} ${panelClassName}`}>{children}</div>
    </details>
  );
}

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-ink-200 dark:border-ink-800 bg-ink-100 dark:bg-ink-900">
      <div className="mx-auto w-full max-w-[1360px] px-4 md:px-6 py-10">
        {/* 1 — tək sətirlik sarılan keçid zolağı */}
        <nav
          aria-label="Sayt keçidləri"
          className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px] font-medium"
        >
          {PRIMARY.map((l) => (
            <Link key={l.href} href={l.href} className={`${ROW_ITEM} ${RING}`}>
              {l.label}
            </Link>
          ))}

          <FooterDropdown label="Regionlar">
            {REGIONS.map((l) => (
              <Link key={l.href} href={l.href} className={PANEL_LINK}>
                {l.label}
              </Link>
            ))}
          </FooterDropdown>

          <FooterDropdown
            label="Daha"
            panelClassName="md:w-[260px] max-h-[60vh] overflow-y-auto"
          >
            {MORE.map((group) => (
              <div key={group.title} className="mb-1 last:mb-0">
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                  {group.title}
                </p>
                {group.links.map((l) => (
                  <Link key={l.href} href={l.href} className={PANEL_LINK}>
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </FooterDropdown>
        </nav>

        {/* 2 — hüquqi paraqraf */}
        <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
          360tap.az — Azərbaycanda region-first elanlar və ticarət platforması. Saytdan istifadə
          etməklə{' '}
          <Link
            href="/qaydalar"
            className={`${RING} rounded underline underline-offset-2 text-ink-700 dark:text-ink-200 hover:text-tap`}
          >
            İstifadə qaydaları
          </Link>{' '}
          və{' '}
          <Link
            href="/mexfilik"
            className={`${RING} rounded underline underline-offset-2 text-ink-700 dark:text-ink-200 hover:text-tap`}
          >
            Məxfilik siyasəti
          </Link>{' '}
          ilə razılaşmış olursunuz. © 2026 360tap.az — bütün hüquqlar qorunur.
        </p>

        {/* 3 — sosial dairələr */}
        {SOCIAL.length > 0 && (
          <ul className="mt-6 flex flex-wrap items-center gap-3">
            {SOCIAL.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`360tap.az — ${label}`}
                  title={label}
                  className={`${RING} flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-white transition-colors hover:bg-tap dark:bg-ink-800 dark:hover:bg-tap`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
