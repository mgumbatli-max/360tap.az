// AZ→Latin və Latin→AZ translit (axtarış üçün hər iki istiqamət)
const AZ_TO_LAT = { 'ə': 'e', 'ı': 'i', 'ö': 'o', 'ü': 'u', 'ğ': 'g', 'ş': 's', 'ç': 'c' };
const LAT_TO_AZ_VARIANTS = {
  'e': ['e', 'ə'], 'i': ['i', 'ı'], 'o': ['o', 'ö'],
  'u': ['u', 'ü'], 'g': ['g', 'ğ'], 's': ['s', 'ş'], 'c': ['c', 'ç'],
};

export function azToLatin(s) {
  return String(s).toLowerCase().replace(/[əıöüğşç]/g, (c) => AZ_TO_LAT[c] || c);
}

// Sinonim sözlüyü (genişləndirilmiş)
const SYNONYMS = {
  'maşın': ['avtomobil', 'avto'],
  'avto': ['avtomobil'],
  'tel': ['telefon'],
  'phone': ['telefon'],
  'mobil': ['telefon'],
  'laptop': ['noutbuk'],
  'pc': ['kompüter', 'kompyuter'],
  'kompüter': ['pc', 'kompyuter'],
  'kompyuter': ['kompüter', 'pc'],
  'sumsung': ['samsung'],
  'samsang': ['samsung'],
  'iphon': ['iphone'],
  'ayfon': ['iphone', 'apple'],
  'aypad': ['ipad', 'apple'],
  'apple': ['iphone', 'mac', 'ipad'],
  'ev': ['mənzil', 'ev', 'menzil'],
  'mənzil': ['ev', 'menzil'],
  'kraye': ['kirayə', 'kiraye'],
  'satış': ['satılır', 'satilir', 'satis'],
  'satilir': ['satılır', 'satış'],
  'iş': ['vəzifə', 'is', 'vakansiya'],
  'is': ['iş'],
  'vakansiya': ['iş', 'is', 'vəzifə'],
};

// Stop words (AZ + EN)
const STOP_WORDS = new Set([
  'və', 'ilə', 'üçün', 'bu', 'o', 'mən', 'sən', 'biz', 'siz', 'onlar',
  'amma', 'lakin', 'çünki', 'ki', 'ya', 'həm', 'da', 'də', 'ya da',
  'and', 'or', 'the', 'a', 'an', 'is', 'are', 'with', 'for', 'to', 'of',
]);

/**
 * Sorğunu pars edir:
 *  - "iPhone 15" — exact phrase
 *  - 1000-2000 — qiymət range
 *  - -2010 — exclude
 *  - tag:value — atribut filter
 */
export function parseQuery(raw) {
  const q = String(raw || '').trim();
  if (!q) return { tokens: [], phrases: [], excludes: [], priceMin: null, priceMax: null, normalized: '' };

  const phrases = [];
  let work = q.replace(/"([^"]+)"/g, (_, p) => {
    phrases.push(p.toLowerCase().trim());
    return ' ';
  });

  // Range: 1000-2000 yaxud 1000+
  let priceMin = null, priceMax = null;
  work = work.replace(/(\d{2,8})\s*-\s*(\d{2,8})/g, (_, a, b) => {
    priceMin = Number(a); priceMax = Number(b);
    return ' ';
  });

  // Exclude: -BMW
  const excludes = [];
  work = work.replace(/(^|\s)-(\w+)/g, (_, sp, w) => {
    excludes.push(w.toLowerCase()); return sp;
  });

  // Tokens
  const tokens = work
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t && t.length > 1 && !STOP_WORDS.has(t));

  // Sinonim genişlənmə
  const expandedTokens = new Set();
  tokens.forEach((t) => {
    expandedTokens.add(t);
    if (SYNONYMS[t]) SYNONYMS[t].forEach((s) => expandedTokens.add(s));
    // AZ→Latin
    const lat = azToLatin(t);
    if (lat !== t) expandedTokens.add(lat);
  });

  return {
    tokens: [...expandedTokens],
    phrases,
    excludes,
    priceMin, priceMax,
    normalized: [...expandedTokens, ...phrases].join(' '),
  };
}

/**
 * SQL WHERE fragment yaradır (multi-token, weighted)
 * Title-də match → score: 3.0
 * Description match  → score: 1.0
 * Category match     → score: 2.0
 * Trigram similarity → ranged 0-1
 */
export function buildSearchSql(q, paramOffset = 0) {
  const parsed = parseQuery(q);
  if (parsed.tokens.length === 0 && parsed.phrases.length === 0) {
    return { where: '', params: [], scoreExpr: '0', priceMin: null, priceMax: null };
  }

  const params = [];
  const conditions = [];

  // Hər token üçün ILIKE
  parsed.tokens.forEach((tok) => {
    params.push(`%${tok}%`);
    conditions.push(`(unaccent(lower(l.title)) ILIKE unaccent($${paramOffset + params.length})
                     OR unaccent(lower(l.description)) ILIKE unaccent($${paramOffset + params.length})
                     OR unaccent(lower(c.name_az)) ILIKE unaccent($${paramOffset + params.length}))`);
  });

  // Phrases (exact)
  parsed.phrases.forEach((p) => {
    params.push(`%${p}%`);
    conditions.push(`l.title ILIKE $${paramOffset + params.length}`);
  });

  // Excludes
  parsed.excludes.forEach((e) => {
    params.push(`%${e}%`);
    conditions.push(`l.title NOT ILIKE $${paramOffset + params.length}`);
  });

  // Trigram similarity — ən vacib token üzrə (ranking üçün)
  const mainQ = parsed.normalized;
  params.push(mainQ);
  const simIdx = paramOffset + params.length;

  // Score expression — weighted
  const scoreExpr = `
    (CASE WHEN l.title %> $${simIdx} THEN similarity(l.title, $${simIdx}) * 3 ELSE 0 END
   + CASE WHEN c.name_az %> $${simIdx} THEN similarity(c.name_az, $${simIdx}) * 2 ELSE 0 END
   + CASE WHEN l.is_vip THEN 0.5 ELSE 0 END
   + CASE WHEN l.is_premium THEN 0.3 ELSE 0 END)
  `;

  return {
    where: conditions.length ? `(${conditions.join(' AND ')})` : '',
    params,
    scoreExpr,
    priceMin: parsed.priceMin,
    priceMax: parsed.priceMax,
    parsed,
  };
}
