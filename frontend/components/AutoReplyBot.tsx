'use client';
import { useState } from 'react';
import { Bot, Plus } from 'lucide-react';
import { useToast } from '@/lib/toast';

const TEMPLATES = [
  'Salam! Hələ də mövcuddur.',
  'Qiymət son. Endirim ola bilməz.',
  'Görüşə bilərik istənilən vaxt.',
  'Şəkillər mövcuddur — sual versəniz cavab verərəm.',
];

export default function AutoReplyBot() {
  const [enabled, setEnabled] = useState(false);
  const [picks, setPicks] = useState<string[]>([]);
  const toast = useToast();
  const toggle = () => { setEnabled(!enabled); toast.success(enabled ? 'AI cavab söndürüldü' : 'AI cavab yandırıldı'); };
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold flex items-center gap-2 text-sm"><Bot className="w-4 h-4 text-tap" /> AI avtomatik cavab</h3>
        <button onClick={toggle} className={`text-xs font-bold ${enabled ? 'text-emerald-600' : 'text-ink-500'}`}>{enabled ? 'Aktiv' : 'Söndürülmüş'}</button>
      </div>
      <p className="text-xs text-ink-500 mb-3">Siz onlayn deyilkən AI alıcılara cavab verir</p>
      <div className="space-y-1">
        {TEMPLATES.map((t) => (
          <label key={t} className="flex items-center gap-2 text-sm p-1.5 hover:bg-ink-50 rounded cursor-pointer">
            <input type="checkbox" checked={picks.includes(t)} onChange={() => setPicks(picks.includes(t) ? picks.filter(x => x !== t) : [...picks, t])} className="accent-tap" />
            <span className="text-xs">{t}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
