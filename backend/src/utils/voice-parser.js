// Səsli sorğunu strukturlaşdırılmış filterlərə çevirən AI parser
// Azərbaycan dili pattern-lərini başa düşür

import { query } from '../db.js';

const CITIES = {
  'bakı': 'baki', 'baki': 'baki', 'bakida': 'baki', 'bakıda': 'baki',
  'sumqayıt': 'sumqayit', 'sumqayit': 'sumqayit', 'sumqayitda': 'sumqayit',
  'gəncə': 'ganca', 'gənjə': 'ganca', 'gence': 'ganca', 'gəncədə': 'ganca',
  'mingəçevir': 'mingacevir', 'mingacevir': 'mingacevir',
  'lənkəran': 'lenkeran', 'lenkeran': 'lenkeran',
  'şəki': 'seki', 'seki': 'seki',
  'quba': 'quba', 'qubada': 'quba',
};

const CATEGORIES = {
  // Telefon
  'telefon': 'telefon', 'mobil': 'telefon', 'phone': 'telefon',
  'iphone': 'telefon', 'samsung': 'telefon', 'xiaomi': 'telefon',

  // Avtomobil
  'avtomobil': 'avtomobil', 'maşın': 'avtomobil', 'masin': 'avtomobil',
  'avto': 'avtomobil', 'car': 'avtomobil',
  'bmw': 'avtomobil', 'mercedes': 'avtomobil', 'mers': 'avtomobil',
  'audi': 'avtomobil', 'toyota': 'avtomobil', 'honda': 'avtomobil',
  'hyundai': 'avtomobil', 'kia': 'avtomobil', 'lexus': 'avtomobil',
  'porsche': 'avtomobil', 'volkswagen': 'avtomobil', 'lada': 'avtomobil',
  'mazda': 'avtomobil', 'ford': 'avtomobil',

  // Mənzil
  'mənzil': 'menzil-satilir', 'menzil': 'menzil-satilir',
  'ev': 'menzil-satilir', 'kvartira': 'menzil-satilir',
  'kirayə': 'menzil-kiraye', 'kiraye': 'menzil-kiraye', 'icarə': 'menzil-kiraye',

  // Digər
  'noutbuk': 'noutbuk', 'laptop': 'noutbuk', 'macbook': 'noutbuk',
  'kompüter': 'kompyuter', 'kompyuter': 'kompyuter', 'pc': 'kompyuter',
  'iş': 'is-elanlari', 'is': 'is-elanlari', 'vakansiya': 'is-elanlari',
  'xidmət': 'xidmetler', 'xidmet': 'xidmetler',
  'tv': 'tv-audio', 'televizor': 'tv-audio',
  'mebel': 'ev-ve-bag', 'divan': 'ev-ve-bag', 'çarpayı': 'ev-ve-bag',
  'geyim': 'geyim', 'paltar': 'geyim', 'ayaqqabı': 'geyim',
  'oyuncaq': 'usaq', 'uşaq': 'usaq', 'usaq': 'usaq',
  'pişik': 'heyvanlar', 'it': 'heyvanlar', 'heyvan': 'heyvanlar',
};

const BRANDS = ['BMW', 'Mercedes', 'Audi', 'Toyota', 'Honda', 'Hyundai', 'Kia',
                'Lexus', 'Porsche', 'Volkswagen', 'Lada', 'Mazda', 'Ford',
                'Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Honor'];

const CONDITIONS = {
  'yeni': 'new', 'new': 'new',
  'işlənmiş': 'used', 'islenmis': 'used',
  'az işlənmiş': 'like_new', 'az islenmis': 'like_new',
};

// "10 min", "10000", "10k" → 10000
function parseAmount(s) {
  s = String(s).trim().toLowerCase();
  const num = parseFloat(s.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return null;
  if (s.includes('min') || s.includes('k')) return num * 1000;
  if (s.includes('mln') || s.includes('milyon')) return num * 1000000;
  return num;
}

/**
 * Parse voice text to filter URL parameters
 * Examples:
 *   "Bakıda 2018-ci ildən sonra BMW tap" →
 *     { category: 'avtomobil', city: 'baki', attr_brand: 'BMW', attr_year_min: '2018' }
 *
 *   "10000 manatdan ucuz mənzil" →
 *     { category: 'menzil-satilir', max_price: '10000' }
 *
 *   "iPhone 14 az işlənmiş" →
 *     { q: 'iPhone 14', condition: 'like_new' }
 */
export function parseVoiceQuery(text) {
  const orig = String(text || '').trim();
  const lower = orig.toLowerCase();
  const tokens = lower.split(/\s+/);
  const filters = {};
  let q = orig;

  // 1. ŞƏHƏR (word-boundary, daha uzun match prioritet)
  const sortedCities = Object.entries(CITIES).sort((a, b) => b[0].length - a[0].length);
  for (const [phrase, slug] of sortedCities) {
    const re = new RegExp(`\\b${phrase}\\b`, 'gi');
    if (re.test(lower)) {
      filters.city = slug;
      q = q.replace(re, '').trim();
      break;
    }
  }

  // 2. KATEQORİYA — daha uzun match prioritet (kirayə > mənzil)
  // Plus: 'kirayə' sözü varsa menzil-kiraye, 'mənzil' tək olduqda menzil-satilir
  let detectedCategory = null;
  if (/\b(kirayə|kiraye|icarə|icare)\b/i.test(lower)) {
    detectedCategory = 'menzil-kiraye';
  } else {
    const sortedCats = Object.entries(CATEGORIES).sort((a, b) => b[0].length - a[0].length);
    for (const [phrase, slug] of sortedCats) {
      const re = new RegExp(`\\b${phrase}\\b`, 'i');
      if (re.test(lower)) {
        detectedCategory = slug;
        break;
      }
    }
  }
  if (detectedCategory) filters.category = detectedCategory;

  // 3. BRAND (atribut)
  for (const brand of BRANDS) {
    if (lower.includes(brand.toLowerCase())) {
      filters.attr_brand = brand;
      break;
    }
  }

  // 4. QİYMƏT range — yalnız "manat/azn/₼" sözü ilə birlikdə qiymət sayılır
  // "X manatdan ucuz" / "X-dən aşağı" → max
  const maxPriceRe = /(\d[\d\s.,]*)\s*(min\s+)?(manat|azn|₼)\s*(dan|dən)\s*(ucuz|aşağı|asagi|kiçik)/i;
  const maxM = lower.match(maxPriceRe);
  if (maxM) {
    const v = parseAmount(maxM[1] + (maxM[2] || ''));
    if (v) filters.max_price = String(v);
  }

  // "X manatdan baha" / "X-dən yuxarı" → min
  const minPriceRe = /(\d[\d\s.,]*)\s*(min\s+)?(manat|azn|₼)\s*(dan|dən)\s*(baha|yuxarı|yukari|çox|böyük)/i;
  const minM = lower.match(minPriceRe);
  if (minM) {
    const v = parseAmount(minM[1] + (minM[2] || ''));
    if (v) filters.min_price = String(v);
  }

  // "X-Y manat" range
  const rangeRe = /(\d[\d\s.,]*)\s*[-–]\s*(\d[\d\s.,]*)\s*(manat|azn|₼)?/i;
  const rangeM = lower.match(rangeRe);
  if (rangeM) {
    const a = parseAmount(rangeM[1]);
    const b = parseAmount(rangeM[2]);
    if (a && b) {
      filters.min_price = String(Math.min(a, b));
      filters.max_price = String(Math.max(a, b));
    }
  }

  // 5. İL (avtomobil)
  // "2018-ci ildən" / "2018+" → year_min
  const yearMinRe = /(\d{4})[\s-]*(ci|cu|cü)?\s*(il)?\s*(dən|dan)\s*(sonra|yuxarı)?/i;
  const yearMinM = lower.match(yearMinRe);
  if (yearMinM) filters.attr_year_min = yearMinM[1];

  // "2020-ci ilədək" → year_max
  const yearMaxRe = /(\d{4})\s*(ci|cu)?\s*(il)?\s*(ə|a)dək/i;
  const yearMaxM = lower.match(yearMaxRe);
  if (yearMaxM) filters.attr_year_max = yearMaxM[1];

  // "2020-ci il" tək → exact
  const yearExactRe = /\b(20[0-2]\d|19[7-9]\d)\b/;
  if (!filters.attr_year_min && !filters.attr_year_max) {
    const yearM = lower.match(yearExactRe);
    if (yearM && filters.category === 'avtomobil') {
      filters.attr_year_min = yearM[1];
    }
  }

  // 6. VƏZİYYƏT — daha uzun match prioritet ("az işlənmiş" → like_new, sonra "yeni" → new)
  const sortedConds = Object.entries(CONDITIONS).sort((a, b) => b[0].length - a[0].length);
  for (const [phrase, slug] of sortedConds) {
    const re = new RegExp(`\\b${phrase}\\b`, 'i');
    if (re.test(lower)) {
      filters.condition = slug;
      q = q.replace(re, '').trim();
      break;
    }
  }

  // 7. ÇATDIRILMA
  if (lower.includes('çatdırılma') || lower.includes('catdirilma')) {
    filters.has_delivery = 'true';
  }
  if (lower.includes('kredit')) filters.has_credit = 'true';
  if (lower.includes('barter') || lower.includes('dəyişmə')) filters.has_barter = 'true';

  // 8. q — açar söz (təmizlənmiş)
  q = q
    .replace(/\b(tap|axtar|göstər|gostr|göst|al|sat|kirayə|kiraye|icarə|icare)\b/gi, '')
    .replace(/\b(üçün|ucun|ilə|ile|və|ve|haqqında|olan|olsun|ilə)\b/gi, '')
    .replace(/\b(\d{4}-?ci|\d{4}-?cu|\d{4}-?cü|il)\b/gi, '')
    .replace(/\b(ildən sonra|ildən|sonra|əvvəl|qədər|dək)\b/gi, '')
    .replace(/(dan|dən)\s*(ucuz|baha|aşağı|yuxarı|asagi|yukari)/gi, '')
    .replace(/(\d[\d\s.,]*)\s*(min|k)?\s*(manat|azn|₼)/gi, '')
    .replace(/\b(çatdırılma|catdirilma|kredit|barter|dəyişmə)\b/gi, '')
    .replace(/\b(var|yox)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Brand artıq attr-da varsa, q-dan da sil
  if (filters.attr_brand) {
    q = q.replace(new RegExp('\\b' + filters.attr_brand + '\\b', 'gi'), '').trim();
  }
  // Bütün kateqoriya açar sözləri q-dən sil
  Object.keys(CATEGORIES).forEach((cat) => {
    q = q.replace(new RegExp('\\b' + cat + '\\b', 'gi'), '');
  });
  // Bütün şəhər adları
  Object.keys(CITIES).forEach((c) => {
    q = q.replace(new RegExp('\\b' + c + '\\b', 'gi'), '');
  });
  // Vəziyyət sözləri
  Object.keys(CONDITIONS).forEach((c) => {
    q = q.replace(new RegExp('\\b' + c + '\\b', 'gi'), '');
  });
  q = q.replace(/\s+/g, ' ').trim();
  // Çox qısa qaldıqda silmək
  if (q.length < 3) q = '';

  if (q && q.length >= 2) filters.q = q;

  return {
    original: orig,
    filters,
    suggestion: buildSuggestion(filters, orig),
  };
}

function buildSuggestion(f, original) {
  const parts = [];
  if (f.q) parts.push(`"${f.q}"`);
  if (f.attr_brand) parts.push(f.attr_brand);
  if (f.category) parts.push(f.category.replace(/-/g, ' '));
  if (f.city) parts.push(`${f.city}-da`);
  if (f.attr_year_min) parts.push(`${f.attr_year_min}+`);
  if (f.min_price) parts.push(`${f.min_price}₼-dən baha`);
  if (f.max_price) parts.push(`${f.max_price}₼-dən ucuz`);
  if (f.condition === 'new') parts.push('yeni');
  if (f.condition === 'like_new') parts.push('az işlənmiş');
  if (f.condition === 'used') parts.push('işlənmiş');
  if (f.has_delivery) parts.push('çatdırılma var');
  return parts.length > 0
    ? `Anladım: ${parts.join(' · ')}`
    : `Axtarış: "${original}"`;
}

export async function parseVoiceWithDb(text) {
  const result = parseVoiceQuery(text);
  // Burada gələcəkdə Anthropic Claude API çağırışı əlavə oluna bilər
  // hazırda offline pattern matching ilə kifayət
  return result;
}
