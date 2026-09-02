'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { api, unwrapMeta } from '@/lib/api';
import {
  Users, ListOrdered, Wallet, ShieldAlert, TrendingUp, Crown, Eye, Tag,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Çox sadə KPI — listings count, users count
    // Faza 0: say `meta.total`-dadır, kök `total`-da deyil → KPI həmişə "..." göstərirdi.
    Promise.all([
      api<any>('/listings'),
    ]).then(([l]) => setStats({
      listings: unwrapMeta(l).total ?? '—',
      users: '—',
      revenue: '—',
      complaints: '—',
    })).catch(() => {});
  }, []);

  if (loading || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <div className="p-12 text-center text-ink-500">Giriş yoxlanır...</div>;
  }

  const KPI = [
    { label: 'Aktiv elanlar', value: stats?.listings ?? '...', icon: ListOrdered, color: 'bg-blue-500' },
    { label: 'İstifadəçilər',  value: stats?.users ?? '...',    icon: Users,        color: 'bg-emerald-500' },
    { label: 'Aylıq gəlir',    value: stats?.revenue ?? '—',    icon: Wallet,       color: 'bg-amber-500' },
    { label: 'Şikayətlər',     value: stats?.complaints ?? '—', icon: ShieldAlert,  color: 'bg-red-500' },
  ];

  const NAV = [
    { href: '/admin/users',     label: 'İstifadəçilər', icon: Users,       count: '—' },
    { href: '/admin/listings',  label: 'Elanlar',       icon: ListOrdered, count: stats?.listings ?? '—' },
    { href: '/admin/moderation',label: 'Moderasiya',    icon: Crown,       count: '—' },
    { href: '/admin/complaints',label: 'Şikayətlər',    icon: ShieldAlert, count: '—' },
    { href: '/admin/categories',label: 'Kateqoriyalar', icon: Tag,         count: '—' },
    { href: '/admin/payments',  label: 'Ödənişlər',     icon: Wallet,      count: '—' },
    { href: '/admin/analytics', label: 'Analitika',     icon: TrendingUp,  count: '—' },
    { href: '/admin/audit',     label: 'Audit log',     icon: Eye,         count: '—' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs font-bold uppercase text-tap mb-1">Admin Panel</div>
          <h1 className="text-3xl font-extrabold text-ink-900">Salam, {user.full_name}</h1>
          <p className="text-ink-500 mt-1">360tap.az idarəetmə paneli</p>
        </div>
        <span className="badge badge-trusted">Admin</span>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {KPI.map((k) => (
          <div key={k.label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${k.color} text-white flex items-center justify-center mb-3`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-extrabold text-ink-900">{k.value}</div>
            <div className="text-xs text-ink-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Modullar */}
      <h2 className="text-xl font-bold text-ink-900 mb-3">Modullar</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="card p-5 hover:border-tap transition group">
            <n.icon className="w-7 h-7 text-tap mb-3" />
            <div className="font-semibold text-ink-900 group-hover:text-tap">{n.label}</div>
            <div className="text-xs text-ink-400 mt-1">{n.count}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-5 rounded-xl bg-amber-50 border border-amber-200">
        <h3 className="font-bold text-amber-900 mb-1">⚠ Bu səhifə inkişaf altındadır</h3>
        <p className="text-sm text-amber-800">
          Bu admin panel skeleti yalnız əsas KPI və naviqasiyanı göstərir.
          Tam moderasiya queue, istifadəçi idarəsi, gəlir hesabatı növbəti versiyalarda əlavə olunacaq.
          API endpoint-lər artıq hazırdır.
        </p>
      </div>
    </div>
  );
}
