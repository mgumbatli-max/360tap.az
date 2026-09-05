import { cache, Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronDown, MapPin } from 'lucide-react';
import Breadcrumb, { type Crumb } from '@/components/Breadcrumb';
import { DemoNotice } from '@/components/DemoBadge';
import Gallery from '@/components/Gallery';
import ListingCard, { type Listing } from '@/components/ListingCard';
import MessageSeller, { ListingActions } from '@/components/MessageSeller';
import SellerReviews from '@/components/SellerReviews';
import ReportButton from '@/components/ReportButton';
import FollowButton from '@/components/FollowButton';
import TrackRecentView from './TrackRecentView';
import { serverGet } from '@/lib/server-fetch';
import { SITE, buildMetadata, jsonLdScript } from '@/lib/seo';
import { azDateLong, azNumber } from '@/lib/format';

function mapSimilar(l: any): Listing {
  return {
    id: l.id, title: l.title, slug: l.slug, price: l.price ?? null,
    currency: l.currency ?? 'AZN', price_type: l.priceType ?? 'fixed',
    is_vip: l.isVip, is_demo: l.isDemo, is_premium: l.isPremium, has_delivery: l.hasDelivery,
    created_at: l.createdAt, city_name: l.regionName ?? undefined, district: l.districtName ?? undefined,
    media: (l.images ?? []).map((i: any) => ({ url: i.url, sort_order: i.sortOrder ?? 0 })),
  };
}

// Faza 0: timeout-lu — "oxşar elanlar" bloku backend asılı qalanda bütün
// detal səhifəsini gözlədə bilməz (ikinci dərəcəli məzmundur).
async function getSimilar(id: string): Promise<Listing[]> {
  const r = await serverGet<any[]>(`/listings/${id}/similar`, {
    next: { revalidate: 60 },
    timeoutMs: 3_000,
  });
  return (r.data ?? []).map(mapSimilar);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { listing: l } = await getListing(id);
  if (!l) return { title: 'Elan tapılmadı — 360tap.az' };
  const price = l.price != null ? `${azNumber(l.price)} ${l.currency}` : 'Razılaşma';
  const loc = [l.districtName, l.regionName].filter(Boolean).join(', ');
  const desc = (l.description ?? '').slice(0, 160).replace(/\s+/g, ' ');
  const cover = l.images?.[0]?.url;

  // SEO — SELF-REFERENCING CANONICAL.
  // Əvvəl canonical yalnız root layout-da (mütləq `SITE.url`) təyin olunurdu və miras
  // yolu ilə bura da düşürdü: hər elan özünü ana səhifənin dublikatı elan edirdi.
  // Canonical URL-i `buildMetadata()` `path`-dan qurur (`SITE.url + path`), ona görə
  // burada URL birləşdirmə məntiqi TƏKRARLANMIR — layihədə digər route-lar da (məs.
  // `app/elanlar/page.tsx`) eyni köməkçidən istifadə edir.
  // Başlıqda ' | 360tap.az' suffiksi ƏL İLƏ YAZILMAMALIDIR: root layout-da
  // `title.template = '%s | 360tap.az'` var və Next onu string başlığa tətbiq edir,
  // nəticədə suffiks İKİ dəfə düşürdü ('... | 360tap.az | 360tap.az').
  const base = buildMetadata({
    title: `${l.title} — ${price}${loc ? ' · ' + loc : ''}`,
    description: desc,
    path: `/elanlar/${id}`,
    ...(cover ? { image: cover } : {}),
    type: 'product',
  });

  return {
    ...base,
    // og bloku əvvəlki davranışı saxlayır: sosial kartda başlıq qiymət/şəhər suffiksi
    // olmadan daha oxunaqlıdır, ona görə köməkçinin uzun başlığı burada üzərinə yazılır.
    openGraph: { ...base.openGraph, title: l.title },
  };
}

type Detail = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  oldPrice: number | null;
  currency: string;
  priceType: string;
  condition?: string | null;
  attributes?: Record<string, unknown>;
  hasDelivery?: boolean;
  hasWarranty?: boolean;
  hasCredit?: boolean;
  hasBarter?: boolean;
  inStock?: boolean;
  stockQty?: number | null;
  source?: string;
  isVip?: boolean;
  isDemo?: boolean;
  isPremium?: boolean;
  views?: number;
  contactName?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: boolean;
  address?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  regionName?: string | null;
  regionSlug?: string | null;
  districtName?: string | null;
  storeId?: string | null;
  ownerId: string;
  createdAt: string;
  images?: { url: string }[];
};

/**
 * Faza 0: timeout-lu. `unavailable` ayrıca qaytarılır ki, səhifə
 * "elan tapılmadı" (404) ilə "backend əlçatmaz" (503) hallarını ayırd etsin —
 * əks halda backend düşəndə bütün mövcud elanlar 404 kimi göstərilirdi.
 *
 * `cache()` — REACT REQUEST-SCOPE DEDUP.
 * Bu funksiya HƏR render-də İKİ dəfə çağırılır: `generateMetadata()` və səhifə
 * komponenti. `cache: 'no-store'` olduğu üçün Next-in öz fetch dedup-u tətbiq
 * olunmurdu, yəni backend-ə iki sorğu gedirdi — və `GET /listings/:id` OXUMA
 * yolunda `views: { increment: 1 }` etdiyi üçün hər səhifə açılışı baxış
 * sayğacını 2 artırırdı (ölçüldü: 0 → 1 açılış → 2).
 * `cache()` eyni request daxilində eyni promise-i paylaşır: cavab dəyişmir,
 * `no-store` semantikası da qalır (növbəti sorğu yenidən çəkir).
 * Sayğacı GET-dən çıxarıb `POST /listings/:id/view` etmək daha düzgün həlldir,
 * amma o, backend + statistika səhifələrinə toxunur — ayrıca iş kimi qalır.
 */
const getListing = cache(
  async (id: string): Promise<{ listing: Detail | null; unavailable: boolean }> => {
    const r = await serverGet<Detail>(`/listings/${id}`, { cache: 'no-store' });
    return { listing: r.data, unavailable: r.unavailable };
  },
);

const CONDITION_LABEL: Record<string, string> = {
  new: 'Yeni',
  like_new: 'Səliqəli / az işlənmiş',
  used: 'İşlənmiş',
  for_parts: 'Ehtiyat hissə üçün',
};

// `priceType` bazada enum-dur, amma cavabda sətir kimi gəlir. `fixed` qəsdən
// siyahıda yoxdur: sabit qiymət üçün ayrıca sətir məlumat vermir.
const PRICE_TYPE_LABEL: Record<string, string> = {
  negotiable: 'Razılaşma yolu ilə',
  free: 'Pulsuz',
  exchange: 'Dəyişdirmə (barter)',
  contract: 'Müqavilə ilə',
};

// Backend `attributes` sahəsini sərbəst açar/dəyər kimi saxlayır; tanınan açarlar
// azərbaycanca göstərilir, tanınmayanlar isə itirilmir — açar adı gözəlləşdirilir.
// Adlar `category_attributes.label_az` ilə uzlaşdırılıb ki, forma ilə detal
// səhifəsi eyni sahəni eyni cür adlandırsın.
const ATTR_LABEL: Record<string, string> = {
  // universal
  condition: 'Vəziyyət', type: 'Növ', brand: 'Marka', model: 'Model',
  color: 'Rəng', size: 'Ölçü', material: 'Material', group: 'Qrup',
  age: 'Yaş', gender: 'Cins', language: 'Dil', season: 'Mövsüm',
  purpose: 'Təyinat', deal_type: 'Əməliyyat', barter: 'Barter', credit: 'Kredit',
  // nəqliyyat
  year: 'Buraxılış ili', mileage: 'Yürüş', fuel: 'Yanacaq növü',
  transmission: 'Sürətlər qutusu', body: 'Ban növü', drive: 'Ötürücü',
  engine: 'Mühərrik', engine_volume: 'Mühərrik həcmi', power: 'Güc',
  part_type: 'Hissə növü', radius: 'Radius', number_type: 'Nömrə növü',
  no_accident: 'Vuruğu yoxdur', not_painted: 'Rənglənməyib',
  // əmlak
  rooms: 'Otaq sayı', area: 'Sahə', floor: 'Mərtəbə', floors: 'Mərtəbə sayı',
  total_floors: 'Binanın mərtəbə sayı', building_type: 'Bina növü',
  property_type: 'Əmlak növü', object_type: 'Obyekt növü', repair: 'Təmir',
  has_extract: 'Çıxarış', has_mortgage: 'İpoteka',
  // elektronika — `storage` bazada da «Yaddaş» adlanır, amma `memory` ilə eyni
  // ad iki sətirdən birinin (təkrar ad kimi) itməsinə səbəb olardı.
  memory: 'Yaddaş', storage: 'Daxili yaddaş', ram: 'RAM',
  screen: 'Ekran ölçüsü', platform: 'Platforma', operator: 'Operator',
  // iş elanları
  salary: 'Maaş', salary_min: 'Maaş (min)', salary_max: 'Maaş (maks)',
  experience: 'Təcrübə', schedule: 'İş qrafiki',
  // heyvanlar
  pedigree: 'Pasportlu / şəcərəli', vaccinated: 'Peyvəndli',
};

// Vahid yalnız kateqoriyadan ASILI OLMAYAN açarlar üçün sabitdir. `area` bazada
// həm `m²`, həm `sot` ilə gəlir (kateqoriyaya görə), `year` isə vahid tələb
// etmir — onları buraya salmaq yanlış vahid göstərmək demək olardı.
const ATTR_UNIT: Record<string, string> = {
  mileage: 'km', engine_volume: 'L', salary_min: 'AZN', salary_max: 'AZN',
};

function attrLabel(key: string): string {
  if (ATTR_LABEL[key]) return ATTR_LABEL[key];
  const clean = key.replace(/[_-]+/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function attrValue(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (typeof v === 'boolean') return v ? 'Var' : 'Yox';
  if (typeof v === 'number') return azNumber(v);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    const joined = v.filter((x) => x != null && x !== '').join(', ');
    return joined || null;
  }
  return null; // iç-içə obyektlər cədvəldə oxunaqlı deyil — göstərilmir
}

// Vahid yalnız ƏDƏDƏ əlavə olunur: baza `year: "not-a-number"` kimi zibil də
// saxlaya bilir və belə dəyərə vahid yapışdırmaq mənasız cümlə yaradardı.
function attrText(key: string, raw: unknown): string | null {
  const v = attrValue(raw);
  if (v == null) return null;
  const unit = ATTR_UNIT[key];
  return unit && typeof raw === 'number' ? `${v} ${unit}` : v;
}


/**
 * SEO — BU ROUTE-UN ÜZƏRİNDƏ SUSPENSE SƏRHƏDİ OLMAMALIDIR.
 *
 * ƏVVƏL: `app/loading.tsx` (root) və `app/elanlar/loading.tsx` — HƏR İKİSİ bu route-un
 * əcdadı idi və Next shell-i `getListing()` bitmədən flush edirdi. Shell flush olunanda
 * HTTP statusu artıq göndərilmiş olur, ona görə aşağıdakı `notFound()` cavabın kodunu
 * dəyişə bilmirdi: mövcud olmayan elan HTTP 200 qaytarırdı və 404 yalnız klientdə
 * `$RX("B:2","NEXT_HTTP_ERROR_FALLBACK;404")` kimi render olunurdu (SOFT-404 —
 * axtarış motorları belə səhifəni "mövcud" sayıb indeksləyir).
 *
 * İNDİ: hər iki `loading.tsx` silindi (onların skeleton-ları öz səhifələrinin İÇİNDƏKİ
 * `<Suspense>` sərhədlərinə köçdü), yəni `getListing()` shell flush-dan ƏVVƏL bitir və
 * `notFound()` real HTTP 404 qaytarır.
 *
 * Aşağıdakı yeganə Suspense sərhədi "Oxşar elanlar" blokunun ətrafındadır — o, status
 * kodu artıq təyin ediləndən SONRA render olunur, ona görə təhlükəsizdir və eyni
 * zamanda ikinci dərəcəli sorğunun 3 saniyəsini kritik yoldan çıxarır.
 */
export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { listing: l, unavailable } = await getListing(id);
  if (!l) {
    if (unavailable) {
      // Backend əlçatmazdır — elanı "yoxdur" kimi göstərmək yanlışdır.
      return (
        <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
          <div className="max-w-3xl mx-auto px-4 py-16">
            <div className="card p-12 text-center">
              <p className="text-ink-900 dark:text-white text-lg font-bold">
                Elan müvəqqəti yüklənmir
              </p>
              <p className="text-ink-500 mt-2">
                Xidmətdə qısamüddətli problem var. Bir neçə dəqiqədən sonra yenidən yoxlayın.
              </p>
              <Link href="/elanlar" className="btn-secondary inline-flex mt-4">
                Bütün elanlara bax
              </Link>
            </div>
          </div>
        </div>
      );
    }
    notFound();
  }

  const cover = l.images?.[0]?.url;
  const price =
    l.price != null ? `${azNumber(l.price)} ${l.currency}` : 'Razılaşma yolu ilə';
  const oldPrice =
    l.oldPrice != null ? `${azNumber(l.oldPrice)} ${l.currency}` : null;
  // Endirim faizi yalnız köhnə qiymət REAL olaraq böyük olduqda hesablanır —
  // əks halda «0% endirim» və ya mənfi faiz kimi saxta rəqəm çıxardı.
  const discountPct =
    l.oldPrice != null && l.price != null && Number(l.oldPrice) > Number(l.price) && Number(l.oldPrice) > 0
      ? Math.round(((Number(l.oldPrice) - Number(l.price)) / Number(l.oldPrice)) * 100)
      : null;
  const phone = l.contactPhone ?? undefined;
  const sellerName = l.contactName?.trim() || 'Satıcı';
  const location = l.address || [l.districtName, l.regionName].filter(Boolean).join(', ');

  const crumbs: Crumb[] = [
    ...(l.categoryName
      ? [{ name: l.categoryName, ...(l.categorySlug ? { url: `/k/${l.categorySlug}` } : {}) }]
      : []),
    // Region yalnız slug ilə — slug olmadan link boş filtrə aparardı.
    ...(l.regionName && l.regionSlug
      ? [{ name: l.regionName, url: `/elanlar?region=${l.regionSlug}` }]
      : []),
    { name: l.title },
  ];

  // §7.1.4 «Xüsusiyyətlər» (Avito «Характеристики» modeli) — sabit sahələr +
  // dinamik `attributes`.
  //
  // QAYDA: bu cədvəl əşyanın NƏYƏ MALİK OLDUĞUNU sadalayır. Əvvəl «Çatdırılma»
  // sətri ŞƏRTSİZ yazılırdı və satıcıya heç verilməyən sual haqqında «Yox»
  // hökmü çıxarırdı (istifadəçi məhz bundan şikayət etdi). İndi qlobal
  // bayraqlar (`hasDelivery/hasWarranty/hasCredit/hasBarter/inStock`) yalnız
  // `true` olduqda sətir yaradır.
  const specs: { k: string; v: string }[] = [];
  const seenSpecs = new Set<string>();
  // Eyni ad iki mənbədən gələ bilər (məs. `attributes.condition` və sütun
  // `condition`): ilk dəyər qalır, təkrar isə həm cədvəli, həm də render-dəki
  // React `key`-ni pozmasın deyə atılır.
  const pushSpec = (k: string, v: string | null | undefined) => {
    const id = k.toLowerCase();
    if (!v || seenSpecs.has(id)) return;
    seenSpecs.add(id);
    specs.push({ k, v });
  };

  pushSpec('Kateqoriya', l.categoryName);
  pushSpec('Vəziyyət', l.condition ? CONDITION_LABEL[l.condition] ?? l.condition : null);
  // Kateqoriya atributları satıcıya formada AÇIQ sual kimi verilir, ona görə
  // burada `false` da real cavabdır («Peyvəndli: Yox») — bu, yuxarıdakı qlobal
  // bayraq qaydasından fərqlidir və heç bir açar itirilmir.
  for (const [key, raw] of Object.entries(l.attributes ?? {})) {
    pushSpec(attrLabel(key), attrText(key, raw));
  }
  pushSpec('Qiymət növü', PRICE_TYPE_LABEL[l.priceType]);
  pushSpec(
    'Köhnə qiymət',
    oldPrice && discountPct != null ? `${oldPrice} · ${discountPct}% endirim` : oldPrice,
  );
  pushSpec('Region', l.regionName);
  pushSpec('Rayon', l.districtName);
  if (l.hasDelivery) pushSpec('Çatdırılma', 'Var');
  if (l.hasWarranty) pushSpec('Zəmanət', 'Var');
  if (l.hasCredit) pushSpec('Kredit', 'Var');
  if (l.hasBarter) pushSpec('Barter', 'Var');
  // ERP stoku yalnız təsdiqlənmiş anbar qalığı olduqda mənalıdır; miqdar varsa
  // «Var»dan daha çox məlumat verir.
  if (l.source === 'erp' && l.inStock) {
    pushSpec('Stok', l.stockQty != null ? `${l.stockQty} ədəd` : 'Var');
  }

  /**
   * Product JSON-LD — YALNIZ QİYMƏTİ OLAN ELAN ÜÇÜN.
   *
   * Google `offers`/`review`/`aggregateRating` sahələrindən heç biri olmayan
   * Product-ı zəngin nəticə üçün XƏTA kimi qeyd edir. Aktiv elanların 11-i
   * qiymətsizdir («Razılaşma yolu ilə») və onlar üçün əvvəl boş Product
   * emit olunurdu — yəni struktur data faydasız yerə xəta yaradırdı.
   * `itemCondition` sxem sabitinə bağlıdır (yalnız uyğunluğu bilinən dəyərlər).
   */
  const ITEM_CONDITION: Record<string, string> = {
    new: 'https://schema.org/NewCondition',
    like_new: 'https://schema.org/RefurbishedCondition',
    used: 'https://schema.org/UsedCondition',
    for_parts: 'https://schema.org/DamagedCondition',
  };
  const listingUrl = `${SITE.url}/elanlar/${l.id}`;
  const jsonLd =
    l.price != null
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: l.title,
          description: (l.description ?? '').slice(0, 300),
          ...(cover ? { image: cover } : {}),
          ...(l.condition && ITEM_CONDITION[l.condition]
            ? { itemCondition: ITEM_CONDITION[l.condition] }
            : {}),
          offers: {
            '@type': 'Offer',
            url: listingUrl,
            price: l.price,
            priceCurrency: l.currency,
            availability: 'https://schema.org/InStock',
            ...(l.condition && ITEM_CONDITION[l.condition]
              ? { itemCondition: ITEM_CONDITION[l.condition] }
              : {}),
          },
        }
      : null;

  const h2 = 'text-[22px] font-bold text-ink-900 dark:text-white';

  return (
    <div className="min-h-screen bg-white dark:bg-ink-900">
      {/*
        TƏHLÜKƏSİZLİK: burada `JSON.stringify(jsonLd)` BİRBAŞA verilə bilməz.
        Elan başlığı/təsviri istifadəçi mətnidir; içində `</script>` olsa, HTML parser-i
        skript blokunu həmin yerdə bağlayır və ardınca gələn hər şeyi REAL DOM elementi
        kimi icra edir (saxlanılan XSS — token localStorage-dədir, CSP yoxdur).
        `jsonLdScript()` `<` simvolunu `<`-ə çevirir; JSON semantikası dəyişmir,
        amma mətn heç bir halda HTML parser-ini tərk edə bilmir.
        Eyni köməkçi layout.tsx və Breadcrumb.tsx-də artıq istifadə olunur.
      */}
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />}

      {/* «Son baxılanlar» üçün localStorage yazısı — görünüş render etmir. */}
      <TrackRecentView
        item={{
          id: l.id,
          title: l.title,
          price: l.price,
          currency: l.currency,
          ...(cover ? { cover } : {}),
          ...(l.regionName ? { city: l.regionName } : {}),
        }}
      />

      {/* Mobil sticky CTA paneli məzmunu örtməsin deyə aşağıda əlavə boşluq (§11). */}
      <div className="mx-auto max-w-[1360px] px-4 pb-28 pt-5 sm:px-6 lg:pb-12">
        {/* §7 — [1fr əsas] [400px rels]; lg-dən aşağı tək sütun. `minmax(0,1fr)`
            uzun başlıq/cədvəllərin sütunu genişləndirib üfüqi sürüşmə yaratmasının qarşısını alır. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
          {/* ═══ ƏSAS SÜTUN ═══ */}
          <div className="min-w-0">
            <Breadcrumb items={crumbs} />

            {/* Nümunə elan xəbərdarlığı BAŞLIQDAN ƏVVƏL: istifadəçi telefonu
                götürməmişdən qabaq bunun real təklif olmadığını bilməlidir. */}
            {l.isDemo && <DemoNotice className="mt-3" />}

            <h1 className="mt-3 text-2xl font-bold leading-tight text-ink-900 dark:text-white md:text-[32px]">
              {l.title}
            </h1>

            <div className="mt-4">
              <Gallery images={l.images ?? []} title={l.title} />
            </div>

            {/* Rozetlər qalereyanın altında — sağ relsin CTA sahəsini yükləmirlər. */}
            {(l.isVip || l.isPremium || (l.source === 'erp' && l.inStock)) && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {l.source === 'erp' && l.inStock && (
                  <span className="badge badge-trusted">ERP təsdiqlənmiş stok</span>
                )}
                {l.isVip && <span className="badge badge-trusted">VIP</span>}
                {l.isPremium && !l.isVip && <span className="badge badge-trusted">Premium</span>}
              </div>
            )}

            {specs.length > 0 && (
              <section className="mt-8">
                <h2 className={h2}>Xüsusiyyətlər</h2>
                <dl className="mt-4 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
                  {specs.map((s) => (
                    <div key={s.k} className="flex items-baseline gap-2 text-sm">
                      {/* `min-w-0` + `break-words`: atribut dəyəri sərbəst mətn ola
                          bilər (məs. yazılmış marka adı) və mobil enində flex
                          sətrini genişləndirib üfüqi sürüşmə yaradardı. */}
                      <dt className="min-w-0 break-words text-ink-500 dark:text-ink-400">{s.k}</dt>
                      {/* Nöqtəli "leader" xətti — ad ilə dəyəri gözlə bağlayır */}
                      <span
                        aria-hidden="true"
                        className="min-w-4 flex-1 translate-y-[-4px] border-b border-dotted border-ink-300 dark:border-ink-700"
                      />
                      <dd className="min-w-0 break-words text-right font-medium text-ink-900 dark:text-white">
                        {s.v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {location && (
              <section className="mt-8">
                <h2 className={h2}>Yerləşmə</h2>
                <p className="mt-3 flex items-start gap-2 text-sm text-ink-700 dark:text-ink-300">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                  <span>{location}</span>
                </p>
                {l.regionSlug && (
                  <Link
                    href={`/elanlar?region=${l.regionSlug}`}
                    className="mt-2 inline-block text-sm font-medium text-tap hover:underline"
                  >
                    Ətraflı öyrən
                  </Link>
                )}
              </section>
            )}

            <section className="mt-8">
              <h2 className={h2}>Təsvir</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-700 dark:text-ink-300">
                {l.description}
              </p>
            </section>

            {/* §7.1.7 — meta sətri: № · tarix · baxış */}
            <p className="mt-8 text-[13px] text-ink-500 dark:text-ink-400">
              № {l.id.slice(0, 8).toUpperCase()} · {azDateLong(l.createdAt)} · {l.views ?? 0} baxış
            </p>

            {/* §7.1.8 — «Elandan şikayət et»: boz fonlu, sərhədsiz.
                ReportButton öz faylında qalır; burada yalnız qabıq verilir
                (daxili `mt-3` sıfırlanır ki, qutunun içində mərkəzdə dursun). */}
            <div className="mt-4 inline-flex items-center rounded-lg bg-ink-100 px-4 py-2.5 dark:bg-ink-800 [&>button]:mt-0">
              <ReportButton listingId={l.id} />
            </div>

            {/* Oxşar elanlar — ikinci dərəcəli məzmun, ayrıca stream olunur.
                Status kodu (200/404) bu nöqtəyə çatanda artıq təyin olunub. */}
            <Suspense fallback={null}>
              <SimilarListings id={l.id} />
            </Suspense>

            {/* §7.1.10 — altda boz keçidlər sətri */}
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink-200 pt-5 text-[13px] text-ink-500 dark:border-ink-700 dark:text-ink-400">
              {l.categorySlug && l.categoryName && (
                <Link href={`/k/${l.categorySlug}`} className="hover:text-tap">
                  {l.categoryName}
                </Link>
              )}
              {l.regionSlug && l.regionName && (
                <Link href={`/elanlar?region=${l.regionSlug}`} className="hover:text-tap">
                  {l.regionName}
                </Link>
              )}
              <Link href="/elanlar" className="hover:text-tap">
                Bütün elanlar
              </Link>
              <Link href="/elan-yerlesdir" className="hover:text-tap">
                Elan yerləşdir
              </Link>
            </div>
          </div>

          {/* ═══ SAĞ RELS (400px) ═══ */}
          <aside className="min-w-0 space-y-5">
            <ListingActions
              listingId={l.id}
              ownerId={l.ownerId}
              title={l.title}
              priceLabel={price}
              oldPriceLabel={oldPrice}
              price={l.price}
              currency={l.currency}
              {...(cover ? { cover } : {})}
              {...(phone ? { phone } : {})}
              whatsapp={l.contactWhatsapp}
              hasDelivery={l.hasDelivery}
            />

            {/* §7.2.3 — satıcı bloku */}
            <section className="border-t border-ink-200 pt-5 dark:border-ink-700">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {/*
                    SATICI ADI KEÇİD DEYİL — QƏSDƏN.

                    Əvvəl `/profil/<ownerId>`-ə link verilirdi, LAKİN belə bir səhifə
                    mövcud deyil (`app/profil/[id]` yoxdur) və backend-də ictimai
                    istifadəçi endpoint-i də yoxdur (`api/src/modules/users/` boşdur).
                    Nəticədə HƏR elan səhifəsində satıcı adı 404 verirdi.

                    İctimai satıcı profili real funksionallıqdır və ayrıca qərar tələb
                    edir (endpoint + səhifə + hansı məlumatın açıq olması). Onu burada
                    uydurmaq əvəzinə ölü keçid götürüldü. Mağazaya aid elanlarda isə
                    MÖVCUD olan mağaza vitrininə keçid verilir.
                  */}
                  <span className="block truncate text-[17px] font-bold text-ink-900 dark:text-white">
                    {sellerName}
                  </span>
                  <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
                    {l.storeId ? 'Mağaza' : 'Şəxsi şəxs'}
                  </p>
                  <a
                    href="#satici-reyleri"
                    className="mt-1 inline-block text-[13px] font-medium text-tap hover:underline"
                  >
                    Rəylərə bax
                  </a>
                </div>
                <FollowButton userId={l.ownerId} name={sellerName} />
              </div>
            </section>

            {/* §7.2.4 — «Satıcıdan soruş»: boz söhbət qutusu + tünd pill çipləri */}
            <MessageSeller listingId={l.id} ownerId={l.ownerId} />

            {/* §7.2.5 — rəylər */}
            <div id="satici-reyleri" className="scroll-mt-24">
              <SellerReviews sellerId={l.ownerId} listingId={l.id} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

async function SimilarListings({ id }: { id: string }) {
  const similar = await getSimilar(id);
  if (similar.length === 0) return null;
  return (
    // `<details>` — «Oxşar elanlar ⌄» açılan bölməsi klaviatura ilə onsuz da
    // idarə olunur, ona görə burada əlavə klient JS-i saxlanılmır.
    <details open className="mt-10 group">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xl font-bold text-ink-900 dark:text-white [&::-webkit-details-marker]:hidden">
        Oxşar elanlar
        <ChevronDown
          className="h-5 w-5 text-ink-400 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {similar.map((s) => (
          <ListingCard key={s.id} item={s} />
        ))}
      </div>
    </details>
  );
}
