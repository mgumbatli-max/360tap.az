'use client';
import { useCallback, useEffect, useState } from 'react';
import { MapPin, Plus, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { StoreApi, type Fail, type StoreBranch } from './storeApi';

/**
 * FİLİALLAR.
 *
 * Backend endpoint-i (`/me/store/branches`) paralel yazılır — hazır olmadıqda
 * bölmə «hazırlanır» vəziyyəti göstərir və HEÇ BİR işləməyən düymə qalmır
 * (forma yalnız endpoint cavab verdikdə görünür).
 */
export default function BranchesPanel() {
  const toast = useToast();
  const [items, setItems] = useState<StoreBranch[]>([]);
  const [fail, setFail] = useState<Fail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await StoreApi.branches();
    if (res.ok) {
      setItems(Array.isArray(res.value) ? res.value : []);
      setFail(null);
    } else {
      setFail(res.fail);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      toast.error('Filial adı və ünvan tələb olunur');
      return;
    }
    setSaving(true);
    const res = await StoreApi.addBranch({
      name: form.name.trim(),
      address: form.address.trim(),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.fail.message);
      return;
    }
    setForm({ name: '', address: '', phone: '' });
    toast.success('Filial əlavə olundu');
    void load();
  };

  const remove = async (b: StoreBranch) => {
    if (!confirm(`«${b.name}» filialı silinsin?`)) return;
    setRemovingId(b.id);
    const res = await StoreApi.removeBranch(b.id);
    setRemovingId(null);
    if (!res.ok) {
      toast.error(res.fail.message);
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== b.id));
    toast.success('Filial silindi');
  };

  return (
    <section className="card p-5">
      <h2 className="font-bold text-ink-900 dark:text-white flex items-center gap-2">
        <MapPin className="w-5 h-5 text-tap" />
        Filiallar
      </h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 mb-4">
        Müştəri sizi harada tapacağını bilməlidir. Filiallar mağaza səhifənizdə görünür.
      </p>

      {loading ? (
        <div className="py-6 text-center text-ink-500 dark:text-ink-400 text-sm">Yüklənir...</div>
      ) : fail ? (
        <div className="rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 p-4 text-sm">
          {fail.kind === 'missing' ? (
            <>
              <div className="font-semibold text-ink-900 dark:text-white">Filial idarəsi hazırlanır</div>
              <p className="text-ink-600 dark:text-ink-300 mt-1">
                Bu bölmənin server hissəsi hələ aktiv deyil. Hazır olan kimi filialları buradan
                əlavə edə biləcəksiniz.
              </p>
            </>
          ) : (
            <>
              <div className="font-semibold text-ink-900 dark:text-white">Filiallar yüklənmədi</div>
              <p className="text-ink-600 dark:text-ink-300 mt-1">{fail.message}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="btn-secondary text-sm mt-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
              >
                Yenidən cəhd et
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {items.length > 0 && (
            <ul className="space-y-2 mb-4">
              {items.map((b) => (
                <li
                  key={b.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-ink-200 dark:border-ink-700 p-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-ink-900 dark:text-white truncate">{b.name}</div>
                    <div className="text-sm text-ink-600 dark:text-ink-300 break-words">{b.address}</div>
                    {b.phone && (
                      <div className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">{b.phone}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void remove(b)}
                    disabled={removingId === b.id}
                    aria-label={`${b.name} filialını sil`}
                    className="p-2 rounded-lg text-danger hover:bg-danger-light dark:hover:bg-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap disabled:opacity-50 shrink-0"
                  >
                    {removingId === b.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={add} className="grid sm:grid-cols-3 gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Filial adı"
              aria-label="Filial adı"
              maxLength={120}
              className="input focus-visible:ring-2 focus-visible:ring-tap"
            />
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Ünvan"
              aria-label="Filial ünvanı"
              maxLength={300}
              className="input focus-visible:ring-2 focus-visible:ring-tap"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Telefon (istəyə bağlı)"
              aria-label="Filial telefonu"
              inputMode="tel"
              maxLength={20}
              className="input focus-visible:ring-2 focus-visible:ring-tap"
            />
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-tap text-sm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Filial əlavə et
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
