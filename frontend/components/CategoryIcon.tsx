import type { LucideIcon } from 'lucide-react';
import {
  Anchor, Armchair, Backpack, Baby, Bike, Bird, Blinds, Bone, Book, Briefcase,
  Building2, Calculator, Car, Cat, Cigarette, CircleDot, Cog, Dog, DoorOpen,
  Droplets, Dumbbell, Factory, Fish, Footprints, Gamepad2, Gem, GraduationCap,
  Hammer, Headphones, HeartPulse, Home, Hotel, Laptop, Lamp, Layers, MapPin,
  Megaphone, Monitor, Music, Package, PawPrint, Plug, Rat, Refrigerator, Ruler,
  Scale, Scissors, Ship, ShoppingBag, Shirt, Smartphone, Sofa, Sprout, Store,
  Stethoscope, Thermometer, Ticket, ToyBrick, Tractor, Truck, Tv, Utensils,
  Warehouse, WashingMachine, Watch, Wheat, Wrench,
} from 'lucide-react';

/**
 * KATEQORİYA İKONU — VAHİD SİSTEM.
 *
 * NİYƏ AYRICA KOMPONENT: əvvəl hər səhifə öz ikon xəritəsini saxlayırdı
 * (`CategoryTiles`, `MegaMenu`, `app/elanlar/page.tsx` — üç ayrı `Record`).
 * Nəticədə iki defekt vardı:
 *   1. Xəritələr uzlaşmırdı — eyni kateqoriya səhifədən-səhifəyə fərqli ikon alırdı.
 *   2. Alt-kateqoriya xəritədə yoxdursa VALİDEYNİN ikonuna düşürdü, ona görə
 *      «Nəqliyyat» landinqində Su nəqliyyatı, Təkərlər, Ehtiyat hissələri —
 *      HAMISI eyni maşın ikonu göstərirdi (canlı ekranda müşahidə olundu).
 * İndi tək mənbə var: 13 kök + 89 alt-kateqoriyanın hamısı açıq xəritələnib,
 * naməlum slug üçün isə ada/sluga görə açar söz uyğunlaşması işləyir.
 *
 * NİYƏ BU GÖRÜNÜŞ: əvvəlki forma «solğun mavi dairə + 1.5px nazik xətt» idi —
 * kiçik ölçüdə demək olar görünmürdü və interfeysi cılız göstərirdi. İndi
 * qradiyentli plitə + AĞ, QALIN qlif: kiçik ölçüdə də oxunur, mobil ekranda da
 * kontrastlıdır. Rənglər kateqoriya AİLƏSİNƏ görə dəyişir (alt-kateqoriya
 * valideynin rəngini miras alır) — beləliklə şəbəkə rəngarəng, amma sistemlidir:
 * forma, doyma və parlaqlıq bütün plitələrdə eynidir.
 */

/**
 * Ailə rəngləri — hər cüt [tünd, açıq]. 13 kateqoriya çarxın 13 ayrı nöqtəsindən
 * götürülüb, amma HAMISI eyni doyma/parlaqlıq zolağındadır — ona görə şəbəkə
 * rəngarəng görünür, «çirkli» yox. Nəqliyyat qəsdən BREND rəngindədir
 * (əsas vertikaldır), qalanları ondan uzaqlaşdıqca fərqlənir.
 */
const FAMILY_GRADIENT: Record<string, [string, string]> = {
  // Nəqliyyat əsas vertikaldır → BREND rəngini daşıyır. Sabit hex DEYİL,
  // aktiv temanın CSS dəyişənidir: brend rəngi dəyişəndə bu da avtomatik dəyişir.
  neqliyyat: ['rgb(var(--tap-500))', 'rgb(var(--tap-300))'],
  'dasinmaz-emlak': ['#2563EB', '#6FA8FF'],   // göy
  'is-elanlari': ['#E08A00', '#FFC658'],      // kəhrəba
  elektronika: ['#0E9BB8', '#4FE0EE'],        // firuzəyi
  'ev-bag': ['#0E9F6E', '#57E0A2'],           // zümrüd
  'shexsi-esyalar': ['#DB2777', '#FF8FC4'],   // çəhrayı
  'usaq-alemi': ['#F97316', '#FFB574'],       // narıncı
  heyvanlar: ['#65A30D', '#BEF264'],          // laym
  'tikinti-temir': ['#52606D', '#9FB0C0'],    // polad
  'hobbi-asude': ['#A21CAF', '#E879F9'],      // fuksiya
  'biznes-avadanliq': ['#0D9488', '#45E3D0'], // teal
  'kend-teserrufati': ['#16A34A', '#74E8A3'], // yaşıl
  xidmetler: ['#4F46E5', '#9A93F7'],          // indiqo
};

const DEFAULT_GRADIENT: [string, string] = ['rgb(var(--tap-500))', 'rgb(var(--tap-300))'];

/** Alt-kateqoriya → kök ailə. Rəng miras qalır, ikon isə özünəməxsusdur. */
const FAMILY_OF: Record<string, string> = {};
function registerFamily(family: string, children: string[]) {
  FAMILY_OF[family] = family;
  for (const c of children) FAMILY_OF[c] = family;
}

registerFamily('neqliyyat', [
  'avtomobiller', 'motosikletler', 'qosqu-karvan', 'yuk-avtobus', 'xususi-texnika',
  'su-neqliyyati', 'ehtiyat-hisseleri', 'tekerler-diskler',
]);
registerFamily('dasinmaz-emlak', [
  'menziller', 'heyet-evleri', 'bag-evleri', 'obyekt-ofis', 'qaraj-parking',
  'torpaq', 'xaricde-emlak',
]);
registerFamily('is-elanlari', [
  'is-fehle', 'is-gozellik', 'is-inzibati', 'is-it', 'is-logistika', 'is-maliyye',
  'is-marketinq', 'is-medicina', 'is-satis', 'is-tehsil', 'is-tikinti', 'is-xidmet',
]);
registerFamily('elektronika', [
  'telefonlar', 'komputerler', 'tv-audio', 'mesisat-texnikasi', 'oyun-konsollar', 'oyun-proqram',
]);
registerFamily('ev-bag', [
  'mebel', 'iri-texnika', 'xirda-texnika', 'qab-qacaq', 'tekstil-xalca',
  'isiq-dekor', 'bag-bostan',
]);
registerFamily('shexsi-esyalar', [
  'qadin-geyim', 'kishi-geyim', 'ayaqqabi', 'aksesuar', 'saatlar', 'zergerlik',
  'gozellik-saglamliq', 'elektron-siqaret',
]);
registerFamily('usaq-alemi', [
  'usaq-geyim', 'oyuncaqlar', 'usaq-arabalari', 'usaq-avtokreslo', 'usaq-mebel', 'mekteb',
]);
registerFamily('heyvanlar', [
  'pishikler', 'itler', 'qushlar', 'akvarium', 'gemiriciler', 'atlar',
  'kt-heyvanlari', 'heyvan-mehsullari',
]);
registerFamily('tikinti-temir', [
  'tikinti-materiallari', 'aletler', 'santexnika', 'elektrik', 'qapi-pencere',
  'istilik-kondisioner',
]);
registerFamily('hobbi-asude', [
  'idman-turizm', 'velosipedler', 'kitablar', 'musiqi-aletleri', 'antikvariat',
  'ovculuq-baliqciliq', 'biletler',
]);
registerFamily('biznes-avadanliq', [
  'hazir-biznes', 'ofis-avadanliq', 'senaye-avadanliq', 'ticaret-avadanliq',
]);
registerFamily('kend-teserrufati', ['kt-texnika', 'toxum-bitki', 'gubre']);
registerFamily('xidmetler', [
  'temir-xidmet', 'neqliyyat-xidmet', 'gozellik-xidmet', 'tehsil-xidmet',
  'it-xidmet', 'huquqi-xidmet', 'tedbir-xidmet',
]);

/** Hər slug üçün ÖZ ikonu — bu xəritə «valideynə düşmə» defektini aradan qaldırır. */
const ICON: Record<string, LucideIcon> = {
  // Kök
  neqliyyat: Car, 'dasinmaz-emlak': Building2, 'is-elanlari': Briefcase,
  elektronika: Smartphone, 'ev-bag': Sofa, 'shexsi-esyalar': Shirt,
  'usaq-alemi': Baby, heyvanlar: PawPrint, 'tikinti-temir': Hammer,
  'hobbi-asude': Gamepad2, 'biznes-avadanliq': Factory, 'kend-teserrufati': Sprout,
  xidmetler: Wrench,

  // Nəqliyyat
  avtomobiller: Car, motosikletler: Bike, 'qosqu-karvan': Package,
  'yuk-avtobus': Truck, 'xususi-texnika': Tractor, 'su-neqliyyati': Ship,
  'ehtiyat-hisseleri': Cog, 'tekerler-diskler': CircleDot,

  // Daşınmaz əmlak
  menziller: Building2, 'heyet-evleri': Home, 'bag-evleri': Home,
  'obyekt-ofis': Store, 'qaraj-parking': Warehouse, torpaq: MapPin,
  'xaricde-emlak': Hotel,

  // İş elanları
  'is-fehle': Package, 'is-gozellik': Scissors, 'is-inzibati': Briefcase,
  'is-it': Laptop, 'is-logistika': Truck, 'is-maliyye': Calculator,
  'is-marketinq': Megaphone, 'is-medicina': Stethoscope, 'is-satis': ShoppingBag,
  'is-tehsil': GraduationCap, 'is-tikinti': Hammer, 'is-xidmet': Utensils,

  // Elektronika
  telefonlar: Smartphone, komputerler: Laptop, 'tv-audio': Tv,
  'mesisat-texnikasi': WashingMachine, 'oyun-konsollar': Gamepad2, 'oyun-proqram': Monitor,

  // Ev və bağ
  mebel: Sofa, 'iri-texnika': Refrigerator, 'xirda-texnika': Headphones,
  'qab-qacaq': Utensils, 'tekstil-xalca': Blinds, 'isiq-dekor': Lamp,
  'bag-bostan': Sprout,

  // Şəxsi əşyalar
  'qadin-geyim': Shirt, 'kishi-geyim': Shirt, ayaqqabi: Footprints,
  aksesuar: Backpack, saatlar: Watch, zergerlik: Gem,
  'gozellik-saglamliq': HeartPulse, 'elektron-siqaret': Cigarette,

  // Uşaq aləmi
  'usaq-geyim': Shirt, oyuncaqlar: ToyBrick, 'usaq-arabalari': Baby,
  'usaq-avtokreslo': Armchair, 'usaq-mebel': Armchair, mekteb: Backpack,

  // Heyvanlar
  pishikler: Cat, itler: Dog, qushlar: Bird, akvarium: Fish,
  gemiriciler: Rat, atlar: PawPrint, 'kt-heyvanlari': Wheat,
  'heyvan-mehsullari': Bone,

  // Tikinti və təmir
  'tikinti-materiallari': Layers, aletler: Wrench, santexnika: Droplets,
  elektrik: Plug, 'qapi-pencere': DoorOpen, 'istilik-kondisioner': Thermometer,

  // Hobbi və asudə
  'idman-turizm': Dumbbell, velosipedler: Bike, kitablar: Book,
  'musiqi-aletleri': Music, antikvariat: Gem, 'ovculuq-baliqciliq': Anchor,
  biletler: Ticket,

  // Biznes və avadanlıq
  'hazir-biznes': Store, 'ofis-avadanliq': Monitor, 'senaye-avadanliq': Factory,
  'ticaret-avadanliq': ShoppingBag,

  // Kənd təsərrüfatı
  'kt-texnika': Tractor, 'toxum-bitki': Sprout, gubre: Droplets,

  // Xidmətlər
  'temir-xidmet': Hammer, 'neqliyyat-xidmet': Truck, 'gozellik-xidmet': Scissors,
  'tehsil-xidmet': GraduationCap, 'it-xidmet': Laptop, 'huquqi-xidmet': Scale,
  'tedbir-xidmet': Ticket,
};

/**
 * Açar söz ehtiyatı — backend yeni kateqoriya əlavə edəndə ikon YENƏ də mənalı olsun.
 * Slug və ad birlikdə yoxlanılır, çünki yeni slug latın, ad isə azərbaycanca gəlir.
 * Sıra ƏHƏMİYYƏTLİDİR: daha spesifik açar söz əvvəl gəlməlidir
 * (məs. «avtomobil» «avto»dan, «usaq» «geyim»dən əvvəl).
 */
const KEYWORD_ICON: [RegExp, LucideIcon][] = [
  [/avtomobil|masin|sedan/, Car],
  [/motosiklet|moped|velosiped/, Bike],
  [/gemi|qayiq|su.?neqliyyat|yaxta/, Ship],
  [/teker|disk|sin\b/, CircleDot],
  [/ehtiyat|hisse|zapcast/, Cog],
  [/yuk|avtobus|kamyon|logistik|catdirilma/, Truck],
  [/traktor|kombayn|xususi.?texnika|kt.?texnika/, Tractor],
  [/menzil|bina|ofis|obyekt/, Building2],
  [/ev\b|villa|hyet|heyet|bag.?ev/, Home],
  [/torpaq|sahe/, MapPin],
  [/qaraj|parking|anbar/, Warehouse],
  [/telefon|smartfon/, Smartphone],
  [/komputer|noutbuk|laptop/, Laptop],
  [/televizor|tv\b|audio|video/, Tv],
  [/soyuducu|paltaryuyan|meisat|mesisat/, WashingMachine],
  [/oyun|konsol|playstation/, Gamepad2],
  [/mebel|divan|kres/, Sofa],
  [/isiq|lampa|dekor/, Lamp],
  [/qab|qacaq|metbex/, Utensils],
  [/xalca|tekstil|parda/, Blinds],
  [/ayaqqabi|bots|kraso/, Footprints],
  [/saat\b/, Watch],
  [/zerger|bijuter|qizil|brilyant/, Gem],
  [/canta|aksesuar|portfel/, Backpack],
  [/geyim|paltar|koynek/, Shirt],
  [/gozellik|saglamliq|kosmetik/, HeartPulse],
  [/siqaret|vape/, Cigarette],
  [/oyuncaq/, ToyBrick],
  [/usaq|korpe|araba/, Baby],
  [/mekteb|tehsil|kurs|repetitor/, GraduationCap],
  [/pisik|kucuk/, Cat],
  [/it\b|kopek/, Dog],
  [/qus|toyuq/, Bird],
  [/baliq|akvarium/, Fish],
  [/at\b|heyvan/, PawPrint],
  [/santexnika|su\b|kanaliz|gubre/, Droplets],
  [/elektrik|kabel|rozet/, Plug],
  [/qapi|pencere/, DoorOpen],
  [/istilik|kondisioner|kombi/, Thermometer],
  [/alet|dril|perforator/, Wrench],
  [/tikinti|material|kerpic|temir/, Hammer],
  [/idman|fitnes|turizm/, Dumbbell],
  [/kitab|jurnal/, Book],
  [/musiqi|gitara|piano/, Music],
  [/bilet|seyahet|tur\b/, Ticket],
  [/ov\b|ovculuq|baliqciliq/, Anchor],
  [/antikvar|kolleksiya/, Gem],
  [/toxum|bitki|ekin|bostan/, Sprout],
  [/taxil|bugda|arpa/, Wheat],
  [/senaye|zavod|istehsal/, Factory],
  [/ticaret|magaza|satis/, ShoppingBag],
  [/maliyye|muhasib|kredit/, Calculator],
  [/huquq|vekil|notarius/, Scale],
  [/tibb|hekim|eczaci/, Stethoscope],
  [/marketinq|reklam|pr\b/, Megaphone],
  [/restoran|kafe|xidmet/, Utensils],
  [/berber|salon/, Scissors],
  [/olcu|layihe/, Ruler],
  [/is\b|vakansiya|kadr/, Briefcase],
];

function normalize(v: string): string {
  return v
    .toLowerCase()
    .replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/ğ/g, 'g').replace(/ş/g, 's').replace(/ç/g, 'c');
}

/** Slug xəritədə yoxdursa ada/sluga görə axtarılır; heç nə tapılmasa neytral `Layers`. */
export function resolveCategoryIcon(slug?: string | null, name?: string | null): LucideIcon {
  if (slug && ICON[slug]) return ICON[slug];
  const haystack = normalize(`${slug ?? ''} ${name ?? ''}`);
  for (const [re, icon] of KEYWORD_ICON) if (re.test(haystack)) return icon;
  return Layers;
}

/** Ailə rəngi: alt-kateqoriya valideynin rəngini miras alır (vizual qruplaşma). */
export function resolveCategoryGradient(slug?: string | null): [string, string] {
  const family = slug ? FAMILY_OF[slug] : undefined;
  return (family && FAMILY_GRADIENT[family]) || DEFAULT_GRADIENT;
}

const SIZE = {
  sm: { box: 'h-9 w-9 rounded-[10px]', icon: 'h-[18px] w-[18px]', glow: '0 3px 8px -2px' },
  md: { box: 'h-12 w-12 rounded-[14px]', icon: 'h-6 w-6', glow: '0 5px 12px -3px' },
  lg: { box: 'h-14 w-14 rounded-2xl', icon: 'h-7 w-7', glow: '0 8px 18px -5px' },
} as const;

/**
 * Rəngli işıq kölgəsi ailə rəngindən törəyir.
 * İki formanı da qəbul edir: sabit `#RRGGBB` və tema dəyişəni `rgb(var(--tap-500))`
 * — ikincisi brend ailəsi üçündür və tema dəyişəndə kölgə də onunla dəyişir.
 */
function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const n = parseInt(color.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  return color.replace(/\)$/, ` / ${alpha})`);
}

export default function CategoryIcon({
  slug,
  name,
  size = 'md',
  className = '',
}: {
  slug?: string | null;
  name?: string | null;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const Icon = resolveCategoryIcon(slug, name);
  const [from, to] = resolveCategoryGradient(slug);
  const s = SIZE[size];

  return (
    /*
     * CANLILIQ ÜÇ QATDAN GƏLİR (düz rəngli plitə «ölü» görünürdü):
     *  1. Diaqonal qradiyent — həcm hissi verir;
     *  2. Sol-yuxarıdan gələn parıltı (radial ağ) — işıq mənbəyi illüziyası,
     *     Avito-nun 3D illüstrasiyalarının oxşar effektini illüstrasiya
     *     kopyalamadan yaradır;
     *  3. Ailə rəngindən törəyən İŞIQLI kölgə — plitə boz fonun üstündə «üzür».
     * Hover-də (valideyn `group`) kölgə güclənir — CSS dəyişəni ilə ötürülür ki,
     * inline `style` ilə hover ifadə edilə bilməməsi problemi yaranmasın.
     */
    <span
      className={`group/icon relative grid shrink-0 place-items-center overflow-hidden ${s.box} ${className} transition-shadow duration-200`}
      style={{
        // Qradiyent inline-dır, çünki hər ailə üçün fərqli cütdür — Tailwind sinif
        // adı ilə ifadə edilsə 13 ayrı dinamik ad JIT tərəfindən görünməzdi.
        backgroundImage: `linear-gradient(140deg, ${from} 0%, ${to} 100%)`,
        boxShadow: `${s.glow} ${withAlpha(from, 0.55)}`,
      }}
      aria-hidden="true"
    >
      {/* Parıltı qatı — qlifin ALTINDA qalır ki, onu solğunlaşdırmasın. */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 28% 18%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.14) 38%, rgba(255,255,255,0) 62%)',
        }}
      />
      {/* strokeWidth 2.25 — nazik 1.5px xətt kiçik ölçüdə itirdi; qalın ağ qlif
          qradiyentin üstündə hər ekranda oxunur. `drop-shadow` qlifi parıltıdan ayırır. */}
      <Icon className={`relative ${s.icon} text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]`} strokeWidth={2.25} />
    </span>
  );
}
