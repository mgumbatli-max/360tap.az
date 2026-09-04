'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Upload, X, Sparkles, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api, uploadWithAuth } from '@/lib/api';

type Cat = { id: string; slug: string; nameAz: string; children?: Cat[] };
type Region = { slug: string; nameAz: string };
type District = { id: string; nameAz: string };
type Img = { url: string; width?: number; height?: number; blurHash?: string };

const CONDITIONS = [
  { v: 'new', n: 'Yeni' },
  { v: 'like_new', n: 'Yeni kimi' },
  { v: 'used', n: 'İşlənmiş' },
  { v: 'for_parts', n: 'Ehtiyat hissələri üçün' },
];

function flattenCats(cats: Cat[], depth = 0, out: { id: string; label: string }[] = []) {
  for (const c of cats) {
    out.push({ id: c.id, label: `${'— '.repeat(depth)}${c.nameAz}` });
    if (c.children?.length) flattenCats(c.children, depth + 1, out);
  }
  return out;
}

/**
 * `/elan-yerlesdir` — ÖZ Suspense SƏRHƏDİ.
 *
 * Bu səhifə `useSearchParams()` istifadə edir (`?edit=<id>`), yəni prerender zamanı
 * mütləq bir Suspense sərhədi tələb edir. ƏVVƏL həmin sərhədi root `app/loading.tsx`
 * verirdi — amma o sərhəd BÜTÜN app ağacının üzərində idi və `/elanlar/[id]`-in
 * HTTP 404-nü, `/k/[category]`-nin 307-sini sıradan çıxarırdı.
 *
 * İNDİ sərhəd yalnız buradadır: `useSearchParams` tələbi ödənir, digər route-ların
 * status kodlarına isə heç bir təsiri yoxdur.
 */
export default function ElanYerlesdirPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ElanYerlesdirForm />
    </Suspense>
  );
}

function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-tap" />
    </div>
  );
}

function ElanYerlesdirForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { user, loading } = useAuth();

  const [cats, setCats] = useState<{ id: string; label: string }[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [regionSlug, setRegionSlug] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [condition, setCondition] = useState('');
  const [photos, setPhotos] = useState<Img[]>([]);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/categories')
      .then((d: any) => setCats(flattenCats(d.data || d.categories || [])))
      .catch(() => {});
    api('/geo/regions')
      .then((d: any) => setRegions((d.data || []).map((r: any) => ({ slug: r.slug, nameAz: r.nameAz }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!regionSlug) {
      setDistricts([]);
      setDistrictId('');
      return;
    }
    api(`/geo/regions/${regionSlug}/districts`)
      .then((d: any) => {
        const list = (d.data || []).map((x: any) => ({ id: x.id, nameAz: x.nameAz }));
        setDistricts(list);
        setDistrictId(list[0]?.id ?? '');
      })
      .catch(() => setDistricts([]));
  }, [regionSlug]);

  // Redaktə rejimi — mövcud elanı yüklə və formanı doldur
  useEffect(() => {
    if (!editId) return;
    api<{ data?: Record<string, any> }>(`/listings/${editId}`)
      .then((d) => {
        const l = d.data ?? (d as Record<string, any>);
        if (!l?.id) return;
        setTitle(l.title ?? '');
        setDescription(l.description ?? '');
        setPrice(l.price != null ? String(l.price) : '');
        setNegotiable(l.priceType === 'negotiable');
        setCondition(l.condition ?? '');
        setCategoryId(l.categoryId ?? '');
        if (l.districtId) setDistrictId(l.districtId);
        if (Array.isArray(l.images)) setPhotos(l.images);
      })
      .catch(() => {});
  }, [editId]);

  const onPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files).slice(0, 8 - photos.length)) {
        const fd = new FormData();
        fd.append('file', file);
        // `uploadWithAuth` — xam `fetch` + localStorage əvəzinə: o forma 401→refresh
        // qatını bypass edirdi, yəni 15 dəqiqədən sonra şəkil yükləmə səssizcə sınırdı.
        const d = await uploadWithAuth<{ data: Img }>('/media/upload', fd);
        setPhotos((p) => [...p, d.data]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Şəkil yüklənmədi');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setError('');
    if (title.trim().length < 3) return setError('Başlıq ən azı 3 simvol olmalıdır');
    if (description.trim().length < 10) return setError('Təsvir ən azı 10 simvol olmalıdır');
    if (!categoryId) return setError('Kateqoriya seçin');
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        districtId: districtId || undefined,
        price: price ? Number(price) : undefined,
        priceType: negotiable ? 'negotiable' : 'fixed',
        condition: condition || undefined,
      };
      // Yeni elanda şəkil göndərilir; redaktədə mətn/qiymət dəyişir
      if (!editId && photos.length) {
        payload.images = photos.map((p) => ({ url: p.url, width: p.width, height: p.height, blurHash: p.blurHash }));
      }
      const r = await api<{ data?: { id: string } }>(editId ? `/listings/${editId}` : '/listings', {
        method: editId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      const id = r.data?.id ?? editId;
      if (id) router.push(`/elanlar/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Elan yaradıla bilmədi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-tap" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white mb-2">Elan yerləşdir</h1>
          <p className="text-ink-500 mb-6">
            Elan yerləşdirmək üçün yuxarıdan <b>&quot;Daxil ol&quot;</b> düyməsi ilə hesabınıza daxil olun.
          </p>
          <Link href="/" className="btn-secondary inline-flex">
            Ana səhifə
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 dark:text-white">
            {editId ? 'Elanı redaktə et' : 'Elan yerləşdir'}
          </h1>
          {!editId && (
            <Link href="/ai-elan" className="text-sm text-tap font-semibold inline-flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> AI ilə yarat
            </Link>
          )}
        </div>
        <p className="text-ink-500 mb-6">
          {editId ? 'Dəyişiklikləri edin və yadda saxlayın.' : 'Bir neçə sahə doldur — elan dərhal dərc olunur.'}
        </p>

        <div className="card p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-800 dark:text-ink-200 mb-2">Şəkillər (max 8)</label>
            <div className="grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotos((ph) => ph.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < 8 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-ink-300 dark:border-ink-700 flex flex-col items-center justify-center cursor-pointer hover:border-tap text-ink-400">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => onPhotos(e.target.files)} />
                </label>
              )}
            </div>
          </div>

          <Field label="Başlıq">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Məs: iPhone 14 Pro 256GB" className="inp" maxLength={120} />
          </Field>

          <Field label="Kateqoriya">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="inp">
              <option value="">Seçin…</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Region">
              <select value={regionSlug} onChange={(e) => setRegionSlug(e.target.value)} className="inp">
                <option value="">Seçin…</option>
                {regions.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.nameAz}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Rayon">
              <select value={districtId} onChange={(e) => setDistrictId(e.target.value)} className="inp" disabled={!districts.length}>
                <option value="">{districts.length ? 'Seçin…' : '—'}</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameAz}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Qiymət (AZN)">
              <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" inputMode="decimal" className="inp" />
            </Field>
            <Field label="Vəziyyət">
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="inp">
                <option value="">—</option>
                {CONDITIONS.map((c) => (
                  <option key={c.v} value={c.v}>
                    {c.n}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
            <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} />
            Razılaşma yolu ilə
          </label>

          <Field label="Təsvir">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Məhsul haqqında ətraflı yazın…" className="inp resize-none" maxLength={5000} />
          </Field>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button onClick={submit} disabled={submitting} className="btn-tap w-full justify-center disabled:opacity-50">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {editId ? 'Saxlanılır…' : 'Dərc olunur…'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> {editId ? 'Yadda saxla' : 'Elanı dərc et'}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`.inp{width:100%;background:rgb(248 250 252);border:1px solid rgb(226 232 240);border-radius:0.625rem;padding:0.625rem 0.75rem;font-size:0.875rem;outline:none;color:inherit}.inp:focus{border-color:#10b981}.dark .inp{background:#1e293b;border-color:#334155}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-800 dark:text-ink-200 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
