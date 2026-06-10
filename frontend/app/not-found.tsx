import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-10">
      <div className="text-center max-w-md">
        <div className="text-9xl font-extrabold mb-4 select-none">
          <span className="gradient-aurora-text">4</span>
          <span style={{ color: 'var(--tap)' }}>0</span>
          <span className="gradient-aurora-text">4</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 mb-3">
          Səhifə tapılmadı
        </h1>
        <p className="text-ink-600 mb-6">
          Axtardığınız səhifə silinmiş, yerini dəyişmiş və ya heç vaxt mövcud olmayıb.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/" className="btn-tap">
            <Home className="w-4 h-4" /> Ana səhifəyə qayıt
          </Link>
          <Link href="/elanlar" className="btn-secondary">
            <Search className="w-4 h-4" /> Elan axtar
          </Link>
        </div>
        <div className="mt-8 pt-6 border-t border-ink-200">
          <p className="text-sm text-ink-500 mb-3">Yaxud bu səhifələrdən birini sınayın:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/elanlar?category=telefon" className="text-sm text-tap hover:underline">Telefonlar</Link>
            <span className="text-ink-300">·</span>
            <Link href="/elanlar?category=avtomobil" className="text-sm text-tap hover:underline">Avtomobillər</Link>
            <span className="text-ink-300">·</span>
            <Link href="/emlak" className="text-sm text-tap hover:underline">Mənzillər</Link>
            <span className="text-ink-300">·</span>
            <Link href="/elanlar?category=is-elanlari" className="text-sm text-tap hover:underline">İş elanları</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
