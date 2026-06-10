import Link from 'next/link';
import CategoryTiles from '@/components/CategoryTiles';
import ListingCard, { type Listing } from '@/components/ListingCard';
import BusinessPanel from '@/components/BusinessPanel';
import RecentlyViewed from '@/components/RecentlyViewed';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import Stories from '@/components/Stories';
import TrendingSearches from '@/components/TrendingSearches';
import SearchHistory from '@/components/SearchHistory';
import ProTipsCarousel from '@/components/ProTipsCarousel';
import LiveDealsTicker from '@/components/LiveDealsTicker';
import SmartSuggestionsForYou from '@/components/SmartSuggestionsForYou';

async function getCategories() {
  try {
    const res = await fetch('http://localhost:5400/api/categories', { cache: 'no-store' });
    if (!res.ok) return [];
    const d = await res.json();
    return d.categories || [];
  } catch { return []; }
}

async function getListings() {
  try {
    const res = await fetch('http://localhost:5400/api/listings?limit=12', { cache: 'no-store' });
    if (!res.ok) return [];
    const d = await res.json();
    return d.items || [];
  } catch { return []; }
}

export default async function HomePage() {
  const [categories, listings] = await Promise.all([getCategories(), getListings()]);

  return (
    <div>
      {/* Hero / Categories */}
      <section className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div>
              <CategoryTiles categories={categories} />
            </div>
            <div className="hidden lg:block" data-pro-only="true">
              <BusinessPanel />
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-ink-900 mb-5">
                Sizin üçün tövsiyələr
              </h2>

              {listings.length === 0 ? (
                <div className="card p-10 text-center">
                  <p className="text-ink-500 text-lg">Hələ elan yoxdur</p>
                  <Link href="/elan-yerlesdir" className="btn-tap inline-flex mt-4">
                    İlk elanı sən yerləşdir →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {listings.map((l: Listing) => (
                    <ListingCard key={l.id} item={l} />
                  ))}
                </div>
              )}

              {listings.length > 0 && (
                <div className="text-center mt-6">
                  <Link href="/elanlar" className="btn-secondary">
                    Daha çox göstər
                  </Link>
                </div>
              )}
            </div>

            <aside className="hidden lg:block" data-pro-only="true">
              <div className="card p-5 sticky top-24">
                <h3 className="font-bold text-ink-900 mb-3 text-sm">360tap.az-da axtar</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/elanlar?category=neqliyyat" className="text-ink-700 hover:text-tap">Avtomobil seçimi</Link></li>
                  <li><Link href="/emlak" className="text-ink-700 hover:text-tap">Mənzillər</Link></li>
                  <li><Link href="/elanlar?category=is-elanlari" className="text-ink-700 hover:text-tap">İş elanları</Link></li>
                  <li><Link href="/elanlar?delivery=1" className="text-ink-700 hover:text-tap">Çatdırılma ilə</Link></li>
                </ul>

                <div className="mt-5 pt-5 border-t border-ink-200">
                  <h4 className="font-semibold text-sm text-ink-900 mb-2">Yardım sual</h4>
                  <ul className="space-y-1.5 text-xs text-ink-600">
                    <li><Link href="#" className="hover:text-tap">Necə təhlükəsiz almaq olar?</Link></li>
                    <li><Link href="#" className="hover:text-tap">Necə elan yerləşdirmək olar?</Link></li>
                    <li><Link href="#" className="hover:text-tap">VIP elan nədir?</Link></li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Live deals ticker + Stories carousel */}
      <section className="max-w-7xl mx-auto px-4 mt-4 space-y-3">
        <LiveDealsTicker />
        <Stories />
      </section>

      {/* AI smart suggestions */}
      <div className="max-w-7xl mx-auto px-4">
        <SmartSuggestionsForYou />
      </div>

      <FeaturedCarousel />

      <section className="max-w-7xl mx-auto px-4 my-6 grid md:grid-cols-2 gap-4" data-pro-only="true">
        <TrendingSearches />
        <ProTipsCarousel />
      </section>

      <div className="max-w-7xl mx-auto px-4" data-pro-only="true">
        <SearchHistory />
      </div>

      <div data-pro-only="true">
        <RecentlyViewed />
      </div>

      {/* Biznes panel — Pro-only */}
      <section className="bg-ink-50 py-12 border-y border-ink-200" data-pro-only="true">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-ink-900 mb-3 leading-tight">
                İndi biznes üçün
                <br />
                <span className="text-tap">hər şey burada</span>
              </h2>
              <p className="text-ink-600 mb-5 max-w-md">
                Mallar, xidmətlər, təminatçılar, işçilər — hamısı bir platformada.
              </p>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                <Link href="/biznes#sahe" className="card p-3 text-center hover:border-tap">
                  <div className="text-sm font-bold text-ink-900">Sahə</div>
                  <div className="text-[11px] text-ink-500 mt-1">İP və hüquqi şəxslər üçün</div>
                </Link>
                <Link href="/biznes#teminatcilar" className="card p-3 text-center hover:border-tap">
                  <div className="text-sm font-bold text-ink-900">Təminatçılar</div>
                  <div className="text-[11px] text-ink-500 mt-1">İstehsalçılar regionda</div>
                </Link>
                <Link href="/biznes#servisler" className="card p-3 text-center hover:border-tap">
                  <div className="text-sm font-bold text-ink-900">Servislər</div>
                  <div className="text-[11px] text-ink-500 mt-1">Biznes-tapşırıqlar üçün</div>
                </Link>
              </div>
            </div>

            <div className="relative h-64 hidden md:block">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-tap-100 via-emerald-100 to-blue-100" />
                <div className="absolute top-8 left-12 bg-white rounded-2xl p-3 shadow-card">
                  🚛 Logistika
                </div>
                <div className="absolute bottom-8 right-12 bg-white rounded-2xl p-3 shadow-card">
                  💳 Ödəniş
                </div>
                <div className="absolute top-1/2 right-4 bg-white rounded-2xl p-3 shadow-card">
                  📦 Çatdırılma
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12" data-pro-only="true">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink-900 mb-6">
            360tap.az-da nə var
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: 'Mallar', desc: 'Telefon, ayaqqabı, kompüter', emoji: '👜' },
              { name: 'Nəqliyyat', desc: 'Avtomobil, mototsikl, yük', emoji: '🚗' },
              { name: 'Daşınmaz əmlak', desc: 'Mənzil, ev, obyekt', emoji: '🏠' },
              { name: 'Xidmətlər', desc: 'Manikür, təmir, kuryer', emoji: '🛠' },
              { name: 'İş', desc: 'Vakansiya və işçilər', emoji: '💼' },
            ].map((it) => (
              <Link key={it.name} href="#" className="card p-4 hover:border-tap text-center">
                <div className="text-3xl mb-2">{it.emoji}</div>
                <div className="font-bold text-ink-900">{it.name}</div>
                <div className="text-xs text-ink-500 mt-1">{it.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
