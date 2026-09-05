'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  ListOrdered,
  MapPin,
  RefreshCw,
  ShieldOff,
} from 'lucide-react';
import ProfileLayout from '@/components/ProfileLayout';
import BranchesPanel from './BranchesPanel';
import ErpPanel from './ErpPanel';
import CreateStoreForm from './CreateStoreForm';
import StoreEditor from './StoreEditor';
import StorefrontLink from './StorefrontLink';
import { StoreApi, STORE_STATUS_LABEL, type Fail, type MyStore } from './storeApi';

/**
 * MAĞAZA SAHİBİNİN KABİNETİ.
 *
 * Üç vəziyyəti AYIRD EDİR (audit dərsi: hamısını `catch` ilə udmaq istifadəçini
 * izahsız boş ekranda qoyurdu):
 *   · mağaza yoxdur   → yaratma forması
 *   · endpoint yoxdur → «hazırlanır» (backend paralel yazılır)
 *   · real xəta       → mesaj + «yenidən cəhd et»
 */
export default function MyStorePage() {
  const [store, setStore] = useState<MyStore | null>(null);
  const [fail, setFail] = useState<Fail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await StoreApi.mine();
    if (res.ok) {
      setStore(res.value);
      setFail(null);
    } else {
      setStore(null);
      setFail(res.fail);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ProfileLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white">Mağazam</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
          Vitrininizi idarə edin: görünüş, əlaqə, iş saatları, filiallar və ERP inteqrasiyası.
        </p>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-ink-500 dark:text-ink-400">Yüklənir...</div>
      ) : store ? (
        <div className="space-y-5">
          <StoreHeader store={store} />
          <StorefrontLink slug={store.slug} />
          <StoreEditor store={store} onSaved={setStore} />
          <BranchesPanel />
          <ErpPanel />
        </div>
      ) : fail && fail.kind !== 'notFound' ? (
        <UnavailableState fail={fail} onRetry={() => void load()} />
      ) : (
        <CreateStoreForm onCreated={setStore} />
      )}
    </ProfileLayout>
  );
}

function StoreHeader({ store }: { store: MyStore }) {
  const pending = store.status === 'pending';
  const suspended = store.status === 'suspended';

  return (
    <section className="card overflow-hidden">
      {store.coverUrl && (
        <img src={store.coverUrl} alt="" className="w-full h-28 sm:h-36 object-cover" />
      )}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-tap-50 dark:bg-ink-800 text-tap flex items-center justify-center font-extrabold text-2xl shrink-0">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              store.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-ink-900 dark:text-white truncate">
                {store.name}
              </h2>
              {store.isVerified && (
                <span className="badge badge-verified inline-flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> Təsdiqlənib
                </span>
              )}
              <span
                className={`badge ${
                  suspended ? 'badge-ad' : pending ? 'badge-reserv' : 'badge-active'
                }`}
              >
                {STORE_STATUS_LABEL[store.status]}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-ink-600 dark:text-ink-300">
              <span className="inline-flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-ink-400 dark:text-ink-500" />
                {store.activeListings ?? 0} aktiv elan
                {typeof store.totalListings === 'number' && ` / ${store.totalListings} ümumi`}
              </span>
              {typeof store.branches === 'number' && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-ink-400 dark:text-ink-500" />
                  {store.branches} filial
                </span>
              )}
              {store.createdAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-ink-400 dark:text-ink-500" />
                  {new Date(store.createdAt).toLocaleDateString('az-AZ')}-dən bəri
                </span>
              )}
            </div>
          </div>
        </div>

        {pending && (
          <div className="mt-4 rounded-lg border border-warning bg-warning-light dark:bg-ink-800 dark:border-ink-600 p-4">
            <div className="font-semibold text-ink-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Təsdiq gözlənilir
            </div>
            <p className="text-sm text-ink-700 dark:text-ink-300 mt-1">
              Mağazanız moderator baxışındadır. Bu müddətdə profilinizi doldurub elan
              yerləşdirə bilərsiniz — təsdiqdən sonra vitrin səhifəniz hamıya açılır.
            </p>
          </div>
        )}

        {suspended && (
          <div className="mt-4 rounded-lg border border-danger bg-danger-light dark:bg-ink-800 dark:border-ink-600 p-4">
            <div className="font-semibold text-ink-900 dark:text-white flex items-center gap-2">
              <ShieldOff className="w-4 h-4" />
              Mağaza dayandırılıb
            </div>
            <p className="text-sm text-ink-700 dark:text-ink-300 mt-1">
              Vitrin səhifəniz hazırda ziyarətçilərə göstərilmir. Səbəbi öyrənmək üçün{' '}
              <Link href="/elaqe" className="text-tap underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tap rounded">
                dəstəklə əlaqə saxlayın
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function UnavailableState({ fail, onRetry }: { fail: Fail; onRetry: () => void }) {
  const preparing = fail.kind === 'missing';
  return (
    <div className="card p-10 text-center">
      <AlertTriangle className="w-10 h-10 text-ink-300 dark:text-ink-500 mx-auto mb-3" />
      <h2 className="font-bold text-ink-900 dark:text-white">
        {preparing ? 'Mağaza kabineti hazırlanır' : 'Məlumat yüklənmədi'}
      </h2>
      <p className="text-sm text-ink-600 dark:text-ink-300 mt-2 max-w-md mx-auto">
        {preparing
          ? 'Bu bölmənin server hissəsi hələ aktiv deyil. Hazır olan kimi mağazanızı buradan idarə edə biləcəksiniz.'
          : fail.message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-secondary text-sm mt-4 inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
      >
        <RefreshCw className="w-4 h-4" />
        Yenidən cəhd et
      </button>
    </div>
  );
}
