'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

// UX-SPEC §9 — /login ilə eyni vizual dil: boz fonlu/sərhədsiz sahələr,
// yığcam CTA, 520px kart. Rənglər `ink`/`tap` tokenləridir ki, globals.css-in
// `.dark .bg-ink-*` override-ları qaranlıq rejimi öz-özünə tutsun (§12).
const FIELD =
  'w-full h-12 rounded-lg border-0 bg-ink-100 px-4 text-[15px] text-ink-900 placeholder:text-ink-500';

const PRIMARY =
  'h-12 min-w-[110px] px-6 rounded-lg bg-tap text-white text-[15px] font-bold ' +
  'hover:bg-tap-600 active:bg-tap-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * HESAB SAYIMINA (enumeration) QARŞI: bu mətn HƏM mövcud, HƏM mövcud olmayan
 * e-poçt üçün eynidir. Backend də qəsdən həmişə `{ sent:true }` qaytarır — UI
 * fərqli cavab göstərsəydi, serverin bu müdafiəsi mənasız olardı, çünki hücumçu
 * ekrandakı mətnə baxaraq hansı ünvanların qeydiyyatda olduğunu siyahılaya bilərdi.
 */
const ALWAYS_SAME_MESSAGE =
  'Əgər bu e-poçt qeydiyyatdadırsa, parolu yeniləmə linki göndərildi. ' +
  'Poçt qutunuzu (və «Spam» qovluğunu) yoxlayın.';

function readableError(err: unknown): string {
  const msg = err instanceof Error ? err.message.trim() : '';
  // Backend hələ qoşulmayıbsa NestJS 404 gövdəsi «Cannot POST /api/v1/...» qaytarır —
  // bu texniki mətn istifadəçiyə göstərilməməlidir, amma ağ ekran da qalmamalıdır.
  if (
    !msg ||
    msg === 'Server xətası' ||
    /Cannot (POST|GET)/i.test(msg) ||
    /failed to fetch|networkerror|load failed/i.test(msg)
  ) {
    return 'Xidmət hazırda əlçatan deyil. Bir azdan yenidən cəhd edin.';
  }
  return msg;
}

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api<{ data?: { sent: boolean } }>('/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err: unknown) {
      // Buradakı xəta hesabın MÖVCUDLUĞU haqqında heç nə demir — server o halda da
      // 200 qaytarır. Bura yalnız infrastruktur nasazlığında (404/500/şəbəkə) düşülür.
      setError(readableError(err));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px] rounded-2xl border border-ink-200 bg-white overflow-hidden">
        <div className="px-6 pt-6 pb-7 sm:px-8 sm:pt-8">
          <Logo />

          {sent ? (
            <div className="mt-5">
              <div className="w-14 h-14 rounded-full bg-tap-50 text-tap flex items-center justify-center mb-4">
                <MailCheck className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-ink-900">Linki göndərdik</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{ALWAYS_SAME_MESSAGE}</p>
              <p className="mt-3 text-sm text-ink-500">
                Link qısa müddət etibarlıdır. Gəlmədisə, bir neçə dəqiqə sonra yenidən cəhd edin.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/login" className={`${PRIMARY} inline-flex items-center`}>
                  Girişə qayıt
                </Link>
                <button
                  type="button"
                  onClick={() => { setSent(false); setError(''); }}
                  className="h-12 px-5 rounded-lg text-sm font-semibold text-ink-700 hover:bg-ink-100 transition-colors"
                >
                  Başqa e-poçt yaz
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="mt-5 text-2xl font-bold text-ink-900">Parolu unutmusunuz?</h1>
              <p className="mt-2 text-[15px] text-ink-600">
                Hesabınızın e-poçt ünvanını yazın — parolu yeniləmək üçün link göndərəcəyik.
              </p>

              <form onSubmit={onSubmit} className="mt-5 space-y-3">
                <input
                  type="email"
                  placeholder="E-poçt ünvanı"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={FIELD}
                  required
                  autoFocus
                  autoComplete="email"
                />

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
                )}

                <div className="pt-1">
                  <button type="submit" disabled={loading || !email} className={PRIMARY}>
                    {loading ? 'Göndərilir...' : 'Link göndər'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* ——— §9 alt zolağı ——— */}
        <div className="bg-ink-100 border-t border-ink-200 px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span className="text-sm text-ink-600">Parolunuz yadınıza düşdü?</span>
            <Link href="/login" className="text-sm font-semibold text-tap hover:underline">
              Daxil ol
            </Link>
          </div>
          <p className="mt-3 text-[12px] text-ink-500 text-center">
            Hesabınız yoxdur?{' '}
            <Link href="/qeydiyyat" className="underline hover:text-tap">Qeydiyyatdan keçin</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
