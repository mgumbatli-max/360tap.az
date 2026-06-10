// Kateqoriya ağacı + dynamic attributes (Faza 0 starter — admin paneldən genişlənir)
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

export const CATEGORIES: SeedCategory[] = [
  {
    slug: 'neqliyyat', nameAz: 'Nəqliyyat', vertical: 'transport', icon: 'car',
    children: [
      {
        slug: 'avtomobiller', nameAz: 'Avtomobillər', vertical: 'transport',
        attributes: [
          { key: 'brand', labelAz: 'Marka', type: 'select', isSearchable: true },
          { key: 'model', labelAz: 'Model', type: 'select', isSearchable: true },
          { key: 'year', labelAz: 'Buraxılış ili', type: 'number', unit: 'il' },
          { key: 'mileage', labelAz: 'Yürüş', type: 'number', unit: 'km' },
          { key: 'fuel', labelAz: 'Yanacaq növü', type: 'select', options: ['Benzin', 'Dizel', 'Qaz', 'Hibrid', 'Elektro'] },
          { key: 'transmission', labelAz: 'Sürətlər qutusu', type: 'select', options: ['Mexaniki', 'Avtomat', 'Robot', 'Variator'] },
          { key: 'body', labelAz: 'Ban növü', type: 'select', options: ['Sedan', 'Hetçbek', 'Universal', 'Krossover', 'Offroader', 'Pikap'] },
          { key: 'no_accident', labelAz: 'Vuruğu yoxdur', type: 'boolean' },
          { key: 'not_painted', labelAz: 'Rənglənməyib', type: 'boolean' },
        ],
      },
      { slug: 'motosikletler', nameAz: 'Motosikletlər', vertical: 'transport' },
      { slug: 'ehtiyat-hisseleri', nameAz: 'Ehtiyat hissələri', vertical: 'transport' },
    ],
  },
  {
    slug: 'dasinmaz-emlak', nameAz: 'Daşınmaz əmlak', vertical: 'realestate', icon: 'home',
    children: [
      {
        slug: 'menziller', nameAz: 'Mənzillər', vertical: 'realestate',
        attributes: [
          { key: 'deal_type', labelAz: 'Əməliyyat', type: 'select', options: ['Alış', 'Kirayə', 'Günlük'] },
          { key: 'rooms', labelAz: 'Otaq sayı', type: 'number' },
          { key: 'area', labelAz: 'Sahə', type: 'number', unit: 'm²' },
          { key: 'floor', labelAz: 'Mərtəbə', type: 'number' },
          { key: 'total_floors', labelAz: 'Binanın mərtəbə sayı', type: 'number' },
          { key: 'repair', labelAz: 'Təmir', type: 'select', options: ['Təmirli', 'Təmirsiz', 'Orta'] },
          { key: 'has_extract', labelAz: 'Çıxarış', type: 'boolean' },
          { key: 'has_mortgage', labelAz: 'İpoteka', type: 'boolean' },
        ],
      },
      { slug: 'heyet-evleri', nameAz: 'Həyət evləri / Villalar', vertical: 'realestate' },
      { slug: 'torpaq', nameAz: 'Torpaq', vertical: 'realestate' },
      { slug: 'ofisler', nameAz: 'Ofis / Obyekt', vertical: 'realestate' },
    ],
  },
  {
    slug: 'is-elanlari', nameAz: 'İş elanları', vertical: 'job', icon: 'briefcase',
    attributes: [
      { key: 'salary_min', labelAz: 'Maaş (min)', type: 'number', unit: 'AZN' },
      { key: 'salary_max', labelAz: 'Maaş (max)', type: 'number', unit: 'AZN' },
      { key: 'schedule', labelAz: 'İş qrafiki', type: 'select', options: ['Tam ştat', 'Yarım ştat', 'Uzaqdan', 'Ofisdə', 'Hibrid'] },
      { key: 'experience', labelAz: 'Təcrübə', type: 'select', options: ['Təcrübəsiz', '1-3 il', '3-5 il', '5+ il'] },
    ],
    children: [
      { slug: 'is-it', nameAz: 'İT / Proqramlaşdırma', vertical: 'job' },
      { slug: 'is-satis', nameAz: 'Satış', vertical: 'job' },
      { slug: 'is-xidmet', nameAz: 'Xidmət sahəsi', vertical: 'job' },
    ],
  },
  {
    slug: 'elektronika', nameAz: 'Elektronika', vertical: 'universal', icon: 'smartphone',
    children: [
      {
        slug: 'telefonlar', nameAz: 'Telefonlar', vertical: 'universal',
        attributes: [
          { key: 'brand', labelAz: 'Marka', type: 'select', options: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Digər'], isSearchable: true },
          { key: 'memory', labelAz: 'Yaddaş', type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
          { key: 'condition', labelAz: 'Vəziyyəti', type: 'select', options: ['Yeni', 'İşlənmiş'] },
        ],
      },
      { slug: 'komputerler', nameAz: 'Kompüterlər', vertical: 'universal' },
      { slug: 'mesisat-texnikasi', nameAz: 'Məişət texnikası', vertical: 'universal' },
    ],
  },
  { slug: 'geyim', nameAz: 'Geyim', vertical: 'universal', icon: 'shirt' },
  { slug: 'ev-bag', nameAz: 'Ev və bağ', vertical: 'universal', icon: 'sofa' },
  { slug: 'xidmetler', nameAz: 'Xidmətlər', vertical: 'universal', icon: 'wrench' },
];
