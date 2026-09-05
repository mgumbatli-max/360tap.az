'use client';
import { useCallback, useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { useToast } from '@/lib/toast';
import {
  AdminApi,
  USER_ROLE_LABEL,
  USER_STATUS_LABEL,
  type AdminUser,
  type Fail,
  type UserRole,
  type UserStatus,
} from './adminApi';
import { EmptyBlock, FailBlock, LoadingBlock, Pager, SectionCard, TableScroll, Td, Th } from './ui';

const LIMIT = 20;
const ROLES: UserRole[] = ['user', 'pro', 'business', 'moderator', 'admin', 'super_admin'];
const STATUSES: UserStatus[] = ['pending', 'active', 'suspended', 'banned'];

/**
 * İSTİFADƏÇİLƏR — rol və status idarəsi.
 *
 * Operator öz sətrində rol/status dəyişə bilmir: backend bunu ONSUZ DA rədd edir
 * (özünü kilidləmə müdafiəsi), lakin düymə aktiv qalsa istifadəçi «işləmir» deyə
 * düşünərdi. Ona görə səbəb ekranda açıq yazılır.
 */
export default function UsersSection({ currentUserId }: { currentUserId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'' | UserRole>('');
  const [fail, setFail] = useState<Fail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AdminApi.users({
      page,
      limit: LIMIT,
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(role ? { role } : {}),
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
  }, [page, q, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (
    user: AdminUser,
    body: { role?: UserRole; status?: UserStatus },
    confirmText: string,
  ) => {
    if (!confirm(confirmText)) return;
    setBusyId(user.id);
    const res = await AdminApi.updateUser(user.id, body);
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.fail.message);
      return;
    }
    setItems((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...res.value } : u)));
    toast.success('İstifadəçi yeniləndi');
  };

  return (
    <SectionCard
      title="İstifadəçilər"
      description="Rol və hesab statusu. Rol dəyişikliyi audit jurnalına yazılır."
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
            placeholder="Ad, e-poçt və ya telefon"
            aria-label="İstifadəçi axtar"
            className="input !pl-9 focus-visible:ring-2 focus-visible:ring-tap"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value as '' | UserRole);
          }}
          aria-label="Rol üzrə süz"
          className="input !w-auto focus-visible:ring-2 focus-visible:ring-tap"
        >
          <option value="">Bütün rollar</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {USER_ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : fail ? (
        <FailBlock fail={fail} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyBlock title="İstifadəçi tapılmadı" hint="Axtarış şərtini dəyişməyi yoxlayın." />
      ) : (
        <>
          <TableScroll>
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-ink-200 dark:border-ink-700">
                  <Th>İstifadəçi</Th>
                  <Th>Mağaza</Th>
                  <Th>Rol</Th>
                  <Th>Status</Th>
                  <Th>Qeydiyyat</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const self = u.id === currentUserId;
                  return (
                    <tr key={u.id} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                      <Td>
                        <div className="font-semibold text-ink-900 dark:text-white flex items-center gap-1.5">
                          {u.fullName || '—'}
                          {self && (
                            <span className="badge badge-trusted inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Siz
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-ink-500 dark:text-ink-400">
                          {u.email ?? u.phone ?? '—'}
                        </div>
                      </Td>
                      <Td>
                        {u.store ? (
                          <span className="font-mono text-xs">{u.store.slug}</span>
                        ) : (
                          <span className="text-ink-400 dark:text-ink-500">—</span>
                        )}
                      </Td>
                      <Td>
                        <select
                          value={u.role}
                          disabled={self || busyId === u.id}
                          onChange={(e) =>
                            void patch(
                              u,
                              { role: e.target.value as UserRole },
                              `${u.fullName} üçün rol «${USER_ROLE_LABEL[e.target.value as UserRole]}» olsun?`,
                            )
                          }
                          aria-label={`${u.fullName} üçün rol`}
                          title={self ? 'Öz rolunuzu dəyişə bilməzsiniz' : undefined}
                          className="input !w-auto !py-1.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-tap"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {USER_ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                      </Td>
                      <Td>
                        <select
                          value={u.status}
                          disabled={self || busyId === u.id}
                          onChange={(e) =>
                            void patch(
                              u,
                              { status: e.target.value as UserStatus },
                              `${u.fullName} hesabı «${USER_STATUS_LABEL[e.target.value as UserStatus]}» edilsin?`,
                            )
                          }
                          aria-label={`${u.fullName} üçün status`}
                          title={self ? 'Öz statusunuzu dəyişə bilməzsiniz' : undefined}
                          className="input !w-auto !py-1.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-tap"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {USER_STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </Td>
                      <Td className="whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('az-AZ')}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
          <Pager page={page} total={total} limit={LIMIT} onPage={setPage} />
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-3">
            Öz hesabınızın rolu və statusu qıfıllıdır — səhvən özünüzü paneldən çıxarmaq
            geri dönməz olardı. Sonuncu aktiv super admin də aşağı salına bilmir.
          </p>
        </>
      )}
    </SectionCard>
  );
}
