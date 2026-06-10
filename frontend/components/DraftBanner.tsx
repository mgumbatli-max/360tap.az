'use client';
import { useEffect, useState } from 'react';
import { Save, X, RotateCcw } from 'lucide-react';
import { getDraft, clearDraft, type DraftData } from '@/lib/draft';

function formatTime(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'indi';
  if (diff < 3600) return `${Math.floor(diff / 60)} dəq əvvəl`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
  return `${Math.floor(diff / 86400)} gün əvvəl`;
}

export default function DraftBanner({ onRestore }: { onRestore: (data: DraftData) => void }) {
  const [draft, setDraft] = useState<{ data: DraftData; savedAt: number } | null>(null);

  useEffect(() => {
    const d = getDraft();
    if (d && d.data && Object.keys(d.data).some((k) => d.data[k])) {
      setDraft(d);
    }
  }, []);

  if (!draft) return null;

  const onUse = () => {
    onRestore(draft.data);
    setDraft(null);
  };
  const onDismiss = () => {
    clearDraft();
    setDraft(null);
  };

  return (
    <div className="card p-4 mb-4 bg-amber-50 border-amber-200 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
        <Save className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-amber-900">Saxlanmış qaralama tapıldı</h4>
        <p className="text-sm text-amber-700 mt-0.5">
          {formatTime(draft.savedAt)} avtomatik saxlanıldı. Davam etmək istəyirsiniz?
        </p>
        <div className="flex gap-2 mt-3">
          <button onClick={onUse} className="btn-tap text-sm">
            <RotateCcw className="w-3.5 h-3.5" /> Bərpa et
          </button>
          <button onClick={onDismiss} className="btn-secondary text-sm">
            <X className="w-3.5 h-3.5" /> Sil
          </button>
        </div>
      </div>
    </div>
  );
}
