'use client';
import { Bell, Plus, TrendingDown, Sparkles } from 'lucide-react';
import { useState } from 'react';

const ALERTS = [
  { type: 'price_drop', label: 'Sevdiyiniz BMW X5-də qiymət -2000₼ düşdü', time: '30 dəq', color: 'text-emerald-600 bg-emerald-50' },
  { type: 'match',      label: '"Mənzil Nəsimi" axtarışına 3 yeni elan uyğun gəldi', time: '2 saat', color: 'text-tap bg-tap-50' },
  { type: 'tip',        label: 'BMW X5 2020 üçün AI proqnoz: 7 günə satılacaq', time: '1 gün', color: 'text-violet-600 bg-violet-50' },
];

export default function SmartAlerts() {
  return (
    <div className="card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-tap" /> Smart bildirişlər
        <span className="text-[10px] bg-red-500 text-white px-1.5 rounded-full">3</span>
      </h3>
      <div className="space-y-2">
        {ALERTS.map((a, i) => (
          <div key={i} className={`p-2.5 rounded-lg ${a.color}`}>
            <div className="text-sm font-medium">{a.label}</div>
            <div className="text-[10px] mt-0.5 opacity-75">{a.time} əvvəl</div>
          </div>
        ))}
      </div>
    </div>
  );
}
