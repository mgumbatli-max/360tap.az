'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Heart, Search, Menu, ChevronDown, User2, Plus, LogOut, Camera, X } from 'lucide-react';
import Logo from './Logo';
import MegaMenu from './MegaMenu';
import AuthModal from './AuthModal';
import CityPicker from './CityPicker';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [megaOpen, setMegaOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userMenu, setUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    // NestJS: { data:[...] }; köhnə Express: { categories:[...] }
    api('/categories')
      .then((d: any) => setCategories(d.data || d.categories || []))
      .catch(() => setCategories([]));
  }, []);

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

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-ink-900 border-b border-ink-200/70 dark:border-ink-700">
        {/* Üst nazik bar */}
        <div className="hidden md:block border-b border-ink-100 dark:border-ink-800">
          <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between text-xs text-ink-600 dark:text-ink-300">
            <div className="flex items-center gap-5">
              <Link href="/biznes" className="hover:text-tap">Biznes üçün</Link>
              <Link href="/karyera" className="hover:text-tap">Karyera</Link>
              <Link href="/komek" className="hover:text-tap">Yardım</Link>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="relative">
                  <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-1 hover:text-tap">
                    {user.full_name ?? 'Hesabım'} <ChevronDown className="w-3 h-3" />
                  </button>
                  {userMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg shadow-lg py-1 z-50">
                      <Link href="/profil" className="flex items-center gap-2 px-4 py-2 hover:bg-ink-50 dark:hover:bg-ink-700 text-ink-700 dark:text-ink-200">
                        <User2 className="w-4 h-4" /> Profil
                      </Link>
                      <Link href="/profil/elanlarim" className="block px-4 py-2 hover:bg-ink-50 dark:hover:bg-ink-700 text-ink-700 dark:text-ink-200">
                        Elanlarım
                      </Link>
                      <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-ink-50 dark:hover:bg-ink-700 text-red-600 border-t border-ink-100 dark:border-ink-700">
                        <LogOut className="w-4 h-4" /> Çıxış
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button onClick={openLogin} className="hover:text-tap">Daxil ol</button>
                  <button onClick={openRegister} className="hover:text-tap">Qeydiyyat</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Əsas bar */}
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3 md:gap-4">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>

          {/* Kateqoriyalar + axtarış */}
          <form onSubmit={submitSearch} className="flex flex-1 min-w-0 items-stretch h-11">
            <button
              type="button"
              onClick={() => setMegaOpen(!megaOpen)}
              className="hidden sm:flex items-center gap-2 px-3 md:px-4 bg-tap text-white rounded-l-xl text-sm font-semibold shrink-0 hover:opacity-90"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden lg:inline">Bütün kateqoriyalar</span>
            </button>
            <div className="flex-1 min-w-0 flex items-center border border-ink-200 dark:border-ink-700 sm:border-l-0 rounded-xl sm:rounded-none bg-ink-50 dark:bg-ink-800">
              <Search className="w-4 h-4 text-ink-400 ml-3 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nə axtarırsız? — AI ilə yazın"
                className="flex-1 min-w-0 bg-transparent px-2 text-sm text-ink-900 dark:text-white outline-none"
              />
              <Link
                href="/sekille-axtar"
                title="Şəkillə axtar"
                className="px-2.5 flex items-center text-tap hover:text-tap/80 shrink-0"
                aria-label="Şəkillə axtar"
              >
                <Camera className="w-4 h-4" />
              </Link>
            </div>
            <button type="submit" className="px-4 md:px-6 bg-tap text-white rounded-r-xl text-sm font-bold shrink-0 hover:opacity-90">
              Tap
            </button>
          </form>

          {/* Region — tablet+ */}
          <div className="hidden sm:block shrink-0">
            <CityPicker compact />
          </div>

          {/* Sağ — yığcam */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <ThemeToggle />
            <Link
              href={user ? '/profil/sevimliler' : '#'}
              onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }}
              className="p-2 hover:bg-ink-50 dark:hover:bg-ink-800 rounded-lg hidden sm:inline-flex"
              aria-label="Sevimlilər"
            >
              <Heart className="w-5 h-5 text-ink-700 dark:text-ink-200" />
            </Link>
            {/* Mobil hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 hover:bg-ink-50 dark:hover:bg-ink-800 rounded-lg sm:hidden"
              aria-label="Menyu"
            >
              <Menu className="w-5 h-5 text-ink-700 dark:text-ink-200" />
            </button>
            <Link
              href={user ? '/elan-yerlesdir' : '#'}
              onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }}
              className="inline-flex items-center gap-1.5 px-3 md:px-4 h-10 bg-tap text-white rounded-xl text-sm font-bold hover:opacity-90 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Elan yerləşdir</span>
            </Link>
          </div>
        </div>

        <MegaMenu open={megaOpen} onClose={() => setMegaOpen(false)} categories={categories} />
      </header>

      {/* Mobil drawer menyu */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-[60] bg-black/40" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-72 max-w-[80vw] bg-white dark:bg-ink-900 p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-extrabold text-ink-900 dark:text-white">Menyu</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Bağla">
                <X className="w-5 h-5 text-ink-700 dark:text-ink-200" />
              </button>
            </div>

            {user ? (
              <div className="space-y-1 mb-4 text-ink-800 dark:text-ink-200">
                <Link href="/profil" onClick={() => setMobileOpen(false)} className="block py-2">Profil</Link>
                <Link href="/profil/elanlarim" onClick={() => setMobileOpen(false)} className="block py-2">Elanlarım</Link>
                <Link href="/profil/sevimliler" onClick={() => setMobileOpen(false)} className="block py-2">Sevimlilər</Link>
                <button onClick={logout} className="block py-2 text-red-600 w-full text-left">Çıxış</button>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                <button onClick={() => { setMobileOpen(false); openLogin(); }} className="btn-tap w-full justify-center">Daxil ol</button>
                <button onClick={() => { setMobileOpen(false); openRegister(); }} className="btn-secondary w-full justify-center">Qeydiyyat</button>
              </div>
            )}

            <div className="border-t border-ink-200 dark:border-ink-700 pt-4 space-y-1 text-ink-800 dark:text-ink-200">
              <Link href="/elanlar" onClick={() => setMobileOpen(false)} className="block py-2 font-medium">Bütün elanlar</Link>
              <Link href="/ai-elan" onClick={() => setMobileOpen(false)} className="block py-2 text-tap font-semibold">✨ AI ilə elan yarat</Link>
              <Link href="/sekille-axtar" onClick={() => setMobileOpen(false)} className="block py-2">📷 Şəkillə axtar</Link>
              <Link href="/biznes" onClick={() => setMobileOpen(false)} className="block py-2">Biznes üçün</Link>
              <Link href="/karyera" onClick={() => setMobileOpen(false)} className="block py-2">Karyera</Link>
              <Link href="/komek" onClick={() => setMobileOpen(false)} className="block py-2">Yardım</Link>
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
