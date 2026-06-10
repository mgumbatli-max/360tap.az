'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  ImagePlus, X, ChevronRight, ChevronLeft, Check, Camera, MapPin,
  Tag, DollarSign, Phone, Eye,
} from 'lucide-react';
import AIFraudScore from '@/components/AIFraudScore';
import DraftRestoreBanner from '@/components/DraftRestoreBanner';
import AutoCategorize from '@/components/AutoCategorize';
import AIListingRewrite from '@/components/AIListingRewrite';
import RulesChecker from '@/components/RulesChecker';
import WatermarkInfo from '@/components/WatermarkInfo';
import PricingAssistant from '@/components/PricingAssistant';
import BestTimeToPublish from '@/components/BestTimeToPublish';

const STEPS = [
  { id: 1, label: 'Kateqoriya', icon: Tag },
  { id: 2, label: 'Məlumat', icon: Eye },
  { id: 3, label: 'Şəkillər', icon: Camera },
  { id: 4, label: 'Qiymət', icon: DollarSign },
  { id: 5, label: 'Məkan', icon: MapPin },
  { id: 6, label: 'Əlaqə', icon: Phone },
  { id: 7, label: 'Ön baxış', icon: Check },
];

export default function PostListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', city_id: '',
    price: '', currency: 'AZN', price_type: 'fixed' as const,
    condition: '' as '' | 'new' | 'like_new' | 'used',
    contact_name: '', contact_phone: '',
    has_delivery: false, has_credit: false, has_barter: false,
  });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    api('/categories').then((d: any) => {
      const flat: any[] = [];
      const walk = (arr: any[], lvl = 0) => arr.forEach((c) => {
        flat.push({ ...c, label: '— '.repeat(lvl) + c.name_az });
        if (c.children?.length) walk(c.children, lvl + 1);
      });
      walk(d.categories ?? []);
      setCategories(flat);
    });
    api('/cities').then((d: any) => setCities(d.cities ?? []));
  }, []);

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('files', f));
    const token = localStorage.getItem('avito_token');
    const res = await fetch('/api/upload/images', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const d = await res.json();
    if (res.ok) setUploaded((p) => [...p, ...(d.urls ?? [])].slice(0, 20));
    else setError(d.error || 'Şəkil yüklənmədi');
  };

  const onSubmit = async () => {
    setError(''); setSubmitting(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        category_id: form.category_id,
        city_id: form.city_id || undefined,
        price: form.price ? Number(form.price) : undefined,
        currency: form.currency,
        price_type: form.price_type,
        condition: form.condition || undefined,
        contact_name: form.contact_name || undefined,
        contact_phone: form.contact_phone || undefined,
        media: uploaded,
      };
      const d = await api<{ listing: any }>('/listings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      router.push(`/elanlar/${d.listing.id}`);
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    } finally { setSubmitting(false); }
  };

  if (loading || !user) return <div className="p-12 text-center text-ink-500">Yüklənir...</div>;

  // Validation per step
  const canNext = (() => {
    if (step === 1) return !!form.category_id;
    if (step === 2) return form.title.length >= 5 && form.description.length >= 20;
    if (step === 3) return uploaded.length > 0;
    if (step === 4) return true; // qiymət opsional
    if (step === 5) return true;
    if (step === 6) return !!form.contact_phone;
    return true;
  })();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 mb-2">Yeni elan yerləşdir</h1>
      <p className="text-ink-500 mb-6">Bütün addımları doldurun — bu, daha çox müraciət gətirəcək.</p>

      {/* Yarımçıq elan bərpa */}
      <DraftRestoreBanner onRestore={(f) => setForm({ ...form, ...f })} />

      {/* Stepper */}
      <div className="flex items-center mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center shrink-0">
              <div className={`flex flex-col items-center gap-1.5 min-w-[80px]`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  done ? 'bg-tap text-white' :
                  active ? 'bg-tap text-white ring-4 ring-tap-100' :
                  'bg-ink-100 text-ink-400'
                }`}>
                  {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium ${active ? 'text-tap' : done ? 'text-ink-700' : 'text-ink-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-12 ${done ? 'bg-tap' : 'bg-ink-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-5 sm:p-8">
        {/* STEP 1: Kateqoriya */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-ink-900 mb-1">Kateqoriya seçin</h2>
            <p className="text-sm text-ink-500 mb-5">Doğru kateqoriya — daha çox baxış deməkdir.</p>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="input"
            >
              <option value="">— Kateqoriya seçin —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        )}

        {/* STEP 2: Məlumat */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink-900 mb-1">Elanın əsas məlumatları</h2>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                Başlıq <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="Məs: iPhone 15 Pro Max 256GB Titanium"
                maxLength={120}
              />
              <p className="text-xs text-ink-400 mt-1">{form.title.length} / 120</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                Təsvir <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={6}
                className="input resize-y"
                placeholder="Məhsul barədə ətraflı yazın: vəziyyəti, xüsusiyyətləri, çatdırılma, zəmanət..."
                maxLength={5000}
              />
              <p className="text-xs text-ink-400 mt-1">{form.description.length} / 5000 (min 20)</p>
            </div>
            {form.title.length >= 5 && (
              <>
                <AutoCategorize title={form.title}
                  onSuggest={(slug) => {
                    const cat = categories.find((c) => c.slug === slug);
                    if (cat) setForm({ ...form, category_id: cat.id });
                  }}
                />
                <AIFraudScore payload={{
                  title: form.title,
                  description: form.description,
                  price: Number(form.price) || 0,
                  category: categories.find((c) => c.id === form.category_id)?.slug,
                  media: uploaded,
                }} />
                <AIListingRewrite title={form.title} description={form.description}
                  onApply={(t, d) => setForm({ ...form, title: t, description: d })} />
                <RulesChecker title={form.title} description={form.description} hasPhotos={uploaded.length > 0} />
                {form.price && <PricingAssistant yourPrice={Number(form.price)} />}
                <BestTimeToPublish />
                <WatermarkInfo />
              </>
            )}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Vəziyyət</label>
              <div className="flex flex-wrap gap-2">
                {[
                  ['new', 'Yeni'],
                  ['like_new', 'Az işlənmiş'],
                  ['used', 'İşlənmiş'],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, condition: v as any })}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                      form.condition === v ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Şəkillər */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-ink-900 mb-1">Şəkillər (1-20 ədəd)</h2>
            <p className="text-sm text-ink-500 mb-5">Keyfiyyətli şəkillər — alıcılar üçün ən vacib element.</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {uploaded.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-ink-100 group">
                  <img src={url} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 badge badge-active text-[10px]">Əsas</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setUploaded((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {uploaded.length < 20 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-ink-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-tap hover:bg-tap-50 transition">
                  <ImagePlus className="w-6 h-6 text-ink-400" />
                  <span className="text-xs text-ink-600 text-center px-2">
                    Şəkil yüklə<br />
                    <span className="text-ink-400 text-[10px]">{uploaded.length}/20</span>
                  </span>
                  <input type="file" multiple accept="image/*" className="hidden"
                    onChange={(e) => onUpload(e.target.files)} />
                </label>
              )}
            </div>
            {uploaded.length === 0 && (
              <p className="text-xs text-amber-600 mt-3">⚠ Ən azı 1 şəkil tələb olunur</p>
            )}
          </div>
        )}

        {/* STEP 4: Qiymət */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink-900">Qiymət</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Məbləğ</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="input"
                  min={0}
                  step="0.01"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Valyuta</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="input"
                >
                  <option value="AZN">AZN ₼</option>
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Qiymət növü</label>
              <div className="flex flex-wrap gap-2">
                {[
                  ['fixed', 'Sabit'],
                  ['negotiable', 'Razılaşma yolu ilə'],
                  ['free', 'Pulsuz'],
                  ['exchange', 'Mübadilə'],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, price_type: v as any })}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                      form.price_type === v ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-3 border-t border-ink-200">
              <p className="text-sm font-semibold text-ink-700">Əlavə şərtlər</p>
              {[
                ['has_delivery', 'Çatdırılma var'],
                ['has_credit', 'Kreditə vermək mümkündür'],
                ['has_barter', 'Barter mümkündür'],
              ].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form as any)[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.checked })}
                    className="accent-tap w-4 h-4"
                  />
                  <span className="text-sm">{l}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Məkan */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-ink-900 mb-1">Məkan</h2>
            <p className="text-sm text-ink-500 mb-4">Hansı şəhərdəsiniz?</p>
            <select
              value={form.city_id}
              onChange={(e) => setForm({ ...form, city_id: e.target.value })}
              className="input"
            >
              <option value="">— Şəhər seçin —</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name_az}</option>)}
            </select>
          </div>
        )}

        {/* STEP 6: Əlaqə */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink-900">Əlaqə məlumatları</h2>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Əlaqə şəxsi</label>
              <input
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                className="input"
                placeholder={user.full_name}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                className="input"
                placeholder="+994 XX XXX XX XX"
                type="tel"
              />
              <p className="text-xs text-ink-500 mt-1">Bu nömrə elan səhifəsində göstəriləcək.</p>
            </div>
          </div>
        )}

        {/* STEP 7: Ön baxış */}
        {step === 7 && (
          <div>
            <h2 className="text-xl font-bold text-ink-900 mb-1">Ön baxış</h2>
            <p className="text-sm text-ink-500 mb-5">Bu, sizin elanın görünüşüdür. Hər şey düzgündürsə, dərc edin.</p>
            <div className="border border-ink-200 rounded-xl overflow-hidden">
              {uploaded[0] && (
                <div className="aspect-video bg-ink-100">
                  <img src={uploaded[0]} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <h3 className="text-xl font-extrabold text-ink-900">{form.title || 'Başlıq yoxdur'}</h3>
                <div className="text-2xl font-extrabold mt-2">
                  {form.price ? `${Number(form.price).toLocaleString('az-AZ')} ${form.currency}` : 'Razılaşma yolu ilə'}
                </div>
                <p className="text-sm text-ink-700 whitespace-pre-wrap mt-3">{form.description}</p>
                <div className="flex flex-wrap gap-2 mt-4 text-xs text-ink-500">
                  {cities.find((c) => c.id === form.city_id)?.name_az && (
                    <span>📍 {cities.find((c) => c.id === form.city_id)?.name_az}</span>
                  )}
                  {form.contact_phone && <span>📞 {form.contact_phone}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2 mt-8 pt-5 border-t border-ink-200">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn-secondary flex-1 sm:flex-none justify-center"
            >
              <ChevronLeft className="w-4 h-4" /> Geri
            </button>
          )}
          {step < 7 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="btn-tap flex-1 sm:flex-none justify-center disabled:opacity-50"
            >
              Davam et <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={onSubmit}
              className="btn-tap flex-1 sm:flex-none justify-center disabled:opacity-50"
            >
              {submitting ? 'Dərc olunur...' : 'Dərc et'} <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
