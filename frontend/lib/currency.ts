// Valyuta çeviricisi — Mərkəzi Bank məzənnələri (statik, sonra real API)
const RATES: Record<string, number> = {
  AZN: 1,
  USD: 0.59,    // 1 AZN = 0.59 USD
  EUR: 0.55,
  RUB: 50,
  GBP: 0.46,
  TRY: 19.5,
};

const SYMBOLS: Record<string, string> = {
  AZN: '₼', USD: '$', EUR: '€', RUB: '₽', GBP: '£', TRY: '₺',
};

const KEY = 'tap_currency';

export type Currency = keyof typeof RATES;

export function getCurrency(): Currency {
  if (typeof window === 'undefined') return 'AZN';
  try {
    return (localStorage.getItem(KEY) as Currency) || 'AZN';
  } catch { return 'AZN'; }
}

export function setCurrency(c: Currency): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, c);
    window.dispatchEvent(new Event('currency-changed'));
  } catch {}
}

export function convertPrice(price: number, from: Currency = 'AZN', to?: Currency): number {
  const target = to || getCurrency();
  if (from === target) return price;
  // AZN-yə çevir, sonra hədəf valyutaya
  const inAzn = price / (RATES[from] ?? 1);
  return inAzn * (RATES[target] ?? 1);
}

export function formatPrice2(price: number | null | undefined, originalCurrency: string = 'AZN', forceCurrency?: Currency): string {
  if (price == null) return 'Razılaşma';
  const target = forceCurrency || getCurrency();
  const converted = convertPrice(Number(price), originalCurrency as Currency, target);
  const formatter = new Intl.NumberFormat('az-AZ', {
    minimumFractionDigits: target === 'AZN' || target === 'RUB' ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${formatter.format(converted)} ${SYMBOLS[target] || target}`;
}

export const CURRENCIES: Array<{ code: Currency; name: string; symbol: string }> = [
  { code: 'AZN', name: 'Manat',     symbol: '₼' },
  { code: 'USD', name: 'Dollar',    symbol: '$' },
  { code: 'EUR', name: 'Avro',      symbol: '€' },
  { code: 'RUB', name: 'Rubl',      symbol: '₽' },
  { code: 'GBP', name: 'Funt',      symbol: '£' },
  { code: 'TRY', name: 'Lirə',      symbol: '₺' },
];
