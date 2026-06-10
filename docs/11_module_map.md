# 11 — Modul Xəritəsi

## Təbəqələr (Layered Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  Web (Next.js) · Admin (Next.js) · Mobile PWA · Mobile RN(F3)   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    BFF / API GATEWAY                            │
│  Next.js API routes · NestJS controllers · WebSocket gateway    │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    DOMAIN MODULES (NestJS)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                         │
│  Prisma · Redis · S3 · Meilisearch · BullMQ · Socket.io        │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    DATA STORAGE                                 │
│  PostgreSQL · Redis · S3/R2 · Meilisearch · ClickHouse         │
└─────────────────────────────────────────────────────────────────┘
```

## Domen modullarının xəritəsi

```
┌──────────────────────────────────────────────────────────────┐
│                      IDENTITY & ACCESS                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Auth   │  │  Users   │  │ Profile  │  │ Sessions │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                         CATALOG                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Categories  │  │  Attributes  │  │   Cities     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    LISTING DOMAIN (CORE)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Listings │  │  Media   │  │  Search  │  │Favorites │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       COMMERCE                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Payments │  │  Wallet  │  │Promotions│  │Subscript.│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐                                 │
│  │ Escrow F3│  │Delivery F3│                                │
│  └──────────┘  └──────────┘                                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       BUSINESS                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Shops   │  │  Members │  │   Ads    │  │ Bulk Ops │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      ENGAGEMENT                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Chats   │  │ Messages │  │Notificat.│  │ Reviews  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    TRUST & SAFETY                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Moderation│  │Complaints│  │AntiFraud │  │   AI     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    OPERATIONS                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Admin   │  │   SEO    │  │  Blog    │  │Analytics │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐                                 │
│  │  Support │  │  Audit   │                                 │
│  └──────────┘  └──────────┘                                 │
└──────────────────────────────────────────────────────────────┘
```

## Modullar arasında asılılıqlar (DAG)

```
Auth → Users → Profile / BusinessProfile
Users → Shops (B2C/B2B)
Categories → CategoryAttributes
Categories + Cities → Listings
Listings → Media, Search, Favorites
Listings + Users → Chats → Messages → Notifications
Listings + Users → Reviews, Complaints
Listings → Promotions → Payments → Wallet
Shops → Subscriptions, Ads, BulkOps
Listings → Moderation → Admin
All Modules → Analytics, AuditLog
Future: Listings + Payments → Delivery, Escrow
```

## Modul interfeysi (TypeScript port)

Hər NestJS modulu **3 səviyyəli kontrakt** verir:

```
modules/listings/
├── listings.module.ts          → DI bind
├── listings.controller.ts      → HTTP routes
├── listings.gateway.ts         → WebSocket (varsa)
├── listings.service.ts         → biznes məntiq
├── listings.repository.ts      → Prisma sorğular
├── listings.events.ts          → publish/subscribe
├── listings.dto.ts             → input/output
├── listings.types.ts           → daxili tip
└── tests/
    ├── unit/
    └── integration/
```

## Hadisə modeli (Event-driven)

| Topic | Producer | Consumer-lər |
|---|---|---|
| `user.registered` | Auth | Notification (welcome), Analytics |
| `user.verified` | Auth | Analytics, Moderation (risk score) |
| `listing.created` | Listings | Search (index), Moderation, Notification (admin) |
| `listing.approved` | Moderation | Search (publish), Notification (owner), Analytics |
| `listing.rejected` | Moderation | Notification (owner), Analytics |
| `listing.expired` | Cron | Notification (owner) |
| `listing.viewed` | Listings | Analytics (counter) |
| `listing.favorited` | Favorites | Notification (owner), Analytics |
| `chat.message_sent` | Chat | Notification (recipient), AntiFraud |
| `payment.succeeded` | Payments | Promotions, Wallet, Notification, Analytics |
| `payment.failed` | Payments | Notification |
| `complaint.opened` | Complaints | Moderation queue, Notification (admin) |
| `review.created` | Reviews | Users (rating recompute), Notification |
| `shop.member_added` | Shops | Notification |

## İnteqrasiyalar

### Daxili (sinxron)
- HTTP REST: API ↔ Web/Admin
- gRPC: ServiceA ↔ ServiceB (Faza 2 mikroservislər)
- WebSocket: Chat real-time

### Daxili (asinxron)
- BullMQ (Redis): worker tasklar
- Kafka (Faza 2): cross-service event

### Xarici
- **Pulpal / Epoint** — ödəniş
- **Atlas SMS / Twilio** — OTP
- **Postmark / SendGrid** — email
- **FCM / APNs** — push
- **Cloudflare** — CDN, WAF, DNS, R2
- **Sentry** — error tracking
- **Posthog / Mixpanel** — product analytics
- **OpenAI / Anthropic** — AI tasks
- **Google / Yandex Maps** — geocoding
- **ASAN İmza** — strong identity (Faza 2)
- **vergiler.gov.az** — VÖEN doğrulama
- **Azerpoct, Bravo Express** — logistika (Faza 3)

## Modul ölçüləri (kod sətri təxmini, MVP)

| Modul | TS LoC (~) | Test LoC | Mürəkkəblik |
|---|---|---|---|
| Auth | 1500 | 800 | yüksək |
| Users | 800 | 400 | orta |
| Categories | 600 | 300 | aşağı |
| Listings | 2500 | 1200 | yüksək |
| Search | 1000 | 400 | yüksək |
| Media | 800 | 300 | orta |
| Chats | 1500 | 600 | yüksək |
| Notifications | 700 | 300 | orta |
| Payments | 1800 | 900 | yüksək |
| Promotions | 600 | 300 | orta |
| Moderation | 1200 | 500 | yüksək |
| Admin | 2500 | 1000 | yüksək |
| **Cəmi (MVP)** | **~15 600** | **~7 000** | — |
