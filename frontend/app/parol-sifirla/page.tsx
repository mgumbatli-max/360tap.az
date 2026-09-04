import { Suspense } from 'react';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import ResetPasswordClient from './ResetPasswordClient';

// `noindex`: səhifə yalnız e-poçtdakı birdəfəlik `?token=` ilə mənalıdır.
// İndeksləşməsi tokenin axtarış motoru keşinə düşməsi riskini yaradır.
export const metadata: Metadata = buildMetadata({
  title: 'Yeni parol təyin edin — 360tap.az',
  description: 'E-poçtunuza gələn link ilə hesabınıza yeni parol təyin edin.',
  path: '/parol-sifirla',
  noindex: true,
});

export default function Page() {
  // `useSearchParams()` prerender zamanı Suspense sərhədi tələb edir — onsuz
  // bütün route CSR-ə düşür (build xəbərdarlığı) və qabıq belə server-render olunmur.
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-200px)]" />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
