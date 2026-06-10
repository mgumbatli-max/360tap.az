import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '5400', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '5500', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  async rewrites() {
    // Mərhələli miqrasiya: yeni NestJS API (5500) ↔ köhnə Express (5400).
    // Endpoint NestJS-də tam işlədikcə müvafiq sətir buraya köçürülür.
    const NEST = 'http://localhost:5500';
    const EXPRESS = 'http://localhost:5400';
    return [
      { source: '/api/health', destination: `${NEST}/health` },
      { source: '/api/geo/:path*', destination: `${NEST}/api/v1/geo/:path*` },
      { source: '/api/media/:path*', destination: `${NEST}/api/v1/media/:path*` },
      // Fallback — qalan hər şey köhnə Express-ə
      { source: '/api/:path*', destination: `${EXPRESS}/api/:path*` },
    ];
  },
  async redirects() {
    const reCats = [
      'menzil-satilir', 'menzil-kiraye', 'menzil',
      'hayat-evi', 'ofis', 'qaraj', 'torpaq', 'obyekt',
      'dasinmaz-emlak',
    ];
    const transportCats = ['neqliyyat', 'avtomobil', 'masin'];
    return [
      ...reCats.map((slug) => ({
        source: '/elanlar',
        has: [{ type: 'query' as const, key: 'category', value: slug }],
        destination: `/emlak?category=${slug}`,
        permanent: false,
      })),
      ...transportCats.map((slug) => ({
        source: '/elanlar',
        has: [{ type: 'query' as const, key: 'category', value: slug }],
        destination: `/neqliyyat`,
        permanent: false,
      })),
    ];
  },
};

export default config;
