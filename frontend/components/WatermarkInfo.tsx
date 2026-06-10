'use client';
import { Sparkles, Shield } from 'lucide-react';

export default function WatermarkInfo() {
  return (
    <div className="card p-3 bg-blue-50 border-blue-200">
      <h4 className="font-bold text-sm flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-500" /> Şəkillər oğurluqdan qorunur</h4>
      <p className="text-xs text-ink-600 mt-1">Hər şəkilə avtomatik <strong>360tap.az</strong> watermark əlavə edilir. Şəkilləriniz başqa saytda istifadə oluna bilməz.</p>
    </div>
  );
}
