'use client';
import { AlertTriangle, Hammer, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import type { Fail } from './adminApi';

/**
 * Bölmə vəziyyətləri — bütün admin bölmələri üçün ORTAQ.
 *
 * NİYƏ: bölmələrin bir hissəsinin backend-i paralel yazılır. Hər bölmə öz
 * uğursuzluq ekranını ayrıca yazsa, biri mütləq boş ağ sahə göstərəcək
 * (layihədə bu səhv artıq baş verib). Burada tək davranış qeydə alınır:
 * «hazırlanır» ≠ «xəta» ≠ «boşdur».
 */

export function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">{title}</h2>
          {description && (
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function LoadingBlock({ label = 'Yüklənir...' }: { label?: string }) {
  return (
    <div className="py-10 text-center text-ink-500 dark:text-ink-400 text-sm inline-flex items-center gap-2 w-full justify-center">
      <Loader2 className="w-4 h-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-10 text-center">
      <div className="font-semibold text-ink-900 dark:text-white">{title}</div>
      {hint && <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">{hint}</p>}
    </div>
  );
}

/** Uğursuzluq: «endpoint hazırlanır», «şəbəkə», «icazə» və ümumi xəta ayrı-ayrı. */
export function FailBlock({ fail, onRetry }: { fail: Fail; onRetry?: () => void }) {
  const config =
    fail.kind === 'missing'
      ? {
          icon: Hammer,
          title: 'Bu bölmə hazırlanır',
          text: 'Server hissəsi hələ aktiv deyil. Hazır olan kimi bölmə öz-özünə işləyəcək — panelin qalan hissəsi normal çalışır.',
        }
      : fail.kind === 'network'
        ? {
            icon: WifiOff,
            title: 'Serverlə əlaqə yoxdur',
            text: 'İnternet bağlantısını yoxlayıb yenidən cəhd edin.',
          }
        : fail.kind === 'forbidden'
          ? {
              icon: AlertTriangle,
              title: 'İcazə yoxdur',
              text: fail.message,
            }
          : { icon: AlertTriangle, title: 'Məlumat yüklənmədi', text: fail.message };

  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 p-5 text-center">
      <Icon className="w-8 h-8 text-ink-400 dark:text-ink-500 mx-auto mb-2" />
      <div className="font-semibold text-ink-900 dark:text-white">{config.title}</div>
      <p className="text-sm text-ink-600 dark:text-ink-300 mt-1 max-w-md mx-auto">{config.text}</p>
      {onRetry && fail.kind !== 'missing' && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-secondary text-sm mt-3 inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
        >
          <RefreshCw className="w-4 h-4" />
          Yenidən cəhd et
        </button>
      )}
    </div>
  );
}

/** Geniş cədvəllər mobil ekranda SƏHİFƏNİ deyil, yalnız özünü sürüşdürür. */
export function TableScroll({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto -mx-5 px-5">{children}</div>;
}

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`text-left text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400 py-2 px-3 whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2.5 px-3 text-sm text-ink-800 dark:text-ink-200 ${className}`}>{children}</td>;
}

export function Pager({
  page,
  total,
  limit,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 mt-3">
      <span className="text-sm text-ink-500 dark:text-ink-400">
        Səhifə {page} / {pages} · cəmi {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="btn-secondary text-sm disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
        >
          Əvvəlki
        </button>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="btn-secondary text-sm disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
        >
          Növbəti
        </button>
      </div>
    </div>
  );
}
