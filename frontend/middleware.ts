import { NextResponse, type NextRequest } from 'next/server';

/**
 * REAL MÜŞTƏRİ IP-Sİ — İMZALANMIŞ ŞƏKİLDƏ BACKEND-Ə ÖTÜRÜLÜR.
 *
 * PROBLEM (canlıda ölçülüb): backend-in rate limit açarı bütün ziyarətçilər üçün
 * EYNİ idi. Ölçmə `GET /api/health/net` ilə:
 *   · 360tap.az üzərindən  → XFF zənciri 4 element, seçilən açar `605cb15cb0`
 *   · birbaşa Render-ə     → XFF zənciri 3 element, seçilən açar `605cb15cb0`
 * Yəni seçilən element Render-in daxili proxy-sidir və o, heç vaxt dəyişmir.
 * Nəticə: `POST /auth/login`-ə ardıcıl 14 sorğu bütün saytın girişini 60 saniyəlik
 * bağladı — bir nəfər hamını blokdan sala bilirdi.
 *
 * NİYƏ SADƏCƏ TRUST_PROXY HOP SAYINI DÜZƏLTMƏK KİFAYƏT ETMİR: zəncirin uzunluğu
 * YOLA GÖRƏ dəyişir (4 vs 3). Bir yol üçün düzgün hop digəri üçün yanlışdır.
 *
 * NİYƏ `cf-connecting-ip` TƏK BAŞINA KİFAYƏT ETMİR: Cloudflare Render-in qarşısındadır
 * və sayt üzərindən gələn sorğularda o, VERCEL-in çıxış IP-sini görür (ölçüldü:
 * birbaşa yolda `4bdf8b9e6b` = real IP, proxy yolunda `184fd4d256` = Vercel IP).
 * Yəni real istifadəçilər yenə də bir hovuzu paylaşardı.
 *
 * HƏLL: istifadəçinin IP-sini məhz BURADA — Vercel edge-də — oxuyuruq (burada o,
 * saxtalaşdırıla bilməz) və backend-ə imzalanmış şəkildə ötürürük. Backend imzanı
 * yoxlayır: imza düzgündürsə IP etibarlıdır, əks halda köhnə məntiqə qayıdır.
 *
 * NİYƏ İMZA (sadəcə `x-client-ip` başlığı yox): backend `*.onrender.com` ünvanında
 * ictimai əlçatandır. İmzasız başlıq olsaydı, istənilən kənar şəxs onu özü yazıb hər
 * sorğuda başqa IP göstərərək limiti tamamilə keçə bilərdi.
 *
 * NİYƏ TIMESTAMP: imza əbədi olmasın. Bir dəfə ələ keçən imza sonsuza qədər təkrar
 * istifadə edilə bilməsin deyə backend 5 dəqiqədən köhnə imzanı rədd edir.
 */

const SECRET = process.env.INTERNAL_IP_SECRET;

/** Web Crypto (Edge runtime-da `node:crypto` yoxdur) ilə HMAC-SHA256, hex. */
async function sign(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Vercel edge-də istifadəçinin IP-si.
 * `x-forwarded-for`-un BİRİNCİ elementi burada etibarlıdır: Vercel-in edge-i zənciri
 * özü qurur və müştərinin yazdığını əvəzləyir. (Backend-də eyni fərziyyə YANLIŞ olardı —
 * ora sorğu artıq bir neçə hop keçib gəlir, məhz buna görə imza lazımdır.)
 */
function clientIpFromEdge(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip');
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  // Sirr təyin olunmayıbsa heç nə etmirik: backend imzasız başlığı onsuz da rədd edir,
  // ona görə səssiz keçid davranışı dəyişdirmir (köhnə məntiq işləyir).
  if (!SECRET) return NextResponse.next();

  const ip = clientIpFromEdge(req);
  if (!ip) return NextResponse.next();

  const ts = String(Date.now());
  const signature = await sign(`${ip}.${ts}`, SECRET);

  const headers = new Headers(req.headers);
  headers.set('x-client-ip', ip);
  headers.set('x-client-ip-ts', ts);
  headers.set('x-client-ip-sig', signature);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Yalnız backend-ə gedən yol. Səhifə render-lərinə toxunmuruq — orada IP lazım deyil
  // və hər səhifə üçün HMAC hesablamaq mənasız yükdür.
  matcher: '/api/:path*',
};
