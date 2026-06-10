'use client';
import { Shield, Lock } from 'lucide-react';

export default function EscrowBadge() {
  return (
    <div className="card p-3 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
        <Lock className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm flex items-center gap-1 text-emerald-700"><Shield className="w-3.5 h-3.5" /> Təhlükəsiz ödəniş</div>
        <p className="text-xs text-ink-600 mt-0.5">Pulu 360tap saxlayır, məhsul alındıqdan sonra satıcıya verilir</p>
      </div>
      <button className="text-xs btn-secondary">Aktivləşdir</button>
    </div>
  );
}
