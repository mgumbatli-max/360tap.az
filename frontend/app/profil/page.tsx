'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProfileLayout from '@/components/ProfileLayout';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import TrustScore from '@/components/TrustScore';
import LoyaltyPoints from '@/components/LoyaltyPoints';
import AchievementBadges from '@/components/AchievementBadges';
import SmartAlerts from '@/components/SmartAlerts';
import ReferralProgram from '@/components/ReferralProgram';
import {
  ListOrdered, MessageCircle, Heart, Bell, Wallet, Eye, Plus, Star, Crown,
} from 'lucide-react';

export default function ProfileDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({ active: 0, sold: 0, archived: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    api<{ items: any[] }>('/listings/me/list').then((d) => {
      const items = d.items ?? [];
      setStats({
        active: items.filter((x) => x.status === 'active').length,
        sold: items.filter((x) => x.status === 'sold').length,
        archived: items.filter((x) => x.status === 'archived').length,
      });
      setRecent(items.slice(0, 4));
    }).catch(() => {});
  }, [user]);

  if (!user) return null;

  return (
    <ProfileLayout>
      <div className="space-y-5">
        {/* Welcome */}
        <div className="card p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"
             style={{ background: 'linear-gradient(135deg, #00AAFF, #0060F0)' }}>
          <div className="text-white">
            <h1 className="text-2xl font-extrabold">Salam, {user.full_name.split(' ')[0]} 👋</h1>
            <p className="text-white/85 mt-1">İstənilən ehtiyacınız üçün bir kliklik məsafədə</p>
          </div>
          <Link href="/elan-yerlesdir" className="btn-secondary !bg-white !text-tap-700 font-bold whitespace-nowrap">
            <Plus className="w-4 h-4" /> Yeni elan
          </Link>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={ListOrdered} label="Aktiv elan" value={stats.active} color="bg-emerald-50 text-emerald-600" href="/profil/elanlarim" />
          <KpiCard icon={Eye} label="Satılan" value={stats.sold} color="bg-blue-50 text-blue-600" href="/profil/elanlarim" />
          <KpiCard icon={Heart} label="Sevimlilər" value={0} color="bg-pink-50 text-pink-600" href="/profil/sevimliler" />
          <KpiCard icon={MessageCircle} label="Mesajlar" value={0} color="bg-violet-50 text-violet-600" href="/profil/mesajlar" />
        </div>

        {/* Etibar + Sadiqlik + Dəvət */}
        <div className="grid md:grid-cols-3 gap-3">
          <TrustScore user={user} />
          <LoyaltyPoints />
          <ReferralProgram />
        </div>

        {/* Nailiyyətlər + Smart bildirişlər */}
        <div className="grid md:grid-cols-2 gap-3">
          <AchievementBadges />
          <SmartAlerts />
        </div>

        {/* Şəbəkə banneri */}
        <div className="card p-5 grid sm:grid-cols-2 gap-4 items-center">
          <div>
            <h3 className="font-bold text-ink-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Elanını VIP et
            </h3>
            <p className="text-sm text-ink-600 mt-1">
              VIP elan 7 gün ərzində kateqoriya səhifəsində ilk sıralarda görünür və 5x daha çox müraciət gətirir.
            </p>
          </div>
          <div className="flex justify-end">
            <Link href="/profil/elanlarim" className="btn-tap text-sm">Elanı seç →</Link>
          </div>
        </div>

        {/* Son elanlarım */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-ink-900">Son elanlarım</h2>
            <Link href="/profil/elanlarim" className="text-sm text-tap hover:underline">Hamısı →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-8 text-ink-500">
              Hələ elan yoxdur. <Link href="/elan-yerlesdir" className="text-tap hover:underline">İlkini yarat</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {recent.map((it) => (
                <Link key={it.id} href={`/elanlar/${it.id}`} className="card p-3 flex gap-3 hover:border-tap">
                  <div className="w-20 h-20 rounded bg-ink-100 overflow-hidden shrink-0">
                    {it.cover && <img src={it.cover} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{it.title}</div>
                    <div className="font-bold text-ink-900 mt-1">
                      {it.price ? `${Number(it.price).toLocaleString('az-AZ')} ${it.currency}` : 'Razılaşma'}
                    </div>
                    <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-2">
                      <Eye className="w-3 h-3" /> {it.views ?? 0}
                      <span className={`badge ${it.status === 'active' ? 'badge-active' : 'badge-ad'}`}>
                        {it.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
}

function KpiCard({ icon: Icon, label, value, color, href }: any) {
  return (
    <Link href={href} className="card p-4 hover:border-tap transition">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-extrabold text-ink-900">{value}</div>
      <div className="text-xs text-ink-500 mt-0.5">{label}</div>
    </Link>
  );
}
