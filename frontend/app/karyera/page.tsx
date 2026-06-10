import Link from 'next/link';
import { Briefcase, MapPin, Clock, Heart } from 'lucide-react';

const POSITIONS = [
  { title: 'Senior Frontend Developer', team: 'Mühəndislik', city: 'Bakı', type: 'Tam ştat' },
  { title: 'Backend Engineer (NestJS)',  team: 'Mühəndislik', city: 'Bakı / Remote', type: 'Tam ştat' },
  { title: 'Mobile Engineer (React Native)', team: 'Mühəndislik', city: 'Bakı', type: 'Tam ştat' },
  { title: 'Product Designer',           team: 'Dizayn',      city: 'Bakı / Hybrid', type: 'Tam ştat' },
  { title: 'Data Analyst',               team: 'Data',        city: 'Bakı', type: 'Tam ştat' },
  { title: 'Content Manager',            team: 'Marketinq',   city: 'Bakı', type: 'Tam ştat' },
  { title: 'Customer Support Specialist', team: 'Dəstək',     city: 'Bakı', type: 'Növbəli' },
  { title: 'QA Engineer',                team: 'Mühəndislik', city: 'Remote', type: 'Tam ştat' },
];

const PERKS = [
  { icon: Briefcase, title: 'Bazara uyğun maaş',     desc: 'Bonus + RSU' },
  { icon: Heart,     title: 'Tibbi sığorta',         desc: 'Özünüz və ailə üçün' },
  { icon: MapPin,    title: 'Hibrid iş',             desc: 'Ofis + uzaqdan' },
  { icon: Clock,     title: 'Çevik iş saatları',     desc: '9-18, lakin sənin tempinlə' },
];

export default function CareerPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-violet-50 to-pink-50 py-14 md:py-20 border-b border-ink-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-ink-900 leading-tight">
            360tap komandasının
            <br />
            <span className="text-tap">bir hissəsi ol</span>
          </h1>
          <p className="text-lg text-ink-600 mt-4">
            Texnologiya ilə milyonlarla insana və biznesə kömək edirik.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-extrabold mb-6">Niyə 360tap?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERKS.map((p) => (
            <div key={p.title} className="card p-5">
              <p.icon className="w-10 h-10 text-tap mb-2" />
              <div className="font-bold">{p.title}</div>
              <div className="text-sm text-ink-500 mt-1">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10 bg-ink-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold mb-6">Açıq vakansiyalar ({POSITIONS.length})</h2>
          <div className="space-y-2">
            {POSITIONS.map((p, i) => (
              <Link key={i} href="#" className="card p-4 sm:p-5 flex flex-wrap gap-3 items-center hover:border-tap group">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-ink-900 group-hover:text-tap">{p.title}</div>
                  <div className="text-sm text-ink-500 mt-1 flex flex-wrap gap-3">
                    <span>{p.team}</span>
                    <span>📍 {p.city}</span>
                    <span>{p.type}</span>
                  </div>
                </div>
                <span className="text-tap font-semibold text-sm group-hover:underline">Müraciət et →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
