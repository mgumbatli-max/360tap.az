# 360tap.az — Arxitektura və Məhsul Sənədləri (v2)

> **Status:** Plan / arxitektura mərhələsi (kod yazılmamışdan əvvəl)
> **Tarix:** 2026-06-10
> **Müəllif rolu:** Senior Product Architect · Marketplace UX/UI · ERP Integration Architect · Senior Full-Stack Engineer

---

## 1. Vizyon

**360tap.az** sadəcə elan saytı deyil. Bu, **360biznes.az ERP** ilə bağlı **region-first regional commerce ekosistemidir**.

> *"Azərbaycanda hər şeyi öz regionunda tap."*

İki əsas fərqləndirici (moat):

1. **Region-first** — istifadəçi əvvəlcə öz şəhərini/rayonunu seçir; bütün sayt (ana səhifə, kateqoriyalar, axtarış, SEO) həmin regiona uyğunlaşır. Nəticə azdırsa, **yaxın rayonlar** təklif olunur.
2. **ERP-connected real stok** — 360biznes ERP olan mağaza məhsulunu **1 kliklə** ("360tap.az-da yayımla") real stok, qiymət, şəkil və filial məlumatı ilə marketplace-ə çıxarır. Stok/qiymət dəyişəndə avtomatik sinxronlaşır.

Hədəf: **Tap.az + Turbo.az + Bina.az + Boss.az/Jobsearch + Avito.ru** məntiqini bir platformada birləşdirmək və Bakı-mərkəzli elan bazarını regionlara yaymaq.

---

## 2. Təsdiqlənmiş əsas qərarlar

| # | Qərar | Seçim | Səbəb |
|---|-------|-------|-------|
| 1 | **Backend** | **NestJS + Prisma** (mövcud `api/`-ni genişləndir, Express-i miqrasiya edib təqaüdə göndər) | Modul-əsaslı, ERP sync/queue/scale üçün uyğun, Prisma ORM |
| 2 | **ERP inteqrasiyası** | **Kontraktı sıfırdan dizayn et** (API + webhook müqaviləsi) | ERP-də açıq API hələ yoxdur; idempotent, versiyalı kontrakt |
| 3 | **MVP miqyası** | **Fokuslu nüvə** + region + ERP; gimmickləri (LiveBidding, GroupBuy, Stories, XP, AI gimmick) Lab/dev rejimə və ya sonrakı fazaya | Fokus, sürət, real biznes dəyəri |
| 4 | **Sənədlər** | **`docs/v2/`** yeni konsolidə dəst | Köhnə `docs/` (22 fayl) arxiv qalır, yenisi əsas mənbə |

---

## 3. Texnologiya stack

| Qat | Texnologiya |
|-----|-------------|
| Frontend | Next.js 15 (App Router, SSR/ISR), React, TypeScript, Tailwind, shadcn/ui |
| Backend | NestJS (modul-əsaslı), TypeScript |
| Verilənlər bazası | PostgreSQL 16 + Prisma ORM |
| Keş | Redis |
| Axtarış | Meilisearch (typo-tolerance, transliterasiya, sinonim) + pg_trgm fallback |
| Növbə / fon işləri | BullMQ (Redis əsaslı) |
| Media | S3-uyğun storage (MinIO/Backblaze/Cloudflare R2) + image optimization |
| Real-time | Socket.io (chat, bildirişlər) |
| İnfrastruktur | Vercel (frontend), konteyner backend, Cloudflare CDN |

---

## 4. Sənəd dəsti (oxuma ardıcıllığı)

| Fayl | Məzmun |
|------|--------|
| [`00_README.md`](./00_README.md) | Bu fayl — indeks, vizyon, qərarlar, terminologiya |
| [`01_current_state_and_gaps.md`](./01_current_state_and_gaps.md) | Mövcud kod analizi + UI/UX zəiflik və düzəliş siyahısı |
| [`02_PRD.md`](./02_PRD.md) | Product Requirements Document — personalar, vertikallar, funksional tələblər |
| [`03_mvp_and_phasing.md`](./03_mvp_and_phasing.md) | MVP / Faza-2 / Faza-3 ayrımı |
| [`04_database_schema.md`](./04_database_schema.md) | Tam Prisma data modeli (33+ entity), ER əlaqələr, indekslər |
| [`05_api_design.md`](./05_api_design.md) | REST endpoint planı, DTO, auth, error model, versiyalama |
| [`06_frontend_architecture.md`](./06_frontend_architecture.md) | Page/komponent strukturu, mobile-first, dizayn sistemi |
| [`07_region_first_and_search.md`](./07_region_first_and_search.md) | Region model, nearby logic, Meilisearch, SEO arxitekturası |
| [`08_erp_integration.md`](./08_erp_integration.md) | ERP export/sync kontraktı, webhook-lar, idempotency, ERP panel |
| [`09_dynamic_attributes.md`](./09_dynamic_attributes.md) | Dynamic category attribute + filter builder sistemi |
| [`10_panels_requirements.md`](./10_panels_requirements.md) | Admin / Mağaza / İstifadəçi / Public — ayrı requirements |
| [`11_monetization.md`](./11_monetization.md) | Paketlər, promosiyalar, banner, ERP paketi |
| [`12_risks_and_roadmap.md`](./12_risks_and_roadmap.md) | Risklər, asılılıqlar, sprint roadmap |

---

## 5. Terminologiya (canonical lüğət)

Bütün sənədlərdə və kodda **eyni adlar** istifadə olunur — ziddiyyət olmaması üçün.

| Termin | İzah |
|--------|------|
| **Listing** | Elan (universal — bütün vertikallar) |
| **Vertical** | Elan şaquli sahəsi: `transport`, `realestate`, `job`, `universal` |
| **Store** | Mağaza (biznes satıcı profili) |
| **ErpStore** | ERP ilə bağlı mağaza (`Store.source = 'erp'`) |
| **Region** | İnzibati region (Bakı, Qəbələ-rayon və s.) |
| **District** | Rayon/qəsəbə (region daxilində) |
| **NearbyDistrict** | İki rayon arası yaxınlıq əlaqəsi (proximity) |
| **CategoryAttribute** | Kateqoriyaya bağlı dinamik atribut tərifi |
| **AttributeValue** | Elanın konkret atribut dəyəri (JSONB və ya cədvəl) |
| **ErpProductLink** | ERP məhsulu ↔ Listing əlaqəsi (`external_id`) |
| **Promotion** | Pulsuz/pullu önə çıxarma (VIP, Premium, boost) |
| **source** | Elanın/mağazanın mənbəyi: `manual` və ya `erp` |

---

## 6. Bu sənədlərin oxunması

- Texniki olmayanlar üçün: `02_PRD.md` + `03_mvp_and_phasing.md`
- Backend developer üçün: `04_database_schema.md` → `05_api_design.md` → `08_erp_integration.md` → `09_dynamic_attributes.md`
- Frontend developer üçün: `06_frontend_architecture.md` → `07_region_first_and_search.md` → `10_panels_requirements.md`
- Layihə meneceri üçün: `03_mvp_and_phasing.md` → `12_risks_and_roadmap.md` → `11_monetization.md`
