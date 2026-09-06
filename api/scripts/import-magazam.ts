/**
 * magazam.az KATALOQ İDXALI → 360tap.az
 *
 * NİYƏ BU SKRİPT: magazam.az istifadəçinin ÖZ mağazasıdır (sahiblik təsdiqləndi) və
 * onun 2171 məhsulu 360tap.az-da «magazam.az» mağazası kimi görünməlidir.
 *
 * NİYƏ HTTP DEYİL, BİRBAŞA SERVİS: layihədə hazır ERP gateway var
 * (`POST /erp/v1/products/publish`), lakin onun mühafizəçisi (`ErpAuthGuard`)
 * replay müdafiəsi üçün **Redis tələb edir**, canlıda isə Redis qopuqdur
 * (`ECONNREFUSED` — DAVAM.md §0-D). Ona görə HTTP qatını yox, ONUN ÇAĞIRDIĞI
 * `ErpService.publish()` metodunu birbaşa çağırırıq: eyni yoxlanılmış məntiq
 * (kateqoriya həlli, `external_id` üzrə idempotent upsert, media, slug, status),
 * amma Redis/şəbəkə/limit asılılığı olmadan.
 *
 * NİYƏ Nest BOOT EDİLMİR: `AppModule` cron işlərini (saxlanmış axtarış, müddət bitmə)
 * və Redis bağlantısını da qaldırardı — idxal zamanı istifadəçilərə bildiriş göndərmək
 * yolverilməzdir. Servislər əl ilə qurulur; `SearchService` Meili konfiqurasiya
 * olunmayanda özü no-op olur (search.service.ts:95).
 *
 * İDEMPOTENT: `external_id` = magazam `_id` (dəyişməz, 2171/2171 unikal — ölçüldü).
 * Skripti təkrar işlətmək dublikat yaratmır, mövcud elanı yeniləyir.
 *
 * İSTİFADƏ:
 *   npx tsx scripts/import-magazam.ts --dry-run            # heç nə yazmır, hesabat verir
 *   npx tsx scripts/import-magazam.ts --limit 20           # yalnız ilk 20 məhsul
 *   npx tsx scripts/import-magazam.ts                      # tam idxal
 *   DATABASE_URL='<render>' npx tsx scripts/import-magazam.ts   # canlıya
 */
import { PrismaService } from '../src/prisma/prisma.service';
import { SearchService } from '../src/search/search.service';
import { ErpService } from '../src/modules/erp/erp.service';
import type { ErpPublishDto } from '../src/modules/erp/dto/erp-publish.dto';
import { readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';

// ─────────────────────────── Konfiqurasiya ───────────────────────────

const SOURCE_FILE = process.env.MAGAZAM_FILE ?? '/tmp/mg/products.json';
const STORE_NAME = 'magazam.az';
const STORE_SLUG = 'magazam-az';
const OWNER_EMAIL = process.env.MAGAZAM_OWNER_EMAIL ?? 'magazam@360tap.az';
const OWNER_NAME = 'magazam.az';
// Mağazanın ÖZ saytından götürülüb (`https://magazam.az/api/v1/settings`):
//   address: «Baki ş., Nəsimi r., 28 may küç. 14», whatsappPhone: +994705004400
// NİYƏ RAYON DA VERİLİR: yalnız region verilsə `resolveDistrict` həmin regionun
// İLK rayonunu götürür (`erp.service.ts:322`, `take: 1`, sıralama yoxdur) — yəni
// 2171 elan təsadüfi bir rayona düşərdi və istifadəçi yanlış ünvan görərdi.
const STORE_PHONE = process.env.MAGAZAM_PHONE ?? '+994705004400';
const STORE_REGION = process.env.MAGAZAM_REGION ?? 'baki';
const STORE_DISTRICT = process.env.MAGAZAM_DISTRICT ?? 'baki-nesimi';
const STORE_ADDRESS = 'Bakı ş., Nəsimi r., 28 May küç. 14';

/**
 * KATEQORİYA XƏRİTƏSİ — `kök/yarpaq` → 360tap slug.
 *
 * NİYƏ YARPAQ SƏVİYYƏSİ: magazam-da 19 kök kateqoriya var, amma 2171 məhsulun
 * HAMISININ alt kateqoriyası var (46 fərqli yarpaq — ölçüldü). Yalnız köklə
 * xəritələmək kobud və bəzən YANLIŞ nəticə verir: `telefonlar-ve-aksesuarlar`
 * kökündə 179 REAL telefon və 163 aksesuar birlikdədir; `komputer-ve-periferiya`
 * kökündəki 72 «USB şunur» əslində telefon şarj kabelidir; `sebek-e-ve-baglanti`
 * adına baxmayaraq router deyil, telefon adapteridir. Ona görə açar `kök/yarpaq`-dır.
 *
 * NİYƏ AÇAR BİRLƏŞİKDİR: yarpaq slug-ı təkbaşına unikal deyil — `gunluk` həm 12
 * termos stəkanı (kök `gunluk`), həm də 1 avtomobil günəş çətiri (kök `diger`)
 * üçün işlədilir və onlar FƏRQLİ kateqoriyalara getməlidir.
 *
 * Sağdakı rəqəm məhsul sayıdır. Hər hədəf slug icradan ƏVVƏL bazada yoxlanılır
 * (`assertCategoriesExist`) — uydurma slug səssiz 400 selinə çevrilməsin.
 */
const CATEGORY_MAP: Record<string, string> = {
  'audio-ve-ses/qulaqliqlar': 'audio', // 416
  'agilli-cihazlar/smart-saatlar': 'smart-saatlar', // 380
  'telefonlar-ve-aksesuarlar/telefonlar': 'mobil-telefonlar', // 179 — REAL telefonlar
  'plansetler/plansetler': 'planshetler', // 162 (yazılış fərqi: mg `plansetler`, biz `planshetler`)
  'ev-ucun-elektronika/ev-ucun-elektronika-ev-ucun-elektronika': 'xirda-texnika', // 152
  'audio-ve-ses/kalonkalar': 'audio', // 83
  'telefonlar-ve-aksesuarlar/adapterler': 'telefon-aksesuar', // 80
  'komputer-ve-periferiya/usb-sunurlar': 'telefon-aksesuar', // 72 — şarj kabeli, periferiya deyil
  'ev-ucun-elektronika/fanlar': 'xirda-texnika', // 71
  'kamera-ve-foto/kameralar': 'foto-video', // 56
  'telefonlar-ve-aksesuarlar/power-banklar': 'telefon-aksesuar', // 44
  'komputer-ve-periferiya/mouse-lar': 'periferiya', // 38
  'tv-ve-media/proyektorlar': 'televizorlar', // 37
  'kamera-ve-foto/tripodlar-ve-selfi-cubuqlari': 'foto-video', // 37
  'audio-ve-ses/mikrofonlar': 'audio', // 32
  'tv-ve-media/tv-box': 'televizorlar', // 31
  // 30-un əksəriyyəti avtomobil şarj cihazıdır (JV-30x car charger). Nəqliyyat
  // kateqoriyasına salsaq həm vertical `transport` olur, həm də avtomobil marka
  // filtrlərinə (Mercedes/BMW) düşür — telefon şarjı üçün mənasızdır.
  // Qiyməti: 2 nasos və 1 skaner bir qədər yanlış yerdə qalır (2171-dən 3-ü).
  'avto-elektronika/avto-cihazlar': 'telefon-aksesuar', // 30
  'komputer-ve-periferiya/klaviaturalar': 'periferiya', // 29
  'telefonlar-ve-aksesuarlar/telefon-tutacaqlari': 'telefon-aksesuar', // 25
  'ev-ucun-elektronika/led-isiqlar': 'isiq-dekor', // 21
  'oyun-ve-eylence/game-box': 'oyun-konsollar', // 20
  'audio-ve-ses/aux-ve-kabeller': 'telefon-aksesuar', // 19
  'oyun-ve-eylence/joystickler': 'oyun-konsollar', // 17
  'yaddas-ve-saxlama/flash-yaddaslar': 'periferiya', // 16
  'yaddas-ve-saxlama/yaddas-kartlari': 'periferiya', // 14
  'komputer-ve-periferiya/hub-lar': 'periferiya', // 14
  'gunluk/gunluk': 'qab-qacaq', // 12 — Stanley termos stəkanları, elektronika deyil
  'ev-ucun-elektronika/tozsoranlar': 'xirda-texnika', // 9
  'telefonlar-ve-aksesuarlar/stiluslar': 'telefon-aksesuar', // 8
  'telefonlar/telefonlar': 'mobil-telefonlar', // 7
  'kamera-ve-foto/registratorlar': 'foto-video', // 6 — videoregistrator = video kamera
  'avto-elektronika/moto': 'motosikletler', // 6 — real moped
  'ev-ucun-elektronika-ev-ucun-elektronika/ev-ucun-elektronika-ev-ucun-elektronika': 'xirda-texnika', // 5
  'diger/canta': 'aksesuar', // 5
  'oyun-ve-eylence/oyun-konsollari': 'oyun-konsollar', // 4
  'avto-elektronika/parking-sensorlari': 'ehtiyat-hisseleri', // 4 — real avtomobil avadanlığı
  'telefonlar-ve-aksesuarlar/ekran-qoruyucular': 'telefon-aksesuar', // 4
  'sebek-e-ve-baglanti/oturuculer': 'telefon-aksesuar', // 4 — router DEYİL, adapter
  'idman-aletleri/idman-aletleri': 'idman-turizm', // 3
  'mikrofonlar/mikrofonlar': 'audio', // 3
  'diger/scooter': 'motosikletler', // 3
  'telefonlar-ve-aksesuarlar/keys-ve-cexollar': 'telefon-aksesuar', // 2
  'diger/oyuncaqlar': 'oyuncaqlar', // 2
  'sebek-e-ve-baglanti/modulyatorlar': 'telefon-aksesuar', // 2
  'komputer-ve-periferiya/vr': 'periferiya', // 1
  'qulaqliqlar/qulaqliqlar': 'audio', // 1
  'agilli-cihazlar/saat-kemerleri': 'smart-saatlar', // 1
  'komputer-ve-periferiya/monitorlar': 'monitorlar', // 1
  'diger/gunluk': 'ehtiyat-hisseleri', // 1 — avtomobil günəş çətiri
  'diger/aksesuarlar': 'aksesuar', // 1
  'ev-ucun-elektronika/qizdiricilar': 'xirda-texnika', // 1
};

/**
 * Yarpağı tanımadıqda kökə düşürük. Bu, magazam-da YENİ alt kateqoriya yaranarsa
 * idxalın dayanmaması üçündür — məhsul kobud, amma DOĞRU kateqoriyaya düşür.
 */
const ROOT_FALLBACK: Record<string, string> = {
  'audio-ve-ses': 'audio',
  'agilli-cihazlar': 'smart-saatlar',
  'telefonlar-ve-aksesuarlar': 'telefon-aksesuar',
  'ev-ucun-elektronika': 'xirda-texnika',
  plansetler: 'planshetler',
  'komputer-ve-periferiya': 'periferiya',
  'kamera-ve-foto': 'foto-video',
  'tv-ve-media': 'televizorlar',
  'oyun-ve-eylence': 'oyun-konsollar',
  'avto-elektronika': 'telefon-aksesuar',
  'yaddas-ve-saxlama': 'periferiya',
  gunluk: 'qab-qacaq',
  diger: 'aksesuar',
  telefonlar: 'mobil-telefonlar',
  'sebek-e-ve-baglanti': 'telefon-aksesuar',
  'ev-ucun-elektronika-ev-ucun-elektronika': 'xirda-texnika',
  'idman-aletleri': 'idman-turizm',
  mikrofonlar: 'audio',
  qulaqliqlar: 'audio',
};

// ─────────────────────────── Çevirmələr ───────────────────────────

type MgImage = { url?: string };
type MgProduct = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  discountedPrice?: number;
  brand?: { name?: string } | null;
  model?: string;
  category?: { slug?: string; name?: string } | null;
  categories?: { slug?: string; name?: string }[];
  images?: MgImage[];
  keywords?: string[];
  specs?: Record<string, unknown>;
  stock?: number;
  status?: string;
};

/**
 * ŞƏKİL KEYFİYYƏTİ — Cloudinary transformasiyası.
 *
 * Mənbə URL-ləri XAM orijinallardır (2355 şəkil, heç birində transformasiya yoxdur —
 * ölçüldü). Onları olduğu kimi vermək iki şeyi itirir: (a) müasir format, (b) ölçü
 * nəzarəti. Ölçüldü: 143 749 bayt JPEG → 81 528 bayt WebP, eyni görünüş.
 *
 * Parametrlər:
 *  · `f_auto`      — brauzerə görə AVIF/WebP/JPEG seçilir;
 *  · `q_auto:best` — Cloudinary-nin ən yüksək avtomatik keyfiyyət pilləsi;
 *  · `w_1600,c_limit` — YALNIZ böyükləri kiçildir, kiçikləri BÖYÜTMÜR
 *    (mənbədə en 225–2048 px, median 900 px — süni böyütmə detal əlavə etmir,
 *    əksinə bulanıqlıq yaradardı).
 *
 * Yol prefiksi (`/di8zz8sc1/`) dəyişmir, yəni frontend allowlist-i pozulmur
 * (`frontend/lib/image-hosts.ts`).
 */
const CLOUDINARY_TRANSFORM = 'f_auto,q_auto:best,w_1600,c_limit';

export function upgradeImageUrl(url: string): string {
  const marker = '/image/upload/';
  const i = url.indexOf(marker);
  if (i === -1 || !url.includes('res.cloudinary.com')) return url;
  const rest = url.slice(i + marker.length);
  // Artıq transformasiya varsa toxunmuruq (təkrar tətbiq keyfiyyəti aşağı salır).
  if (/^[a-z]{1,2}_[^/]+\//.test(rest)) return url;
  return `${url.slice(0, i + marker.length)}${CLOUDINARY_TRANSFORM}/${rest}`;
}

/** HTML → düz mətn. Təsvirlər redaktordan gəlir: teqlər, `&nbsp;`, emoji, sıra pozğunluğu. */
export function htmlToText(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Təsvir DTO-da 10–5000 simvoldur. Ölçüldü: 2171 məhsuldan **83-ünün** təsviri
 * təmizləndikdən sonra 10 simvoldan qısadır və onların HEÇ BİRİNDƏ
 * `shortDescription` yoxdur. Uydurma xüsusiyyət yazmaq olmaz, ona görə yalnız
 * ƏLDƏ OLAN faktlardan (ad, brend, kateqoriya) qısa, doğru cümlə qurulur.
 */
export function buildDescription(p: MgProduct): string {
  const main = htmlToText(p.description);
  if (main.length >= 10) return main.slice(0, 5000);
  const short = htmlToText(p.shortDescription);
  if (short.length >= 10) return short.slice(0, 5000);
  const brand = p.brand?.name ? `${p.brand.name} markası. ` : '';
  const cat = p.category?.name ? `Kateqoriya: ${p.category.name}. ` : '';
  return `${p.name}. ${brand}${cat}Ətraflı məlumat üçün satıcı ilə əlaqə saxlayın.`.slice(0, 5000);
}


/**
 * MƏHSUL ADINDAN TEXNİKİ NİŞANLARIN ÇIXARILMASI.
 *
 * NİYƏ: mənbədə 2171 məhsuldan **1586-sının təsviri elə başlığın özüdür** (ölçüldü),
 * yəni əsl təsvir YOXDUR. Uydurma xüsusiyyət yazmaq alıcıya yalan məlumat verməkdir,
 * ona görə yeganə dürüst mənbə məhsulun ÖZ adıdır — və orada real dəyərlər var:
 * 116 məhsulda «Bluetooth», 72-də vat, 66-da «Type-C», 42-də yaddaş, 40-da mAh
 * (ölçüldü). Bunlar çıxarılıb strukturlu şəkildə göstərilir.
 *
 * Adda olmayan heç nə əlavə edilmir — 1827 məhsulda bu siyahı BOŞ qalır və təsvir
 * yalnız ad + marka/model + mağaza şərtlərindən ibarət olur.
 */
/**
 * Rəqəm minlik ayırıcısı ilə yazıla bilir («10.000mAh», «10,000 mAh», «10 000mAh»).
 * Ayırıcını nəzərə almayan sadə `\d{3,6}` naxışı «10.000mAh»-dan «000» götürürdü
 * (ölçüldü — elanda «000 mAh» yazılmışdı). Ona görə ayırıcılar əvvəlcə təmizlənir.
 */
const NUM = String.raw`\d{1,3}(?:[.,\s]\d{3})+|\d+`;
const digits = (raw: string): string => raw.replace(/[.,\s]/g, '');

const SPEC_PATTERNS: { re: RegExp; format: (m: RegExpMatchArray) => string }[] = [
  { re: new RegExp(`(${NUM})\\s*mAh`, 'i'), format: (m) => `${digits(m[1])} mAh` },
  { re: new RegExp(`(${NUM})\\s*W\\b`, 'i'), format: (m) => `${digits(m[1])} Vt` },
  { re: /\b(4K|8K|2K|1080P|720P)\b/i, format: (m) => m[1].toUpperCase() },
  { re: /\bbluetooth\b/i, format: () => 'Bluetooth' },
  { re: /\bwi-?fi\b/i, format: () => 'Wi-Fi' },
  { re: /\b(?:type-?c|usb-?c)\b/i, format: () => 'Type-C' },
  { re: /\blightning\b/i, format: () => 'Lightning' },
  { re: /\bnfc\b/i, format: () => 'NFC' },
  { re: /\bgps\b/i, format: () => 'GPS' },
  { re: /(\d{1,2}(?:\.\d)?)\s*(?:inch|")/i, format: (m) => `${m[1]} düym ekran` },
];

export function extractSpecs(name: string): string[] {
  const out: string[] = [];
  for (const { re, format } of SPEC_PATTERNS) {
    const m = name.match(re);
    if (m) out.push(format(m));
  }
  return out;
}

/**
 * MAĞAZANIN REAL ŞƏRTLƏRİ — hər elanın sonuna əlavə olunur.
 *
 * Mətn UYDURULMUR: `https://magazam.az/api/v1/settings` cavabından gəlir —
 * `warrantyText: «Məhsula 14 Gün müddətində rəsmi zəmanət verilir!»`,
 * `deliveryOptions[0]: «100 AZN üzəri sifarişlər ÖDƏNİŞSİZ çatdırılır», «3 iş günü
 * ərzində», «Çatdırılma haqqı minimum 5 AZN»`, `address: «Baki ş., Nəsimi r., 28 may küç. 14»`.
 *
 * NİYƏ LAZIMDIR: alıcı üçün zəmanət və çatdırılma şərti qiymət qədər vacibdir;
 * onlar elanda yazılmasa hər alıcı eyni sualı mesajla soruşur. `warranty_months`
 * sahəsi işlədilmir, çünki zəmanət 14 GÜNDÜR — ayla ifadə etsək (1 ay) müddəti
 * OLDUĞUNDAN UZUN göstərmiş olardıq.
 */
const STORE_TERMS = [
  'Zəmanət: 14 gün rəsmi zəmanət.',
  'Çatdırılma: 3 iş günü ərzində; 100 AZN üzəri sifarişlər ödənişsiz, aşağısı minimum 5 AZN.',
  `Ünvan: ${STORE_ADDRESS}.`,
].join('\n');

/**
 * Yekun təsvir: mənbə mətni + marka/model + addan çıxarılmış xüsusiyyətlər + şərtlər.
 * Hamısı mənbədən gələn faktlardır — heç bir xarakteristika uydurulmur.
 *
 * TƏKRAR SİLİNİR: 1586 məhsulda mənbə «təsviri» elə başlığın özüdür (ölçüldü).
 * Onu olduğu kimi yazmaq elanın başında eyni cümləni iki dəfə göstərərdi, ona görə
 * başlıqla üst-üstə düşən mətn buraxılır və struktur bloklar onun yerini tutur.
 */
export function buildFullDescription(p: MgProduct): string {
  const parts: string[] = [];
  const body = buildDescription(p).trim();
  const title = (p.name ?? '').trim();
  if (body && body.toLowerCase() !== title.toLowerCase()) parts.push(body);

  const idn: string[] = [];
  if (p.brand?.name) idn.push(`Marka: ${p.brand.name}`);
  if (p.model) idn.push(`Model: ${p.model}`);
  if (idn.length) parts.push(idn.join(' · '));

  const specs = extractSpecs(title);
  if (specs.length) parts.push(`Xüsusiyyətlər: ${specs.join(' · ')}`);

  parts.push(STORE_TERMS);
  return parts.join('\n\n').slice(0, 5000);
}

/**
 * Qiymət istiqaməti — ÖLÇÜLDÜ, təxmin edilmədi.
 * magazam.az-da `discountedPrice` 641 məhsuldan **639-unda** `price`-dan KİÇİKDİR
 * (1-i böyük, 1-i bərabər). Yəni `discountedPrice` = cari (endirimli) qiymət,
 * `price` = köhnə qiymət. Bizdə isə `price` cari, `old_price` KÖHNƏ (baha) qiymətdir.
 * İki istisnaya görə şərt bərabərlik/böyüklük hallarını endirim SAYMIR — əks halda
 * «endirim» nişanı yalan olardı.
 */
export function resolvePrice(p: MgProduct): { price?: number; old_price?: number } {
  const base = typeof p.price === 'number' ? p.price : undefined;
  const disc = typeof p.discountedPrice === 'number' ? p.discountedPrice : undefined;
  if (base !== undefined && disc !== undefined && disc < base) {
    return { price: round2(disc), old_price: round2(base) };
  }
  return { price: base !== undefined ? round2(base) : undefined };
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Stok. Ölçüldü: bir məhsulda `stock = 12121212` (əl ilə yazılmış cəfəngiyat),
 * 7 məhsulda 0. Sıfır stok elanı `out_of_stock` statusuna salır (bu doğrudur),
 * absurd böyük dəyər isə istifadəçiyə yalan «12 milyon ədəd» göstərərdi.
 */
export function resolveStock(p: MgProduct): number {
  const s = typeof p.stock === 'number' && Number.isFinite(p.stock) ? Math.floor(p.stock) : 0;
  if (s <= 0) return 0;
  return Math.min(s, 9999);
}

/** `specs` (31 məhsulda) + `keywords` (389 məhsulda) → atribut obyekti. */
export function buildAttributes(p: MgProduct): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p.specs ?? {})) {
    const vals = Array.isArray(v)
      ? v.map((x) => (x && typeof x === 'object' && 'name' in x ? String((x as { name: unknown }).name) : String(x)))
      : [String(v)];
    const joined = vals.filter(Boolean).join(', ');
    if (joined) attrs[k] = joined;
  }
  if (p.keywords?.length) attrs.keywords = p.keywords.slice(0, 20).join(', ');
  return attrs;
}


/**
 * ATRİBUT ZƏNGİNLƏŞDİRMƏSİ — YALNIZ MƏNBƏDƏ OLAN FAKTLARDAN.
 *
 * Kateqoriya atributları (`category_attributes`) filtrlərin özəyidir; boş qalsa
 * istifadəçi «Növ», «Rəng», «Yaddaş» filtrlərini işlədə bilmir və 2171 elan
 * yalnız mətn axtarışı ilə tapılır. Ona görə DOLDURULA BİLƏNLƏR doldurulur.
 *
 * ⚠️ QAYDA: heç bir xüsusiyyət UYDURULMUR. Hər dəyərin mənbəyi var:
 *  · `condition = "Yeni"` — magazam.az pərakəndə mağazadır, kataloqu yeni məhsuldur;
 *  · `type` — magazam-ın ÖZ alt kateqoriyasından (qulaqliqlar → «Qulaqlıq»);
 *  · `color`/`memory` — məhsulun ÖZ adından çıxarılır («... Black», «3GB/32GB»).
 * Adda rəng/yaddaş yoxdursa sahə BOŞ qalır — təxmin yazılmır.
 */

/** magazam yarpağı → bizim `type` atribut dəyəri (hər ikisi mənbədən gəlir). */
const TYPE_BY_LEAF: Record<string, string> = {
  qulaqliqlar: 'Qulaqlıq',
  kalonkalar: 'Dinamik/Səsucaldan',
  mikrofonlar: 'Mikrofon',
  'aux-ve-kabeller': 'Kabel',
  'usb-sunurlar': 'Kabel',
  adapterler: 'Adapter',
  'power-banklar': 'Power bank',
  'ekran-qoruyucular': 'Qoruyucu şüşə',
  'keys-ve-cexollar': 'Qılaf',
  'telefon-tutacaqlari': 'Digər',
  stiluslar: 'Digər',
  'mouse-lar': 'Siçan',
  klaviaturalar: 'Klaviatura',
  'hub-lar': 'Digər',
  kameralar: 'Videokamera',
  registratorlar: 'Videokamera',
  'tripodlar-ve-selfi-cubuqlari': 'Aksesuar',
};

/** Adda rast gəlinən rəng sözləri → bizim `color` seçimləri. */
const COLOR_WORDS: [RegExp, string][] = [
  [/\b(black|qara)\b/i, 'Qara'],
  [/\b(white|ağ|ag)\b/i, 'Ağ'],
  [/\b(grey|gray|boz|silver|gümüşü)\b/i, 'Boz'],
  [/\b(gold|qızıl|qizil)\b/i, 'Qızılı'],
  [/\b(blue|mavi)\b/i, 'Mavi'],
  [/\b(green|yaşıl|yasil)\b/i, 'Yaşıl'],
  [/\b(pink|purple|orange|red|çəhrayı)\b/i, 'Digər'],
];

/** «3GB/32GB», «128GB», «256 GB» → bizim `memory` seçimi (yalnız siyahıdakılar). */
const MEMORY_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

export function enrichAttributes(
  p: MgProduct,
  base: Record<string, unknown>,
): Record<string, unknown> {
  const attrs = { ...base };
  const chain = p.categories ?? [];
  const leaf = chain.length ? chain[chain.length - 1]?.slug : undefined;

  if (attrs.type === undefined && leaf && TYPE_BY_LEAF[leaf]) attrs.type = TYPE_BY_LEAF[leaf];
  // Mağaza yeni məhsul satır — bu, kataloqun özündən çıxan faktdır, təxmin deyil.
  if (attrs.condition === undefined) attrs.condition = 'Yeni';

  const name = p.name ?? '';
  if (attrs.color === undefined) {
    const hit = COLOR_WORDS.find(([re]) => re.test(name));
    if (hit) attrs.color = hit[1];
  }
  if (attrs.memory === undefined) {
    // Adda BİRDƏN ÇOX ölçü ola bilər («3GB/32GB» — RAM + yaddaş). Yaddaş kimi
    // yalnız siyahımızda olan (≥64GB) dəyər götürülür, RAM səhvən yazılmasın.
    const found = [...name.matchAll(/(\d+)\s*(GB|TB)/gi)]
      .map((m) => `${m[1]}${m[2].toUpperCase()}`)
      .filter((v) => MEMORY_OPTIONS.includes(v));
    if (found.length) attrs.memory = found[found.length - 1];
  }
  return attrs;
}

export function toPublishDto(p: MgProduct): ErpPublishDto | { skip: string } {
  const root = p.category?.slug;
  const chain = p.categories ?? [];
  const leaf = chain.length ? chain[chain.length - 1]?.slug : undefined;
  const key = root && leaf ? `${root}/${leaf}` : undefined;
  const target =
    (key ? CATEGORY_MAP[key] : undefined) ?? (root ? ROOT_FALLBACK[root] : undefined);
  if (!target) return { skip: `kateqoriya xəritədə yoxdur: ${key ?? root ?? '(boş)'}` };

  const title = (p.name ?? '').trim().slice(0, 140);
  if (title.length < 3) return { skip: 'başlıq 3 simvoldan qısadır' };

  const images = (p.images ?? [])
    .map((i) => i?.url)
    .filter((u): u is string => typeof u === 'string' && /^https?:\/\//.test(u))
    .map(upgradeImageUrl)
    .slice(0, 20);

  const { price, old_price } = resolvePrice(p);

  return {
    external_id: p._id,
    title,
    category: target,
    description: buildFullDescription(p),
    region: STORE_REGION,
    district: STORE_DISTRICT,
    // Mağazanın öz şərtləri (settings.deliveryOptions): 100 AZN üzəri pulsuz,
    // minimum 5 AZN, 3 iş günü. Yəni çatdırılma REAL var.
    delivery: true,
    brand: p.brand?.name?.slice(0, 80) || undefined,
    model: p.model?.slice(0, 120) || undefined,
    price,
    old_price,
    currency: 'AZN',
    stock_qty: resolveStock(p),
    images: images.length ? images : undefined,
    attributes: enrichAttributes(p, buildAttributes(p)),
    active: true,
    ...(STORE_PHONE ? { whatsapp: STORE_PHONE } : {}),
  } as ErpPublishDto;
}

// ─────────────────────────── İcra ───────────────────────────

/**
 * İdxaldan ƏVVƏL bütün hədəf slug-ların bazada olduğunu yoxlayır.
 *
 * NİYƏ: `ErpService.publish` naməlum slug üçün 400 atır. Yoxlama olmasa xəta yalnız
 * icra ortasında, məhsul-məhsul üzə çıxardı — 2171 sətirlik log içində bir yazı
 * səhvini tapmaq çətindir. Burada bir dəfə yoxlanılır və çatışmayan slug-lar
 * BİRLİKDƏ göstərilir.
 */
async function assertCategoriesExist(prisma: PrismaService): Promise<void> {
  const targets = [...new Set([...Object.values(CATEGORY_MAP), ...Object.values(ROOT_FALLBACK)])];
  const found = await prisma.category.findMany({
    where: { slug: { in: targets } },
    select: { slug: true },
  });
  const have = new Set(found.map((c) => c.slug));
  const missing = targets.filter((t) => !have.has(t));
  if (missing.length) {
    throw new Error(`Bazada olmayan kateqoriya slug-ları: ${missing.join(', ')}`);
  }
  console.log(`Kateqoriya yoxlaması: ${targets.length} hədəf slug-ın hamısı bazadadır ✓`);
}

async function ensureStore(prisma: PrismaService, dryRun: boolean) {
  let owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) {
    if (dryRun) return { owner: null, store: null, integration: null, created: true };
    owner = await prisma.user.create({
      data: {
        email: OWNER_EMAIL,
        fullName: OWNER_NAME,
        // Parol qoyulmur: bu hesab yalnız kataloq sahibliyi üçündür, giriş üçün deyil.
        // Sahibi ona «şifrəni unutdum» axını ilə sahib çıxa bilər.
        passwordHash: createHash('sha256').update(randomBytes(32)).digest('hex'),
        isEmailVerified: true,
        role: 'user',
      },
    });
  }

  let store = await prisma.store.findFirst({ where: { ownerId: owner.id } });
  if (!store && !dryRun) {
    store = await prisma.store.create({
      data: {
        ownerId: owner.id,
        name: STORE_NAME,
        slug: STORE_SLUG,
        description: `Elektronika və aksesuar mağazası. Ünvan: ${STORE_ADDRESS}. Çatdırılma 3 iş günü ərzində, 100 AZN üzəri ödənişsiz.`,
        phone: STORE_PHONE || null,
        // Mənbə nişanı: bu mağazanın elanları xarici kataloqdan gəlir, əl ilə yazılmayıb.
        source: 'erp',
        // NİYƏ TƏSDİQLİ: mağaza sahibinin öz saytıdır və sahiblik təsdiqlənib.
        // Təsdiqsiz mağazanın elanları `review` statusunda qalır və İCTİMAİ GÖRÜNMÜR
        // (erp.service.ts:105) — yəni 2171 məhsul kataloqda heç vaxt görünməzdi.
        isVerified: true,
        status: 'active',
      },
    });
  }

  let integration = store
    ? await prisma.erpIntegration.findUnique({ where: { storeId: store.id } })
    : null;
  if (store && !integration && !dryRun) {
    integration = await prisma.erpIntegration.create({
      data: {
        storeId: store.id,
        erpTenantId: `magazam-${store.id.slice(0, 8)}`,
        apiKeyHash: createHash('sha256').update(randomBytes(32)).digest('hex'),
        webhookSecret: randomBytes(32).toString('hex'),
        isActive: true,
      },
    });
  }
  return { owner, store, integration, created: false };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const limitArg = argv.find((a) => a.startsWith('--limit'));
  const limit = limitArg ? Number(limitArg.split('=')[1] ?? argv[argv.indexOf(limitArg) + 1]) : undefined;

  const raw = JSON.parse(readFileSync(SOURCE_FILE, 'utf8')) as { products: MgProduct[] };
  const all = raw.products ?? [];
  const products = limit ? all.slice(0, limit) : all;
  console.log(`Mənbə: ${SOURCE_FILE} · ${all.length} məhsul · icra ediləcək: ${products.length}${dryRun ? ' (DRY RUN)' : ''}`);

  const prisma = new PrismaService();
  await prisma.$connect();
  // Meili host-u QƏSDƏN localhost-dur: `search.service.ts:94` məhz localhost-u
  // «konfiqurasiya olunmayıb» sayır və indeksləmə no-op olur. Boş sətir vermək OLMAZ —
  // MeiliSearch klienti konstruktorda «The provided host is not valid» atır (ölçüldü).
  const search = new SearchService(prisma, {
    get: () => ({ host: 'http://localhost:7700', key: '' }),
  } as never);
  const erp = new ErpService(prisma, search);

  try {
    await assertCategoriesExist(prisma);

    const { store, integration } = await ensureStore(prisma, dryRun);
    if (!dryRun && (!store || !integration)) throw new Error('Mağaza/inteqrasiya qurulmadı');
    console.log(`Mağaza: ${store?.name ?? '(dry run)'} · təsdiqli: ${store?.isVerified ?? '-'}`);

    const ctx = store
      ? { id: integration!.id, store: { id: store.id, ownerId: store.ownerId, isVerified: store.isVerified } }
      : null;

    let ok = 0;
    const skipped: { name: string; why: string }[] = [];
    const failed: { name: string; why: string }[] = [];

    for (const [i, p] of products.entries()) {
      const dto = toPublishDto(p);
      if ('skip' in dto) {
        skipped.push({ name: p.name, why: dto.skip });
        continue;
      }
      if (dryRun || !ctx) {
        ok++;
      } else {
        try {
          await erp.publish(ctx, dto);
          ok++;
        } catch (e) {
          failed.push({ name: p.name, why: e instanceof Error ? e.message : String(e) });
        }
      }
      if ((i + 1) % 200 === 0) console.log(`  ... ${i + 1}/${products.length}`);
    }

    console.log(`\nNƏTİCƏ: uğurlu ${ok} · buraxılan ${skipped.length} · uğursuz ${failed.length}`);
    for (const s of skipped.slice(0, 10)) console.log(`  BURAXILDI: ${s.name.slice(0, 50)} — ${s.why}`);
    for (const f of failed.slice(0, 15)) console.log(`  UĞURSUZ:  ${f.name.slice(0, 50)} — ${f.why}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
