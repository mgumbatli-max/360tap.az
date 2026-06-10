'use client';
import { useState } from 'react';
import { Gift, Copy, Check } from 'lucide-react';

export default function ReferralProgram() {
  const [copied, setCopied] = useState(false);
  const code = 'TAP-MAQ-2026';
  const copy = () => { navigator.clipboard.writeText(`https://360tap.az/r/${code}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="card p-4 bg-gradient-to-br from-amber-50 via-pink-50 to-tap-50">
      <h3 className="font-bold flex items-center gap-2 mb-2"><Gift className="w-4 h-4 text-amber-600" /> Dostunu dəvət et</h3>
      <p className="text-xs text-ink-600 mb-3">Hər dəvət olunan dost qeydiyyatdan keçəndə hər ikiniz <strong>5 ₼ bonus</strong> qazanın</p>
      <div className="flex gap-2 mb-3">
        <input value={`360tap.az/r/${code}`} readOnly className="input flex-1 !py-2 !text-xs font-mono" />
        <button onClick={copy} className={`btn-tap !py-2 !text-xs ${copied ? '!bg-emerald-500' : ''}`}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Cell value="12" label="dəvət" />
        <Cell value="8" label="qoşulub" />
        <Cell value="40 ₼" label="qazanc" />
      </div>
    </div>
  );
}
function Cell({ value, label }: any) {
  return (
    <div className="bg-white p-2 rounded-lg">
      <div className="font-extrabold text-tap">{value}</div>
      <div className="text-[10px] text-ink-500">{label}</div>
    </div>
  );
}
