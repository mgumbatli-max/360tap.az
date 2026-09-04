'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';

// UX-SPEC §9 — səhifə variantı modalla EYNİ vizual dili işlədir:
// boz fonlu/sərhədsiz sahələr, yığcam CTA, fərqli fonlu alt zolaq.
// Rənglər `ink`/`tap` tokenləridir ki, globals.css-in `.dark .bg-ink-*` override-ları
// qaranlıq rejimi öz-özünə tutsun (§12) — sabit hex yazılmır.
const FIELD =
  'w-full h-12 rounded-lg border-0 bg-ink-100 px-4 text-[15px] text-ink-900 placeholder:text-ink-500';

const PRIMARY =
  'h-12 min-w-[110px] px-6 rounded-lg bg-tap text-white text-[15px] font-bold ' +
  'hover:bg-tap-600 active:bg-tap-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

// Alt zolağın AĞ düyməsi: qaranlıq rejimdə `bg-white` kart fonuna bərabərləşdiyi üçün
// düyməni yalnız sərhəd ayırd edir — ona görə sərhəd məcburidir.
const SECONDARY =
  'h-11 px-5 rounded-lg bg-white border border-ink-200 text-sm font-semibold text-ink-900 ' +
  'hover:bg-ink-50 transition-colors';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(identifier, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-10">
      {/* 520px + 16px radius — modalla eyni ölçü qrafiki (§9). `overflow-hidden`
          alt zolağın künclərini karta oturdur. */}
      <div className="w-full max-w-[520px] rounded-2xl border border-ink-200 bg-white overflow-hidden">
        <div className="px-6 pt-6 pb-7 sm:px-8 sm:pt-8">
          <Logo />
          <h1 className="mt-5 text-2xl font-bold text-ink-900">Giriş</h1>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <input
              type="text"
              placeholder="Telefon və ya e-poçt"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={FIELD}
              required
              autoFocus
            />
            <input
              type="password"
              placeholder="Parol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FIELD}
              required
            />

            {/* §9: solda «yadda saxla», sağda mavi «unutdunuz?» — bir sətirdə */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer select-none">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-tap" />
                Parolu yadda saxla
              </label>
              {/* Parol bərpası endpoint-i hələ yoxdur — ölü düymə qoymamaq üçün
                  link mövcud «Kömək» səhifəsinə yönəlir. */}
              <Link href="/komek" className="text-sm text-tap hover:underline">
                Parolu unutdunuz?
              </Link>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
            )}

            <div className="pt-1">
              <button type="submit" disabled={loading} className={PRIMARY}>
                {loading ? 'Yoxlanılır...' : 'Daxil ol'}
              </button>
            </div>
          </form>
        </div>

        {/* ——— §9 alt zolağı ——— */}
        <div className="bg-ink-100 border-t border-ink-200 px-6 py-6 sm:px-8">
          <p className="text-[13px] text-ink-500 text-center">Və ya davam et</p>

          {/* Sosial provayderlər backend-də YOXDUR (Faza 5) — ölü düymə qoymamaq üçün
              sönülü göstərilir; ekran oxuyucuya «tezliklə» deyilir. */}
          <div className="mt-3 flex justify-center gap-3">
            <button
              type="button"
              disabled
              aria-label="Google ilə davam et — tezliklə"
              className="social-btn social-google opacity-50 cursor-not-allowed disabled:hover:scale-100"
            >
              G
            </button>
            <button
              type="button"
              disabled
              aria-label="Apple ilə davam et — tezliklə"
              className="social-btn social-apple opacity-50 cursor-not-allowed disabled:hover:scale-100"
            >
              
            </button>
            <button
              type="button"
              disabled
              aria-label="E-poçt provayderi ilə davam et — tezliklə"
              className="social-btn social-mail opacity-50 cursor-not-allowed disabled:hover:scale-100"
            >
              M
            </button>
          </div>
          <p className="mt-2 text-[11px] text-ink-400 text-center">Sosial giriş tezliklə əlçatan olacaq</p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span className="text-sm text-ink-600">Hesabınız yoxdur?</span>
            <Link href="/qeydiyyat" className={`${SECONDARY} inline-flex items-center`}>
              Qeydiyyatdan keç
            </Link>
          </div>

          <p className="mt-4 text-[12px] leading-relaxed text-ink-500 text-center">
            Davam etməklə{' '}
            <Link href="/qaydalar" className="underline hover:text-tap">İstifadə qaydaları</Link>{' '}və{' '}
            <Link href="/mexfilik" className="underline hover:text-tap">Məxfilik siyasəti</Link>ni qəbul edirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
