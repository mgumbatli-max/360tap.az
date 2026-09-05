'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Search } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { AdminApi, type CategoryLimitRow, type Fail, type PageMeta } from './adminApi';
import { EmptyBlock, FailBlock, LoadingBlock, SectionCard, TableScroll, Td, Th } from './ui';

/**
 * KATEQORİYA LİMİTLƏRİ.
 *
 * `meta.enforced` backend-dən gəlir və İKİQAT şərtin nəticəsidir
 * (`monetization.enabled` + `listing_limits.enabled`). `false` olduqda limitlər
 * saxlanılır və hesablanır, lakin HEÇ KİMİ bloklamır — bu, ekranda açıq yazılır,
 * yoxsa operator limiti «qoydum, işləyir» sanardı.
 */
export default function CategoryLimitsSection() {
  const toast = useToast();
  const [rows, setRows] = useState<CategoryLimitRow[]>([]);
  const [meta, setMeta] = useState<PageMeta>({});
  const [fail, setFail] = useState<Fail | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AdminApi.categoryLimits();
    if (res.ok) {
      setRows(res.value.items);
      setMeta(res.value.meta);
      setFail(null);
    } else {
      setFail(res.fail);
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) => r.nameAz.toLowerCase().includes(needle) || r.slug.toLowerCase().includes(needle),
    );
  }, [rows, q]);

  const draftOf = (row: CategoryLimitRow): Draft =>
    drafts[row.id] ?? {
      freePerMonth: row.limit?.freePerMonth ?? 0,
      storeFreePerMonth: row.limit?.storeFreePerMonth ?? null,
      extraListingPrice: row.limit?.extraListingPrice ?? 0,
      enabled: row.limit?.enabled ?? false,
    };

  const setDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? emptyDraft(rows, id)), ...patch } }));

  const save = async (row: CategoryLimitRow) => {
    const d = draftOf(row);
    setBusyId(row.id);
    const res = await AdminApi.upsertCategoryLimit(row.id, {
      freePerMonth: d.freePerMonth,
      // `null` = «fərdi limitlə eyni»; backend sahəni ümumiyyətlə gözləmir.
      ...(d.storeFreePerMonth === null ? {} : { storeFreePerMonth: d.storeFreePerMonth }),
      extraListingPrice: d.extraListingPrice,
      enabled: d.enabled,
    });
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.fail.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? res.value : r)));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    toast.success(`«${row.nameAz}» limiti saxlanıldı`);
  };

  const enforced = meta.enforced === true;

  return (
    <SectionCard
      title="Kateqoriya limitləri"
      description="Hər kateqoriya üçün 30 günlük pulsuz elan sayı və limit aşıldıqda tək elanın qiyməti."
    >
      <div
        className={`rounded-lg border p-4 mb-4 text-sm ${
          enforced
            ? 'border-warning bg-warning-light dark:bg-ink-800 dark:border-ink-600 text-ink-800 dark:text-ink-200'
            : 'border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-300'
        }`}
      >
        {enforced ? (
          <>
            <span className="font-semibold text-ink-900 dark:text-white">Limitlər TƏTBİQ OLUNUR.</span>{' '}
            Aşağıdakı dəyərlər istifadəçilərin elan yerləşdirməsini real olaraq məhdudlaşdırır.
          </>
        ) : (
          <>
            <span className="font-semibold text-ink-900 dark:text-white">
              Limitlər hesablanır, lakin tətbiq olunmur.
            </span>{' '}
            İndi yazdığınız dəyərlər saxlanılır və statistikada görünür, amma heç kimi bloklamır.
            Tətbiq üçün «Ayarlar»da həm ana açar, həm «Pulsuz elan limitləri» açılmalıdır.
          </>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 text-ink-400 dark:text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kateqoriya axtar"
          aria-label="Kateqoriya axtar"
          className="input !pl-9 focus-visible:ring-2 focus-visible:ring-tap"
        />
      </div>

      {loading ? (
        <LoadingBlock />
      ) : fail ? (
        <FailBlock fail={fail} onRetry={() => void load()} />
      ) : filtered.length === 0 ? (
        <EmptyBlock title="Kateqoriya tapılmadı" />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-ink-200 dark:border-ink-700">
                <Th>Kateqoriya</Th>
                <Th>Elan</Th>
                <Th>Pulsuz / ay</Th>
                <Th>Mağaza üçün</Th>
                <Th>Əlavə elan (₼)</Th>
                <Th>Aktiv</Th>
                <Th className="text-right">Saxla</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const d = draftOf(row);
                const dirty = drafts[row.id] !== undefined;
                return (
                  <tr key={row.id} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                    <Td>
                      <div className="font-semibold text-ink-900 dark:text-white">{row.nameAz}</div>
                      <div className="text-xs font-mono text-ink-500 dark:text-ink-400">
                        {row.slug}
                        {row.parentId === null && ' · kök'}
                      </div>
                    </Td>
                    <Td>{row.listingsCount}</Td>
                    <Td>
                      <input
                        type="number"
                        min={0}
                        value={d.freePerMonth}
                        onChange={(e) =>
                          setDraft(row.id, { freePerMonth: toInt(e.target.valueAsNumber) })
                        }
                        aria-label={`${row.nameAz} — aylıq pulsuz elan limiti`}
                        className="input !w-24 !py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-tap"
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={d.storeFreePerMonth ?? ''}
                          placeholder="eyni"
                          onChange={(e) =>
                            setDraft(row.id, {
                              storeFreePerMonth:
                                e.target.value === '' ? null : toInt(e.target.valueAsNumber),
                            })
                          }
                          aria-label={`${row.nameAz} — mağazalar üçün aylıq limit`}
                          className="input !w-24 !py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-tap"
                        />
                      </div>
                    </Td>
                    <Td>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={d.extraListingPrice}
                        onChange={(e) =>
                          setDraft(row.id, { extraListingPrice: toMoney(e.target.valueAsNumber) })
                        }
                        aria-label={`${row.nameAz} — əlavə elanın qiyməti`}
                        className="input !w-24 !py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-tap"
                      />
                    </Td>
                    <Td>
                      <input
                        type="checkbox"
                        checked={d.enabled}
                        onChange={(e) => setDraft(row.id, { enabled: e.target.checked })}
                        aria-label={`${row.nameAz} — limit aktiv olsun`}
                        className="w-4 h-4 accent-tap rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
                      />
                    </Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={() => void save(row)}
                        disabled={busyId === row.id || !dirty}
                        aria-label={`${row.nameAz} limitini saxla`}
                        className="btn-secondary text-xs inline-flex items-center gap-1.5 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
                      >
                        {busyId === row.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Saxla
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}

      <p className="text-xs text-ink-500 dark:text-ink-400 mt-3">
        «Mağaza üçün» boş buraxılsa, mağaza hesabları fərdi limitlə eyni sayılır.
        «Əlavə elan» 0 olduqda limitdən sonra elan SATILMIR (sadəcə dayanır).
      </p>
    </SectionCard>
  );
}

interface Draft {
  freePerMonth: number;
  storeFreePerMonth: number | null;
  extraListingPrice: number;
  enabled: boolean;
}

function emptyDraft(rows: CategoryLimitRow[], id: string): Draft {
  const row = rows.find((r) => r.id === id);
  return {
    freePerMonth: row?.limit?.freePerMonth ?? 0,
    storeFreePerMonth: row?.limit?.storeFreePerMonth ?? null,
    extraListingPrice: row?.limit?.extraListingPrice ?? 0,
    enabled: row?.limit?.enabled ?? false,
  };
}

/** Boş sahə `NaN` verir — backend `IsInt` ilə 400 qaytarardı. */
function toInt(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0;
}

function toMoney(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.round(v * 100) / 100) : 0;
}
