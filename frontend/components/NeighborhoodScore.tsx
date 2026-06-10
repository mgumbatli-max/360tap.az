'use client';
import { useEffect, useState } from 'react';
import { Leaf, GraduationCap, ShieldCheck, Train, Trees, Footprints } from 'lucide-react';
import { api } from '@/lib/api';

export default function NeighborhoodScore({ district }: { district: string }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (!district) return;
    api(`/realestate/neighborhood/${encodeURIComponent(district)}`)
      .then(setData).catch(() => setData(null));
  }, [district]);

  if (!data) return null;
  const items = [
    { key: 'walkability', icon: Footprints, label: 'Piyada gəzilməsi' },
    { key: 'school',      icon: GraduationCap, label: 'Məktəblər' },
    { key: 'safety',      icon: ShieldCheck, label: 'Təhlükəsizlik' },
    { key: 'transit',     icon: Train, label: 'Nəqliyyat' },
    { key: 'parks',       icon: Trees, label: 'Parklar' },
  ];

  return (
    <div className="card p-4 bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold flex items-center gap-2"><Leaf className="w-4 h-4 text-emerald-600" /> Məhəllə qiymətləndirməsi</h3>
          <p className="text-xs text-ink-500">{data.district}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-emerald-700">{data.overall}</div>
          <div className="text-xs text-emerald-600 font-bold">Qiymət: {data.grade}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map((it) => {
          const v = data.scores[it.key];
          return (
            <div key={it.key} className="flex items-center gap-2 text-xs">
              <it.icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="w-32 shrink-0">{it.label}</span>
              <div className="flex-1 bg-emerald-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${v}%` }} />
              </div>
              <span className="font-bold w-6 text-right">{v}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-emerald-700 mt-3 italic">{data.summary}</p>
    </div>
  );
}
