import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '360tap.az — Universal elanlar marketplace',
    short_name: '360tap.az',
    description: 'Azərbaycanda alqı-satqı, daşınmaz əmlak, avtomobil, iş və xidmətlər.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#E02B31',
    orientation: 'portrait',
    lang: 'az',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    shortcuts: [
      { name: 'Yeni elan', short_name: 'Elan', url: '/elan-yerlesdir' },
      { name: 'Mənim elanlarım', short_name: 'Elanlar', url: '/profil/elanlarim' },
      { name: 'Sevimlilər', short_name: 'Sevimli', url: '/profil/sevimliler' },
      { name: 'Mesajlar', short_name: 'Chat', url: '/profil/mesajlar' },
    ],
    categories: ['shopping', 'business', 'lifestyle'],
  };
}
