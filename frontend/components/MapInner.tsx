'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { formatPrice2 } from '@/lib/currency';

// Leaflet default icon fix (Next.js-də)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BAKU = { lat: 40.4093, lng: 49.8671 };

// Şəhərlərin koordinatları (lat/lng yoxdur listing-də deyə)
const CITY_COORDS: Record<string, [number, number]> = {
  baki:       [40.4093, 49.8671],
  sumqayit:   [40.5897, 49.6686],
  ganca:      [40.6828, 46.3606],
  mingacevir: [40.7700, 47.0496],
  lenkeran:   [38.7536, 48.8475],
  seki:       [41.1979, 47.1717],
  quba:       [41.3617, 48.5128],
  xachmaz:    [41.4583, 48.8050],
  saatli:     [39.9098, 48.3593],
  shamakhi:   [40.6300, 48.6403],
  absheron:   [40.5283, 49.5639],
};

// Random offset ki, eyni şəhərdəki marker-lər üst-üstə düşməsin
const jitter = (n: number) => n + (Math.random() - 0.5) * 0.05;

export default function MapInner({ listings }: { listings: any[] }) {
  const points = listings
    .map((l) => {
      let coords: [number, number] | null = null;
      if (l.lat && l.lng) coords = [Number(l.lat), Number(l.lng)];
      else if (l.city_slug && CITY_COORDS[l.city_slug]) {
        const [lat, lng] = CITY_COORDS[l.city_slug];
        coords = [jitter(lat), jitter(lng)];
      } else if (l.city_name) {
        const slug = String(l.city_name).toLowerCase()
          .replace(/[əıöüğşç]/g, (c) => ({'ə':'e','ı':'i','ö':'o','ü':'u','ğ':'g','ş':'s','ç':'c'} as any)[c]);
        if (CITY_COORDS[slug]) {
          const [lat, lng] = CITY_COORDS[slug];
          coords = [jitter(lat), jitter(lng)];
        }
      }
      return coords ? { ...l, coords } : null;
    })
    .filter(Boolean) as Array<any>;

  return (
    <MapContainer
      center={[BAKU.lat, BAKU.lng]}
      zoom={9}
      className="h-[500px] w-full rounded-xl border border-ink-200 z-0"
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>'
      />
      {points.map((p) => (
        <Marker key={p.id} position={p.coords as [number, number]}>
          <Popup>
            <div className="space-y-1.5 min-w-[180px]">
              {p.media?.[0]?.url && (
                <img src={p.media[0].url} alt={p.title} className="w-full h-24 object-cover rounded" />
              )}
              <div className="font-bold text-sm">{formatPrice2(p.price, p.currency)}</div>
              <div className="text-xs">{p.title}</div>
              <div className="text-xs text-gray-500">{p.city_name ?? ''}</div>
              <Link href={`/elanlar/${p.id}`} className="block text-center text-xs text-blue-600 font-semibold mt-2">
                Aç →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
