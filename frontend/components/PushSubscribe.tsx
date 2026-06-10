'use client';
import { useState, useEffect } from 'react';
import { BellRing } from 'lucide-react';
import { useToast } from '@/lib/toast';

export default function PushSubscribe() {
  const [perm, setPerm] = useState<NotificationPermission>('default');
  const toast = useToast();
  useEffect(() => { if (typeof Notification !== 'undefined') setPerm(Notification.permission); }, []);
  const ask = async () => {
    if (typeof Notification === 'undefined') { toast.error('Brauzer dəstəkləmir'); return; }
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === 'granted') {
      toast.success('Bildirişlər aktivləşdirildi');
      new Notification('360tap.az', { body: 'Push bildirişləri aktivdir 🎉' });
    }
  };
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-tap text-white flex items-center justify-center">
        <BellRing className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm">Push bildirişləri</div>
        <div className="text-xs text-ink-500">Yeni elan, qiymət düşmə, mesaj — brauzer-də</div>
      </div>
      <button onClick={ask} className={`text-xs font-bold ${perm === 'granted' ? 'text-emerald-600' : 'text-tap'}`}>
        {perm === 'granted' ? 'Aktiv' : 'Aktivləşdir'}
      </button>
    </div>
  );
}
