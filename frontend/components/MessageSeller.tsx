'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Loader2, MessageSquare, Phone, Send, ShoppingCart, Truck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { checkFavorites, getLocalFavorites, setLocalFavorite, toggleFavorite } from '@/lib/favorites';

/**
 * NİYƏ modul səviyyəli abunə siyahısı (provider deyil):
 * sağ relsdə «Yaz» CTA-sı ilə aşağıdakı «Satıcıdan soruş» qutusunun ARASINDA
 * server-render olunan satıcı bloku var — onlar bir React ağacında qonşu deyil.
 * Ortaq state üçün context qurmaq bütün relsi klient komponentinə çevirərdi
 * (server-render itərdi); bu kiçik pub/sub isə hər iki adacığı eyni mesaj axınına
 * bağlayır və heç bir mövcud data axınına toxunmur.
 */
type ComposerOpener = (preset: string) => void;
const composerOpeners = new Set<ComposerOpener>();
function requestComposer(preset = ''): void {
  composerOpeners.forEach((fn) => fn(preset));
}

/** §7.2.4 — tünd pill çipləri. Klik mətni qutuya yazır və fokusu ora aparır. */
const QUICK_ASKS = ['Nə vaxt baxmaq olar?', 'Bu gün baxmaq olar?', 'Sabah baxmaq olar?'];

/** Səbət mövcud `/profil/sebet` səhifəsi ilə EYNİ localStorage açarını paylaşır —
 *  burada yeni saxlama sxemi qurulmur, ona görə düymə real işləyir. */
const CART_KEY = 'tap_cart';

type CartEntry = { id: string; title: string; price: number; currency: string; cover?: string; qty: number };

function addToCart(entry: Omit<CartEntry, 'qty'>): void {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const list: CartEntry[] = raw ? JSON.parse(raw) : [];
    const found = list.findIndex((x) => x?.id === entry.id);
    if (found >= 0) list[found].qty = (Number(list[found].qty) || 1) + 1;
    else list.push({ ...entry, qty: 1 });
    localStorage.setItem(CART_KEY, JSON.stringify(list));
  } catch {
    // localStorage bağlıdırsa (private rejim) səbət sadəcə yadda saxlanmır — axın kəsilmir.
  }
}

/** Ölçü sinifləri qəsdən burada DEYİL: eyni düymə həm 48px tam enli relsdə,
 *  həm də mobil sticky paneldə yığcam halda işlədilir (bir-birini əvəz edən
 *  `w-full`/`w-auto` siniflərinin qarışması qarşısı alınır). */
const CTA_BASE = 'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition';
const CTA_FULL = `${CTA_BASE} h-12 w-full px-3`;
const CTA_COMPACT = `${CTA_BASE} h-11 px-4`;

/* ══════════════════════════════════════════════════════════════════
   §7.2.1–7.2.2 — qiymət + ♥, altında YAN-YANA CTA cütü,
   mobildə isə ekranın altına yapışan sticky panel (§11).
   ══════════════════════════════════════════════════════════════════ */
export function ListingActions({
  listingId,
  ownerId,
  title,
  priceLabel,
  oldPriceLabel,
  price,
  currency,
  cover,
  phone,
  whatsapp,
  hasDelivery,
}: {
  listingId: string;
  ownerId: string;
  title: string;
  priceLabel: string;
  oldPriceLabel?: string | null;
  price?: number | null;
  currency: string;
  cover?: string;
  phone?: string;
  whatsapp?: boolean;
  hasDelivery?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Auth istifadəçidə server, anonimdə localStorage — ListingCard ilə eyni məntiq.
  useEffect(() => {
    let alive = true;
    if (user) {
      checkFavorites([listingId]).then((s) => alive && setFav(s.has(listingId)));
    } else {
      setFav(getLocalFavorites().has(listingId));
    }
    return () => {
      alive = false;
    };
  }, [user, listingId]);

  const onFav = async () => {
    if (favBusy) return;
    setFavBusy(true);
    try {
      if (user) setFav(await toggleFavorite(listingId, fav));
      else {
        setLocalFavorite(listingId, !fav);
        setFav(!fav);
      }
    } catch {
      // Sevimli əlavəsi ikinci dərəcəlidir — səhifəni xəta ilə kəsmirik.
    } finally {
      setFavBusy(false);
    }
  };

  const isOwner = !!user && user.id === ownerId;
  const canBuy = !!hasDelivery && price != null;

  const buy = (goToCart: boolean) => {
    if (price == null) return;
    addToCart({ id: listingId, title, price: Number(price), currency, cover });
    if (goToCart) router.push('/profil/sebet');
    else toast.success('Elan səbətə əlavə olundu');
  };

  // Avito məntiqi: nömrə əvvəlcə gizlidir, klikdən sonra açılır və `tel:` linkinə çevrilir.
  const phoneBtn = (compact: boolean) => {
    if (!phone) return null;
    const cls = `${compact ? CTA_COMPACT : CTA_FULL} bg-success text-white hover:opacity-90`;
    return revealed ? (
      <a href={`tel:${phone}`} className={cls}>
        <Phone className="h-4 w-4" aria-hidden="true" /> <span className="truncate">{phone}</span>
      </a>
    ) : (
      <button type="button" onClick={() => setRevealed(true)} className={cls}>
        <Phone className="h-4 w-4" aria-hidden="true" /> Telefonu göstər
      </button>
    );
  };

  const writeBtn = (compact: boolean) =>
    isOwner ? null : (
      <button
        type="button"
        onClick={() => requestComposer('')}
        className={`${compact ? CTA_COMPACT : CTA_FULL} bg-tap text-white hover:bg-tap-600`}
      >
        <MessageSquare className="h-4 w-4" aria-hidden="true" /> Yaz
      </button>
    );

  return (
    <div>
      {/* Qiymət 28px/700 + sağında dairəvi ♥ */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[28px] font-bold leading-tight text-ink-900 dark:text-white">{priceLabel}</p>
          {oldPriceLabel && (
            <p className="mt-0.5 text-sm text-ink-400 line-through dark:text-ink-500">{oldPriceLabel}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onFav}
          disabled={favBusy}
          aria-pressed={fav}
          aria-label={fav ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-200 transition hover:border-ink-300 disabled:opacity-50 dark:border-ink-700 dark:hover:border-ink-600"
        >
          <Heart
            className={`h-5 w-5 transition ${fav ? 'fill-danger text-danger' : 'text-ink-500 dark:text-ink-400'}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Çatdırılmalı elan: bənövşəyi cüt ƏLAVƏ sətir kimi — əlaqə düymələri itmir. */}
      {canBuy && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => buy(true)}
            className={`${CTA_FULL} bg-violet-600 text-white hover:bg-violet-700`}
          >
            <Truck className="h-4 w-4" aria-hidden="true" /> Çatdırılma ilə al
          </button>
          <button
            type="button"
            onClick={() => buy(false)}
            className={`${CTA_FULL} bg-violet-600 text-white hover:bg-violet-700`}
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" /> Səbətə at
          </button>
        </div>
      )}

      {/* Adi CTA cütü — yan-yana; tək düymə qalanda tam eni tutur. */}
      {(phone || !isOwner) && (
        <div
          className={`grid gap-2 ${canBuy ? 'mt-2' : 'mt-4'} ${
            phone && !isOwner ? 'grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {phoneBtn(false)}
          {writeBtn(false)}
        </div>
      )}

      {whatsapp && phone && (
        <a
          href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-ink-200 text-sm font-semibold text-ink-700 transition hover:border-ink-300 dark:border-ink-700 dark:text-ink-200 dark:hover:border-ink-600"
        >
          WhatsApp ilə yaz
        </a>
      )}

      {/* §11 — mobildə CTA cütü ekranın altına yapışır. Səhifə konteynerində
          `pb-*` boşluğu var ki, panel məzmunu örtməsin.
          Heç bir əməliyyat qalmayanda (öz elanı + telefonsuz) panel ümumiyyətlə çıxmır. */}
      {(phone || canBuy || !isOwner) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white px-4 py-3 dark:border-ink-700 dark:bg-ink-900 lg:hidden">
          <div className="mx-auto flex max-w-[1360px] items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-base font-bold text-ink-900 dark:text-white">
              {priceLabel}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {canBuy ? (
                <button
                  type="button"
                  onClick={() => buy(true)}
                  className={`${CTA_COMPACT} bg-violet-600 text-white hover:bg-violet-700`}
                >
                  <Truck className="h-4 w-4" aria-hidden="true" /> Al
                </button>
              ) : (
                phoneBtn(true)
              )}
              {writeBtn(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   §7.2.4 — «Satıcıdan soruş»: boz söhbət qutusu + tünd pill çipləri.
   Default export və prop imzası dəyişmir (`listingId`, `ownerId`).
   ══════════════════════════════════════════════════════════════════ */
export default function MessageSeller({ listingId, ownerId }: { listingId: string; ownerId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [text, setText] = useState('Salam!');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const open = useCallback((preset: string) => {
    if (preset) setText(preset);
    boxRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    composerOpeners.add(open);
    return () => {
      composerOpeners.delete(open);
    };
  }, [open]);

  // Öz elanına mesaj yazmaq olmaz — əvvəlki davranış saxlanılır.
  if (user && user.id === ownerId) return null;

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    if (!user) {
      setError('Mesaj yazmaq üçün yuxarıdan "Daxil ol" düyməsi ilə hesabınıza daxil olun.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const r = await api<{ data?: { id: string } }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ listingId, message: body }),
      });
      const id = r.data?.id;
      if (id) router.push(`/profil/mesajlar?c=${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mesaj göndərilə bilmədi');
    } finally {
      setSending(false);
    }
  };

  return (
    <section ref={boxRef} id="satici-sorgu">
      <h2 className="text-[17px] font-bold text-ink-900 dark:text-white">Satıcıdan soruş</h2>

      <div className="mt-3 flex items-end gap-2 rounded-xl bg-ink-100 p-2.5 dark:bg-ink-800">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          aria-label="Satıcıya mesaj"
          placeholder="Salam!"
          className="max-h-32 flex-1 resize-none bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 dark:text-white dark:placeholder:text-ink-500"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !text.trim()}
          aria-label="Mesajı göndər"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tap text-white transition hover:bg-tap-600 disabled:opacity-40"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {QUICK_ASKS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => open(q)}
            className="rounded-full bg-ink-800 px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-ink-900 dark:bg-ink-700 dark:hover:bg-ink-600"
          >
            {q}
          </button>
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-danger dark:text-danger-light">{error}</p>}
    </section>
  );
}
