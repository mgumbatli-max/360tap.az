// Nümunə elanlar (demo satıcı) — hər bölməni doldurmaq + region-first browsing/axtarış üçün.
// Idempotent: seed hər dəfə demo satıcının elanlarını yenidən yaradır.
// Atributlar KANONİK açarlarla (brand/fuel/rooms...) ki, kateqoriya filterləri işləsin.

export const DEMO_SELLER = {
  email: 'demo@360tap.az',
  fullName: 'Demo Satıcı',
};

export interface SampleListing {
  categorySlug: string;
  districtSlug: string;
  title: string;
  description: string;
  price: number;
  attributes?: Record<string, unknown>;
  isVip?: boolean;
  isPremium?: boolean;
  hasDelivery?: boolean;
}

const L = (
  categorySlug: string,
  districtSlug: string,
  title: string,
  price: number,
  description: string,
  attributes?: Record<string, unknown>,
  flags?: { isVip?: boolean; isPremium?: boolean; hasDelivery?: boolean },
): SampleListing => ({ categorySlug, districtSlug, title, price, description, attributes, ...flags });

export const SAMPLE_LISTINGS: SampleListing[] = [
  // ── Telefonlar (mobil-telefonlar) — brand/memory/condition filtrləri ──
  L('mobil-telefonlar', 'qebele-merkez', 'iPhone 14 Pro 256GB', 2100, 'Əla vəziyyətdə, qutusu və aksesuarları ilə. Qəbələdə.', { brand: 'Apple', memory: '256GB', condition: 'İşlənmiş' }, { isVip: true, hasDelivery: true }),
  L('mobil-telefonlar', 'baki-yasamal', 'iPhone 15 Pro Max 512GB', 3200, 'Yeni, bağlı qutu, zəmanətli. Yasamal.', { brand: 'Apple', memory: '512GB', condition: 'Yeni' }, { isVip: true }),
  L('mobil-telefonlar', 'baki-nesimi', 'Samsung Galaxy S23 128GB', 1450, 'Təmiz, cızıqsız, zəmanəti davam edir. Nəsimi.', { brand: 'Samsung', memory: '128GB', condition: 'İşlənmiş' }),
  L('mobil-telefonlar', 'sumqayit-merkez', 'Xiaomi Redmi Note 12', 480, 'Yeni kimi, sənədli. Sumqayıt mərkəz.', { brand: 'Xiaomi', memory: '128GB', condition: 'İşlənmiş' }, { hasDelivery: true }),
  L('mobil-telefonlar', 'gence-merkez', 'Huawei Nova 11', 750, 'Səliqəli istifadə, çexolla. Gəncə.', { brand: 'Huawei', memory: '256GB', condition: 'İşlənmiş' }),
  L('planshetler', 'baki-xetai', 'iPad Air 5 64GB', 980, 'Tam komplekt, ideal ekran. Xətai.', { brand: 'Apple', condition: 'İşlənmiş' }),

  // ── Komputerlər ──
  L('noutbuklar', 'baki-nizami', 'MacBook Air M2 256GB', 2300, 'Az işlənib, batareya əla. Nizami.', { brand: 'Apple', condition: 'İşlənmiş' }, { isPremium: true }),
  L('noutbuklar', 'baki-yasamal', 'Asus TUF Gaming F15', 1650, 'RTX 3050, oyun və iş üçün. Yasamal.', { brand: 'Asus', condition: 'Yeni' }, { hasDelivery: true }),
  L('monitorlar', 'sumqayit-merkez', 'Dell 27" 144Hz monitor', 540, 'Oyun monitoru, qutulu. Sumqayıt.', { brand: 'Dell' }),

  // ── TV / audio ──
  L('televizorlar', 'mingecevir-merkez', 'Samsung 55" QLED TV', 1200, '4K Smart TV, yeni. Mingəçevir.', { brand: 'Samsung' }, { hasDelivery: true }),
  L('audio', 'baki-sebail', 'JBL Charge 5 dinamik', 220, 'Su keçirməz, güclü səs. Səbail.', { brand: 'JBL' }, { hasDelivery: true }),

  // ── Avtomobillər — brand/year/fuel/transmission/body/color filtrləri ──
  L('avtomobiller', 'gence-merkez', 'Toyota Camry 2019', 38000, 'Bir sahibli, qəzasız, tam baxımlı. Gəncə.', { brand: 'Toyota', year: 2019, fuel: 'Benzin', transmission: 'Avtomat', body: 'Sedan', color: 'Ağ', no_accident: true }, { isPremium: true }),
  L('avtomobiller', 'baki-nesimi', 'Mercedes-Benz E220 2017', 52000, 'Dizel, avtomat, dəri salon. Nəsimi.', { brand: 'Mercedes-Benz', year: 2017, fuel: 'Dizel', transmission: 'Avtomat', body: 'Sedan', color: 'Qara', no_accident: true }, { isPremium: true }),
  L('avtomobiller', 'baki-qaradag', 'Hyundai Elantra 2021', 31000, 'Az yürüş, ideal vəziyyət. Qaradağ.', { brand: 'Hyundai', year: 2021, fuel: 'Benzin', transmission: 'Avtomat', body: 'Sedan', color: 'Ağ', credit: true }),
  L('avtomobiller', 'quba-merkez', 'Kia Sportage 2020', 41000, 'Krossover, 4x4, tam komplekt. Quba.', { brand: 'Kia', year: 2020, fuel: 'Benzin', transmission: 'Avtomat', body: 'Krossover', color: 'Boz' }),
  L('avtomobiller', 'lenkeran-merkez', 'LADA Vesta 2018', 14500, 'Qənaətcil, sənədli. Lənkəran.', { brand: 'LADA', year: 2018, fuel: 'Benzin', transmission: 'Mexaniki', body: 'Sedan', color: 'Gümüşü', barter: true }),
  L('motosikletler', 'baki-suraxani', 'Honda PCX 150', 4200, 'Az sürülüb, ideal. Suraxanı.', { brand: 'Honda', year: 2021 }),

  // ── Daşınmaz əmlak — rooms/area/repair/deal_type filtrləri ──
  L('menziller', 'baki-yasamal', '3 otaqlı mənzil, Yasamal', 185000, 'Təmirli, kupça hazır, metroya yaxın.', { rooms: 3, area: 95, repair: 'Təmirli', deal_type: 'Alış', has_extract: true }, { isVip: true }),
  L('menziller', 'baki-nizami', '2 otaqlı yeni tikili', 142000, 'Yeni bina, əla layihə. Nizami.', { rooms: 2, area: 72, repair: 'Təmirli', deal_type: 'Alış', has_mortgage: true }),
  L('menziller', 'baki-nerimanov', '1 otaqlı kirayə mənzil', 550, 'Aylıq kirayə, mebelli. Nərimanov.', { rooms: 1, area: 45, deal_type: 'Kirayə' }, { hasDelivery: false }),
  L('menziller', 'seki-merkez', 'Şəki mərkəzdə ev kirayə', 600, 'Aylıq kirayə, mebelli, mərkəzdə.', { rooms: 2, area: 60, deal_type: 'Kirayə' }),
  L('heyet-evleri', 'quba-merkez', 'Quba bağ evi satılır', 120000, 'Geniş həyət, meyvə bağı, təbiət qoynunda.', { rooms: 4, area: 180, deal_type: 'Alış' }, { isPremium: true }),
  L('heyet-evleri', 'shamaxi-merkez', 'Şamaxıda həyət evi', 95000, '5 otaq, böyük həyət, quyu. Şamaxı.', { rooms: 5, area: 220, deal_type: 'Alış' }),
  L('torpaq', 'xacmaz-merkez', '12 sot torpaq sahəsi', 28000, 'Sənədli, yola yaxın. Xaçmaz.', { area: 1200 }),
  L('obyekt-ofis', 'baki-sebail', 'Mərkəzdə ofis kirayə', 1400, '85 m², 4 otaqlı ofis. Səbail.', { area: 85, deal_type: 'Kirayə' }),

  // ── İş elanları — salary/schedule/experience filtrləri ──
  L('is-it', 'baki-nesimi', 'Frontend Developer (React)', 2500, 'Tam ştat, ofis/hibrid. React təcrübəsi tələb olunur.', { salary_min: 2000, salary_max: 3500, schedule: 'Tam ştat', experience: '1-3 il' }, { isVip: true }),
  L('is-satis', 'baki-yasamal', 'Satış meneceri', 1200, 'Tam ştat + bonus. Satış təcrübəsi üstünlükdür.', { salary_min: 1000, salary_max: 1800, schedule: 'Tam ştat', experience: '1 ilədək' }),
  L('is-xidmet', 'gence-merkez', 'Ofisiant (restoran)', 700, 'Növbəli iş, mərkəzi restoran. Gəncə.', { salary_min: 600, salary_max: 900, schedule: 'Növbəli', experience: 'Təcrübəsiz' }),
  L('is-tikinti', 'sumqayit-merkez', 'Usta / inşaatçı', 1500, 'Layihə üzrə, təcrübəli usta axtarılır.', { salary_min: 1200, salary_max: 2000, schedule: 'Layihə üzrə', experience: '3-5 il' }),

  // ── Ev və bağ ──
  L('mebel', 'baki-bineqedi', 'Künc divan (yeni)', 850, 'Keyfiyyətli parça, çevrilən. Binəqədi.', { condition: 'Yeni' }, { hasDelivery: true }),
  L('iri-texnika', 'baki-xetai', 'Bosch soyuducu', 920, 'No Frost, A++, zəmanətli. Xətai.', { brand: 'Bosch' }, { hasDelivery: true }),
  L('iri-texnika', 'sumqayit-merkez', 'Samsung paltaryuyan', 640, '8 kq, az işlənib. Sumqayıt.', { brand: 'Samsung' }),
  L('xirda-texnika', 'baki-yasamal', 'Nespresso kofe maşını', 280, 'Az istifadə, kapsulla. Yasamal.', { brand: 'Nespresso' }, { hasDelivery: true }),

  // ── Şəxsi əşyalar ──
  L('kishi-geyim', 'baki-nesimi', 'Kişi dəri gödəkçə', 180, 'Əsl dəri, L ölçü, az geyinilib.', undefined, { hasDelivery: true }),
  L('qadin-geyim', 'baki-nizami', 'Qadın qış paltosu', 140, 'M ölçü, isti, zərif. Nizami.', undefined, { hasDelivery: true }),
  L('ayaqqabi', 'gence-merkez', 'Nike Air Max 42', 160, 'Orijinal, yeni kimi. Gəncə.', { brand: 'Nike' }, { hasDelivery: true }),
  L('saatlar', 'baki-sebail', 'Casio Edifice saat', 220, 'Orijinal qutu ilə. Səbail.', { brand: 'Casio' }),

  // ── Uşaq aləmi ──
  L('oyuncaqlar', 'baki-sabuncu', 'Lego Technic dəsti', 95, 'Tam komplekt, qutulu. Sabunçu.', undefined, { hasDelivery: true }),
  L('usaq-arabalari', 'sumqayit-merkez', 'Uşaq arabası 3-də 1', 320, 'Az işlənib, təmiz. Sumqayıt.', undefined, { hasDelivery: true }),

  // ── Heyvanlar ──
  L('pishikler', 'baki-yasamal', 'Britan pişiyi balası', 250, 'Peyvəndli, sənədli. Yasamal.', undefined),
  L('itler', 'qebele-merkez', 'Alabay küçük', 400, 'Saf qan, peyvəndli. Qəbələ.', undefined),

  // ── Hobbi ──
  L('velosipedler', 'baki-nerimanov', 'Trek dağ velosipedi', 680, 'Alüminium ram, 27.5". Nərimanov.', { brand: 'Trek' }, { hasDelivery: true }),
  L('musiqi-aletleri', 'baki-nizami', 'Akustik gitara Yamaha', 240, 'Yeni kimi, çexolla. Nizami.', { brand: 'Yamaha' }),

  // ── Xidmətlər ──
  L('temir-xidmet', 'baki-xetai', 'Mənzil təmiri xidməti', 0, 'Tam təmir, dizayn, keyfiyyət zəmanəti. Bakı üzrə.', undefined),
  L('gozellik-xidmet', 'baki-nesimi', 'Saç düzümü və qulluq', 0, 'Peşəkar bərbər, ev/salon. Nəsimi.', undefined),
  L('neqliyyat-xidmet', 'sumqayit-merkez', 'Yük daşınması (kuryer)', 0, 'Şəhərlərarası yük və əşya daşınması.', undefined),
];
