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
  const d = await api<{ items: any[] }>('/favorites');
  return d.items ?? [];
}

export async function checkFavorites(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  try {
    const d = await api<{ favorites: string[] }>(`/favorites/check?ids=${ids.join(',')}`);
    return new Set(d.favorites ?? []);
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
