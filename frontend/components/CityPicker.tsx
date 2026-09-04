'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Check, X, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { getCity, setCity, type SelectedCity } from '@/lib/city';

export default function CityPicker({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<{ slug: string; name_az: string; region?: string }[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectedCity>(null);

  useEffect(() => {
    setSelected(getCity());
    // NestJS: /geo/regions → { data:[{slug, nameAz}] }; köhnə: { cities:[{slug, name_az}] }
    api('/geo/regions')
      .then((d: any) => {
        const raw = d.data || d.regions || d.cities || [];
        setCities(
          raw.map((x: any) => ({
            slug: x.slug,
            name_az: x.nameAz ?? x.name_az ?? x.name ?? x.slug,
          })),
        );
      })
      .catch(() => setCities([]));
  }, []);

  useEffect(() => {
    const handler = () => setSelected(getCity());
    window.addEventListener('city-changed', handler);
    return () => window.removeEventListener('city-changed', handler);
  }, []);

  const onPick = (city: { slug: string; name_az: string } | null) => {
    setCity(city ? { slug: city.slug, name: city.name_az } : null);
    setSelected(city ? { slug: city.slug, name: city.name_az } : null);
    setOpen(false);
    setSearch('');
    // Seçilən regionun elanlarına keç
    router.push(city ? `/elanlar?region=${city.slug}` : '/elanlar');
  };

  const filtered = cities.filter((c) =>
    !search || c.name_az.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Header-in region seçicisi: sərhədsiz, yalnız ikon + mətn (Avito modeli) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 max-w-[200px] rounded-lg px-2 py-1.5 ${
          compact ? 'text-[13px]' : 'text-sm'
        } font-medium text-ink-700 dark:text-ink-200 hover:text-tap hover:bg-ink-50 dark:hover:bg-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink-900`}
      >
        <MapPin className="w-[18px] h-[18px] shrink-0 text-tap" aria-hidden="true" />
        <span className="truncate">{selected ? selected.name : 'Bütün Azərbaycan'}</span>
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div
            className="modal-content p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Region seçimi"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Bağla"
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 flex items-center justify-center text-ink-700 dark:text-ink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-1">Region seçin</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">Yalnız seçdiyiniz regiondakı elanlar göstəriləcək.</p>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Şəhər axtar..."
                className="input pl-10"
                autoFocus
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto -mx-2 px-2">
              <button
                onClick={() => onPick(null)}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-ink-800 dark:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-800 ${
                  !selected ? 'bg-tap-50' : ''
                }`}
              >
                <span className="font-semibold">Bütün Azərbaycan</span>
                {!selected && <Check className="w-4 h-4 text-tap" />}
              </button>

              {filtered.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => onPick(c)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-ink-800 dark:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-800 ${
                    selected?.slug === c.slug ? 'bg-tap-50' : ''
                  }`}
                >
                  <span>{c.name_az}{c.region && <span className="text-xs text-ink-400 ml-2">{c.region}</span>}</span>
                  {selected?.slug === c.slug && <Check className="w-4 h-4 text-tap" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
