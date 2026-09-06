/**
 * ŞƏKİL MƏNBƏYİ ALLOWLIST-İ — TƏK MƏNBƏ.
 *
 * İKİ AYRI PROBLEMİ EYNİ SİYAHI HƏLL EDİR:
 *
 * 1) SSRF (server tərəf). OG şəklini server render edir, yəni elan sahibinin verdiyi
 *    ixtiyari `cover` ünvanına GET atır. Süzgəcsiz halda hər kəs serveri daxili şəbəkəyə
 *    yönəldə bilirdi (`http://169.254.169.254/…` cloud metadata, `localhost:5500/…`).
 *
 * 2) RENDER ÇÖKMƏSİ (klient tərəf). `next/image` `remotePatterns`-də olmayan host üçün
 *    dəyər qaytarmır — İSTİSNA ATIR. Yəni bircə pis şəkil URL-i olan elan bütün kart
 *    şəbəkəsini çökdürürdü (dev loqunda müşahidə olundu: «Invalid src prop … hostname
 *    "localhost" is not configured»). Kartlar bu süzgəcdən keçirilməlidir.
 *
 * Siyahı `next.config.ts` → `images.remotePatterns` ilə EYNİ olmalıdır. Yeni mənbə
 * əlavə olunanda HƏR İKİ yer yenilənir — `next.config.ts` buradan import EDƏ BİLMƏZ,
 * çünki konfiq faylı Next-in öz yükləyicisi ilə oxunur.
 */

type ImageSource = {
  protocol: 'http:' | 'https:';
  hostname: string;
  port?: string;
  pathPrefix?: string;
};

// QEYD: `*.onrender.com` jokeri və ölü `localhost:5400` qeydi çıxarıldı,
// `tap360-api.onrender.com`-a isə /uploads/ yol məhdudiyyəti əlavə olundu —
// səbəb `next.config.ts`-dəki `images` şərhində ətraflı yazılıb.
export const ALLOWED_IMAGE_SOURCES: ImageSource[] = [
  { protocol: 'http:', hostname: 'localhost', port: '5500', pathPrefix: '/uploads/' },
  { protocol: 'https:', hostname: 'images.unsplash.com' },
  { protocol: 'https:', hostname: 'picsum.photos' },
  { protocol: 'https:', hostname: 'tap360-api.onrender.com', pathPrefix: '/uploads/' },
  // magazam.az kataloqunun şəkilləri Cloudinary-dədir və yol həmişə
  // `/<cloud_name>/image/upload/...` formasındadır. Yol prefiksi hesabla
  // məhdudlaşdırılır ki, bu qeyd bütün Cloudinary üçün açıq proxy olmasın.
  { protocol: 'https:', hostname: 'res.cloudinary.com', pathPrefix: '/di8zz8sc1/' },
];

/**
 * `*.` prefiksi Next-in semantikasını təkrarlayır: TƏK səviyyəli alt-domen.
 * Nöqtə ilə birlikdə yoxlanılır ki, `evil-onrender.com` uyğun gəlməsin; seqment sayı
 * bərabər olmalıdır ki, `a.b.onrender.com` (çox səviyyəli) keçməsin.
 */
function matchesHostname(actual: string, pattern: string): boolean {
  if (!pattern.startsWith('*.')) return actual === pattern;
  const suffix = pattern.slice(1);
  return actual.endsWith(suffix) && actual.split('.').length === pattern.split('.').length;
}

/**
 * Allowlist-dən kənar, sınıq və ya nisbi URL üçün `undefined`.
 *
 * Çağıran tərəf `undefined` halında `next/image` RENDER ETMƏMƏLİDİR — placeholder
 * göstərməlidir. Belə olduqda pis data render-i çökdürmür, sadəcə şəkilsiz görünür.
 */
export function safeImageUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw === '') return undefined;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined; // nisbi/sınıq ünvan
  }
  const allowed = ALLOWED_IMAGE_SOURCES.some((src) => {
    if (url.protocol !== src.protocol) return false;
    if (url.port !== (src.port ?? '')) return false; // standart port = boş sətir
    if (!matchesHostname(url.hostname, src.hostname)) return false;
    return src.pathPrefix ? url.pathname.startsWith(src.pathPrefix) : true;
  });
  return allowed ? url.toString() : undefined;
}
