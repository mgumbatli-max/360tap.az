'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';

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
      <div className="card p-6 sm:p-8 w-full max-w-md">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <h1 className="text-2xl font-extrabold text-ink-900 mb-1 text-center">Daxil ol</h1>
        <p className="text-sm text-ink-500 mb-6 text-center">Hesabınla davam et</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Telefon və ya email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="input"
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Parol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-tap w-4 h-4" />
              <span>Yadda saxla</span>
            </label>
            <button type="button" className="text-tap hover:underline">Şifrəni unutdun?</button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-royal w-full disabled:opacity-50">
            {loading ? 'Yoxlanılır...' : 'Daxil ol'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-ink-200" />
          <span className="text-xs text-ink-500">və ya davam et</span>
          <div className="flex-1 h-px bg-ink-200" />
        </div>

        <div className="flex justify-center gap-3">
          <button className="social-btn social-google">G</button>
          <button className="social-btn social-apple"></button>
          <button className="social-btn social-mail">M</button>
        </div>

        <p className="text-sm text-ink-600 mt-6 text-center">
          Hesabın yoxdur?{' '}
          <Link href="/qeydiyyat" className="text-tap font-semibold hover:underline">
            Qeydiyyat
          </Link>
        </p>
      </div>
    </div>
  );
}
