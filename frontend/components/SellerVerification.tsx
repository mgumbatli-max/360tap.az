'use client';
import { useState } from 'react';
import { Shield, Upload, CheckCircle } from 'lucide-react';
import { useToast } from '@/lib/toast';

export default function SellerVerification({ isVerified = false }: { isVerified?: boolean }) {
  const [verifying, setVerifying] = useState(false);
  const toast = useToast();
  if (isVerified) {
    return (
      <div className="card p-3 bg-emerald-50 border-emerald-200 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <div className="font-bold text-sm text-emerald-700">Təsdiqlənmiş satıcı</div>
          <div className="text-xs text-ink-600">Şəxsiyyət sənədi yoxlanılıb</div>
        </div>
      </div>
    );
  }
  const verify = () => {
    setVerifying(true);
    setTimeout(() => { setVerifying(false); toast.success('Sənəd qəbul edildi, 24 saata yoxlanacaq'); }, 1000);
  };
  return (
    <div className="card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-tap" /> Təsdiqlənmiş satıcı ol</h3>
      <p className="text-xs text-ink-500 mb-3">Şəxsiyyət vəsiqəsi ilə təsdiqlən — alıcılar daha çox güvənsin</p>
      <button onClick={verify} disabled={verifying} className="btn-tap w-full text-sm">
        <Upload className="w-4 h-4" /> {verifying ? 'Göndərilir...' : 'Sənəd yüklə'}
      </button>
    </div>
  );
}
