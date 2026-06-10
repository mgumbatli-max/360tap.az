'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Car, Home, Briefcase, Wrench, Package, Sofa, Wrench as Tools, Cpu, Heart,
  PawPrint, Building, Drill, ChevronDown, X,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  neqliyyat: Car,
  'dasinmaz-emlak': Home,
  'is-elanlari': Briefcase,
  elektronika: Cpu,
  'ev-bag': Sofa,
  'shexsi-esyalar': Package,
  'usaq-alemi': Heart,
  heyvanlar: PawPrint,
  'tikinti-temir': Drill,
  'hobbi-asude': Tools,
  'biznes-avadanliq': Building,
  'kend-teserrufati': Sofa,
  xidmetler: Wrench,
};

type CatNode = {
  id: string;
  slug: string;
  name_az?: string; // köhnə Express
  nameAz?: string; // NestJS
  icon?: string;
  children?: CatNode[];
};

const catName = (c: CatNode): string => c.nameAz ?? c.name_az ?? '';

export default function MegaMenu({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: CatNode[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (categories.length > 0) setActive(categories[0].slug);
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onEsc);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose, categories]);

  if (!open) return null;

  const activeNode = categories.find((c) => c.slug === active);
  const subColumns = chunkIntoColumns(activeNode?.children ?? [], 4);

  return (
    <div className="absolute left-0 right-0 top-full z-50 animate-slide-down">
      <div ref={ref} className="mx-auto max-w-7xl px-4 mt-2">
        <div className="bg-white rounded-2xl shadow-menu border border-ink-200 overflow-hidden flex">
          {/* Sol kateqoriya siyahısı */}
          <div className="w-64 bg-ink-50 py-3 max-h-[70vh] overflow-y-auto">
            {categories.map((c) => {
              const Icon = ICONS[c.slug] ?? Package;
              const isActive = c.slug === active;
              return (
                <button
                  key={c.id}
                  onMouseEnter={() => setActive(c.slug)}
                  onClick={() => setActive(c.slug)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                    isActive ? 'bg-white text-ink-900 font-semibold' : 'text-ink-700 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-tap' : 'text-ink-400'}`} />
                  <span className="flex-1">{catName(c)}</span>
                  {c.children && c.children.length > 0 && (
                    <ChevronDown className="w-4 h-4 -rotate-90 opacity-40" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sağ alt-kateqoriya panel */}
          <div className="flex-1 p-6 max-h-[70vh] overflow-y-auto">
            {activeNode && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-bold text-ink-900">
                    <Link href={`/elanlar?category=${activeNode.slug}`} onClick={onClose} className="hover:text-tap">
                      {catName(activeNode)} →
                    </Link>
                  </h3>
                  <button onClick={onClose} className="p-1 rounded hover:bg-ink-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {subColumns.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1">
                    {subColumns.map((col, i) => (
                      <div key={i} className="space-y-1">
                        {col.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/elanlar?category=${sub.slug}`}
                            onClick={onClose}
                            className="block py-1.5 text-sm text-ink-700 hover:text-tap"
                          >
                            {catName(sub)}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-400">Alt-kateqoriyalar mövcud deyil</p>
                )}
              </>
            )}
          </div>

          {/* Sağ panel (services - Avito stil) */}
          <div className="w-56 bg-tap-50 p-5 hidden lg:block">
            <h4 className="font-bold text-sm mb-3 text-ink-900">Servislər</h4>
            <ul className="space-y-2 text-sm text-ink-700">
              <li><Link href="/biznes" onClick={onClose} className="hover:text-tap">Biznes 360</Link></li>
              <li><Link href="/komek" onClick={onClose} className="hover:text-tap">Yardım mərkəzi</Link></li>
              <li><Link href="/reklam" onClick={onClose} className="hover:text-tap">Reklam yerləşdirmək</Link></li>
              <li><Link href="/qiymetler" onClick={onClose} className="hover:text-tap">Tariflər</Link></li>
              <li><Link href="/elanlar?delivery=1" onClick={onClose} className="hover:text-tap">Çatdırılma</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function chunkIntoColumns<T>(arr: T[], cols: number): T[][] {
  if (arr.length === 0) return [];
  const perCol = Math.ceil(arr.length / cols);
  const result: T[][] = [];
  for (let i = 0; i < cols; i++) {
    result.push(arr.slice(i * perCol, (i + 1) * perCol));
  }
  return result.filter((c) => c.length > 0);
}
