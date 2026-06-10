'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Heart, ShoppingBag, Search, Menu, ChevronDown, User2, Plus, LogOut, Camera } from 'lucide-react';
import Logo from './Logo';
import MegaMenu from './MegaMenu';
import AuthModal from './AuthModal';
import SearchAutocomplete from './SearchAutocomplete';
import SuperSearch from './SuperSearch';
import CityPicker from './CityPicker';
import ThemeToggle from './ThemeToggle';
import NotificationsDropdown from './NotificationsDropdown';
import ModeToggle from './ModeToggle';
import CurrencyToggle from './CurrencyToggle';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [megaOpen, setMegaOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [superOpen, setSuperOpen] = useState(false);

  // Cmd+K / Ctrl+K — super search aç
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSuperOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userMenu, setUserMenu] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    api('/categories').then((d: any) => setCategories(d.categories || []));
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openLogin = () => { setAuthMode('login'); setAuthOpen(true); };
  const openRegister = () => { setAuthMode('register'); setAuthOpen(true); };

  return (
    <>
      {/* ============ FIXED HEADER ============ */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-ink-200/60 transition-all duration-300">
        {/* Üst utility bar — Lite-də gizlənir, scroll-da da gizlənir */}
        {!scrolled && (
          <div className="hidden md:block border-b border-ink-100" data-pro-only="true">
            <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between text-xs text-ink-600">
              <div className="flex items-center gap-5">
                <Link href="/biznes" className="hover:text-ink-900 flex items-center gap-1">
                  Biznes üçün <ChevronDown className="w-3 h-3" />
                </Link>
                <Link href="/karyera" className="hover:text-ink-900" data-pro-only="true">Karyera</Link>
                <Link href="/komek" className="hover:text-ink-900">Yardım</Link>
                <Link href="/kataloqlar" className="hover:text-ink-900 flex items-center gap-1" data-pro-only="true">
                  Kataloqlar <ChevronDown className="w-3 h-3" />
                </Link>
                <Link href="/reklam" className="hover:text-ink-900" data-pro-only="true">#Reklam</Link>
              </div>
              <div className="flex items-center gap-4">
                {user ? (
                  <div className="relative">
                    <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-1 hover:text-ink-900">
                      {user.full_name} <ChevronDown className="w-3 h-3" />
                    </button>
                    {userMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-ink-200 rounded-lg shadow-menu py-1 z-50 animate-slide-down">
                        <Link href="/profil" className="flex items-center gap-2 px-4 py-2 hover:bg-ink-50 text-ink-700">
                          <User2 className="w-4 h-4" /> Profil
                        </Link>
                        <Link href="/profil/elanlarim" className="flex items-center gap-2 px-4 py-2 hover:bg-ink-50 text-ink-700">
                          Elanlarım
                        </Link>
                        <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-ink-50 text-red-600 border-t border-ink-100">
                          <LogOut className="w-4 h-4" /> Çıxış
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <button onClick={openLogin} className="hover:text-ink-900">Daxil ol</button>
                    <button onClick={openRegister} className="hover:text-ink-900">Qeydiyyat</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Əsas bar — search bar buradadır, həmişə görünür */}
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4 relative">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>

          <div className="hidden md:flex flex-1 max-w-3xl search-bar relative">
            <button
              type="button"
              onClick={() => setMegaOpen(!megaOpen)}
              className="search-cat-btn"
              aria-label="Bütün kateqoriyalar"
            >
              <Menu className="w-4 h-4" />
              Bütün kateqoriyalar
            </button>
            <button
              type="button"
              onClick={() => setSuperOpen(true)}
              className="flex-1 px-4 text-left text-ink-500 hover:text-ink-900 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 truncate">{q || 'Nə axtarırsız? — AI ilə'}</span>
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded text-[10px] font-mono">⌘K</kbd>
            </button>
            <Link href="/sekille-axtar" title="Şəkillə axtar"
              className="px-3 flex items-center justify-center text-tap hover:bg-tap-50 border-r border-ink-200">
              <Camera className="w-4 h-4" />
            </Link>
            <button type="button" onClick={() => router.push(`/elanlar?q=${encodeURIComponent(q)}`)} className="search-submit">
              Tap
            </button>
          </div>

          <div className="hidden lg:block">
            <CityPicker />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto md:ml-0">
            {/* Lite/Pro toggle — həmişə görünür */}
            <ModeToggle compact />
            <Link href="/lab" className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-violet-500 to-tap text-white text-xs font-bold hover:opacity-90" title="Lab">
              <span className="text-[10px]">🧪</span> Lab
            </Link>
            <CurrencyToggle />
            <ThemeToggle />
            {/* <NotificationsDropdown /> */}
            <Link href={user ? '/profil/sevimliler' : '#'}
              onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }}
              className="p-2 hover:bg-ink-50 rounded-lg" aria-label="Sevimlilər">
              <Heart className="w-5 h-5 text-ink-700" />
            </Link>
            <Link href={user ? '/profil/sebet' : '#'}
              onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }}
              data-pro-only="true" className="p-2 hover:bg-ink-50 rounded-lg relative" aria-label="Səbət">
              <ShoppingBag className="w-5 h-5 text-ink-700" />
            </Link>

            {!user && (
              <button onClick={openLogin} className="hidden md:inline-flex btn-secondary text-sm py-2 ml-1">
                Daxil ol
              </button>
            )}

            <Link
              href={user ? '/elan-yerlesdir' : '#'}
              onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }}
              className="btn-tap text-sm py-2 ml-1 hidden sm:inline-flex"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Elan yerləşdir</span>
              <span className="md:hidden">Elan</span>
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <form
          onSubmit={(e) => { e.preventDefault(); router.push(`/elanlar?q=${encodeURIComponent(q)}`); }}
          className="md:hidden px-4 pb-3 search-bar"
        >
          <button type="button" onClick={() => setMegaOpen(!megaOpen)} className="search-cat-btn !px-3">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Axtar"
              className="search-input pl-9"
            />
          </div>
        </form>

        <MegaMenu open={megaOpen} onClose={() => setMegaOpen(false)} categories={categories} />
      </header>

      {/* SPACER — fixed header altında məzmun gizlənməsin */}
      <div className={`${scrolled ? 'h-[64px] md:h-[64px]' : 'h-[114px] md:h-[100px]'}`} aria-hidden />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
      <SuperSearch open={superOpen} onClose={() => setSuperOpen(false)} />
    </>
  );
}
