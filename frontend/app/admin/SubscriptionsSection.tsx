'use client';
import { useCallback, useEffect, useState } from 'react';
import { Gift, Loader2 } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { AdminApi, type AdminPackage, type AdminSubscription, type Fail } from './adminApi';
import { EmptyBlock, FailBlock, LoadingBlock, Pager, SectionCard, TableScroll, Td, Th } from './ui';

const LIMIT = 20;

/**
 * ABUNƏLƏR — siyahı + admin əl ilə vermə.
 *
 * NİYƏ ƏL İLƏ VERMƏ LAZIMDIR: ödəniş provayderi hələ qoşulmayıb. İlk mağazalarla
 * danışıq nəticəsində verilən paketin izi qalmalıdır — ona görə forma «qeyd»
 * sahəsi tələb edir və backend əməliyyatı AuditLog-a yazır (`grantedBy` + note).
 */
export default function SubscriptionsSection() {
  const toast = useToast();
  const [items, setItems] = useState<AdminSubscription[]>([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fail, setFail] = useState<Fail | null>(null);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [form, setForm] = useState({ userId: '', packageId: '', note: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const [subs, pkgs] = await Promise.all([
      AdminApi.subscriptions({ page, limit: LIMIT }),
      AdminApi.packages(),
    ]);
    if (subs.ok) {
      setItems(subs.value.items);
      setTotal(Number(subs.value.meta.total ?? subs.value.items.length));
      setFail(null);
    } else {
      setFail(subs.fail);
      setItems([]);
    }
    // Paket siyahısı yalnız formanı doldurmaq üçündür — alınmasa bölmə yenə işləyir.
    setPackages(pkgs.ok ? pkgs.value.items : []);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId.trim() || !form.packageId) {
      toast.error('İstifadəçi ID və paket seçilməlidir');
      return;
    }
    setGranting(true);
    const res = await AdminApi.grantSubscription({
      userId: form.userId.trim(),
      packageId: form.packageId,
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
    });
    setGranting(false);
    if (!res.ok) {
      toast.error(res.fail.message);
      return;
    }
    toast.success('Abunə verildi');
    setForm({ userId: '', packageId: '', note: '' });
    void load();
  };

  return (
    <SectionCard
      title="Abunələr"
      description="Mövcud abunələr və admin tərəfindən əl ilə verilən paketlər. Hər əl ilə vermə audit jurnalına düşür."
    >
      <form
        onSubmit={grant}
        className="rounded-xl border border-ink-200 dark:border-ink-700 p-4 mb-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
      >
        <label className="block">
          <span className="text-sm font-semibold text-ink-900 dark:text-white">İstifadəçi ID</span>
          <span className="block text-xs text-ink-500 dark:text-ink-400">
            «İstifadəçilər» bölməsindən UUID
          </span>
          <input
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            placeholder="00000000-0000-4000-8000-000000000000"
            aria-label="İstifadəçi ID"
            className="input mt-1.5 font-mono text-xs focus-visible:ring-2 focus-visible:ring-tap"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink-900 dark:text-white">Paket</span>
          <select
            value={form.packageId}
            onChange={(e) => setForm({ ...form, packageId: e.target.value })}
            aria-label="Paket seç"
            disabled={packages.length === 0}
            className="input mt-1.5 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-tap"
          >
            <option value="">
              {packages.length === 0 ? 'Paket yoxdur — əvvəlcə yaradın' : 'Seçin'}
            </option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink-900 dark:text-white">Qeyd</span>
          <span className="block text-xs text-ink-500 dark:text-ink-400">Niyə verildi?</span>
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            maxLength={500}
            aria-label="Abunə qeydi"
            className="input mt-1.5 focus-visible:ring-2 focus-visible:ring-tap"
          />
        </label>
        <button
          type="submit"
          disabled={granting || packages.length === 0}
          className="btn-tap text-sm inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap disabled:opacity-50"
        >
          {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
          Abunə ver
        </button>
      </form>

      {loading ? (
        <LoadingBlock />
      ) : fail ? (
        <FailBlock fail={fail} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyBlock title="Abunə yoxdur" hint="Ödəniş axını hələ qoşulmayıb — bu, gözlənilən haldır." />
      ) : (
        <>
          <TableScroll>
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-ink-200 dark:border-ink-700">
                  <Th>İstifadəçi</Th>
                  <Th>Paket</Th>
                  <Th>Status</Th>
                  <Th>Müddət</Th>
                  <Th>Qalıq</Th>
                  <Th>Qeyd</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                    <Td>
                      <div className="font-semibold text-ink-900 dark:text-white">
                        {s.user?.fullName ?? '—'}
                      </div>
                      <div className="text-xs text-ink-500 dark:text-ink-400">
                        {s.user?.email ?? s.user?.phone ?? s.userId}
                      </div>
                    </Td>
                    <Td>{s.package?.name ?? '—'}</Td>
                    <Td>
                      <span className={`badge ${s.isActive ? 'badge-active' : 'badge-ad'}`}>
                        {s.isActive ? 'Aktiv' : s.status}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-xs">
                      {new Date(s.startsAt).toLocaleDateString('az-AZ')} —{' '}
                      {new Date(s.endsAt).toLocaleDateString('az-AZ')}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {s.quotaLeft} elan · {s.balanceLeft} ₼
                    </Td>
                    <Td className="max-w-[220px]">
                      <span className="block truncate" title={s.note ?? ''}>
                        {s.note ?? '—'}
                      </span>
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
