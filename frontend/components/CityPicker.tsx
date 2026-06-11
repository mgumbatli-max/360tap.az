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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} text-ink-700 hover:text-tap whitespace-nowrap`}
      >
        <MapPin className="w-4 h-4 text-tap" />
        {selected ? selected.name : 'Bütün regionlarda'}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content p-5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-ink-100 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-ink-900 mb-1">Şəhər seçin</h2>
            <p className="text-sm text-ink-500 mb-4">Yalnız seçdiyiniz şəhərdəki elanlar göstəriləcək.</p>

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
                className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-ink-50 ${
                  !selected ? 'bg-tap-50' : ''
                }`}
              >
                <span className="font-semibold">Bütün regionlarda</span>
                {!selected && <Check className="w-4 h-4 text-tap" />}
              </button>

              {filtered.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => onPick(c)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-ink-50 ${
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
