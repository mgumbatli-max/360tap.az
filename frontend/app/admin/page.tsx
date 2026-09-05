'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  FolderTree,
  Layers,
  LockKeyhole,
  Settings2,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import CategoryLimitsSection from './CategoryLimitsSection';
import FlagsSection from './FlagsSection';
import OverviewSection from './OverviewSection';
import PackagesSection from './PackagesSection';
import StoresSection from './StoresSection';
import SubscriptionsSection from './SubscriptionsSection';
import UsersSection from './UsersSection';

/**
 * ADMİN PANELİ.
 *
 * NİYƏ TƏK SƏHİFƏ + BÖLMƏLƏR: köhnə panel 8 alt-route-a link verirdi
 * (`/admin/users`, `/admin/payments` …), amma HEÇ BİRİ mövcud deyildi — hər klik
 * 404 idi. Burada yalnız backend-i olan bölmələr var və hər biri elə bu səhifədə
 * açılır, yəni «işləməyən link» strukturca mümkün deyil.
 *
 * NİYƏ İCAZƏ EKRANI YÖNLƏNDİRMƏ DEYİL: köhnə panel admin olmayanı səssizcə ana
 * səhifəyə atırdı — istifadəçi nə baş verdiyini bilmirdi. İndi səbəb yazılır.
 */

type SectionId =
  | 'overview'
  | 'stores'
  | 'users'
  | 'packages'
  | 'subscriptions'
  | 'limits'
  | 'settings';

const SECTIONS: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Xülasə', icon: BarChart3 },
  { id: 'stores', label: 'Mağazalar', icon: Store },
  { id: 'users', label: 'İstifadəçilər', icon: Users },
  { id: 'packages', label: 'Paketlər', icon: Layers },
  { id: 'subscriptions', label: 'Abunələr', icon: Wallet },
  { id: 'limits', label: 'Kateqoriya limitləri', icon: FolderTree },
  { id: 'settings', label: 'Ayarlar', icon: Settings2 },
];

const ADMIN_ROLES = ['admin', 'super_admin'];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [section, setSection] = useState<SectionId>('overview');

  if (loading) {
    return <div className="p-12 text-center text-ink-500 dark:text-ink-400">Giriş yoxlanır...</div>;
  }

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return <NoAccess signedIn={!!user} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-5">
        <div className="text-xs font-bold uppercase text-tap mb-1">Admin panel</div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 dark:text-white">
              360tap.az idarəetməsi
            </h1>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
              Salam, {user.full_name || 'admin'}. Bütün dəyişikliklər audit jurnalına yazılır.
            </p>
          </div>
          <span className="badge badge-trusted">
            {user.role === 'super_admin' ? 'Super admin' : 'Admin'}
          </span>
        </div>
      </header>

      {/* Bölmə seçimi — mobil ekranda üfüqi sürüşən lent (səhifə sürüşmür). */}
      <nav aria-label="Admin bölmələri" className="mb-5 overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {SECTIONS.map(({ id, label, icon: Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tap ${
                  active
                    ? 'bg-tap-50 dark:bg-ink-800 border-tap text-tap'
                    : 'border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-300 hover:border-tap'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {section === 'overview' && <OverviewSection />}
      {section === 'stores' && <StoresSection />}
      {section === 'users' && <UsersSection currentUserId={user.id} />}
      {section === 'packages' && <PackagesSection />}
      {section === 'subscriptions' && <SubscriptionsSection />}
      {section === 'limits' && <CategoryLimitsSection />}
      {section === 'settings' && <FlagsSection />}
    </div>
  );
}

function NoAccess({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-ink-100 dark:bg-ink-800 flex items-center justify-center mx-auto mb-4">
        <LockKeyhole className="w-6 h-6 text-ink-500 dark:text-ink-400" />
      </div>
      <h1 className="text-xl font-extrabold text-ink-900 dark:text-white">İcazəniz yoxdur</h1>
      <p className="text-sm text-ink-600 dark:text-ink-300 mt-2">
        {signedIn
          ? 'Bu səhifə yalnız admin hesabları üçündür. Səhv hesabla girmisinizsə, çıxış edib admin hesabı ilə daxil olun.'
          : 'Bu səhifəni görmək üçün admin hesabı ilə daxil olmalısınız.'}
      </p>
      <div className="flex flex-wrap gap-2 justify-center mt-5">
        {!signedIn && (
          <Link
            href="/login"
            className="btn-tap text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
          >
            Daxil ol
          </Link>
        )}
        <Link
          href="/"
          className="btn-secondary text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
        >
          Ana səhifə
        </Link>
      </div>
    </div>
  );
}
