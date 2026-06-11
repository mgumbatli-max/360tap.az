// Kateqoriya ağacı — Tap.az / Avito / OLX praktikasına əsaslanan zəngin taksonomiya.
// 13 kök + ~117 alt-bölmə. Hər mənalı leaf-də dynamic attribute (filtr) dəsti var.
// Kanonik açarlar (brand/fuel/year/rooms/size/condition...) seed listings ilə uyğundur — DƏYİŞMƏ.
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

// qısa köməkçi (kateqoriya)
const c = (
  slug: string,
  nameAz: string,
  vertical: SeedCategory['vertical'],
  children?: SeedCategory[],
  attributes?: SeedAttr[],
  icon?: string,
): SeedCategory => ({ slug, nameAz, vertical, children, attributes, icon });

// qısa köməkçilər (atribut) — DRY
const sel = (key: string, labelAz: string, options?: string[], extra: Partial<SeedAttr> = {}): SeedAttr =>
  ({ key, labelAz, type: 'select', ...(options ? { options } : {}), ...extra });
const num = (key: string, labelAz: string, unit?: string): SeedAttr =>
  ({ key, labelAz, type: 'number', ...(unit ? { unit } : {}) });
const yes = (key: string, labelAz: string): SeedAttr => ({ key, labelAz, type: 'boolean' });
// marka köməkçisi — həmişə axtarışa açıq (isSearchable), vahid qayda
const brand = (options?: string[], labelAz = 'Marka'): SeedAttr =>
  sel('brand', labelAz, options, { isSearchable: true });

const COND: SeedAttr = sel('condition', 'Vəziyyəti', ['Yeni', 'İşlənmiş']);

// ─────────────────────── NƏQLİYYAT ───────────────────────
const CAR_ATTRS: SeedAttr[] = [
  brand(),
  sel('model', 'Model', undefined, { isSearchable: true }),
  num('year', 'Buraxılış ili', 'il'),
  num('mileage', 'Yürüş', 'km'),
  sel('fuel', 'Yanacaq növü', ['Benzin', 'Dizel', 'Qaz', 'Hibrid', 'Elektro']),
  num('engine_volume', 'Mühərrik həcmi', 'L'),
  sel('transmission', 'Sürətlər qutusu', ['Mexaniki', 'Avtomat', 'Robot', 'Variator']),
  sel('drive', 'Ötürücü', ['Ön', 'Arxa', 'Tam (4x4)']),
  sel('body', 'Ban növü', ['Sedan', 'Hetçbek', 'Universal', 'Krossover', 'Offroader', 'Pikap', 'Kupe', 'Mikroavtobus']),
  sel('color', 'Rəng', ['Ağ', 'Qara', 'Boz', 'Gümüşü', 'Qırmızı', 'Mavi', 'Yaşıl', 'Digər']),
  yes('no_accident', 'Vuruğu yoxdur'),
  yes('not_painted', 'Rənglənməyib'),
  yes('credit', 'Kredit'),
  yes('barter', 'Barter'),
];
const MOTO_ATTRS: SeedAttr[] = [
  brand(['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'BMW', 'KTM', 'Digər']),
  num('year', 'Buraxılış ili', 'il'),
  sel('type', 'Növ', ['Motosiklet', 'Moped', 'Skuter', 'Kvadrosikl (ATV)', 'Digər']),
];
const TRAILER_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Yük qoşqusu', 'Avtokarvan', 'Platforma', 'Sisterna', 'Digər']),
  num('year', 'Buraxılış ili', 'il'),
];
const TRUCK_ATTRS: SeedAttr[] = [
  brand(),
  num('year', 'Buraxılış ili', 'il'),
  sel('type', 'Növ', ['Yük maşını', 'Avtobus', 'Mikroavtobus', 'Refrijerator', 'Tanker', 'Qoşqu', 'Digər']),
  sel('fuel', 'Yanacaq növü', ['Benzin', 'Dizel', 'Qaz', 'Elektro']),
];
const SPECIAL_TECH_ATTRS: SeedAttr[] = [
  sel('type', 'Texnika növü', ['Ekskavator', 'Buldozer', 'Traktor', 'Yükləyici', 'Kran', 'Qreyder', 'Asfalt texnikası', 'Digər']),
  num('year', 'Buraxılış ili', 'il'),
];
const BOAT_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Qayıq', 'Kater', 'Yaxta', 'Su motosikleti', 'Mühərrik', 'Digər']),
  num('year', 'Buraxılış ili', 'il'),
];
const PARTS_ATTRS: SeedAttr[] = [
  sel('part_type', 'Hissə növü', ['Mühərrik', 'Sürət qutusu', 'Yürüş hissəsi', 'Ban', 'Salon', 'Elektrik', 'Optika', 'Şüşə', 'Digər']),
  brand(undefined, 'Avtomobil markası'),
  COND,
];
const WHEEL_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Təkər (komplekt)', 'Şin', 'Disk']),
  sel('season', 'Mövsüm', ['Yay', 'Qış', 'Universal']),
  sel('radius', 'Radius', ['R13', 'R14', 'R15', 'R16', 'R17', 'R18', 'R19', 'R20+']),
  COND,
];

// ─────────────────────── DAŞINMAZ ƏMLAK ───────────────────────
const FLAT_ATTRS: SeedAttr[] = [
  sel('deal_type', 'Əməliyyat', ['Alış', 'Kirayə', 'Günlük']),
  sel('building_type', 'Bina növü', ['Yeni tikili', 'Köhnə tikili']),
  num('rooms', 'Otaq sayı'),
  num('area', 'Sahə', 'm²'),
  num('floor', 'Mərtəbə'),
  num('total_floors', 'Binanın mərtəbə sayı'),
  sel('repair', 'Təmir', ['Təmirli', 'Orta', 'Təmirsiz']),
  yes('has_extract', 'Çıxarış'),
  yes('has_mortgage', 'İpoteka'),
];
const HOUSE_ATTRS: SeedAttr[] = [
  sel('deal_type', 'Əməliyyat', ['Alış', 'Kirayə', 'Günlük']),
  num('rooms', 'Otaq sayı'),
  num('area', 'Sahə', 'm²'),
  num('floors', 'Mərtəbə sayı'),
  sel('repair', 'Təmir', ['Təmirli', 'Orta', 'Təmirsiz']),
  yes('has_extract', 'Çıxarış'),
];
const LAND_ATTRS: SeedAttr[] = [
  sel('deal_type', 'Əməliyyat', ['Alış', 'Kirayə']),
  num('area', 'Sahə', 'sot'),
  sel('purpose', 'Təyinat', ['Tikinti', 'Kənd təsərrüfatı', 'Bağ', 'Kommersiya']),
  yes('has_extract', 'Çıxarış'),
];
const COMMERCIAL_ATTRS: SeedAttr[] = [
  sel('deal_type', 'Əməliyyat', ['Alış', 'Kirayə']),
  sel('object_type', 'Obyekt növü', ['Ofis', 'Mağaza', 'Anbar', 'Restoran/Kafe', 'İstehsalat', 'Obyekt', 'Digər']),
  num('area', 'Sahə', 'm²'),
];
const GARAGE_ATTRS: SeedAttr[] = [
  sel('deal_type', 'Əməliyyat', ['Alış', 'Kirayə']),
  sel('type', 'Növ', ['Qaraj', 'Parkinq yeri']),
  num('area', 'Sahə', 'm²'),
];
const ABROAD_ATTRS: SeedAttr[] = [
  sel('deal_type', 'Əməliyyat', ['Alış', 'Kirayə']),
  sel('property_type', 'Əmlak növü', ['Mənzil', 'Ev/Villa', 'Torpaq', 'Kommersiya']),
  num('rooms', 'Otaq sayı'),
];

// ─────────────────────── İŞ ───────────────────────
const JOB_ATTRS: SeedAttr[] = [
  num('salary_min', 'Maaş (min)', 'AZN'),
  num('salary_max', 'Maaş (max)', 'AZN'),
  sel('schedule', 'İş qrafiki', ['Tam ştat', 'Yarım ştat', 'Uzaqdan', 'Növbəli', 'Layihə üzrə']),
  sel('experience', 'Təcrübə', ['Təcrübəsiz', '1 ilədək', '1-3 il', '3-5 il', '5+ il']),
];

// ─────────────────────── ELEKTRONİKA ───────────────────────
const PHONE_ATTRS: SeedAttr[] = [
  brand(['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Honor', 'Realme', 'Nokia', 'Digər']),
  sel('memory', 'Yaddaş', ['64GB', '128GB', '256GB', '512GB', '1TB']),
  sel('color', 'Rəng', ['Ağ', 'Qara', 'Boz', 'Qızılı', 'Mavi', 'Yaşıl', 'Digər']),
  COND,
];
const TABLET_ATTRS: SeedAttr[] = [
  brand(['Apple', 'Samsung', 'Huawei', 'Lenovo', 'Digər']),
  sel('memory', 'Yaddaş', ['32GB', '64GB', '128GB', '256GB', '512GB']),
  COND,
];
const NUMBER_SIM_ATTRS: SeedAttr[] = [
  sel('operator', 'Operator', ['Azercell', 'Bakcell', 'Nar', 'Naxtel', 'Digər']),
  sel('number_type', 'Növ', ['Mobil nömrə', 'SIM-kart', 'Şəhər nömrəsi']),
];
const WATCH_TECH_ATTRS: SeedAttr[] = [
  brand(['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Amazfit', 'Garmin', 'Digər']),
  COND,
];
const ACCESSORY_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Qoruyucu şüşə', 'Qılaf', 'Adapter', 'Qulaqlıq', 'Power bank', 'Kabel', 'Digər']),
  COND,
];
const PHONE_PARTS_ATTRS: SeedAttr[] = [
  sel('part_type', 'Hissə növü', ['Ekran', 'Batareya', 'Korpus', 'Kamera', 'Şleyf', 'Digər']),
  brand(['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Digər']),
];
const LAPTOP_ATTRS: SeedAttr[] = [
  brand(['Apple', 'Asus', 'HP', 'Lenovo', 'Dell', 'Acer', 'MSI', 'Digər']),
  sel('ram', 'RAM', ['8GB', '16GB', '32GB', '64GB']),
  sel('storage', 'Yaddaş', ['256GB SSD', '512GB SSD', '1TB SSD', 'HDD', 'Digər']),
  COND,
];
const MONITOR_ATTRS: SeedAttr[] = [
  brand(['Dell', 'LG', 'Samsung', 'Asus', 'Acer', 'Digər']),
  sel('screen', 'Ekran ölçüsü', ['19"', '22"', '24"', '27"', '32"', '32"+']),
  COND,
];
const PC_PARTS_ATTRS: SeedAttr[] = [
  sel('part_type', 'Komponent', ['Prosessor', 'Ana plata', 'Video kart', 'Yaddaş (RAM)', 'Sərt disk/SSD', 'Qida bloku', 'Korpus', 'Soyutma', 'Digər']),
  COND,
];
const PERIPHERAL_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Klaviatura', 'Siçan', 'Printer', 'Skaner', 'Veb kamera', 'Qulaqlıq', 'Səsucaldan', 'Digər']),
  COND,
];
const NETWORK_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Router', 'Modem', 'Switch', 'Access Point', 'Şəbəkə adapteri', 'Digər']),
  COND,
];
const TV_ATTRS: SeedAttr[] = [
  brand(['Samsung', 'LG', 'Sony', 'Xiaomi', 'TCL', 'Digər']),
  sel('screen', 'Ekran ölçüsü', ['32"', '43"', '50"', '55"', '65"', '75"']),
  COND,
];
const AUDIO_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Dinamik/Səsucaldan', 'Qulaqlıq', 'Soundbar', 'Resiver', 'Mikrofon', 'Pleyer', 'Digər']),
  brand(),
  COND,
];
const CAMERA_ATTRS: SeedAttr[] = [
  brand(['Canon', 'Nikon', 'Sony', 'Fujifilm', 'GoPro', 'Digər']),
  sel('type', 'Növ', ['Fotoaparat', 'Videokamera', 'Linza', 'Aksesuar', 'Digər']),
  COND,
];
const CONSOLE_ATTRS: SeedAttr[] = [
  sel('platform', 'Platforma', ['PlayStation', 'Xbox', 'Nintendo', 'PC', 'Digər']),
  sel('type', 'Növ', ['Konsol', 'Oyun (disk)', 'Aksesuar/Joystik', 'Digər']),
  COND,
];
const GAME_SOFT_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Oyun açarı/hesab', 'Rəqəmsal oyun', 'Proqram/Lisenziya', 'Game-time/Donat', 'Digər']),
];
const APPLIANCE_ATTRS: SeedAttr[] = [
  brand(['Bosch', 'Samsung', 'LG', 'Beko', 'Indesit', 'Whirlpool', 'Digər']),
  COND,
];

// ─────────────────────── EV VƏ BAĞ ───────────────────────
const FURNITURE_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Divan/Kreslo', 'Stol', 'Stul', 'Şkaf/Komod', 'Çarpayı', 'Mətbəx mebeli', 'Ofis mebeli', 'Digər']),
  COND,
];
const TEXTILE_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Xalça', 'Pərdə', 'Yorğan-döşək', 'Süfrə/Dəsmal', 'Digər']),
  COND,
];
const KITCHEN_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Qab dəsti', 'Bıçaq', 'Mətbəx ləvazimatı', 'Çay/Qəhvə dəsti', 'Digər']),
  COND,
];
const DECOR_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['İşıqlandırma', 'Güzgü', 'Tablo/Şəkil', 'Saksı/Bitki', 'Dekor əşyası', 'Digər']),
  COND,
];
const GARDEN_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Bağ aləti', 'Qazonbiçən', 'Suvarma', 'Bağ mebeli', 'Mangal', 'Digər']),
  COND,
];

// ─────────────────────── ŞƏXSİ ƏŞYALAR ───────────────────────
const CLOTHING_ATTRS: SeedAttr[] = [
  sel('size', 'Ölçü', ['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  COND,
];
const SHOE_ATTRS: SeedAttr[] = [
  sel('size', 'Ölçü', ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']),
  COND,
];
const ACC_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Çanta', 'Kəmər', 'Eynək', 'Şərf/Şal', 'Əlcək', 'Papaq', 'Digər']),
  COND,
];
const WATCH_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Qol saatı', 'Divar saatı', 'Cib saatı', 'Digər']),
  COND,
];
const JEWELRY_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Üzük', 'Sırğa', 'Boyunbağı', 'Qolbaq', 'Dəst', 'Digər']),
  sel('material', 'Material', ['Qızıl', 'Gümüş', 'Platin', 'Almaz', 'Bijuteriya']),
];
const BEAUTY_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Kosmetika', 'Ətriyyat', 'Saç baxımı', 'Dırnaq', 'Sağlamlıq cihazı', 'Digər']),
  COND,
];
const VAPE_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Pod sistem', 'Vape/Mod', 'Bir dəfəlik', 'Likvid', 'Aksesuar/Hissə', 'Digər']),
  COND,
];

// ─────────────────────── UŞAQ ALƏMİ ───────────────────────
const CHILD_CLOTHING_ATTRS: SeedAttr[] = [
  sel('gender', 'Cins', ['Oğlan', 'Qız', 'Uniseks']),
  sel('age', 'Yaş', ['0-1 yaş', '1-3 yaş', '3-6 yaş', '6-10 yaş', '10+ yaş']),
  COND,
];
const TOY_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Konstruktor', 'Yumşaq oyuncaq', 'İnkişafedici', 'Elektron', 'Kukla', 'Maşın/Texnika', 'Digər']),
  COND,
];
const STROLLER_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Gəzinti arabası', 'Beşik-araba', '2-si 1-də', '3-ü 1-də', 'Yüngül araba', 'Digər']),
  COND,
];
const CARSEAT_ATTRS: SeedAttr[] = [
  sel('group', 'Qrup', ['0+ (0-13 kq)', '1 (9-18 kq)', '2-3 (15-36 kq)', 'Universal']),
  COND,
];
const SCHOOL_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Məktəb çantası', 'Dəftərxana', 'Forma', 'Dərslik', 'Digər']),
  COND,
];

// ─────────────────────── HEYVANLAR ───────────────────────
const PET_ATTRS: SeedAttr[] = [
  sel('gender', 'Cins', ['Erkək', 'Dişi']),
  yes('vaccinated', 'Peyvəndli'),
  yes('pedigree', 'Pasportlu/Şəcərəli'),
];
const PET_PRODUCT_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Yem', 'Aksesuar', 'Qəfəs/Akvarium', 'Gigiyena', 'Digər']),
];

// ─────────────────────── TİKİNTİ VƏ TƏMİR ───────────────────────
const BUILD_MAT_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Sement/Beton', 'Kərpic/Blok', 'Boya/Lak', 'Gips/Mala', 'İzolyasiya', 'Metal', 'Ağac', 'Kafel/Plitə', 'Digər']),
];
const TOOL_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Əl aləti', 'Elektrik aləti', 'Ölçü aləti', 'Pnevmatik', 'Digər']),
  COND,
];
const PLUMBING_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Kran/Qarışdırıcı', 'Əlüzyuyan', 'Unitaz', 'Vanna/Duş', 'Boru/Fitinq', 'Su qızdırıcı', 'Digər']),
  COND,
];
const ELECTRIC_GOODS_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Kabel/Naqil', 'Açar/Rozetka', 'İşıqlandırma', 'Avtomat/Şit', 'Transformator', 'Digər']),
  COND,
];
const DOOR_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Qapı', 'Pəncərə', 'Aksesuar']),
  sel('material', 'Material', ['Ağac', 'Plastik (PVC)', 'Metal', 'Alüminium', 'Digər']),
];
const HVAC_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Kondisioner', 'Kombi/Qazan', 'Radiator', 'Ventilyasiya', 'Termostat', 'Digər']),
  COND,
];

// ─────────────────────── HOBBİ VƏ ASUDƏ ───────────────────────
const BIKE_ATTRS: SeedAttr[] = [
  brand(['Trek', 'Giant', 'Merida', 'Cube', 'Scott', 'Digər']),
  COND,
];
const SPORT_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Trenajor', 'Fitnes ləvazimatı', 'Çadır/Turizm', 'Qış idmanı', 'Komanda idmanı', 'Döyüş idmanı', 'Digər']),
  COND,
];
const HUNT_FISH_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Ov tüfəngi/aksesuar', 'Ov ləvazimatı', 'Balıqçılıq aləti', 'Yem/Qarmaq', 'Geyim/Ayaqqabı', 'Digər']),
  COND,
];
const MUSIC_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Gitara', 'Piano/Klaviş', 'Nəfəs aləti', 'Zərb aləti', 'Simli', 'Aksesuar', 'Digər']),
  COND,
];
const BOOK_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Bədii ədəbiyyat', 'Dərslik', 'Uşaq kitabı', 'Elmi', 'Jurnal', 'Digər']),
  sel('language', 'Dil', ['Azərbaycan', 'Rus', 'İngilis', 'Türk', 'Digər']),
];
const COLLECT_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Sikkə', 'Marka', 'Rəsm əsəri', 'Heykəl', 'Banknot', 'Digər']),
];
const TICKET_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Konsert', 'Teatr', 'İdman', 'Səyahət', 'Digər']),
];

// ─────────────────────── BİZNES VƏ AVADANLIQ ───────────────────────
const TRADE_EQUIP_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Vitrin', 'Rəf/Stellaj', 'Kassa aparatı', 'Tərəzi', 'Soyuducu vitrin', 'Manken', 'Digər']),
  COND,
];
const INDUSTRY_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Dəzgah', 'Generator', 'Kompressor', 'Nasos', 'Qaynaq', 'Digər']),
  COND,
];
const READY_BIZ_ATTRS: SeedAttr[] = [
  sel('type', 'Sahə', ['Kafe/Restoran', 'Mağaza', 'İstehsalat', 'Gözəllik salonu', 'Onlayn biznes', 'Digər']),
];
const OFFICE_EQUIP_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Printer/MFU', 'Skaner', 'Proyektor', 'Seyf', 'Ofis mebeli', 'Digər']),
  COND,
];

// ─────────────────────── KƏND TƏSƏRRÜFATI ───────────────────────
const AGRO_TECH_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Traktor', 'Kombayn', 'Kotan', 'Səpici', 'Suvarma', 'Digər']),
  num('year', 'Buraxılış ili', 'il'),
];
const SEED_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Toxum', 'Ting/Calaq', 'Gül', 'Dekorativ bitki', 'Digər']),
];
const FERT_ATTRS: SeedAttr[] = [
  sel('type', 'Növ', ['Üzvi gübrə', 'Mineral gübrə', 'Pestisid', 'Herbisid', 'Digər']),
];

export const CATEGORIES: SeedCategory[] = [
  // 1) NƏQLİYYAT
  c('neqliyyat', 'Nəqliyyat', 'transport', [
    c('avtomobiller', 'Avtomobillər', 'transport', undefined, CAR_ATTRS),
    c('motosikletler', 'Motosiklet və mopedlər', 'transport', undefined, MOTO_ATTRS),
    c('qosqu-karvan', 'Qoşqular və karvanlar', 'transport', undefined, TRAILER_ATTRS),
    c('yuk-avtobus', 'Yük maşınları və avtobuslar', 'transport', undefined, TRUCK_ATTRS),
    c('xususi-texnika', 'Xüsusi texnika', 'transport', undefined, SPECIAL_TECH_ATTRS),
    c('su-neqliyyati', 'Su nəqliyyatı', 'transport', undefined, BOAT_ATTRS),
    c('ehtiyat-hisseleri', 'Ehtiyat hissələri və aksesuarlar', 'transport', undefined, PARTS_ATTRS),
    c('tekerler-diskler', 'Təkərlər, disklər və şinlər', 'transport', undefined, WHEEL_ATTRS),
  ], undefined, 'car'),

  // 2) DAŞINMAZ ƏMLAK
  c('dasinmaz-emlak', 'Daşınmaz əmlak', 'realestate', [
    c('menziller', 'Mənzillər', 'realestate', undefined, FLAT_ATTRS),
    c('heyet-evleri', 'Həyət evləri və villalar', 'realestate', undefined, HOUSE_ATTRS),
    c('bag-evleri', 'Bağ evləri', 'realestate', undefined, HOUSE_ATTRS),
    c('torpaq', 'Torpaq sahələri', 'realestate', undefined, LAND_ATTRS),
    c('obyekt-ofis', 'Obyektlər və ofislər', 'realestate', undefined, COMMERCIAL_ATTRS),
    c('qaraj-parking', 'Qarajlar və parkinqlər', 'realestate', undefined, GARAGE_ATTRS),
    c('xaricde-emlak', 'Xaricdə əmlak', 'realestate', undefined, ABROAD_ATTRS),
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
    c('is-medicina', 'Tibb, əczaçılıq', 'job', undefined, JOB_ATTRS),
  ], undefined, 'briefcase'),

  // 4) ELEKTRONİKA
  c('elektronika', 'Elektronika', 'universal', [
    c('telefonlar', 'Telefonlar və aksesuarlar', 'universal', [
      c('mobil-telefonlar', 'Mobil telefonlar', 'universal', undefined, PHONE_ATTRS),
      c('planshetler', 'Planşetlər', 'universal', undefined, TABLET_ATTRS),
      c('smart-saatlar', 'Smart saatlar və qolbaqlar', 'universal', undefined, WATCH_TECH_ATTRS),
      c('telefon-aksesuar', 'Aksesuarlar', 'universal', undefined, ACCESSORY_ATTRS),
      c('telefon-ehtiyat', 'Ehtiyat hissələri', 'universal', undefined, PHONE_PARTS_ATTRS),
      c('nomreler-sim', 'Nömrələr və SIM-kartlar', 'universal', undefined, NUMBER_SIM_ATTRS),
    ]),
    c('komputerler', 'Kompüterlər', 'universal', [
      c('noutbuklar', 'Noutbuklar', 'universal', undefined, LAPTOP_ATTRS),
      c('masaustu', 'Masaüstü kompüterlər', 'universal', undefined, LAPTOP_ATTRS),
      c('monitorlar', 'Monitorlar', 'universal', undefined, MONITOR_ATTRS),
      c('komplektlesdirici', 'Komplektləşdirici', 'universal', undefined, PC_PARTS_ATTRS),
      c('periferiya', 'Periferiya və aksesuar', 'universal', undefined, PERIPHERAL_ATTRS),
      c('shebeke', 'Şəbəkə avadanlığı', 'universal', undefined, NETWORK_ATTRS),
    ]),
    c('tv-audio', 'TV, audio, video', 'universal', [
      c('televizorlar', 'Televizorlar', 'universal', undefined, TV_ATTRS),
      c('audio', 'Audio sistemlər', 'universal', undefined, AUDIO_ATTRS),
      c('foto-video', 'Foto və video kameralar', 'universal', undefined, CAMERA_ATTRS),
    ]),
    c('oyun-konsollar', 'Oyun konsolları və oyunlar', 'universal', undefined, CONSOLE_ATTRS),
    c('oyun-proqram', 'Oyunlar və proqramlar', 'universal', undefined, GAME_SOFT_ATTRS),
    c('mesisat-texnikasi', 'Məişət texnikası', 'universal', undefined, APPLIANCE_ATTRS),
  ], undefined, 'smartphone'),

  // 5) EV VƏ BAĞ
  c('ev-bag', 'Ev və bağ', 'universal', [
    c('mebel', 'Mebel', 'universal', undefined, FURNITURE_ATTRS),
    c('iri-texnika', 'İri məişət texnikası', 'universal', undefined, APPLIANCE_ATTRS),
    c('xirda-texnika', 'Xırda məişət texnikası', 'universal', undefined, APPLIANCE_ATTRS),
    c('qab-qacaq', 'Qab-qacaq və mətbəx', 'universal', undefined, KITCHEN_ATTRS),
    c('tekstil-xalca', 'Tekstil və xalçalar', 'universal', undefined, TEXTILE_ATTRS),
    c('isiq-dekor', 'İşıqlandırma və dekor', 'universal', undefined, DECOR_ATTRS),
    c('bag-bostan', 'Bağ və bostan', 'universal', undefined, GARDEN_ATTRS),
  ], undefined, 'sofa'),

  // 6) ŞƏXSİ ƏŞYALAR
  c('shexsi-esyalar', 'Şəxsi əşyalar', 'universal', [
    c('qadin-geyim', 'Qadın geyimi', 'universal', undefined, CLOTHING_ATTRS),
    c('kishi-geyim', 'Kişi geyimi', 'universal', undefined, CLOTHING_ATTRS),
    c('ayaqqabi', 'Ayaqqabı', 'universal', undefined, SHOE_ATTRS),
    c('aksesuar', 'Aksesuar və çantalar', 'universal', undefined, ACC_ATTRS),
    c('saatlar', 'Saatlar', 'universal', undefined, WATCH_ATTRS),
    c('zergerlik', 'Zərgərlik və bijuteriya', 'universal', undefined, JEWELRY_ATTRS),
    c('gozellik-saglamliq', 'Gözəllik və sağlamlıq', 'universal', undefined, BEAUTY_ATTRS),
    c('elektron-siqaret', 'Elektron siqaret və aksesuar', 'universal', undefined, VAPE_ATTRS),
  ], undefined, 'shirt'),

  // 7) UŞAQ ALƏMİ
  c('usaq-alemi', 'Uşaq aləmi', 'universal', [
    c('usaq-geyim', 'Uşaq geyimi və ayaqqabısı', 'universal', undefined, CHILD_CLOTHING_ATTRS),
    c('oyuncaqlar', 'Oyuncaqlar', 'universal', undefined, TOY_ATTRS),
    c('usaq-arabalari', 'Uşaq arabaları', 'universal', undefined, STROLLER_ATTRS),
    c('usaq-avtokreslo', 'Uşaq avtokresloları', 'universal', undefined, CARSEAT_ATTRS),
    c('usaq-mebel', 'Uşaq mebeli', 'universal', undefined, [COND]),
    c('mekteb', 'Məktəb ləvazimatları', 'universal', undefined, SCHOOL_ATTRS),
  ], undefined, 'baby'),

  // 8) HEYVANLAR
  c('heyvanlar', 'Heyvanlar', 'universal', [
    c('itler', 'İtlər', 'universal', undefined, PET_ATTRS),
    c('pishikler', 'Pişiklər', 'universal', undefined, PET_ATTRS),
    c('qushlar', 'Quşlar', 'universal', undefined, PET_ATTRS),
    c('akvarium', 'Akvarium', 'universal', undefined, PET_ATTRS),
    c('gemiriciler', 'Gəmiricilər', 'universal', undefined, PET_ATTRS),
    c('atlar', 'Atlar', 'universal', undefined, PET_ATTRS),
    c('kt-heyvanlari', 'Kənd təsərrüfatı heyvanları', 'universal', undefined, PET_ATTRS),
    c('heyvan-mehsullari', 'Heyvanlar üçün məhsullar', 'universal', undefined, PET_PRODUCT_ATTRS),
  ], undefined, 'paw'),

  // 9) TİKİNTİ VƏ TƏMİR
  c('tikinti-temir', 'Tikinti və təmir', 'universal', [
    c('tikinti-materiallari', 'Tikinti materialları', 'universal', undefined, BUILD_MAT_ATTRS),
    c('aletler', 'Alətlər', 'universal', undefined, TOOL_ATTRS),
    c('santexnika', 'Santexnika', 'universal', undefined, PLUMBING_ATTRS),
    c('elektrik', 'Elektrik məhsulları', 'universal', undefined, ELECTRIC_GOODS_ATTRS),
    c('qapi-pencere', 'Qapı və pəncərələr', 'universal', undefined, DOOR_ATTRS),
    c('istilik-kondisioner', 'İstilik və kondisioner', 'universal', undefined, HVAC_ATTRS),
  ], undefined, 'drill'),

  // 10) HOBBİ VƏ ASUDƏ
  c('hobbi-asude', 'Hobbi və asudə', 'universal', [
    c('idman-turizm', 'İdman və turizm', 'universal', undefined, SPORT_ATTRS),
    c('ovculuq-baliqciliq', 'Ovçuluq və balıqçılıq', 'universal', undefined, HUNT_FISH_ATTRS),
    c('velosipedler', 'Velosipedlər', 'universal', undefined, BIKE_ATTRS),
    c('musiqi-aletleri', 'Musiqi alətləri', 'universal', undefined, MUSIC_ATTRS),
    c('kitablar', 'Kitablar və jurnallar', 'universal', undefined, BOOK_ATTRS),
    c('antikvariat', 'Antikvariat və kolleksiya', 'universal', undefined, COLLECT_ATTRS),
    c('biletler', 'Biletlər və səyahət', 'universal', undefined, TICKET_ATTRS),
  ], undefined, 'dumbbell'),

  // 11) BİZNES VƏ AVADANLIQ
  c('biznes-avadanliq', 'Biznes və avadanlıq', 'universal', [
    c('ticaret-avadanliq', 'Ticarət avadanlığı', 'universal', undefined, TRADE_EQUIP_ATTRS),
    c('senaye-avadanliq', 'Sənaye avadanlığı', 'universal', undefined, INDUSTRY_ATTRS),
    c('hazir-biznes', 'Hazır biznes', 'universal', undefined, READY_BIZ_ATTRS),
    c('ofis-avadanliq', 'Ofis avadanlığı', 'universal', undefined, OFFICE_EQUIP_ATTRS),
  ], undefined, 'building'),

  // 12) KƏND TƏSƏRRÜFATI
  c('kend-teserrufati', 'Kənd təsərrüfatı', 'universal', [
    c('kt-texnika', 'Kənd təsərrüfatı texnikası', 'universal', undefined, AGRO_TECH_ATTRS),
    c('toxum-bitki', 'Toxum və bitkilər', 'universal', undefined, SEED_ATTRS),
    c('gubre', 'Gübrə və kimyəvi maddələr', 'universal', undefined, FERT_ATTRS),
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
