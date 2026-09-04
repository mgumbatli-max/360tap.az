'use client';
import Link from 'next/link';
import CategoryIcon from './CategoryIcon';
import { useState, useEffect, useRef, useId } from 'react';
import {
  Car, Home, Briefcase, Smartphone, Sofa, Shirt, Baby, PawPrint, Drill,
  Dumbbell, Building2, Sprout, Wrench, Package,
  ChevronRight, ArrowLeft, X, Sparkles, Camera, Scale,
} from 'lucide-react';

type IconCmp = React.ComponentType<{ className?: string }>;

// Backend `icon` sahəsi ("car", "sprout"...) əsas mənbədir; slug xəritəsi isə
// icon-suz gələn köhnə Express cavabları üçün ehtiyat yoldur.
const ICONS_BY_NAME: Record<string, IconCmp> = {
  car: Car,
  home: Home,
  briefcase: Briefcase,
  smartphone: Smartphone,
  sofa: Sofa,
  shirt: Shirt,
  baby: Baby,
  paw: PawPrint,
  drill: Drill,
  dumbbell: Dumbbell,
  building: Building2,
  sprout: Sprout,
  wrench: Wrench,
};

const ICONS: Record<string, IconCmp> = {
  neqliyyat: Car,
  'dasinmaz-emlak': Home,
  'is-elanlari': Briefcase,
  elektronika: Smartphone,
  'ev-bag': Sofa,
  'shexsi-esyalar': Shirt,
  'usaq-alemi': Baby,
  heyvanlar: PawPrint,
  'tikinti-temir': Drill,
  'hobbi-asude': Dumbbell,
  'biznes-avadanliq': Building2,
  'kend-teserrufati': Sprout,
  xidmetler: Wrench,
};

// Sağ sütun sabitdir — kateqoriyadan asılı deyil, ona görə komponentdən kənarda.
const SERVICES: { href: string; label: string; Icon: IconCmp }[] = [
  { href: '/ai-elan', label: 'AI ilə elan yarat', Icon: Sparkles },
  { href: '/sekille-axtar', label: 'Şəkillə axtar', Icon: Camera },
  { href: '/muqayise', label: 'Müqayisə', Icon: Scale },
  { href: '/biznes', label: 'Biznes üçün', Icon: Building2 },
];

// Spesifikasiya §4: qrupda 6-dan çox leaf varsa 5-i göstərilir, qalanı «Daha N».
const LEAF_LIMIT = 5;

type CatNode = {
  id: string;
  slug: string;
  name_az?: string; // köhnə Express
  nameAz?: string; // NestJS
  icon?: string;
  children?: CatNode[];
};

const catName = (c: CatNode): string => c.nameAz ?? c.name_az ?? '';

const catHref = (c: CatNode) => `/elanlar?category=${c.slug}`;

const iconOf = (c: CatNode): IconCmp =>
  (c.icon ? ICONS_BY_NAME[c.icon] : undefined) ?? ICONS[c.slug] ?? Package;

const kids = (c?: CatNode): CatNode[] => c?.children ?? [];

export default function MegaMenu({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: CatNode[];
}) {
  const [active, setActive] = useState<string | null>(null);
  // Mobil drawer ikisəviyyəlidir: null = kök siyahı, slug = həmin kökün alt siyahısı.
  const [mobileRoot, setMobileRoot] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rootBtns = useRef<(HTMLButtonElement | null)[]>([]);
  const panelId = useId();

  // Esc + çöl klik (mövcud davranış — toxunulmadı)
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onEsc);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose]);

  // Aktiv kök hər açılışda birinciyə qayıdır. Listener effektindən ayrıdır ki,
  // Header-in yenidən render-i (yeni onClose identity) seçimi sıfırlamasın.
  useEffect(() => {
    if (!open) {
      setMobileRoot(null);
      return;
    }
    if (categories.length > 0) setActive(categories[0].slug);
  }, [open, categories]);

  if (!open) return null;

  const activeNode = categories.find((c) => c.slug === active);
  const subs = kids(activeNode);
  // Taksonomiya qarışıqdır: bəzi kökün nəvələri var (qruplu düzüm), bəzilərinin yox
  // (o zaman alt kateqoriyalar birbaşa leaf kimi sütunlara paylanır).
  const grouped = subs.some((s) => kids(s).length > 0);

  const mobileNode = categories.find((c) => c.slug === mobileRoot);

  // Ox düymələri kök siyahısını gəzir; fokus onFokus vasitəsilə aktivi dəyişdiyi üçün
  // burada yalnız fokusu köçürmək kifayətdir.
  const onRootKey = (e: React.KeyboardEvent, i: number) => {
    const last = categories.length - 1;
    let next: number;
    if (e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
    else if (e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else if (e.key === 'ArrowRight') {
      e.preventDefault();
      panelRef.current?.querySelector('a')?.focus();
      return;
    } else return;
    e.preventDefault();
    rootBtns.current[next]?.focus();
  };

  const rootRow = (c: CatNode, isActive: boolean) => {
    return (
      <>
        {/* Vahid `CategoryIcon` — mega-menyu, ana səhifə plitələri və kateqoriya
            landinqi indi EYNİ ikon və rəng sistemindən qidalanır. Əvvəl hər yerin
            öz xəritəsi vardı və eyni kateqoriya səhifədən-səhifəyə fərqli ikon alırdı. */}
        <CategoryIcon slug={c.slug} name={catName(c)} size="sm" />
        <span className="flex-1 truncate">{catName(c)}</span>
        <ChevronRight
          className={`w-4 h-4 shrink-0 ${isActive ? 'text-ink-500 dark:text-ink-400' : 'text-ink-300 dark:text-ink-600'}`}
        />
      </>
    );
  };

  const leafLink = (c: CatNode, className: string) => (
    <Link
      key={c.id}
      href={catHref(c)}
      onClick={onClose}
      className={`${className} rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-tap`}
    >
      {catName(c)}
    </Link>
  );

  return (
    <div ref={ref}>
      {/* ===== DESKTOP: üç sütunlu panel (§4) ===== */}
      <div className="hidden md:block absolute left-0 right-0 top-full z-50 animate-slide-down">
        <div className="mx-auto max-w-[1360px] px-6">
          <div
            className="grid md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)_300px]
                       overflow-hidden rounded-b-[24px] bg-white dark:bg-ink-900 shadow-menu"
          >
            {/* Sol: kök kateqoriyalar.
                border-ink-100 QƏSDƏN işlədilmir — globals.css-də `.dark .border-ink-100`
                qaydası bütün elementə opacity:.5 verir və sütunu solğunlaşdırardı. */}
            <div className="max-h-[70vh] overflow-y-auto border-r border-ink-200 dark:border-ink-800 p-2">
              {categories.map((c, i) => {
                const isActive = c.slug === active;
                return (
                  <button
                    key={c.id}
                    type="button"
                    ref={(el) => {
                      rootBtns.current[i] = el;
                    }}
                    // Avito-da sətir klik gözləmədən hover/fokusla aktivləşir.
                    onMouseEnter={() => setActive(c.slug)}
                    onFocus={() => setActive(c.slug)}
                    onKeyDown={(e) => onRootKey(e, i)}
                    onClick={() => setActive(c.slug)}
                    aria-current={isActive ? 'true' : undefined}
                    aria-controls={panelId}
                    // Fon siniflərində şəffaflıq şəkilçisi (/60, /70) var, çünki globals.css-dəki
                    // `.dark .bg-ink-200 { ... !important }` qaydaları yalnız şəkilçisiz sinif
                    // adına düşür — belədə `dark:` variantı həqiqətən işə düşür və panel fonundan
                    // AÇIQ (yüksəlmiş) seçim rəngi alınır, qaranlıq deyil.
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-tap
                      ${
                        isActive
                          ? 'bg-ink-200/60 dark:bg-ink-800 font-semibold text-ink-900 dark:text-white'
                          : 'text-ink-700 dark:text-ink-200 hover:bg-ink-100/70 dark:hover:bg-ink-800/60'
                      }`}
                  >
                    {rootRow(c, isActive)}
                  </button>
                );
              })}
            </div>

            {/* Orta: alt qruplar 3 sütunda */}
            <div
              id={panelId}
              ref={panelRef}
              className="max-h-[70vh] min-w-0 overflow-y-auto px-6 py-5"
            >
              {!activeNode ? (
                <p className="text-sm text-ink-400 dark:text-ink-500">Kateqoriyalar yüklənir…</p>
              ) : grouped ? (
                /* CSS multi-column: qruplar hündürlüyünə görə balanslaşır (grid-də
                   ən hündür qrup bütün sətri uzadar və Avito-dakı sıx düzüm pozulardı). */
                <div className="columns-2 xl:columns-3 gap-x-8">
                  {subs.map((g) => {
                    const leaves = kids(g);
                    const shown = leaves.length > LEAF_LIMIT + 1 ? leaves.slice(0, LEAF_LIMIT) : leaves;
                    const rest = leaves.length - shown.length;
                    return (
                      <div key={g.id} className="mb-6 break-inside-avoid">
                        <Link
                          href={catHref(g)}
                          onClick={onClose}
                          className="mb-2 flex items-center gap-1 rounded text-[15px] font-bold text-ink-900 dark:text-white
                                     hover:text-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
                        >
                          <span className="min-w-0 truncate">{catName(g)}</span>
                          <ChevronRight className="w-4 h-4 shrink-0 text-ink-300 dark:text-ink-600" />
                        </Link>
                        <div className="flex flex-col">
                          {shown.map((leaf) =>
                            leafLink(leaf, 'py-1 text-sm text-ink-600 dark:text-ink-300 hover:text-tap'),
                          )}
                          {rest > 0 && (
                            <Link
                              href={catHref(g)}
                              onClick={onClose}
                              className="py-1 text-sm font-semibold text-tap rounded
                                         focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
                            >
                              Daha {rest}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : subs.length > 0 ? (
                <>
                  {/* Nəvə yoxdursa kökün öz adı qrup başlığı rolunu oynayır. */}
                  <Link
                    href={catHref(activeNode)}
                    onClick={onClose}
                    className="mb-3 flex items-center gap-1 rounded text-[15px] font-bold text-ink-900 dark:text-white
                               hover:text-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
                  >
                    <span className="min-w-0 truncate">{catName(activeNode)}</span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-ink-300 dark:text-ink-600" />
                  </Link>
                  <div className="columns-2 xl:columns-3 gap-x-8">
                    {subs.map((leaf) =>
                      leafLink(
                        leaf,
                        'block break-inside-avoid py-1.5 text-sm text-ink-600 dark:text-ink-300 hover:text-tap',
                      ),
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-400 dark:text-ink-500">
                  Bu bölmədə alt kateqoriya yoxdur
                </p>
              )}
            </div>

            {/* Sağ: Servislər (md-də yer çatmadığı üçün lg-dən görünür) */}
            <div className="hidden lg:block max-h-[70vh] overflow-y-auto p-4">
              <ServicesBox onClose={onClose} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBİL: tam ekran, iki səviyyəli drawer (§11) ===== */}
      <div className="md:hidden fixed inset-0 z-[60] flex flex-col bg-white dark:bg-ink-900 animate-fade-in">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-ink-200 dark:border-ink-800 px-4">
          {mobileNode ? (
            <button
              type="button"
              onClick={() => setMobileRoot(null)}
              aria-label="Geri"
              className="-ml-2 rounded-lg p-2 text-ink-700 dark:text-ink-200 hover:bg-ink-100/70 dark:hover:bg-ink-800/60
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}
          <span className="min-w-0 flex-1 truncate text-base font-bold text-ink-900 dark:text-white">
            {mobileNode ? catName(mobileNode) : 'Bütün kateqoriyalar'}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Menyunu bağla"
            className="-mr-2 rounded-lg p-2 text-ink-700 dark:text-ink-200 hover:bg-ink-100/70 dark:hover:bg-ink-800/60
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {!mobileNode ? (
            <>
              <div className="flex flex-col">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setMobileRoot(c.slug)}
                    className="flex items-center gap-3 rounded-xl px-2 py-3 text-left text-[15px] text-ink-800 dark:text-ink-100
                               hover:bg-ink-100/70 dark:hover:bg-ink-800/60
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
                  >
                    {rootRow(c, false)}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <ServicesBox onClose={onClose} />
              </div>
            </>
          ) : (
            <div className="flex flex-col">
              <Link
                href={catHref(mobileNode)}
                onClick={onClose}
                className="rounded-xl px-2 py-3 text-[15px] font-bold text-tap
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
              >
                Bütün «{catName(mobileNode)}» elanları
              </Link>
              {kids(mobileNode).map((sub) => {
                const leaves = kids(sub);
                return (
                  <div key={sub.id} className="border-t border-ink-200 dark:border-ink-800 py-2">
                    <Link
                      href={catHref(sub)}
                      onClick={onClose}
                      className="block rounded px-2 py-2 text-[15px] font-bold text-ink-900 dark:text-white
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
                    >
                      {catName(sub)}
                    </Link>
                    {leaves.map((leaf) =>
                      leafLink(
                        leaf,
                        'block px-2 py-2 text-sm text-ink-600 dark:text-ink-300 hover:text-tap',
                      ),
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ServicesBox({ onClose }: { onClose: () => void }) {
  return (
    <div className="rounded-2xl bg-tap-50 dark:bg-tap-900/20 p-4">
      <h4 className="mb-3 px-1 text-[15px] font-bold text-ink-900 dark:text-white">Servislər</h4>
      <div className="flex flex-col gap-1">
        {SERVICES.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-1.5 py-2 text-sm text-ink-700 dark:text-ink-200
                       hover:text-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-ink-800">
              <Icon className="w-4 h-4 text-tap" />
            </span>
            <span className="min-w-0 truncate">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
