import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Nəqliyyat — Avtomobil alqı-satqı, kredit, barter',
  description:
    'Bakı və Azərbaycanda avtomobil elanları. Marka, model üzrə axtarış, kredit, barter. 360tap.az',
  path: '/neqliyyat',
  keywords: ['avtomobil', 'maşın', 'nəqliyyat', 'bmw', 'mercedes', 'toyota', 'kredit', 'barter'],
});

// Vertical landing → işlək kateqoriya axtarışına yönləndir (dərin filter sonra)
export default function Page() {
  redirect('/elanlar?category=neqliyyat');
}
