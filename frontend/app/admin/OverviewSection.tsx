'use client';
import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Store, Users, ListOrdered, FolderTree, Link2Off } from 'lucide-react';
import { AdminApi, type AdminStats, type CountMap, type Fail } from './adminApi';
import { FailBlock, LoadingBlock, SectionCard } from './ui';
import { azDateTime } from '@/lib/format';

/**
 * XÜLASƏ — YALNIZ REAL RƏQƏMLƏR.
 *
 * Köhnə panel «Aylıq gəlir» və «Şikayətlər» KPI-larını «—» ilə göstərirdi, yəni
 * arxasında heç bir mənbə olmayan xanalar idi. Burada hər dəyər `GET /admin/stats`
 * cavabındakı DB sayğacından gəlir; hesablanmayan göstərici ümumiyyətlə çəkilmir.
 */
export default function OverviewSection() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [fail, setFail] = useState<Fail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AdminApi.stats();
    if (res.ok) {
      setStats(res.value);
      setFail(null);
    } else {
      setFail(res.fail);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SectionCard
      title="Xülasə"
      description="Platformanın anlıq vəziyyəti — bütün rəqəmlər bazadan oxunur."
      actions={
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="btn-secondary text-sm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenilə
        </button>
      }
    >
      {loading && !stats ? (
        <LoadingBlock />
      ) : fail && !stats ? (
        <FailBlock fail={fail} onRetry={() => void load()} />
      ) : stats ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi
              icon={ListOrdered}
              label="Elanlar"
              value={stats.listings.total}
              sub={`son 7 gün: +${stats.listings.last7d}`}
            />
            <Kpi
              icon={Users}
              label="İstifadəçilər"
              value={stats.users.total}
              sub={`son 7 gün: +${stats.users.last7d}`}
            />
            <Kpi
              icon={Store}
              label="Mağazalar"
              value={stats.stores.total}
              sub={`${stats.stores.verified} təsdiqlənib`}
            />
            <Kpi
              icon={FolderTree}
              label="Kateqoriyalar"
              value={stats.categories.total}
              sub={`${stats.categories.active} aktiv`}
            />
          </div>

          {/* Mağazaya bağlanmayan elanlar mağaza vitrinlərini boş qoyur —
              bu göstərici həmin qırıq halqanın ölçüsüdür. */}
          {stats.listings.total > 0 && stats.listings.withStore === 0 && (
            <div className="rounded-lg border border-warning bg-warning-light dark:bg-ink-800 dark:border-ink-600 p-4 flex gap-3">
              <Link2Off className="w-5 h-5 text-ink-700 dark:text-ink-300 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-ink-900 dark:text-white">
                  Heç bir elan mağazaya bağlı deyil
                </div>
                <p className="text-sm text-ink-700 dark:text-ink-300 mt-1">
                  {stats.listings.total} elandan 0-ı mağazaya aiddir, yəni mağaza vitrin
                  səhifələri boş görünür.
                </p>
              </div>
            </div>
          )}

          {!stats.monetizationEnabled && (
            <div className="rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 p-4 text-sm text-ink-700 dark:text-ink-300">
              <span className="font-semibold text-ink-900 dark:text-white">
                Monetizasiya bağlıdır.
              </span>{' '}
              Limitlər hesablanır və bu paneldə görünür, lakin heç kimi bloklamır; paketlər
              ictimai vitrində göstərilmir. «Ayarlar» bölməsindən idarə olunur.
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-3">
            <Breakdown title="Elanlar (status)" map={stats.listings.byStatus} />
            <Breakdown title="İstifadəçilər (rol)" map={stats.users.byRole} />
            <Breakdown title="Mağazalar (status)" map={stats.stores.byStatus} />
          </div>

          <DailyChart daily={stats.daily} />

          <p className="text-xs text-ink-400 dark:text-ink-500">
            Hesablanma vaxtı: {azDateTime(stats.generatedAt)}
          </p>
        </div>
      ) : null}
    </SectionCard>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-700 p-4">
      <div className="w-9 h-9 rounded-lg bg-tap-50 dark:bg-ink-700 text-tap flex items-center justify-center mb-2">
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-extrabold text-ink-900 dark:text-white">{value}</div>
      <div className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{label}</div>
      <div className="text-xs text-ink-400 dark:text-ink-500 mt-1">{sub}</div>
    </div>
  );
}

function Breakdown({ title, map }: { title: string; map: CountMap }) {
  const rows = Object.entries(map ?? {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-700 p-4">
      <div className="text-sm font-semibold text-ink-900 dark:text-white mb-2">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-ink-400 dark:text-ink-500">Məlumat yoxdur</div>
      ) : (
        <ul className="space-y-1">
          {rows.map(([k, v]) => (
            <li key={k} className="flex items-center justify-between text-sm">
              <span className="text-ink-600 dark:text-ink-300">{k}</span>
              <span className="font-semibold text-ink-900 dark:text-white">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Son 7 günün dinamikası. Kitabxana əlavə etmirik — sadə nisbət sütunları
 * eyni məlumatı verir və paketin ölçüsünü artırmır.
 */
function DailyChart({ daily }: { daily: AdminStats['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => Math.max(d.listings, d.users)));
  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-700 p-4">
      <div className="text-sm font-semibold text-ink-900 dark:text-white mb-3">
        Son 7 gün (yeni elan / yeni istifadəçi)
      </div>
      <div className="overflow-x-auto">
        <div className="flex items-end gap-3 min-w-[320px] h-32">
          {daily.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end gap-1 h-24 w-full justify-center">
                <span
                  className="w-3 rounded-t bg-tap"
                  style={{ height: `${(d.listings / max) * 100}%` }}
                  title={`${d.listings} elan`}
                />
                <span
                  className="w-3 rounded-t bg-success"
                  style={{ height: `${(d.users / max) * 100}%` }}
                  title={`${d.users} istifadəçi`}
                />
              </div>
              <span className="text-[10px] text-ink-400 dark:text-ink-500">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4 mt-3 text-xs text-ink-500 dark:text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-tap" /> Elan
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-success" /> İstifadəçi
        </span>
      </div>
    </div>
  );
}
