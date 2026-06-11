// AZ regionları — Azərbaycanın bütün şəhər və rayonları (~77).
// Region = inzibati vahid (şəhər/rayon); District = onun mərkəzi/qəsəbələri.

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

// Tək-mərkəzli region üçün qısa helper
let _ord = 0;
const r = (
  slug: string,
  nameAz: string,
  nameRu: string,
  lat: number,
  lng: number,
): SeedRegion => ({
  slug,
  nameAz,
  nameRu,
  lat,
  lng,
  sortOrder: ++_ord,
  districts: [{ slug: `${slug}-merkez`, nameAz: `${nameAz} mərkəz`, lat, lng }],
});

export const REGIONS: SeedRegion[] = [
  // ── Böyük şəhərlər (öndə) ──
  {
    slug: 'baki', nameAz: 'Bakı', nameRu: 'Баку', lat: 40.4093, lng: 49.8671, sortOrder: ++_ord,
    districts: [
      { slug: 'baki-bineqedi', nameAz: 'Binəqədi', lat: 40.4647, lng: 49.8233 },
      { slug: 'baki-xetai', nameAz: 'Xətai', lat: 40.3800, lng: 49.9000 },
      { slug: 'baki-xezer', nameAz: 'Xəzər', lat: 40.4344, lng: 50.0386 },
      { slug: 'baki-qaradag', nameAz: 'Qaradağ', lat: 40.2200, lng: 49.6500 },
      { slug: 'baki-nerimanov', nameAz: 'Nərimanov', lat: 40.4072, lng: 49.8956 },
      { slug: 'baki-nesimi', nameAz: 'Nəsimi', lat: 40.3800, lng: 49.8400 },
      { slug: 'baki-nizami', nameAz: 'Nizami', lat: 40.4006, lng: 49.9389 },
      { slug: 'baki-pirallahi', nameAz: 'Pirallahı', lat: 40.4719, lng: 50.3167 },
      { slug: 'baki-sabuncu', nameAz: 'Sabunçu', lat: 40.4400, lng: 49.9400 },
      { slug: 'baki-sebail', nameAz: 'Səbail', lat: 40.3600, lng: 49.8350 },
      { slug: 'baki-suraxani', nameAz: 'Suraxanı', lat: 40.4144, lng: 49.9533 },
      { slug: 'baki-yasamal', nameAz: 'Yasamal', lat: 40.3900, lng: 49.8000 },
    ],
  },
  r('sumqayit', 'Sumqayıt', 'Сумгаит', 40.5897, 49.6686),
  r('gence', 'Gəncə', 'Гянджа', 40.6828, 46.3606),
  r('mingecevir', 'Mingəçevir', 'Мингечевир', 40.7700, 47.0489),
  r('lenkeran', 'Lənkəran', 'Ленкорань', 38.7540, 48.8510),
  r('seki', 'Şəki', 'Шеки', 41.1919, 47.1706),
  r('sirvan', 'Şirvan', 'Ширван', 39.9266, 48.9206),
  r('yevlax', 'Yevlax', 'Евлах', 40.6169, 47.1500),
  r('naxcivan', 'Naxçıvan', 'Нахичевань', 39.2089, 45.4122),
  r('naftalan', 'Naftalan', 'Нафталан', 40.5072, 46.8225),
  r('xankendi', 'Xankəndi', 'Ханкенди', 39.8154, 46.7522),

  // ── Rayonlar (əlifba sırası) ──
  r('abseron', 'Abşeron', 'Абшерон', 40.5500, 49.5500),
  r('agcabedi', 'Ağcabədi', 'Агджабеди', 40.0531, 47.4592),
  r('agdam', 'Ağdam', 'Агдам', 39.9931, 46.9303),
  r('agdas', 'Ağdaş', 'Агдаш', 40.6494, 47.4736),
  r('agstafa', 'Ağstafa', 'Агстафа', 41.1206, 45.4536),
  r('agsu', 'Ağsu', 'Агсу', 40.5683, 48.4017),
  r('astara', 'Astara', 'Астара', 38.4558, 48.8753),
  r('babek', 'Babək', 'Бабек', 39.1525, 45.4475),
  r('balaken', 'Balakən', 'Балакен', 41.7036, 46.4039),
  r('beyleqan', 'Beyləqan', 'Бейлаган', 39.7728, 47.6153),
  r('berde', 'Bərdə', 'Барда', 40.3742, 47.1281),
  r('bilesuvar', 'Biləsuvar', 'Билясувар', 39.4597, 48.5511),
  r('cebrayil', 'Cəbrayıl', 'Джебраил', 39.3989, 47.0269),
  r('celilabad', 'Cəlilabad', 'Джалилабад', 39.2089, 48.4953),
  r('culfa', 'Culfa', 'Джульфа', 38.9542, 45.6294),
  r('daskesen', 'Daşkəsən', 'Дашкесан', 40.5206, 46.0789),
  r('fuzuli', 'Füzuli', 'Физули', 39.6025, 47.1431),
  r('gedebey', 'Gədəbəy', 'Гедабек', 40.5667, 45.8108),
  r('goranboy', 'Goranboy', 'Геранбой', 40.6106, 46.7889),
  r('goycay', 'Göyçay', 'Гёйчай', 40.6533, 47.7403),
  r('goygol', 'Göygöl', 'Гёйгёль', 40.5878, 46.3253),
  r('haciqabul', 'Hacıqabul', 'Гаджигабул', 40.0381, 48.9119),
  r('imisli', 'İmişli', 'Имишли', 39.8694, 48.0653),
  r('ismayilli', 'İsmayıllı', 'Исмаиллы', 40.7878, 48.1517),
  r('kelbecer', 'Kəlbəcər', 'Кельбаджар', 40.1064, 46.0381),
  r('kengerli', 'Kəngərli', 'Кенгерли', 39.3911, 45.2400),
  r('kurdemir', 'Kürdəmir', 'Кюрдамир', 40.3447, 48.1564),
  r('qax', 'Qax', 'Гах', 41.4206, 46.9189),
  r('qazax', 'Qazax', 'Газах', 41.0931, 45.3661),
  r('qebele', 'Qəbələ', 'Габала', 40.9803, 47.8456),
  r('qobustan', 'Qobustan', 'Гобустан', 40.5328, 48.9286),
  r('quba', 'Quba', 'Куба', 41.3617, 48.5128),
  r('qubadli', 'Qubadlı', 'Губадлы', 39.3450, 46.5808),
  r('qusar', 'Qusar', 'Гусар', 41.4275, 48.4308),
  r('lacin', 'Laçın', 'Лачин', 39.6383, 46.5475),
  r('lerik', 'Lerik', 'Лерик', 38.7733, 48.4153),
  r('masalli', 'Masallı', 'Масаллы', 39.0342, 48.6658),
  r('neftcala', 'Neftçala', 'Нефтечала', 39.3597, 49.2469),
  r('oguz', 'Oğuz', 'Огуз', 41.0717, 47.4656),
  r('ordubad', 'Ordubad', 'Ордубад', 38.9047, 46.0233),
  r('saatli', 'Saatlı', 'Саатлы', 39.9311, 48.3697),
  r('sabirabad', 'Sabirabad', 'Сабирабад', 40.0103, 48.4789),
  r('sederek', 'Sədərək', 'Садарак', 39.7167, 44.8889),
  r('salyan', 'Salyan', 'Сальяны', 39.5764, 48.9789),
  r('samux', 'Samux', 'Самух', 40.7589, 46.4067),
  r('siyezen', 'Siyəzən', 'Сиазань', 41.0789, 49.1117),
  r('sabran', 'Şabran', 'Шабран', 41.2156, 48.9947),
  r('sahbuz', 'Şahbuz', 'Шахбуз', 39.4072, 45.5708),
  r('shamaxi', 'Şamaxı', 'Шемаха', 40.6311, 48.6411),
  r('semkir', 'Şəmkir', 'Шамкир', 40.8294, 46.0153),
  r('serur', 'Şərur', 'Шарур', 39.5556, 44.9836),
  r('susa', 'Şuşa', 'Шуша', 39.7589, 46.7494),
  r('terter', 'Tərtər', 'Тертер', 40.3422, 46.9319),
  r('tovuz', 'Tovuz', 'Товуз', 40.9953, 45.6172),
  r('ucar', 'Ucar', 'Уджар', 40.5181, 47.6489),
  r('xacmaz', 'Xaçmaz', 'Хачмаз', 41.4592, 48.8065),
  r('xizi', 'Xızı', 'Хызы', 40.9081, 49.0728),
  r('xocali', 'Xocalı', 'Ходжалы', 39.9136, 46.7950),
  r('xocavend', 'Xocavənd', 'Ходжавенд', 39.7906, 46.9911),
  r('yardimli', 'Yardımlı', 'Ярдымлы', 38.9047, 48.2483),
  r('zaqatala', 'Zaqatala', 'Закаталы', 41.6314, 46.6444),
  r('zengilan', 'Zəngilan', 'Зангилан', 39.0894, 46.6519),
  r('zerdab', 'Zərdab', 'Зардаб', 40.2186, 47.7117),
];
