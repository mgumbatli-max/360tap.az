'use client';
import { Scale } from 'lucide-react';
import Link from 'next/link';

export default function CompareWithSimilar({ listingId }: { listingId: string }) {
  return (
    <Link href={`/muqayise?id=${listingId}`}
      className="card p-3 flex items-center gap-3 hover:border-violet-300 bg-gradient-to-r from-violet-50 to-pink-50">
      <div className="w-9 h-9 rounded-xl bg-violet-500 text-white flex items-center justify-center">
        <Scale className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm">Bənzər elanla müqayisə et</div>
        <div className="text-xs text-ink-500">Eyni kateqoriyada 3 oxşar elanla yan-yana</div>
      </div>
      <span className="text-violet-600 font-bold">→</span>
    </Link>
  );
}
