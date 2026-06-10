const KEY = 'avito_selected_city';

export type SelectedCity = {
  slug: string;
  name: string;
} | null;

export function getCity(): SelectedCity {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export function setCity(city: SelectedCity): void {
  if (typeof window === 'undefined') return;
  if (city) localStorage.setItem(KEY, JSON.stringify(city));
  else localStorage.removeItem(KEY);
  // hadisə yayım
  window.dispatchEvent(new Event('city-changed'));
}
