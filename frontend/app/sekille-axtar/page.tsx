import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import ImageSearchClient from './ImageSearchClient';

export const metadata: Metadata = buildMetadata({
  title: 'Şəkil ilə axtarış — AI ilə oxşar elan tap',
  description: 'Şəkil yükləyin və ya çəkin — AI uyğun elanları tapır. AliExpress / Alibaba stil.',
  path: '/sekille-axtar',
});

export default function Page() {
  return <ImageSearchClient />;
}
