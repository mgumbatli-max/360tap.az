'use client';
import { Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast';

export default function DuplicateListingButton({ listing }: { listing: any }) {
  const router = useRouter();
  const toast = useToast();
  const duplicate = () => {
    const { id, created_at, updated_at, views, favorites_count, ...rest } = listing;
    localStorage.setItem('tap_listing_draft', JSON.stringify({ form: rest, savedAt: Date.now() }));
    toast.success('Elan kopyalandı, yeni elan formada açılır');
    router.push('/elan-yerlesdir');
  };
  return (
    <button onClick={duplicate} className="btn-secondary text-sm">
      <Copy className="w-4 h-4" /> Kopyala
    </button>
  );
}
