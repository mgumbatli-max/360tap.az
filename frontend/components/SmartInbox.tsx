'use client';
import { useState } from 'react';
import { Zap, MessageSquare, Calendar, MapPin, Phone, DollarSign, X } from 'lucide-react';

const QUICK_REPLIES = [
  { icon: MessageSquare, text: 'Salam, məhsul hələ də mövcuddur?' },
  { icon: DollarSign,    text: 'Qiymətdə endirim mümkündürmü?' },
  { icon: MapPin,        text: 'Hansı ünvanda yerləşirsiniz?' },
  { icon: Calendar,      text: 'Bu gün/sabah görüşə bilərikmi?' },
  { icon: Phone,         text: 'Sizə zəng edə bilərəmmi?' },
  { icon: MessageSquare, text: 'Çatdırılma var? Hansı şərtlərlə?' },
];

const SELLER_TEMPLATES = [
  'Bəli, məhsul mövcuddur ✓',
  'Qiymət sondur, endirim yoxdur',
  'Bakıda yerləşirəm, ünvan göndərirəm',
  'Bu gün axşam görüşə bilərik',
  'Çatdırılma var — Bakı daxili ödənişlidir',
  'Ümumi məbləğ + çatdırılma 50 ₼',
];

export default function SmartInbox({ onSelect, isSeller = false }: {
  onSelect: (text: string) => void;
  isSeller?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const replies = isSeller ? SELLER_TEMPLATES : QUICK_REPLIES.map((r) => r.text);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-ink-100 rounded-lg text-ink-600"
        aria-label="Sürətli cavab"
        title="Sürətli cavab şablonları"
      >
        <Zap className="w-5 h-5 text-amber-500" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-ink-200 rounded-xl shadow-menu p-2 z-40 animate-slide-down">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-xs font-bold text-ink-500 uppercase">
              {isSeller ? 'Cavab şablonları' : 'Sürətli sual'}
            </span>
            <button onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {replies.map((text, i) => {
              const Icon = !isSeller ? QUICK_REPLIES[i]?.icon ?? MessageSquare : MessageSquare;
              return (
                <button
                  key={i}
                  onClick={() => { onSelect(text); setOpen(false); }}
                  className="w-full flex items-start gap-2 p-2 rounded text-left hover:bg-ink-50 text-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-tap mt-0.5 shrink-0" />
                  <span>{text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
