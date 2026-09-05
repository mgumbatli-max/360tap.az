'use client';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Power } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { AdminApi, type Fail, type PlatformSetting } from './adminApi';
import { FailBlock, LoadingBlock, SectionCard } from './ui';

const MASTER_KEY = 'monetization.enabled';

/**
 * AYARLAR — PANELİN ƏN VACİB EKRANI.
 *
 * Bütün monetizasiya bayraqları buradan açılıb-bağlanır. İki qayda ekranda
 * GÖRÜNÜR olmalıdır, yoxsa operator səhv qərar verər:
 *  1) `monetization.enabled` ANA AÇARDIR — bağlıdırsa, ondan asılı bayraq açıq
 *     olsa belə funksiya işləmir (backend `isMonetizedFeatureEnabled` ikiqat şərt).
 *  2) Bayraqlar hazırda qəsdən sönülüdür: platformada trafik yoxdur, limit/qiymət
 *     tədarükü öldürür. Kod hazır dayanır, açmaq bir kliklikdir.
 */
export default function FlagsSection() {
  const toast = useToast();
  const [items, setItems] = useState<PlatformSetting[]>([]);
  const [fail, setFail] = useState<Fail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AdminApi.settings();
    if (res.ok) {
      setItems(Array.isArray(res.value) ? res.value : []);
      setFail(null);
    } else {
      setFail(res.fail);
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const master = items.find((s) => s.key === MASTER_KEY);
  const masterOn = master?.value === true;

  const toggle = async (setting: PlatformSetting, next: boolean) => {
    const isMaster = setting.key === MASTER_KEY;
    const warning = isMaster
      ? next
        ? 'Monetizasiya AÇILSIN? Aktiv olan bütün ödənişli funksiyalar dərhal istifadəçilərə görünəcək.'
        : 'Monetizasiya BAĞLANSIN? Bütün ödənişli funksiyalar dərhal gizlənəcək.'
      : `«${setting.label}» ${next ? 'açılsın' : 'bağlansın'}?`;
    if (!confirm(warning)) return;

    setBusyKey(setting.key);
    const res = await AdminApi.setSetting(setting.key, next);
    setBusyKey(null);
    if (!res.ok) {
      toast.error(res.fail.message);
      return;
    }
    setItems((prev) => prev.map((s) => (s.key === setting.key ? { ...s, value: next } : s)));
    toast.success('Ayar yeniləndi');
  };

  return (
    <SectionCard
      title="Ayarlar — monetizasiya bayraqları"
      description="Platformanın ödənişli funksiyaları buradan idarə olunur. Dəyişiklik ən geci 30 saniyəyə bütün serverlərdə qüvvəyə minir."
    >
      {loading ? (
        <LoadingBlock />
      ) : fail ? (
        <FailBlock fail={fail} onRetry={() => void load()} />
      ) : (
        <div className="space-y-3">
          {!masterOn && (
            <div className="rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 p-4 text-sm text-ink-700 dark:text-ink-300">
              <span className="font-semibold text-ink-900 dark:text-white">
                Ana açar bağlıdır.
              </span>{' '}
              Aşağıdakı monetizasiya bayraqlarını açsanız belə funksiyalar İŞLƏMƏYƏCƏK —
              əvvəlcə «Monetizasiya (ümumi açar)» açılmalıdır. Bu, insident zamanı hər şeyi
              bir düymə ilə söndürmək üçündür.
            </div>
          )}

          {items.map((s) => {
            const on = s.value === true;
            const isMaster = s.key === MASTER_KEY;
            // Ana açar bağlıdırsa ondan asılı bayraqlar effektsizdir — vizual olaraq susdurulur.
            const inert = isMonetized(s.key) && !masterOn;

            return (
              <div
                key={s.key}
                className={`rounded-xl border p-4 flex flex-wrap items-start justify-between gap-4 ${
                  isMaster
                    ? 'border-tap bg-tap-50 dark:bg-ink-800'
                    : 'border-ink-200 dark:border-ink-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink-900 dark:text-white">{s.label}</span>
                    {isMaster && <span className="badge badge-trusted">Ana açar</span>}
                    {inert && <span className="badge badge-ad">Ana açar bağlı — təsirsiz</span>}
                  </div>
                  <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">{s.hint}</p>
                  <code className="text-xs text-ink-400 dark:text-ink-500 font-mono">{s.key}</code>
                </div>

                {typeof s.value === 'boolean' ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={`${s.label} — ${on ? 'açıq' : 'bağlı'}`}
                    disabled={busyKey === s.key}
                    onClick={() => void toggle(s, !on)}
                    className={`relative w-14 h-8 rounded-full transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap disabled:opacity-50 ${
                      on ? 'bg-success' : 'bg-ink-300 dark:bg-ink-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center transition-all ${
                        on ? 'left-7' : 'left-1'
                      }`}
                    >
                      {busyKey === s.key ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-ink-600" />
                      ) : (
                        <Power className="w-3.5 h-3.5 text-ink-500" />
                      )}
                    </span>
                  </button>
                ) : (
                  // Boolean olmayan açar (gələcəkdə astana rəqəmi ola bilər) —
                  // uydurma idarə elementi göstərmirik, dəyəri olduğu kimi yazırıq.
                  <code className="text-sm font-mono text-ink-900 dark:text-white bg-ink-50 dark:bg-ink-800 px-2 py-1 rounded">
                    {JSON.stringify(s.value)}
                  </code>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

/**
 * Ana açardan asılı bayraqlar — backend-də `isMonetizedFeatureEnabled` ilə oxunanlar.
 * `store.*` açarları bu siyahıda YOXDUR: onlar sadə `isEnabled` ilə oxunur, yəni
 * ana açardan asılı deyil. Siyahını «ehtiyatdan» genişləndirmək operatora yanlış
 * «bu ayar təsirsizdir» mesajı göstərərdi.
 */
function isMonetized(key: string): boolean {
  return (
    key === 'listing_limits.enabled' ||
    key === 'packages.enabled' ||
    key === 'promotions.enabled'
  );
}
