'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  Heart, Search, Menu, ChevronDown, User2, Plus, LogOut, Camera, X, Lock, ShoppingCart,
} from 'lucide-react';
import Logo from './Logo';
import MegaMenu from './MegaMenu';
import AuthModal from './AuthModal';
import CityPicker from './CityPicker';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

// Klaviatura fokusu hər interaktiv elementdə eyni cür görünsün deyə vahid halqa sinfi.
const RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-tap focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink-900';

// «Bütün kateqoriyalar» düyməsinin 9-nöqtəli grid işarəsi: lucide-də dəqiq qarşılığı yoxdur,
// ona görə öz SVG-mizi çəkirik — kənar brendin ikonu təkrar istehsal olunmur.
function GridDotsIcon({ className = '' }: { className?: string }) {
  const axis = [4, 10, 16];
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      {axis.flatMap((y) => axis.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" />))}
    </svg>
  );
}

// Utility sətrindəki açılan panellər bir-birini bağlasın deyə tək state ilə idarə olunur.
type UtilMenu = 'biznes' | 'kataloq' | 'user' | null;

const UTIL_LINK =
  'inline-flex items-center gap-1 rounded px-1 py-0.5 text-ink-600 dark:text-ink-300 hover:text-tap';
const DROP_PANEL =
  'absolute top-full mt-2 min-w-[200px] rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 shadow-menu py-1.5 z-50 animate-slide-down';
const DROP_ITEM =
  'block px-4 py-2 text-[13px] text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700';

export default function Header({ section }: { section?: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [megaOpen, setMegaOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [utilMenu, setUtilMenu] = useState<UtilMenu>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const utilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // NestJS: { data:[...] }; köhnə Express: { categories:[...] }
    api('/categories')
      .then((d: any) => setCategories(d.data || d.categories || []))
      .catch(() => setCategories([]));
  }, []);

  // Çöl klik və Esc utility panellərini bağlayır (mega-menyu öz bağlanmasını özü idarə edir).
  useEffect(() => {
    if (!utilMenu) return;
    const onDown = (e: MouseEvent) => {
      if (utilRef.current && !utilRef.current.contains(e.target as Node)) setUtilMenu(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUtilMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [utilMenu]);

  const toggleUtil = (m: Exclude<UtilMenu, null>) => setUtilMenu((cur) => (cur === m ? null : m));

  const openLogin = () => {
    setAuthMode('login');
    setAuthOpen(true);
  };
  const openRegister = () => {
    setAuthMode('register');
    setAuthOpen(true);
  };
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/elanlar${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };
  // Elan yerləşdirmə girişsiz mümkün deyil — link kimi qalır, amma qonağa modal açırıq.
  const guardPost = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openLogin();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-ink-900 border-b border-ink-200/70 dark:border-ink-700">
        {/* === 1-ci sətir: utility (yalnız ≥1024px, 40px) === */}
        <div className="hidden lg:block border-b border-ink-100 dark:border-ink-800">
          <div
            ref={utilRef}
            className="mx-auto max-w-[1360px] px-6 h-10 flex items-center justify-between text-[13px]"
          >
            {/* Sol: xidmət keçidləri */}
            <nav className="flex items-center gap-5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleUtil('biznes')}
                  aria-expanded={utilMenu === 'biznes'}
                  aria-haspopup="true"
                  className={`${UTIL_LINK} ${RING}`}
                >
                  Biznes üçün
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${utilMenu === 'biznes' ? 'rotate-180' : ''}`}
                  />
                </button>
                {utilMenu === 'biznes' && (
                  <div className={`${DROP_PANEL} left-0`}>
                    <Link href="/biznes" onClick={() => setUtilMenu(null)} className={DROP_ITEM}>
                      Biznes 360
                    </Link>
                    <Link href="/reklam" onClick={() => setUtilMenu(null)} className={DROP_ITEM}>
                      Reklam
                    </Link>
                    <Link href="/elan-yerlesdir" onClick={(e) => { setUtilMenu(null); guardPost(e); }} className={DROP_ITEM}>
                      Mağaza elanı yerləşdir
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/karyera" className={`${UTIL_LINK} ${RING}`}>Karyera</Link>
              <Link href="/komek" className={`${UTIL_LINK} ${RING}`}>Kömək</Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleUtil('kataloq')}
                  aria-expanded={utilMenu === 'kataloq'}
                  aria-haspopup="true"
                  className={`${UTIL_LINK} ${RING}`}
                >
                  Kataloqlar
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${utilMenu === 'kataloq' ? 'rotate-180' : ''}`}
                  />
                </button>
                {utilMenu === 'kataloq' && (
                  <div className={`${DROP_PANEL} left-0 max-h-[70vh] overflow-y-auto`}>
                    {categories.slice(0, 10).map((c: any) => (
                      <Link
                        key={c.id}
                        href={`/elanlar?category=${c.slug}`}
                        onClick={() => setUtilMenu(null)}
                        className={DROP_ITEM}
                      >
                        {c.nameAz ?? c.name_az}
                      </Link>
                    ))}
                    <Link
                      href="/elanlar"
                      onClick={() => setUtilMenu(null)}
                      className={`${DROP_ITEM} border-t border-ink-100 dark:border-ink-700 mt-1 pt-2 font-semibold text-tap`}
                    >
                      Bütün elanlar
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            {/* Sağ: sevimlilər · səbət · giriş · elan yerləşdir */}
            <div className="flex items-center gap-3">
              <ThemeToggle />

              <Link
                href={user ? '/profil/sevimliler' : '#'}
                onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }}
                aria-label="Sevimlilər"
                title="Sevimlilər"
                className={`p-1.5 rounded-lg text-ink-600 dark:text-ink-300 hover:text-tap hover:bg-ink-50 dark:hover:bg-ink-800 ${RING}`}
              >
                <Heart className="w-[18px] h-[18px]" />
              </Link>

              <Link
                href={user ? '/profil/sebet' : '#'}
                onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }}
                aria-label="Səbət"
                title="Səbət"
                className={`p-1.5 rounded-lg text-ink-600 dark:text-ink-300 hover:text-tap hover:bg-ink-50 dark:hover:bg-ink-800 ${RING}`}
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
              </Link>

              <NotificationBell />

              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleUtil('user')}
                    aria-expanded={utilMenu === 'user'}
                    aria-haspopup="true"
                    className={`${UTIL_LINK} max-w-[180px] ${RING}`}
                  >
                    <span className="truncate">{user.full_name ?? 'Hesabım'}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${utilMenu === 'user' ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {utilMenu === 'user' && (
                    <div className={`${DROP_PANEL} right-0 w-52`}>
                      <Link
                        href="/profil"
                        onClick={() => setUtilMenu(null)}
                        className={`${DROP_ITEM} flex items-center gap-2`}
                      >
                        <User2 className="w-4 h-4" /> Profil
                      </Link>
                      <Link href="/profil/elanlarim" onClick={() => setUtilMenu(null)} className={DROP_ITEM}>
                        Elanlarım
                      </Link>
                      <Link href="/profil/mesajlar" onClick={() => setUtilMenu(null)} className={DROP_ITEM}>
                        Mesajlar
                      </Link>
                      <button
                        onClick={logout}
                        className={`${DROP_ITEM} w-full text-left flex items-center gap-2 text-danger dark:text-red-400 border-t border-ink-100 dark:border-ink-700 mt-1 pt-2`}
                      >
                        <LogOut className="w-4 h-4" /> Çıxış
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" onClick={openLogin} className={`${UTIL_LINK} ${RING}`}>
                  <Lock className="w-[14px] h-[14px]" />
                  Giriş və qeydiyyat
                </button>
              )}

              {/* Avito-da bu element düymə deyil, 600 çəkili mətn linkidir */}
              <Link
                href={user ? '/elan-yerlesdir' : '#'}
                onClick={guardPost}
                className={`inline-flex items-center gap-1 rounded px-1 py-0.5 font-semibold text-ink-800 dark:text-ink-100 hover:text-tap ${RING}`}
              >
                <Plus className="w-4 h-4" />
                Elan yerləşdir
              </Link>
            </div>
          </div>
        </div>

        {/* === 2-ci sətir: əsas (72px) === */}
        <div className="mx-auto max-w-[1360px] px-4 lg:px-6 h-16 lg:h-[72px] flex items-center gap-2 md:gap-3 lg:gap-4">
          <Link href="/" aria-label="360tap.az — ana səhifə" className={`shrink-0 rounded-lg ${RING}`}>
            <Logo size="responsive" />
          </Link>

          {/* Vertikal səhifələrdə logonun yanında bölmə adı — adi çəkidə */}
          {section && (
            <span className="hidden xl:inline text-lg font-normal leading-none text-ink-700 dark:text-ink-200 shrink-0">
              {section}
            </span>
          )}

          {/* Bütün kateqoriyalar — dolu pill; menyu açıqda ikon X olur */}
          <button
            type="button"
            onClick={() => setMegaOpen(!megaOpen)}
            aria-expanded={megaOpen}
            aria-haspopup="true"
            className={`hidden lg:inline-flex items-center gap-2 shrink-0 h-[52px] px-5 rounded-full bg-tap text-white text-[15px] font-semibold hover:bg-tap-600 ${RING}`}
          >
            {megaOpen ? <X className="w-5 h-5" /> : <GridDotsIcon className="w-5 h-5" />}
            Bütün kateqoriyalar
          </button>

          {/* Axtarış — input + «Tap» düyməsi vahid blok kimi */}
          <form
            onSubmit={submitSearch}
            role="search"
            className="flex flex-1 min-w-0 items-stretch h-11 lg:h-[52px]"
          >
            {/* Fon dəyişəni birbaşa verilir: globals.css qaranlıq rejimdə HƏR `input`-a
                `background: var(--bg-muted) !important` qoyur — çərçivə də eyni dəyişəni
                işlətməsə input ilə arasında görünən tikiş qalır (hər iki temada uyğunlaşır). */}
            <div
              className="flex flex-1 min-w-0 items-center gap-2 pl-3 pr-1.5 rounded-l-lg border-2 border-r-0 border-tap dark:border-tap-400"
              style={{ background: 'var(--bg-muted)' }}
            >
              <Search className="w-4 h-4 lg:w-5 lg:h-5 shrink-0 text-ink-400" aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nə axtarırsız? — AI ilə yazın"
                aria-label="Elan axtar"
                className="flex-1 min-w-0 bg-transparent text-sm lg:text-[15px] text-ink-900 dark:text-white placeholder:text-ink-400 outline-none"
              />
              {/* Şəkillə axtarış ikonu dar ekranda gizlədilir — orada eyni keçid drawer-dədir */}
              <Link
                href="/sekille-axtar"
                title="Şəkillə axtar"
                aria-label="Şəkillə axtar"
                className={`hidden sm:flex shrink-0 p-1.5 rounded-md text-tap hover:bg-tap-50 dark:hover:bg-ink-700 ${RING}`}
              >
                <Camera className="w-5 h-5" />
              </Link>
            </div>
            <button
              type="submit"
              className={`shrink-0 px-3 lg:px-7 rounded-r-lg border-2 border-tap dark:border-tap-400 bg-tap text-white text-sm lg:text-[15px] font-bold hover:bg-tap-600 hover:border-tap-600 ${RING}`}
            >
              Tap
            </button>
          </form>

          {/* Region seçici — sərhədsiz, ikon + mətn */}
          <div className="hidden md:block shrink-0">
            <CityPicker />
          </div>

          {/* <lg: hamburger. Bildiriş zəngi yalnız ≥640px-də — §11-in «logo + axtarış + hamburger»
              sətrini dar telefonda saf saxlayırıq, orada keçid drawer-dədir. */}
          <div className="flex items-center gap-1 shrink-0 lg:hidden">
            <div className="hidden sm:block">
              <NotificationBell />
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Menyu"
              aria-expanded={mobileOpen}
              className={`p-2 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800 ${RING}`}
            >
              <Menu className="w-6 h-6 text-ink-700 dark:text-ink-200" />
            </button>
          </div>
        </div>

        <MegaMenu open={megaOpen} onClose={() => setMegaOpen(false)} categories={categories} />
      </header>

      {/* Mobil drawer menyu — utility sətri gizli olduğuna görə onun bütün keçidləri buradadır */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/40" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-ink-900 p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-extrabold text-ink-900 dark:text-white">Menyu</span>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Bağla"
                  className={`p-2 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800 ${RING}`}
                >
                  <X className="w-5 h-5 text-ink-700 dark:text-ink-200" />
                </button>
              </div>
            </div>

            {/* Mobil əsas sətirdə yer olmadığına görə CTA drawer-in başında dayanır */}
            <Link
              href={user ? '/elan-yerlesdir' : '#'}
              onClick={(e) => { setMobileOpen(false); guardPost(e); }}
              className={`flex items-center justify-center gap-1.5 h-11 rounded-lg bg-tap text-white font-bold mb-4 hover:bg-tap-600 ${RING}`}
            >
              <Plus className="w-4 h-4" /> Elan yerləşdir
            </Link>

            {/* Region seçici mobil əsas sətirdə gizlidir — buradan əlçatandır */}
            <div className="mb-4 md:hidden">
              <CityPicker />
            </div>

            {user ? (
              <div className="space-y-1 mb-4 text-ink-800 dark:text-ink-200">
                <Link href="/profil" onClick={() => setMobileOpen(false)} className="block py-2">Profil</Link>
                <Link href="/profil/elanlarim" onClick={() => setMobileOpen(false)} className="block py-2">Elanlarım</Link>
                <Link href="/profil/sevimliler" onClick={() => setMobileOpen(false)} className="block py-2">Sevimlilər</Link>
                <Link href="/profil/sebet" onClick={() => setMobileOpen(false)} className="block py-2">Səbət</Link>
                <Link href="/profil/bildirisler" onClick={() => setMobileOpen(false)} className="block py-2">Bildirişlər</Link>
                <Link href="/profil/mesajlar" onClick={() => setMobileOpen(false)} className="block py-2">Mesajlar</Link>
                <button onClick={logout} className="block py-2 text-danger dark:text-red-400 w-full text-left">Çıxış</button>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                <button onClick={() => { setMobileOpen(false); openLogin(); }} className="btn-tap w-full justify-center">Daxil ol</button>
                <button onClick={() => { setMobileOpen(false); openRegister(); }} className="btn-secondary w-full justify-center">Qeydiyyat</button>
              </div>
            )}

            <div className="border-t border-ink-200 dark:border-ink-700 pt-4 space-y-1 text-ink-800 dark:text-ink-200">
              <Link href="/elanlar" onClick={() => setMobileOpen(false)} className="block py-2 font-medium">Bütün elanlar</Link>
              <Link href="/ai-elan" onClick={() => setMobileOpen(false)} className="block py-2 text-tap font-semibold">AI ilə elan yarat</Link>
              <Link href="/sekille-axtar" onClick={() => setMobileOpen(false)} className="block py-2">Şəkillə axtar</Link>
              <Link href="/muqayise" onClick={() => setMobileOpen(false)} className="block py-2">Müqayisə</Link>
              <Link href="/biznes" onClick={() => setMobileOpen(false)} className="block py-2">Biznes üçün</Link>
              <Link href="/karyera" onClick={() => setMobileOpen(false)} className="block py-2">Karyera</Link>
              <Link href="/komek" onClick={() => setMobileOpen(false)} className="block py-2">Kömək</Link>
            </div>

            {categories.length > 0 && (
              <div className="border-t border-ink-200 dark:border-ink-700 pt-4 mt-4">
                <div className="text-xs font-bold text-ink-400 mb-2">KATEQORİYALAR</div>
                {categories.slice(0, 13).map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/elanlar?category=${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="block py-1.5 text-sm text-ink-700 dark:text-ink-300"
                  >
                    {c.nameAz ?? c.name_az}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  );
}
