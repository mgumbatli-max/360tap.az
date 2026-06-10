// AZ regionları + rayonları (Faza 0 starter dataset — GPS təxmini, sonra genişlənir)
// Region = inzibati region; District = rayon/qəsəbə (region daxilində).

export interface SeedDistrict {
  slug: string;
  nameAz: string;
  lat: number;
  lng: number;
}
export interface SeedRegion {
  slug: string;
  nameAz: string;
  nameRu?: string;
  lat: number;
  lng: number;
  sortOrder: number;
  districts: SeedDistrict[];
}

export const REGIONS: SeedRegion[] = [
  {
    slug: 'baki', nameAz: 'Bakı', nameRu: 'Баку', lat: 40.4093, lng: 49.8671, sortOrder: 1,
    districts: [
      { slug: 'baki-yasamal', nameAz: 'Yasamal', lat: 40.3900, lng: 49.8000 },
      { slug: 'baki-nesimi', nameAz: 'Nəsimi', lat: 40.3800, lng: 49.8400 },
      { slug: 'baki-xetai', nameAz: 'Xətai', lat: 40.3800, lng: 49.9000 },
      { slug: 'baki-sabuncu', nameAz: 'Sabunçu', lat: 40.4400, lng: 49.9400 },
    ],
  },
  { slug: 'sumqayit', nameAz: 'Sumqayıt', nameRu: 'Сумгаит', lat: 40.5897, lng: 49.6686, sortOrder: 2,
    districts: [{ slug: 'sumqayit-merkez', nameAz: 'Sumqayıt mərkəz', lat: 40.5897, lng: 49.6686 }] },
  { slug: 'gence', nameAz: 'Gəncə', nameRu: 'Гянджа', lat: 40.6828, lng: 46.3606, sortOrder: 3,
    districts: [{ slug: 'gence-merkez', nameAz: 'Gəncə mərkəz', lat: 40.6828, lng: 46.3606 }] },
  { slug: 'qebele', nameAz: 'Qəbələ', nameRu: 'Габала', lat: 40.9803, lng: 47.8456, sortOrder: 4,
    districts: [{ slug: 'qebele-merkez', nameAz: 'Qəbələ mərkəz', lat: 40.9803, lng: 47.8456 }] },
  { slug: 'quba', nameAz: 'Quba', nameRu: 'Куба', lat: 41.3617, lng: 48.5128, sortOrder: 5,
    districts: [{ slug: 'quba-merkez', nameAz: 'Quba mərkəz', lat: 41.3617, lng: 48.5128 }] },
  { slug: 'xacmaz', nameAz: 'Xaçmaz', nameRu: 'Хачмаз', lat: 41.4592, lng: 48.8065, sortOrder: 6,
    districts: [{ slug: 'xacmaz-merkez', nameAz: 'Xaçmaz mərkəz', lat: 41.4592, lng: 48.8065 }] },
  { slug: 'lenkeran', nameAz: 'Lənkəran', nameRu: 'Ленкорань', lat: 38.7540, lng: 48.8510, sortOrder: 7,
    districts: [{ slug: 'lenkeran-merkez', nameAz: 'Lənkəran mərkəz', lat: 38.7540, lng: 48.8510 }] },
  { slug: 'seki', nameAz: 'Şəki', nameRu: 'Шеки', lat: 41.1919, lng: 47.1706, sortOrder: 8,
    districts: [{ slug: 'seki-merkez', nameAz: 'Şəki mərkəz', lat: 41.1919, lng: 47.1706 }] },
  { slug: 'mingecevir', nameAz: 'Mingəçevir', nameRu: 'Мингечевир', lat: 40.7700, lng: 47.0489, sortOrder: 9,
    districts: [{ slug: 'mingecevir-merkez', nameAz: 'Mingəçevir mərkəz', lat: 40.7700, lng: 47.0489 }] },
  { slug: 'shamaxi', nameAz: 'Şamaxı', nameRu: 'Шемаха', lat: 40.6311, lng: 48.6411, sortOrder: 10,
    districts: [{ slug: 'shamaxi-merkez', nameAz: 'Şamaxı mərkəz', lat: 40.6311, lng: 48.6411 }] },
  { slug: 'masalli', nameAz: 'Masallı', nameRu: 'Масаллы', lat: 39.0342, lng: 48.6658, sortOrder: 11,
    districts: [{ slug: 'masalli-merkez', nameAz: 'Masallı mərkəz', lat: 39.0342, lng: 48.6658 }] },
  { slug: 'oguz', nameAz: 'Oğuz', nameRu: 'Огуз', lat: 41.0717, lng: 47.4656, sortOrder: 12,
    districts: [{ slug: 'oguz-merkez', nameAz: 'Oğuz mərkəz', lat: 41.0717, lng: 47.4656 }] },
  { slug: 'ismayilli', nameAz: 'İsmayıllı', nameRu: 'Исмаиллы', lat: 40.7878, lng: 48.1517, sortOrder: 13,
    districts: [{ slug: 'ismayilli-merkez', nameAz: 'İsmayıllı mərkəz', lat: 40.7878, lng: 48.1517 }] },
  { slug: 'goycay', nameAz: 'Göyçay', nameRu: 'Гёйчай', lat: 40.6533, lng: 47.7403, sortOrder: 14,
    districts: [{ slug: 'goycay-merkez', nameAz: 'Göyçay mərkəz', lat: 40.6533, lng: 47.7403 }] },
  { slug: 'qax', nameAz: 'Qax', nameRu: 'Гах', lat: 41.4206, lng: 46.9189, sortOrder: 15,
    districts: [{ slug: 'qax-merkez', nameAz: 'Qax mərkəz', lat: 41.4206, lng: 46.9189 }] },
];
