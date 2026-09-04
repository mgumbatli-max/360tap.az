'use client';
import ProfileLayout from '@/components/ProfileLayout';
import { useAuth } from '@/lib/auth';
import { Wallet } from 'lucide-react';

/**
 * Faza 0: bu səhifə istifadəçiyə UYDURMA pul göstərirdi — hardcoded "25.00 ₼" balans və
 * saxta tranzaksiya tarixçəsi (DEMO_TX: "Balans artırma +50", "VIP elan 7 gün -5" ...).
 * Backend-də isə heç bir ödəniş endpoint-i yoxdur, yəni bu rəqəmlərin arxasında HEÇ NƏ yox idi.
 * İstifadəçinin real vəsaiti olduğuna inanması ən ağır UX/etibar riskidir → tamamilə silindi.
 *
 * İndi səhifə vəziyyəti açıq deyir (layihənin mövcud boş-vəziyyət üslubu ilə), tariflər isə
 * yalnız ÖN BAXIŞ kimi qalır və düymələr sönülüdür — heç bir düymə "heç nə etməyən" deyil.
 * Real balans/ödəniş (PaymentsModule) ayrı fazanın işidir.
 */

const PLANNED_PACKAGES = [
  { name: 'Boost — Yuxarı qaldır', price: 1, desc: 'Bir dəfə üst sıraya çıxar' },
  { name: 'VIP 7 gün', price: 5, desc: 'Vitrində VIP rozetlə görün' },
  { name: 'Premium 7 gün', price: 12, desc: 'Kateqoriyada üst sıralarda' },
];

export default function BalancePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <ProfileLayout>
      <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white mb-4">Balans</h1>

      <div className="card p-12 text-center mb-6">
        <Wallet className="w-12 h-12 text-ink-300 mx-auto mb-3" />
        <p className="text-ink-600 dark:text-ink-300 mb-3">Balans xidməti hazırlanır</p>
        <p className="text-sm text-ink-400">
          Ödəniş sistemi hələ qoşulmayıb. Balans artırma, promo kod və tranzaksiya tarixçəsi
          işə düşən kimi burada görünəcək. Hazırda hesabınıza bağlı vəsait yoxdur.
        </p>
      </div>

      <h2 className="font-bold text-ink-900 dark:text-white mb-1">Planlaşdırılan premium xidmətlər</h2>
      <p className="text-sm text-ink-400 mb-3">
        Qiymətlər ilkin plandır — satış hələ açıq deyil.
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {PLANNED_PACKAGES.map((p) => (
          <div key={p.name} className="card p-4 opacity-70">
            <h3 className="font-bold text-ink-900 dark:text-white">{p.name}</h3>
            <div className="text-2xl font-extrabold mt-1">{p.price} ₼</div>
            <p className="text-xs text-ink-500 mt-1">{p.desc}</p>
            <button
              type="button"
              disabled
              title="Ödəniş sistemi hazırlanır"
              className="btn-tap w-full mt-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tezliklə
            </button>
          </div>
        ))}
      </div>
    </ProfileLayout>
  );
}
