import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/elanlar', '/k/', '/seher/', '/biznes', '/komek', '/blog'],
        disallow: [
          // robots.txt-də dəyər PREFİKSDİR, tam yol deyil: `/admin/` məhz `/admin`
          // ünvanının özünü tutmurdu (o isə statik prerender olunub 200 qaytarır).
          // Sondakı «/» götürüldü ki, həm kök, həm alt yollar əhatə olunsun —
          // eyni faylda `/elan-yerlesdir` artıq bu formatdadır.
          '/profil', '/admin', '/api/',
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
