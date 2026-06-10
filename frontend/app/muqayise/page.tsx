'use client';
import { useState, useEffect } from 'react';
import { Plus, X, Scale } from 'lucide-react';
import { api, formatPrice } from '@/lib/api';

const KEY = 'tap_car_compare';

export default function ComparePage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(KEY) || '[]');
      Promise.all(ids.map((id) => api<{ listing: any }>(`/listings/${id}`).then((d) => d.listing).catch(() => null)))
        .then((r) => setItems(r.filter(Boolean)));
    } catch {}
  }, []);

  const remove = (id: string) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next.map((x) => x.id))); } catch {}
  };

  const FIELDS = [
    { key: 'price', label: 'Qiymət', format: (v: any, item: any) => formatPrice(v, item.currency) },
    { key: 'condition', label: 'Vəziyyət' },
    { key: 'city_name', label: 'Şəhər' },
    { key: ['attributes', 'brand'], label: 'Marka' },
    { key: ['attributes', 'model'], label: 'Model' },
    { key: ['attributes', 'year'], label: 'İl' },
    { key: ['attributes', 'mileage'], label: 'Yürüş', format: (v: any) => v ? `${Number(v).toLocaleString('az-AZ')} km` : '—' },
    { key: ['attributes', 'fuel'], label: 'Yanacaq' },
    { key: ['attributes', 'transmission'], label: 'Sürətlər qutusu' },
    { key: ['attributes', 'engine'], label: 'Mühərrik (sm³)' },
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
          <a href="/neqliyyat" className="btn-tap inline-flex">Avtomobil seç</a>
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
                        {it.media?.[0]?.url && <img src={it.media[0].url} alt={it.title} className="w-full h-full object-cover" />}
                      </div>
                      <a href={`/elanlar/${it.id}`} className="font-bold text-sm hover:text-tap line-clamp-2">{it.title}</a>
                    </div>
                  </th>
                ))}
                {items.length < 4 && (
                  <th className="p-3 min-w-[220px]">
                    <a href="/neqliyyat" className="card p-6 text-center hover:border-tap block">
                      <Plus className="w-8 h-8 mx-auto text-ink-400 mb-2" />
                      <span className="text-xs text-ink-500">+ əlavə et</span>
                    </a>
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
