// Nümunə elanlar (demo satıcı) — region-first browsing/axtarış üçün real kontent.
// Idempotent: seed hər dəfə demo satıcının elanlarını yenidən yaradır.

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

export const SAMPLE_LISTINGS: SampleListing[] = [
  { categorySlug: 'telefonlar', districtSlug: 'qebele-merkez', title: 'iPhone 14 Pro 256GB',
    description: 'Əla vəziyyətdə, qutusu və aksesuarları ilə. Qəbələdə.', price: 2100,
    attributes: { brand: 'Apple', memory: '256GB' }, isVip: true, hasDelivery: true },
  { categorySlug: 'telefonlar', districtSlug: 'baki-yasamal', title: 'Samsung Galaxy S23 128GB',
    description: 'Təmiz, cızıqsız, zəmanəti davam edir. Yasamal.', price: 1450,
    attributes: { brand: 'Samsung', memory: '128GB' } },
  { categorySlug: 'telefonlar', districtSlug: 'sumqayit-merkez', title: 'Xiaomi Redmi Note 12',
    description: 'Yeni kimi, sənədli. Sumqayıt mərkəz.', price: 480, attributes: { brand: 'Xiaomi' } },
  { categorySlug: 'avtomobiller', districtSlug: 'gence-merkez', title: 'Toyota Camry 2019',
    description: 'Bir sahibli, qəzasız, tam baxımlı. Gəncə.', price: 38000,
    attributes: { brand: 'Toyota', year: 2019, fuel: 'Benzin' }, isPremium: true },
  { categorySlug: 'avtomobiller', districtSlug: 'baki-nesimi', title: 'Mercedes-Benz E220 2017',
    description: 'Dizel, avtomat, dəri salon. Nəsimi.', price: 52000,
    attributes: { brand: 'Mercedes-Benz', year: 2017, fuel: 'Dizel' }, isPremium: true },
  { categorySlug: 'menziller', districtSlug: 'baki-yasamal', title: '3 otaqlı mənzil, Yasamal',
    description: 'Təmirli, kupça hazır, metroya yaxın.', price: 185000,
    attributes: { rooms: 3, area: 95, repair: 'Təmirli', has_extract: true } },
  { categorySlug: 'menziller', districtSlug: 'seki-merkez', title: 'Şəki mərkəzdə ev kirayə',
    description: 'Aylıq kirayə, mebelli, mərkəzdə.', price: 600,
    attributes: { rooms: 2, deal_type: 'Kirayə' } },
  { categorySlug: 'menziller', districtSlug: 'quba-merkez', title: 'Quba bağ evi satılır',
    description: 'Geniş həyət, meyvə bağı, təbiət qoynunda.', price: 120000,
    attributes: { rooms: 4, area: 180 } },
];
