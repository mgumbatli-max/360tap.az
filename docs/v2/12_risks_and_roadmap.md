# 12 — Risklər və Roadmap

---

## 1. Əsas risklər və azaltma

| # | Risk | Təsir | Azaltma |
|---|------|-------|---------|
| R1 | **İki backend miqrasiyası** canlı frontend-i qırır | Yüksək | Express paralel saxla; endpoint-bə-endpoint NestJS-ə keçir; frontend proxy mərhələli; smoke test hər keçiddə |
| R2 | **ERP kontraktı greenfield** — ERP tərəf fərqli reallaşdırır | Yüksək | Versiyalı `/erp/v1`, idempotent, DTO validation; ERP komandası ilə erkən razılaşma (bax `08` §10) |
| R3 | **Region data keyfiyyəti** (GPS, nearby) yoxdur | Region-first işləməz | Seed prioritet (Faza 0); haversine + admin override; data mənbəyi təsdiqlə |
| R4 | **Scope dağılması** (140 komponent) | Gecikmə | MVP-də sərt kəsim; gimmick → Lab; MoSCoW (bax `03`) |
| R5 | **Search keyfiyyəti** (translit/sinonim) | Aşağı tapılma | Meilisearch + lüğət; "tapılmayan axtarış" monitorinqi; iterativ təkmilləşmə |
| R6 | **Şəkil etibarı** (ERP CDN silinə bilər) | Pozuq elanlar | S3-ə mirror (Faza-2); MVP-də URL saxla + monitor |
| R7 | **Ödəniş gateway** yoxdur | Gəlir gecikir | MVP-də manual/stub; gateway Faza-2 |
| R8 | **React 19 RC** stabillik | Build/runtime | Stabil release-ə keçidi izlə; kritik komponentləri test et |
| R9 | **Performance** (region landing sayı çox) | Yavaş | ISR + Redis cache + denormalized sayğaclar |
| R10 | **Moderasiya yükü** (spam) | Keyfiyyət | Avtomatik siqnallar (dublikat/spam/telefon), ERP/verified avtomatik yayım |

---

## 2. Texniki asılılıqlar (sıra)

```
Faza 0: Postgres+Prisma genişləndir → Redis → Meilisearch → S3 → BullMQ → docker-compose
        → Region/District/nearby seed → auth tamamla → frontend proxy keçidi
Faza 1: Listing/category/detail/elan-əlavə → region-first → search → mağaza profili
        → dynamic attributes → ERP publish+stock → admin core + moderasiya → SEO landing
Faza 2: chat+bildiriş → saved search → reytinq → monetizasiya v1 → mağaza/ERP panel tam
Faza 3: reklam kabineti → xəritə axtarış → import/feed → mobile app → AI dəyər funksiyaları
```

---

## 3. Backend miqrasiya planı (Express → NestJS)

| Addım | İş |
|-------|----|
| M1 | NestJS Prisma schema-nı `04`-ə görə genişləndir; migration yarat |
| M2 | Region/District/Category/Brand seed (Express `002_seed.sql` + transport-data.ts-dən) |
| M3 | listings + categories + geo endpoint-lərini NestJS-də tamamla; frontend `/api/listings` → yeni porta |
| M4 | favorites, search NestJS-ə; Meilisearch index |
| M5 | stores, ERP gateway |
| M6 | chat/messages → conversations (socket.io NestJS gateway); reviews; reports |
| M7 | payments/promotions; admin |
| M8 | Express söndür; köhnə DB-dən data köçürmə skripti (lazımsa) |

> Hər addımda canlı frontend işlək qalır (paralel iş + proxy split).

---

## 4. Sprint roadmap (təxmini)

| Sprint | Fokus | Nəticə |
|--------|-------|--------|
| S1 | Faza 0 infrastruktur + schema + seed | dev mühit, region data |
| S2 | Auth + listing CRUD + detail + elan-əlavə (dynamic forma) | əsas elan axını |
| S3 | Region-first + search (Meilisearch) + filterlər | region UX |
| S4 | Mağaza profili + dynamic attributes + admin core | mağaza + idarə |
| S5 | ERP publish + stock/price sync + ERP badge | ERP MVP |
| S6 | Moderasiya + SEO landing + Lab gizlət + polish | MVP buraxılış |
| S7+ | Faza 2 (chat, bildiriş, reytinq, monetizasiya) | genişlənmə |

> Sprint uzunluğu və komanda ölçüsünə görə tarixlər dəqiqləşdirilir.

---

## 5. Növbəti addımlar (bu sənədlərdən sonra)

1. Bu dəsti nəzərdən keçir/təsdiqlə.
2. Region+rayon+GPS data mənbəyini təsdiqlə (R3).
3. ERP komandası ilə kontrakt razılaşması (R2).
4. Faza 0 üçün ayrıca **implementation plan** (writing-plans) — schema migration + infrastruktur.
5. Dizayn sistemi (shadcn + tokenlər) qurulması.
