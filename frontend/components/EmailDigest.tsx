'use client';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useToast } from '@/lib/toast';

export default function EmailDigest() {
  const [email, setEmail] = useState('');
  const toast = useToast();
  const subscribe = () => {
    if (!email.includes('@')) { toast.error('Düzgün e-poçt yazın'); return; }
    toast.success(`Həftəlik xülasəyə abunə oldunuz: ${email}`);
    setEmail('');
  };
  return (
    <div className="card p-4 bg-gradient-to-r from-blue-50 to-violet-50 border-blue-200">
      <h3 className="font-bold flex items-center gap-2 mb-2"><Mail className="w-4 h-4 text-blue-500" /> Həftəlik xülasə</h3>
      <p className="text-xs text-ink-600 mb-3">Hər həftə ən populyar elanlar, qiymət düşmələri və yeniliklər e-poçtunuza</p>
      <div className="flex gap-2">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ad@misal.az"
          className="input flex-1 !py-2 !text-sm" />
        <button onClick={subscribe} className="btn-tap !py-2 !text-sm">Abunə ol</button>
      </div>
    </div>
  );
}
