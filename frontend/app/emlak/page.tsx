import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import RealEstateClient from './RealEstateClient';

export const metadata: Metadata = buildMetadata({
  title: 'Daşınmaz əmlak — Alqı, Kirayə, Yeni tikili',
  description: 'Bakı və regionlarda mənzil, həyət evi, ofis, qaraj, torpaq elanları. Çıxarış, ipoteka, AI smart axtarış. 360tap.az',
  path: '/emlak',
  keywords: ['daşınmaz əmlak', 'mənzil', 'kirayə', 'yeni tikili', 'həyət evi', 'ofis', 'qaraj', 'bakı', 'ipoteka', 'çıxarış'],
});

export default function Page() {
  return <RealEstateClient />;
}
