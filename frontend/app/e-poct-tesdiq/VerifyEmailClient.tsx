'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { api, getToken } from '@/lib/api';
import Logo from '@/components/Logo';

// UX-SPEC §9 — /login ilə eyni vizual dil (bax: app/login/page.tsx).
const PRIMARY =
  'h-12 min-w-[110px] px-6 rounded-lg bg-tap text-white text-[15px] font-bold ' +
  'hover:bg-tap-600 active:bg-tap-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const SECONDARY =
  'h-11 px-5 rounded-lg bg-white border border-ink-200 text-sm font-semibold text-ink-900 ' +
  'hover:bg-ink-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

type Phase = 'no-token' | 'verifying' | 'ok' | 'failed';

function readableError(err: unknown): string {
  const msg = err instanceof Error ? err.message.trim() : '';
  // Backend hazır olmayanda NestJS «Cannot POST /api/v1/...» qaytarır — bu texniki
  // mətn ekrana çıxmamalıdır, amma ağ ekran da qalmamalıdır.
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

export default function VerifyEmailClient() {
  const token = useSearchParams().get('token') ?? '';
  const [phase, setPhase] = useState<Phase>(token ? 'verifying' : 'no-token');
  const [error, setError] = useState('');
  const [resend, setResend] = useState<{ state: 'idle' | 'sending' | 'sent'; note: string }>({
    state: 'idle',
    note: '',
  });

  // Token BİRDƏFƏLİKDİR: React StrictMode dev-də effekti iki dəfə işlədir və ikinci
  // sorğu artıq istifadə olunmuş tokeni göndərib «etibarsız link» xətası göstərərdi.
  // Ref ilə qorunma effektin yalnız bir dəfə şəbəkəyə çıxmasını təmin edir.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    api<{ data?: { verified: boolean } }>('/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(() => setPhase('ok'))
      .catch((err: unknown) => { setError(readableError(err)); setPhase('failed'); });
  }, [token]);

  // Təkrar göndərmə AUTH tələb edir (POST /auth/email/send) — tokensiz istifadəçiyə
  // düymə göstərmək ölü düymə olardı, ona görə əvəzinə giriş linki verilir.
  const resendMail = async () => {
    setResend({ state: 'sending', note: '' });
    try {
      // Boş `{}` gövdəsi qəsdəndir: `api()` `Content-Type: application/json` qoyur,
      // gövdəsiz POST-da isə Nest-in body parser-i validasiyada boşluqdan şikayət edir.
      await api<{ data?: { sent: boolean } }>('/auth/email/send', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setResend({ state: 'sent', note: 'Yeni təsdiq məktubu göndərildi — poçt qutunuzu yoxlayın.' });
    } catch (err: unknown) {
      setResend({ state: 'idle', note: readableError(err) });
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px] rounded-2xl border border-ink-200 bg-white overflow-hidden">
        <div className="px-6 pt-6 pb-7 sm:px-8 sm:pt-8">
          <Logo />

          {phase === 'verifying' && (
            <div className="mt-5">
              <div className="w-14 h-14 rounded-full bg-tap-50 text-tap flex items-center justify-center mb-4">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-ink-900">Yoxlanılır…</h1>
              <p className="mt-3 text-[15px] text-ink-600">E-poçt ünvanınızı təsdiqləyirik.</p>
            </div>
          )}

          {phase === 'ok' && (
            <div className="mt-5">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-ink-900">E-poçt təsdiqləndi</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                Təşəkkürlər. Hesabınızın e-poçt ünvanı artıq təsdiqlidir.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/profil" className={`${PRIMARY} inline-flex items-center`}>
                  Profilə keç
                </Link>
                <Link href="/" className={`${SECONDARY} inline-flex items-center`}>
                  Ana səhifə
                </Link>
              </div>
            </div>
          )}

          {(phase === 'failed' || phase === 'no-token') && (
            <div className="mt-5">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-ink-900">
                {phase === 'no-token' ? 'Link natamamdır' : 'Təsdiq alınmadı'}
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                {phase === 'no-token'
                  ? 'Bu səhifə e-poçtunuza gələn link ilə açılmalıdır. Linki tam kopyaladığınızdan əmin olun.'
                  : error}
              </p>
              <p className="mt-3 text-sm text-ink-500">
                Təsdiq linkinin ömrü qısadır. Vaxtı keçibsə, hesabınıza daxil olub yeni link istəyin.
              </p>

              {resend.note && (
                <div
                  className={`mt-4 p-3 rounded-lg text-sm border ${
                    resend.state === 'sent'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {resend.note}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {getToken() ? (
                  <button
                    type="button"
                    onClick={resendMail}
                    disabled={resend.state !== 'idle'}
                    className={`${PRIMARY} inline-flex items-center`}
                  >
                    {resend.state === 'sending' ? 'Göndərilir...' : 'Yeni link göndər'}
                  </button>
                ) : (
                  <Link href="/login" className={`${PRIMARY} inline-flex items-center`}>
                    Daxil ol
                  </Link>
                )}
                <Link href="/" className={`${SECONDARY} inline-flex items-center`}>
                  Ana səhifə
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ——— §9 alt zolağı ——— */}
        <div className="bg-ink-100 border-t border-ink-200 px-6 py-6 sm:px-8">
          <p className="text-[12px] leading-relaxed text-ink-500 text-center">
            Problem davam edirsə{' '}
            <Link href="/komek" className="underline hover:text-tap">Kömək mərkəzinə</Link> yazın.
          </p>
        </div>
      </div>
    </div>
  );
}
