'use client';
import { Sparkles, Truck, Zap, Image, Crown, Award, Calendar, Tag } from 'lucide-react';

const CHIPS = [
  { id: 'today',     icon: Calendar,  label: 'Bu gün',           param: 'sort=new' },
  { id: 'delivery',  icon: Truck,     label: 'Çatdırılma var',   param: 'has_delivery=1' },
  { id: 'discount',  icon: Tag,       label: 'Endirimli',         param: 'sort=price_dropped' },
  { id: 'photo',     icon: Image,     label: 'Şəkilli',           param: 'with_photo=1' },
  { id: 'vip',       icon: Crown,     label: 'VIP',               param: 'sort=vip' },
  { id: 'verified',  icon: Award,     label: 'Təsdiqli satıcı',   param: 'verified=1' },
  { id: 'flash',     icon: Zap,       label: 'Sürətli satılır',   param: 'sort=fast' },
  { id: 'ai',        icon: Sparkles,  label: 'AI tövsiyəsi',      param: 'ai=1' },
];

export default function QuickFilterChips({ onApply }: { onApply: (param: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
      {CHIPS.map((c) => {
        const I = c.icon;
        return (
          <button key={c.id} onClick={() => onApply(c.param)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-white dark:bg-ink-800 border border-ink-200 hover:border-tap hover:bg-tap-50 text-sm font-medium transition flex items-center gap-1.5">
            <I className="w-3.5 h-3.5 text-tap" />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
