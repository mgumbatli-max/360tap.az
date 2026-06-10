import Link from 'next/link';
import { notFound } from 'next/navigation';

const API = process.env.API_ORIGIN
  ? `${process.env.API_ORIGIN}/api/v1`
  : 'http://localhost:5500/api/v1';

type Detail = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  oldPrice: number | null;
  currency: string;
  priceType: string;
  condition?: string | null;
  hasDelivery?: boolean;
  hasWarranty?: boolean;
  hasCredit?: boolean;
  inStock?: boolean;
  source?: string;
  isVip?: boolean;
  isPremium?: boolean;
  views?: number;
  contactName?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: boolean;
  address?: string | null;
  createdAt: string;
  images?: { url: string }[];
};

async function getListing(id: string): Promise<Detail | null> {
  try {
    const r = await fetch(`${API}/listings/${id}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = (await r.json()) as { data?: Detail };
    return d.data ?? null;
  } catch {
    return null;
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await getListing(id);
  if (!l) notFound();

  const cover = l.images?.[0]?.url;
  const price =
    l.price != null ? `${Number(l.price).toLocaleString('az-AZ')} ${l.currency}` : 'Razılaşma yolu ilə';
  const phone = l.contactPhone ?? undefined;

  return (
    <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link href="/elanlar" className="text-tap text-sm font-medium">
          ← Elanlara qayıt
        </Link>

        <div className="grid md:grid-cols-[1fr_340px] gap-6 mt-3">
          {/* Sol: qalereya + təsvir */}
          <div>
            <div className="aspect-video bg-ink-100 dark:bg-ink-800 rounded-2xl overflow-hidden">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={l.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-ink-400">Şəkil yoxdur</div>
              )}
            </div>
            {l.images && l.images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {l.images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img.url}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg shrink-0"
                  />
                ))}
              </div>
            )}

            <div className="card p-5 mt-4">
              <h2 className="font-bold text-ink-900 dark:text-white mb-2">Təsvir</h2>
              <p className="text-ink-700 dark:text-ink-300 whitespace-pre-line leading-relaxed">
                {l.description}
              </p>
            </div>
          </div>

          {/* Sağ: qiymət + əlaqə */}
          <aside>
            <div className="card p-5 md:sticky md:top-24">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {l.source === 'erp' && l.inStock && (
                  <span className="badge badge-trusted">ERP təsdiqlənmiş stok</span>
                )}
                {l.isVip && <span className="badge badge-trusted">VIP</span>}
                {l.isPremium && !l.isVip && <span className="badge badge-trusted">Premium</span>}
              </div>

              <div className="text-2xl font-extrabold text-ink-900 dark:text-white">{price}</div>
              {l.oldPrice != null && (
                <div className="text-ink-400 line-through text-sm">
                  {Number(l.oldPrice).toLocaleString('az-AZ')} {l.currency}
                </div>
              )}

              <h1 className="text-lg font-bold text-ink-900 dark:text-white mt-2 leading-snug">
                {l.title}
              </h1>
              {l.address && <p className="text-ink-500 text-sm mt-1">📍 {l.address}</p>}

              <div className="flex flex-wrap gap-1.5 mt-3 text-xs">
                {l.hasDelivery && <span className="badge badge-deliver">Çatdırılma</span>}
                {l.hasWarranty && <span className="badge">Zəmanət</span>}
                {l.hasCredit && <span className="badge">Kredit</span>}
                {l.inStock ? (
                  <span className="badge badge-deliver">Stokda var</span>
                ) : (
                  <span className="badge">Stokda yox</span>
                )}
              </div>

              {phone && (
                <div className="mt-4 space-y-2">
                  <a
                    href={`tel:${phone}`}
                    className="btn-tap w-full flex items-center justify-center"
                  >
                    📞 Zəng et
                  </a>
                  {l.contactWhatsapp && (
                    <a
                      href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary w-full flex items-center justify-center"
                    >
                      WhatsApp ilə yaz
                    </a>
                  )}
                </div>
              )}

              <p className="text-ink-400 text-xs mt-3">Baxış sayı: {l.views ?? 0}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
