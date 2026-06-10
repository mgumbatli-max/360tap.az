# 01 — Arxitektura

## 1. Yüksək səviyyəli memarlıq

```
┌────────────────────────────────────────────────────────────────────┐
│                     Cloudflare CDN + WAF + DDoS                    │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼────┐            ┌────▼────┐            ┌────▼────┐
   │  Web    │            │  PWA    │            │ Mobile  │
   │ Next.js │            │ Mobile  │            │  RN     │
   │   15    │            │ Browser │            │ (Faza3) │
   └────┬────┘            └────┬────┘            └────┬────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                  ┌────────────▼────────────┐
                  │   API Gateway / BFF      │
                  │   (Nginx / Traefik)      │
                  └────────────┬────────────┘
                               │
   ┌──────┬──────┬──────┬──────┼──────┬──────┬──────┬──────┐
   │      │      │      │      │      │      │      │      │
┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐
│Auth│ │User│ │Lstg│ │Srch│ │Chat│ │Pay │ │Mod │ │Notf│ │Adm │
└──┬─┘ └──┬─┘ └──┬─┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘
   │      │      │     │      │      │      │      │      │
   └──────┴──────┴──┬──┴──────┴──────┴──────┴──────┴──────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
   │ Postgres│ │  Redis  │ │MeiliSrch│
   │   16    │ │  7 cluster│ │  /ES    │
   └─────────┘ └─────────┘ └─────────┘

   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │   S3    │ │ BullMQ  │ │ ClickH. │
   │ (R2/AWS)│ │ Workers │ │analytics│
   └─────────┘ └─────────┘ └─────────┘
```

## 2. Texnologiya seçimləri və əsaslar

| Layer | Seçim | Səbəb |
|---|---|---|
| Web framework | **Next.js 15** | RSC, App Router, ISR, edge, SEO, PWA dəstəyi |
| Backend | **NestJS 10** | Modular, DI, dekorator, TypeScript-first, böyük komandalar üçün |
| ORM | **Prisma 5** | Type-safe, miqrasiya, müasir DX |
| DB | **PostgreSQL 16** | JSONB, GIST, FTS, etibarlı |
| Cache | **Redis 7** | Session, rate-limit, queue (BullMQ), pub/sub |
| Search | **Meilisearch** (MVP) → **Elasticsearch** (scale) | Sürətli, fuzzy, AZ morfologiya əlavə oluna bilər |
| Storage | **S3 / R2 / MinIO** | obyekt saxlama, CDN ilə inteqrasiya |
| Image proc | **imgproxy** | real-time resize, format dönüşüm |
| Auth | **NextAuth + JWT** | OAuth + öz təminat, zəng nömrəsi OTP |
| Real-time | **Socket.io** | chat, bildiriş, typing |
| Queue | **BullMQ** | email, sms, image, search index, AI tasks |
| Monorepo | **Turborepo + pnpm** | sürətli build, cache, paylaşılan paketlər |
| Container | **Docker** + **Kubernetes** | konteynerizasiya, orkestr |
| CI/CD | **GitHub Actions + ArgoCD** | GitOps |
| IaC | **Terraform** | reproducible infrastructure |
| Monitoring | **Prometheus + Grafana + Sentry + Loki** | metrics + errors + logs |
| Tracing | **OpenTelemetry + Tempo** | distributed tracing |

## 3. Modul / mikroservis sərhədləri

### Faza 1 (Modular Monolith — NestJS)
Vahid NestJS proseslərində ayrı modullar:
1. **AuthModule** — JWT, OTP, NextAuth callback
2. **UsersModule** — profil, rollar, balans
3. **CategoriesModule** — kateqoriya ağacı + atributlar
4. **ListingsModule** — CRUD, status, premium
5. **SearchModule** — Meilisearch indexer + sorğu
6. **MediaModule** — upload, S3, transformasiya
7. **ChatsModule** — WS, mesaj, oxundu
8. **NotificationsModule** — push, email, SMS
9. **PaymentsModule** — Pulpal/Epoint inteqrasiya
10. **PromotionsModule** — VIP, boost, paketlər
11. **ReviewsModule** — reyting, rəy
12. **ComplaintsModule** — şikayət, mübahisə
13. **ModerationModule** — manual + AI flag
14. **ShopsModule** — biznes profil, komanda
15. **AdsModule** — banner, kampaniya
16. **AnalyticsModule** — event collection
17. **AdminModule** — backoffice, audit log
18. **DeliveryModule** — çatdırılma (Faza 3)
19. **EscrowModule** — təhlükəsiz ödəniş (Faza 3)
20. **AIModule** — moderasiya, qiymət təklifi, başlıq

### Faza 2 (Mikroservislərə ayırma)
Yüksək yük olan modullar ayrılır: **Search**, **Chat**, **Notifications**, **Payments**, **Media**.
Kommunikasiya: **gRPC** + **Kafka** (async event).

## 4. Verilənlər axını

### 4.1. Elan yaratma
```
User → Web (Next.js)
  → POST /api/listings (NestJS)
    → Validate (zod/class-validator)
    → Save Postgres (status='review')
    → Publish "listing.created" → Kafka/Redis
       ├─→ Search indexer (Meilisearch)
       ├─→ AI moderation (worker)
       ├─→ Image transform (imgproxy)
       └─→ Notifications (admin queue)
    → Return 201
```

### 4.2. Axtarış
```
User → Web → /api/search?q=iphone&category=...
  → NestJS → Meilisearch sorğusu
  → Cache (Redis, 60s)
  → Postgres-dən satıcı reytinqi join
  → Return results (premium-lar yuxarıda)
```

### 4.3. Real-time chat
```
User A → Web → WebSocket (Socket.io)
  → NestJS WS gateway → message saxla (Postgres)
  → Redis pub/sub → User B-ə push
  → Background: typing indicator (Redis ttl=3s)
```

## 5. Caching strategiyası

| Veri | TTL | Səbəb |
|---|---|---|
| Kateqoriyalar | 1 saat | nadir dəyişir |
| Şəhərlər | 1 gün | nadir dəyişir |
| Axtarış nəticəsi (ümumi) | 60 san | təzəlik |
| Ana səhifə populyar | 5 dəq | təzəlik vs yük |
| İstifadəçi profili | 30 san | öz dəyişikliklərini görsün |
| Elan detalı | 30 san + invalidate-on-update | |
| Sessiya | 7 gün (rolling) | |
| Rate-limit kvota | 1 dəq | |

Redis key konvensiyası: `avito:{module}:{id}` məs. `avito:listing:abc123`.

## 6. Search arxitekturası

### MVP — Meilisearch
- Tək instance (Docker), `listings` indexi.
- Real-time sync: `listings.created/updated/deleted` event-i → indexer worker.
- Filterlər: `category_slug`, `city_slug`, `price`, `is_vip`, `attributes.*`.
- Sıralama: `is_vip desc`, `created_at desc`, `price asc/desc`, `views desc`.
- AZ-RU-EN typo-tolerance.

### Genişlənmə — Elasticsearch / OpenSearch
- 1M+ elan və mürəkkəb aggregations üçün.
- Custom analyzer (AZ morfologiya, sinonimlər).
- Kibana ilə monitorinq.

## 7. Auth axını

```
1. Qeydiyyat:
   POST /auth/register {email|phone, password, ...}
   → bcrypt(password)
   → INSERT users (status='pending')
   → OTP göndər (SMS/email)
   → JWT (limited scope: 'verify')

2. OTP təsdiqi:
   POST /auth/verify-otp {code}
   → Status='active', is_phone_verified=true
   → JWT (full access)

3. NextAuth (Google/Apple/FB):
   → Callback /api/auth/callback/google
   → Find or create user
   → Issue JWT

4. Token strukturu:
   Access JWT (15 dəq, RS256) + Refresh (7 gün, rotation)
   Cookie: HttpOnly, Secure, SameSite=Lax
```

## 8. Ölçəkləmə planı

| Mərhələ | İstifadəçi | Elan | Strategiya |
|---|---|---|---|
| MVP | <50K | <50K | Modular monolith, single Postgres, 1 Meilisearch |
| 1-ci il | 500K | 500K | Read replica, Redis cluster, S3 CDN |
| 2-ci il | 2M | 2M | Microservices, Elasticsearch, Kafka, multi-AZ |
| 3-cü il | 5M+ | 10M+ | Sharding, regional CDN, edge functions |

## 9. Performans hədəfləri (SLO)

- Ana səhifə LCP ≤ 2.0s (P75)
- Axtarış cavabı ≤ 200ms (P95)
- API ≤ 300ms (P99)
- Uptime ≥ 99.9%
- WS bağlantı stabilliyi ≥ 99.5%

## 10. Təhlükəsizlik (xülasə)
- TLS 1.3, HSTS, CSP, SRI
- OWASP ASVS L2
- Argon2id parol hash
- Rate-limit + Cloudflare WAF
- PII şifrələnməsi (KMS)
- Penetration test illik
- Bug bounty
- Audit log immutability
