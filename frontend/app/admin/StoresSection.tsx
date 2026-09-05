'use client';
import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Check, Loader2, Search, ShieldOff } from 'lucide-react';
import { useToast } from '@/lib/toast';
import {
  AdminApi,
  STORE_STATUS_LABEL,
  type AdminStore,
  type Fail,
  type StoreStatus,
} from './adminApi';
import { EmptyBlock, FailBlock, LoadingBlock, Pager, SectionCard, TableScroll, Td, Th } from './ui';

const LIMIT = 20;

/**
 * MAĞAZALAR — «qırıq halqa 2 və 3»-ün operator tərəfi.
 *
 * `status` və `isVerified` platformada YALNIZ buradan yazılır. Hər dəyişiklik
 * backend-də AuditLog-a düşür (kim, nə vaxt, nəyi dəyişdi), ona görə düymələr
 * təsdiq soruşur — səhv klik geri dönməzdir.
 */
export default function StoresSection() {
  const toast = useToast();
  const [items, setItems] = useState<AdminStore[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | StoreStatus>('');
  const [fail, setFail] = useState<Fail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AdminApi.stores({
      page,
      limit: LIMIT,
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(status ? { status } : {}),
    });
    if (res.ok) {
      setItems(res.value.items);
      setTotal(Number(res.value.meta.total ?? res.value.items.length));
      setFail(null);
    } else {
      setFail(res.fail);
      setItems([]);
    }
    setLoading(false);
  }, [page, q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (
    store: AdminStore,
    body: { status?: StoreStatus; isVerified?: boolean },
    confirmText: string,
  ) => {
    if (!confirm(confirmText)) return;
    setBusyId(store.id);
    const res = await AdminApi.updateStore(store.id, body);
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.fail.message);
      return;
    }
    setItems((prev) => prev.map((s) => (s.id === store.id ? res.value : s)));
    toast.success('Mağaza yeniləndi');
  };

  return (
    <SectionCard
      title="Mağazalar"
      description="Təsdiq, verifikasiya nişanı və dayandırma. Hər dəyişiklik audit jurnalına yazılır."
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-ink-400 dark:text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Ad və ya slug üzrə axtar"
            aria-label="Mağaza axtar"
            className="input !pl-9 focus-visible:ring-2 focus-visible:ring-tap"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as '' | StoreStatus);
          }}
          aria-label="Status üzrə süz"
          className="input !w-auto focus-visible:ring-2 focus-visible:ring-tap"
        >
          <option value="">Bütün statuslar</option>
          <option value="pending">Təsdiq gözləyir</option>
          <option value="active">Aktiv</option>
          <option value="suspended">Dayandırılıb</option>
        </select>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : fail ? (
        <FailBlock fail={fail} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyBlock title="Mağaza tapılmadı" hint="Axtarış və ya süzgəci dəyişməyi yoxlayın." />
      ) : (
        <>
          <TableScroll>
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-ink-200 dark:border-ink-700">
                  <Th>Mağaza</Th>
                  <Th>Sahibi</Th>
                  <Th>Elan</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Əməliyyat</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-ink-100 dark:border-ink-800 last:border-0"
                  >
                    <Td>
                      <div className="font-semibold text-ink-900 dark:text-white flex items-center gap-1.5">
                        {s.name}
                        {s.isVerified && <BadgeCheck className="w-4 h-4 text-tap" aria-label="Təsdiqlənib" />}
                      </div>
                      <div className="text-xs text-ink-500 dark:text-ink-400 font-mono">{s.slug}</div>
                    </Td>
                    <Td>
                      <div>{s.owner?.fullName ?? '—'}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400">
                        {s.owner?.email ?? s.owner?.phone ?? '—'}
                      </div>
                    </Td>
                    <Td>{s.listingsCount}</Td>
                    <Td>
                      <span
                        className={`badge ${
                          s.status === 'active'
                            ? 'badge-active'
                            : s.status === 'pending'
                              ? 'badge-reserv'
                              : 'badge-ad'
                        }`}
                      >
                        {STORE_STATUS_LABEL[s.status]}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex flex-wrap gap-1.5 justify-end">
                        {s.status !== 'active' && (
                          <ActionButton
                            busy={busyId === s.id}
                            label="Təsdiqlə"
                            icon={Check}
                            onClick={() =>
                              void patch(s, { status: 'active' }, `«${s.name}» aktivləşdirilsin?`)
                            }
                          />
                        )}
                        <ActionButton
                          busy={busyId === s.id}
                          label={s.isVerified ? 'Nişanı götür' : 'Verifikasiya et'}
                          icon={BadgeCheck}
                          onClick={() =>
                            void patch(
                              s,
                              { isVerified: !s.isVerified },
                              s.isVerified
                                ? `«${s.name}» mağazasından təsdiq nişanı götürülsün?`
                                : `«${s.name}» təsdiq nişanı alsın?`,
                            )
                          }
                        />
                        {s.status !== 'suspended' && (
                          <ActionButton
                            busy={busyId === s.id}
                            label="Dayandır"
                            icon={ShieldOff}
                            danger
                            onClick={() =>
                              void patch(
                                s,
                                { status: 'suspended' },
                                `«${s.name}» dayandırılsın? Vitrin səhifəsi bağlanacaq.`,
                              )
                            }
                          />
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <Pager page={page} total={total} limit={LIMIT} onPage={setPage} />
        </>
      )}
    </SectionCard>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  busy,
  danger,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  busy: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tap disabled:opacity-50 ${
        danger
          ? 'border-danger text-danger hover:bg-danger-light dark:hover:bg-ink-700'
          : 'border-ink-200 dark:border-ink-600 text-ink-700 dark:text-ink-200 hover:border-tap'
      }`}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}
