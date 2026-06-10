'use client';
import Link from 'next/link';
import {
  Home, Car, Briefcase, Wrench, Cpu, Sofa, Shirt, Baby, Gift, Building, Dumbbell, Tractor,
  PawPrint, Layers, Smartphone, Laptop, Tv, Hammer, Music, BookOpen, Camera, Watch,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home, car: Car, briefcase: Briefcase, wrench: Wrench, cpu: Cpu,
  sofa: Sofa, shirt: Shirt, baby: Baby, gift: Gift, building: Building,
  dumbbell: Dumbbell, tractor: Tractor, paw: PawPrint, smartphone: Smartphone,
  laptop: Laptop, tv: Tv, hammer: Hammer, music: Music, book: BookOpen,
  camera: Camera, watch: Watch,
};

// Hər kateqoriyaya unikal rəng təyin edilir (sırasına görə)
const COLORS = [
  'cat-color-blue', 'cat-color-rose', 'cat-color-orange', 'cat-color-purple',
  'cat-color-cyan', 'cat-color-amber', 'cat-color-pink', 'cat-color-green',
  'cat-color-teal', 'cat-color-indigo', 'cat-color-violet',
];

type Cat = {
  id: string;
  slug: string;
  name_az: string;
  icon?: string;
  listings_count?: number;
  children?: Cat[];
};

export default function CategoryGrid({ categories }: { categories: Cat[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
      {categories.map((c, i) => {
        const Icon = (c.icon && ICONS[c.icon]) || Layers;
        const colorClass = COLORS[i % COLORS.length];
        return (
          <Link
            key={c.id}
            href={`/elanlar?category=${c.slug}`}
            className={`card card-vibrant ${colorClass} p-4 flex flex-col items-center justify-center text-center gap-3 min-h-[140px] animate-slide-up relative group`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 relative z-10"
              style={{ background: 'var(--cat-bg)' }}
            >
              <Icon className="w-7 h-7" style={{ color: 'var(--cat)' }} />
            </div>
            <div className="relative z-10">
              <div className="text-sm font-semibold leading-tight">{c.name_az}</div>
              {typeof c.listings_count === 'number' && c.listings_count > 0 && (
                <div className="text-xs opacity-60 mt-0.5">{c.listings_count} elan</div>
              )}
            </div>
            {c.children && c.children.length > 0 && (
              <span className="absolute top-2 right-2 text-[10px] font-bold opacity-60 bg-white/60 dark:bg-black/40 px-1.5 py-0.5 rounded-full">
                {c.children.length}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
