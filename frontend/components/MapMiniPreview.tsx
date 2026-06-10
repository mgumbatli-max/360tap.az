'use client';
import { MapPin } from 'lucide-react';

export default function MapMiniPreview({ city, district }: { city?: string; district?: string }) {
  if (!city) return null;
  return (
    <div className="card p-2 bg-gradient-to-br from-blue-100 to-emerald-100 relative overflow-hidden h-24">
      <div className="absolute inset-0 opacity-30">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <path d="M0,50 Q50,20 100,50 T200,50" stroke="#fff" strokeWidth="2" fill="none" />
          <path d="M20,30 L40,40 L60,30" stroke="#fff" strokeWidth="1" fill="none" />
          <circle cx="100" cy="50" r="3" fill="#ef4444" />
        </svg>
      </div>
      <div className="relative">
        <MapPin className="w-4 h-4 text-red-500" />
        <div className="font-bold text-sm">{city}</div>
        {district && <div className="text-xs text-ink-600">{district}</div>}
      </div>
    </div>
  );
}
