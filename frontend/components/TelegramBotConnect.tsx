'use client';
import { useState } from 'react';
import { Send, Check } from 'lucide-react';

export default function TelegramBotConnect() {
  const [connected, setConnected] = useState(false);
  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center">
          <Send className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm">Telegram bot</div>
          <div className="text-xs text-ink-500">{connected ? 'Bağlanıb — bildirişlər Telegram-a gəlir' : 'Bildirişləri Telegram-da al'}</div>
        </div>
        <button onClick={() => setConnected(!connected)} className={`text-xs font-bold ${connected ? 'text-emerald-600' : 'text-blue-500'}`}>
          {connected ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Aktiv</span> : 'Bağla'}
        </button>
      </div>
    </div>
  );
}
