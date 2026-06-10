'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

// Leaflet SSR-də işləmir — dynamic import
const Map = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-ink-100 rounded-xl flex items-center justify-center text-ink-400">
      <div className="text-center">
        <MapPin className="w-10 h-10 mx-auto mb-2 animate-bounce" />
        Xəritə yüklənir...
      </div>
    </div>
  ),
});

export default function MapView({ listings }: { listings: any[] }) {
  return <Map listings={listings} />;
}
