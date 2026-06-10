'use client';
import { useState } from 'react';
import { Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';

const TIPS = [
  { emoji: '📷', title: 'Keyfiyyətli şəkillər çəkin', text: 'Gündüz işığında, fərqli açılardan ən azı 5 şəkil — 3 dəfə daha çox baxış!' },
  { emoji: '✍️', title: 'Ətraflı təsvir yazın', text: 'Vəziyyət, çatışmazlıqlar, üstünlüklər — alıcılar dürüstlüyü dəyərləndirir' },
  { emoji: '💰', title: 'Bazar qiyməti araşdırın', text: 'AI Market Analyzer ilə real qiymət təyin edin, çox yüksək olmamalı' },
  { emoji: '🕐', title: 'Axşam saatlarında yerləşdirin', text: '18:00-21:00 ən aktiv vaxtdır — daha çox baxış' },
  { emoji: '✅', title: 'Sürətli cavab verin', text: '5 dəqiqəyə cavab verənlərin satış sayı 4 dəfə yüksəkdir' },
  { emoji: '🎯', title: 'Açar sözlər əlavə edin', text: 'Başlığa marka, model, il, vəziyyət — SEO üçün vacib' },
];

export default function ProTipsCarousel() {
  const [i, setI] = useState(0);
  const tip = TIPS[i];
  return (
    <div className="card p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-600" /> Satış məsləhəti #{i+1}/{TIPS.length}</h3>
        <div className="flex gap-1">
          <button onClick={() => setI((i - 1 + TIPS.length) % TIPS.length)} className="w-6 h-6 hover:bg-amber-100 rounded"><ChevronLeft className="w-4 h-4 m-auto" /></button>
          <button onClick={() => setI((i + 1) % TIPS.length)} className="w-6 h-6 hover:bg-amber-100 rounded"><ChevronRight className="w-4 h-4 m-auto" /></button>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="text-3xl">{tip.emoji}</div>
        <div className="flex-1">
          <div className="font-bold text-sm">{tip.title}</div>
          <p className="text-xs text-ink-700 mt-0.5">{tip.text}</p>
        </div>
      </div>
    </div>
  );
}
