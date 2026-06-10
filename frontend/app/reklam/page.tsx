import Link from 'next/link';
import { Megaphone, Target, Image, BarChart3, Layers, ArrowRight } from 'lucide-react';

const FORMATS = [
  { icon: Image,    name: 'Banner reklam',         desc: 'Ana səhifə, kateqoriya səhifələri', cpm: '8-15 ₼ / 1000 baxış' },
  { icon: Target,   name: 'Sponsorlu elan',        desc: 'Axtarış nəticəsində üst sırada',     cpm: '6-12 ₼ / 1000 baxış' },
  { icon: Layers,   name: 'Kateqoriya reklamı',    desc: 'Müəyyən kateqoriya səhifələrində',  cpm: '10 ₼ / 1000 baxış' },
  { icon: Megaphone,name: 'Premium mağaza',        desc: 'Mağaza siyahısında ön plan',         cpm: 'sazişlə' },
];

export default function AdsPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-amber-50 to-orange-100 py-12 md:py-20 border-b border-ink-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="badge badge-pro mb-4">Reklam yerləşdirmək</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-ink-900 leading-tight">
            Müştərilərinizə daha yaxın
          </h1>
          <p className="text-lg text-ink-600 mt-4">
            500K+ aylıq aktiv istifadəçi. Auditoriyaya görə hədəf.
          </p>
          <Link href="/elaqe" className="btn-tap inline-flex mt-6">Reklam menecerinə yaz</Link>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-extrabold text-ink-900 mb-6 text-center">Reklam formatları</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FORMATS.map((f) => (
            <div key={f.name} className="card p-5">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-ink-900">{f.name}</h3>
              <p className="text-sm text-ink-600 mt-1">{f.desc}</p>
              <div className="text-xs text-tap font-semibold mt-2">{f.cpm}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 bg-ink-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-tap mb-3" />
          <h2 className="text-2xl font-extrabold mb-3">Necə işləyir</h2>
          <ol className="space-y-3 text-left max-w-md mx-auto">
            {[
              'Bizimlə əlaqə saxlayın və hədəfinizi izah edin',
              'Reklam meneceri sizə optimal paket təklif edir',
              'Banner və mətnləri hazırlayırıq və ya sizdən qəbul edirik',
              'Kampaniya başlayır, real-time statistika alırsınız',
              'Aylıq hesabat və optimal nəticə üçün məsləhət',
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-tap text-white flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-12 max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-extrabold mb-3">Reklam haqqında soruşun</h2>
        <p className="text-ink-600 mb-6">Komandamız sizinlə birlikdə optimal həll tapacaq.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href="mailto:reklam@360tap.az" className="btn-tap">reklam@360tap.az</a>
          <Link href="/elaqe" className="btn-secondary">Forma doldur <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>
    </div>
  );
}
