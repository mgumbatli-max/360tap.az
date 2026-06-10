'use client';
import { TrendingDown, TrendingUp, Minus, Sparkles } from 'lucide-react';

export default function PricingAssistant({ yourPrice, marketAvg = 25000 }: { yourPrice: number; marketAvg?: number }) {
  if (!yourPrice) return null;
  const diff = ((yourPrice - marketAvg) / marketAvg) * 100;
  const status = diff > 15 ? 'high' : diff < -15 ? 'low' : 'good';
  const config = {
    high: { color: 'text-amber-600 bg-amber-50 border-amber-200', icon: TrendingUp, label: 'Qiymət yüksəkdir', text: `Bazar ortasından ${diff.toFixed(0)}% yüksək. ${Math.round(marketAvg * 1.05).toLocaleString('az-AZ')}₼ tövsiyə.` },
    low:  { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: TrendingDown, label: 'Qiymət aşağıdır', text: `Bazardan ${(-diff).toFixed(0)}% aşağı — sürətli satılacaq` },
    good: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: Sparkles, label: 'İdeal qiymət', text: 'Bazar ortasına yaxın — uyğun seçim' },
  }[status];
  const I = config.icon;
  return (
    <div className={`card p-3 border ${config.color}`}>
      <div className="flex items-center gap-2 font-bold text-sm"><I className="w-4 h-4" /> {config.label}</div>
      <p className="text-xs mt-1">{config.text}</p>
    </div>
  );
}
