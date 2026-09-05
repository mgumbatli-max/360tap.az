'use client';
import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/lib/toast';
import ImageUploadField from './ImageUploadField';
import WorkingHoursEditor from './WorkingHoursEditor';
import { StoreApi, type MyStore, type UpdateStorePayload, type WorkingHours } from './storeApi';

/**
 * Mağaza profilinin redaktəsi.
 *
 * NİYƏ FƏRQ HESABLANIR: `PATCH /me/store`-da `undefined` = «toxunma», `null` = «sil».
 * Bütün sahələri hər dəfə göndərsək, toxunmadığımız sahələr də yenidən yazılar və
 * audit jurnalında saxta dəyişiklik izi qalar. Ona görə yalnız DƏYİŞƏN sahələr gedir.
 */
export default function StoreEditor({
  store,
  onSaved,
}: {
  store: MyStore;
  onSaved: (s: MyStore) => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(store.logoUrl);
  const [coverUrl, setCoverUrl] = useState<string | null>(store.coverUrl);
  const [description, setDescription] = useState(store.description ?? '');
  const [phone, setPhone] = useState(store.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(store.whatsapp ?? '');
  const [instagram, setInstagram] = useState(store.instagram ?? '');
  const [deliveryTerms, setDeliveryTerms] = useState(store.deliveryTerms ?? '');
  const [warrantyTerms, setWarrantyTerms] = useState(store.warrantyTerms ?? '');
  const [workingHours, setWorkingHours] = useState<WorkingHours>(store.workingHours ?? {});

  /** Boş sətir «sil» (null) deməkdir — istifadəçi yazdığını geri götürə bilməlidir. */
  const textDiff = (next: string, current: string | null): string | null | undefined => {
    const value = next.trim() === '' ? null : next.trim();
    return value === (current ?? null) ? undefined : value;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: UpdateStorePayload = {};

    if (logoUrl !== store.logoUrl) body.logoUrl = logoUrl;
    if (coverUrl !== store.coverUrl) body.coverUrl = coverUrl;

    const d = textDiff(description, store.description);
    if (d !== undefined) body.description = d;
    const p = textDiff(phone, store.phone);
    if (p !== undefined) body.phone = p;
    const w = textDiff(whatsapp, store.whatsapp);
    if (w !== undefined) body.whatsapp = w;
    const i = textDiff(instagram, store.instagram);
    if (i !== undefined) body.instagram = i;
    const dt = textDiff(deliveryTerms, store.deliveryTerms);
    if (dt !== undefined) body.deliveryTerms = dt;
    const wt = textDiff(warrantyTerms, store.warrantyTerms);
    if (wt !== undefined) body.warrantyTerms = wt;

    // Gün obyektlərinin sırası dəyişə bildiyi üçün müqayisə normallaşdırılmış
    // JSON üzərində aparılır (sadə referans müqayisəsi həmişə «dəyişib» deyərdi).
    const nextHours = Object.keys(workingHours).length ? workingHours : null;
    if (JSON.stringify(nextHours) !== JSON.stringify(store.workingHours ?? null)) {
      body.workingHours = nextHours;
    }

    if (Object.keys(body).length === 0) {
      toast.info('Dəyişiklik yoxdur');
      return;
    }

    setSaving(true);
    const res = await StoreApi.update(body);
    setSaving(false);
    if (!res.ok) {
      toast.error(
        res.fail.kind === 'missing'
          ? 'Redaktə servisi hazırlanır — dəyişiklik saxlanmadı'
          : res.fail.message,
      );
      return;
    }
    toast.success('Mağaza məlumatları yeniləndi');
    onSaved(res.value);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="card p-5 space-y-5">
        <h2 className="font-bold text-ink-900 dark:text-white">Görünüş</h2>
        <ImageUploadField
          label="Loqo"
          hint="Kvadrat şəkil ən yaxşı görünür. JPEG, PNG və ya WebP, 8MB-a qədər."
          value={logoUrl}
          onChange={setLogoUrl}
          aspect="square"
          disabled={saving}
        />
        <ImageUploadField
          label="Örtük şəkli"
          hint="Mağaza səhifənizin başlığında geniş formatda göstərilir."
          value={coverUrl}
          onChange={setCoverUrl}
          aspect="cover"
          disabled={saving}
        />
      </section>

      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-ink-900 dark:text-white">Məlumat və əlaqə</h2>

        <label className="block">
          <span className="text-sm font-semibold text-ink-900 dark:text-white">Mağaza adı</span>
          <span className="block text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Ad dəyişmir, çünki vitrin ünvanınız (<span className="font-mono">{store.slug}</span>)
            ondan yaranıb — dəyişsə, paylaşdığınız linklər qırılardı.
          </span>
          <input
            value={store.name}
            readOnly
            disabled
            aria-label="Mağaza adı (dəyişdirilə bilməz)"
            className="input mt-1.5 opacity-70 cursor-not-allowed"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink-900 dark:text-white">Haqqında</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
            aria-label="Mağaza haqqında"
            className="input mt-1.5 resize-y focus-visible:ring-2 focus-visible:ring-tap"
          />
        </label>

        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm font-semibold text-ink-900 dark:text-white">Telefon</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+994501234567"
              inputMode="tel"
              maxLength={20}
              aria-label="Mağaza telefonu"
              className="input mt-1.5 focus-visible:ring-2 focus-visible:ring-tap"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink-900 dark:text-white">WhatsApp</span>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+994501234567"
              inputMode="tel"
              maxLength={20}
              aria-label="WhatsApp nömrəsi"
              className="input mt-1.5 focus-visible:ring-2 focus-visible:ring-tap"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink-900 dark:text-white">Instagram</span>
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="nur_elektronika"
              maxLength={80}
              aria-label="Instagram hesabı"
              className="input mt-1.5 focus-visible:ring-2 focus-visible:ring-tap"
            />
          </label>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-ink-900 dark:text-white mb-1">İş saatları</h2>
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-3">
          Alıcı zəng etməzdən əvvəl açıq olub-olmadığınızı bilsin.
        </p>
        <WorkingHoursEditor value={workingHours} onChange={setWorkingHours} />
      </section>

      <section className="card p-5 grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-semibold text-ink-900 dark:text-white">Çatdırılma şərtləri</span>
          <span className="block text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Hara, nə vaxt və hansı qiymətə çatdırırsınız?
          </span>
          <textarea
            value={deliveryTerms}
            onChange={(e) => setDeliveryTerms(e.target.value)}
            maxLength={2000}
            rows={4}
            aria-label="Çatdırılma şərtləri"
            className="input mt-1.5 resize-y focus-visible:ring-2 focus-visible:ring-tap"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink-900 dark:text-white">Zəmanət şərtləri</span>
          <span className="block text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Zəmanət müddəti, dəyişdirmə və qaytarma qaydası.
          </span>
          <textarea
            value={warrantyTerms}
            onChange={(e) => setWarrantyTerms(e.target.value)}
            maxLength={2000}
            rows={4}
            aria-label="Zəmanət şərtləri"
            className="input mt-1.5 resize-y focus-visible:ring-2 focus-visible:ring-tap"
          />
        </label>
      </section>

      <div className="sticky bottom-3 z-10">
        <button
          type="submit"
          disabled={saving}
          className="btn-tap inline-flex items-center gap-2 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Dəyişiklikləri saxla
        </button>
      </div>
    </form>
  );
}
