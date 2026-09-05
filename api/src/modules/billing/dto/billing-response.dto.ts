import type { Package, Payment, Prisma, Subscription } from '@prisma/client';

/**
 * Prisma `Decimal` JSON-a sətir kimi düşür (Decimal.js `toJSON`). Frontend rəqəm
 * gözləyir — elan cavabında da eyni çevirmə tətbiq olunur (listing-response.dto.ts).
 */
function num(value: Prisma.Decimal): number {
  return Number(value);
}

/** `Json` sahəsi massiv/skalyar da ola bilər; kontrakt obyekt vəd edir. */
function asObject(value: Prisma.JsonValue): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

// ─────────────────────────────── PAKETLƏR ───────────────────────────────

export interface PackageResponse {
  id: string;
  code: string;
  name: string;
  priceMonthly: number;
  durationDays: number;
  serviceBalance: number;
  listingQuota: number;
  discountPercent: number;
  description: string | null;
  limits: Record<string, unknown>;
  features: Record<string, unknown>;
  sortOrder: number;
}

export interface AdminPackageResponse extends PackageResponse {
  isActive: boolean;
  createdAt: Date;
  /** Neçə abunə satılıb — paketi silmək olarmı sualına cavab verir. */
  subscriptionsCount: number;
}

export function toPackageResponse(pkg: Package): PackageResponse {
  return {
    id: pkg.id,
    code: pkg.code,
    name: pkg.name,
    priceMonthly: num(pkg.priceMonthly),
    durationDays: pkg.durationDays,
    serviceBalance: num(pkg.serviceBalance),
    listingQuota: pkg.listingQuota,
    discountPercent: pkg.discountPercent,
    description: pkg.description,
    limits: asObject(pkg.limits),
    features: asObject(pkg.features),
    sortOrder: pkg.sortOrder,
  };
}

export function toAdminPackageResponse(
  pkg: Package & { _count?: { subscriptions: number } },
): AdminPackageResponse {
  return {
    ...toPackageResponse(pkg),
    isActive: pkg.isActive,
    createdAt: pkg.createdAt,
    subscriptionsCount: pkg._count?.subscriptions ?? 0,
  };
}

// ─────────────────────────────── ABUNƏLƏR ───────────────────────────────

/**
 * İSTİFADƏÇİYƏ GÖRÜNƏN cavabda paketin QİYMƏTİ QƏSDƏN YOXDUR.
 * Başlanğıc siyasəti: monetizasiya bayraqları açılana qədər platformada heç
 * bir yerdə qiymət göstərilmir. İstifadəçiyə lazım olan şey qalıq resursdur
 * (balans/kvota), qiymət deyil.
 */
export interface MeSubscriptionResponse {
  id: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  balanceLeft: number;
  quotaLeft: number;
  discountPercent: number;
  package: { code: string; name: string; description: string | null };
}

export interface AdminSubscriptionResponse {
  id: string;
  userId: string;
  packageId: string;
  status: string;
  /** Saxlanan `status` köhnələ bilər (vaxt keçir, sətir yenilənmir) — faktiki hal. */
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
  balanceLeft: number;
  quotaLeft: number;
  discountPercent: number;
  grantedBy: string | null;
  note: string | null;
  createdAt: Date;
  package: { id: string; code: string; name: string };
  user: { id: string; fullName: string; email: string | null; phone: string | null } | null;
}

type SubscriptionWithPackage = Subscription & { package: Package };

export function toMeSubscriptionResponse(sub: SubscriptionWithPackage): MeSubscriptionResponse {
  return {
    id: sub.id,
    status: sub.status,
    startsAt: sub.startsAt,
    endsAt: sub.endsAt,
    balanceLeft: num(sub.balanceLeft),
    quotaLeft: sub.quotaLeft,
    discountPercent: sub.discountPercent,
    package: {
      code: sub.package.code,
      name: sub.package.name,
      description: sub.package.description,
    },
  };
}

export function toAdminSubscriptionResponse(
  sub: SubscriptionWithPackage,
  user: { id: string; fullName: string; email: string | null; phone: string | null } | null,
  now: Date = new Date(),
): AdminSubscriptionResponse {
  return {
    id: sub.id,
    userId: sub.userId,
    packageId: sub.packageId,
    status: sub.status,
    isActive: sub.status === 'active' && sub.endsAt > now,
    startsAt: sub.startsAt,
    endsAt: sub.endsAt,
    balanceLeft: num(sub.balanceLeft),
    quotaLeft: sub.quotaLeft,
    discountPercent: sub.discountPercent,
    grantedBy: sub.grantedBy,
    note: sub.note,
    createdAt: sub.createdAt,
    package: { id: sub.package.id, code: sub.package.code, name: sub.package.name },
    user,
  };
}

// ─────────────────────────────── ÖDƏNİŞLƏR ──────────────────────────────

export interface PaymentResponse {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: string;
  status: Payment['status'];
  provider: string | null;
  providerRef: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export function toPaymentResponse(payment: Payment): PaymentResponse {
  return {
    id: payment.id,
    userId: payment.userId,
    amount: num(payment.amount),
    currency: payment.currency,
    type: payment.type,
    status: payment.status,
    provider: payment.provider,
    providerRef: payment.providerRef,
    metadata: asObject(payment.metadata),
    createdAt: payment.createdAt,
  };
}
