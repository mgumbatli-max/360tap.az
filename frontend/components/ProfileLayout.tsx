'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard, Heart, MessageCircle, Bell, Clock, ListOrdered,
  Wallet, Star, Settings, LogOut, Bookmark,
} from 'lucide-react';

const NAV = [
  { href: '/profil',             label: 'Dashboard',           icon: LayoutDashboard },
  { href: '/profil/elanlarim',   label: 'Elanlarım',           icon: ListOrdered },
  { href: '/profil/sevimliler',  label: 'Sevimlilər',          icon: Heart },
  { href: '/profil/saxlanmis',   label: 'Saxlanılan axtarışlar', icon: Bookmark },
  { href: '/profil/baxilanlar',  label: 'Son baxılanlar',         icon: Clock },
  { href: '/profil/mesajlar',    label: 'Mesajlar',            icon: MessageCircle },
  { href: '/profil/bildirisler', label: 'Bildirişlər',         icon: Bell },
  { href: '/profil/balans',      label: 'Balans',              icon: Wallet },
  { href: '/profil/reyler',      label: 'Rəylər',              icon: Star },
  { href: '/profil/ayarlar',     label: 'Ayarlar',             icon: Settings },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  if (loading || !user) return <div className="p-12 text-center text-ink-500">Yüklənir...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-tap-100 text-tap flex items-center justify-center font-bold text-xl">
                {user.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{user.full_name}</div>
                <div className="text-xs text-ink-500 truncate">{user.email ?? user.phone}</div>
              </div>
            </div>
          </div>

          <nav className="card p-1.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    active ? 'bg-tap-50 text-tap font-semibold' : 'text-ink-700 hover:bg-ink-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 mt-1 border-t border-ink-200 pt-3"
            >
              <LogOut className="w-4 h-4" />
              Çıxış
            </button>
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
