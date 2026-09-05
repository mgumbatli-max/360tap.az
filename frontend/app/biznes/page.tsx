import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  MapPin,
  PlugZap,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react';

/**
 * /biznes — DÜRÜSTLÜK DÜZƏLİŞİ.
 *
 * ƏVVƏL bu səhifə UYDURMA statistika göstərirdi: «500K+ aylıq aktiv istifadəçi»,
 * «1.2M elan baxışı», «12 000 aktiv biznes hesabı», «4.7 ⭐ orta reyting»,
 * hero-da isə «+245% baxış / 1240 lead / 89 müraciət» kartları. Platformada
 * hazırda bu rəqəmlərin heç birinin arxasında məlumat YOXDUR.
 * Eyni problem /profil/balans-da saxta balansla baş vermişdi və orada da silinib.
 *
 * Həmçinin 4 qiymətli paket (49/99/249 ₼) və «Seç» düymələri vardı — düymələr
 * `href="#"` idi, yəni heç nə etmirdi, üstəlik monetizasiya bayrağı BAĞLIDIR və
 * başlanğıc siyasəti heç bir yerdə qiymət göstərməyi qadağan edir.
 *
 * İNDİ: yalnız REAL, kodda mövcud olan üstünlüklər (öz vitrin səhifəsi, ERP
 * sinxronizasiyası, filiallar, iş saatları, təsdiq nişanı) və tək bir işlək
 * CTA — «Mağaza aç» → /profil/magazam.
 */

export const metadata: Metadata = {
  title: 'Biznes üçün — 360tap.az',
  description:
    'Mağaza hesabı ilə öz vitrin səhifənizi açın, anbar proqramınızı (ERP) 360tap.az ilə sinxronlaşdırın, filiallarınızı və iş saatlarınızı göstərin.',
};

/** Hər bənd bu gün kodda mövcud olan funksiyaya uyğundur — vəd deyil. */
const FEATURES = [
  {
    icon: Store,
    title: 'Öz vitrin səhifəniz',
    desc: 'Bütün elanlarınız bir ünvanda toplanır. Linki müştəriyə göndərin, o da hər şeyi bir yerdə görsün.',
  },
  {
    icon: PlugZap,
    title: 'ERP sinxronizasiyası',
    desc: 'Anbar proqramınız məhsulları birbaşa göndərir: qiymət və stok avtomatik yenilənir, satılan məhsul özü arxivləşir.',
  },
  {
    icon: MapPin,
    title: 'Filiallar',
    desc: 'Bir neçə ünvanınız varsa, hamısını mağaza səhifənizdə göstərin.',
  },
  {
    icon: Clock,
    title: 'İş saatları',
    desc: 'Alıcı zəng etməzdən əvvəl açıq olub-olmadığınızı bilir.',
  },
  {
    icon: Truck,
    title: 'Çatdırılma və zəmanət şərtləri',
    desc: 'Ən çox verilən iki suala cavab elanın yanında dayanır — sual axını azalır.',
  },
  {
    icon: BadgeCheck,
    title: 'Təsdiq nişanı',
    desc: 'Yoxlamadan keçən mağazalar təsdiq nişanı alır — alıcı üçün etibar siqnalı.',
  },
];

const STEPS = [
  { n: '1', text: 'Hesabınıza daxil olun (və ya pulsuz qeydiyyatdan keçin).' },
  { n: '2', text: '«Mağazam» bölməsində adı və əlaqə məlumatlarını yazın.' },
  { n: '3', text: 'Loqo, iş saatları və şərtləri əlavə edin, linki paylaşın.' },
];

export default function BiznesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-tap-50 dark:bg-ink-900 py-12 md:py-16 border-b border-ink-200 dark:border-ink-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="badge badge-trusted mb-4">Mağaza hesabı</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-ink-900 dark:text-white leading-tight">
            Biznesiniz üçün <span className="text-tap">öz vitriniz</span>
          </h1>
          <p className="text-lg text-ink-600 dark:text-ink-300 mt-4">
            Elanlarınızı bir səhifədə toplayın, anbar proqramınızla sinxronlaşdırın və
            müştəriyə tək link göndərin.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link
              href="/profil/magazam"
              className="btn-tap inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
            >
              <Store className="w-4 h-4" />
              Mağaza aç
            </Link>
            <Link
              href="/elaqe"
              className="btn-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
            >
              Sual verin
            </Link>
          </div>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-4">
            Mağaza açmaq hazırda pulsuzdur və elan limiti tətbiq olunmur.
          </p>
        </div>
      </section>

      {/* Real üstünlüklər */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-ink-900 dark:text-white mb-2">
            Mağaza hesabı nə verir?
          </h2>
          <p className="text-center text-ink-500 dark:text-ink-400 mb-8">
            Aşağıdakıların hamısı bu gün işləyir.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <div className="w-12 h-12 rounded-xl bg-tap-50 dark:bg-ink-800 text-tap flex items-center justify-center mb-3">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-ink-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ERP — əsas fərqləndirici */}
      <section className="py-12 bg-ink-50 dark:bg-ink-900 border-y border-ink-200 dark:border-ink-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-14 h-14 rounded-2xl bg-tap text-white flex items-center justify-center shrink-0">
              <PlugZap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-ink-900 dark:text-white">
                ERP inteqrasiyası — bizdə var
              </h2>
              <p className="text-ink-600 dark:text-ink-300 mt-2">
                Kataloqunuzu əl ilə köçürmək lazım deyil. Anbar proqramınız API açarı və
                HMAC imzası ilə məhsulları birbaşa göndərir; stok bitəndə elan öz-özünə
                arxivləşir, qiymət dəyişəndə elan dərhal yenilənir.
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  'Məhsul yayımlama (external_id ilə təkrarsız uyğunlaşdırma)',
                  'Stok və qiymət yeniləmə',
                  'Silinən məhsulun avtomatik arxivləşdirilməsi',
                ].map((t) => (
                  <li key={t} className="flex gap-2 text-sm text-ink-700 dark:text-ink-200">
                    <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                href="/profil/magazam"
                className="inline-flex items-center gap-1 text-tap font-semibold mt-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tap rounded"
              >
                Mağaza kabinetindən aktivləşdirin <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Necə başlamalı */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center text-ink-900 dark:text-white mb-8">
            Üç addımda başlayın
          </h2>
          <ol className="space-y-4">
            {STEPS.map((s) => (
              <li key={s.n} className="card p-4 flex items-start gap-4">
                <span className="w-8 h-8 rounded-full bg-tap text-white font-bold flex items-center justify-center shrink-0">
                  {s.n}
                </span>
                <span className="text-ink-700 dark:text-ink-200 pt-1">{s.text}</span>
              </li>
            ))}
          </ol>

          <div className="text-center mt-8">
            <Link
              href="/profil/magazam"
              className="btn-tap inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
            >
              <Store className="w-4 h-4" />
              Mağaza aç
            </Link>
          </div>

          {/* NİYƏ BURADA QİYMƏT YOXDUR: monetizasiya bayrağı bağlıdır və satış
              açılmayıb. Uydurma tarif göstərmək əvəzinə vəziyyət açıq yazılır. */}
          <p className="text-center text-sm text-ink-500 dark:text-ink-400 mt-6">
            Ödənişli paketlər hazırlanır. Hazırda mağaza hesabının bütün funksiyaları
            pulsuzdur — qiymət siyasəti açıqlananda burada elan ediləcək.
          </p>
        </div>
      </section>
    </div>
  );
}
