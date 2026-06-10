const azMap: Record<string, string> = {
  ə: 'e', ı: 'i', ö: 'o', ü: 'u', ğ: 'g', ş: 's', ç: 'c',
  Ə: 'e', İ: 'i', Ö: 'o', Ü: 'u', Ğ: 'g', Ş: 's', Ç: 'c',
};

export function makeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[əıöüğşçƏİÖÜĞŞÇ]/g, (c) => azMap[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

import { randomBytes } from 'node:crypto';

export function uniqueSlug(text: string): string {
  const base = makeSlug(text) || 'elan';
  // Vaxt + təsadüfi → eyni millisaniyədə də toqquşma olmasın
  const suffix = Date.now().toString(36).slice(-4) + randomBytes(2).toString('hex');
  return `${base}-${suffix}`;
}
