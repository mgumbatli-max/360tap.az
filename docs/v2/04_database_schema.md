# 04 — Database Schema (Prisma)

> PostgreSQL 16 + Prisma. Mövcud NestJS schema-nı əsas götürüb genişləndiririk.
> Konvensiyalar: `uuid` PK, `snake_case` DB mapping (`@map`), `created_at/updated_at`, enum-lar.

---

## 1. Entity xəritəsi (domenlərə görə)

```
IDENTITY     User · Profile · RefreshToken
GEO          Region · District · NearbyDistrict
CATALOG      Category · CategoryAttribute · Brand · VehicleModel
LISTING      Listing · ListingImage · ListingAttributeValue
DETAILS      VehicleDetails · RealEstateDetails · JobDetails
STORE        Store · StoreBranch · CompanyProfile
ENGAGEMENT   Favorite · Conversation · Message · Review · Report ·
             SavedSearch · Notification · ListingStatDaily
COMMERCE     Payment · Package · Subscription · Promotion · Banner
ERP          ErpIntegration · ErpProductLink · ErpSyncLog · ImportJob
OPS          SearchLog · AuditLog
```

Cəmi: **33 model** (brief bölmə 21-i tam ödəyir + əlavələr: `District`, `NearbyDistrict`, `Brand`, `VehicleModel`, `ErpProductLink`, `Subscription`, `ListingStatDaily`).

---

## 2. ER əlaqələr (mətn diaqram)

```
User 1─* Listing *─1 Category 1─* CategoryAttribute
User 1─1 Profile                Category *─1 Category (self, ağac)
User *─1 District *─1 Region    Listing 1─* ListingImage
User 1─? Store                  Listing 1─? VehicleDetails / RealEstateDetails / JobDetails
Store 1─* StoreBranch           Listing *─1 District (region-first)
Store 1─? CompanyProfile        Listing 1─* ListingAttributeValue *─1 CategoryAttribute
Store 1─? ErpIntegration 1─* ErpProductLink 1─1 Listing
Brand 1─* VehicleModel          District *─* District (NearbyDistrict)
User *─* Listing (Favorite)     Listing 1─* Conversation 1─* Message
```

---

## 3. Modellər (Prisma DSL)

> Aşağıdakı blok birbaşa `api/prisma/schema.prisma`-ya inteqrasiya üçün hazırlanıb (mövcud modellər genişləndirilir).

### 3.1 Identity

```prisma
enum UserRole { user pro business moderator admin super_admin }
enum UserStatus { pending active suspended banned }
enum SellerType { individual store erp_store dealer agency company }

model User {
  id              String     @id @default(uuid()) @db.Uuid
  email           String?    @unique
  phone           String?    @unique
  passwordHash    String     @map("password_hash")
  fullName        String     @map("full_name") @db.VarChar(120)
  avatarUrl       String?    @map("avatar_url")
  role            UserRole   @default(user)
  status          UserStatus @default(active)
  sellerType      SellerType @default(individual) @map("seller_type")
  isPhoneVerified Boolean    @default(false) @map("is_phone_verified")
  isEmailVerified Boolean    @default(false) @map("is_email_verified")
  rating          Decimal    @default(0) @db.Decimal(3,2)
  reviewsCount    Int        @default(0) @map("reviews_count")
  responseMinutes Int?       @map("response_minutes") // cavab sürəti
  districtId      String?    @map("district_id") @db.Uuid
  district        District?  @relation(fields: [districtId], references: [id])
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")

  profile         Profile?
  listings        Listing[]
  store           Store?
  refreshTokens   RefreshToken[]
  favorites       Favorite[]
  savedSearches   SavedSearch[]
  notifications   Notification[]
  reviewsWritten  Review[]   @relation("reviewer")
  reviewsReceived Review[]   @relation("reviewed")
  @@index([role, status])
  @@map("users")
}

model Profile {
  userId    String  @id @map("user_id") @db.Uuid
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio       String?
  whatsapp  String? @db.VarChar(20)
  instagram String? @db.VarChar(80)
  website   String?
  @@map("profiles")
}

model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique @map("token_hash")
  expiresAt DateTime @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime @default(now()) @map("created_at")
  @@index([userId]) @@map("refresh_tokens")
}
```

### 3.2 Geo (region-first nüvə)

```prisma
model Region {
  id        String     @id @default(uuid()) @db.Uuid
  slug      String     @unique @db.VarChar(80)   // "qebele"
  nameAz    String     @map("name_az") @db.VarChar(80)
  nameRu    String?    @map("name_ru") @db.VarChar(80)
  lat       Float?
  lng       Float?
  sortOrder Int        @default(0) @map("sort_order")
  isActive  Boolean    @default(true) @map("is_active")
  districts District[]
  @@map("regions")
}

model District {
  id        String   @id @default(uuid()) @db.Uuid
  regionId  String   @map("region_id") @db.Uuid
  region    Region   @relation(fields: [regionId], references: [id])
  slug      String   @unique @db.VarChar(100)
  nameAz    String   @map("name_az") @db.VarChar(100)
  nameRu    String?  @map("name_ru") @db.VarChar(100)
  lat       Float?
  lng       Float?
  users     User[]
  listings  Listing[]
  nearbyOf  NearbyDistrict[] @relation("origin")
  nearTo    NearbyDistrict[] @relation("target")
  @@index([regionId]) @@map("districts")
}

// Yaxın rayon mapping — haversine ilə doldurulur, admin override edə bilər
model NearbyDistrict {
  id         String   @id @default(uuid()) @db.Uuid
  originId   String   @map("origin_id") @db.Uuid
  origin     District @relation("origin", fields: [originId], references: [id], onDelete: Cascade)
  targetId   String   @map("target_id") @db.Uuid
  target     District @relation("target", fields: [targetId], references: [id], onDelete: Cascade)
  distanceKm Float    @map("distance_km")
  rank       Int      @default(0) // yaxınlıq sırası
  @@unique([originId, targetId])
  @@index([originId, rank]) @@map("nearby_districts")
}
```

### 3.3 Catalog + dynamic attributes

```prisma
model Category {
  id             String   @id @default(uuid()) @db.Uuid
  parentId       String?  @map("parent_id") @db.Uuid
  parent         Category? @relation("CatTree", fields: [parentId], references: [id])
  children       Category[] @relation("CatTree")
  vertical       String   @db.VarChar(20)  // transport|realestate|job|universal
  slug           String   @unique @db.VarChar(120)
  nameAz         String   @map("name_az") @db.VarChar(120)
  nameRu         String?  @map("name_ru") @db.VarChar(120)
  icon           String?  @db.VarChar(60)
  seoTitle       String?  @map("seo_title")
  seoDescription String?  @map("seo_description")
  sortOrder      Int      @default(0) @map("sort_order")
  isActive       Boolean  @default(true) @map("is_active")
  listingsCount  Int      @default(0) @map("listings_count")
  attributes     CategoryAttribute[]
  listings       Listing[]
  @@index([parentId]) @@index([vertical]) @@map("categories")
}

enum AttributeType { string number select multiselect boolean range date location }

model CategoryAttribute {
  id           String        @id @default(uuid()) @db.Uuid
  categoryId   String        @map("category_id") @db.Uuid
  category     Category      @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  key          String        @db.VarChar(60)         // "mileage"
  labelAz      String        @map("label_az") @db.VarChar(120)
  labelRu      String?       @map("label_ru") @db.VarChar(120)
  type         AttributeType
  options      Json?         // select/multiselect üçün
  unit         String?       @db.VarChar(20)         // "km", "m²"
  isRequired   Boolean       @default(false) @map("is_required")
  isFilterable Boolean       @default(true) @map("is_filterable")
  isSearchable Boolean       @default(false) @map("is_searchable") // Meilisearch index
  sortOrder    Int           @default(0) @map("sort_order")
  values       ListingAttributeValue[]
  @@unique([categoryId, key]) @@map("category_attributes")
}

model Brand {
  id       String         @id @default(uuid()) @db.Uuid
  vertical String         @db.VarChar(20) // transport (genişlənə bilər)
  slug     String         @unique @db.VarChar(80)
  name     String         @db.VarChar(80)
  logoUrl  String?        @map("logo_url")
  models   VehicleModel[]
  @@map("brands")
}

model VehicleModel {
  id      String @id @default(uuid()) @db.Uuid
  brandId String @map("brand_id") @db.Uuid
  brand   Brand  @relation(fields: [brandId], references: [id], onDelete: Cascade)
  slug    String @db.VarChar(120)
  name    String @db.VarChar(120)
  @@unique([brandId, slug]) @@map("vehicle_models")
}
```

### 3.4 Listing (mərkəzi entity)

```prisma
enum ListingStatus { draft review active rejected expired sold archived blocked out_of_stock }
enum PriceType { fixed negotiable free exchange contract }
enum Condition { new like_new used for_parts }
enum ListingSource { manual erp }

model Listing {
  id              String        @id @default(uuid()) @db.Uuid
  ownerId         String        @map("owner_id") @db.Uuid
  owner           User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  storeId         String?       @map("store_id") @db.Uuid
  store           Store?        @relation(fields: [storeId], references: [id])
  categoryId      String        @map("category_id") @db.Uuid
  category        Category      @relation(fields: [categoryId], references: [id])
  districtId      String?       @map("district_id") @db.Uuid
  district        District?     @relation(fields: [districtId], references: [id])

  vertical        String        @db.VarChar(20)
  title           String        @db.VarChar(140)
  slug            String        @db.VarChar(180)
  description     String
  price           Decimal?      @db.Decimal(14,2)
  oldPrice        Decimal?      @map("old_price") @db.Decimal(14,2) // endirim
  currency        String        @default("AZN") @db.VarChar(3)
  priceType       PriceType     @default(fixed) @map("price_type")
  condition       Condition?
  attributes      Json          @default("{}")   // sürətli oxu üçün denormalized

  // Real stok / commerce flagləri
  source          ListingSource @default(manual)
  stockQty        Int?          @map("stock_qty")        // ERP/biznes
  inStock         Boolean       @default(true) @map("in_stock")
  hasDelivery     Boolean       @default(false) @map("has_delivery")
  hasCredit       Boolean       @default(false) @map("has_credit")
  hasBarter       Boolean       @default(false) @map("has_barter")
  hasWarranty     Boolean       @default(false) @map("has_warranty")
  pickupToday     Boolean       @default(false) @map("pickup_today") // "bu gün götürmək olar"

  contactName     String?       @map("contact_name") @db.VarChar(120)
  contactPhone    String?       @map("contact_phone") @db.VarChar(20)
  contactWhatsapp Boolean       @default(false) @map("contact_whatsapp")
  address         String?
  lat             Float?
  lng             Float?

  status          ListingStatus @default(review)
  rejectionReason String?       @map("rejection_reason")
  isVip           Boolean       @default(false) @map("is_vip")
  isPremium       Boolean       @default(false) @map("is_premium")
  isHighlight     Boolean       @default(false) @map("is_highlight")
  isUrgent        Boolean       @default(false) @map("is_urgent")
  promotedUntil   DateTime?     @map("promoted_until")

  views           Int           @default(0)
  callClicks      Int           @default(0) @map("call_clicks")
  whatsappClicks  Int           @default(0) @map("whatsapp_clicks")
  favoritesCount  Int           @default(0) @map("favorites_count")

  publishedAt     DateTime?     @map("published_at")
  expiresAt       DateTime      @map("expires_at")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  images          ListingImage[]
  attributeValues ListingAttributeValue[]
  vehicle         VehicleDetails?
  realEstate      RealEstateDetails?
  job             JobDetails?
  erpLink         ErpProductLink?
  favorites       Favorite[]
  conversations   Conversation[]

  @@index([status, createdAt(sort: Desc)])
  @@index([categoryId, status])
  @@index([districtId, status])
  @@index([vertical, status])
  @@index([storeId])
  @@index([source, status])
  @@map("listings")
}

model ListingImage {
  id        String  @id @default(uuid()) @db.Uuid
  listingId String  @map("listing_id") @db.Uuid
  listing   Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  url       String
  width     Int?
  height    Int?
  blurHash  String? @map("blur_hash") @db.VarChar(60)
  sortOrder Int     @default(0) @map("sort_order")
  @@index([listingId, sortOrder]) @@map("listing_images")
}

// Normalized atribut dəyəri (filter/search üçün indekslənir; `Listing.attributes` JSONB sürətli oxu üçün)
model ListingAttributeValue {
  id          String            @id @default(uuid()) @db.Uuid
  listingId   String            @map("listing_id") @db.Uuid
  listing     Listing           @relation(fields: [listingId], references: [id], onDelete: Cascade)
  attributeId String            @map("attribute_id") @db.Uuid
  attribute   CategoryAttribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  valueText   String?           @map("value_text")
  valueNum    Decimal?          @map("value_num") @db.Decimal(16,4)
  valueBool   Boolean?          @map("value_bool")
  @@unique([listingId, attributeId])
  @@index([attributeId, valueNum])
  @@index([attributeId, valueText]) @@map("listing_attribute_values")
}
```

### 3.5 Vertical detalları

```prisma
model VehicleDetails {
  listingId   String  @id @map("listing_id") @db.Uuid
  listing     Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  brandId     String? @map("brand_id") @db.Uuid
  modelId     String? @map("model_id") @db.Uuid
  year        Int?
  bodyType    String? @map("body_type") @db.VarChar(40)
  fuelType    String? @map("fuel_type") @db.VarChar(30)
  engineCc    Int?    @map("engine_cc")
  transmission String? @db.VarChar(30)
  drivetrain  String? @db.VarChar(20)
  color       String? @db.VarChar(40)
  mileage     Int?
  isNew       Boolean @default(false) @map("is_new")
  seats       Int?
  doors       Int?
  ownersCount Int?    @map("owners_count")
  vin         String? @db.VarChar(20)
  noAccident  Boolean @default(false) @map("no_accident")
  notPainted  Boolean @default(false) @map("not_painted")
  customsCleared Boolean @default(false) @map("customs_cleared")
  batteryKwh  Float?  @map("battery_kwh")
  hybridType  String? @map("hybrid_type") @db.VarChar(20)
  features    Json    @default("[]") // kamera, lyuk, dəri salon...
  @@map("vehicle_details")
}

model RealEstateDetails {
  listingId    String  @id @map("listing_id") @db.Uuid
  listing      Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  dealType     String  @map("deal_type") @db.VarChar(20) // sale|rent|daily
  propertyType String  @map("property_type") @db.VarChar(30) // apartment|house|villa|land|office|garage|commercial
  isNewBuilding Boolean @default(false) @map("is_new_building")
  rooms        Int?
  area         Float?   // m²
  floor        Int?
  totalFloors  Int?    @map("total_floors")
  pricePerM2   Decimal? @map("price_per_m2") @db.Decimal(12,2)
  hasExtract   Boolean @default(false) @map("has_extract")    // çıxarış
  hasMortgage  Boolean @default(false) @map("has_mortgage")   // ipoteka
  repair       String? @db.VarChar(30)
  metro        String? @db.VarChar(80)
  landmark     String?
  amenities    Json    @default("[]") // balkon, lift, qaz, parking, mühafizə...
  has360Tour   Boolean @default(false) @map("has_360_tour")
  videoUrl     String? @map("video_url")
  @@map("real_estate_details")
}

model JobDetails {
  listingId    String  @id @map("listing_id") @db.Uuid
  listing      Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  companyId    String? @map("company_id") @db.Uuid
  company      CompanyProfile? @relation(fields: [companyId], references: [id])
  position     String  @db.VarChar(140)
  field        String? @db.VarChar(80)
  salaryMin    Int?    @map("salary_min")
  salaryMax    Int?    @map("salary_max")
  schedule     String? @db.VarChar(30) // full|part|remote|office|hybrid
  experience   String? @db.VarChar(40)
  education    String? @db.VarChar(40)
  languages    Json    @default("[]")
  requirements String?
  duties       String?
  cvRequired   Boolean @default(true) @map("cv_required")
  onlineInterview Boolean @default(false) @map("online_interview")
  isUrgent     Boolean @default(false) @map("is_urgent")
  @@map("job_details")
}
```

### 3.6 Store / Company

```prisma
enum StoreStatus { pending active suspended }
model Store {
  id            String      @id @default(uuid()) @db.Uuid
  ownerId       String      @unique @map("owner_id") @db.Uuid
  owner         User        @relation(fields: [ownerId], references: [id])
  slug          String      @unique @db.VarChar(120)   // "qebele-techstore"
  name          String      @db.VarChar(160)
  logoUrl       String?     @map("logo_url")
  coverUrl      String?     @map("cover_url")
  description   String?
  status        StoreStatus @default(pending)
  isVerified    Boolean     @default(false) @map("is_verified")
  source        ListingSource @default(manual) // erp → ERP badge
  rating        Decimal     @default(0) @db.Decimal(3,2)
  reviewsCount  Int         @default(0) @map("reviews_count")
  phone         String?     @db.VarChar(20)
  whatsapp      String?     @db.VarChar(20)
  instagram     String?     @db.VarChar(80)
  workingHours  Json?       @map("working_hours")
  deliveryTerms String?     @map("delivery_terms")
  warrantyTerms String?     @map("warranty_terms")
  createdAt     DateTime    @default(now()) @map("created_at")
  branches      StoreBranch[]
  listings      Listing[]
  erp           ErpIntegration?
  @@map("stores")
}

model StoreBranch {
  id        String  @id @default(uuid()) @db.Uuid
  storeId   String  @map("store_id") @db.Uuid
  store     Store   @relation(fields: [storeId], references: [id], onDelete: Cascade)
  name      String  @db.VarChar(120)
  address   String
  districtId String? @map("district_id") @db.Uuid
  lat       Float?
  lng       Float?
  phone     String? @db.VarChar(20)
  @@index([storeId]) @@map("store_branches")
}

model CompanyProfile {
  id        String  @id @default(uuid()) @db.Uuid
  storeId   String? @unique @map("store_id") @db.Uuid
  name      String  @db.VarChar(160)
  logoUrl   String? @map("logo_url")
  about     String?
  website   String?
  size      String? @db.VarChar(30)
  jobs      JobDetails[]
  @@map("company_profiles")
}
```

### 3.7 Engagement

```prisma
model Favorite {
  userId    String   @map("user_id") @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  listingId String   @map("listing_id") @db.Uuid
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now()) @map("created_at")
  @@id([userId, listingId]) @@map("favorites")
}

model Conversation {
  id         String   @id @default(uuid()) @db.Uuid
  listingId  String   @map("listing_id") @db.Uuid
  listing    Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  buyerId    String   @map("buyer_id") @db.Uuid
  sellerId   String   @map("seller_id") @db.Uuid
  lastMessageAt DateTime? @map("last_message_at")
  createdAt  DateTime @default(now()) @map("created_at")
  messages   Message[]
  @@unique([listingId, buyerId, sellerId]) @@map("conversations")
}

model Message {
  id             String   @id @default(uuid()) @db.Uuid
  conversationId String   @map("conversation_id") @db.Uuid
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String   @map("sender_id") @db.Uuid
  content        String
  readAt         DateTime? @map("read_at")
  createdAt      DateTime @default(now()) @map("created_at")
  @@index([conversationId, createdAt]) @@map("messages")
}

model Review {
  id         String   @id @default(uuid()) @db.Uuid
  reviewerId String   @map("reviewer_id") @db.Uuid
  reviewer   User     @relation("reviewer", fields: [reviewerId], references: [id], onDelete: Cascade)
  reviewedId String   @map("reviewed_id") @db.Uuid
  reviewed   User     @relation("reviewed", fields: [reviewedId], references: [id], onDelete: Cascade)
  listingId  String?  @map("listing_id") @db.Uuid
  rating     Int      @db.SmallInt
  comment    String?
  createdAt  DateTime @default(now()) @map("created_at")
  @@index([reviewedId]) @@map("reviews")
}

enum ReportStatus { open reviewing resolved dismissed }
model Report {
  id         String   @id @default(uuid()) @db.Uuid
  reporterId String   @map("reporter_id") @db.Uuid
  listingId  String?  @map("listing_id") @db.Uuid
  userId     String?  @map("user_id") @db.Uuid
  reason     String   @db.VarChar(40)
  detail     String?
  status     ReportStatus @default(open)
  createdAt  DateTime @default(now()) @map("created_at")
  resolvedAt DateTime? @map("resolved_at")
  @@index([status]) @@map("reports")
}

model SavedSearch {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String?  @db.VarChar(120)
  query       Json     // term, filterlər, region
  notify      Boolean  @default(true)
  lastNotifiedAt DateTime? @map("last_notified_at")
  createdAt   DateTime @default(now()) @map("created_at")
  @@index([userId]) @@map("saved_searches")
}

enum NotificationType { message price_drop saved_search moderation erp_sync_error system }
model Notification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String   @db.VarChar(160)
  body      String?
  data      Json?
  readAt    DateTime? @map("read_at")
  createdAt DateTime @default(now()) @map("created_at")
  @@index([userId, readAt]) @@map("notifications")
}

// Gündəlik aqreqasiya (ERP-yə geri analytics + listing stats üçün)
model ListingStatDaily {
  id             String   @id @default(uuid()) @db.Uuid
  listingId      String   @map("listing_id") @db.Uuid
  date           DateTime @db.Date
  views          Int      @default(0)
  callClicks     Int      @default(0) @map("call_clicks")
  whatsappClicks Int      @default(0) @map("whatsapp_clicks")
  favorites      Int      @default(0)
  @@unique([listingId, date]) @@map("listing_stat_daily")
}
```

### 3.8 Commerce / monetizasiya (detal `11`)

```prisma
enum PaymentStatus { pending paid failed refunded }
model Package {
  id        String   @id @default(uuid()) @db.Uuid
  code      String   @unique @db.VarChar(40) // free|standard|business|premium
  name      String   @db.VarChar(80)
  priceMonthly Decimal @map("price_monthly") @db.Decimal(10,2)
  limits    Json     // elan limiti, statistika, sync flagləri
  features  Json
  @@map("packages")
}
model Subscription {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  packageId String   @map("package_id") @db.Uuid
  status    String   @default("active")
  startsAt  DateTime @map("starts_at")
  endsAt    DateTime @map("ends_at")
  @@index([userId]) @@map("subscriptions")
}
model Promotion {
  id        String   @id @default(uuid()) @db.Uuid
  listingId String   @map("listing_id") @db.Uuid
  type      String   @db.VarChar(30) // vip|premium|boost|home|category|region
  startsAt  DateTime @map("starts_at")
  endsAt    DateTime @map("ends_at")
  paymentId String?  @map("payment_id") @db.Uuid
  @@index([listingId]) @@map("promotions")
}
model Payment {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  amount      Decimal  @db.Decimal(14,2)
  currency    String   @default("AZN") @db.VarChar(3)
  type        String   @db.VarChar(30) // promotion|subscription|banner
  status      PaymentStatus @default(pending)
  provider    String?  @db.VarChar(40)
  providerRef String?  @map("provider_ref") @db.VarChar(120)
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  @@index([userId, status]) @@map("payments")
}
model Banner {
  id        String   @id @default(uuid()) @db.Uuid
  title     String   @db.VarChar(120)
  imageUrl  String   @map("image_url")
  linkUrl   String   @map("link_url")
  placement String   @db.VarChar(40) // home|category|region|listing
  regionId  String?  @map("region_id") @db.Uuid
  startsAt  DateTime @map("starts_at")
  endsAt    DateTime @map("ends_at")
  isActive  Boolean  @default(true) @map("is_active")
  @@index([placement, isActive]) @@map("banners")
}
```

### 3.9 ERP (detal `08`)

```prisma
enum ErpSyncStatus { ok pending error }
model ErpIntegration {
  id          String   @id @default(uuid()) @db.Uuid
  storeId     String   @unique @map("store_id") @db.Uuid
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  erpTenantId String   @map("erp_tenant_id") @db.VarChar(120) // ERP tərəf identifikatoru
  apiKeyHash  String   @map("api_key_hash")
  webhookSecret String @map("webhook_secret")
  isActive    Boolean  @default(true) @map("is_active")
  lastSyncAt  DateTime? @map("last_sync_at")
  createdAt   DateTime @default(now()) @map("created_at")
  links       ErpProductLink[]
  logs        ErpSyncLog[]
  @@map("erp_integrations")
}

model ErpProductLink {
  id            String   @id @default(uuid()) @db.Uuid
  integrationId String   @map("integration_id") @db.Uuid
  integration   ErpIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  externalId    String   @map("external_id") @db.VarChar(120) // ERP məhsul ID
  listingId     String?  @unique @map("listing_id") @db.Uuid
  listing       Listing? @relation(fields: [listingId], references: [id], onDelete: SetNull)
  lastHash      String?  @map("last_hash")  // payload dəyişikliyini aşkar
  syncStatus    ErpSyncStatus @default(pending) @map("sync_status")
  updatedAt     DateTime @updatedAt @map("updated_at")
  @@unique([integrationId, externalId])
  @@index([syncStatus]) @@map("erp_product_links")
}

model ErpSyncLog {
  id            String   @id @default(uuid()) @db.Uuid
  integrationId String   @map("integration_id") @db.Uuid
  integration   ErpIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  externalId    String?  @map("external_id") @db.VarChar(120)
  action        String   @db.VarChar(30) // publish|update_price|update_stock|delete|...
  status        ErpSyncStatus
  error         String?
  payload       Json?
  createdAt     DateTime @default(now()) @map("created_at")
  @@index([integrationId, createdAt(sort: Desc)]) @@map("erp_sync_logs")
}

enum ImportJobStatus { queued running done failed }
model ImportJob {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  type      String   @db.VarChar(20) // excel|csv|xml|api
  fileUrl   String?  @map("file_url")
  status    ImportJobStatus @default(queued)
  total     Int      @default(0)
  processed Int      @default(0)
  failed    Int      @default(0)
  errors    Json?
  createdAt DateTime @default(now()) @map("created_at")
  @@index([userId]) @@map("import_jobs")
}
```

### 3.10 Ops

```prisma
model SearchLog {
  id         String   @id @default(uuid()) @db.Uuid
  query      String   @db.VarChar(200)
  regionId   String?  @map("region_id") @db.Uuid
  resultsCount Int    @map("results_count")
  userId     String?  @map("user_id") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at")
  @@index([createdAt]) @@index([resultsCount]) @@map("search_logs") // resultsCount=0 → tapılmayan
}

model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  actorId   String?  @map("actor_id") @db.Uuid
  action    String   @db.VarChar(60)
  entity    String   @db.VarChar(40)
  entityId  String?  @map("entity_id")
  before    Json?
  after     Json?
  ip        String?  @db.VarChar(45)
  createdAt DateTime @default(now()) @map("created_at")
  @@index([entity, entityId]) @@index([actorId]) @@map("audit_logs")
}
```

---

## 4. Atribut saxlama strategiyası (vacib qərar)

İkili yanaşma:
1. **`Listing.attributes` (JSONB)** — sürətli oxu, detail/kart render, denormalized. GIN index.
2. **`ListingAttributeValue` (normalized)** — dəqiq filter/range sorğuları və Meilisearch sync üçün.

Yazı zamanı hər ikisi doldurulur (servis qatında bir mənbədən). Bu, həm sürət, həm dəqiq filter verir. Meilisearch əsas axtarış/filter üçün, Postgres dəqiq fallback üçün.

---

## 5. Migrasiya qeydləri

- Mövcud NestJS schema (User, RefreshToken, Category, CategoryAttribute, City, Listing, ListingImage) → `City`-ni `District`-ə uyğunlaşdır, `Region` əlavə et.
- Express-dən: favorites, chats→conversations, messages, reviews, complaints→reports, payments → Prisma modellərinə map et, data köçürmə skripti.
- Seed: Region/District (12 region + rayonlar + GPS), NearbyDistrict (haversine), Category ağacı + CategoryAttribute (vertical-lara görə), Brand/VehicleModel (transport-data.ts-dən).

> Diaqram, indeks strategiyası və miqrasiya ardıcıllığı: `12_risks_and_roadmap.md`.
