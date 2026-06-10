'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
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
      <div className="card p-6 sm:p-8 w-full max-w-md">
        <div className="flex justify-center mb-4"><Logo /></div>
        <h1 className="text-2xl font-extrabold text-ink-900 mb-1 text-center">Qeydiyyat</h1>
        <p className="text-sm text-ink-500 mb-6 text-center">Pulsuzdur — bir dəqiqəlikdir</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input className="input" placeholder="Ad Soyad *" required
                 value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input className="input" type="email" placeholder="Email"
                 value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Telefon (+994...)"
                 value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="Şəhər"
                 value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="input" type="password" placeholder="Parol (min 6 simvol) *" required minLength={6}
                 value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

          <p className="text-xs text-ink-500">Email və ya telefondan ən azı biri tələb olunur.</p>

          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

          <button type="submit" disabled={loading} className="btn-royal w-full disabled:opacity-50">
            {loading ? 'Gözlə...' : 'Hesab yarat'}
          </button>
        </form>

        <p className="text-[11px] text-ink-500 mt-4 text-center leading-relaxed">
          Qeydiyyatdan keçməklə{' '}
          <Link href="/qaydalar" className="underline">İstifadə qaydaları</Link>{' '}və{' '}
          <Link href="/mexfilik" className="underline">Məxfilik siyasəti</Link>ni qəbul edirsiniz.
        </p>

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
          Artıq hesabın var?{' '}
          <Link href="/login" className="text-tap font-semibold hover:underline">Daxil ol</Link>
        </p>
      </div>
    </div>
  );
}
