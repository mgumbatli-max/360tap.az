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

/**
 * SEVİMLİ YOXLAMASI — MİKRO-PAKETLƏMƏ İLƏ.
 *
 * PROBLEM: `ListingCard` hər kart üçün `checkFavorites([item.id])` çağırırdı.
 * 40 kartlıq siyahıda bu, 40 AYRICA HTTP sorğusu deməkdir — ölçüldü: elan
 * siyahısında 40+ `GET /favorites/check?ids=<tək-id>`. Brauzerin host başına
 * paralel bağlantı limiti səbəbindən bu sorğular növbəyə düşür və digər
 * (vacib) sorğuları gecikdirir; serverdə isə hər biri ayrıca DB gedişidir.
 *
 * Endpoint ONSUZ DA `ids=` siyahısı qəbul edir — problem çağırış tərəfindədir.
 * Komponentlərə id toplama məsuliyyəti vermək (prop drilling, valideyn
 * konteksti) hər istifadə yerini dəyişməyi tələb edərdi; əvəzinə paketləmə
 * BURADA, şəffaf şəkildə edilir: eyni mikrotaskda gələn bütün id-lər bir
 * sorğuda birləşir və hər çağırana öz nəticəsi qaytarılır.
 *
 * Növbə `microtask` sərhədində boşalır — React-in eyni render dalğasındakı
 * bütün `useEffect` çağırışları toplanır, amma heç bir süni gecikmə əlavə
 * olunmur (setTimeout istifadə edilmir).
 */
let pendingIds: string[] = [];
let pendingPromise: Promise<Set<string>> | null = null;

async function flushFavoriteChecks(): Promise<Set<string>> {
  const ids = [...new Set(pendingIds)];
  pendingIds = [];
  pendingPromise = null;
  if (!ids.length) return new Set();
  try {
    // NestJS: { data: string[] }
    const d = await api<{ data?: string[]; favorites?: string[] }>(
      `/favorites/check?ids=${ids.join(',')}`,
    );
    return new Set(d.data ?? d.favorites ?? []);
  } catch {
    return new Set();
  }
}

export async function checkFavorites(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  pendingIds.push(...ids);
  // İlk çağıran növbəni planlaşdırır; qalanları eyni vədə qoşulur.
  pendingPromise ??= Promise.resolve().then(flushFavoriteChecks);
  const all = await pendingPromise;
  // Hər çağırana YALNIZ öz soruşduğu id-lər qaytarılır — paket detalı sızmır.
  return new Set(ids.filter((id) => all.has(id)));
}

// LocalStorage cache (anonim istifadəçilər üçün)
const STORAGE_KEY = 'avito_favorites_local';

export function getLocalFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}

/**
 * Anonim ikən localStorage-da yığılan sevimliləri hesaba köçürür (login/register-dən sonra).
 *
 * PROBLEM: qonaq kimi ürəklənən elanlar heç vaxt serverə getmirdi — istifadəçi qeydiyyatdan
 * keçən kimi /profil/sevimliler yalnız `getMyFavorites()`-i (server) oxuduğu üçün seçim itirdi.
 *
 * QƏRARLAR:
 *  · `Promise.allSettled` — silinmiş elan (404) və ya UUID olmayan köhnə açar (400) bütün
 *    köçürməni dayandırmasın; qalanları yenə də köçsün.
 *  · localStorage YALNIZ ən azı bir sorğu uğurlu olduqda təmizlənir — tam şəbəkə xətasında
 *    seçim lokalda qalır, növbəti girişdə yenidən cəhd olunur (əks halda həm serverdə,
 *    həm lokalda itərdi).
 *  · Funksiya heç vaxt exception atmır: çağıran tərəf onu `void` fon işi kimi işlədir ki,
 *    20 sevimlisi olan istifadəçidə giriş 20 sorğu qədər yavaşlamasın.
 */
export async function migrateLocalFavorites(): Promise<void> {
  const local = [...getLocalFavorites()];
  if (!local.length) return;
  try {
    const results = await Promise.allSettled(
      local.map((id) => api(`/listings/${id}/favorite`, { method: 'POST' })),
    );
    if (results.some((r) => r.status === 'fulfilled')) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // sükutla keç — köçürmə uğursuzdursa lokal seçim yerində qalır
  }
}

export function setLocalFavorite(id: string, fav: boolean): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const set = getLocalFavorites();
  if (fav) set.add(id);
  else set.delete(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  return set;
}
