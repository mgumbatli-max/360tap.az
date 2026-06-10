import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Daşınmaz əmlak — Alqı, Kirayə, Yeni tikili',
  description:
    'Bakı və regionlarda mənzil, həyət evi, ofis, qaraj, torpaq elanları. 360tap.az',
  path: '/emlak',
  keywords: ['daşınmaz əmlak', 'mənzil', 'kirayə', 'yeni tikili', 'həyət evi', 'ofis', 'bakı'],
});

// Vertical landing → işlək kateqoriya axtarışına yönləndir (dərin filter sonra)
export default function Page() {
  redirect('/elanlar?category=dasinmaz-emlak');
}
