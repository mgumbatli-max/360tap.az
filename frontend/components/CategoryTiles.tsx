'use client';
import Link from 'next/link';
import {
  Car, Home, Briefcase, Wrench, Package, Sofa, Cpu, PawPrint, Building, Drill,
  Heart, ShirtIcon, Plane, Sparkles, Layers, Drumstick,
} from 'lucide-react';

const ICONS: Record<string, { Icon: any; bg: string }> = {
  neqliyyat:        { Icon: Car,        bg: 'bg-emerald-50' },
  'dasinmaz-emlak': { Icon: Home,       bg: 'bg-blue-50' },
  'is-elanlari':    { Icon: Briefcase,  bg: 'bg-amber-50' },
  xidmetler:        { Icon: Wrench,     bg: 'bg-rose-50' },
  geyim:            { Icon: ShirtIcon,  bg: 'bg-pink-50' },
  'ev-ve-bag':      { Icon: Sofa,       bg: 'bg-orange-50' },
  ehtiyat:          { Icon: Drill,      bg: 'bg-slate-100' },
  elektronika:      { Icon: Cpu,        bg: 'bg-purple-50' },
  'usaq':           { Icon: Heart,      bg: 'bg-red-50' },
  heyvanlar:        { Icon: PawPrint,   bg: 'bg-yellow-50' },
  biznes:           { Icon: Building,   bg: 'bg-teal-50' },
  hobby:            { Icon: Sparkles,   bg: 'bg-indigo-50' },
  'putesh':         { Icon: Plane,      bg: 'bg-sky-50' },
  goyzel:           { Icon: Sparkles,   bg: 'bg-fuchsia-50' },
};

type Cat = { id: string; slug: string; name_az: string; icon?: string; children?: any[] };

export default function CategoryTiles({ categories }: { categories: Cat[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3">
      {categories.map((c) => {
        const def = ICONS[c.slug] ?? { Icon: Layers, bg: 'bg-slate-50' };
        const Icon = def.Icon;
        return (
          <Link
            key={c.id}
            href={`/elanlar?category=${c.slug}`}
            className={`card-tile ${def.bg} p-3 md:p-4 text-center group`}
          >
            <div className="aspect-square flex items-center justify-center mb-2">
              <Icon className="w-12 h-12 md:w-14 md:h-14 text-ink-700 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            </div>
            <div className="text-[11px] md:text-sm font-semibold text-ink-900 leading-tight">
              {c.name_az}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
