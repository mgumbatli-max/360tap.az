'use client';
import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Store } from 'lucide-react';
import { useToast } from '@/lib/toast';

/**
 * MAĞAZANIN İCTİMAİ VİTRİN LİNKİ — kabinetin əsas dəyəri (paylaşmaq üçün).
 *
 * NİYƏ YOXLAMA VAR: ictimai vitrin səhifəsi (`/magaza/[slug]`) ayrı iş paketidir və
 * bu ekranla paralel hazırlanır. Mövcud olmayan səhifəyə «Vitrini aç» düyməsi
 * qoymaq istifadəçini 404-ə aparardı — layihənin «işləməyən düymə olmasın»
 * qaydasını pozur. Ona görə route bir dəfə yoxlanır və yalnız CAVAB VERƏNDƏ
 * link göstərilir; hazır olmayanda vəziyyət açıq yazılır. Səhifə əlavə olunan
 * kimi bu blok özü linkə çevrilir — kod dəyişikliyi tələb olunmur.
 */
type Availability = 'checking' | 'available' | 'missing';

export default function StorefrontLink({ slug }: { slug: string }) {
  const toast = useToast();
  const [state, setState] = useState<Availability>('checking');
  const [absoluteUrl, setAbsoluteUrl] = useState('');

  const path = `/magaza/${slug}`;

  useEffect(() => {
    setAbsoluteUrl(`${window.location.origin}${path}`);

    const ac = new AbortController();
    fetch(path, { method: 'HEAD', signal: ac.signal, cache: 'no-store' })
      .then((r) => setState(r.ok ? 'available' : 'missing'))
      .catch(() => setState('missing'));
    return () => ac.abort();
  }, [path]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      toast.success('Link kopyalandı');
    } catch {
      toast.error('Kopyalanmadı — linki əl ilə seçin');
    }
  };

  return (
    <div className="card p-5">
      <h2 className="font-bold text-ink-900 dark:text-white flex items-center gap-2">
        <Store className="w-5 h-5 text-tap" />
        Mağaza səhifəniz
      </h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 mb-3">
        Bu linki müştərilərinizə göndərin — bütün elanlarınız bir səhifədə görünür.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <code className="flex-1 min-w-0 text-sm font-mono text-ink-900 dark:text-white bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg px-3 py-2 break-all">
          {absoluteUrl || path}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label="Mağaza linkini kopyala"
          className="btn-secondary text-sm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
        >
          <Copy className="w-4 h-4" />
          Kopyala
        </button>
        {state === 'available' && (
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tap text-sm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
          >
            <ExternalLink className="w-4 h-4" />
            Vitrini aç
          </a>
        )}
      </div>

      {state === 'missing' && (
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
          İctimai vitrin səhifəsi hazırlanır. Linkiniz artıq rezerv olunub və səhifə
          açılan kimi bu ünvanda işləyəcək.
        </p>
      )}
    </div>
  );
}
