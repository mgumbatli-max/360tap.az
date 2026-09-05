'use client';
import { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Loader2, PlugZap, RefreshCw, ShieldCheck } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { StoreApi, type ErpCredentials, type ErpStatus, type Fail } from './storeApi';

/**
 * ERP İNTEQRASİYASI — platformanın rəqiblərdə OLMAYAN üstünlüyü, ona görə
 * kabinetdə gizli bölmə deyil, görünən yerdədir.
 *
 * NİYƏ AÇARLAR YALNIZ BİR DƏFƏ: backend `apiKey`-in yalnız SHA-256 həşini saxlayır
 * (`erp.service.ts`), yəni açar sonradan heç bir yerdən oxuna bilmir. Ekran bunu
 * açıq deyir ki, istifadəçi açarı köçürmədən səhifəni bağlamasın.
 */
export default function ErpPanel() {
  const toast = useToast();
  const [status, setStatus] = useState<ErpStatus | null>(null);
  const [fail, setFail] = useState<Fail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [creds, setCreds] = useState<ErpCredentials | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await StoreApi.erpStatus();
    if (res.ok) {
      setStatus(res.value);
      setFail(null);
    } else {
      setFail(res.fail);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enable = async () => {
    // Mövcud inteqrasiya varsa açarlar YENİDƏN yaradılır və köhnəsi işləməz olur.
    if (status?.enabled && !confirm('Yeni açarlar yaradılacaq və köhnə açar işləməyəcək. Davam edilsin?')) {
      return;
    }
    setEnabling(true);
    const res = await StoreApi.erpEnable();
    setEnabling(false);
    if (!res.ok) {
      toast.error(res.fail.message);
      return;
    }
    setCreds(res.value);
    toast.success('ERP inteqrasiyası aktivləşdi');
    void load();
  };

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} kopyalandı`);
    } catch {
      toast.error('Kopyalanmadı — mətni əl ilə seçin');
    }
  };

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-ink-900 dark:text-white flex items-center gap-2">
            <PlugZap className="w-5 h-5 text-tap" />
            ERP inteqrasiyası
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Anbar proqramınız məhsulları birbaşa 360tap-a göndərsin: qiymət və stok
            avtomatik yenilənir, satılan məhsul özü arxivə düşür.
          </p>
        </div>
        <span className="badge badge-trusted shrink-0">Üstünlük</span>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="py-4 text-sm text-ink-500 dark:text-ink-400">Yüklənir...</div>
        ) : fail ? (
          <div className="rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 p-4 text-sm">
            <div className="font-semibold text-ink-900 dark:text-white">
              {fail.kind === 'missing' ? 'ERP bölməsi hazırlanır' : 'Status alınmadı'}
            </div>
            <p className="text-ink-600 dark:text-ink-300 mt-1">{fail.message}</p>
            {fail.kind !== 'missing' && (
              <button
                type="button"
                onClick={() => void load()}
                className="btn-secondary text-sm mt-3 inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
              >
                <RefreshCw className="w-4 h-4" /> Yenidən cəhd et
              </button>
            )}
          </div>
        ) : status?.enabled ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Vəziyyət" value={status.isActive ? 'Aktiv' : 'Dayandırılıb'} />
              <Stat label="Sinxron məhsul" value={String(status.productCount ?? 0)} />
              <Stat
                label="Son sinxronizasiya"
                value={status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString('az-AZ') : 'Hələ yoxdur'}
              />
              <Stat label="Tenant ID" value={status.erpTenantId ?? '—'} mono />
            </div>
            <button
              type="button"
              onClick={() => void enable()}
              disabled={enabling}
              className="btn-secondary text-sm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
            >
              {enabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Açarları yenilə
            </button>
          </div>
        ) : (
          <div>
            <ul className="text-sm text-ink-600 dark:text-ink-300 space-y-1.5 mb-4">
              <li className="flex gap-2">
                <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
                Məhsul kataloqunuz elan kimi avtomatik yayımlanır
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
                Stok bitəndə elan öz-özünə arxivləşir — «satılıb» zəngləri kəsilir
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
                Sorğular API açarı və HMAC imzası ilə qorunur
              </li>
            </ul>
            <button
              type="button"
              onClick={() => void enable()}
              disabled={enabling}
              className="btn-tap text-sm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
            >
              {enabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />}
              İnteqrasiyanı aktivləşdir
            </button>
          </div>
        )}
      </div>

      {creds && (
        <div className="mt-4 rounded-lg border border-warning bg-warning-light dark:bg-ink-800 dark:border-ink-600 p-4">
          <div className="font-bold text-ink-900 dark:text-white">Açarlar yalnız indi göstərilir</div>
          <p className="text-sm text-ink-700 dark:text-ink-300 mt-1 mb-3">
            Bu dəyərlər serverdə açıq saxlanmır. Səhifəni bağlamazdan əvvəl köçürüb
            təhlükəsiz yerdə saxlayın.
          </p>
          <Secret label="Tenant ID" value={creds.erpTenantId} onCopy={copy} />
          <Secret label="API açarı" value={creds.apiKey} onCopy={copy} />
          <Secret label="Webhook secret" value={creds.webhookSecret} onCopy={copy} />
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-ink-200 dark:border-ink-700 p-3">
      <div className="text-xs text-ink-500 dark:text-ink-400">{label}</div>
      <div
        className={`text-sm font-semibold text-ink-900 dark:text-white mt-0.5 break-all ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Secret({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (label: string, text: string) => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-2 mb-2 last:mb-0">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-ink-500 dark:text-ink-400">{label}</div>
        <code className="block text-xs font-mono text-ink-900 dark:text-white break-all">{value}</code>
      </div>
      <button
        type="button"
        onClick={() => void onCopy(label, value)}
        aria-label={`${label} dəyərini kopyala`}
        className="p-2 rounded-lg border border-ink-200 dark:border-ink-600 hover:border-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-tap shrink-0"
      >
        <Copy className="w-4 h-4 text-ink-600 dark:text-ink-300" />
      </button>
    </div>
  );
}
