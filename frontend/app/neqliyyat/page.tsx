import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import TransportClient from './TransportClient';

const API = 'http://localhost:5400';

export const metadata: Metadata = buildMetadata({
  title: 'Nəqliyyat — Avtomobil alqı-satqı, kredit, barter',
  description: 'Bakı və Azərbaycanda avtomobil elanları. 60+ marka, model üzrə axtarış, kredit, barter, AI smart filter. 360tap.az',
  path: '/neqliyyat',
  keywords: ['avtomobil', 'maşın', 'nəqliyyat', 'bmw', 'mercedes', 'toyota', 'lada', 'kredit', 'barter', 'işlənmiş', 'yeni'],
});

export default async function Page({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;

  // Server-side initial data
  let initialItems: any[] = [];
  let initialTotal = 0;
  try {
    const params = new URLSearchParams();
    params.set('category', 'avtomobil');
    Object.entries(sp).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    params.set('limit', '24');
    const r = await fetch(`${API}/api/listings?${params}`, { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      initialItems = d.items || [];
      initialTotal = d.total ?? initialItems.length;
    }
  } catch {}

  return <TransportClient initialItems={initialItems} initialTotal={initialTotal} />;
}
