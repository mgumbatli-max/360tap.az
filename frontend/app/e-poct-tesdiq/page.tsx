import { Suspense } from 'react';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import VerifyEmailClient from './VerifyEmailClient';

// `noindex`: səhifə yalnız e-poçtdakı birdəfəlik `?token=` ilə mənalıdır —
// indekslənməsi tokenin axtarış motoru keşinə düşməsi riskini yaradır.
export const metadata: Metadata = buildMetadata({
  title: 'E-poçt təsdiqi — 360tap.az',
  description: 'E-poçt ünvanınızı təsdiqləyin.',
  path: '/e-poct-tesdiq',
  noindex: true,
});

export default function Page() {
  // `useSearchParams()` prerender zamanı Suspense sərhədi tələb edir (bax: /parol-sifirla).
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-200px)]" />}>
      <VerifyEmailClient />
    </Suspense>
  );
}
