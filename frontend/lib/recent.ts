const KEY = 'avito_recent_listings';
const MAX = 12;

export type RecentItem = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  cover?: string;
  city?: string;
  viewedAt: number;
};

export function getRecent(): RecentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function pushRecent(item: Omit<RecentItem, 'viewedAt'>): void {
  if (typeof window === 'undefined') return;
  const list = getRecent().filter((x) => x.id !== item.id);
  list.unshift({ ...item, viewedAt: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function clearRecent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
