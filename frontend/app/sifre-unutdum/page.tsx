import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import ForgotPasswordClient from './ForgotPasswordClient';

// `noindex`: parol bərpası tranzaksiya səhifəsidir — axtarış nəticəsində görünməsi
// nə istifadəçiyə fayda verir, nə də SEO-ya; əksinə, avtomatlaşdırılmış sui-istifadə
// üçün asan giriş nöqtəsi olur.
export const metadata: Metadata = buildMetadata({
  title: 'Parolu unutmusunuz? — 360tap.az',
  description: 'E-poçt ünvanınızı daxil edin — parolu yeniləmək üçün link göndərək.',
  path: '/sifre-unutdum',
  noindex: true,
});

export default function Page() {
  return <ForgotPasswordClient />;
}
