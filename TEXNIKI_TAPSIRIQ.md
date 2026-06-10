# TEXNİKİ TAPŞIRIQ (TT)
## Avito.az — Universal Elanlar və Marketplace Platforması

**Sənəd versiyası:** 1.0
**Tarix:** 08.05.2026
**Status:** Layihə (Draft)
**Müştəri:** —
**İcraçı:** —
**Layihə kodu:** AVITO-AZ

---

## MÜNDƏRİCAT

1. [Ümumi məlumat](#1-ümumi-məlumat)
2. [Layihənin məqsədi və biznes hədəflər](#2-layihənin-məqsədi-və-biznes-hədəflər)
3. [Hədəf auditoriya və istifadəçi rolları](#3-hədəf-auditoriya-və-istifadəçi-rolları)
4. [Funksional tələblər](#4-funksional-tələblər)
5. [Qeyri-funksional tələblər](#5-qeyri-funksional-tələblər)
6. [Texniki memarlıq](#6-texniki-memarlıq)
7. [Verilənlər bazası modeli](#7-verilənlər-bazası-modeli)
8. [API spesifikasiyası](#8-api-spesifikasiyası)
9. [UI/UX tələbləri](#9-uiux-tələbləri)
10. [Mobil tətbiqlər](#10-mobil-tətbiqlər)
11. [Admin və moderasiya paneli](#11-admin-və-moderasiya-paneli)
12. [Monetizasiya modeli](#12-monetizasiya-modeli)
13. [İnteqrasiyalar](#13-inteqrasiyalar)
14. [Təhlükəsizlik](#14-təhlükəsizlik)
15. [SEO və marketinq](#15-seo-və-marketinq)
16. [Lokalizasiya](#16-lokalizasiya)
17. [Hüquqi tələblər](#17-hüquqi-tələblər)
18. [Test strategiyası](#18-test-strategiyası)
19. [DevOps və infrastruktur](#19-devops-və-infrastruktur)
20. [Layihə fazaları və müddətlər](#20-layihə-fazaları-və-müddətlər)
21. [Komanda və rollar](#21-komanda-və-rollar)
22. [Risklər və azaldılma planı](#22-risklər-və-azaldılma-planı)
23. [Qəbul meyarları (Acceptance Criteria)](#23-qəbul-meyarları)
24. [Lüğət (Glossary)](#24-lüğət)

---

## 1. ÜMUMİ MƏLUMAT

### 1.1. Layihənin qısa təsviri
**Avito.az** — Azərbaycan bazarı üçün universal C2C / B2C / B2B elanlar və marketplace platformasıdır. İstifadəçilər platformada məhsul və xidmətləri ala, sata, kirayə verə, iş tapa və xidmət sifariş edə biləcəklər. Platforma veb (responsive), iOS və Android nüvələri ilə təchiz olunacaq.

### 1.2. Analoqlar və benchmark
- **Avito.ru** (Rusiya) — əsas referans
- **OLX** (qlobal)
- **Tap.az** (Azərbaycan, lokal lider)
- **Lalafo.az** (Azərbaycan)
- **Bina.az** (daşınmaz əmlak vertikalı)
- **Turbo.az** (avtomobil vertikalı)

### 1.3. Rəqabət üstünlükləri (USP)
1. **AI əsaslı elan keyfiyyəti yoxlanışı** — şəkil tanıma + mətn təhlili (sahtə, dublikat, qadağan).
2. **Vahid mesajlaşma və əqd qoruyucu (Escrow Pay)** — alıcı/satıcı arasında təhlükəsiz ödəniş.
3. **Verifikasiya nişanları** — ASAN İmza, Şəxsiyyət vəsiqəsi və biznes VÖEN doğrulaması.
4. **Real-time qiymət analitikası** — orta bazar qiyməti və qiymət trendi.
5. **Üzgüləmə (Boost) və VIP** — şəffaf, ölçülə bilən gəlir modeli.
6. **Lokal logistika inteqrasiyası** — Azerpoct, Bravo Express, Pasha Logistics.

### 1.4. Sənədin status terminologiyası
- **MUST** — məcburi tələb (MVP-də olmalıdır).
- **SHOULD** — yüksək prioritet (1-ci versiyada arzuolunan).
- **MAY** — opsional (gələcək versiyalar üçün).

---

## 2. LAYİHƏNİN MƏQSƏDİ VƏ BİZNES HƏDƏFLƏR

### 2.1. Strateji məqsəd
12 ay ərzində Azərbaycanda elanlar bazarında **№1 və ya №2** mövqe əldə etmək və 24 ay ərzində öz-özünü maliyyələşdirən (cash-flow positive) məhsula çevrilmək.

### 2.2. Ölçülə bilən KPI-lər (12 aya)

| KPI | Hədəf |
|---|---|
| Qeydiyyatdan keçmiş istifadəçi (MAU) | 800 000 |
| Aylıq aktiv elan sayı | 350 000 |
| Aylıq əqd həcmi (GMV) | 60 mln AZN |
| Aylıq ödənişli xidmət gəliri | 250 000 AZN |
| Mobil tətbiq quraşdırılmaları | 500 000 |
| Orta sessiya müddəti | ≥ 6 dəq |
| D7 retention | ≥ 35% |
| NPS | ≥ 45 |
| Crash-free sessiyalar (mobil) | ≥ 99.5% |

---

## 3. HƏDƏF AUDİTORİYA VƏ İSTİFADƏÇİ ROLLARI

### 3.1. Auditoriya seqmentləri
- **Fərdi satıcılar (C2C)** — istifadə etdiyi əşyaları satan şəxslər.
- **Peşəkar satıcılar (B2C)** — daimi biznes fəaliyyəti olan şəxs/şirkət.
- **Mağazalar (Pro Mağaza)** — geniş kataloqu olan biznes hesabları.
- **Daşınmaz əmlak agentləri** və agentliklər.
- **Avtomobil dilerləri**.
- **İş axtaranlar və işəgötürənlər**.
- **Xidmət təminatçıları** (usta, dizayner, müəllim və s.).

### 3.2. İstifadəçi rolları (RBAC)

| Rol | Səlahiyyətlər |
|---|---|
| Guest | Baxış, axtarış, filtr |
| User | Elan yerləşdirmə, mesajlaşma, sevimlilər, ödəniş |
| Pro / Business | Mağaza səhifəsi, toplu yükləmə, analitika, API |
| Moderator | Şikayət rəsmiləşdirilməsi, elan yoxlanışı, gizlətmə |
| Senior Moderator | Bloklama, açılma, sanksiyalar |
| Support | Müştəri dəstəyi, refund qərarı (limitli) |
| Finance | Tranzaksiyalar, hesabatlar, vergi |
| Admin | Tam idarəetmə (auditlə) |
| Super Admin | Sistemli parametrlər, RBAC |

---

## 4. FUNKSİONAL TƏLƏBLƏR

### 4.1. Hesab və autentifikasiya **[MUST]**
- E-poçt + parol qeydiyyatı (parol ≥ 10 simvol, kompleks).
- Mobil nömrə + OTP (SMS) qeydiyyatı.
- OAuth: Google, Apple, Facebook.
- 2FA — SMS + TOTP (Google Authenticator).
- Şifrə bərpası (e-poçt + telefon).
- ASAN İmza ilə güclü identifikasiya **[SHOULD]**.
- Sessiya idarəetməsi (cihazların siyahısı, uzaq logout).

### 4.2. Profil **[MUST]**
- Şəkil, ad, lokasiya, qoşulma tarixi, reyting.
- Verifikasiya nişanları (telefon ✓, e-poçt ✓, şəxs ✓, biznes ✓).
- Aktiv / arxiv elanları, satış/alış tarixçəsi.
- Rəylər və qiymətləndirmə (1–5 ulduz + mətn).
- Şikayət düyməsi.

### 4.3. Kateqoriya strukturu **[MUST]**
3 səviyyəli ağac: **Kateqoriya → Alt-kateqoriya → Növ**.

Əsas vertikal kateqoriyalar:
1. **Daşınmaz əmlak** (yaşayış, kommersiya, yer, kirayə/satış)
2. **Nəqliyyat** (avtomobil, motosiklet, su, yük, kommersiya)
3. **İş və karyera** (vakansiya, CV)
4. **Xidmətlər** (təmir, tədris, gözəllik, hüquq və s.)
5. **Elektronika** (telefon, kompüter, TV, foto)
6. **Ev və bağ** (mebel, məişət texnikası)
7. **Geyim, ayaqqabı, aksesuar**
8. **Uşaqlar üçün**
9. **Xobbi və istirahət**
10. **Heyvanlar**
11. **İdman**
12. **Kənd təsərrüfatı**
13. **Biznes və avadanlıq**

### 4.4. Elan yerləşdirmə **[MUST]**

#### 4.4.1. Sahələr (sxem dinamik, kateqoriyaya görə)
- Başlıq (10–70 simvol)
- Təsvir (50–5000 simvol)
- Kateqoriya / alt-kateqoriya
- Qiymət (sabit, müzakirə olunan, pulsuz, mübadilə)
- Valyuta (AZN əsas, USD/EUR opsional)
- Şəkil (1–20 ədəd, ≤ 10MB hər biri, JPEG/PNG/WebP)
- Video (1 ədəd, ≤ 100MB, 60s) **[SHOULD]**
- Lokasiya (xəritədə pin, şəhər, rayon, ünvan)
- Əlaqə nömrəsi (maskalanmış proxy nömrə **[SHOULD]**)
- Çatdırılma seçimləri
- Vəziyyət (yeni, az işlənmiş, işlənmiş)
- Kateqoriyaya xas atributlar (avto: marka/model/il/yürüş, əmlak: otaq/kv.m./mərtəbə)

#### 4.4.2. AI keyfiyyət yoxlaması **[MUST]**
- Mətn moderasiyası: nifrət nitqi, qadağan olunmuş mallar, dublikat.
- Şəkil moderasiyası: NSFW, water-mark, dublikat (perceptual hash).
- Avtomatik kateqoriya təklifi (image classifier).
- Qiymət real-bazar yoxlanışı (statistikaya əsasən "yüksək/düşük" xəbərdarlığı).

#### 4.4.3. Elanın həyat dövrü
`DRAFT → REVIEW → ACTIVE → (PROMOTED) → SOLD/EXPIRED/REJECTED/ARCHIVED`
- ACTIVE: standart 30 gün.
- Avtomatik xatırlatma istifadəçiyə (24 saat qalanda).
- Bir defəlik pulsuz uzatma (kateqoriyadan asılı).

### 4.5. Axtarış və filtrlər **[MUST]**
- Tam-mətn axtarış (Azərbaycan, Rus, İngilis morfologiyası).
- Saxta yazılışa qarşı dözümlülük (fuzzy / typo-tolerance).
- Filtrlər: qiymət aralığı, lokasiya (radius km), vəziyyət, kateqoriya atributları.
- Sıralama: yenilik, qiymət ↑/↓, məsafə, populyarlıq, "ən uyğun".
- Saxlanılan axtarışlar + e-poçt/push bildirişləri.
- Xəritə görünüşü (cluster).

### 4.6. Mesajlaşma **[MUST]**
- Real-time chat (WebSocket).
- Mətn, şəkil, fayl (≤ 10MB), səs (≤ 60s).
- "Görüldü" + "yazır..." indikatoru.
- Tərcümə düyməsi (avtomatik dil aşkarlama).
- Şablon cavablar (satıcı üçün).
- Spamfilter (link, telefon nömrəsi maskası).
- Bloklama, şikayət.
- Push + e-poçt bildirişləri.

### 4.7. Sevimlilər və saxlanılanlar **[MUST]**
- Elanın "Ulduz"u (favorite).
- Saxlanılan axtarışlar.
- Qiymət dəyişiklik bildirişi.

### 4.8. Bildirişlər **[MUST]**
Kanallar: in-app, push (FCM/APNs), e-poçt, SMS (yalnız kritik).
Növlər: yeni mesaj, elan təsdiqi/rədd, qiymət dəyişikliyi, ödəniş statusu, sistem.

### 4.9. Reytinq və rəy **[MUST]**
- Yalnız əqd tamamlandıqdan sonra.
- 1–5 ulduz + mətn, şəkil opsional.
- Cavablamaq imkanı.
- Saxta rəylərə qarşı: yalnız identifikasiya olunmuş istifadəçi.

### 4.10. Şikayət sistemi **[MUST]**
- Səbəblər: saxtə, qadağan, dublikat, qiymət, başqa.
- SLA: 24 saat ərzində moderator cavabı.
- Avtomatik kontekst (skrinşot, IP, cihaz).

### 4.11. Pro Mağaza **[SHOULD]**
- Brendləşdirilmiş səhifə (logo, banner, təsvir).
- Toplu yükləmə (CSV/XML feed).
- Mağaza analitikası (impression, klik, çat).
- API access.
- Vitrin VIP elanları.

### 4.12. Ödəniş və əqd **[MUST]**

#### 4.12.1. Pulsuz vs ödənişli
- Standart elan: ayda 3 pulsuz (kateqoriyadan asılı limit).
- Əlavə elan: 1–5 AZN.

#### 4.12.2. Promotion paketləri
- **VIP** — top vitrində 7/14/30 gün.
- **Boost** — yenilənmə (yenidən yuxarıya).
- **Premium** — kateqoriya səhifəsində fərqlənmə.
- **Highlight** — fon rəngi.

#### 4.12.3. Escrow Pay **[SHOULD]**
- Alıcı ödəyir → platforma saxlayır → çatdırılma təsdiqindən sonra satıcıya ötürülür.
- Mübahisə açılırsa — moderator həll edir.
- Komissiya: 3–5%.

### 4.13. Logistika **[SHOULD]**
- Çatdırılma sifarişi: Azerpoct, Bravo Express.
- Trekinq nömrəsi və status.
- Etiket çapı.

### 4.14. Statistika (istifadəçi üçün) **[MUST]**
- Elan üzrə: baxış, sevimliyə əlavə, çat sayı, telefon klikləri, dönüşüm.
- Profil səviyyəsində aqreqat.

---

## 5. QEYRİ-FUNKSİONAL TƏLƏBLƏR

### 5.1. Performans
- Ana səhifə LCP ≤ 2.5s (P75, 4G).
- Axtarış cavabı (elasticsearch) ≤ 300ms (P95).
- API P99 latency ≤ 500ms.
- 10 000 paralel istifadəçi (MVP), 100 000 (1-ci il sonu).

### 5.2. Etibarlılıq və əlçatanlıq
- Uptime ≥ 99.9% (≈ 8.7 saat/il downtime).
- RPO ≤ 15 dəq, RTO ≤ 1 saat.
- Multi-AZ, gündəlik backup, 30 gün saxlama.

### 5.3. Miqyaslanma
- Stateless servislər (yatay miqyaslanma).
- Auto-scaling (CPU > 70%, RPS threshold).
- CDN ilə statik aktivlərin paylanması.

### 5.4. İstifadəçi təcrübəsi
- WCAG 2.1 AA əlçatanlıq.
- Mobil-birinci dizayn.
- Offline rejim (mobil tətbiq — son axtarış, sevimlilər).

### 5.5. Saxlanma və genişlənmə
- Genişləndirilə bilən kateqoriya sxemi (JSON Schema based).
- Plugin sistemi yeni vertikal əlavə üçün.

---

## 6. TEXNİKİ MEMARLIQ

### 6.1. Yüksək səviyyəli memarlıq (HLA)
```
              [ Cloudflare CDN + WAF ]
                       │
            ┌──────────┴──────────┐
            │                     │
       [ Web (Next.js) ]   [ Mobile (RN) ]
            │                     │
            └──────────┬──────────┘
                       │
                  [ API Gateway / BFF ]
                       │
   ┌──────┬──────┬─────┴────┬──────┬──────────┐
   │      │      │          │      │          │
[Auth] [Listings] [Search] [Chat] [Payment] [Notification]
   │      │      │          │      │          │
   └──────┴──────┴──────────┴──────┴──────────┘
                       │
   [PostgreSQL] [Redis] [ElasticSearch] [S3] [Kafka] [ClickHouse]
```

### 6.2. Texnologiya stack-i

#### Frontend (Web)
- **Framework:** Next.js 15 (React 19, App Router, RSC)
- **Dil:** TypeScript 5.x
- **Stil:** TailwindCSS + shadcn/ui
- **State:** TanStack Query + Zustand
- **Forms:** React Hook Form + Zod
- **i18n:** next-intl (az, ru, en)
- **Maps:** MapLibre GL (Yandex tile fallback)
- **Test:** Vitest + Playwright

#### Backend
- **Runtime:** Node.js 22 LTS
- **Framework:** NestJS (modular monorepo, Nx)
- **Dil:** TypeScript
- **API stili:** REST + GraphQL (BFF), gRPC (servislər arası)
- **Validation:** class-validator + zod
- **ORM:** Prisma (əsas) / Drizzle (axtarış servisində)
- **Auth:** OAuth2 + JWT (RS256), refresh rotation, OPA (RBAC)

#### Datalar
- **OLTP:** PostgreSQL 16 (logical replication, PgBouncer)
- **Axtarış:** ElasticSearch 8 / OpenSearch
- **Cache & queue:** Redis 7 (cluster mode)
- **Event bus:** Apache Kafka (schema registry)
- **Analitika:** ClickHouse
- **Obyekt saxlama:** S3-uyğun (AWS S3 / Cloudflare R2)
- **CDN:** Cloudflare
- **Görüntü emalı:** imgproxy (real-time resize/format)

#### Mobil
- **Framework:** React Native 0.76+ (New Architecture, Hermes)
- **Naviqasiya:** React Navigation v7
- **State:** TanStack Query + Zustand
- **Push:** FCM (Android), APNs (iOS) — Notifee
- **Crash:** Sentry
- **OTA:** Expo Updates (yalnız JS)
- **Build:** EAS Build / Fastlane

#### DevOps
- **Konteyner:** Docker, multi-stage builds
- **Orkestrator:** Kubernetes (EKS / Yandex Managed K8s)
- **CI/CD:** GitHub Actions + ArgoCD (GitOps)
- **IaC:** Terraform
- **Monitoring:** Prometheus + Grafana
- **Loglar:** Loki / OpenSearch (Filebeat)
- **Tracing:** OpenTelemetry + Tempo
- **Səhv izləmə:** Sentry
- **Sirlər:** HashiCorp Vault / AWS Secrets Manager
- **Feature flag:** GrowthBook / Unleash

### 6.3. Mikroservislər (domen sərhədləri)
1. **Auth Service** — qeydiyyat, login, OAuth, 2FA.
2. **User Service** — profil, verifikasiya, reyting.
3. **Catalog Service** — kateqoriya ağacı, atribut sxemi.
4. **Listing Service** — elan CRUD, həyat dövrü.
5. **Search Service** — indeksləmə, sorğu, filter.
6. **Media Service** — yükləmə, transformasiya, AI moderasiya.
7. **Chat Service** — WebSocket, mesaj saxlanması.
8. **Notification Service** — push, e-poçt, SMS.
9. **Payment Service** — billing, escrow, refund.
10. **Promotion Service** — VIP, Boost paketləri.
11. **Review Service** — rəy və reyting.
12. **Moderation Service** — şikayət, AI flag, manuel.
13. **Analytics Service** — event collection.
14. **Logistics Service** — çatdırılma inteqrasiyası.

### 6.4. Hadisə əsaslı kommunikasiya (Event-Driven)
Kafka topic nümunələri:
- `listings.created`, `listings.updated`, `listings.deleted`
- `users.registered`, `users.verified`
- `payments.succeeded`, `payments.failed`
- `chat.message_sent`
- `moderation.flagged`

---

## 7. VERİLƏNLƏR BAZASI MODELİ

### 7.1. Əsas cədvəllər (yüksək səviyyəli)

```sql
-- USERS
users(
  id UUID PK, email TEXT UNIQUE, phone TEXT UNIQUE,
  password_hash TEXT, role TEXT, status TEXT,
  is_phone_verified BOOL, is_email_verified BOOL,
  is_identity_verified BOOL, is_business_verified BOOL,
  rating NUMERIC(3,2), reviews_count INT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)

-- CATEGORIES (slef-referencing tree)
categories(
  id UUID PK, parent_id UUID FK,
  slug TEXT UNIQUE, name_az TEXT, name_ru TEXT, name_en TEXT,
  attribute_schema JSONB,  -- dynamic per category
  sort_order INT, is_active BOOL
)

-- LISTINGS
listings(
  id UUID PK, owner_id UUID FK, category_id UUID FK,
  title TEXT, description TEXT,
  price NUMERIC(14,2), currency TEXT, price_type TEXT, -- fixed/negotiable/free/exchange
  condition TEXT,
  attributes JSONB,  -- dinamik atributlar
  location GEOGRAPHY(Point),
  city TEXT, district TEXT, address TEXT,
  status TEXT,  -- DRAFT/REVIEW/ACTIVE/SOLD/...
  views INT, favorites INT, chats INT,
  promotion JSONB,  -- {vip_until, boost_count}
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)

-- LISTING_MEDIA
listing_media(
  id UUID PK, listing_id UUID FK,
  url TEXT, type TEXT, sort_order INT,
  width INT, height INT, blurhash TEXT
)

-- CHATS
chats(
  id UUID PK, listing_id UUID FK,
  buyer_id UUID FK, seller_id UUID FK,
  last_message_at TIMESTAMPTZ
)

-- MESSAGES
messages(
  id UUID PK, chat_id UUID FK, sender_id UUID FK,
  content TEXT, attachments JSONB,
  read_at TIMESTAMPTZ, created_at TIMESTAMPTZ
)

-- PAYMENTS
payments(
  id UUID PK, user_id UUID FK,
  amount NUMERIC(14,2), currency TEXT,
  type TEXT, -- promotion/escrow/subscription
  status TEXT, provider TEXT, provider_ref TEXT,
  metadata JSONB, created_at TIMESTAMPTZ
)

-- REVIEWS, FAVORITES, SAVED_SEARCHES, NOTIFICATIONS,
-- COMPLAINTS, MODERATION_LOGS, AUDIT_LOGS, etc.
```

### 7.2. İndekslər
- `listings(status, category_id, created_at DESC)` — siyahı.
- GIN `listings.attributes` üzərində — dinamik filtrlər.
- GIST `listings.location` — radius axtarışı.
- Trigram `listings.title` — fuzzy axtarış (PG fallback).
- Composite `chats(buyer_id, seller_id, last_message_at DESC)`.

### 7.3. Partitioning
- `messages` — aylıq range partitioning.
- `audit_logs` — aylıq partitioning + 12 ay sonra arxivləşdirmə.

---

## 8. API SPESİFİKASİYASI

### 8.1. Ümumi qaydalar
- REST: `/api/v1/...`, JSON, UTF-8.
- Auth: `Authorization: Bearer <JWT>`.
- Rate-limit: 60 req/min anonim, 300 req/min auth, 1000/min Pro.
- Versiyalama: URL-də (`v1`, `v2`).
- Error formatı: RFC 7807 (Problem Details).
- Idempotency-Key başlığı (POST üçün).
- Pagination: cursor-based (`?cursor=...&limit=20`).

### 8.2. Əsas endpoint-lər (nümunə)

**Auth**
```
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/2fa/verify
POST /auth/oauth/google
POST /auth/password/reset
```

**Listings**
```
GET    /listings?category=...&q=...&min_price=...
POST   /listings
GET    /listings/{id}
PATCH  /listings/{id}
DELETE /listings/{id}
POST   /listings/{id}/promote
POST   /listings/{id}/archive
POST   /listings/{id}/report
```

**Chat (WebSocket)**
```
WS /ws/chat
  Events: message:new, message:read, typing, presence
```

**Payments**
```
POST /payments/create-intent
POST /payments/webhook/{provider}
GET  /payments/history
```

### 8.3. OpenAPI 3.1 sənədi
Sənəd `/openapi.yaml`, Swagger UI `/docs`. Hər PR-də avtomatik generasiya və validasiya.

---

## 9. UI/UX TƏLƏBLƏRİ

### 9.1. Dizayn prinsipləri
- **Mobile-first**, sonra desktop genişləndirmə.
- **Premium SaaS estetikası** — gradient accent, glassmorphism kartlar (`backdrop-filter: blur(12px)`), neytral ağ/açıq fon, tünd rejim.
- **Tipoqrafiya:** Inter (UI), display üçün Geist Sans.
- **Rəng sistemi:** CSS dəyişənləri (`var(--primary)`, `var(--accent)` ...), light/dark.
- **8pt grid**, **2xl radius** (kart), **soft shadow**.

### 9.2. Əsas ekranlar
1. Ana səhifə (kateqoriya plitələri, populyar elanlar, banner)
2. Axtarış nəticələri (kart/list/xəritə)
3. Elan səhifəsi (qalereya, başlıq, qiymət, satıcı, "yaz", "zəng et", oxşar)
4. Elan yerləşdirmə (sehr — wizard, 5 addım)
5. Profil (öz / başqasının)
6. Mesajlaşma (siyahı + söhbət)
7. Sevimlilər / saxlanılan axtarışlar
8. Bildirişlər
9. Cüzdan & ödəniş
10. Ayarlar
11. Dəstək (FAQ, çat)

### 9.3. Dizayn artefaktları
- Figma fayl: səhifələr — Foundations / Components / Web / iOS / Android / Admin.
- Storybook: hər kompoenetin canlı dokumentasiyası.
- Visual regression: Chromatic / Percy.

---

## 10. MOBİL TƏTBİQLƏR

### 10.1. Dəstəklənən platformalar
- **iOS** ≥ 15.0
- **Android** API ≥ 24 (Android 7.0)

### 10.2. Xüsusi mobil funksiyalar
- Kameradan birbaşa elan yerləşdirmə (1 toxunuşda).
- AR ölçü götürmə (mebel, otaq) **[MAY]**.
- Geofencing — yeni elan radiusda push.
- Barkod skan (kitab, elektronika).
- Bluetooth/AirDrop ilə paylaşma.

### 10.3. Mağaza dərc
- App Store (Apple Developer Program).
- Google Play Console.
- AppGallery (Huawei) **[MAY]**.

---

## 11. ADMİN VƏ MODERASİYA PANELİ

### 11.1. Funksionallıq
- İstifadəçi axtarışı, baxış, bloklama (səbəb + müddət).
- Elan moderasiyası queue (AI-flag prioritetli).
- Şikayətlər (kateqoriyalı, SLA göstəricisi).
- Kateqoriya, atribut sxemi redaktoru (versiyalama ilə).
- Banner və promo kampaniyalar.
- Statik səhifələr (CMS — Razılaşma, Məxfilik və s.).
- Mali hesabatlar, refund, payout.
- Kupon/promo kod menecmenti.
- Audit log (kim/nə/nə zaman dəyişdi).
- A/B test idarəetməsi (feature flag).

### 11.2. Texnologiya
- **Refine.dev** + Ant Design Pro şablonu (sürətlə inkişaf).
- RBAC, hər səhifə üçün icazə yoxlaması.

---

## 12. MONETİZASİYA MODELİ

| Gəlir mənbəyi | Təsvir | Qiymətləndirmə |
|---|---|---|
| **Pulsuz limit ötmə** | Ay başına 3+ elan | 1–3 AZN/elan |
| **VIP / Top** | Vitrin + üst sıralama | 5–25 AZN |
| **Boost** | Yenilənmə | 0.5–2 AZN |
| **Premium kateqoriya elanı** | Avto, əmlak | 15–50 AZN |
| **Pro Mağaza abunəlik** | Aylıq | 50–500 AZN |
| **API access** | Toplu yükləmə | sazişlə |
| **Escrow komissiya** | Əqd dəyəri | 3–5% |
| **Reklam (banner)** | CPM/CPC | bazar qiyməti |
| **Çatdırılma marjası** | Logistika | 5–10% |

---

## 13. İNTEQRASİYALAR

### 13.1. Ödəniş
- **Pulpal**, **Epoint**, **Hipolink**, **Visa/Master 3DS**.
- **Apple Pay**, **Google Pay**.
- Kart saxlanması — PCI DSS uyğun token (provider tərəfində).

### 13.2. Logistika
- **Azerpoct**, **Bravo Express**, **Pasha Logistics**.

### 13.3. SMS / E-poçt
- SMS: Atlas, Azercell SMS API, Twilio (yedək).
- E-poçt: SendGrid / Postmark + öz SMTP.

### 13.4. Xəritə
- MapLibre + OSM, Yandex Maps tile (lokallıq), Google Geocoding.

### 13.5. Analitika
- GA4, Yandex Metrika, AppsFlyer, Mixpanel (öz event modeli).

### 13.6. AI / ML
- OpenAI / Anthropic API — mətn moderasiya, başlıq təklifi.
- AWS Rekognition / Google Vision — şəkil moderasiya.
- Öz embedding (PostgreSQL pgvector) — oxşar elan.

### 13.7. Hökumət
- **ASAN İmza** (e-imza identifikasiyası).
- **Vergilər.gov.az** — VÖEN doğrulama.
- **Mərkəzi Bankın Kredit Reyestri** **[MAY]**.

---

## 14. TƏHLÜKƏSİZLİK

### 14.1. Standartlar
- **OWASP ASVS L2**, **OWASP Top 10** uyğunluğu.
- **PCI DSS** (ödənişlər üçün scope-da).
- **GDPR / Azərbaycan KMQ** uyğunluğu.

### 14.2. Tədbirlər
- TLS 1.3, HSTS, CSP, SRI.
- Argon2id parol hash, refresh token rotation.
- Rate-limit, captcha (hCaptcha / Cloudflare Turnstile).
- DDoS qoruma — Cloudflare.
- WAF — OWASP CRS qaydaları.
- Input validation (server tərəf hər zaman).
- SQL injection, XSS, SSRF, IDOR testləri.
- Şifrələnmiş PII (at rest) — KMS.
- Audit log immutability.
- Penetration test (illik).
- Bug bounty proqramı **[SHOULD]**.

### 14.3. Anti-fraud
- Cihaz fingerprint (FingerprintJS).
- Davranış analitikası (sürətli yerləşdirmə, IP rotasiya).
- ML modeli ilə risk skor.
- Manuel review queue (yüksək risk).

---

## 15. SEO VƏ MARKETİNQ

### 15.1. Texniki SEO
- SSR (Next.js RSC), JSON-LD strukturlu data (`Product`, `Offer`, `LocalBusiness`).
- Səmərəli `sitemap.xml` (parçalanmış), `robots.txt`.
- Canonical, hreflang (az/ru/en).
- Open Graph, Twitter Card.
- Səhifə sürəti — Core Web Vitals (LCP/CLS/INP).

### 15.2. URL strukturu
```
/{lang}/{category}/{subcategory}/{city}/{listing-slug}-{id}
məs: /az/dasinmaz-emlak/menzil-satilir/baki/tezekend-3-otaqli-100kvm-12345
```

### 15.3. Marketinq
- Programmatic Performance Marketing (Google, Meta, TikTok, Yandex).
- Influencer (mikro / lokal).
- ASO (App Store Optimization).
- Referral proqramı (dostu dəvət et — bonus).

---

## 16. LOKALİZASİYA

- Dilləri: **AZ (default), RU, EN**.
- ICU MessageFormat (cəm, cins, tarix).
- Tarix/zaman: ICU + `date-fns-tz`, `Asia/Baku`.
- Valyuta: AZN əsas, USD/EUR konversiya (real vaxt — Mərkəzi Bank XML).
- Tərcümə menecmenti: Crowdin / Lokalise.

---

## 17. HÜQUQİ TƏLƏBLƏR

- "Elektron kommersiya haqqında" AR Qanunu.
- "Şəxsi məlumatların qorunması haqqında" AR Qanunu.
- Vergilər (sahibkar profillər üçün VÖEN, e-Qaimə inteqrasiyası **[SHOULD]**).
- Cookie banner (CMP).
- İstifadəçi razılaşması, məxfilik siyasəti, oferta.
- Yaş məhdudiyyəti (≥ 18 və ya valideyn icazəsi).
- Qadağan olunmuş malların siyahısı (silah, narkotiklər, döyüş heyvanları və s.).

---

## 18. TEST STRATEGİYASI

### 18.1. Növlər və əhatə
| Növ | Alət | Hədəf əhatə |
|---|---|---|
| Unit | Vitest / Jest | ≥ 80% |
| Integration | Vitest + Testcontainers | ≥ 70% |
| Contract | Pact | API uyğunluğu |
| E2E web | Playwright | əsas axın |
| E2E mobil | Detox / Maestro | əsas axın |
| Yük | k6 | RPS hədəfləri |
| Təhlükəsizlik | OWASP ZAP, Snyk, Trivy | hər PR |
| Visual | Chromatic / Percy | UI komponentlər |
| Accessibility | axe-core, Lighthouse CI | WCAG AA |

### 18.2. Test mühitləri
- `dev`, `staging`, `pre-prod`, `prod`.
- Anonim canlı verilənlər (PII maskalama) — yalnız staging-də.

---

## 19. DEVOPS VƏ İNFRASTRUKTUR

### 19.1. Mühitlər
- **Dev**: developer-lər üçün hər biri ayrıca.
- **Staging**: integration testlər.
- **Pre-prod**: prod ilə eyni konfiq, sintetik trafik.
- **Prod**: çoxlu AZ, blue-green / canary deploy.

### 19.2. CI/CD pipeline
1. PR açılır → lint, type-check, unit test, security scan.
2. Merge `main` → integration test, build, push image.
3. ArgoCD auto-sync → staging.
4. Manual approval → canary (%5) → prod (%100).

### 19.3. Müşahidə (Observability)
- **Loglar** — structured JSON, correlation ID.
- **Metriklər** — RED / USE.
- **Tracing** — hər sorğu üçün span tree.
- **Alert** — PagerDuty / OpsGenie, SLO əsaslı.

### 19.4. Backup & DR
- PostgreSQL: WAL streaming + gündəlik snapshot, 30 gün.
- S3: cross-region replication.
- Disaster Recovery məşqi — kvartal.

---

## 20. LAYİHƏ FAZALARI VƏ MÜDDƏTLƏR

### Faza 0 — Discovery (3 həftə)
- İstifadəçi müsahibələri, rəqib audit, məhsul vizyonu, KPI razılaşması, dizayn sistem skeleti.

### Faza 1 — MVP (16 həftə)
- Auth, profil, kateqoriya, elan CRUD, axtarış (əsas), media, çat, bildiriş, ödənişli promotion (1 paket), web + Android + iOS əsas axın, admin panel skeleti, moderasiya.

### Faza 2 — Genişlənmə (10 həftə)
- AI moderasiya, escrow, logistika, Pro Mağaza, gelişmiş axtarış (xəritə, saxlanılan), reklam slotları, A/B test infrastrukturu.

### Faza 3 — Optimallaşdırma (8 həftə)
- Performans, SEO, ASO, retention kampaniyaları, ML qiymət təklifi, oxşar elan tövsiyəsi (vector search).

### Faza 4 — Davamlı (ongoing)
- Yeni vertikallar, beynəlxalq genişlənmə (Gürcüstan, Türkiyə pilot).

**Cəmi MVP-ə qədər: ~9 ay** (paralel iş, 3 axın).

---

## 21. KOMANDA VƏ ROLLAR

| Rol | Sayı (MVP) | Sayı (Pik) |
|---|---|---|
| Product Manager | 1 | 2 |
| Product Designer (UX/UI) | 2 | 3 |
| Tech Lead | 1 | 1 |
| Backend Engineer | 4 | 8 |
| Frontend Engineer (Web) | 3 | 5 |
| Mobile Engineer (RN) | 3 | 4 |
| QA Engineer (manuel + auto) | 2 | 4 |
| DevOps / SRE | 1 | 2 |
| Data Engineer | 1 | 2 |
| ML Engineer | 1 | 2 |
| Security Engineer | 0.5 | 1 |
| Project Manager / Scrum | 1 | 2 |
| Customer Support Lead | 1 | 3 |
| **Cəmi** | **~21** | **~39** |

Metodologiya: **Scrum, 2 həftəlik sprint**, kvartal OKR-lər.

---

## 22. RİSKLƏR VƏ AZALDILMA PLANI

| Risk | Ehtimal | Təsir | Azaldılma |
|---|---|---|---|
| Lokal rəqibin (Tap.az) müdafiə reaksiyası | Y | Y | Aqressiv USP, mobile UX, performance liderliyi |
| Saxta elanlar / fraud | Y | Y | AI + manuel moderasiya, verifikasiya, escrow |
| Ödəniş provayder problemləri | O | Y | 2+ provayder, fallback rotation |
| Aşağı mobil internet sürəti (regionlar) | O | O | Aggressive caching, offline mode, image lazy |
| Tənzimləyici dəyişiklik (KMQ, vergi) | O | O | Hüquqi danışıqlıq, modullu compliance layer |
| Açıq mənbəli infra dəyişikliklərı | A | O | Vendor-locked alternativlər, abstraction layer |
| İstedad çatışmazlığı | O | Y | Remote-first, regional toplama, hibrid komanda |

---

## 23. QƏBUL MEYARLARI

MVP qəbul üçün:
- [ ] Bütün **MUST** tələblər icra olunub və QA tərəfindən təsdiq edilib.
- [ ] Test əhatə dairəsi: Backend ≥ 80%, Web ≥ 70%, Mobile ≥ 60%.
- [ ] Performance testləri keçilib (5.1 bölmə hədəfləri).
- [ ] Security audit (xarici penetration test) — kritik və yüksək risk yoxdur.
- [ ] WCAG 2.1 AA — Lighthouse Accessibility ≥ 95.
- [ ] App Store və Google Play-də dərc olunub.
- [ ] Admin panel istifadəyə hazırdır (RBAC + audit log).
- [ ] Hüquqi sənədlər (oferta, məxfilik, KMQ) dərc edilib.
- [ ] Müşahidə pano (Grafana) və alert qaydaları aktivdir.
- [ ] Disaster Recovery məşqi keçirilib və sənədləşdirilib.

---

## 24. LÜĞƏT

- **MVP** — Minimum Viable Product, minimum həyat qabiliyyətli məhsul.
- **GMV** — Gross Merchandise Value, ümumi əqd həcmi.
- **CTR** — Click-Through Rate.
- **DAU/MAU** — Daily/Monthly Active Users.
- **D7 retention** — qeydiyyatdan 7 gün sonra geri qayıtma faizi.
- **NPS** — Net Promoter Score.
- **RPO/RTO** — Recovery Point / Time Objective.
- **PII** — Personally Identifiable Information.
- **RBAC** — Role-Based Access Control.
- **C2C / B2C / B2B** — istifadəçi tipləri.
- **CDN** — Content Delivery Network.
- **CSP** — Content Security Policy.

---

## EK A — REFERENS LİNKLƏR (DAXİLİ)

- Figma layihəsi: *[link əlavə ediləcək]*
- API OpenAPI: `/openapi.yaml`
- Storybook: `/storybook`
- Texniki Wiki: Confluence space `AVITO-AZ`
- Layihə idarəetmə: Jira project `AVZ`
- Repo: `github.com/<org>/avito-az` (monorepo, Nx)

---

**Sənədin sonu.**
*Bu TT canlı sənəddir və hər sprint sonu PM/Tech Lead tərəfindən yenilənir.*
