import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Elan — 360tap.az';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = { params: Promise<{ id: string }> };

/**
 * TƏHLÜKƏSİZLİK — SSRF MÜDAFİƏSİ.
 *
 * PROBLEM: OG şəklini SERVER render edir, yəni `<img src={cover}>`-dəki ünvanı da server
 * yükləyir. `cover` isə elan sahibinin verdiyi ixtiyari mətndir. Süzgəcsiz halda hər kəs
 * `/elanlar/<id>/opengraph-image` çağıraraq serveri istədiyi ünvana GET atmağa məcbur edə
 * bilirdi — o cümlədən daxili şəbəkəyə (`http://169.254.169.254/...` cloud metadata,
 * `http://localhost:5500/...` admin endpoint-ləri). Sübut: yad bir saytın sayğacı artırdı.
 *
 * HƏLL: host allowlist. Siyahı `next.config.ts` → `images.remotePatterns` ilə EYNİDİR —
 * yəni Next/Image-in onsuz da icazə verdiyi mənbələr. Yeni şəkil mənbəyi əlavə olunanda
 * HƏR İKİ yer birlikdə yenilənməlidir (paylaşılan modul yaradılmadı, çünki `next.config.ts`
 * edge runtime bundle-ına daxil edilə bilməz).
 *
 * `hostname`-dəki `*.` prefiksi Next-in semantikasını təkrarlayır: TƏK səviyyəli alt-domen.
 */
type ImageSource = {
  protocol: 'http:' | 'https:';
  hostname: string;
  port?: string;
  pathPrefix?: string;
};

const ALLOWED_IMAGE_SOURCES: ImageSource[] = [
  { protocol: 'http:', hostname: 'localhost', port: '5400', pathPrefix: '/uploads/' },
  { protocol: 'http:', hostname: 'localhost', port: '5500', pathPrefix: '/uploads/' },
  { protocol: 'https:', hostname: 'images.unsplash.com' },
  { protocol: 'https:', hostname: 'picsum.photos' },
  { protocol: 'https:', hostname: 'tap360-api.onrender.com' },
  { protocol: 'https:', hostname: '*.onrender.com' },
];

function matchesHostname(actual: string, pattern: string): boolean {
  if (!pattern.startsWith('*.')) return actual === pattern;
  // Nöqtə ilə birlikdə yoxlanılır ki, `evil-onrender.com` uyğun gəlməsin; seqment sayı
  // bərabər olmalıdır ki, `a.b.onrender.com` (çox səviyyəli) keçməsin.
  const suffix = pattern.slice(1);
  return actual.endsWith(suffix) && actual.split('.').length === pattern.split('.').length;
}

/** Allowlist-dən kənar, sınıq və ya nisbi URL üçün `undefined` → OG şəkli mətnlə render olunur. */
function safeCoverUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw === '') return undefined;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined; // nisbi/sınıq ünvan — server ondan heç nə yükləməməlidir
  }
  const allowed = ALLOWED_IMAGE_SOURCES.some((src) => {
    if (url.protocol !== src.protocol) return false;
    if (url.port !== (src.port ?? '')) return false; // standart port = boş sətir
    if (!matchesHostname(url.hostname, src.hostname)) return false;
    return src.pathPrefix ? url.pathname.startsWith(src.pathPrefix) : true;
  });
  return allowed ? url.toString() : undefined;
}

export default async function OG({ params }: Props) {
  const { id } = await params;
  // Faza 0 düzəlişi:
  //  · köhnə default `localhost:5400` (silinmiş Express) → API_ORIGIN/NestJS
  //  · köhnə zərf `.listing` → NestJS `{ ok, data }`
  //  · köhnə sahələr `city_name`/`media` → `regionName`/`images`
  //  · timeout əlavə olundu (OG generasiyası asılı qalmasın)
  const apiUrl = process.env.API_ORIGIN
    ? `${process.env.API_ORIGIN}/api/v1`
    : 'http://localhost:5500/api/v1';
  let listing: any = null;
  try {
    const r = await fetch(`${apiUrl}/listings/${id}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok) listing = (await r.json()).data;
  } catch {
    /* OG şəkli fallback mətnlə render olunur */
  }

  const title = listing?.title || '360tap.az elanı';
  const price = listing?.price
    ? `${Number(listing.price).toLocaleString('az-AZ')} ${listing.currency || 'AZN'}`
    : 'Razılaşma';
  const city = listing?.regionName || 'Azərbaycan';
  const cover = safeCoverUrl(listing?.images?.[0]?.url);

  return new ImageResponse(
    (
      <div style={{
        height: '100%', width: '100%', display: 'flex',
        background: '#0d1117', color: 'white', fontFamily: 'sans-serif',
      }}>
        {cover && (
          <div style={{ width: 600, height: 630, display: 'flex' }}>
            <img src={cover} width={600} height={630} style={{ objectFit: 'cover' }} alt="" />
          </div>
        )}
        <div style={{
          flex: 1, padding: 56, display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          background: cover ? '#0d1117' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 22,
            }}>360</div>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, opacity: 0.9 }}>360tap.az</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 56, fontWeight: 900, color: '#fbbf24', marginBottom: 12 }}>{price}</div>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, lineHeight: 1.15, marginBottom: 16 }}>
              {title.length > 90 ? title.slice(0, 87) + '...' : title}
            </div>
            <div style={{ display: 'flex', fontSize: 22, opacity: 0.7 }}>📍 {city}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
