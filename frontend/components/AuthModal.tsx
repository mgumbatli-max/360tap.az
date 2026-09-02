'use client';
import { useState } from 'react';
import { X, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import PhoneOtpForm from './PhoneOtpForm';

type Method = 'phone' | 'email';
type EmailMode = 'login' | 'register';

export default function AuthModal({
  open,
  onClose,
  initialMode = 'login',
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: EmailMode;
}) {
  // Faza 0: default metod 'phone' idi, lakin telefon-OTP backend-i (POST /auth/send-otp)
  // NestJS-də MÖVCUD DEYİL → istifadəçi modalı açan kimi işləməyən axına düşürdü.
  // İşlək metod (email) default edildi; OTP tab-ı qalır, amma aydın "tezliklə" mesajı verir.
  // Real OTP + SMS provayderi Faza 5-dədir.
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
    setError(''); setLoading(true);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-ink-100 flex items-center justify-center"
          aria-label="Bağla"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Method tabs */}
        <div className="flex gap-1 mb-5 bg-ink-100 p-1 rounded-xl">
          <button
            onClick={() => { setMethod('phone'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
              method === 'phone' ? 'bg-white text-tap shadow-sm' : 'text-ink-600'
            }`}
          >
            <Phone className="w-4 h-4" />
            Telefon ilə
            <span className="badge badge-active text-[9px]">Sürətli</span>
          </button>
          <button
            onClick={() => { setMethod('email'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
              method === 'email' ? 'bg-white text-tap shadow-sm' : 'text-ink-600'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email ilə
          </button>
        </div>

        {/* PHONE OTP */}
        {method === 'phone' && (
          <PhoneOtpForm
            onSuccess={onClose}
            onSwitchToEmail={() => setMethod('email')}
          />
        )}

        {/* EMAIL */}
        {method === 'email' && (
          <>
            <h2 className="text-xl font-bold text-ink-900 mb-1 text-center">
              {emailMode === 'login' ? 'Email ilə daxil ol' : 'Email ilə qeydiyyat'}
            </h2>
            <p className="text-sm text-ink-500 mb-5 text-center">
              {emailMode === 'login' ? 'Hesabınla davam et' : 'Pulsuz hesab yarat'}
            </p>

            {emailMode === 'login' ? (
              <form onSubmit={onLogin} className="space-y-3">
                <input
                  type="text"
                  placeholder="Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="input"
                  required
                  autoFocus
                />
                <input
                  type="password"
                  placeholder="Parol"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="input"
                  required
                />

                {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

                <button type="submit" disabled={loading} className="btn-royal w-full disabled:opacity-50">
                  {loading ? 'Yoxlanılır...' : 'Daxil ol'}
                </button>

                <p className="text-center text-sm text-ink-600">
                  Hesabın yoxdur?{' '}
                  <button type="button" onClick={() => { setEmailMode('register'); setError(''); }} className="text-tap font-semibold hover:underline">
                    Qeydiyyat
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={onRegister} className="space-y-3">
                <input
                  type="text"
                  placeholder="Ad Soyad *"
                  value={regForm.full_name}
                  onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                  className="input"
                  required
                  autoFocus
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="input"
                  required
                />
                <input
                  type="password"
                  placeholder="Parol (min 6) *"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="input"
                  required
                  minLength={6}
                />
                <input
                  type="text"
                  placeholder="Şəhər"
                  value={regForm.city}
                  onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                  className="input"
                />

                {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

                <button type="submit" disabled={loading} className="btn-royal w-full disabled:opacity-50">
                  {loading ? 'Gözlə...' : 'Hesab yarat'}
                </button>

                <p className="text-[11px] text-ink-500 text-center">
                  Qeydiyyatdan keçməklə{' '}
                  <a href="/qaydalar" className="underline">İstifadə qaydaları</a>nı qəbul edirsiniz.
                </p>
                <p className="text-center text-sm text-ink-600">
                  Artıq hesabın var?{' '}
                  <button type="button" onClick={() => { setEmailMode('login'); setError(''); }} className="text-tap font-semibold hover:underline">
                    Daxil ol
                  </button>
                </p>
              </form>
            )}

            {/* Sosial */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-ink-200" />
              <span className="text-xs text-ink-500">və ya</span>
              <div className="flex-1 h-px bg-ink-200" />
            </div>
            <div className="flex justify-center gap-3">
              <button className="social-btn social-google">G</button>
              <button className="social-btn social-apple"></button>
              <button className="social-btn social-mail">M</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
