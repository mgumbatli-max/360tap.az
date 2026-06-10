const KEY = 'avito_compare';
const MAX = 4;

export type CompareItem = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  cover?: string;
  city?: string;
  category?: string;
  attributes?: Record<string, unknown>;
};

export function getCompare(): CompareItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function addCompare(item: CompareItem): boolean {
  if (typeof window === 'undefined') return false;
  const list = getCompare();
  if (list.find((x) => x.id === item.id)) return false;
  if (list.length >= MAX) return false;
  list.push(item);
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('compare-changed'));
  return true;
}

export function removeCompare(id: string): void {
  if (typeof window === 'undefined') return;
  const list = getCompare().filter((x) => x.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('compare-changed'));
}

export function clearCompare(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('compare-changed'));
}

export function isInCompare(id: string): boolean {
  return getCompare().some((x) => x.id === id);
}
