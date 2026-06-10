'use client';
import { useState, useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { loadDraft, clearDraft } from '@/lib/draft';

export default function DraftRestoreBanner({ onRestore }: { onRestore: (form: any) => void }) {
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    const d = loadDraft();
    if (d && d.form?.title) {
      setDraft(d);
    }
  }, []);

  if (!draft) return null;
  const ago = Math.round((Date.now() - draft.savedAt) / 60000);

  return (
    <div className="card p-3 mb-4 bg-amber-50 border-amber-200 flex items-center gap-2 animate-fade-in-up">
      <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
      <div className="flex-1 text-sm">
        <strong>Yarımçıq elan:</strong> "{draft.form.title}" ({ago} dəq öncə)
      </div>
      <button onClick={() => { onRestore(draft.form); setDraft(null); }} className="btn-tap text-xs !py-1.5">Bərpa et</button>
      <button onClick={() => { clearDraft(); setDraft(null); }} className="p-1 hover:bg-amber-100 rounded">
        <X className="w-3.5 h-3.5 text-amber-600" />
      </button>
    </div>
  );
}
