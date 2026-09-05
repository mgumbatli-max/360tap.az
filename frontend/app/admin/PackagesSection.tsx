'use client';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { AdminApi, type AdminPackage, type Fail, type PackagePayload } from './adminApi';
import { EmptyBlock, FailBlock, LoadingBlock, SectionCard, TableScroll, Td, Th } from './ui';

/**
 * PAKETLƏR — CRUD.
 *
 * NİYƏ QİYMƏT BURADA GÖRÜNÜR, VİTRİNDƏ YOX: başlanğıc siyasəti qiyməti
 * İSTİFADƏÇİYƏ göstərməyi qadağan edir, operatorun isə paketi hazırlaması lazımdır.
 * Backend `GET /packages` (ictimai) bayraq bağlı olduğu müddətdə BOŞ massiv qaytarır,
 * yəni burada yaradılan paket heç bir ictimai səhifədə görünmür.
 *
 * `isActive` defolt SÖNÜLÜDÜR: yeni paket şərtləri yoxlanılmadan satışa çıxmamalıdır.
 */

const EMPTY: PackagePayload = {
  code: '',
  name: '',
  priceMonthly: 0,
  durationDays: 30,
  serviceBalance: 0,
  listingQuota: 0,
  discountPercent: 0,
  description: '',
  isActive: false,
  sortOrder: 0,
};

export default function PackagesSection() {
  const toast = useToast();
  const [items, setItems] = useState<AdminPackage[]>([]);
  const [fail, setFail] = useState<Fail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<PackagePayload>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AdminApi.packages();
    if (res.ok) {
      setItems(res.value.items);
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

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await AdminApi.createPackage({
      ...draft,
      code: draft.code.trim(),
      name: draft.name.trim(),
      description: draft.description?.trim() || undefined,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.fail.message);
      return;
    }
    toast.success('Paket yaradıldı');
    setDraft(EMPTY);
    setCreating(false);
    void load();
  };

  const toggleActive = async (pkg: AdminPackage) => {
    const next = !pkg.isActive;
    if (
      !confirm(
        next
          ? `«${pkg.name}» aktivləşdirilsin? Monetizasiya açıq olduqda vitrində görünəcək.`
          : `«${pkg.name}» deaktiv edilsin?`,
      )
    ) {
      return;
    }
    setBusyId(pkg.id);
    const res = await AdminApi.updatePackage(pkg.id, { isActive: next });
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.fail.message);
      return;
    }
    setItems((prev) => prev.map((p) => (p.id === pkg.id ? res.value : p)));
    toast.success('Paket yeniləndi');
  };

  const remove = async (pkg: AdminPackage) => {
    const hasSubs = pkg.subscriptionsCount > 0;
    if (
      !confirm(
        hasSubs
          ? `«${pkg.name}» paketinin ${pkg.subscriptionsCount} abunəsi var — silinmir, deaktiv ediləcək. Davam edilsin?`
          : `«${pkg.name}» tamamilə silinsin?`,
      )
    ) {
      return;
    }
    setBusyId(pkg.id);
    const res = await AdminApi.deletePackage(pkg.id);
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.fail.message);
      return;
    }
    toast.success(res.value.deleted ? 'Paket silindi' : 'Paket deaktiv edildi');
    void load();
  };

  return (
    <SectionCard
      title="Paketlər"
      description="Paket şərtləri: qiymət, müddət, elan kvotası, xidmət balansı və endirim. Monetizasiya bayrağı bağlı olduğu müddətdə paketlər yalnız bu paneldə görünür."
      actions={
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="btn-tap text-sm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
        >
          {creating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {creating ? 'Bağla' : 'Yeni paket'}
        </button>
      }
    >
      {creating && (
        <form
          onSubmit={create}
          className="rounded-xl border border-ink-200 dark:border-ink-700 p-4 mb-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <NumberOrText
            label="Kod"
            hint="a-z, rəqəm, - və _"
            value={draft.code}
            onChange={(v) => setDraft({ ...draft, code: v })}
            required
          />
          <NumberOrText
            label="Ad"
            value={draft.name}
            onChange={(v) => setDraft({ ...draft, name: v })}
            required
          />
          <NumberField
            label="Aylıq qiymət (₼)"
            value={draft.priceMonthly}
            onChange={(v) => setDraft({ ...draft, priceMonthly: v })}
            step={0.01}
          />
          <NumberField
            label="Müddət (gün)"
            value={draft.durationDays ?? 30}
            onChange={(v) => setDraft({ ...draft, durationDays: v })}
          />
          <NumberField
            label="Xidmət balansı (₼)"
            value={draft.serviceBalance ?? 0}
            onChange={(v) => setDraft({ ...draft, serviceBalance: v })}
            step={0.01}
          />
          <NumberField
            label="Elan kvotası"
            value={draft.listingQuota ?? 0}
            onChange={(v) => setDraft({ ...draft, listingQuota: v })}
          />
          <NumberField
            label="Endirim (%)"
            value={draft.discountPercent ?? 0}
            onChange={(v) => setDraft({ ...draft, discountPercent: v })}
            max={100}
          />
          <NumberField
            label="Sıra"
            value={draft.sortOrder ?? 0}
            onChange={(v) => setDraft({ ...draft, sortOrder: v })}
          />
          <label className="block sm:col-span-2 lg:col-span-4">
            <span className="text-sm font-semibold text-ink-900 dark:text-white">Təsvir</span>
            <textarea
              value={draft.description ?? ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              maxLength={2000}
              aria-label="Paket təsviri"
              className="input mt-1.5 resize-y focus-visible:ring-2 focus-visible:ring-tap"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-tap text-sm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Paketi yarat
            </button>
            <span className="text-xs text-ink-500 dark:text-ink-400">
              Yeni paket deaktiv yaradılır — şərtləri yoxlayıb ayrıca aktivləşdirin.
            </span>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingBlock />
      ) : fail ? (
        <FailBlock fail={fail} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyBlock
          title="Hələ paket yoxdur"
          hint="Monetizasiya açılana qədər paket yaratmaq məcburi deyil."
        />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-ink-200 dark:border-ink-700">
                <Th>Paket</Th>
                <Th>Qiymət</Th>
                <Th>Müddət</Th>
                <Th>Kvota</Th>
                <Th>Balans</Th>
                <Th>Endirim</Th>
                <Th>Abunə</Th>
                <Th className="text-right">Əməliyyat</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                  <Td>
                    <div className="font-semibold text-ink-900 dark:text-white">{p.name}</div>
                    <div className="text-xs font-mono text-ink-500 dark:text-ink-400">{p.code}</div>
                  </Td>
                  <Td className="whitespace-nowrap">{p.priceMonthly} ₼</Td>
                  <Td className="whitespace-nowrap">{p.durationDays} gün</Td>
                  <Td>{p.listingQuota}</Td>
                  <Td className="whitespace-nowrap">{p.serviceBalance} ₼</Td>
                  <Td>{p.discountPercent}%</Td>
                  <Td>{p.subscriptionsCount}</Td>
                  <Td className="text-right">
                    <div className="inline-flex flex-wrap gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => void toggleActive(p)}
                        disabled={busyId === p.id}
                        aria-label={`${p.name} — ${p.isActive ? 'deaktiv et' : 'aktivləşdir'}`}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-tap disabled:opacity-50 ${
                          p.isActive
                            ? 'border-success text-success'
                            : 'border-ink-200 dark:border-ink-600 text-ink-600 dark:text-ink-300'
                        }`}
                      >
                        {busyId === p.id ? '...' : p.isActive ? 'Aktiv' : 'Deaktiv'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(p)}
                        disabled={busyId === p.id}
                        aria-label={`${p.name} paketini sil`}
                        className="px-2.5 py-1.5 rounded-lg border border-danger text-danger text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-danger-light dark:hover:bg-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Sil
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
    </SectionCard>
  );
}

function NumberOrText({
  label,
  hint,
  value,
  onChange,
  required,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink-900 dark:text-white">{label}</span>
      {hint && <span className="block text-xs text-ink-500 dark:text-ink-400">{hint}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-label={label}
        className="input mt-1.5 focus-visible:ring-2 focus-visible:ring-tap"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink-900 dark:text-white">{label}</span>
      <input
        type="number"
        value={value}
        min={0}
        max={max}
        step={step}
        // Boş sahə `NaN` verir — backend 400 qaytarardı, ona görə 0-a düşür.
        onChange={(e) => onChange(Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : 0)}
        aria-label={label}
        className="input mt-1.5 focus-visible:ring-2 focus-visible:ring-tap"
      />
    </label>
  );
}
