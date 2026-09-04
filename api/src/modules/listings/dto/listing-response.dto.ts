import type { Listing, ListingImage } from '@prisma/client';

export interface ListingImageResponse {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  blurHash: string | null;
  sortOrder: number;
}

export interface ListingResponse {
  id: string;
  title: string;
  slug: string;
  vertical: string;
  description: string;
  price: number | null;
  currency: string;
  priceType: Listing['priceType'];
  condition: Listing['condition'];
  status: Listing['status'];
  attributes: Record<string, unknown>;
  hasDelivery: boolean;
  hasCredit: boolean;
  hasBarter: boolean;
  hasWarranty: boolean;
  source: Listing['source'];
  inStock: boolean;
  stockQty: number | null;
  oldPrice: number | null;
  storeId: string | null;
  contactName: string | null;
  contactPhone: string | null;
  // Create DTO-da qəbul olunub DB-yə yazılırdı, amma cavabda yox idi — frontend WhatsApp düyməsini
  // bu sahəyə görə göstərir, ona görə kontrakt boşluğu düyməni bütün elanlarda gizlədirdi.
  contactWhatsapp: boolean;
  address: string | null;
  lat: number | null;
  lng: number | null;
  isVip: boolean;
  isPremium: boolean;
  views: number;
  favoritesCount: number;
  publishedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  categoryId: string;
  categoryName: string | null;
  categorySlug: string | null;
  districtId: string | null;
  districtName: string | null;
  regionName: string | null;
  regionSlug: string | null;
  images: ListingImageResponse[];
}

type WithRelations = Listing & {
  images?: ListingImage[];
  category?: { nameAz: string; slug: string } | null;
  district?: {
    nameAz: string;
    slug: string;
    region?: { nameAz: string; slug: string } | null;
  } | null;
};

export function toListingResponse(listing: WithRelations): ListingResponse {
  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    vertical: listing.vertical,
    description: listing.description,
    // `? :` DEYİL, `!= null` — Decimal(0) falsy-dir, ona görə əvvəlki forma
    // PULSUZ (0 AZN) elanın qiymətini `null`-a çevirirdi və UI onu "razılaşma yolu ilə"
    // kimi göstərirdi. Sıralamada da 0 qiymətli elan qiymətsiz kimi davranırdı.
    price: listing.price != null ? Number(listing.price) : null,
    currency: listing.currency,
    priceType: listing.priceType,
    condition: listing.condition,
    status: listing.status,
    attributes: (listing.attributes ?? {}) as Record<string, unknown>,
    hasDelivery: listing.hasDelivery,
    hasCredit: listing.hasCredit,
    hasBarter: listing.hasBarter,
    hasWarranty: listing.hasWarranty,
    source: listing.source,
    inStock: listing.inStock,
    stockQty: listing.stockQty,
    oldPrice: listing.oldPrice != null ? Number(listing.oldPrice) : null, // eyni səbəb: 0 falsy-dir
    storeId: listing.storeId,
    contactName: listing.contactName,
    contactPhone: listing.contactPhone,
    contactWhatsapp: listing.contactWhatsapp,
    address: listing.address,
    lat: listing.lat,
    lng: listing.lng,
    isVip: listing.isVip,
    isPremium: listing.isPremium,
    views: listing.views,
    favoritesCount: listing.favoritesCount,
    publishedAt: listing.publishedAt,
    expiresAt: listing.expiresAt,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    ownerId: listing.ownerId,
    categoryId: listing.categoryId,
    categoryName: listing.category?.nameAz ?? null,
    categorySlug: listing.category?.slug ?? null,
    districtId: listing.districtId,
    districtName: listing.district?.nameAz ?? null,
    regionName: listing.district?.region?.nameAz ?? null,
    regionSlug: listing.district?.region?.slug ?? null,
    images: (listing.images ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      width: img.width,
      height: img.height,
      blurHash: img.blurHash,
      sortOrder: img.sortOrder,
    })),
  };
}
