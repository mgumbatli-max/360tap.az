'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';
import {
  PASSWORD_HINT,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_PLACEHOLDER,
  validatePassword,
} from '@/lib/validation';

// UX-SPEC §9 — /login ilə eyni vizual dil: boz fonlu/sərhədsiz sahələr,
// yığcam CTA, fərqli fonlu alt zolaq. Rənglər `ink`/`tap` tokenləri ilə verilir ki,
// globals.css-in `.dark .bg-ink-*` override-ları qaranlıq rejimi tutsun (§12).
const FIELD =
  'w-full h-12 rounded-lg border-0 bg-ink-100 px-4 text-[15px] text-ink-900 placeholder:text-ink-500';

const PRIMARY =
  'h-12 min-w-[110px] px-6 rounded-lg bg-tap text-white text-[15px] font-bold ' +
  'hover:bg-tap-600 active:bg-tap-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

// Qaranlıq rejimdə `bg-white` kart fonuna bərabərləşir — düyməni sərhəd ayırd edir.
const SECONDARY =
  'h-11 px-5 rounded-lg bg-white border border-ink-200 text-sm font-semibold text-ink-900 ' +
  'hover:bg-ink-50 transition-colors';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Backend parol qaydasını göndərməmişdən əvvəl yoxla — əks halda istifadəçi
    // formanı doldurub 422 alırdı (bax: lib/validation.ts).
    const pwErr = validatePassword(form.password);
    if (pwErr) { setError(pwErr); return; }
    setLoading(true);
    try {
      const data: any = { full_name: form.full_name, password: form.password };
      if (form.email) data.email = form.email;
      if (form.phone) data.phone = form.phone;
      if (form.city)  data.city  = form.city;
      await register(data);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px] rounded-2xl border border-ink-200 bg-white overflow-hidden">
        <div className="px-6 pt-6 pb-7 sm:px-8 sm:pt-8">
          <Logo />
          <h1 className="mt-5 text-2xl font-bold text-ink-900">Qeydiyyat</h1>
          <p className="mt-1 text-sm text-ink-500">Pulsuzdur — bir dəqiqəlikdir</p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <input className={FIELD} placeholder="Ad Soyad *" required
                   value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input className={FIELD} type="email" placeholder="Email"
                   value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={FIELD} placeholder="Telefon (+994...)"
                   value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className={FIELD} placeholder="Şəhər"
                   value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className={FIELD} type="password" placeholder={PASSWORD_PLACEHOLDER} required
                   minLength={PASSWORD_MIN_LENGTH} pattern={PASSWORD_PATTERN} title={PASSWORD_HINT}
                   value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

            {/* Backend validasiyası email VƏ YA telefondan birini tələb edir — bu qeyd
                istifadəçini formanı göndərməmişdən qabaq xəbərdar edir. */}
            <p className="text-[13px] text-ink-500">Email və ya telefondan ən azı biri tələb olunur.</p>

            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

            <div className="pt-1">
              <button type="submit" disabled={loading} className={PRIMARY}>
                {loading ? 'Gözlə...' : 'Hesab yarat'}
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
            <span className="text-sm text-ink-600">Artıq hesabınız var?</span>
            <Link href="/login" className={`${SECONDARY} inline-flex items-center`}>
              Daxil ol
            </Link>
          </div>

          <p className="mt-4 text-[12px] leading-relaxed text-ink-500 text-center">
            Qeydiyyatdan keçməklə{' '}
            <Link href="/qaydalar" className="underline hover:text-tap">İstifadə qaydaları</Link>{' '}və{' '}
            <Link href="/mexfilik" className="underline hover:text-tap">Məxfilik siyasəti</Link>ni qəbul edirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
