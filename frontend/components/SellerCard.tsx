'use client';
import Link from 'next/link';
import { Star, Shield, MapPin, MessageCircle, Phone, Calendar, Award } from 'lucide-react';

export default function SellerCard({ seller }: { seller: any }) {
  if (!seller) return null;
  const memberYear = seller.created_at ? new Date(seller.created_at).getFullYear() : null;
  const initials = (seller.full_name || seller.name || 'U').split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {seller.avatar_url ? (
            <img src={seller.avatar_url} className="w-14 h-14 rounded-full object-cover" alt={seller.full_name} />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-tap to-violet-500 text-white flex items-center justify-center font-bold text-lg">{initials}</div>
          )}
          {seller.is_verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center ring-2 ring-white">
              <Shield className="w-3 h-3" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/profil/${seller.id}`} className="font-bold text-base hover:text-tap line-clamp-1">
            {seller.full_name || seller.name || 'Anonim'}
          </Link>
          <div className="flex items-center gap-3 text-xs text-ink-500 mt-1">
            {seller.rating > 0 && (
              <span className="flex items-center gap-1 text-amber-500"><Star className="w-3 h-3 fill-current" />{seller.rating.toFixed(1)}</span>
            )}
            {seller.listings_count > 0 && <span>{seller.listings_count} elan</span>}
            {memberYear && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{memberYear}-dən</span>}
          </div>
          {seller.is_business && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-full">
              <Award className="w-3 h-3" /> Biznes
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button className="btn-secondary text-xs"><Phone className="w-3.5 h-3.5" /> Zəng</button>
        <button className="btn-secondary text-xs"><MessageCircle className="w-3.5 h-3.5" /> Mesaj</button>
      </div>
    </div>
  );
}
