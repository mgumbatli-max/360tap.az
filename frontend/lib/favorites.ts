import { api } from './api';

export async function toggleFavorite(listingId: string, currentlyFav: boolean): Promise<boolean> {
  if (currentlyFav) {
    await api(`/listings/${listingId}/favorite`, { method: 'DELETE' });
    return false;
  } else {
    await api(`/listings/${listingId}/favorite`, { method: 'POST' });
    return true;
  }
}

export async function getMyFavorites(): Promise<any[]> {
  // NestJS: { data: ListingResponse[] }
  const d = await api<{ data?: any[]; items?: any[] }>('/favorites');
  return d.data ?? d.items ?? [];
}

export async function checkFavorites(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  try {
    // NestJS: { data: string[] }
    const d = await api<{ data?: string[]; favorites?: string[] }>(`/favorites/check?ids=${ids.join(',')}`);
    return new Set(d.data ?? d.favorites ?? []);
  } catch {
    return new Set();
  }
}

// LocalStorage cache (anonim istifadəçilər üçün)
const STORAGE_KEY = 'avito_favorites_local';

export function getLocalFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}

export function setLocalFavorite(id: string, fav: boolean): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const set = getLocalFavorites();
  if (fav) set.add(id);
  else set.delete(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  return set;
}
