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
  districtId: string | null;
  images: ListingImageResponse[];
}

export function toListingResponse(
  listing: Listing & { images?: ListingImage[] },
): ListingResponse {
  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    vertical: listing.vertical,
    description: listing.description,
    price: listing.price ? Number(listing.price) : null,
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
    oldPrice: listing.oldPrice ? Number(listing.oldPrice) : null,
    storeId: listing.storeId,
    contactName: listing.contactName,
    contactPhone: listing.contactPhone,
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
    districtId: listing.districtId,
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
