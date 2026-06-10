import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/elanlar', '/k/', '/seher/', '/biznes', '/komek', '/blog'],
        disallow: [
          '/profil/', '/admin/', '/api/',
          '/elan-yerlesdir', '/login', '/qeydiyyat', '/register', '/sifre-unutdum',
          '/*?cursor=', '/*?utm_*', '/*?fbclid=',
        ],
      },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'CCBot',  disallow: '/' },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
