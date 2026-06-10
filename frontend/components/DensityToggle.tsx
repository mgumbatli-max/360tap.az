'use client';
import { useEffect, useState } from 'react';
import { LayoutGrid, Rows3 } from 'lucide-react';

const KEY = 'tap_density';
type Density = 'comfortable' | 'compact';

export default function DensityToggle() {
  const [density, setDensity] = useState<Density>('comfortable');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Density;
      if (saved) { setDensity(saved); document.documentElement.dataset.density = saved; }
    } catch {}
  }, []);

  const toggle = () => {
    const next: Density = density === 'comfortable' ? 'compact' : 'comfortable';
    setDensity(next);
    try { localStorage.setItem(KEY, next); } catch {}
    document.documentElement.dataset.density = next;
  };

  return (
    <button onClick={toggle}
      className="p-2 hover:bg-ink-50 dark:hover:bg-ink-800 rounded-lg text-ink-700 dark:text-ink-300"
      title={density === 'comfortable' ? 'Kompakt görünüş' : 'Rahat görünüş'}>
      {density === 'comfortable' ? <Rows3 className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
    </button>
  );
}
