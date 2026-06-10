# 03 — MVP və Fazalar

> Prinsip: **Fokuslu MVP** — region-first + ERP nüvəsi. Gimmickləri kəs/təxirə sal.

---

## Faza 0 — Təməl (infrastruktur, ~1 sprint)

- NestJS `api/` əsas backend kimi konfiqurasiya; Prisma schema genişlənməsi.
- Postgres + Redis + Meilisearch + S3 + BullMQ qoşulması (docker-compose dev).
- Region/City/District seed data (12+ region, rayonlar, GPS koordinatlar, nearby mapping).
- Auth tamamlama (access+refresh, RBAC), media upload (S3).
- Frontend proxy köhnə Express portundan yeni API-yə keçid.

---

## Faza 1 — MVP (əsas marketplace)

> "Real biznes üçün işləyən, region-first, ERP-ə hazır platforma."

### Public sayt
- [ ] **Ana səhifə** — hero (region-first mesaj), region blokları, "sənin regionunda yeni elanlar", kateqoriya grid.
- [ ] **Region selector** — modal (12 region + yaxınlıq + bütün AZ + xəritə), bütün sayta təsir.
- [ ] **Kateqoriya sistemi** — 3-səviyyəli ağac + dynamic attributes.
- [ ] **Listing səhifəsi** (grid) — region+kateqoriya filteri, sort, pagination/infinite scroll.
- [ ] **Detail səhifəsi** — qalereya, satıcı kartı, əlaqə (zəng/WhatsApp/mesaj), oxşar + yaxın region elanları, AZ field adları.
- [ ] **Elan əlavə etmə** — kateqoriya seç → dynamic forma → şəkil → region → yayımla.
- [ ] **Login/Register** (vahid axın).
- [ ] **Mağaza profili** (public `/store/<slug>`).
- [ ] **3 vertical əsas versiya:** Nəqliyyat, Əmlak, İş + Universal (Elektronika tam).
- [ ] **Search** (Meilisearch — typo, transliterasiya, region/kateqoriya tanıma).
- [ ] **Filterlər** (kateqoriya-spesifik, dynamic attribute əsaslı).
- [ ] **Favoritlər**, **WhatsApp və zəng** düymələri (klik track).

### Admin
- [ ] Admin panel — dashboard, elanlar, istifadəçilər, mağazalar, kateqoriyalar, **dynamic attributes + filter builder**, regionlar, **moderasiya**, şikayətlər.

### ERP (MVP nüvəsi)
- [ ] **ERP-dən məhsul export API** (publish endpoint, kontrakt v1).
- [ ] **Stok və qiymət sync** (webhook + idempotent upsert; stok=0 → deaktiv).
- [ ] ERP mağaza badge + "real stokda var" etiketi.

### Platforma
- [ ] **Dynamic category attributes** (admin-managed).
- [ ] **Basic SEO** səhifələri (region+kateqoriya landing, sitemap, meta).
- [ ] Lab/dev elementləri public-dən gizlət.

---

## Faza 2 — Genişlənmə

- Saytdaxili **chat** tam (socket.io) + bildirişlər (in-app/push).
- **Saved search + bildiriş**, qiymət düşəndə xəbər ver.
- **Reytinq/rəy** sistemi (satıcı + mağaza).
- **Yaxın rayon** UX tam (proximity təklifləri, "yaxın regionlarda da var").
- Vertical kartlar/filterlər **tam dərinlik** (Turbo/Bina/Boss səviyyəsi).
- **Monetizasiya v1:** Premium/VIP/boost, mağaza paketləri (ödəniş manual/stub → sonra gateway).
- Mağaza paneli **tam** (statistika, toplu, endirimlər).
- ERP panel geri-analytics (baxış/klik/favorit).
- Detail zənginləşməsi: qiymət tarixi, video/360, müqayisə.

---

## Faza 3 — Böyümə və fərqləndirmə

- **Reklam kabineti** (banner, region reklam), self-serve.
- **Xəritə axtarışı** (əmlak/region).
- **Toplu Excel/CSV import**, **API import**, **XML feed**.
- **Mobile app** (mövcud REST API üzərində).
- AI dəyər funksiyaları (real): qiymət tövsiyəsi, dublikat aşkar, fraud detection, AI elan generatoru.
- Avtosalon / əmlak agentliyi / işəgötürən **xüsusi paketlər**.
- Region landing SEO miqyaslama, çoxdilli tam.
- Lab funksiyalarından sübut olunanların məhsula çıxarılması.

---

## Faza prioritet matrisi (MoSCoW — MVP)

| Must | Should | Could | Won't (indi) |
|------|--------|-------|--------------|
| Region selector, listing/detail, elan əlavə, auth, search, favoritlər, mağaza profili, dynamic attributes, ERP publish+stock sync, moderasiya, admin core, basic SEO | Chat, bildiriş, reytinq, yaxın rayon UX, monetizasiya v1 | Video/360, qiymət tarixi, müqayisə, email digest | Native app, AI generator, XML feed, reklam kabineti, escrow, gamification |
