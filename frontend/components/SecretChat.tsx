'use client';
import { Lock, EyeOff } from 'lucide-react';

export default function SecretChat() {
  return (
    <div className="card p-3 border-violet-200 bg-violet-50 dark:bg-violet-500/10">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-violet-600" />
        <h4 className="font-bold text-sm text-violet-700">Şifrəli mesajlaşma</h4>
      </div>
      <p className="text-xs text-ink-600 mt-1 flex items-center gap-1"><EyeOff className="w-3 h-3" /> E2E şifrələmə — yalnız siz və satıcı görə bilər</p>
    </div>
  );
}
