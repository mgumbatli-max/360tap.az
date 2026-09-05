'use client';
import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import {
  computeOpenState,
  bakuNow,
  dayShort,
  type DayHours,
  type OpenState,
} from '../working-hours';

/**
 * AÇIQ/BAĞLI statusu — QƏSDƏN klient tərəfdə hesablanır.
 *
 * Səhifə ISR ilə keşlənir (revalidate). Status server-də render olunsaydı, keşdəki
 * HTML «Açıqdır» yazısını saatlarla daşıyardı — istifadəçi bağlı mağazaya zəng edərdi.
 * Ona görə: server yalnız CƏDVƏLİ verir, status mount-dan sonra hesablanır və
 * dəqiqədə bir yenilənir. İlk render statussuzdur → hidrasiya uyğunsuzluğu da yoxdur.
 */
export default function StoreHours({ days }: { days: DayHours[] }) {
  const [state, setState] = useState<OpenState | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = bakuNow();
      setState(now ? computeOpenState(days, now) : null);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [days]);

  return (
    <section aria-labelledby="magaza-is-saatlari" className="card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Clock className="h-4 w-4 text-ink-400" aria-hidden="true" />
        <h2 id="magaza-is-saatlari" className="text-sm font-bold text-ink-900 dark:text-white">
          İş saatları
        </h2>
        {state && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              state.open
                ? 'bg-success/10 text-success'
                : 'bg-danger/10 text-danger'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${state.open ? 'bg-success' : 'bg-danger'}`}
              aria-hidden="true"
            />
            {state.open ? 'Açıqdır' : 'Bağlıdır'}
          </span>
        )}
        {state?.nextChange && (
          <span className="text-xs text-ink-500 dark:text-ink-400">
            {state.open
              ? `${state.nextChange}-a qədər`
              : state.nextDayLabel
                ? `${state.nextDayLabel} ${state.nextChange}-da açılır`
                : `bu gün ${state.nextChange}-da açılır`}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-y-1 text-[13px] sm:grid-cols-2 sm:gap-x-6">
        {days.map((d) => {
          const isToday = state?.today.day === d.day;
          return (
            <div
              key={d.day}
              className={`flex items-center justify-between gap-3 rounded px-1.5 py-0.5 ${
                isToday ? 'bg-tap/10 font-semibold' : ''
              }`}
            >
              <dt className="text-ink-600 dark:text-ink-300">
                <span className="sm:hidden">{dayShort(d.day)}</span>
                <span className="hidden sm:inline">{d.label}</span>
              </dt>
              <dd
                className={
                  d.closed
                    ? 'text-ink-400 dark:text-ink-400'
                    : 'tabular-nums text-ink-900 dark:text-ink-50'
                }
              >
                {d.closed ? 'Bağlı' : `${d.open} – ${d.close}`}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-2 text-[11px] text-ink-400">Bakı vaxtı ilə</p>
    </section>
  );
}
