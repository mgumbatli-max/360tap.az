'use client';
import { useState, useRef, useEffect } from 'react';
import { Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { api, setTokens } from '@/lib/api';

type Step = 'phone' | 'code';

/**
 * Backend kontraktı (POST /api/v1/auth/send-otp):
 *   { ok:true, data:{ expiresInSec, resendAfterSec, devCode? } }
 * `devCode` YALNIZ NODE_ENV!==production-da gəlir — dev-də SMS provayderi olmadan
 * axını sınamaq üçün. Production cavabında bu sahə ümumiyyətlə mövcud olmur.
 */
type SendOtpData = {
  expiresInSec: number;
  resendAfterSec: number;
  devCode?: string;
};

/** POST /api/v1/auth/verify-otp — doğrulama uğurlu olduqda istifadəçi DƏRHAL daxil olur. */
type VerifyOtpData = {
  user: Record<string, unknown>;
  tokens: { accessToken: string; refreshToken?: string; accessExpiresIn?: number };
  isNew: boolean;
};

/**
 * Serverin mətnini olduğu kimi göstəririk — sürət limiti, yanlış kod, cəhd limiti
 * kimi hallar üçün ən dəqiq izah odur. Yalnız İSTİFADƏÇİYƏ HEÇ NƏ DEMƏYƏN texniki
 * mətnlər (NestJS 404 gövdəsi, `fetch` şəbəkə xətası) aydın cümləyə çevrilir ki,
 * backend hazır olmayanda ekranda «Cannot POST /api/v1/...» qalmasın.
 */
function readableError(err: unknown): string {
  const msg = err instanceof Error ? err.message.trim() : '';
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

/**
 * Server dəyəri gəlmədikdə istifadə olunan ehtiyat ömür (kontrakt: kod 5 dəqiqəlikdir).
 * `0`-a düşmək TƏHLÜKƏLİDİR: sayğac dərhal «vaxtı bitdi» deyib təsdiq düyməsini
 * bağlayardı və işlək kodla belə axın kilidlənərdi.
 */
const FALLBACK_EXPIRES_SEC = 300;

const mmss = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export default function PhoneOtpForm({ onSuccess, onSwitchToEmail }: {
  onSuccess: () => void;
  onSwitchToEmail?: () => void;
}) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('+994');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const [devCode, setDevCode] = useState('');
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Tək saniyəlik taymer HƏM təkrar-göndərmə, HƏM kodun ömrü sayğacını idarə edir —
  // iki ayrı interval qurmaq lazımsızdır və eyni tick-də sinxron qalırlar.
  useEffect(() => {
    if (step !== 'code') return;
    const t = setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
      setExpiresIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  // Telefon yarımauto-format
  const onPhoneChange = (v: string) => {
    let n = v.replace(/[^\d+]/g, '');
    if (!n.startsWith('+')) n = '+' + n;
    if (!n.startsWith('+994') && n.length > 1) {
      n = '+994' + n.slice(1).replace(/^994/, '');
    }
    setPhone(n.slice(0, 13));
  };

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(''); setLoading(true);
    try {
      // Kontrakt: send-otp gövdəsi YALNIZ `{ phone }` qəbul edir.
      // Ad-soyad doğrulama anında (verify-otp) göndərilir — yeni hesab orada yaranır.
      const res = await api<{ data?: SendOtpData }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      const data = (res.data ?? res) as unknown as SendOtpData;
      setStep('code');
      // Sayğac serverin dəyərindən qidalanır: sabit 60 saniyə serverin real
      // sürət limiti ilə uzlaşmaya bilər (limit dəyişəndə UI yalan danışardı).
      setResendIn(data.resendAfterSec ?? 60);
      setExpiresIn(data.expiresInSec ?? FALLBACK_EXPIRES_SEC);
      setDevCode(data.devCode ?? '');
      setCode(['', '', '', '', '', '']);
      // İlk inputa fokuslan
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(readableError(err));
    } finally { setLoading(false); }
  };

  const onCodeChange = (idx: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(0, 1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
    // Auto submit
    if (next.every((c) => c) && next.join('').length === 6) {
      verifyOtp(next.join(''));
    }
  };

  const onCodeKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const onCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setCode(pasted.split(''));
      verifyOtp(pasted);
    }
  };

  const verifyOtp = async (codeStr?: string) => {
    const c = codeStr ?? code.join('');
    if (c.length !== 6) return;
    setError(''); setLoading(true);
    try {
      const res = await api<{ data?: VerifyOtpData }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, code: c, fullName: fullName || undefined }),
      });
      const data = (res.data ?? res) as unknown as VerifyOtpData;
      // Tokenlər `setTokens()` ilə yazılır, xam localStorage ilə DEYİL: açar adları
      // və refresh rotasiyası tək yerdə (lib/api.ts) idarə olunur. refreshToken
      // atılsaydı sessiya access ömrü (15 dəq) bitəndə səssizcə ölərdi.
      setTokens(data.tokens);
      onSuccess();
      // AuthProvider (lib/auth.tsx) xaricdən istifadəçi yazmağa yol vermir —
      // yalnız `login`/`register` daxili olaraq setUser çağırır. Ona görə OTP axını
      // kontekst yeniləməsini reload ilə alır: yüklənmədə provider tokeni görüb
      // `/auth/me` sorğusu ilə istifadəçini bərpa edir. AuthContext `setUser`
      // ixrac edən kimi bu sətir silinməlidir (lib/auth.tsx bu tapşırığa daxil deyil).
      window.location.reload();
    } catch (err: unknown) {
      setError(readableError(err));
      setCode(['', '', '', '', '', '']);
      codeRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const expired = step === 'code' && expiresIn === 0;

  return (
    <div>
      {step === 'phone' && (
        <form onSubmit={sendOtp} className="space-y-3">
          <div className="text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-tap-50 text-tap flex items-center justify-center mx-auto mb-3">
              <Phone className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-ink-900">Telefon ilə daxil ol</h2>
            <p className="text-sm text-ink-500 mt-1">Sizə SMS ilə təsdiq kodu göndəriləcək</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-ink-700 mb-1.5 block">Ad Soyad <span className="text-ink-400 font-normal">(opsional)</span></label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Anar Əliyev"
              className="input"
              maxLength={120}
            />
            <p className="text-xs text-ink-500 mt-1">Hesabınız yoxdursa, bu adla yaradılacaq</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-ink-700 mb-1.5 block">Telefon nömrəsi</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+994 50 123 45 67"
              className="input text-lg font-mono"
              required
              autoFocus
              maxLength={13}
            />
            <p className="text-xs text-ink-500 mt-1">Numaranız avtomatik olaraq 360tap.az-a qoşulur</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || phone.length < 10}
            className="btn-tap w-full disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Kodu göndər
          </button>

          {onSwitchToEmail && (
            <button
              type="button"
              onClick={onSwitchToEmail}
              className="w-full text-sm text-tap hover:underline mt-2"
            >
              Email ilə daxil ol →
            </button>
          )}
        </form>
      )}

      {step === 'code' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => { setStep('phone'); setError(''); setCode(['','','','','','']); }}
            className="text-sm text-ink-500 hover:text-ink-900 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Geri
          </button>

          <div className="text-center">
            <h2 className="text-xl font-bold text-ink-900">Kodu daxil edin</h2>
            <p className="text-sm text-ink-500 mt-1">
              <span className="font-mono">{phone}</span> nömrəsinə SMS göndərildi
            </p>
            {devCode && (
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200">
                🛠 Dev: kod = <strong>{devCode}</strong>
              </p>
            )}
          </div>

          <div className="flex justify-center gap-2" onPaste={onCodePaste}>
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => { codeRefs.current[i] = el; }}
                value={d}
                onChange={(e) => onCodeChange(i, e.target.value)}
                onKeyDown={(e) => onCodeKey(i, e)}
                inputMode="numeric"
                maxLength={1}
                disabled={expired}
                className="w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 border-ink-200 focus:border-tap focus:outline-none focus:ring-2 focus:ring-tap-100 bg-white disabled:opacity-50"
              />
            ))}
          </div>

          {/* Kodun ömrü serverdən gəlir (5 dəq). Sayğac olmasa istifadəçi vaxtı keçmiş
              kodu təkrar-təkrar yazıb cəhd limitini yandırardı. */}
          {!expired && expiresIn > 0 && (
            <p className="text-center text-xs text-ink-500">
              Kod <span className="font-mono font-semibold">{mmss(expiresIn)}</span> ərzində etibarlıdır
            </p>
          )}
          {expired && (
            <p className="text-center text-xs text-amber-700">
              Kodun vaxtı bitdi — yeni kod istəyin
            </p>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200 text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={loading || expired || code.join('').length !== 6}
            onClick={() => verifyOtp()}
            className="btn-tap w-full disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Təsdiqlə
          </button>

          <div className="text-center">
            {resendIn > 0 ? (
              <p className="text-sm text-ink-500">
                Kod gəlmədi? <span className="font-semibold">{resendIn}s</span> sonra yenidən göndərə bilərsiniz
              </p>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => sendOtp()}
                className="text-sm text-tap hover:underline font-semibold disabled:opacity-50"
              >
                Kodu yenidən göndər
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
