# 08 — Sprint Plan

## Sprint qaydaları
- **Müddət:** 2 həftə
- **Hadisələr:** Planning (Mon W1) · Daily standup (15 dəq) · Refinement (Wed W1) · Review (Fri W2) · Retro (Fri W2)
- **Definition of Done:** kod review-dən keçib + testlər + staging-də QA-dan keçib + sənədə əlavə olunub
- **Velocity hədəfi:** 60-80 SP / sprint (10 nəfərlik komanda)

---

## Faza 1 — MVP (Sprint 1-10, 20 həftə)

### Sprint 0 — Hazırlıq (1 həftə, kick-off)
**Məqsəd:** İnfrastruktur və skeleton.

- [ ] Repo (monorepo Turborepo + pnpm)
- [ ] CI/CD GitHub Actions skeleton
- [ ] Docker Compose: Postgres, Redis, Meilisearch, MinIO
- [ ] Skeleton apps: `web`, `admin`, `api`, `mobile-pwa`
- [ ] Linter, formatter, husky
- [ ] Sentry, Posthog accounts
- [ ] Figma dizayn sistem skeleton

**Deliverable:** "Hello world" hər app-dən, CI sıfır tələblə yaşıl.

---

### Sprint 1 — Auth + User
- [ ] Prisma schema: User, Profile, City
- [ ] NestJS Auth modulu (register, login, refresh)
- [ ] OTP göndərmə (mock SMS provayder)
- [ ] Google OAuth
- [ ] NextAuth web inteqrasiyası
- [ ] Frontend: /giris, /qeydiyyat, /sifre-unutdum
- [ ] Layout shell (Header, Footer, theme)
- [ ] Storybook bootstrap (Button, Input, Card)

**SP:** ~70

---

### Sprint 2 — Catalog + Cities
- [ ] Prisma: Category, CategoryAttribute, District
- [ ] Seed: 15 əsas + ~80 alt-kateqoriya, 12 şəhər
- [ ] Atribut sxemi: Avto, Telefon, Mənzil, İş, Xidmət
- [ ] API: /categories, /cities
- [ ] Frontend: Header navigation, mobile category drawer
- [ ] CategoryGrid komponenti
- [ ] Ana səhifə kateqoriya bloku
- [ ] Routing /k/[category], /seher/[city]

**SP:** ~65

---

### Sprint 3 — Listing core (CRUD)
- [ ] Prisma: Listing, ListingImage, ListingStatusLog
- [ ] API: POST/PATCH/GET/DELETE /listings
- [ ] Wizard 8-addımlı UI (Zustand store)
- [ ] S3 upload, imgproxy, presigned URL
- [ ] Şəkil sıxma (web worker tərəfində)
- [ ] Frontend: /elan-yerlesdir/* səhifələri
- [ ] /elanlar, /elanlar/[id]
- [ ] ListingCard, ListingGallery

**SP:** ~80

---

### Sprint 4 — Search + Filter
- [ ] Meilisearch konfiqurasiyası
- [ ] Indexer worker (BullMQ)
- [ ] API: /search, /search/suggestions
- [ ] FilterPanel (kateqoriya, qiymət, şəhər, vəziyyət)
- [ ] Sıralama, pagination (cursor)
- [ ] URL state senzronlaşma (next-url)
- [ ] Mobil filter drawer

**SP:** ~70

---

### Sprint 5 — Favorites + Personal Cabinet
- [ ] Prisma: Favorite, SavedSearch (skeleton)
- [ ] API: /favorites, /listings/me/list
- [ ] /kabinet layout + sidebar
- [ ] /kabinet/elanlarim (status tabs)
- [ ] /kabinet/secilmisler
- [ ] /kabinet/ayarlar/profil
- [ ] Avatar upload

**SP:** ~60

---

### Sprint 6 — Chat + Notifications
- [ ] Prisma: Chat, Message, Notification
- [ ] NestJS Socket.io gateway
- [ ] API + WS event-lər
- [ ] /kabinet/mesajlar — list + window
- [ ] In-app notifications drawer
- [ ] Email göndərmə (Postmark) — yeni mesaj, elan təsdiq
- [ ] Bildiriş tərcihləri

**SP:** ~80

---

### Sprint 7 — Moderation + Admin (basic)
- [ ] Prisma: ModerationTask, AdminLog
- [ ] Admin app skeleton (Next.js + Refine)
- [ ] /admin login + 2FA (TOTP)
- [ ] /admin/dashboard (5 KPI)
- [ ] /admin/listings/moderasiya (queue + decide)
- [ ] /admin/users (suspend, ban)
- [ ] /admin/sikayetler (resolve)
- [ ] Audit log middleware (NestJS interceptor)

**SP:** ~85

---

### Sprint 8 — Payment + Promotion (sadə)
- [ ] Prisma: Payment, WalletTransaction, PremiumService
- [ ] Pulpal sandbox inteqrasiyası
- [ ] Webhook handler
- [ ] Listing "Yuxarı qaldır" əməliyyatı
- [ ] Promotion paketləri seed (3 əsas)
- [ ] /kabinet/odenisler

**SP:** ~70

---

### Sprint 9 — SEO + PWA + polish
- [ ] sitemap.xml, robots.txt
- [ ] JSON-LD: Product, BreadcrumbList, Organization
- [ ] Şəhər × kateqoriya landing səhifələri
- [ ] manifest.webmanifest, service worker
- [ ] Lighthouse target ≥ 95 SEO
- [ ] Tərcümə skeleton (next-intl)
- [ ] Email şablonları gözəlləşdirmə

**SP:** ~60

---

### Sprint 10 — QA, Hardening, Launch
- [ ] Penetration test (3-cü tərəf)
- [ ] Yük testi (k6, 1K paralel istifadəçi)
- [ ] Bug fix sprint
- [ ] Hüquqi sənədlər final
- [ ] Production deploy (canary)
- [ ] Soft launch — 500 istifadəçi
- [ ] Monitoring dashboard final

**SP:** ~70 (yarısı bug fix)

---

## Faza 2 — Genişlənmə (Sprint 11-16, 12 həftə)

### Sprint 11 — Mağaza profili
- Prisma: Shop, ShopMember, ShopFollower
- /magaza/[slug] səhifələri
- /magaza-kabineti skeleton
- Mağaza yaratma + verifikasiya prosesi

### Sprint 12 — Biznes kabineti
- Toplu yükləmə (CSV/Excel parser)
- Bulk import worker (BullMQ progress)
- Mağaza statistikası dashboard

### Sprint 13 — Reytinq + Rəy + Şikayət
- Prisma: Review, Complaint
- Rəy yazma (yalnız əqd sonra)
- Şikayət sistemi UI
- Saxta rəy aşkarlama (basic heuristic)

### Sprint 14 — AI moderasiya + smart features
- OpenAI/Anthropic mətn moderasiya
- AWS Rekognition / Vision şəkil moderasiya
- Auto-approve threshold
- Başlıq təklifi (AI generated)
- Qiymət təklifi (median bazar)

### Sprint 15 — Premium paketləri + reklam kabineti
- VIP / Boost / Top / Highlight ayrı-ayrı
- /kabinet/balans (cüzdan)
- /reklamlar — kampaniya yarat
- Banner CMS (admin)

### Sprint 16 — Push bildiriş + saved search
- FCM (Android web push)
- APNs (iOS PWA push)
- Saved search → daily/weekly digest
- Qiymət dəyişiklik bildirişi

---

## Faza 3 — Marketplace genişlənmə (Sprint 17-22, 12 həftə)

### Sprint 17-18 — Çatdırılma
- Azerpoct API inteqrasiyası
- Bravo Express
- Kuryer sifarişi UX
- Trekinq

### Sprint 19-20 — Escrow Pay
- Təhlükəsiz ödəniş axını
- Mübahisə paneli (admin)
- Refund mexanizmi
- KYC tələb (yüksək məbləğ)

### Sprint 21 — API + İnteqrasiyalar
- Public API (rate-limit, key)
- API sənədi (Swagger)
- Webhooks (yeni elan, satış)
- Zapier connector

### Sprint 22 — AI ağıllı axtarış + tövsiyə
- Vector embeddings (pgvector)
- Semantik axtarış
- "Sizə uyğun" tövsiyə
- Chat avtomatik cavab köməkçisi

---

## Faza 4 — Beynəlxalqlaşma (Sprint 23-28)

### Sprint 23-24 — Multi-language
- next-intl tam tərcümə
- AZ, RU, EN
- URL prefix `/az`, `/ru`, `/en`
- Crowdin workflow

### Sprint 25-26 — Multi-currency
- Mərkəzi Bankın XML feed
- Konversiya mərkəzi servis
- Hər səhifədə switch

### Sprint 27-28 — Mobil tətbiq (React Native)
- iOS + Android
- App Store + Google Play
- Push notification

---

## Velocity və SP təxmini cədvəli

| Sprint | Fokus | Hədəf SP | Risk |
|---|---|---|---|
| 0 | Setup | 30 | aşağı |
| 1 | Auth | 70 | orta |
| 2 | Catalog | 65 | aşağı |
| 3 | Listing | 80 | yüksək |
| 4 | Search | 70 | orta |
| 5 | Favorites/Cabinet | 60 | aşağı |
| 6 | Chat | 80 | yüksək |
| 7 | Moderation/Admin | 85 | yüksək |
| 8 | Payment | 70 | yüksək |
| 9 | SEO/PWA | 60 | orta |
| 10 | QA/Launch | 70 | yüksək |

## Sprint review meyarları

Hər sprint sonu:
1. Demo (canlı staging-də)
2. Burndown chart yoxlanışı
3. Velocity hesablama
4. Texniki borc — sprint başına 10-15% ayrılması
5. Retro action items 2-3 ədəd
