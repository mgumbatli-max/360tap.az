'use client';
import { useState, useMemo } from 'react';
import { X, Search, MapPin, Check } from 'lucide-react';
import { BAKU_DISTRICTS, BAKU_METRO, BAKU_LANDMARKS } from '@/lib/realestate-data';

type Tab = 'district' | 'metro' | 'landmark';

export default function LocationPicker({
  open,
  onClose,
  selected,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  selected: { districts: string[]; metros: string[]; landmarks: string[] };
  onApply: (next: { districts: string[]; metros: string[]; landmarks: string[] }) => void;
}) {
  const [tab, setTab] = useState<Tab>('district');
  const [q, setQ] = useState('');
  const [districts, setDistricts] = useState<string[]>(selected.districts);
  const [metros, setMetros] = useState<string[]>(selected.metros);
  const [landmarks, setLandmarks] = useState<string[]>(selected.landmarks);

  const lists: Record<Tab, { all: string[]; sel: string[]; set: (s: string[]) => void }> = {
    district: { all: BAKU_DISTRICTS, sel: districts, set: setDistricts },
    metro:    { all: BAKU_METRO, sel: metros, set: setMetros },
    landmark: { all: BAKU_LANDMARKS, sel: landmarks, set: setLandmarks },
  };
  const cur = lists[tab];

  const filtered = useMemo(() => {
    if (!q.trim()) return cur.all;
    return cur.all.filter((x) => x.toLowerCase().includes(q.toLowerCase()));
  }, [q, cur.all]);

  const toggle = (val: string) => {
    cur.set(cur.sel.includes(val) ? cur.sel.filter((x) => x !== val) : [...cur.sel, val]);
  };

  const totalSelected = districts.length + metros.length + landmarks.length;
  const reset = () => { setDistricts([]); setMetros([]); setLandmarks([]); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c2128] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-5 border-b border-ink-200">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-tap" /> Rayon, metro, nişangah
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-ink-100 rounded-lg"><X className="w-5 h-5" /></button>
        </header>

        <div className="px-5 pt-4 pb-3 border-b border-ink-200">
          <div className="flex gap-2 mb-3">
            <button className="px-3 py-1.5 rounded-lg bg-ink-100 text-sm font-medium">Şəhər: Bakı</button>
            <div className="flex flex-1 bg-ink-100 rounded-lg p-1">
              {(['district','metro','landmark'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setQ(''); }}
                  className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition ${tab === t ? 'bg-white text-tap shadow' : 'text-ink-600 hover:text-ink-900'}`}
                >
                  {t === 'district' ? 'Rayon' : t === 'metro' ? 'Metro' : 'Nişangah'}
                  {lists[t].sel.length > 0 && <span className="ml-1.5 text-xs bg-tap text-white px-1.5 rounded-full">{lists[t].sel.length}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`${tab === 'district' ? 'Rayon' : tab === 'metro' ? 'Metro' : 'Nişangah'} axtar...`}
              className="input pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5">
            {filtered.map((item) => {
              const active = cur.sel.includes(item);
              return (
                <label key={item} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-ink-50 rounded px-1">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${active ? 'bg-tap border-tap' : 'border-ink-300'}`}>
                    {active && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span onClick={() => toggle(item)} className={`text-sm ${active ? 'text-tap font-semibold' : 'text-ink-700'}`}>{item}</span>
                </label>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-ink-400">"{q}" tapılmadı</div>
          )}
        </div>

        <footer className="p-4 border-t border-ink-200 flex items-center justify-between gap-3">
          <button onClick={reset} className="btn-secondary">Sıfırla</button>
          <div className="text-sm text-ink-500">{totalSelected > 0 && `${totalSelected} seçilib`}</div>
          <button
            onClick={() => { onApply({ districts, metros, landmarks }); onClose(); }}
            className="btn-tap flex-1 max-w-xs"
          >
            Axtarışa əlavə et
          </button>
        </footer>
      </div>
    </div>
  );
}
