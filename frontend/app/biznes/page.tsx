import Link from 'next/link';
import { Briefcase, BarChart3, Users, MessageCircle, Truck, Shield, ArrowRight, Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Pulsuz',
    price: '0 ₼',
    period: '/ ay',
    desc: 'Başlamaq üçün ideal',
    features: ['3 pulsuz elan / ay', 'Sadə profil', 'Standart görünmə', 'Saytdaxili dəstək'],
    cta: 'Başla', href: '/qeydiyyat', highlight: false,
  },
  {
    name: 'Start',
    price: '49 ₼',
    period: '/ ay',
    desc: 'Kiçik bizneslər üçün',
    features: ['50 elan / ay', 'Mağaza profili', 'Verified rozeti', 'Sadə statistika', 'Email dəstək'],
    cta: 'Seç', href: '#', highlight: false,
  },
  {
    name: 'Business',
    price: '99 ₼',
    period: '/ ay',
    desc: 'Ən populyar seçim',
    features: ['200 elan / ay', '5 komanda üzvü', 'Toplu yükləmə (CSV)', 'Ətraflı analitika', 'Lead tracker', 'Reklam kabineti'],
    cta: 'Seç', href: '#', highlight: true,
  },
  {
    name: 'Pro',
    price: '249 ₼',
    period: '/ ay',
    desc: 'Böyük bizneslər üçün',
    features: ['Limitsiz elan', '15 komanda üzvü', 'API + Webhooks', 'Premium görünmə', 'Reklam endirimi', 'Prioritet dəstək'],
    cta: 'Seç', href: '#', highlight: false,
  },
];

const FEATURES = [
  { icon: BarChart3,    title: 'Ətraflı analitika', desc: 'Baxış, klik, mesaj və konversiya hər elan üzrə.' },
  { icon: Users,        title: 'Komanda idarəsi',   desc: 'Komanda üzvləri əlavə edin, icazələri tənzimləyin.' },
  { icon: Truck,        title: 'Toplu yükləmə',     desc: 'Excel/CSV ilə minlərlə elanı bir kliklə.' },
  { icon: Shield,       title: 'Şirkət təsdiqi',    desc: 'Verified rozeti müştəri etibarını artırır.' },
  { icon: MessageCircle, title: 'Lead tracker',     desc: 'Hər müraciəti CRM-ə bənzər kanban-da idarə edin.' },
  { icon: Briefcase,    title: 'Reklam kabineti',   desc: 'Bannerlər, sponsorlu elanlar, hədəf auditoriya.' },
];

export default function BiznesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-tap-50 to-white py-12 md:py-20 border-b border-ink-200">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="badge badge-trusted mb-4">360tap Biznes 360</span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-ink-900 leading-tight">
              360tap.az-da biznesinizi
              <br />
              <span className="text-tap">böyüdün</span>
            </h1>
            <p className="text-lg text-ink-600 mt-4 max-w-md">
              Müştərilərə daha sürətli çatın, satışları artırın və biznesinizi peşəkar şəkildə idarə edin.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/qeydiyyat" className="btn-tap">Hesab aç</Link>
              <Link href="#paketler" className="btn-secondary">Tarifləri gör</Link>
            </div>
          </div>
          <div className="relative h-64 md:h-80 hidden md:block">
            <div className="absolute inset-0 grid place-items-center">
              <div className="w-72 h-72 rounded-full bg-gradient-to-br from-tap to-royal opacity-20" />
              <div className="absolute top-4 left-8 bg-white rounded-2xl p-4 shadow-card flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-tap" /> +245% baxış
              </div>
              <div className="absolute bottom-8 right-4 bg-white rounded-2xl p-4 shadow-card flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" /> 1240 lead
              </div>
              <div className="absolute top-1/2 right-12 bg-white rounded-2xl p-4 shadow-card flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-violet-500" /> 89 müraciət
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { num: '500K+', label: 'Aylıq aktiv istifadəçi' },
            { num: '1.2M', label: 'Aylıq elan baxışı' },
            { num: '12 000', label: 'Aktiv biznes hesabı' },
            { num: '4.7 ⭐', label: 'Orta reyting' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-extrabold text-ink-900">{s.num}</div>
              <div className="text-sm text-ink-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-ink-900 mb-2">
            Bizneslər üçün hər şey
          </h2>
          <p className="text-center text-ink-500 mb-8">360tap Biznes 360 alət dəsti</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <div className="w-12 h-12 rounded-xl bg-tap-100 text-tap flex items-center justify-center mb-3">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-ink-900">{f.title}</h3>
                <p className="text-sm text-ink-600 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="paketler" className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-ink-900 mb-2">
            Paketinizi seçin
          </h2>
          <p className="text-center text-ink-500 mb-8">İllik ödənişdə 17% endirim</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((p) => (
              <div key={p.name} className={`card p-5 relative ${p.highlight ? 'border-tap ring-2 ring-tap' : ''}`}>
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-tap text-white text-xs font-bold px-3 py-1 rounded-full">
                    Populyar
                  </span>
                )}
                <h3 className="font-bold text-ink-900">{p.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-ink-900">{p.price}</span>
                  <span className="text-ink-500 text-sm">{p.period}</span>
                </div>
                <p className="text-sm text-ink-500 mt-1">{p.desc}</p>
                <ul className="space-y-2 my-5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={p.href}
                  className={`block w-full text-center py-2.5 rounded-lg font-semibold ${
                    p.highlight ? 'bg-tap text-white hover:bg-tap-dark' : 'border border-ink-200 hover:border-tap'
                  }`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/elaqe" className="text-tap hover:underline inline-flex items-center gap-1">
              Korporativ paket lazımdır? Bizimlə əlaqə saxlayın <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-ink-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Bu gün başlayın</h2>
          <p className="text-white/80 mb-6">Pulsuz hesab açın və 3 dəqiqədə ilk elanınızı yerləşdirin.</p>
          <Link href="/qeydiyyat" className="inline-block px-8 py-3 bg-tap hover:bg-tap-dark rounded-lg font-bold transition">
            Pulsuz qeydiyyat
          </Link>
        </div>
      </section>
    </div>
  );
}
