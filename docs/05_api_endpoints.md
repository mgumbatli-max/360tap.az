# 05 — REST API spesifikasiyası

## Konvensiyalar
- Base: `https://api.avito.az/v1`
- Format: JSON, UTF-8
- Auth: `Authorization: Bearer <JWT>`
- Pagination: cursor-based — `?cursor=...&limit=24` (max 60)
- Errors: RFC 7807 (Problem Details)
- Idempotency: POST üçün `Idempotency-Key` header
- Rate-limit: anonim 60/dəq · auth 300/dəq · pro 1000/dəq · admin sınırsız
- Versiyalama: URL prefix (`/v1`)

## Auth

```
POST   /auth/register             { email?, phone?, password, full_name, city? }
POST   /auth/login                { identifier, password }
POST   /auth/logout
POST   /auth/refresh              { refresh_token }
POST   /auth/verify-email         { token }
POST   /auth/verify-phone         { phone, code }
POST   /auth/send-otp             { phone | email }
POST   /auth/forgot-password      { email | phone }
POST   /auth/reset-password       { token, password }
POST   /auth/2fa/enable
POST   /auth/2fa/verify           { code }
POST   /auth/2fa/disable
GET    /auth/sessions             # aktiv cihazlar
DELETE /auth/sessions/:id
GET    /auth/oauth/:provider      # redirect başlat
GET    /auth/callback/:provider   # OAuth callback
```

## Users

```
GET    /users/me
PATCH  /users/me                  { full_name?, city?, bio?, avatar_url? }
DELETE /users/me                  # soft delete
POST   /users/me/avatar           # multipart
GET    /users/me/notifications-prefs
PATCH  /users/me/notifications-prefs

GET    /users/:id                 # public profil
GET    /users/:id/listings        # publik elanları
GET    /users/:id/reviews
POST   /users/:id/follow
DELETE /users/:id/follow
POST   /users/:id/block
DELETE /users/:id/block
POST   /users/:id/report          { reason, detail }
```

## Categories

```
GET    /categories                # ağac
GET    /categories/:slug
GET    /categories/:slug/attributes
GET    /categories/:slug/children
```

## Cities & Districts

```
GET    /cities
GET    /cities/:slug
GET    /cities/:slug/districts
```

## Listings

```
GET    /listings?q=&category=&city=&min_price=&max_price=&condition=&sort=&cursor=&limit=
GET    /listings/:id
POST   /listings                  # yarat (status='review')
PATCH  /listings/:id
DELETE /listings/:id              # arxiv
POST   /listings/:id/publish      # qaralama → review
POST   /listings/:id/sold         # status='sold'
POST   /listings/:id/archive
POST   /listings/:id/restore
POST   /listings/:id/bump         # yenilənmə (boost)
POST   /listings/:id/promote      { service_code, days }
POST   /listings/:id/extend       # müddət uzatma

POST   /listings/:id/favorite
DELETE /listings/:id/favorite

POST   /listings/:id/report       { reason, detail }
GET    /listings/:id/stats        # owner-only: views, clicks, chats
GET    /listings/:id/similar
```

## Listing Media

```
POST   /listings/:id/images       # multipart, max 20
DELETE /listings/:id/images/:imageId
PATCH  /listings/:id/images/order { image_ids[] }   # sıralama
POST   /listings/:id/videos
DELETE /listings/:id/videos/:videoId
```

## Search

```
GET    /search?q=&category=&city=&filters=&sort=&page=
GET    /search/suggestions?q=
GET    /search/popular            # ən çox axtarılan
POST   /search/save               { name, query }    # saxlanılan axtarış
GET    /search/saved
DELETE /search/saved/:id
```

## Favorites

```
GET    /favorites                 # mənim seçilmişlər
DELETE /favorites/:listingId
POST   /favorites/clear
```

## Chats & Messages

```
GET    /chats                     # mənim chatlarım
GET    /chats/:id
POST   /chats                     { listing_id, initial_message }
DELETE /chats/:id

GET    /chats/:id/messages?cursor=
POST   /chats/:id/messages        { content, attachment_url? }
PATCH  /chats/:id/messages/:msgId/read
POST   /chats/:id/block
DELETE /chats/:id/block
POST   /chats/:id/report

# WebSocket (Socket.io)
WS     /ws
  events: message:new, message:read, typing:start, typing:stop, presence
```

## Notifications

```
GET    /notifications?unread_only=true
GET    /notifications/count       # badge üçün
PATCH  /notifications/:id/read
POST   /notifications/read-all
DELETE /notifications/:id
```

## Shops

```
GET    /shops                     # listing
GET    /shops/:slug
POST   /shops                     # yarat (business user)
PATCH  /shops/:id
DELETE /shops/:id

GET    /shops/:id/listings
GET    /shops/:id/reviews
POST   /shops/:id/follow
DELETE /shops/:id/follow

# Shop members (RBAC)
GET    /shops/:id/members
POST   /shops/:id/members         { user_email, role }
PATCH  /shops/:id/members/:userId
DELETE /shops/:id/members/:userId

# Bulk operations
POST   /shops/:id/listings/bulk-import   # CSV/Excel
GET    /shops/:id/listings/bulk-import/:jobId  # status
GET    /shops/:id/listings/export

# Analitika
GET    /shops/:id/stats           # baxış, klik, lead
GET    /shops/:id/leads
```

## Reviews

```
GET    /reviews/user/:userId
POST   /reviews                   { reviewed_id, listing_id, rating, comment }
PATCH  /reviews/:id/reply         { reply }
POST   /reviews/:id/report
```

## Complaints (Şikayətlər)

```
POST   /complaints                { reason, target_type, target_id, detail, evidence[] }
GET    /complaints/me             # mənim şikayətlərim
```

## Payments & Wallet

```
GET    /payments                  # mənim ödənişlərim
GET    /payments/:id

POST   /payments/topup            { amount, provider }      # balansa pul
POST   /payments/promotion        { listing_id, service_code }  # premium ödənişi
POST   /payments/subscription     { plan_code, period }     # abunə

# Provider webhooks
POST   /payments/webhook/pulpal
POST   /payments/webhook/epoint

GET    /wallet
GET    /wallet/transactions

GET    /premium-services          # mövcud paketlər
GET    /subscriptions/plans       # mövcud planlar
GET    /subscriptions/me
POST   /subscriptions/cancel
```

## Promotions / Premium

```
GET    /promotions/services                       # vip_7d, top_3d, ...
POST   /listings/:id/promotions   { service_code }
GET    /listings/:id/promotions                   # aktiv promotionlar
```

## Ad Campaigns

```
GET    /ads/campaigns
POST   /ads/campaigns             { name, budget, banner_url, target_categories, target_cities, ... }
GET    /ads/campaigns/:id
PATCH  /ads/campaigns/:id
DELETE /ads/campaigns/:id
POST   /ads/campaigns/:id/pause
POST   /ads/campaigns/:id/resume
GET    /ads/campaigns/:id/stats

GET    /ads/banners               # public, position-aware
POST   /ads/banners/:id/click     # tracking
```

## Delivery (Faza 3)

```
POST   /delivery/quote            { from, to, weight }
POST   /delivery/orders           { listing_id, address, ... }
GET    /delivery/orders/:id
GET    /delivery/orders/:id/tracking
POST   /delivery/orders/:id/cancel
```

## Escrow (Faza 3)

```
POST   /escrow/transactions       { listing_id, amount }
GET    /escrow/transactions/:id
POST   /escrow/transactions/:id/ship       { tracking }
POST   /escrow/transactions/:id/confirm    # alıcı təsdiqi → release
POST   /escrow/transactions/:id/dispute    { reason }
```

## Upload

```
POST   /upload/images             # multipart, files[]
POST   /upload/videos             # multipart
POST   /upload/avatar
POST   /upload/document           # business verification
```

## Admin (subdomain `admin.api.avito.az` və ya `/admin/*` + RBAC)

```
# DASHBOARD
GET    /admin/dashboard/overview
GET    /admin/dashboard/revenue
GET    /admin/dashboard/registrations
GET    /admin/dashboard/categories

# USERS
GET    /admin/users?role=&status=&q=
GET    /admin/users/:id
PATCH  /admin/users/:id
POST   /admin/users/:id/suspend   { until, reason }
POST   /admin/users/:id/unsuspend
POST   /admin/users/:id/ban       { reason }
POST   /admin/users/:id/balance/credit  { amount, reason }
POST   /admin/users/:id/verify    # manual identity verification

# LISTINGS
GET    /admin/listings?status=&q=&category=
GET    /admin/listings/:id
POST   /admin/listings/:id/approve
POST   /admin/listings/:id/reject  { reason }
POST   /admin/listings/:id/block   { reason }
POST   /admin/listings/:id/promote-free  { service_code }

# MODERATION
GET    /admin/moderation/queue?priority=&type=
POST   /admin/moderation/:taskId/decide   { decision, reason }
GET    /admin/moderation/stats

# COMPLAINTS
GET    /admin/complaints?status=
GET    /admin/complaints/:id
POST   /admin/complaints/:id/resolve  { resolution, action? }

# CATEGORIES
GET    /admin/categories
POST   /admin/categories
PATCH  /admin/categories/:id
DELETE /admin/categories/:id
PATCH  /admin/categories/:id/attributes  # sxem

# CITIES
POST   /admin/cities
PATCH  /admin/cities/:id
DELETE /admin/cities/:id

# BANNERS
GET    /admin/banners
POST   /admin/banners
PATCH  /admin/banners/:id
DELETE /admin/banners/:id

# ADS
GET    /admin/ads/campaigns?status=
POST   /admin/ads/campaigns/:id/approve
POST   /admin/ads/campaigns/:id/reject

# SEO
GET    /admin/seo/pages
POST   /admin/seo/pages
PATCH  /admin/seo/pages/:id

# BLOG
GET    /admin/blog/posts
POST   /admin/blog/posts
PATCH  /admin/blog/posts/:id
DELETE /admin/blog/posts/:id

# SYSTEM
GET    /admin/audit-logs?actor=&action=&from=&to=
GET    /admin/system/settings
PATCH  /admin/system/settings
POST   /admin/system/broadcast    { title, body, target }   # sistem bildirişi

# PERMISSIONS
GET    /admin/roles
GET    /admin/permissions
PATCH  /admin/roles/:id/permissions
```

## Statistika & Analitika

```
GET    /analytics/listings/:id    # owner-only
GET    /analytics/shop/:id        # shop owner-only
GET    /analytics/saved-search/:id
```

## Səhv kodları

| HTTP | Kod | Mənası |
|---|---|---|
| 400 | validation_error | Sxema/format xətası |
| 401 | unauthenticated | Token yox / vaxtı keçib |
| 403 | forbidden | İcazə yox |
| 404 | not_found | Tapılmadı |
| 409 | conflict | Dublikat |
| 422 | business_error | Biznes qaydası |
| 429 | rate_limited | Sürət limiti |
| 500 | internal | Server xətası |

## Cəmi: 180+ endpoint
