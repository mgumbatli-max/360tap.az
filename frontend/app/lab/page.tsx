import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import LabClient from './LabClient';

export const metadata: Metadata = buildMetadata({
  title: '360 Lab — Eksperimental funksiyalar',
  description: 'Claude AI tərəfindən təklif edilən 200+ unikal funksiya. Toggle ilə aktivləşdirin, sınayın, geri qaytarın.',
  path: '/lab',
  keywords: ['lab', 'eksperimental', 'AI', 'beta', 'funksiyalar', 'innovasiya'],
});

export default function Page() {
  return <LabClient />;
}
