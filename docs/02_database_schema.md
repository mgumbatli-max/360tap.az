# 02 — Verilənlər bazası sxemi (Prisma)

## Konvensiyalar
- Bütün ID-lər **UUID v4**.
- Bütün `created_at`, `updated_at` `TIMESTAMPTZ`.
- Soft-delete: `deleted_at` (yalnız hesablar və kontent üçün).
- JSON sahələri: `attributes`, `metadata`.
- Çoxdilli sahələr: `name_az`, `name_ru`, `name_en` (3-cü mərhələ üçün).

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =========================================================
// İSTİFADƏÇİLƏR VƏ ROLLAR
// =========================================================

enum UserRole {
  guest
  user
  pro
  business
  moderator
  senior_moderator
  support
  ad_manager
  admin
  super_admin
}

enum UserStatus {
  pending
  active
  suspended
  banned
  deleted
}

model User {
  id                  String      @id @default(uuid())
  email               String?     @unique
  phone               String?     @unique
  passwordHash        String      @map("password_hash")
  fullName            String      @map("full_name") @db.VarChar(120)
  avatarUrl           String?     @map("avatar_url")
  bio                 String?     @db.Text
  cityId              String?     @map("city_id")
  city                City?       @relation(fields: [cityId], references: [id])
  role                UserRole    @default(user)
  status              UserStatus  @default(pending)
  isPhoneVerified     Boolean     @default(false) @map("is_phone_verified")
  isEmailVerified     Boolean     @default(false) @map("is_email_verified")
  isBusiness          Boolean     @default(false) @map("is_business")
  twoFactorEnabled    Boolean     @default(false) @map("two_factor_enabled")
  twoFactorSecret     String?     @map("two_factor_secret")
  rating              Decimal     @default(0) @db.Decimal(3, 2)
  reviewsCount        Int         @default(0) @map("reviews_count")
  riskScore           Int         @default(0) @map("risk_score")  // 0-100
  balance             Decimal     @default(0) @db.Decimal(14, 2)
  bonusBalance        Decimal     @default(0) @db.Decimal(14, 2) @map("bonus_balance")
  lastLoginAt         DateTime?   @map("last_login_at")
  lastLoginIp         String?     @map("last_login_ip")
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt      @map("updated_at")
  deletedAt           DateTime?   @map("deleted_at")

  profile             Profile?
  businessProfile     BusinessProfile?
  ownedShops          Shop[]      @relation("ShopOwner")
  shopMemberships     ShopMember[]
  listings            Listing[]
  favorites           Favorite[]
  buyerChats          Chat[]      @relation("Buyer")
  sellerChats         Chat[]      @relation("Seller")
  sentMessages        Message[]
  notifications       Notification[]
  payments            Payment[]
  walletTransactions  WalletTransaction[]
  subscriptions       Subscription[]
  reviewsGiven        Review[]    @relation("ReviewerUser")
  reviewsReceived     Review[]    @relation("ReviewedUser")
  complaintsFiled     Complaint[] @relation("Reporter")
  moderationActions   ModerationTask[]
  adminLogs           AdminLog[]
  searchLogs          SearchLog[]
  savedSearches       SavedSearch[]

  @@index([role, status])
  @@index([cityId])
  @@map("users")
}

model Profile {
  userId              String      @id @map("user_id")
  user                User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  birthDate           DateTime?   @map("birth_date")
  gender              String?     @db.VarChar(10)
  preferredLanguage   String      @default("az") @map("preferred_language") @db.VarChar(2)
  notificationPrefs   Json        @default("{}") @map("notification_prefs")
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  @@map("profiles")
}

model BusinessProfile {
  userId              String      @id @map("user_id")
  user                User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  voen                String?     @unique @db.VarChar(20)  // VÖEN
  legalName           String      @map("legal_name") @db.VarChar(200)
  legalAddress        String?     @map("legal_address") @db.Text
  contactPhone        String?     @map("contact_phone")
  contactEmail        String?     @map("contact_email")
  website             String?
  isVerified          Boolean     @default(false) @map("is_verified")
  verifiedAt          DateTime?   @map("verified_at")
  createdAt           DateTime    @default(now()) @map("created_at")

  @@map("business_profiles")
}

// =========================================================
// MAĞAZALAR
// =========================================================

model Shop {
  id                  String      @id @default(uuid())
  ownerId             String      @map("owner_id")
  owner               User        @relation("ShopOwner", fields: [ownerId], references: [id])
  slug                String      @unique
  name                String      @db.VarChar(120)
  logoUrl             String?     @map("logo_url")
  coverUrl            String?     @map("cover_url")
  description         String?     @db.Text
  address             String?     @db.Text
  cityId              String?     @map("city_id")
  city                City?       @relation(fields: [cityId], references: [id])
  phones              String[]    @default([])
  workingHours        Json?       @map("working_hours")
  socialLinks         Json?       @map("social_links")
  websiteUrl          String?     @map("website_url")
  isPremium           Boolean     @default(false) @map("is_premium")
  isVerified          Boolean     @default(false) @map("is_verified")
  rating              Decimal     @default(0) @db.Decimal(3, 2)
  reviewsCount        Int         @default(0) @map("reviews_count")
  followersCount      Int         @default(0) @map("followers_count")
  listingsCount       Int         @default(0) @map("listings_count")
  status              String      @default("active") @db.VarChar(20)
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  members             ShopMember[]
  listings            Listing[]
  followers           ShopFollower[]

  @@index([slug])
  @@index([cityId])
  @@map("shops")
}

model ShopMember {
  shopId              String      @map("shop_id")
  shop                Shop        @relation(fields: [shopId], references: [id], onDelete: Cascade)
  userId              String      @map("user_id")
  user                User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  role                String      @default("member") @db.VarChar(20)  // owner/manager/editor/viewer
  permissions         Json        @default("[]")
  joinedAt            DateTime    @default(now()) @map("joined_at")

  @@id([shopId, userId])
  @@map("shop_members")
}

model ShopFollower {
  shopId              String      @map("shop_id")
  shop                Shop        @relation(fields: [shopId], references: [id], onDelete: Cascade)
  userId              String      @map("user_id")
  followedAt          DateTime    @default(now()) @map("followed_at")

  @@id([shopId, userId])
  @@map("shop_followers")
}

// =========================================================
// KATEQORİYALAR
// =========================================================

model Category {
  id                  String      @id @default(uuid())
  parentId            String?     @map("parent_id")
  parent              Category?   @relation("CategoryTree", fields: [parentId], references: [id])
  children            Category[]  @relation("CategoryTree")
  slug                String      @unique @db.VarChar(120)
  nameAz              String      @map("name_az") @db.VarChar(120)
  nameRu              String?     @map("name_ru") @db.VarChar(120)
  nameEn              String?     @map("name_en") @db.VarChar(120)
  icon                String?     @db.VarChar(60)
  description         String?     @db.Text
  seoTitle            String?     @map("seo_title")
  seoDescription      String?     @map("seo_description")
  sortOrder           Int         @default(0) @map("sort_order")
  isActive            Boolean     @default(true) @map("is_active")
  listingsCount       Int         @default(0) @map("listings_count")

  attributes          CategoryAttribute[]
  listings            Listing[]

  @@index([parentId])
  @@index([slug])
  @@map("categories")
}

model CategoryAttribute {
  id                  String      @id @default(uuid())
  categoryId          String      @map("category_id")
  category            Category    @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  key                 String      @db.VarChar(60)   // marka, model, year...
  labelAz             String      @map("label_az") @db.VarChar(120)
  labelRu             String?     @map("label_ru") @db.VarChar(120)
  type                String      @db.VarChar(20)   // string/number/select/multiselect/boolean/range
  options             Json?                          // {choices: ["BMW","Audi"]}
  unit                String?     @db.VarChar(20)
  isRequired          Boolean     @default(false) @map("is_required")
  isFilterable        Boolean     @default(true)  @map("is_filterable")
  isSearchable        Boolean     @default(false) @map("is_searchable")
  sortOrder           Int         @default(0) @map("sort_order")

  @@unique([categoryId, key])
  @@map("category_attributes")
}

// =========================================================
// COĞRAFİYA
// =========================================================

model City {
  id                  String      @id @default(uuid())
  slug                String      @unique @db.VarChar(80)
  nameAz              String      @map("name_az") @db.VarChar(80)
  nameRu              String?     @map("name_ru") @db.VarChar(80)
  nameEn              String?     @map("name_en") @db.VarChar(80)
  region              String?     @db.VarChar(80)
  lat                 Float?
  lng                 Float?
  sortOrder           Int         @default(0) @map("sort_order")

  districts           District[]
  users               User[]
  shops               Shop[]
  listings            Listing[]

  @@map("cities")
}

model District {
  id                  String      @id @default(uuid())
  cityId              String      @map("city_id")
  city                City        @relation(fields: [cityId], references: [id], onDelete: Cascade)
  slug                String      @db.VarChar(80)
  nameAz              String      @map("name_az") @db.VarChar(80)
  nameRu              String?     @map("name_ru") @db.VarChar(80)
  metroStation        String?     @map("metro_station") @db.VarChar(80)
  sortOrder           Int         @default(0) @map("sort_order")

  listings            Listing[]

  @@unique([cityId, slug])
  @@map("districts")
}

// =========================================================
// ELANLAR
// =========================================================

enum ListingStatus {
  draft
  review
  active
  rejected
  expired
  sold
  archived
  blocked
  reported
}

enum PriceType {
  fixed
  negotiable
  free
  exchange
  contract
}

enum Condition {
  new
  like_new
  used
  for_parts
}

model Listing {
  id                  String           @id @default(uuid())
  ownerId             String           @map("owner_id")
  owner               User             @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  shopId              String?          @map("shop_id")
  shop                Shop?            @relation(fields: [shopId], references: [id])
  categoryId          String           @map("category_id")
  category            Category         @relation(fields: [categoryId], references: [id])
  cityId              String?          @map("city_id")
  city                City?            @relation(fields: [cityId], references: [id])
  districtId          String?          @map("district_id")
  district            District?        @relation(fields: [districtId], references: [id])

  title               String           @db.VarChar(120)
  slug                String           @db.VarChar(160)
  description         String           @db.Text
  price               Decimal?         @db.Decimal(14, 2)
  currency            String           @default("AZN") @db.VarChar(3)
  priceType           PriceType        @default(fixed) @map("price_type")
  condition           Condition?
  attributes          Json             @default("{}")  // {marka:"BMW", il:2020}

  hasDelivery         Boolean          @default(false) @map("has_delivery")
  hasCredit           Boolean          @default(false) @map("has_credit")
  hasBarter           Boolean          @default(false) @map("has_barter")
  hasWarranty         Boolean          @default(false) @map("has_warranty")

  contactName         String?          @map("contact_name") @db.VarChar(120)
  contactPhone        String?          @map("contact_phone") @db.VarChar(20)
  contactWhatsapp     Boolean          @default(false) @map("contact_whatsapp")
  contactChat         Boolean          @default(true)  @map("contact_chat")

  address             String?          @db.Text
  lat                 Float?
  lng                 Float?

  status              ListingStatus    @default(review)
  rejectionReason     String?          @map("rejection_reason")

  isVip               Boolean          @default(false) @map("is_vip")
  isPremium           Boolean          @default(false) @map("is_premium")
  isHighlight         Boolean          @default(false) @map("is_highlight")
  isUrgent            Boolean          @default(false) @map("is_urgent")
  promotionExpiresAt  DateTime?        @map("promotion_expires_at")

  views               Int              @default(0)
  favoritesCount      Int              @default(0) @map("favorites_count")
  chatsCount          Int              @default(0) @map("chats_count")
  phoneClicks         Int              @default(0) @map("phone_clicks")
  whatsappClicks      Int              @default(0) @map("whatsapp_clicks")

  publishedAt         DateTime?        @map("published_at")
  expiresAt           DateTime         @default(dbgenerated("NOW() + INTERVAL '30 days'")) @map("expires_at")
  bumpedAt            DateTime?        @map("bumped_at")
  createdAt           DateTime         @default(now()) @map("created_at")
  updatedAt           DateTime         @updatedAt @map("updated_at")

  images              ListingImage[]
  videos              ListingVideo[]
  statusLogs          ListingStatusLog[]
  favorites           Favorite[]
  chats               Chat[]
  reviews             Review[]
  complaints          Complaint[]
  moderationTasks     ModerationTask[]

  @@index([status, createdAt(sort: Desc)])
  @@index([categoryId, status])
  @@index([cityId, status])
  @@index([ownerId])
  @@index([shopId])
  @@index([price])
  @@index([isVip, promotionExpiresAt])
  @@map("listings")
}

model ListingImage {
  id                  String      @id @default(uuid())
  listingId           String      @map("listing_id")
  listing             Listing     @relation(fields: [listingId], references: [id], onDelete: Cascade)
  url                 String
  thumbnailUrl        String?     @map("thumbnail_url")
  width               Int?
  height              Int?
  size                Int?
  blurHash            String?     @map("blur_hash") @db.VarChar(60)
  sortOrder           Int         @default(0) @map("sort_order")
  createdAt           DateTime    @default(now()) @map("created_at")

  @@index([listingId, sortOrder])
  @@map("listing_images")
}

model ListingVideo {
  id                  String      @id @default(uuid())
  listingId           String      @map("listing_id")
  listing             Listing     @relation(fields: [listingId], references: [id], onDelete: Cascade)
  url                 String
  thumbnailUrl        String?     @map("thumbnail_url")
  durationSec         Int?        @map("duration_sec")
  createdAt           DateTime    @default(now()) @map("created_at")

  @@map("listing_videos")
}

model ListingStatusLog {
  id                  String      @id @default(uuid())
  listingId           String      @map("listing_id")
  listing             Listing     @relation(fields: [listingId], references: [id], onDelete: Cascade)
  fromStatus          ListingStatus? @map("from_status")
  toStatus            ListingStatus  @map("to_status")
  changedBy           String?     @map("changed_by")  // userId
  reason              String?     @db.Text
  createdAt           DateTime    @default(now()) @map("created_at")

  @@map("listing_status_logs")
}

// =========================================================
// SEÇİLMİŞLƏR VƏ SAXLANILAN AXTARIŞLAR
// =========================================================

model Favorite {
  userId              String      @map("user_id")
  user                User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  listingId           String      @map("listing_id")
  listing             Listing     @relation(fields: [listingId], references: [id], onDelete: Cascade)
  createdAt           DateTime    @default(now()) @map("created_at")

  @@id([userId, listingId])
  @@map("favorites")
}

model SavedSearch {
  id                  String      @id @default(uuid())
  userId              String      @map("user_id")
  user                User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  name                String      @db.VarChar(120)
  query               Json
  notifyEmail         Boolean     @default(true) @map("notify_email")
  notifyPush          Boolean     @default(true) @map("notify_push")
  lastNotifiedAt      DateTime?   @map("last_notified_at")
  createdAt           DateTime    @default(now()) @map("created_at")

  @@map("saved_searches")
}

// =========================================================
// CHAT VƏ MESAJLAR
// =========================================================

model Chat {
  id                  String      @id @default(uuid())
  listingId           String      @map("listing_id")
  listing             Listing     @relation(fields: [listingId], references: [id], onDelete: Cascade)
  buyerId             String      @map("buyer_id")
  buyer               User        @relation("Buyer", fields: [buyerId], references: [id], onDelete: Cascade)
  sellerId            String      @map("seller_id")
  seller              User        @relation("Seller", fields: [sellerId], references: [id], onDelete: Cascade)
  lastMessageAt       DateTime?   @map("last_message_at")
  buyerLastReadAt     DateTime?   @map("buyer_last_read_at")
  sellerLastReadAt    DateTime?   @map("seller_last_read_at")
  isBuyerBlocked      Boolean     @default(false) @map("is_buyer_blocked")
  isSellerBlocked     Boolean     @default(false) @map("is_seller_blocked")
  createdAt           DateTime    @default(now()) @map("created_at")

  messages            Message[]

  @@unique([listingId, buyerId, sellerId])
  @@index([buyerId, lastMessageAt(sort: Desc)])
  @@index([sellerId, lastMessageAt(sort: Desc)])
  @@map("chats")
}

model Message {
  id                  String      @id @default(uuid())
  chatId              String      @map("chat_id")
  chat                Chat        @relation(fields: [chatId], references: [id], onDelete: Cascade)
  senderId            String      @map("sender_id")
  sender              User        @relation(fields: [senderId], references: [id])
  content             String      @db.Text
  attachmentUrl       String?     @map("attachment_url")
  attachmentType      String?     @map("attachment_type") @db.VarChar(20)
  isFlagged           Boolean     @default(false) @map("is_flagged")
  flagReason          String?     @map("flag_reason")
  readAt              DateTime?   @map("read_at")
  createdAt           DateTime    @default(now()) @map("created_at")

  @@index([chatId, createdAt])
  @@map("messages")
}

// =========================================================
// BİLDİRİŞLƏR
// =========================================================

model Notification {
  id                  String      @id @default(uuid())
  userId              String      @map("user_id")
  user                User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  type                String      @db.VarChar(40)
  title               String      @db.VarChar(200)
  body                String?     @db.Text
  data                Json        @default("{}")
  channel             String      @default("in_app") @db.VarChar(20)  // in_app/email/sms/push
  isRead              Boolean     @default(false) @map("is_read")
  readAt              DateTime?   @map("read_at")
  createdAt           DateTime    @default(now()) @map("created_at")

  @@index([userId, isRead, createdAt(sort: Desc)])
  @@map("notifications")
}

// =========================================================
// ÖDƏNİŞLƏR VƏ ABUNƏLİKLƏR
// =========================================================

enum PaymentStatus {
  pending
  succeeded
  failed
  refunded
  cancelled
}

enum PaymentType {
  promotion
  subscription
  escrow
  topup
  ad_campaign
}

model Payment {
  id                  String          @id @default(uuid())
  userId              String          @map("user_id")
  user                User            @relation(fields: [userId], references: [id])
  listingId           String?         @map("listing_id")
  amount              Decimal         @db.Decimal(14, 2)
  currency            String          @default("AZN") @db.VarChar(3)
  type                PaymentType
  status              PaymentStatus   @default(pending)
  provider            String?         @db.VarChar(40)  // pulpal/epoint/stripe
  providerRef         String?         @map("provider_ref") @db.VarChar(120)
  description         String?         @db.Text
  metadata            Json            @default("{}")
  paidAt              DateTime?       @map("paid_at")
  refundedAt          DateTime?       @map("refunded_at")
  createdAt           DateTime        @default(now()) @map("created_at")

  @@index([userId, createdAt(sort: Desc)])
  @@index([status])
  @@map("payments")
}

model WalletTransaction {
  id                  String      @id @default(uuid())
  userId              String      @map("user_id")
  user                User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount              Decimal     @db.Decimal(14, 2)
  type                String      @db.VarChar(30)  // credit/debit/refund/bonus
  reason              String      @db.VarChar(60)
  balanceAfter        Decimal     @db.Decimal(14, 2) @map("balance_after")
  referenceId         String?     @map("reference_id")  // payment/promotion id
  metadata            Json        @default("{}")
  createdAt           DateTime    @default(now()) @map("created_at")

  @@index([userId, createdAt(sort: Desc)])
  @@map("wallet_transactions")
}

model PremiumService {
  id                  String      @id @default(uuid())
  code                String      @unique @db.VarChar(40)  // vip_7d, boost, top_3d
  nameAz              String      @map("name_az") @db.VarChar(120)
  nameRu              String?     @map("name_ru") @db.VarChar(120)
  description         String?     @db.Text
  type                String      @db.VarChar(20)  // vip/premium/boost/highlight/urgent
  price               Decimal     @db.Decimal(14, 2)
  currency            String      @default("AZN") @db.VarChar(3)
  durationDays        Int?        @map("duration_days")
  isActive            Boolean     @default(true) @map("is_active")

  @@map("premium_services")
}

model Subscription {
  id                  String      @id @default(uuid())
  userId              String      @map("user_id")
  user                User        @relation(fields: [userId], references: [id])
  planCode            String      @map("plan_code") @db.VarChar(40)  // small_shop, pro, corporate
  status              String      @default("active") @db.VarChar(20)
  startedAt           DateTime    @default(now()) @map("started_at")
  expiresAt           DateTime    @map("expires_at")
  autoRenew           Boolean     @default(true) @map("auto_renew")
  price               Decimal     @db.Decimal(14, 2)
  metadata            Json        @default("{}")

  @@index([userId, status])
  @@map("subscriptions")
}

// =========================================================
// REYTİNQ VƏ RƏYLƏR
// =========================================================

model Review {
  id                  String      @id @default(uuid())
  reviewerId          String      @map("reviewer_id")
  reviewer            User        @relation("ReviewerUser", fields: [reviewerId], references: [id], onDelete: Cascade)
  reviewedId          String      @map("reviewed_id")
  reviewed            User        @relation("ReviewedUser", fields: [reviewedId], references: [id], onDelete: Cascade)
  listingId           String?     @map("listing_id")
  listing             Listing?    @relation(fields: [listingId], references: [id])
  rating              Int         @db.SmallInt  // 1..5
  comment             String?     @db.Text
  reply               String?     @db.Text
  isFlagged           Boolean     @default(false) @map("is_flagged")
  createdAt           DateTime    @default(now()) @map("created_at")

  @@unique([reviewerId, reviewedId, listingId])
  @@index([reviewedId, createdAt(sort: Desc)])
  @@map("reviews")
}

// =========================================================
// ŞİKAYƏTLƏR VƏ MÜBAHİSƏLƏR
// =========================================================

model Complaint {
  id                  String      @id @default(uuid())
  reporterId          String      @map("reporter_id")
  reporter            User        @relation("Reporter", fields: [reporterId], references: [id])
  listingId           String?     @map("listing_id")
  listing             Listing?    @relation(fields: [listingId], references: [id])
  targetUserId        String?     @map("target_user_id")
  reason              String      @db.VarChar(40)
  detail              String?     @db.Text
  evidence            Json        @default("[]")  // şəkil URL-ləri
  status              String      @default("open") @db.VarChar(20)  // open/in_review/resolved/dismissed
  resolution          String?     @db.Text
  resolvedBy          String?     @map("resolved_by")
  createdAt           DateTime    @default(now()) @map("created_at")
  resolvedAt          DateTime?   @map("resolved_at")

  @@index([status, createdAt])
  @@map("complaints")
}

// =========================================================
// MODERASIYA
// =========================================================

model ModerationTask {
  id                  String      @id @default(uuid())
  type                String      @db.VarChar(40)  // listing/review/complaint/user
  listingId           String?     @map("listing_id")
  listing             Listing?    @relation(fields: [listingId], references: [id])
  userId              String?     @map("user_id")
  priority            Int         @default(0)  // higher = more urgent
  aiFlags             Json        @default("[]") @map("ai_flags")
  aiConfidence        Decimal?    @map("ai_confidence") @db.Decimal(3, 2)
  status              String      @default("pending") @db.VarChar(20)  // pending/approved/rejected
  decision            String?     @db.Text
  decidedBy           String?     @map("decided_by")
  decider             User?       @relation(fields: [decidedBy], references: [id])
  createdAt           DateTime    @default(now()) @map("created_at")
  decidedAt           DateTime?   @map("decided_at")

  @@index([status, priority(sort: Desc), createdAt])
  @@map("moderation_tasks")
}

// =========================================================
// ADMİN LOG VƏ AUDIT
// =========================================================

model AdminLog {
  id                  String      @id @default(uuid())
  adminId             String      @map("admin_id")
  admin               User        @relation(fields: [adminId], references: [id])
  action              String      @db.VarChar(60)
  entityType          String      @map("entity_type") @db.VarChar(40)
  entityId            String?     @map("entity_id")
  before              Json?
  after               Json?
  ipAddress           String?     @map("ip_address") @db.VarChar(45)
  userAgent           String?     @map("user_agent")
  createdAt           DateTime    @default(now()) @map("created_at")

  @@index([adminId, createdAt(sort: Desc)])
  @@index([entityType, entityId])
  @@map("admin_logs")
}

// =========================================================
// REKLAM VƏ BANNERLƏR
// =========================================================

model Banner {
  id                  String      @id @default(uuid())
  title               String      @db.VarChar(120)
  imageUrl            String      @map("image_url")
  mobileImageUrl      String?     @map("mobile_image_url")
  linkUrl             String      @map("link_url")
  position            String      @db.VarChar(40)  // home_top, home_middle, sidebar, category_top
  startsAt            DateTime    @map("starts_at")
  endsAt              DateTime    @map("ends_at")
  isActive            Boolean     @default(true) @map("is_active")
  views               Int         @default(0)
  clicks              Int         @default(0)
  createdAt           DateTime    @default(now()) @map("created_at")

  @@index([position, isActive, startsAt, endsAt])
  @@map("banners")
}

model AdCampaign {
  id                  String      @id @default(uuid())
  ownerId             String      @map("owner_id")
  name                String      @db.VarChar(120)
  budgetTotal         Decimal     @db.Decimal(14, 2) @map("budget_total")
  budgetDaily         Decimal?    @db.Decimal(14, 2) @map("budget_daily")
  spent               Decimal     @default(0) @db.Decimal(14, 2)
  targetCategoryIds   String[]    @default([]) @map("target_category_ids")
  targetCityIds       String[]    @default([]) @map("target_city_ids")
  bannerImageUrl      String      @map("banner_image_url")
  landingUrl          String      @map("landing_url")
  startsAt            DateTime    @map("starts_at")
  endsAt              DateTime    @map("ends_at")
  status              String      @default("pending") @db.VarChar(20)  // pending/active/paused/finished
  approvedBy          String?     @map("approved_by")
  views               Int         @default(0)
  clicks              Int         @default(0)
  createdAt           DateTime    @default(now()) @map("created_at")

  @@index([status, startsAt, endsAt])
  @@map("ad_campaigns")
}

// =========================================================
// SEO və BLOG
// =========================================================

model SeoPage {
  id                  String      @id @default(uuid())
  path                String      @unique  // /baki/telefonlar
  title               String      @db.VarChar(200)
  metaDescription     String?     @map("meta_description") @db.Text
  h1                  String?     @db.VarChar(200)
  contentHtml         String?     @map("content_html") @db.Text
  schemaJson          Json?       @map("schema_json")
  isIndexable         Boolean     @default(true) @map("is_indexable")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  @@map("seo_pages")
}

model BlogPost {
  id                  String      @id @default(uuid())
  slug                String      @unique
  title               String      @db.VarChar(200)
  excerpt             String?     @db.Text
  contentMd           String      @map("content_md") @db.Text
  coverUrl            String?     @map("cover_url")
  tags                String[]    @default([])
  authorId            String?     @map("author_id")
  isPublished         Boolean     @default(false) @map("is_published")
  publishedAt         DateTime?   @map("published_at")
  views               Int         @default(0)
  createdAt           DateTime    @default(now()) @map("created_at")

  @@map("blog_posts")
}

// =========================================================
// AXTARIŞ LOQU
// =========================================================

model SearchLog {
  id                  String      @id @default(uuid())
  userId              String?     @map("user_id")
  user                User?       @relation(fields: [userId], references: [id])
  query               String      @db.VarChar(200)
  filters             Json        @default("{}")
  resultsCount        Int         @map("results_count")
  clickedListingId    String?     @map("clicked_listing_id")
  ipHash              String?     @map("ip_hash") @db.VarChar(64)
  createdAt           DateTime    @default(now()) @map("created_at")

  @@index([query])
  @@index([createdAt(sort: Desc)])
  @@map("search_logs")
}

// =========================================================
// ÇATDIRILMA VƏ ESCROW (Faza 3)
// =========================================================

model DeliveryOrder {
  id                  String      @id @default(uuid())
  listingId           String      @map("listing_id")
  buyerId             String      @map("buyer_id")
  sellerId            String      @map("seller_id")
  carrier             String      @db.VarChar(40)  // azerpoct/bravo
  trackingNumber      String?     @map("tracking_number")
  status              String      @default("pending") @db.VarChar(20)
  fromAddress         Json        @map("from_address")
  toAddress           Json        @map("to_address")
  costAmount          Decimal     @db.Decimal(14, 2) @map("cost_amount")
  metadata            Json        @default("{}")
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  @@index([listingId])
  @@index([trackingNumber])
  @@map("delivery_orders")
}

model EscrowTransaction {
  id                  String      @id @default(uuid())
  buyerId             String      @map("buyer_id")
  sellerId            String      @map("seller_id")
  listingId           String      @map("listing_id")
  amount              Decimal     @db.Decimal(14, 2)
  currency            String      @default("AZN") @db.VarChar(3)
  commissionAmount    Decimal     @db.Decimal(14, 2) @map("commission_amount")
  status              String      @default("pending") @db.VarChar(30)
  // pending/paid/shipped/delivered/confirmed/released/disputed/refunded
  paidAt              DateTime?   @map("paid_at")
  shippedAt           DateTime?   @map("shipped_at")
  deliveredAt         DateTime?   @map("delivered_at")
  confirmedAt         DateTime?   @map("confirmed_at")
  releasedAt          DateTime?   @map("released_at")
  disputeOpenedAt     DateTime?   @map("dispute_opened_at")
  disputeReason       String?     @map("dispute_reason") @db.Text
  metadata            Json        @default("{}")
  createdAt           DateTime    @default(now()) @map("created_at")

  @@index([status, createdAt])
  @@map("escrow_transactions")
}
```

## Xülasə (33 cədvəl)

| Domain | Cədvəllər |
|---|---|
| Users & Roles | users, profiles, business_profiles |
| Shops | shops, shop_members, shop_followers |
| Catalog | categories, category_attributes |
| Geo | cities, districts |
| Listings | listings, listing_images, listing_videos, listing_status_logs |
| Search & UX | favorites, saved_searches, search_logs |
| Chat | chats, messages |
| Notifications | notifications |
| Payments | payments, wallet_transactions, premium_services, subscriptions |
| Reviews | reviews |
| Disputes | complaints, moderation_tasks |
| Admin | admin_logs, banners, ad_campaigns |
| SEO | seo_pages, blog_posts |
| Future | delivery_orders, escrow_transactions |

## İndekslər və performans

- B-tree: bütün FK-lər, status + created_at composite
- GIN: `attributes` (JSONB), title trigram (fuzzy)
- BRIN: `created_at` (zaman seriyalı, dəyər artımı ardıcıl)
- Partial: `WHERE status='active'` üzrə
- Partitioning: `messages` aylıq, `admin_logs` aylıq, `search_logs` aylıq
