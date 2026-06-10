'use client';
import { useState } from 'react';
import { LayoutTemplate, Plus } from 'lucide-react';

const TEMPLATES = [
  { id: 1, name: 'Avtomobil', emoji: '🚗', fields: ['Marka', 'Model', 'İl', 'Yürüş', 'Mühərrik', 'Rəng'] },
  { id: 2, name: 'Mənzil',    emoji: '🏠', fields: ['Otaq sayı', 'Sahə', 'Mərtəbə', 'Bina yaşı', 'Təmir'] },
  { id: 3, name: 'Telefon',   emoji: '📱', fields: ['Marka', 'Model', 'Yaddaş', 'Rəng', 'Vəziyyət'] },
  { id: 4, name: 'İş',        emoji: '💼', fields: ['Vəzifə', 'Maaş', 'Tələblər', 'İş saatları'] },
];

export default function ListingTemplate({ onPick }: { onPick: (t: any) => void }) {
  return (
    <div className="card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-3"><LayoutTemplate className="w-4 h-4 text-tap" /> Sürətli şablonlar</h3>
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((t) => (
          <button key={t.id} onClick={() => onPick(t)} className="card p-3 text-left hover:border-tap">
            <div className="text-2xl mb-1">{t.emoji}</div>
            <div className="font-bold text-sm">{t.name}</div>
            <div className="text-[10px] text-ink-500 mt-0.5">{t.fields.length} sahə</div>
          </button>
        ))}
      </div>
    </div>
  );
}
