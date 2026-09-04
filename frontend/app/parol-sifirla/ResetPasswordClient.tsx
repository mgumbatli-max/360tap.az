'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

// UX-SPEC §9 — /login ilə eyni vizual dil (bax: app/login/page.tsx).
const FIELD =
  'w-full h-12 rounded-lg border-0 bg-ink-100 px-4 text-[15px] text-ink-900 placeholder:text-ink-500';

const PRIMARY =
  'h-12 min-w-[110px] px-6 rounded-lg bg-tap text-white text-[15px] font-bold ' +
  'hover:bg-tap-600 active:bg-tap-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

/** Backend `password.minLength` ilə uzlaşır (qeydiyyat forması da min 6 tələb edir). */
const MIN_PASSWORD = 6;

function readableError(err: unknown): string {
  const msg = err instanceof Error ? err.message.trim() : '';
  // Backend hazır olmayanda NestJS «Cannot POST /api/v1/...» qaytarır — istifadəçi
  // texniki mətn yox, nə edəcəyini bilən cümlə görməlidir.
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

export default function ResetPasswordClient() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const mismatch = repeat.length > 0 && password !== repeat;
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Uyğunluq yoxlaması SERVERƏ getmədən burada tutulur: eyni tokenlə səhvən
    // edilən cəhdlər serverin cəhd limitini boş yerə yandırmasın.
    if (password !== repeat) { setError('Parollar eyni deyil'); return; }
    setError(''); setLoading(true);
    try {
      await api<{ data?: { reset: boolean } }>('/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err: unknown) {
      setError(readableError(err));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px] rounded-2xl border border-ink-200 bg-white overflow-hidden">
        <div className="px-6 pt-6 pb-7 sm:px-8 sm:pt-8">
          <Logo />

          {/* Token ümumiyyətlə yoxdursa forma göstərmək mənasızdır — istifadəçi
              parol yazıb "etibarsız link" xətası almasın, dərhal düzgün yola yönəlsin. */}
          {!token ? (
            <div className="mt-5">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-ink-900">Link natamamdır</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                Bu səhifə e-poçtunuza gələn link ilə açılmalıdır. Linki tam kopyaladığınızdan
                əmin olun və ya yeni link istəyin.
              </p>
              <div className="mt-6">
                <Link href="/sifre-unutdum" className={`${PRIMARY} inline-flex items-center`}>
                  Yeni link istə
                </Link>
              </div>
            </div>
          ) : done ? (
            <div className="mt-5">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-ink-900">Parol yeniləndi</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                Artıq yeni parolunuzla daxil ola bilərsiniz.
              </p>
              <div className="mt-6">
                <Link href="/login" className={`${PRIMARY} inline-flex items-center`}>
                  Daxil ol
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="mt-5 text-2xl font-bold text-ink-900">Yeni parol təyin edin</h1>
              <p className="mt-2 text-[15px] text-ink-600">
                Parol ən azı {MIN_PASSWORD} simvol olmalıdır.
              </p>

              <form onSubmit={onSubmit} className="mt-5 space-y-3">
                <input
                  type="password"
                  placeholder="Yeni parol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={FIELD}
                  required
                  autoFocus
                  minLength={MIN_PASSWORD}
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  placeholder="Yeni parolu təkrarlayın"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  className={FIELD}
                  required
                  minLength={MIN_PASSWORD}
                  autoComplete="new-password"
                />

                {tooShort && (
                  <p className="text-sm text-ink-500">Parol ən azı {MIN_PASSWORD} simvol olmalıdır.</p>
                )}
                {mismatch && <p className="text-sm text-red-600">Parollar eyni deyil.</p>}

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading || mismatch || password.length < MIN_PASSWORD}
                    className={PRIMARY}
                  >
                    {loading ? 'Yenilənir...' : 'Parolu yenilə'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* ——— §9 alt zolağı ——— */}
        <div className="bg-ink-100 border-t border-ink-200 px-6 py-6 sm:px-8">
          <p className="text-[12px] leading-relaxed text-ink-500 text-center">
            Link işləmirsə və ya vaxtı keçibsə,{' '}
            <Link href="/sifre-unutdum" className="underline hover:text-tap">yeni link istəyin</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
