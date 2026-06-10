# 17 — Development Roadmap

## Roadmap (Q-bazlı, 24 ay)

```
Q1 2026         Q2 2026         Q3 2026         Q4 2026
─────────────  ─────────────  ─────────────  ─────────────
Sprint 0-4     Sprint 5-10    Sprint 11-16   Sprint 17-22
MVP CORE       MVP LAUNCH     EXPANSION      MARKETPLACE

Q1 2027         Q2 2027
─────────────  ─────────────
Sprint 23-26   Sprint 27-30
INTERNATIONAL  AI + SCALE
```

## Q1 2026 — Sprint 0-4 (12 həftə) — MVP Core

### Məqsəd
Texniki bazanı qurmaq, əsas axınları işə salmaq.

### Deliverables
- Monorepo (Turborepo + pnpm)
- Docker Compose dev environment
- CI/CD pipeline
- DB schema + Prisma migrations
- Auth + Users module
- Catalog (kateqoriya + atribut)
- Listings CRUD + Media (S3)
- Search (Meilisearch indexer)
- Web UI: ana səhifə, axtarış, elan detal
- Storybook + dizayn sistem

### Çıxış
- Internal alfa demo
- 20 employee test

### KPI
- 0 production traffic
- 100% auto-test bütün axınlar üçün

## Q2 2026 — Sprint 5-10 (12 həftə) — MVP Launch

### Məqsəd
Public launch hazırlığı, real ödəniş, real istifadəçilər.

### Deliverables
- Personal dashboard (mənim elanlarım, sevimlilər, mesajlar)
- Real-time chat (Socket.io)
- Notifications (in-app + email)
- Moderation queue + Admin panel basic
- Pulpal payment + 1 promotion paketi
- SEO infrastructure (sitemap, JSON-LD, landing pages)
- PWA (manifest, service worker)
- Penetration test
- Yük testi (k6)

### Çıxış
- **Sprint 8 sonu:** Soft launch (500 invite, 1 şəhər)
- **Sprint 10 sonu:** Public launch (bütün AZ)

### KPI
- 5 000 qeydiyyat
- 2 000 aktiv elan
- 500 ödəniş tranzaksiya
- LCP ≤ 2.5s P75
- Crash-free ≥ 99%

### Marketing launch
- Performance marketing: Google + Meta + Yandex (~50K AZN/ay)
- ASO hazırlığı (yalnız PWA, mobile RN Q4)
- Influencer (5-10 nano + mikro)
- PR (3 portal)

## Q3 2026 — Sprint 11-16 (12 həftə) — Expansion

### Məqsəd
Biznes monetizasiyası, mağazaların gəlməsi, AI integration başlanğıcı.

### Deliverables
- Mağaza profili + onboarding
- Biznes kabineti (statistika, lead, komanda)
- Toplu yükləmə (CSV/Excel)
- Reklam kabineti (banner, kampaniya)
- Tam premium kataloqu (VIP, Boost, Top, Highlight, Urgent)
- Subscription plans (Start, Business, Pro)
- Reytinq və rəylər
- Şikayət sistemi
- Push notification (web)
- AI moderasiya (mətn + şəkil)
- AI başlıq və qiymət təklifi
- Saxlanılan axtarış + bildiriş

### KPI
- 50 000 qeydiyyat
- 20 000 aktiv elan
- 200 mağaza
- 50 000 AZN aylıq gəlir
- D7 retention ≥ 30%

## Q4 2026 — Sprint 17-22 (12 həftə) — Marketplace

### Məqsəd
Tam marketplace funksionallığı: çatdırılma, escrow, mobil tətbiq.

### Deliverables
- Çatdırılma inteqrasiyası (Azerpoct, Bravo)
- Escrow Pay (təhlükəsiz ödəniş)
- Mübahisə paneli (admin)
- React Native mobil tətbiq (iOS + Android)
- Push notification (mobile)
- API (public, rate-limited)
- Webhooks (biznes üçün)
- AI smart search (vector pgvector)
- AI tövsiyə motoru ("Sizə uyğun")
- AI chat cavab köməkçisi

### KPI
- 200 000 qeydiyyat
- 80 000 aktiv elan
- 1 000 mağaza
- 250 000 AZN aylıq gəlir
- 50 000 mobil tətbiq quraşdırma
- ≥ 30% mobil tranzaksiya

## Q1 2027 — Sprint 23-26 (8 həftə) — Internationalization

### Məqsəd
Multi-language, multi-currency, ilk xarici bazara çıxış.

### Deliverables
- Tam tərcümə AZ/RU/EN (Crowdin)
- URL prefix /az, /ru, /en + hreflang
- Multi-currency (AZN/USD/EUR/RUB)
- Lokal ödəniş provayderlər
- Lokal şəhər datası
- Gürcüstan pilot (5 əsas şəhər)

### KPI
- 350 000 qeydiyyat (cəmi)
- 30 000 Gürcüstan istifadəçi (yeni)
- 350 000 AZN aylıq gəlir

## Q2 2027 — Sprint 27-30 (8 həftə) — AI + Scale

### Məqsəd
AI ilə diferensasiya, infra ölçəkləmə.

### Deliverables
- Mikroservislərə miqrasiya (Search, Chat, Notifications)
- Kafka event bus
- ElasticSearch (Meilisearch əvəzi)
- ClickHouse analitika
- AI pricing optimization (B2B)
- AI image search ("buna oxşar")
- AI fraud detection (real-time)
- Multi-tenant infra (B2B SaaS)
- White-label rejim

### KPI
- 500 000+ qeydiyyat
- 150 000 aktiv elan
- 500 000 AZN aylıq gəlir
- API public istifadəçi 50+

## Roadmap qrafiki (mətn-Gantt)

```
              Q1     Q2     Q3     Q4     Q1'27  Q2'27
              ─────  ─────  ─────  ─────  ─────  ─────
Auth          █████████
Users         █████████
Catalog       ██████
Listings      ████████████
Search        █████████
Media         ██████
Chat               ███████████
Notifications      ███████████
Moderation             ██████████████
Admin              ██████████████████
Payments               ████████████
Promotions             ████████████
Shops                       █████████
Business cab.               █████████
Bulk import                  ██████████
Ads                              ████████████████
Reviews                          ████████
Complaints                       ████████
AI moderation                       ██████████████
AI smart search                          █████████████
Push (web)                          ██████
Push (mobile)                                ██████
Mobile RN                                ███████████████
Delivery                                       ███████████
Escrow                                          ███████████
Multi-lang                                            ████████
Multi-currency                                            ████
Microservices                                                ██████
```

## Resurs planı

### Komanda inkişaf

| Sprint | PM | TL | BE | FE | Mob | QA | DevOps | Design | Total |
|---|---|---|---|---|---|---|---|---|---|
| 1-2 | 1 | 1 | 3 | 2 | 0 | 1 | 0.5 | 1 | 9.5 |
| 3-10 | 1 | 1 | 4 | 3 | 0 | 2 | 0.5 | 2 | 13.5 |
| 11-16 | 2 | 1 | 5 | 3 | 0 | 2 | 1 | 2 | 16 |
| 17-22 | 2 | 2 | 6 | 4 | 3 | 3 | 1 | 2 | 23 |
| 23-30 | 2 | 2 | 8 | 5 | 4 | 4 | 2 | 2 | 29 |

### Maliyyə (təxmini)

| Mərhələ | Komanda xərci | Infra | Marketing | Cəmi |
|---|---|---|---|---|
| Q1 2026 | 270K | 5K | 0 | 275K AZN |
| Q2 2026 | 405K | 15K | 150K | 570K AZN |
| Q3 2026 | 480K | 25K | 200K | 705K AZN |
| Q4 2026 | 690K | 50K | 250K | 990K AZN |
| Q1 2027 | 580K | 60K | 200K | 840K AZN |
| Q2 2027 | 870K | 80K | 250K | 1.2M AZN |
| **Cəmi 24 ay** | **3.3M** | **235K** | **1.05M** | **~4.6M AZN** |

### Gəlir proqnozu

| Mərhələ | Aylıq gəlir | Cəmi qazanc |
|---|---|---|
| Q2 2026 (launch) | 5K → 30K | 50K |
| Q3 2026 | 50K → 150K | 300K |
| Q4 2026 | 150K → 350K | 750K |
| Q1 2027 | 350K → 500K | 1.3M |
| Q2 2027 | 500K → 800K | 2.0M |
| **Cəmi** | — | **~4.4M AZN** |

**Break-even: ~Q2 2027** (24-ci ay).

## Müvəffəqiyyət göstəriciləri (KPI dashboard)

### Növbə (Acquisition)
- Yeni qeydiyyat / gün
- CAC (cost per acquisition)
- Trafik mənbələri (organic %, paid %, direct %)

### Aktivasiya (Activation)
- İlk elan yerləşdirmə nisbəti (D1, D7)
- İlk mesaj göndərmə nisbəti
- Time to first listing

### Saxlama (Retention)
- D1, D7, D30 retention
- Aylıq aktiv istifadəçi (MAU)
- Sticky factor (DAU/MAU)

### Gəlir (Revenue)
- ARPU (avg revenue per user)
- LTV (lifetime value)
- Aylıq gəlir (MRR)
- Konversiya: free → paid

### Tövsiyə (Referral)
- NPS
- Viral coefficient

### Sistem sağlamlığı
- Uptime
- LCP, INP, CLS
- API P99 latency
- Crash-free rate

## Risklər və mitigation

(Sənəd 19 — risklər və həll yolları görül)

## Quartal review

Hər quartalın sonu:
1. KPI vs hədəf (red/yellow/green)
2. Sprint velocity trend
3. Tech debt review (>15% qaldıqda fokus sprint)
4. Market analizi (rəqib hərəkətləri)
5. Roadmap re-prioritization (quartal ahead)
