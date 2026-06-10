'use client';
import { User, Calendar, Shield, MessageSquare } from 'lucide-react';

export default function BuyerProfilePreview({ buyer }: { buyer?: any }) {
  if (!buyer) return null;
  return (
    <div className="card p-3 bg-blue-50 border-blue-200">
      <div className="flex items-start gap-2">
        <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">{buyer.name?.[0] || '?'}</div>
        <div className="flex-1">
          <div className="font-bold text-sm flex items-center gap-1">{buyer.name || 'Anonim'} {buyer.verified && <Shield className="w-3 h-3 text-emerald-500" />}</div>
          <div className="text-[10px] text-ink-600 flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{buyer.member_since || '2024'}-dən üzv</span>
            <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" />{buyer.deals || 0} əqd</span>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          buyer.deals > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {buyer.deals > 10 ? 'Etibarlı' : 'Yeni alıcı'}
        </span>
      </div>
    </div>
  );
}
