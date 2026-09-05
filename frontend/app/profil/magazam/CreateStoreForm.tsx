'use client';
import { useState } from 'react';
import { Loader2, Store, Check } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { StoreApi, type MyStore } from './storeApi';

const BENEFITS = [
  'Bütün elanlarınız üçün ayrıca vitrin səhifəsi — linki müştəriyə göndərin',
  'Anbar proqramınızla (ERP) avtomatik sinxronizasiya — qiymət və stok özü yenilənir',
  'Filiallar, iş saatları, çatdırılma və zəmanət şərtləri bir yerdə',
  'Admin təsdiqindən sonra mağaza nişanı — alıcı üçün etibar siqnalı',
];

/**
 * Mağaza yaratma forması.
 *
 * NİYƏ QİYMƏT YOXDUR: monetizasiya bayraqları söndürülüb və başlanğıc siyasəti
 * heç bir yerdə qiymət göstərməyi qadağan edir. Mağaza açmaq hazırda pulsuzdur —
 * `store.free_registration` bayrağı açıq olduğu müddətdə forma heç nə soruşmur.
 */
export default function CreateStoreForm({ onCreated }: { onCreated: (s: MyStore) => void }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    whatsapp: '',
    instagram: '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (name.length < 2) {
      toast.error('Mağaza adı ən azı 2 simvol olmalıdır');
      return;
    }
    setSaving(true);
    const res = await StoreApi.create({
      name,
      // Boş sahələr göndərilmir: backend `undefined`-i «toxunma» kimi anlayır,
      // boş sətir isə validasiyadan keçib bazada mənasız dəyər qoyardı.
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.whatsapp.trim() ? { whatsapp: form.whatsapp.trim() } : {}),
      ...(form.instagram.trim() ? { instagram: form.instagram.trim() } : {}),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(
        res.fail.kind === 'missing'
          ? 'Mağaza yaratma servisi hazırlanır — bir azdan yenidən cəhd edin'
          : res.fail.message,
      );
      return;
    }
    toast.success('Mağazanız yaradıldı');
    onCreated(res.value);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
      <form onSubmit={submit} className="card p-5 space-y-4">
        <div>
          <h2 className="font-bold text-lg text-ink-900 dark:text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-tap" />
            Mağaza aç
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Bir dəqiqəlik məlumat kifayətdir — qalanını sonra tamamlaya bilərsiniz.
          </p>
        </div>

        <Field label="Mağaza adı" required hint="Vitrin ünvanınız bu addan yaranır və sonradan dəyişmir.">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
            maxLength={160}
            placeholder="Məsələn: Nur Elektronika"
            aria-label="Mağaza adı"
            className="input focus-visible:ring-2 focus-visible:ring-tap"
          />
        </Field>

        <Field label="Haqqında" hint="Nə satırsınız, nə ilə fərqlənirsiniz?">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={2000}
            rows={4}
            aria-label="Mağaza haqqında"
            className="input resize-y focus-visible:ring-2 focus-visible:ring-tap"
          />
        </Field>

        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Telefon">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+994501234567"
              inputMode="tel"
              maxLength={20}
              aria-label="Mağaza telefonu"
              className="input focus-visible:ring-2 focus-visible:ring-tap"
            />
          </Field>
          <Field label="WhatsApp">
            <input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="+994501234567"
              inputMode="tel"
              maxLength={20}
              aria-label="WhatsApp nömrəsi"
              className="input focus-visible:ring-2 focus-visible:ring-tap"
            />
          </Field>
          <Field label="Instagram">
            <input
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="nur_elektronika"
              maxLength={80}
              aria-label="Instagram hesabı"
              className="input focus-visible:ring-2 focus-visible:ring-tap"
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-tap inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
          Mağazanı yarat
        </button>
      </form>

      <aside className="card p-5">
        <h3 className="font-bold text-ink-900 dark:text-white">Mağaza hesabı nə verir?</h3>
        <ul className="mt-3 space-y-2.5">
          {BENEFITS.map((b) => (
            <li key={b} className="flex gap-2 text-sm text-ink-600 dark:text-ink-300">
              <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-4">
          Mağaza açmaq hazırda pulsuzdur və elan limiti tətbiq olunmur.
        </p>
      </aside>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink-900 dark:text-white">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {hint && <span className="block text-xs text-ink-500 dark:text-ink-400 mt-0.5">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
