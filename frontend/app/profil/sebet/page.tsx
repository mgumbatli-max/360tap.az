'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfileLayout from '@/components/ProfileLayout';
import { ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { azNumber } from '@/lib/format';

type CartItem = {
  id: string;
  title: string;
  price: number;
  currency: string;
  cover?: string;
  qty: number;
};

const KEY = 'tap_cart';
const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};
const setCart = (items: CartItem[]) => localStorage.setItem(KEY, JSON.stringify(items));

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const toast = useToast();

  useEffect(() => setItems(getCart()), []);

  const update = (next: CartItem[]) => { setItems(next); setCart(next); };
  const remove = (id: string) => update(items.filter((x) => x.id !== id));
  const setQty = (id: string, qty: number) => {
    if (qty < 1) return remove(id);
    update(items.map((x) => x.id === id ? { ...x, qty } : x));
  };
  const total = items.reduce((s, x) => s + Number(x.price) * x.qty, 0);

  // Sabitləşdirmə: əvvəl bu funksiya `toast.success('Sifariş yaradıldı (demo)')` göstərib
  // `update([])` ilə səbəti BOŞALDIRDI — halbuki backend-də nə POST /cart, nə POST /orders var,
  // yəni real məhsullarla dolu səbət heç bir iz qoymadan itirdi və istifadəçi sifariş
  // verdiyini zənn edirdi. İndi: dürüst xəbərdarlıq + səbət TOXUNULMAZ qalır.
  // Alternativ (düyməni tamamilə silmək) rədd edildi: səbətin niyə hərəkətsiz olduğu
  // istifadəçiyə heç cür izah olunmazdı.
  const checkout = () => {
    toast.info('Sifariş sistemi hazırlanır — sifarişiniz hələ qeydə alınmır. Satıcı ilə mesajlaşma vasitəsilə əlaqə saxlayın.');
  };

  return (
    <ProfileLayout>
      <div className="card p-5">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <ShoppingBag className="w-6 h-6 text-tap" />
          Səbət
        </h1>
        <p className="text-sm text-ink-500 mb-5">B2C/B2B alış-veriş səbəti</p>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto mb-3 text-ink-300" />
            <p className="text-ink-500 mb-4">Səbətiniz hələ ki boşdur</p>
            <Link href="/elanlar" className="btn-tap inline-flex">
              <Plus className="w-4 h-4" /> Elanlara bax
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex gap-4 items-center border-b border-ink-100 pb-3">
                  <div className="w-20 h-20 bg-ink-100 rounded-lg overflow-hidden shrink-0">
                    {it.cover && <img src={it.cover} alt={it.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/elanlar/${it.id}`} className="font-bold text-ink-900 line-clamp-2 hover:text-tap">{it.title}</Link>
                    <div className="text-tap font-bold mt-1">{azNumber(it.price)} {it.currency}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(it.id, it.qty - 1)} className="w-8 h-8 rounded-lg border border-ink-200 flex items-center justify-center hover:bg-ink-100">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold w-8 text-center">{it.qty}</span>
                    <button onClick={() => setQty(it.id, it.qty + 1)} className="w-8 h-8 rounded-lg border border-ink-200 flex items-center justify-center hover:bg-ink-100">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(it.id)} className="ml-2 p-1.5 hover:bg-red-50 text-red-600 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-sm text-ink-500">Cəmi: {items.length} məhsul</div>
              <div className="text-2xl font-extrabold text-tap">{azNumber(total)} AZN</div>
            </div>
            <button onClick={checkout} className="btn-tap w-full mt-4">Sifariş ver</button>
            <p className="text-xs text-ink-500 mt-2 text-center">
              Onlayn sifariş hazırlanır. Hazırda alış satıcı ilə birbaşa razılaşma yolu ilə tamamlanır.
            </p>
          </>
        )}
      </div>
    </ProfileLayout>
  );
}
