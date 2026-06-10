import slugify from 'slugify';

const azMap = { ə: 'e', ı: 'i', ö: 'o', ü: 'u', ğ: 'g', ş: 's', ç: 'c' };

export function makeSlug(text) {
  const normalized = String(text)
    .toLowerCase()
    .replace(/[əıöüğşç]/g, (c) => azMap[c] || c);
  return slugify(normalized, { lower: true, strict: true, trim: true }).slice(0, 120);
}
