'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, X, Scale } from 'lucide-react';
import { api, formatPrice, unwrap } from '@/lib/api';
import { azNumber } from '@/lib/format';
import { addCompare, getCompare, removeCompare } from '@/lib/compare';

// Sabitləşdirmə: bu səhifə əvvəl ÖZ lokal `const KEY = 'tap_car_compare'` açarını oxuyurdu,
// halbuki müqayisəyə elan əlavə edən tərəf (ListingCard, ListingDetailClient, CompareBar)
// lib/compare.ts-in `avito_compare` açarına OBYEKT massivi yazır. Nəticədə istifadəçi
// kartlardan elan əlavə edir, CompareBar-da onları görür, menyudan «Müqayisə»yə keçir və
// HƏMİŞƏ boş cədvəl alırdı.
// Yalnız KEY sətrini 'avito_compare' etmək TƏHLÜKƏLİ olardı: aşağıdakı silmə əməliyyatı
// həmin açara id-string massivi yazıb getCompare()-in gözlədiyi obyekt formatını pozar və
// işləyən CompareBar-ı sındırardı. Ona görə oxu/yazı TAM olaraq lib/compare.ts helper-lərinə
// verildi — tək mənbə, `compare-changed` hadisəsi ilə CompareBar avtomatik yenilənir.

export default function ComparePage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // CompareWithSimilar.tsx `/muqayise?id=<listingId>` linki qurur — həmin elan
        // müqayisə siyahısında yoxdursa əlavə olunmalıdır, əks halda link heç nə etmir.
        // `useSearchParams` QƏSDƏN işlədilmir: Next 15-də o, səhifəni Suspense sərhədi
        // tələb edən CSR-bailout-a salır və build-i sındıra bilər. Oxu useEffect
        // daxilində (yalnız brauzerdə) baş verdiyi üçün window.location təhlükəsizdir.
        const incomingId = new URLSearchParams(window.location.search).get('id');
        if (incomingId && !getCompare().some((x) => x.id === incomingId)) {
          const d = await api<any>(`/listings/${incomingId}`).then((r) => unwrap<any>(r, null)).catch(() => null);
          if (d) {
            addCompare({
              id: d.id,
              title: d.title,
              price: d.price ?? null,
              currency: d.currency ?? 'AZN',
              cover: d.images?.[0]?.url,
              city: d.regionName,
              category: d.categorySlug,
            });
          }
        }
        const ids = getCompare().map((x) => x.id);
        // Faza 0: köhnə `d.listing` → `{ ok, data }` (müqayisə cədvəli həmişə boş görünürdü).
        const rows = await Promise.all(
          ids.map((id) => api<any>(`/listings/${id}`).then((d) => unwrap<any>(d, null)).catch(() => null)),
        );
        if (!cancelled) setItems(rows.filter(Boolean));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const remove = (id: string) => {
    removeCompare(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  // Açarlar GET /listings/:id cavabına uyğunlaşdırıldı: API `regionName` verir (`city_name` YOXDUR),
  // atribut açarı isə DB-də `engine_volume`-dur (`engine` YOXDUR) — hər ikisi əvvəl daimi «—» idi.
  const FIELDS = [
    { key: 'price', label: 'Qiymət', format: (v: any, item: any) => formatPrice(v, item.currency) },
    { key: 'condition', label: 'Vəziyyət' },
    { key: 'regionName', label: 'Şəhər' },
    { key: ['attributes', 'brand'], label: 'Marka' },
    { key: ['attributes', 'model'], label: 'Model' },
    { key: ['attributes', 'year'], label: 'İl' },
    { key: ['attributes', 'mileage'], label: 'Yürüş', format: (v: any) => v ? `${azNumber(v)} km` : '—' },
    { key: ['attributes', 'fuel'], label: 'Yanacaq' },
    { key: ['attributes', 'transmission'], label: 'Sürətlər qutusu' },
    { key: ['attributes', 'engine_volume'], label: 'Mühərrik (sm³)' },
    { key: ['attributes', 'color'], label: 'Rəng' },
    { key: 'views', label: 'Baxış sayı' },
  ];

  const getVal = (item: any, key: any): any => {
    if (Array.isArray(key)) return key.reduce((a, k) => a?.[k], item);
    return item?.[key];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-1 flex items-center gap-2">
        <Scale className="w-7 h-7 text-violet-600" /> Müqayisə
      </h1>
      <p className="text-sm text-ink-500 mb-6">2-4 avtomobili yan-yana müqayisə edin</p>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <Scale className="w-16 h-16 mx-auto text-ink-300 mb-3" />
          <p className="text-ink-500 mb-3">Müqayisə üçün avtomobil seçməmisiniz</p>
          {/* /neqliyyat next.config.ts-də 308 yönləndirmədir — birbaşa hədəfə link veririk. */}
          <Link href="/elanlar?category=neqliyyat" className="btn-tap inline-flex">Avtomobil seç</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-200">
                <th className="p-3 text-left text-xs text-ink-500 uppercase font-bold">Xüsusiyyət</th>
                {items.map((it) => (
                  <th key={it.id} className="p-3 min-w-[220px] text-left">
                    <div className="relative">
                      <button onClick={() => remove(it.id)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">
                        <X className="w-3 h-3 m-auto" />
                      </button>
                      <div className="aspect-video bg-ink-100 rounded-lg mb-2 overflow-hidden">
                        {/* API şəkilləri `images` altında qaytarır — köhnə `media` daimi boş idi. */}
                        {it.images?.[0]?.url && <img src={it.images[0].url} alt={it.title} className="w-full h-full object-cover" />}
                      </div>
                      <a href={`/elanlar/${it.id}`} className="font-bold text-sm hover:text-tap line-clamp-2">{it.title}</a>
                    </div>
                  </th>
                ))}
                {items.length < 4 && (
                  <th className="p-3 min-w-[220px]">
                    <Link href="/elanlar?category=neqliyyat" className="card p-6 text-center hover:border-tap block">
                      <Plus className="w-8 h-8 mx-auto text-ink-400 mb-2" />
                      <span className="text-xs text-ink-500">+ əlavə et</span>
                    </Link>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((f) => (
                <tr key={f.label} className="border-b border-ink-100 hover:bg-ink-50/50">
                  <td className="p-3 text-xs text-ink-500 font-semibold">{f.label}</td>
                  {items.map((it) => {
                    const v = getVal(it, f.key);
                    return (
                      <td key={it.id} className="p-3 text-sm font-medium">
                        {v ? (f.format ? f.format(v, it) : v) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
