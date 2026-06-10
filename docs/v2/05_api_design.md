# 05 — API Design (NestJS REST)

> Base: `/api/v1`. JSON. Auth: Bearer access token (15 dəq) + refresh token (cookie/rotation).
> Bütün siyahı endpoint-ləri: `?page`, `?limit`, `?sort`, region/filter query dəstəyi.

---

## 1. Konvensiyalar

- **Versiyalama:** `/api/v1/...` (mobil app stabilliyi üçün).
- **Cavab zərfi:** `{ data, meta }` (siyahıda `meta: { page, limit, total, hasMore }`).
- **Xəta modeli:** `{ error: { code, message, details? } }`, HTTP status + biznes `code` (məs. `LISTING_NOT_FOUND`).
- **Auth header:** `Authorization: Bearer <access>`.
- **Region kontekst:** `?region=<slug>` və ya `X-Region` header; default cookie-dən.
- **Idempotency:** ERP yazı endpoint-lərində `Idempotency-Key` / `external_id`.
- **Rate limit:** auth və yazı endpoint-lərində (NestJS Throttler).
- **RBAC:** `@Roles(...)` guard (user/pro/business/moderator/admin/super_admin).

---

## 2. Auth (`/auth`)

| Metod | Yol | Təsvir |
|-------|-----|--------|
| POST | `/auth/register` | email/phone + parol + ad |
| POST | `/auth/login` | email/phone + parol → access+refresh |
| POST | `/auth/refresh` | refresh → yeni access |
| POST | `/auth/logout` | refresh revoke |
| POST | `/auth/phone/request-otp` | OTP göndər (P1) |
| POST | `/auth/phone/verify-otp` | OTP təsdiq |
| GET | `/auth/me` | cari istifadəçi |

## 3. Users / Profile (`/users`)

| Metod | Yol | Təsvir |
|-------|-----|--------|
| GET | `/users/:id` | public profil + aktiv elan sayı/reytinq |
| GET | `/users/:id/listings` | istifadəçinin elanları |
| PATCH | `/me/profile` | profil yenilə (bio, whatsapp, instagram) |
| GET | `/me/favorites` | favoritlər |
| POST/DELETE | `/me/favorites/:listingId` | favorit əlavə/sil |
| GET/POST/DELETE | `/me/saved-searches` | saved search CRUD |
| GET | `/me/notifications` | bildirişlər |
| POST | `/me/notifications/read` | oxundu işarələ |

## 4. Geo / Region (`/geo`)

| Metod | Yol | Təsvir |
|-------|-----|--------|
| GET | `/geo/regions` | bütün regionlar (+ aktiv) |
| GET | `/geo/regions/:slug/districts` | regionun rayonları |
| GET | `/geo/districts/:id/nearby` | yaxın rayonlar (rank-lı) |
| GET | `/geo/resolve?lat=&lng=` | "Mənim yaxınlığımda" → ən yaxın rayon |

## 5. Categories / Attributes (`/categories`)

| Metod | Yol | Təsvir |
|-------|-----|--------|
| GET | `/categories/tree?vertical=` | kateqoriya ağacı |
| GET | `/categories/:slug` | kateqoriya + SEO |
| GET | `/categories/:slug/attributes` | dynamic atributlar (forma+filter üçün) |
| GET | `/brands?vertical=transport` | brendlər |
| GET | `/brands/:id/models` | modellər (cascading) |

## 6. Listings (`/listings`)

| Metod | Yol | Təsvir |
|-------|-----|--------|
| GET | `/listings` | siyahı — filter: `region, district, category, vertical, priceMin/Max, attrs[key]=val, hasDelivery, inStock, source, sort, page` |
| GET | `/listings/:slugOrId` | detal (+ images, attrs, seller, vertical details) |
| GET | `/listings/:id/similar` | oxşar elanlar |
| GET | `/listings/:id/nearby` | yaxın regionlarda oxşar |
| POST | `/listings` | yeni elan (auth) — kateqoriya + dynamic attrs + region |
| PATCH | `/listings/:id` | redaktə (owner) |
| POST | `/listings/:id/publish` | təsdiqə/aktivə göndər |
| DELETE | `/listings/:id` | arxivləşdir |
| POST | `/listings/:id/view` | baxış track (debounced) |
| POST | `/listings/:id/contact/:type` | call/whatsapp klik track |
| POST | `/listings/:id/report` | şikayət |

**Filter nümunəsi (nəqliyyat):**
`GET /listings?vertical=transport&region=qebele&attrs[brand]=bmw&attrs[year_min]=2018&priceMax=50000&inStock=true&sort=price_asc`

## 7. Search (`/search`)

| Metod | Yol | Təsvir |
|-------|-----|--------|
| GET | `/search?q=&region=&vertical=` | Meilisearch — typo/translit/sinonim, region-first sıralama |
| GET | `/search/suggest?q=` | autocomplete (brend/model/kateqoriya/region tanıma) |
| GET | `/search/trending?region=` | populyar axtarışlar |

Cavab: `{ data: listings, meta: { total, facets, detectedRegion, detectedCategory, nearbyAvailable } }`.

## 8. Stores (`/stores`)

| Metod | Yol | Təsvir |
|-------|-----|--------|
| GET | `/stores/:slug` | public mağaza profili |
| GET | `/stores/:slug/listings` | mağaza elanları (filter) |
| GET | `/stores/:slug/reviews` | rəylər |
| POST | `/me/store` | mağaza yarat (business) |
| PATCH | `/me/store` | mağaza redaktə |
| GET/POST/PATCH/DELETE | `/me/store/branches` | filiallar |

## 9. Chat (`/conversations`) — Faza-2

| Metod | Yol | Təsvir |
|-------|-----|--------|
| GET | `/conversations` | söhbətlər |
| POST | `/conversations` | listing üzərindən başlat |
| GET | `/conversations/:id/messages` | mesajlar |
| POST | `/conversations/:id/messages` | mesaj göndər (+ socket emit) |

WebSocket: `ws /socket.io` — `message:new`, `message:read`, `notification:new`.

## 10. Reviews (`/reviews`) — Faza-2

| Metod | Yol | Təsvir |
|-------|-----|--------|
| POST | `/reviews` | satıcı/mağaza rəyi |
| GET | `/users/:id/reviews` | rəylər |

## 11. Monetizasiya (`/billing`, `/promotions`)

| Metod | Yol | Təsvir |
|-------|-----|--------|
| GET | `/packages` | paketlər |
| POST | `/billing/subscribe` | paket al |
| POST | `/listings/:id/promote` | VIP/Premium/boost |
| POST | `/billing/webhook` | ödəniş provayder callback |

## 12. ERP Gateway (`/erp`) — detal `08`

| Metod | Yol | Auth | Təsvir |
|-------|-----|------|--------|
| POST | `/erp/v1/products/publish` | ERP API key + HMAC | məhsulu yayımla (upsert by external_id) |
| POST | `/erp/v1/products/sync` | ERP API key | toplu stok/qiymət sync |
| PATCH | `/erp/v1/products/:externalId/stock` | ERP API key | stok yenilə |
| PATCH | `/erp/v1/products/:externalId/price` | ERP API key | qiymət yenilə |
| DELETE | `/erp/v1/products/:externalId` | ERP API key | arxivləşdir |
| GET | `/erp/v1/products/:externalId/stats` | ERP API key | baxış/klik/favorit (geri analytics) |

## 13. Admin (`/admin`) — detal `10`

| Sahə | Endpoint-lər |
|------|--------------|
| Dashboard | `GET /admin/stats` |
| Elanlar | `GET/PATCH /admin/listings`, `POST /admin/listings/:id/moderate` (approve/reject) |
| Moderasiya | `GET /admin/moderation/queue`, dublikat/spam siqnalları |
| İstifadəçilər | `GET/PATCH /admin/users`, ban/suspend |
| Mağazalar | `GET/PATCH /admin/stores`, verify |
| Kateqoriya/Attribute | `CRUD /admin/categories`, `CRUD /admin/categories/:id/attributes` (**filter builder**) |
| Geo | `CRUD /admin/regions`, `/admin/districts`, `/admin/nearby` |
| Şikayətlər | `GET/PATCH /admin/reports` |
| Monetizasiya | `CRUD /admin/packages`, `/admin/banners`, `GET /admin/payments` |
| SEO | `CRUD /admin/seo-pages` |
| Loglar | `GET /admin/search-logs` (tapılmayan), `/admin/erp-sync-logs`, `/admin/import-jobs`, `/admin/audit-logs` |

## 14. Media (`/media`)

| Metod | Yol | Təsvir |
|-------|-----|--------|
| POST | `/media/upload` | şəkil yüklə → S3, blurhash, ölçü; URL qaytarır |
| POST | `/media/sign` | birbaşa S3 upload üçün presigned URL (P1) |

---

## 15. Modul → endpoint xəritəsi (NestJS)

```
src/modules/
  auth/         /auth
  users/        /users, /me/*
  geo/          /geo
  categories/   /categories, /brands
  listings/     /listings
  search/       /search          (Meilisearch service)
  stores/       /stores, /me/store
  chat/         /conversations   (gateway: socket.io)
  reviews/      /reviews
  billing/      /packages, /billing, /promotions
  erp/          /erp/v1          (gateway + sync service + BullMQ)
  admin/        /admin
  media/        /media           (S3 service)
  notifications/ /me/notifications (+ socket)
```
