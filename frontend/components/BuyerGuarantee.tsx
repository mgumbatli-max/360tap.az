'use client';
import { Shield, Clock, RefreshCw } from 'lucide-react';

export default function BuyerGuarantee() {
  const items = [
    { icon: Shield, label: 'Təhlükəsiz əqd', text: '360tap-da hər mərhələ qorunur' },
    { icon: Clock,  label: '7 gün qaytarma', text: 'Razı olmasanız geri ala bilərsiniz' },
    { icon: RefreshCw, label: 'Pulsuz dəyişdirmə', text: 'Eyni qiymətdə başqası ilə dəyiş' },
  ];
  return (
    <div className="card p-4 bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200">
      <h4 className="font-bold text-sm text-emerald-700 mb-3 flex items-center gap-1.5">
        <Shield className="w-4 h-4" /> Alıcı zəmanəti
      </h4>
      <div className="space-y-2">
        {items.map((it, i) => {
          const I = it.icon;
          return (
            <div key={i} className="flex items-start gap-2">
              <I className="w-4 h-4 text-emerald-600 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">{it.label}</div>
                <div className="text-xs text-ink-600">{it.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
