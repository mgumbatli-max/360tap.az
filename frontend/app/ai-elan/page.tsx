'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { azNumber } from '@/lib/format';

type Draft = {
  title?: string;
  description?: string;
  category?: string;
  vertical?: string;
  price?: number | null;
  currency?: string;
  region?: string | null;
  attributes?: Record<string, string>;
};

const EXAMPLES = [
  'Satıram iPhone 14 Pro Max ağ 256GB təmirsiz qəbələdə 2000 manat',
  'Bakıda Mercedes E220 2017 dizel avtomat 52000 manat, vuruğu yoxdur',
  'Yasamalda 3 otaqlı təmirli mənzil kirayə, 850 manat aylıq',
];

export default function AiElanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const createListing = async () => {
    if (!draft) return;
    if (!user) {
      setError('Elanı yerləşdirmək üçün əvvəlcə yuxarıdan "Daxil ol" düyməsi ilə hesabınıza daxil olun.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const r = await api<{ data?: { id: string } }>('/ai/create-listing', {
        method: 'POST',
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          category: draft.category,
          region: draft.region ?? undefined,
          price: typeof draft.price === 'number' ? draft.price : undefined,
          attributes: draft.attributes,
        }),
      });
      const id = r.data?.id;
      if (id) router.push(`/elanlar/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Elan yaradıla bilmədi');
    } finally {
      setCreating(false);
    }
  };

  const generate = async (input?: string) => {
    const t = (input ?? text).trim();
    if (t.length < 3) return;
    if (input) setText(input);
    setLoading(true);
    setError('');
    setDraft(null);
    try {
      const r = await fetch('/api/ai/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t }),
      });
      const d = await r.json();
      if (r.ok) setDraft(d.data?.draft ?? d.draft ?? null);
      else setError(d.message || 'Xəta baş verdi');
    } catch {
      setError('AI xidmətinə qoşulmaq alınmadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-tap" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 dark:text-white">
            AI ilə elan yarat
          </h1>
        </div>
        <p className="text-ink-500 mb-6">
          Sadəcə adi sözlərlə yazın — AI başlıq, təsvir, kateqoriya, qiymət və xüsusiyyətləri özü doldurur.
        </p>

        <div className="card p-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Məs: Satıram iPhone 14 Pro Max ağ 256GB təmirsiz qəbələdə 2000 manat"
            className="w-full bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl p-3 text-sm text-ink-900 dark:text-white outline-none focus:border-tap resize-none"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => generate(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-tap-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-tap-50/70"
              >
                {ex.slice(0, 32)}…
              </button>
            ))}
          </div>
          <button
            onClick={() => generate()}
            disabled={loading || text.trim().length < 3}
            className="btn-tap mt-4 w-full justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> AI düşünür…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" /> AI ilə elanı yarat
              </>
            )}
          </button>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        {draft && (
          <div className="card p-5 mt-5 animate-slide-down">
            <div className="flex items-center gap-2 mb-3 text-tap font-bold text-sm">
              <Sparkles className="w-4 h-4" /> AI elan layihəsi hazırdır
            </div>
            <h2 className="text-xl font-extrabold text-ink-900 dark:text-white">{draft.title}</h2>
            {draft.price != null && (
              <div className="text-2xl font-extrabold text-tap mt-1">
                {azNumber(draft.price)} {draft.currency ?? 'AZN'}
              </div>
            )}
            <p className="text-ink-700 dark:text-ink-300 mt-3 leading-relaxed whitespace-pre-line">
              {draft.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {draft.category && (
                <span className="px-2.5 py-1 rounded-full bg-ink-100 dark:bg-ink-800 text-xs font-medium">
                  📂 {draft.category}
                </span>
              )}
              {draft.region && (
                <span className="px-2.5 py-1 rounded-full bg-ink-100 dark:bg-ink-800 text-xs font-medium">
                  📍 {draft.region}
                </span>
              )}
              {draft.attributes &&
                Object.entries(draft.attributes)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2.5 py-1 rounded-full bg-tap-50 dark:bg-ink-800 text-xs font-medium border border-tap/20"
                    >
                      {k}: {String(v)}
                    </span>
                  ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={createListing}
                disabled={creating}
                className="btn-tap flex-1 justify-center disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Yaradılır…
                  </>
                ) : (
                  'Bu elanı yerləşdir →'
                )}
              </button>
              <button onClick={() => generate()} className="btn-secondary" disabled={creating}>
                Yenidən
              </button>
            </div>
            <p className="text-ink-400 text-xs mt-3">
              💡 {user ? 'AI layihəni hazırladı — "yerləşdir" düyməsi elanı yaradır.' : 'Yerləşdirmək üçün hesabınıza daxil olun.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
