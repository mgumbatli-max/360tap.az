'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, MessageCircle, Phone, Mail } from 'lucide-react';

const TOPICS = [
  {
    title: 'Tez-tez verilən suallar',
    items: [
      '360tap.az-dan necə istifadə edim?',
      'Sifarişim itdi, nə etməli?',
      'Mənə yazılan mesaja cavab verə bilmirəm',
      'Hesabımdan pul geri qaytarmaq mümkündürmü?',
      'Nə üçün elanım rədd edildi?',
    ],
  },
  {
    title: 'Elan yerləşdirmək',
    items: [
      'Necə pulsuz elan yerləşdirmək olar?',
      'Şəkillər necə yüklənir?',
      'Hansı kateqoriyada yerləşdirim?',
      'Elanım nə qədər müddətə aktivdir?',
      'Necə yenilənmə edə bilərəm?',
    ],
  },
  {
    title: 'Elanım rədd edildi',
    items: [
      'Kateqoriya səhv seçilib',
      'Şəkil keyfiyyəti aşağıdır',
      'Qadağan olunmuş məhsuldur',
      'Qiymət reallıqdan uzaqdır',
      'Təsvir uyğun deyil',
    ],
  },
  {
    title: 'Mənim elanlarım',
    items: [
      'Necə bir neçə elan yerləşdirim?',
      'Pulsuz olaraq yerləşdirim',
      'Pul ödəyib publish etmək',
      'Elanı redaktə edə bilərəmmi?',
      'Elanı necə silim?',
    ],
  },
  {
    title: 'Rəylər və reytinq',
    items: [
      'Reytinq necə hesablanır?',
      'Rəy yazmaq',
      'Rəyi silmək',
      'Rəy itdi',
      'Rəyə cavab vermək',
      'Saxta rəyə qarşı şikayət',
    ],
  },
  {
    title: 'Ödənişlər',
    items: [
      'Ödəniş problemləri',
      '360tap kabineti və bonuslar',
      'Digər ödəniş üsulları',
      'Çatdırılma',
      'Reklam üçün ödəniş',
    ],
  },
  {
    title: 'Elanı irəli aparmaq',
    items: [
      'Pulsuz xidmətlərlə',
      'Yuxarı qaldır',
      'VIP / Premium elan',
      'Avtomatik yenilənmə',
      'Ana səhifədə göstər',
    ],
  },
  {
    title: 'Tariflər',
    items: ['Mallar', 'Daşınmaz əmlak', 'Avto', 'Xidmətlər', 'İş', 'Limitlər haqqında'],
  },
  {
    title: '360tap biznes üçün',
    items: [
      'Profesional plan',
      '360tap şirkət hesabı',
      'Avtoyükləmə və API',
      'Tariflər',
      '360tap Pro kabineti',
      'Statistika professional satıcılar üçün',
    ],
  },
  {
    title: 'İstifadəçi ilə əlaqə',
    items: [
      'Necə zəng etmək olar?',
      'Mesaj yazmaq',
      'Cavab gəlmir, nə etməli?',
      'Asistent zəng etmək üçün',
      '360tap vasitəsilə zəng necə işləyir?',
    ],
  },
  {
    title: 'Axtarış',
    items: [
      'Məhsul və ya xidmət axtar',
      'Lokasiyaya görə axtarış',
      'Sevimlilərə əlavə',
      'Saxlanmış axtarış üzrə',
      'Necə düzgün axtarış edim?',
    ],
  },
  {
    title: 'Servislər',
    items: [
      '360tap səyahət',
      'Rəqəmsal məhsullar',
      '360tap Garantiya',
      'Onlayn qeydiyyat xidmətlər',
      'Sənətkarın gələcəyi üçün',
      'Kuryer xidmətləri',
    ],
  },
];

export default function HelpPage() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'user' | 'business' | 'travel'>('user');

  return (
    <div className="bg-ink-50 min-h-screen">
      {/* Hero */}
      <section className="bg-white border-b border-ink-200 py-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-1 text-2xl">
              <span className="logo-dots inline-grid"><span /><span /><span /><span /></span>
              <span className="font-bold ml-1">360tap Yardım</span>
            </div>
          </div>

          <div className="flex justify-center gap-1 my-6">
            <button onClick={() => setTab('user')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'user' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}>
              İstifadəçilərə
            </button>
            <button onClick={() => setTab('business')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'business' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}>
              Biznes üçün
            </button>
            <button onClick={() => setTab('travel')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'travel' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}>
              Səyahət
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-center mb-5">
            360tap.az-da iş üzrə populyar suallara cavablar
          </h1>

          <div className="search-bar">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Mövzu yazın, məs: sifariş üçün pul"
                className="search-input pl-9"
              />
            </div>
            <button className="search-submit">Axtar</button>
          </div>
        </div>
      </section>

      {/* Topics grid */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOPICS.map((t) => (
            <div key={t.title} className="card p-5">
              <h3 className="font-bold text-ink-900 mb-3">{t.title}</h3>
              <ul className="space-y-2 text-sm">
                {t.items.map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-ink-700 hover:text-tap">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Contact support */}
      <section className="bg-ink-100 py-10 border-t border-ink-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-ink-900 mb-2">Tapmadığınız sual var?</h2>
          <p className="text-ink-600 mb-6">Dəstək komandamız 24 saat ərzində cavab verəcək.</p>

          <div className="grid sm:grid-cols-3 gap-3 max-w-xl mx-auto">
            <a href="mailto:dest@360tap.az" className="card p-4 hover:border-tap flex flex-col items-center gap-2">
              <Mail className="w-6 h-6 text-tap" />
              <span className="font-semibold">Email yaz</span>
              <span className="text-xs text-ink-500">dest@360tap.az</span>
            </a>
            <a href="tel:+994500000000" className="card p-4 hover:border-tap flex flex-col items-center gap-2">
              <Phone className="w-6 h-6 text-tap" />
              <span className="font-semibold">Zəng et</span>
              <span className="text-xs text-ink-500">+994 50 000 00 00</span>
            </a>
            <button className="card p-4 hover:border-tap flex flex-col items-center gap-2">
              <MessageCircle className="w-6 h-6 text-tap" />
              <span className="font-semibold">Onlayn dəstək</span>
              <span className="text-xs text-ink-500">9:00 - 21:00</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
