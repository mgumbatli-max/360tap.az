import Link from 'next/link';
import { Package, Building2, Box, Truck, Wrench, Users, Sparkles } from 'lucide-react';

const SERVICES = [
  { icon: Package, label: 'Avadanlıq', href: '/k/avadanliq' },
  { icon: Building2, label: 'Sahə', href: '/k/saha' },
  { icon: Box, label: 'Məhsullar', href: '/k/mehsullar' },
  { icon: Truck, label: 'Nəqliyyat', href: '/k/neqliyyat' },
  { icon: Wrench, label: 'Xidmətlər', href: '/k/xidmetler' },
  { icon: Users, label: 'İşçilər', href: '/k/is' },
];

export default function BusinessPanel() {
  return (
    <aside className="card p-5">
      <h3 className="font-bold text-ink-900 mb-1 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-tap" />
        Hər şey biznes üçün
      </h3>
      <p className="text-xs text-ink-500 mb-4">
        360tap Biznes 360 — milyonlarla təklif
      </p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {SERVICES.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-ink-50 transition-colors text-center"
          >
            <s.icon className="w-7 h-7 text-tap" strokeWidth={1.5} />
            <span className="text-[11px] text-ink-700 font-medium leading-tight">{s.label}</span>
          </Link>
        ))}
      </div>

      <Link
        href="/biznes"
        className="block w-full text-center btn-tap text-sm"
      >
        Biznes 360-da axtar →
      </Link>

      {/* Servislər siyahısı */}
      <div className="mt-5 pt-5 border-t border-ink-200">
        <h4 className="font-semibold text-sm text-ink-900 mb-3">Servislər</h4>
        <ul className="space-y-2.5 text-xs text-ink-600">
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">●</span>
            <span><strong className="text-ink-900">Çatdırılma</strong><br />Sifarişlərin pulsuz qaytarılması zəmanəti</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">●</span>
            <span><strong className="text-ink-900">Avtocheck</strong><br />Avtonun tarixi, yürüş, mülkiyyət, DTP</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 mt-0.5">●</span>
            <span><strong className="text-ink-900">Verified satıcılar</strong><br />Şirkət təsdiqi və sənədlər</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
