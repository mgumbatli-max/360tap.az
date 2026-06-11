// Kateqoriya ağacı — Tap.az / Avito / OLX praktikasına əsaslanan zəngin taksonomiya.
// 13 kök + ~90 alt-bölmə. Dynamic attribute-lar əsas vertical leaf-lərdə (admin paneldən genişlənir).
import type { AttributeType } from '@prisma/client';

export interface SeedAttr {
  key: string;
  labelAz: string;
  type: AttributeType;
  options?: string[];
  unit?: string;
  isFilterable?: boolean;
  isSearchable?: boolean;
  isRequired?: boolean;
}
export interface SeedCategory {
  slug: string;
  nameAz: string;
  vertical: 'transport' | 'realestate' | 'job' | 'universal';
  icon?: string;
  attributes?: SeedAttr[];
  children?: SeedCategory[];
}

// qısa köməkçi
const c = (
  slug: string,
  nameAz: string,
  vertical: SeedCategory['vertical'],
  children?: SeedCategory[],
  attributes?: SeedAttr[],
  icon?: string,
): SeedCategory => ({ slug, nameAz, vertical, children, attributes, icon });

const CAR_ATTRS: SeedAttr[] = [
  { key: 'brand', labelAz: 'Marka', type: 'select', isSearchable: true },
  { key: 'model', labelAz: 'Model', type: 'select', isSearchable: true },
  { key: 'year', labelAz: 'Buraxılış ili', type: 'number', unit: 'il' },
  { key: 'mileage', labelAz: 'Yürüş', type: 'number', unit: 'km' },
  { key: 'fuel', labelAz: 'Yanacaq növü', type: 'select', options: ['Benzin', 'Dizel', 'Qaz', 'Hibrid', 'Elektro'] },
  { key: 'transmission', labelAz: 'Sürətlər qutusu', type: 'select', options: ['Mexaniki', 'Avtomat', 'Robot', 'Variator'] },
  { key: 'body', labelAz: 'Ban növü', type: 'select', options: ['Sedan', 'Hetçbek', 'Universal', 'Krossover', 'Offroader', 'Pikap', 'Kupe', 'Mikroavtobus'] },
  { key: 'color', labelAz: 'Rəng', type: 'select', options: ['Ağ', 'Qara', 'Boz', 'Gümüşü', 'Qırmızı', 'Mavi', 'Yaşıl', 'Digər'] },
  { key: 'no_accident', labelAz: 'Vuruğu yoxdur', type: 'boolean' },
  { key: 'not_painted', labelAz: 'Rənglənməyib', type: 'boolean' },
  { key: 'credit', labelAz: 'Kredit', type: 'boolean' },
  { key: 'barter', labelAz: 'Barter', type: 'boolean' },
];

const FLAT_ATTRS: SeedAttr[] = [
  { key: 'deal_type', labelAz: 'Əməliyyat', type: 'select', options: ['Alış', 'Kirayə', 'Günlük'] },
  { key: 'rooms', labelAz: 'Otaq sayı', type: 'number' },
  { key: 'area', labelAz: 'Sahə', type: 'number', unit: 'm²' },
  { key: 'floor', labelAz: 'Mərtəbə', type: 'number' },
  { key: 'total_floors', labelAz: 'Binanın mərtəbə sayı', type: 'number' },
  { key: 'repair', labelAz: 'Təmir', type: 'select', options: ['Təmirli', 'Təmirsiz', 'Orta'] },
  { key: 'has_extract', labelAz: 'Çıxarış', type: 'boolean' },
  { key: 'has_mortgage', labelAz: 'İpoteka', type: 'boolean' },
];

const PHONE_ATTRS: SeedAttr[] = [
  { key: 'brand', labelAz: 'Marka', type: 'select', options: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Honor', 'Realme', 'Nokia', 'Digər'], isSearchable: true },
  { key: 'memory', labelAz: 'Yaddaş', type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
  { key: 'condition', labelAz: 'Vəziyyəti', type: 'select', options: ['Yeni', 'İşlənmiş'] },
];

const JOB_ATTRS: SeedAttr[] = [
  { key: 'salary_min', labelAz: 'Maaş (min)', type: 'number', unit: 'AZN' },
  { key: 'salary_max', labelAz: 'Maaş (max)', type: 'number', unit: 'AZN' },
  { key: 'schedule', labelAz: 'İş qrafiki', type: 'select', options: ['Tam ştat', 'Yarım ştat', 'Uzaqdan', 'Növbəli', 'Layihə üzrə'] },
  { key: 'experience', labelAz: 'Təcrübə', type: 'select', options: ['Təcrübəsiz', '1 ilədək', '1-3 il', '3-5 il', '5+ il'] },
];

const COND: SeedAttr = { key: 'condition', labelAz: 'Vəziyyəti', type: 'select', options: ['Yeni', 'İşlənmiş'] };
const LAPTOP_ATTRS: SeedAttr[] = [
  { key: 'brand', labelAz: 'Marka', type: 'select', options: ['Apple', 'Asus', 'HP', 'Lenovo', 'Dell', 'Acer', 'MSI', 'Digər'] },
  { key: 'ram', labelAz: 'RAM', type: 'select', options: ['8GB', '16GB', '32GB', '64GB'] },
  COND,
];
const TABLET_ATTRS: SeedAttr[] = [
  { key: 'brand', labelAz: 'Marka', type: 'select', options: ['Apple', 'Samsung', 'Huawei', 'Lenovo', 'Digər'] },
  COND,
];
const TV_ATTRS: SeedAttr[] = [
  { key: 'brand', labelAz: 'Marka', type: 'select', options: ['Samsung', 'LG', 'Sony', 'Xiaomi', 'TCL', 'Digər'] },
  { key: 'screen', labelAz: 'Ekran ölçüsü', type: 'select', options: ['32"', '43"', '50"', '55"', '65"', '75"'] },
];
const MOTO_ATTRS: SeedAttr[] = [
  { key: 'brand', labelAz: 'Marka', type: 'select', options: ['Honda', 'Yamaha', 'Suzuki', 'BMW', 'KTM', 'Digər'] },
  { key: 'year', labelAz: 'Buraxılış ili', type: 'number', unit: 'il' },
];
const HOUSE_ATTRS: SeedAttr[] = [
  { key: 'deal_type', labelAz: 'Əməliyyat', type: 'select', options: ['Alış', 'Kirayə', 'Günlük'] },
  { key: 'rooms', labelAz: 'Otaq sayı', type: 'number' },
  { key: 'area', labelAz: 'Sahə', type: 'number', unit: 'm²' },
];
const LAND_ATTRS: SeedAttr[] = [
  { key: 'deal_type', labelAz: 'Əməliyyat', type: 'select', options: ['Alış', 'Kirayə'] },
  { key: 'area', labelAz: 'Sahə', type: 'number', unit: 'sot' },
];
const APPLIANCE_ATTRS: SeedAttr[] = [
  { key: 'brand', labelAz: 'Marka', type: 'select', options: ['Bosch', 'Samsung', 'LG', 'Beko', 'Indesit', 'Whirlpool', 'Digər'] },
  COND,
];
const CLOTHING_ATTRS: SeedAttr[] = [
  { key: 'size', labelAz: 'Ölçü', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  COND,
];
const SHOE_ATTRS: SeedAttr[] = [
  { key: 'size', labelAz: 'Ölçü', type: 'select', options: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'] },
  COND,
];
const BIKE_ATTRS: SeedAttr[] = [
  { key: 'brand', labelAz: 'Marka', type: 'select', options: ['Trek', 'Giant', 'Merida', 'Cube', 'Scott', 'Digər'] },
  COND,
];

export const CATEGORIES: SeedCategory[] = [
  // 1) NƏQLİYYAT
  c('neqliyyat', 'Nəqliyyat', 'transport', [
    c('avtomobiller', 'Avtomobillər', 'transport', undefined, CAR_ATTRS),
    c('motosikletler', 'Motosiklet və mopedlər', 'transport', undefined, MOTO_ATTRS),
    c('yuk-avtobus', 'Yük maşınları və avtobuslar', 'transport'),
    c('xususi-texnika', 'Xüsusi texnika', 'transport'),
    c('su-neqliyyati', 'Su nəqliyyatı', 'transport'),
    c('ehtiyat-hisseleri', 'Ehtiyat hissələri və aksesuarlar', 'transport'),
    c('tekerler-diskler', 'Təkərlər və disklər', 'transport'),
  ], undefined, 'car'),

  // 2) DAŞINMAZ ƏMLAK
  c('dasinmaz-emlak', 'Daşınmaz əmlak', 'realestate', [
    c('menziller', 'Mənzillər', 'realestate', undefined, FLAT_ATTRS),
    c('heyet-evleri', 'Həyət evləri və villalar', 'realestate', undefined, HOUSE_ATTRS),
    c('torpaq', 'Torpaq sahələri', 'realestate', undefined, LAND_ATTRS),
    c('obyekt-ofis', 'Obyektlər və ofislər', 'realestate'),
    c('qaraj-parking', 'Qarajlar və parkinqlər', 'realestate'),
    c('xaricde-emlak', 'Xaricdə əmlak', 'realestate'),
  ], undefined, 'home'),

  // 3) İŞ ELANLARI
  c('is-elanlari', 'İş elanları', 'job', [
    c('is-it', 'İT, internet, telekom', 'job', undefined, JOB_ATTRS),
    c('is-satis', 'Satış və ticarət', 'job', undefined, JOB_ATTRS),
    c('is-marketinq', 'Marketinq, reklam, PR', 'job', undefined, JOB_ATTRS),
    c('is-maliyye', 'Maliyyə, mühasibatlıq', 'job', undefined, JOB_ATTRS),
    c('is-inzibati', 'İnzibati, ofis, HR', 'job', undefined, JOB_ATTRS),
    c('is-tikinti', 'Tikinti, təmir', 'job', undefined, JOB_ATTRS),
    c('is-logistika', 'Nəqliyyat, logistika', 'job', undefined, JOB_ATTRS),
    c('is-gozellik', 'Gözəllik, sağlamlıq', 'job', undefined, JOB_ATTRS),
    c('is-tehsil', 'Təhsil, elm', 'job', undefined, JOB_ATTRS),
    c('is-xidmet', 'Restoran, xidmət, turizm', 'job', undefined, JOB_ATTRS),
    c('is-fehle', 'Fəhlə, anbar, təhlükəsizlik', 'job', undefined, JOB_ATTRS),
  ], undefined, 'briefcase'),

  // 4) ELEKTRONİKA
  c('elektronika', 'Elektronika', 'universal', [
    c('telefonlar', 'Telefonlar və aksesuarlar', 'universal', [
      c('mobil-telefonlar', 'Mobil telefonlar', 'universal', undefined, PHONE_ATTRS),
      c('planshetler', 'Planşetlər', 'universal', undefined, TABLET_ATTRS),
      c('smart-saatlar', 'Smart saatlar və qoldaqlar', 'universal'),
      c('telefon-aksesuar', 'Aksesuarlar', 'universal'),
      c('telefon-ehtiyat', 'Ehtiyat hissələri', 'universal'),
    ]),
    c('komputerler', 'Kompüterlər', 'universal', [
      c('noutbuklar', 'Noutbuklar', 'universal', undefined, LAPTOP_ATTRS),
      c('masaustu', 'Masaüstü kompüterlər', 'universal', undefined, LAPTOP_ATTRS),
      c('monitorlar', 'Monitorlar', 'universal'),
      c('komplektlesdirici', 'Komplektləşdirici', 'universal'),
      c('periferiya', 'Periferiya və aksesuar', 'universal'),
      c('shebeke', 'Şəbəkə avadanlığı', 'universal'),
    ]),
    c('tv-audio', 'TV, audio, video', 'universal', [
      c('televizorlar', 'Televizorlar', 'universal', undefined, TV_ATTRS),
      c('audio', 'Audio sistemlər', 'universal'),
      c('foto-video', 'Foto və video kameralar', 'universal'),
    ]),
    c('oyun-konsollar', 'Oyun konsolları və oyunlar', 'universal'),
    c('mesisat-texnikasi', 'Məişət texnikası', 'universal'),
  ], undefined, 'smartphone'),

  // 5) EV VƏ BAĞ
  c('ev-bag', 'Ev və bağ', 'universal', [
    c('mebel', 'Mebel', 'universal', undefined, [COND]),
    c('iri-texnika', 'İri məişət texnikası', 'universal', undefined, APPLIANCE_ATTRS),
    c('xirda-texnika', 'Xırda məişət texnikası', 'universal', undefined, APPLIANCE_ATTRS),
    c('qab-qacaq', 'Qab-qacaq və mətbəx', 'universal'),
    c('tekstil-xalca', 'Tekstil və xalçalar', 'universal'),
    c('isiq-dekor', 'İşıqlandırma və dekor', 'universal'),
    c('bag-bostan', 'Bağ və bostan', 'universal'),
  ], undefined, 'sofa'),

  // 6) ŞƏXSİ ƏŞYALAR
  c('shexsi-esyalar', 'Şəxsi əşyalar', 'universal', [
    c('qadin-geyim', 'Qadın geyimi', 'universal', undefined, CLOTHING_ATTRS),
    c('kishi-geyim', 'Kişi geyimi', 'universal', undefined, CLOTHING_ATTRS),
    c('ayaqqabi', 'Ayaqqabı', 'universal', undefined, SHOE_ATTRS),
    c('aksesuar', 'Aksesuar və çantalar', 'universal'),
    c('saatlar', 'Saatlar', 'universal'),
    c('zergerlik', 'Zərgərlik və bijuteriya', 'universal'),
    c('gozellik-saglamliq', 'Gözəllik və sağlamlıq', 'universal'),
  ], undefined, 'shirt'),

  // 7) UŞAQ ALƏMİ
  c('usaq-alemi', 'Uşaq aləmi', 'universal', [
    c('usaq-geyim', 'Uşaq geyimi və ayaqqabısı', 'universal'),
    c('oyuncaqlar', 'Oyuncaqlar', 'universal'),
    c('usaq-arabalari', 'Uşaq arabaları', 'universal'),
    c('usaq-mebel', 'Uşaq mebeli', 'universal'),
    c('mekteb', 'Məktəb ləvazimatları', 'universal'),
  ], undefined, 'baby'),

  // 8) HEYVANLAR
  c('heyvanlar', 'Heyvanlar', 'universal', [
    c('itler', 'İtlər', 'universal'),
    c('pishikler', 'Pişiklər', 'universal'),
    c('qushlar', 'Quşlar', 'universal'),
    c('akvarium', 'Akvarium', 'universal'),
    c('kt-heyvanlari', 'Kənd təsərrüfatı heyvanları', 'universal'),
    c('heyvan-mehsullari', 'Heyvanlar üçün məhsullar', 'universal'),
  ], undefined, 'paw'),

  // 9) TİKİNTİ VƏ TƏMİR
  c('tikinti-temir', 'Tikinti və təmir', 'universal', [
    c('tikinti-materiallari', 'Tikinti materialları', 'universal'),
    c('aletler', 'Alətlər', 'universal'),
    c('santexnika', 'Santexnika', 'universal'),
    c('elektrik', 'Elektrik məhsulları', 'universal'),
    c('qapi-pencere', 'Qapı və pəncərələr', 'universal'),
  ], undefined, 'drill'),

  // 10) HOBBİ VƏ ASUDƏ
  c('hobbi-asude', 'Hobbi və asudə', 'universal', [
    c('idman-turizm', 'İdman və turizm', 'universal'),
    c('velosipedler', 'Velosipedlər', 'universal', undefined, BIKE_ATTRS),
    c('musiqi-aletleri', 'Musiqi alətləri', 'universal'),
    c('kitablar', 'Kitablar və jurnallar', 'universal'),
    c('antikvariat', 'Antikvariat və kolleksiya', 'universal'),
    c('biletler', 'Biletlər və səyahət', 'universal'),
  ], undefined, 'dumbbell'),

  // 11) BİZNES VƏ AVADANLIQ
  c('biznes-avadanliq', 'Biznes və avadanlıq', 'universal', [
    c('ticaret-avadanliq', 'Ticarət avadanlığı', 'universal'),
    c('senaye-avadanliq', 'Sənaye avadanlığı', 'universal'),
    c('hazir-biznes', 'Hazır biznes', 'universal'),
    c('ofis-avadanliq', 'Ofis avadanlığı', 'universal'),
  ], undefined, 'building'),

  // 12) KƏND TƏSƏRRÜFATI
  c('kend-teserrufati', 'Kənd təsərrüfatı', 'universal', [
    c('kt-texnika', 'Kənd təsərrüfatı texnikası', 'universal'),
    c('toxum-bitki', 'Toxum və bitkilər', 'universal'),
    c('gubre', 'Gübrə və kimyəvi maddələr', 'universal'),
  ], undefined, 'sprout'),

  // 13) XİDMƏTLƏR
  c('xidmetler', 'Xidmətlər', 'universal', [
    c('temir-xidmet', 'Təmir və tikinti xidmətləri', 'universal'),
    c('neqliyyat-xidmet', 'Nəqliyyat və çatdırılma', 'universal'),
    c('gozellik-xidmet', 'Gözəllik və sağlamlıq', 'universal'),
    c('tehsil-xidmet', 'Təhsil və repetitorluq', 'universal'),
    c('tedbir-xidmet', 'Tədbirlərin təşkili', 'universal'),
    c('huquqi-xidmet', 'Hüquqi və maliyyə', 'universal'),
    c('it-xidmet', 'İT və veb xidmətlər', 'universal'),
  ], undefined, 'wrench'),
];
