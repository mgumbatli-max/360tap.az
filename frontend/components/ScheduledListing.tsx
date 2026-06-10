'use client';
import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

export default function ScheduledListing({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [enabled, setEnabled] = useState(!!value);
  return (
    <div className="card p-3">
      <label className="flex items-center justify-between cursor-pointer mb-2">
        <span className="font-bold text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-tap" /> Planlaşdırılmış yerləşdirmə</span>
        <input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); if (!e.target.checked) onChange(''); }}
          className="w-5 h-5 accent-tap" />
      </label>
      {enabled && (
        <input type="datetime-local" value={value || ''} onChange={(e) => onChange(e.target.value)} className="input" />
      )}
      {!enabled && <p className="text-xs text-ink-500">Elanı gələcəkdə avtomatik dərc et</p>}
    </div>
  );
}
