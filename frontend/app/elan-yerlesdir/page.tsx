'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Upload, X, Sparkles, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api, uploadWithAuth } from '@/lib/api';
import CategoryPicker, { type CatNode } from '@/components/CategoryPicker';
import ListingAttributes, {
  ToggleRow,
  buildAttributePayload,
  missingRequiredAttributes,
  attributesToValues,
  type AttrDef,
} from '@/components/ListingAttributes';

type Region = { slug: string; nameAz: string };
type District = { id: string; nameAz: string };
type Img = { url: string; width?: number; height?: number; blurHash?: string };

const CONDITIONS = [
  { v: 'new', n: 'Yeni' },
  { v: 'like_new', n: 'Yeni kimi' },
  { v: 'used', n: 'İşlənmiş' },
  { v: 'for_parts', n: 'Ehtiyat hissələri üçün' },
];

/** Sxemdəki `PriceType` enum-u ilə birə-bir (fixed|negotiable|free|exchange|contract). */
const PRICE_TYPES = [
  { v: 'fixed', n: 'Sabit qiymət' },
  { v: 'negotiable', n: 'Razılaşma yolu ilə' },
  { v: 'free', n: 'Pulsuz' },
  { v: 'exchange', n: 'Barter / dəyişdirmə' },
  { v: 'contract', n: 'Müqavilə ilə' },
];

const CURRENCIES = ['AZN', 'USD', 'EUR'];

/**
 * «Pulsuz» və «Müqavilə ilə» seçimlərində məbləğ mənasızdır — sahə söndürülür və
 * göndərişdə qiymət ümumiyyətlə yollanmır. Əks halda «Pulsuz, 500 AZN» kimi
 * ziddiyyətli elan yaranırdı.
 */
const PRICELESS_TYPES = new Set(['free', 'contract']);

// Qeyd: əvvəl burada `flattenCats()` vardı — ağacı düz siyahıya çevirib
// 100-dən çox elementi tək <select>-ə yığırdı və istifadəçi kateqoriyanı tapa
// bilmirdi. İndi ağac OLDUĞU KİMİ saxlanılır və `CategoryPicker` onu səviyyə-səviyyə
// göstərir + axtarış verir.

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

  const [cats, setCats] = useState<CatNode[]>([]);
  // Dinamik atributlar slug ilə yüklənir (`/categories/<slug>/attributes`), id ilə yox.
  const [categorySlug, setCategorySlug] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [regionSlug, setRegionSlug] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [currency, setCurrency] = useState('AZN');
  const [priceType, setPriceType] = useState('fixed');
  const [condition, setCondition] = useState('');

  // Kateqoriyaya bağlı dinamik xüsusiyyətlər
  const [attrDefs, setAttrDefs] = useState<AttrDef[]>([]);
  const [attrValues, setAttrValues] = useState<Record<string, string | boolean>>({});
  const [attrLoading, setAttrLoading] = useState(false);
  const [invalidAttrKeys, setInvalidAttrKeys] = useState<string[]>([]);

  // Əlavə imkanlar — əvvəl forma bunları HEÇ SORUŞMURDU, amma elan səhifəsi
  // «Çatdırılma: Yox» yazırdı, yəni verilməyən sual haqqında hökm verilirdi.
  const [hasDelivery, setHasDelivery] = useState(false);
  const [hasCredit, setHasCredit] = useState(false);
  const [hasBarter, setHasBarter] = useState(false);
  const [hasWarranty, setHasWarranty] = useState(false);
  const [inStock, setInStock] = useState(false);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState(false);

  const [photos, setPhotos] = useState<Img[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/categories')
      .then((d: any) => setCats(d.data || d.categories || []))
      .catch(() => {});
    api('/geo/regions')
      .then((d: any) => setRegions((d.data || []).map((r: any) => ({ slug: r.slug, nameAz: r.nameAz }))))
      .catch(() => {});
  }, []);

  /**
   * Kateqoriya dəyişəndə xüsusiyyət sxemi yenidən yüklənir.
   * `setAttrValues({})` MÜTLƏQDİR: əks halda telefonun «yaddaş» dəyəri avtomobil
   * elanına yapışıb qalır və backend onu (tanınmayan açar kimi) səssizcə atır —
   * istifadəçi isə doldurduğunu itirdiyini görmür.
   */
  useEffect(() => {
    setInvalidAttrKeys([]);
    if (!categorySlug) {
      setAttrDefs([]);
      setAttrValues({});
      return;
    }
    let cancelled = false;
    setAttrLoading(true);
    api(`/categories/${encodeURIComponent(categorySlug)}/attributes`)
      .then((d: any) => {
        if (cancelled) return;
        setAttrDefs((d.data || []) as AttrDef[]);
      })
      .catch(() => {
        if (!cancelled) setAttrDefs([]);
      })
      .finally(() => {
        if (!cancelled) setAttrLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

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
        setOldPrice(l.oldPrice != null ? String(l.oldPrice) : '');
        setCurrency(l.currency ?? 'AZN');
        setPriceType(l.priceType ?? 'fixed');
        setCondition(l.condition ?? '');
        setCategoryId(l.categoryId ?? '');
        // Sxemin yüklənməsi üçün slug lazımdır — cavabda gəlir.
        if (l.categorySlug) setCategorySlug(l.categorySlug);
        setAddress(l.address ?? '');
        setHasDelivery(!!l.hasDelivery);
        setHasCredit(!!l.hasCredit);
        setHasBarter(!!l.hasBarter);
        setHasWarranty(!!l.hasWarranty);
        setInStock(!!l.inStock);
        setContactName(l.contactName ?? '');
        setContactPhone(l.contactPhone ?? '');
        setContactWhatsapp(!!l.contactWhatsapp);
        // Atribut dəyərləri sxem yüklənməzdən əvvəl də qoyula bilər — `ListingAttributes`
        // yalnız sxemdəki açarları göstərir, artıq dəyərlər sadəcə istifadə olunmur.
        setAttrValues(attributesToValues(l.attributes));
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

  const priceless = PRICELESS_TYPES.has(priceType);

  const submit = async () => {
    setError('');
    if (title.trim().length < 3) return setError('Başlıq ən azı 3 simvol olmalıdır');
    if (description.trim().length < 10) return setError('Təsvir ən azı 10 simvol olmalıdır');
    if (!categoryId) return setError('Kateqoriya seçin');

    // Məcburi xüsusiyyətlər — backend də yoxlayır, amma orada xəta sahəyə bağlanmır
    // və istifadəçi hansı sahənin qaldığını görmür.
    const missing = missingRequiredAttributes(attrDefs, attrValues);
    if (missing.length) {
      setInvalidAttrKeys(missing);
      const labels = attrDefs.filter((a) => missing.includes(a.key)).map((a) => a.labelAz);
      return setError(`Məcburi xüsusiyyət${labels.length > 1 ? 'lər' : ''} doldurulmayıb: ${labels.join(', ')}`);
    }
    setInvalidAttrKeys([]);

    setSubmitting(true);
    try {
      const attributes = buildAttributePayload(attrDefs, attrValues);
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        districtId: districtId || undefined,
        address: address.trim() || undefined,
        price: !priceless && price ? Number(price) : undefined,
        oldPrice: !priceless && oldPrice ? Number(oldPrice) : undefined,
        currency,
        priceType,
        condition: condition || undefined,
        hasDelivery,
        hasCredit,
        hasBarter,
        hasWarranty,
        inStock,
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactWhatsapp,
      };
      // Boş obyekt göndərmək mənasızdır — backend onu onsuz da atır.
      if (Object.keys(attributes).length) payload.attributes = attributes;
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
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white md:text-3xl">
            {editId ? 'Elanı redaktə et' : 'Elan yerləşdir'}
          </h1>
          {!editId && (
            <Link href="/ai-elan" className="inline-flex items-center gap-1 text-sm font-semibold text-tap">
              <Sparkles className="h-4 w-4" /> AI ilə yarat
            </Link>
          )}
        </div>
        <p className="mb-6 text-ink-500">
          {editId
            ? 'Dəyişiklikləri edin və yadda saxlayın.'
            : 'Nə qədər çox məlumat versəniz, elan bir o qədər tez satılır.'}
        </p>

        <div className="space-y-4">
          {/* ——— 1. Kateqoriya — ƏN ƏVVƏL, çünki xüsusiyyət sahələri ondan asılıdır ——— */}
          <Section title="Kateqoriya" hint="Xüsusiyyət sahələri seçdiyiniz kateqoriyaya görə dəyişir.">
            <CategoryPicker
              categories={cats}
              value={categoryId}
              onChange={(id, node) => {
                setCategoryId(id);
                setCategorySlug(node.slug);
              }}
            />
          </Section>

          {/* ——— 2. Əsas məlumat ——— */}
          <Section title="Əsas məlumat">
            <Field label="Başlıq" htmlFor="f-title">
              <input
                id="f-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Məs: iPhone 14 Pro 256GB"
                className="inp"
                maxLength={120}
              />
            </Field>
            <Field label="Təsvir" htmlFor="f-desc">
              <textarea
                id="f-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Vəziyyəti, komplektasiyası, çatışmazlıqları — alıcı nə bilməlidirsə yazın."
                className="inp resize-none"
                maxLength={5000}
              />
            </Field>
          </Section>

          {/* ——— 3. Xüsusiyyətlər — kateqoriyaya görə dinamik ——— */}
          <Section
            title="Xüsusiyyətlər"
            hint="Bu sahələr axtarış filtrlərində istifadə olunur — doldurulmuş elan daha çox görünür."
          >
            <ListingAttributes
              attributes={attrDefs}
              values={attrValues}
              onChange={(key, value) => setAttrValues((v) => ({ ...v, [key]: value }))}
              invalidKeys={invalidAttrKeys}
              loading={attrLoading}
              hasCategory={!!categorySlug}
            />
          </Section>

          {/* ——— 4. Qiymət ——— */}
          <Section title="Qiymət">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Qiymət növü" htmlFor="f-ptype">
                <select id="f-ptype" value={priceType} onChange={(e) => setPriceType(e.target.value)} className="inp">
                  {PRICE_TYPES.map((p) => (
                    <option key={p.v} value={p.v}>
                      {p.n}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Vəziyyət" htmlFor="f-cond">
                <select id="f-cond" value={condition} onChange={(e) => setCondition(e.target.value)} className="inp">
                  <option value="">Seçilməyib</option>
                  {CONDITIONS.map((c) => (
                    <option key={c.v} value={c.v}>
                      {c.n}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {!priceless && (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Məbləğ" htmlFor="f-price">
                  <input
                    id="f-price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0"
                    inputMode="decimal"
                    className="inp"
                  />
                </Field>
                <Field label="Valyuta" htmlFor="f-curr">
                  <select id="f-curr" value={currency} onChange={(e) => setCurrency(e.target.value)} className="inp">
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Köhnə qiymət" htmlFor="f-oldprice" hint="Endirim göstərmək üçün">
                  <input
                    id="f-oldprice"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="—"
                    inputMode="decimal"
                    className="inp"
                  />
                </Field>
              </div>
            )}
          </Section>

          {/* ——— 5. Əlavə imkanlar — istifadəçinin şikayət etdiyi əsas boşluq ——— */}
          <Section title="Əlavə imkanlar" hint="Yalnız seçdikləriniz elan səhifəsində göstərilir.">
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleRow id="t-delivery" label="Çatdırılma var" checked={hasDelivery} onChange={setHasDelivery} />
              <ToggleRow id="t-credit" label="Kreditlə satış" checked={hasCredit} onChange={setHasCredit} />
              <ToggleRow id="t-barter" label="Barter mümkündür" checked={hasBarter} onChange={setHasBarter} />
              <ToggleRow id="t-warranty" label="Zəmanət var" checked={hasWarranty} onChange={setHasWarranty} />
              <ToggleRow id="t-stock" label="Anbarda mövcuddur" checked={inStock} onChange={setInStock} />
            </div>
          </Section>

          {/* ——— 6. Şəkillər ——— */}
          <Section title="Şəkillər" hint="Maksimum 8 şəkil. Birinci şəkil elanın üz qabığı olur.">
            <div className="grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((ph) => ph.filter((_, j) => j !== i))}
                    aria-label={`${i + 1}-ci şəkli sil`}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < 8 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-300 text-ink-400 hover:border-tap dark:border-ink-700">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  <span className="sr-only">Şəkil yüklə</span>
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => onPhotos(e.target.files)} />
                </label>
              )}
            </div>
          </Section>

          {/* ——— 7. Yerləşmə ——— */}
          <Section title="Yerləşmə">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Region" htmlFor="f-region">
                <select id="f-region" value={regionSlug} onChange={(e) => setRegionSlug(e.target.value)} className="inp">
                  <option value="">Seçin…</option>
                  {regions.map((r) => (
                    <option key={r.slug} value={r.slug}>
                      {r.nameAz}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Rayon" htmlFor="f-district">
                <select
                  id="f-district"
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  className="inp"
                  disabled={!districts.length}
                >
                  <option value="">{districts.length ? 'Seçin…' : '—'}</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameAz}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Ünvan" htmlFor="f-address" hint="Opsional — məs. metro, küçə">
              <input
                id="f-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Məs: Nizami metrosu yaxınlığı"
                className="inp"
                maxLength={200}
              />
            </Field>
          </Section>

          {/* ——— 8. Əlaqə ——— */}
          <Section title="Əlaqə" hint="Boş buraxsanız profilinizdəki məlumat istifadə olunur.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ad" htmlFor="f-cname">
                <input
                  id="f-cname"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Adınız"
                  className="inp"
                  maxLength={120}
                />
              </Field>
              <Field label="Telefon" htmlFor="f-cphone">
                <input
                  id="f-cphone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+994 50 123 45 67"
                  inputMode="tel"
                  className="inp"
                  maxLength={20}
                />
              </Field>
            </div>
            <ToggleRow
              id="t-whatsapp"
              label="WhatsApp-da da yazsınlar"
              checked={contactWhatsapp}
              onChange={setContactWhatsapp}
            />
          </Section>

          {error && (
            <p role="alert" className="rounded-xl bg-danger-light px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="btn-tap w-full justify-center disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {editId ? 'Saxlanılır…' : 'Dərc olunur…'}
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> {editId ? 'Yadda saxla' : 'Elanı dərc et'}
              </>
            )}
          </button>
        </div>
      </div>

      {/*
        `.inp` fokus rəngi ƏVVƏL sabit `#10b981` (yaşıl) idi — brend rəngi runtime-da
        dəyişdiyi üçün (CSS dəyişənləri) o, temadan qopurdu. İndi `var(--tap)`-dır.
      */}
      <style>{`.inp{width:100%;background:rgb(248 250 252);border:1px solid rgb(226 232 240);border-radius:0.625rem;padding:0.625rem 0.75rem;font-size:0.875rem;outline:none;color:inherit}.inp:focus{border-color:var(--tap)}.dark .inp{background:#1e293b;border-color:#334155}`}</style>
    </div>
  );
}

/** Forma bölməsi — uzun formanı oxunaqlı hissələrə ayırır (§UX: 9 bölmə). */
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-3 p-5">
      <div>
        <h2 className="text-base font-bold text-ink-900 dark:text-white">{title}</h2>
        {hint && <p className="mt-0.5 text-[13px] text-ink-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink-800 dark:text-ink-200">
        {label}
        {hint && <span className="ml-1.5 font-normal text-ink-400">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
