'use client';
import { useState } from 'react';
import Link from 'next/link';
import { X, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import PhoneOtpForm from './PhoneOtpForm';
import {
  PASSWORD_HINT,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_PLACEHOLDER,
  validatePassword,
} from '@/lib/validation';

type Method = 'phone' | 'email';
type EmailMode = 'login' | 'register';

// UX-SPEC §9: sahələr BOZ FONLU və SƏRHƏDSİZDİR — ona görə qlobal `.input`
// (ağ fon + 1px sərhəd) burada işlədilmir. Rənglər sabit hex yox, `ink` tokenləri ilə
// verilir: globals.css-dəki `.dark .bg-ink-100` override-ı qaranlıq rejimi öz-özünə tutur (§12).
const FIELD =
  'w-full h-12 rounded-lg border-0 bg-ink-100 px-4 text-[15px] text-ink-900 placeholder:text-ink-500';

// §9: «Daxil ol» TAM EN DEYİL — yığcam (~110px). min-w mobil sətirdə də formanı saxlayır.
const PRIMARY =
  'h-12 min-w-[110px] px-6 rounded-lg bg-tap text-white text-[15px] font-bold ' +
  'hover:bg-tap-600 active:bg-tap-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

// Alt zolaqdakı AĞ fonlu ikinci dərəcəli düymə. Sərhəd qaranlıq rejim üçün vacibdir:
// orada `bg-white` kart fonuna bərabərləşir, düyməni yalnız sərhəd ayırd edir.
const SECONDARY =
  'h-11 px-5 rounded-lg bg-white border border-ink-200 text-sm font-semibold text-ink-900 ' +
  'hover:bg-ink-50 transition-colors';

export default function AuthModal({
  open,
  onClose,
  initialMode = 'login',
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: EmailMode;
}) {
  // Telefon-OTP backend-i (POST /auth/send-otp + /auth/verify-otp) artıq REALDIR —
  // «tezliklə» məhdudiyyəti qalxdı. Default metod yenə də 'email' saxlanılır: OTP
  // hər cəhddə SMS xərci yaradır, ona görə istifadəçi onu qəsdən seçməlidir,
  // modal açılan kimi avtomatik SMS axınına düşməməlidir.
  const [method, setMethod] = useState<Method>('email');
  const [emailMode, setEmailMode] = useState<EmailMode>(initialMode);
  const { login, register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email login
  const [identifier, setIdentifier] = useState('');
  const [pass, setPass] = useState('');

  // Email register
  const [regForm, setRegForm] = useState({ full_name: '', email: '', phone: '', password: '', city: '' });

  if (!open) return null;

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(identifier, pass); onClose(); }
    catch (err: any) { setError(err.message || 'Xəta'); }
    finally { setLoading(false); }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Parol qaydası backend DTO-su ilə eynidir (lib/validation.ts) — sorğu göndərilməmişdən
    // əvvəl yoxlanır. GİRİŞ formasına TOXUNULMUR: köhnə 6 simvollu parollar hələ də etibarlıdır.
    const pwErr = validatePassword(regForm.password);
    if (pwErr) { setError(pwErr); return; }
    setLoading(true);
    try {
      const data: any = { full_name: regForm.full_name, password: regForm.password };
      if (regForm.email) data.email = regForm.email;
      if (regForm.phone) data.phone = regForm.phone;
      if (regForm.city) data.city = regForm.city;
      await register(data);
      onClose();
    } catch (err: any) { setError(err.message || 'Xəta'); }
    finally { setLoading(false); }
  };

  // Alt zolaqdan metod dəyişəndə email tab-ına da keçirik: qeydiyyat/giriş formaları
  // yalnız email metodunda mövcuddur, OTP tab-ında istifadəçi boş ekran görərdi.
  const switchTo = (mode: EmailMode) => {
    setEmailMode(mode);
    setMethod('email');
    setError('');
  };

  const isLogin = emailMode === 'login';

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* §9: `×` modalın KƏNARINDA olmalıdır → o, kartın deyil, bu sarğının uşağıdır.
          `.modal-content` overflow-y:auto olduğu üçün kartın içindən çıxan element kəsilərdi. */}
      <div className="relative w-full max-w-[520px]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Bağla"
          className="absolute right-3 top-3 z-10 w-10 h-10 rounded-full flex items-center justify-center
                     text-ink-500 hover:bg-ink-100
                     md:-right-12 md:top-0 md:text-white md:hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </button>

        {/* `!max-w-none`: qlobal `.modal-content` 480px-ə bağlayır, §9 isə 520px tələb edir.
            En sarğıda idarə olunur, kart onu tam doldurur. */}
        <div
          className="modal-content !max-w-none w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          {/* ——— Yuxarı hissə: başlıq + metod tabları + forma ——— */}
          <div className="px-6 pt-6 pb-7 sm:px-8 sm:pt-8">
            <h2 id="auth-modal-title" className="text-2xl font-bold text-ink-900 pr-12 md:pr-0">
              {isLogin ? 'Giriş' : 'Qeydiyyat'}
            </h2>

            {/* Method tabs */}
            <div className="flex gap-1 mt-5 bg-ink-100 p-1 rounded-lg">
              <button
                onClick={() => { setMethod('phone'); setError(''); }}
                className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${
                  method === 'phone' ? 'bg-white text-tap shadow-sm' : 'text-ink-600'
                }`}
              >
                <Phone className="w-4 h-4" />
                Telefon ilə
                <span className="badge badge-active text-[9px]">Sürətli</span>
              </button>
              <button
                onClick={() => { setMethod('email'); setError(''); }}
                className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${
                  method === 'email' ? 'bg-white text-tap shadow-sm' : 'text-ink-600'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email ilə
              </button>
            </div>

            {/* PHONE OTP */}
            {method === 'phone' && (
              <div className="mt-5">
                <PhoneOtpForm
                  onSuccess={onClose}
                  onSwitchToEmail={() => setMethod('email')}
                />
              </div>
            )}

            {/* EMAIL — GİRİŞ */}
            {method === 'email' && isLogin && (
              <form onSubmit={onLogin} className="mt-5 space-y-3">
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
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className={FIELD}
                  required
                />

                {/* §9: solda «yadda saxla», sağda mavi «unutdunuz?» — bir sətirdə */}
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-tap" />
                    Parolu yadda saxla
                  </label>
                  {/* Parol bərpası axını qoşuldu: /sifre-unutdum → POST /auth/password/forgot.
                      Modal header layout-da yaşadığı üçün naviqasiya onu özü bağlamır →
                      `onClose` əl ilə çağırılır, əks halda modal yeni səhifənin üstündə qalardı. */}
                  <Link href="/sifre-unutdum" onClick={onClose} className="text-sm text-tap hover:underline">
                    Parolu unutdunuz?
                  </Link>
                </div>

                {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

                <div className="pt-1">
                  <button type="submit" disabled={loading} className={PRIMARY}>
                    {loading ? 'Yoxlanılır...' : 'Daxil ol'}
                  </button>
                </div>
              </form>
            )}

            {/* EMAIL — QEYDİYYAT */}
            {method === 'email' && !isLogin && (
              <form onSubmit={onRegister} className="mt-5 space-y-3">
                <input
                  type="text"
                  placeholder="Ad Soyad *"
                  value={regForm.full_name}
                  onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                  className={FIELD}
                  required
                  autoFocus
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className={FIELD}
                  required
                />
                <input
                  type="password"
                  placeholder={PASSWORD_PLACEHOLDER}
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className={FIELD}
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  pattern={PASSWORD_PATTERN}
                  title={PASSWORD_HINT}
                />
                <input
                  type="text"
                  placeholder="Şəhər"
                  value={regForm.city}
                  onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                  className={FIELD}
                />

                {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

                <div className="pt-1">
                  <button type="submit" disabled={loading} className={PRIMARY}>
                    {loading ? 'Gözlə...' : 'Hesab yarat'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ——— §9 alt zolağı: fərqli fon + sosial + qarşı-rejim düyməsi + hüquqi mətn ——— */}
          <div className="bg-ink-100 border-t border-ink-200 px-6 py-6 sm:px-8">
            <p className="text-[13px] text-ink-500 text-center">Və ya davam et</p>

            {/* Sosial provayderlər backend-də YOXDUR (Faza 5) — ölü düymə qoymamaq üçün
                sönülü göstərilir; klik heç nə etmir, ekran oxuyucuya «tezliklə» deyilir. */}
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
              <span className="text-sm text-ink-600">
                {isLogin ? 'Hesabınız yoxdur?' : 'Artıq hesabınız var?'}
              </span>
              <button type="button" onClick={() => switchTo(isLogin ? 'register' : 'login')} className={SECONDARY}>
                {isLogin ? 'Qeydiyyatdan keç' : 'Daxil ol'}
              </button>
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-ink-500 text-center">
              Davam etməklə{' '}
              <Link href="/qaydalar" onClick={onClose} className="underline hover:text-tap">İstifadə qaydaları</Link>{' '}və{' '}
              <Link href="/mexfilik" onClick={onClose} className="underline hover:text-tap">Məxfilik siyasəti</Link>ni qəbul edirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
