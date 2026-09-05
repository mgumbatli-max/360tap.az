'use client';
import { WEEK_DAYS, type DayHours, type WeekDayKey, type WorkingHours } from './storeApi';

const DEFAULT_OPEN = '09:00';
const DEFAULT_CLOSE = '18:00';

/**
 * İş saatları redaktoru.
 *
 * NİYƏ SƏRBƏST MƏTN DEYİL: backend `workingHours`-u sabit forma ilə (HH:MM,
 * gün açarı) qəbul edir. Mətn sahəsi buraxsaq, hər istifadəçi başqa yazı forması
 * yazacaq və mağaza səhifəsi onu göstərə bilməyəcək.
 */
export default function WorkingHoursEditor({
  value,
  onChange,
}: {
  value: WorkingHours;
  onChange: (v: WorkingHours) => void;
}) {
  const setDay = (day: WeekDayKey, patch: DayHours | null) => {
    const next: WorkingHours = { ...value };
    if (patch === null) delete next[day];
    else next[day] = patch;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {WEEK_DAYS.map(({ key, label }) => {
        const day = value[key];
        const enabled = !!day;
        const closed = day?.closed === true;
        return (
          <div
            key={key}
            className="flex flex-wrap items-center gap-2 py-1.5 border-b border-ink-100 dark:border-ink-800 last:border-0"
          >
            <label className="flex items-center gap-2 w-28 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) =>
                  setDay(key, e.target.checked ? { open: DEFAULT_OPEN, close: DEFAULT_CLOSE } : null)
                }
                aria-label={`${label} günü üçün iş rejimini göstər`}
                className="w-4 h-4 accent-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-tap rounded"
              />
              <span className="text-sm font-medium text-ink-900 dark:text-white">{label}</span>
            </label>

            {enabled ? (
              <div className="flex flex-wrap items-center gap-2">
                {!closed && (
                  <>
                    <input
                      type="time"
                      value={day?.open ?? DEFAULT_OPEN}
                      onChange={(e) =>
                        setDay(key, { open: e.target.value, close: day?.close ?? DEFAULT_CLOSE })
                      }
                      aria-label={`${label} açılış saatı`}
                      className="input !w-28 !py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-tap"
                    />
                    <span className="text-ink-400 dark:text-ink-500">—</span>
                    <input
                      type="time"
                      value={day?.close ?? DEFAULT_CLOSE}
                      onChange={(e) =>
                        setDay(key, { open: day?.open ?? DEFAULT_OPEN, close: e.target.value })
                      }
                      aria-label={`${label} bağlanış saatı`}
                      className="input !w-28 !py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-tap"
                    />
                  </>
                )}
                <label className="flex items-center gap-1.5 text-sm text-ink-600 dark:text-ink-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={closed}
                    onChange={(e) =>
                      setDay(
                        key,
                        e.target.checked
                          ? { closed: true }
                          : { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
                      )
                    }
                    aria-label={`${label} günü istirahətdir`}
                    className="w-4 h-4 accent-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-tap rounded"
                  />
                  İstirahət
                </label>
              </div>
            ) : (
              <span className="text-sm text-ink-400 dark:text-ink-500">Göstərilməyib</span>
            )}
          </div>
        );
      })}
      <p className="text-xs text-ink-500 dark:text-ink-400 pt-1">
        İşarələnməyən gün «məlumat yoxdur» deməkdir — mağaza səhifəsində göstərilmir.
        Bağlanış saatı açılışdan sonra olmalıdır.
      </p>
    </div>
  );
}
