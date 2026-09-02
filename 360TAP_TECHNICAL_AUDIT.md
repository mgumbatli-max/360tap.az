# 360TAP TECHNICAL AUDIT REPORT

**Tarix:** 2026-09-02
**Rejim:** READ-ONLY audit — heç bir kod dəyişilməyib, migration işlədilməyib, DB-yə yazılmayıb, deploy edilməyib.
**Əhatə:** `api/` (NestJS), `backend/` (legacy Express), `frontend/` (Next.js), `docs/`, `docs/v2/`, `render.yaml`, canlı mühit (360tap.az + tap360-api.onrender.com).
**Metodologiya:** 18 ölçü üzrə paralel kod auditi + adversarial verifikasiya + canlı smoke test + faktiki build/test icrası. Hər iddia fayl:sətir sübutu ilə verilib. Təsdiqlənə bilməyən hallar açıq şəkildə "təsdiqlənməyib" kimi qeyd olunub.

---

## 1. EXECUTIVE SUMMARY

360tap.az **texnoloji seçim baxımından düzgün, məhsul baxımından isə ~25-30% hazır** vəziyyətdədir. Stack (NestJS 10 + Prisma 5 + PostgreSQL + Next.js 15 App Router) hədəf üçün uyğundur və dəyişdirilməməlidir. Lakin platformanın **domen özəyi** — kateqoriya/atribut engine, atribut saxlama strategiyası, vertikal dərinlik və axtarış — ya yarımçıqdır, ya da bir-birinə zidd iki yanaşma arasında qalıb.

**Ən vacib nəticə:** Tapşırığın əsas tələbi — *"admin paneldən yeni kateqoriya/atribut əlavə edəndə developer çağırmağa ehtiyac qalmamalıdır"* — hazırda **texniki olaraq mümkün deyil**. `api/src/modules/categories/categories.controller.ts` cəmi 25 sətirdir və yalnız 3 GET endpoint-i var; bir dənə də POST/PATCH/DELETE yoxdur. Yeni filtr əlavə etmək üçün `api/prisma/seed/categories.ts` redaktə + seed + backend deploy, transport/əmlak üçün əlavə olaraq `frontend/lib/transport-data.ts` (138 sətir) və `realestate-data.ts` (221 sətir) redaktə + Vercel deploy tələb olunur.

**Canlı vəziyyət (2026-09-02, audit anında ölçülüb):**

| Yoxlama | Nəticə |
|---|---|
| `tap360-api.onrender.com/health` | **HTTP 000, 70s timeout** (2 ardıcıl cəhd) |
| `/api/v1/categories`, `/api/v1/listings`, `/api/v1/geo/regions`, `/api/docs` | **hamısı HTTP 000, 70s timeout** |
| `360tap.az/` | HTTP 200, **0 qiymət etiketi, 0 elan linki, 66 skeleton** — Vercel STALE keşindən |
| `360tap.az/elanlar` | HTTP 200, **cavab 120 saniyəyə də BİTMİR** (59 337 bayt shell göndərilir, 4 həll olunmamış Suspense placeholder, 0 elan) |
| `360tap.az/sitemap.xml` | HTTP 200, **853 bayt, cəmi 5 URL** |
| Təhlükəsizlik başlıqları | yalnız HSTS; CSP / X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy **yoxdur**; `x-powered-by: Next.js` açıqdır |

**Yəni marketplace faktiki olaraq hazırda heç bir elan göstərmir.** Backend cavab vermir, `/elanlar` səhifəsinin SSR streaming-i ölü backend-i gözləyərək heç vaxt tamamlanmır (server-side `fetch`-də timeout yoxdur), ana səhifə isə köhnə keşdən skeleton göstərir.

**Rəqəmlərlə mənzərə:**

| Göstərici | Dəyər |
|---|---|
| Prisma modelləri | 38 — bunlardan **17-si kodda heç vaxt istifadə olunmur** (%45 ölü) |
| Migration | 2 (schema ↔ migration **drift YOXDUR** — bu müsbətdir) |
| Frontend komponentləri | 147 — **≈75-i (51%) ölü və ya əlçatmaz**, 67-si heç bir səhifədən import olunmur |
| Sınıq endpoint çağırışı | **24 çağırış / 21 komponent** — frontend çağırır, NestJS-də yoxdur |
| Backend testləri | cəmi **12 test**, 8 suite — **1 suite düşür** (`listings.service.spec.ts`, Nest DI xətası) |
| Frontend TS xətası | **11** (hamısı `TS7006`, hamısı bir ölü faylda: `components/TransportFullFilter.tsx`) |
| API TS / ESLint | **0 xəta / 0 problem** |
| Ödəniş inteqrasiyası | **0** — `Payment/Package/Subscription/Promotion/Banner` yalnız sxemdə |
| Faktiki AZ/RU/EN dəstəyi | **≈0%** istifadəçi üçün (`LangToggle` heç bir yerdə render olunmur) |

**Yekun hökm (təfsilat 21-ci bölmədə):** **Variant B — əsas hissələri saxlayıb ciddi refactor etmək**, lakin domen özəyi (kateqoriya/atribut engine, atribut saxlama + indeks qatı, axtarış, media storage) *yerində yenidən qurulmaqla*.

---

## 2. CURRENT ARCHITECTURE

### 2.1 Ümumi mənzərə

```
360tap.az/
├── api/          NestJS 10 + Prisma 5 + PostgreSQL   ← YEGANƏ deploy olunan backend
│   ├── prisma/schema.prisma (843 sətir, 38 model, 14 enum)
│   ├── prisma/migrations/ (2 migration)
│   ├── prisma/seed/ (categories 554 sətir, regions, brands, listings, haversine)
│   └── src/ (16 controller, 16 modul)
├── backend/      Express 4 + raw SQL (pg)            ← LEGACY, deploy OLUNMUR, silinməyib
│   ├── migrations/001_init.sql, 002_seed.sql        ← AYRI DB sxemi (avito_az)
│   └── src/routes/ (20 fayl, ~60 endpoint)
├── frontend/     Next.js 15.5 App Router + React 19 RC + Tailwind 3
│   ├── app/ (36 route)
│   ├── components/ (147 fayl)
│   └── lib/ (api, auth, i18n, meili, transport-data, realestate-data, ...)
├── docs/         v1 spesifikasiyalar (21 fayl)
├── docs/v2/      yenilənmiş PRD/schema/API dizaynı (13 fayl)
├── avito screen/ referans skrinşotlar
└── render.yaml   Render Blueprint (Postgres free + Redis free + Docker web)
```

**Monorepo idarəsi yoxdur** — turborepo/pnpm workspace/nx istifadə olunmur, hər qovluğun öz `package.json` və `node_modules`-u var (api: 504 paket, frontend: 104, backend: 139). Paylaşılan tip/kontrakt paketi yoxdur — frontend və backend tipləri **əl ilə** sinxronlaşdırılır və bu, 3-cü bölmədəki sistemli "envelope" buglarının kök səbəbidir.

### 2.2 Backend (api/) — modul xəritəsi

| Modul | Vəziyyət | Qeyd |
|---|---|---|
| `auth` | İşlək (kriptoqrafiya güclü) | OTP/email verify/parol bərpası **yoxdur** |
| `users` | **BOŞ QOVLUQ** | `ls api/src/modules/users/` → yalnız `{dto}` adlı səhv yaradılmış boş qovluq |
| `categories` | Yalnız 3 GET | CRUD **yoxdur** |
| `listings` | İşlək | moderasiya yoxdur, şəkil redaktəsi yoxdur, DELETE yoxdur |
| `geo` | İşlək | 73 region / ~84 rayon, haversine |
| `media` | İşlək (sharp+blurhash) | storage **efemer** |
| `chat` | İşlək (REST) | WebSocket **yoxdur**, 5s polling |
| `favorites` | İşlək | — |
| `notifications` | İşlək (məhdud) | yalnız 2 tetikləyici |
| `reviews` | İşlək (nəzarətsiz) | əməliyyat təsdiqi yoxdur |
| `reports` | Yalnız POST | moderator queue **yoxdur** |
| `saved-searches` | Yalnız CRUD | matcher job **yoxdur** |
| `stores` | İşlək, test var | frontend **heç istifadə etmir** |
| `erp` | **Production keyfiyyətli** | HMAC + nonce + idempotentlik |
| `search` | Kod tam, host ölü | `MEILI_HOST=localhost:7700` |
| `ai` | Kod tam, açar yoxdur | `GROQ_API_KEY` render.yaml-da **yoxdur** |
| `queue` (BullMQ) | Yalnız bağlantı | **heç bir processor/worker yoxdur** |
| `admin` | **MÖVCUD DEYİL** | — |

### 2.3 Frontend — rendering və data axını

- 36 route-dan **21-i (57%) `'use client'`** — məlumat əsasən brauzerdə `useEffect` ilə çəkilir.
- Yalnız 4 route real SSR edir: `/`, `/elanlar`, `/elanlar/[id]`, və qismən `/k`, `/seher` (onlar sadəcə `redirect()`).
- `/emlak`, `/neqliyyat`, `/k/[category]`, `/seher/[city]` — **hamısı sadəcə `redirect('/elanlar?...')`**. Onların zəngin `*Client.tsx` faylları (TransportClient, RealEstateClient, CategoryFilterClient, CityFilterClient, ListingsClient, ListingDetailClient) **heç bir aktiv səhifədən import olunmur** — köhnə arxitekturadan qalan 7 ölü fayl.
- `frontend/lib/api.ts` cavab zərfini (`{ok, data, meta}`) **mərkəzləşdirilmiş şəkildə açmır** — hər çağırış yeri özü açır, ona görə eyni bug 4+ yerdə təkrarlanıb.

### 2.4 Deployment topologiyası

```
Brauzer → Vercel (Next.js SSR + rewrite /api/* → API_ORIGIN/api/v1/*) → Render free (NestJS Docker) → Render free Postgres
                                                                                              ↘ Render free Redis
GitHub Actions cron (hər 5 dəq) → tap360-api.onrender.com/health   (keep-alive)
Frontend HTML-də əlavə client-side keep-alive skripti (hər 10 dəq)
```

**Nəticə:** bütün API trafiki Vercel-in server-side proxy-sindən keçir. Bu, CORS problemini həll edir, lakin 9-cu bölmədə göstərilən **rate limiting-i tamamilə sıradan çıxarır**.

---

## 3. CRITICAL PROBLEMS

> Severity: **CRITICAL** = platformanın hədəfini bloklayır və ya canlıda funksiyanı sıradan çıxarır.

### C-01 [CRITICAL] Backend production-da tamamilə cavabsızdır
**Sübut:** `curl --max-time 70 https://tap360-api.onrender.com/health` → `HTTP=000, time=70.0s, size=0`. Eyni nəticə `/api/v1/categories`, `/api/v1/listings?limit=3`, `/api/v1/geo/regions`, `/api/docs` üçün. İki ardıcıl `/health` cəhdi — hər ikisi timeout (yəni bu sadə "cold start" deyil; cold start-da 30-60s sonra cavab gəlməli idi).
**Kök səbəb ehtimalı (təsdiqlənməyib):** `api/Dockerfile` son sətri: `CMD ["sh","-c","npx prisma migrate deploy && (npm run prisma:seed || echo 'seed skipped') && node dist/main.js"]` — `migrate deploy` DB-yə qoşula bilmirsə və ya asılı qalırsa, `node dist/main.js` **heç vaxt işə düşmür**. Render pulsuz Postgres-in müddət/limit problemi ehtimalı var.
**Təsir:** Bütün marketplace ölüdür.
**Tövsiyə:** Migration-ı start CMD-dən ayır (ayrıca pre-deploy step); app DB olmadan da boot olub `/health`-də `degraded` qaytarsın; Render Postgres-in vəziyyətini dərhal yoxla.

### C-02 [CRITICAL] `/elanlar` səhifəsinin HTTP cavabı heç vaxt tamamlanmır
**Sübut:** `curl --max-time 120 https://360tap.az/elanlar` → `code=200 time=120.0s size=59337` və `curl exit=28` (timeout). Cavabda 4 həll olunmamış React streaming placeholder (`<!--$?-->`), 0 qiymət etiketi, 0 elan linki. Başlıq: `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`, `x-vercel-cache: MISS`.
**Kök səbəb:** `frontend/app/elanlar/page.tsx` server komponentində backend-ə `fetch` edilir, `AbortSignal.timeout` və ya `try/catch` fallback yoxdur → ölü backend-i sonsuz gözləyir, Suspense boundary heç vaxt həll olunmur.
**Təsir:** İstifadəçi ağ/skeleton ekranda qalır; brauzer nəticədə öz timeout-una düşür. Bot/crawler üçün səhifə heç vaxt tam yüklənmir → SEO-da tam itki.
**Tövsiyə:** Bütün server-side `fetch`-lərə `AbortSignal.timeout(5000)` + `try/catch` + degradasiya UI-si əlavə et.

### C-03 [CRITICAL] Ana səhifə heç bir elan göstərmir
**Sübut:** `curl https://360tap.az/` → 50 620 bayt, `grep -o 'AZN\|₼' | wc -l` = **0**, `href="/elanlar/<uuid>"` = **0**, `skeleton` = **66**. Başlıq: `x-vercel-cache: STALE`, `x-nextjs-stale-time: 300`.
**Təsir:** Ziyarətçi boş marketplace görür.

### C-04 [CRITICAL] Yüklənən bütün istifadəçi şəkilləri hər deploy/restart-da silinir
**Sübut:** `render.yaml`-da `disk:`/`volume:` açarı **yoxdur** (`grep -n "disk\|volume" render.yaml` → 0 nəticə), `plan: free`. `api/src/config/configuration.ts:59` → `dir: process.env.MEDIA_DIR ?? './uploads'`; `MEDIA_DIR` render.yaml-da təyin edilməyib. `api/src/media/media.service.ts:63-64` fayl sistemi (`/app/uploads`) daxilinə yazır. Obyekt storage inteqrasiyası **yoxdur** (`grep -rniE "s3|aws-sdk|cloudinary|@vercel/blob|r2"` → real nəticə yoxdur).
**Təsir:** DB-də `listing_images.url` qalır, fayl yoxdur → bütün istifadəçi şəkilləri 404. Marketplace üçün ölümcül.

### C-05 [CRITICAL] Admin paneldən kateqoriya/atribut idarəsi texniki olaraq mümkün deyil
**Sübut:** `api/src/modules/categories/categories.controller.ts` — bütöv fayl 25 sətir, yalnız `@Get() getTree()`, `@Get(':slug')`, `@Get(':slug/attributes')`. `rg "Post\(|Patch\(|Put\(|Delete\(" api/src/modules/categories/` → 0 nəticə. `api/src/modules/` altında **admin modulu yoxdur**. `grep -rn "@Roles" api/src` → bütün API-də **cəmi 1 istifadə** (`api/src/search/search.controller.ts:27`).
**Təsir:** Tapşırığın ƏSAS tələbi ödənmir.

### C-06 [CRITICAL] Elan yerləşdirmə forması atributları ümumiyyətlə göndərmir
**Sübut:** `frontend/app/elan-yerlesdir/page.tsx:128-136` payload: `{title, description, categoryId, districtId, price, priceType, condition}` — `attributes` sahəsi **yoxdur**. `/categories/:slug/attributes` çağırışı formada yoxdur. Backend isə tam validasiya yazıb: `api/src/modules/listings/listings.service.ts:140-218` (`validateAttributes`, 8 AttributeType üçün).
**Təsir:** Bütün real istifadəçi elanları `attributes = {}` ilə yaranır → dinamik filtrlər yalnız seed elanlarını tapır → miqyas artdıqca filtr sistemi statistik olaraq boş nəticə verəcək. **Bu, kateqoriya engine-inin sistemik ölümcül boşluğudur.**

### C-07 [CRITICAL] Marka/Model filtrləri heç vaxt render olunmur
**Sübut:** `api/prisma/seed/categories.ts:44-45,49` — `brand()` helper-i **arqumentsiz** çağırılır → `options` `undefined` → `api/prisma/seed.ts:52` `options: a.options ?? undefined` → DB-də NULL. `frontend/components/CategoryFilters.tsx:25-27` filtri: `(a.options?.length ?? 0) > 0` → brand/model select-ləri atılır. Eyni problem `model` (sətir 50), TRUCK_ATTRS (74), AUDIO_ATTRS (207) üçün.
**Təsir:** Avtomobil kateqoriyasında ən çox istifadə olunan iki filtr görünmür. İstifadəçi "BMW" filtrləyə bilmir.

### C-08 [CRITICAL] Axtarış production-da mövcud deyil — üstəlik iki ayrı, hər ikisi ölü Meilisearch
**Sübut:**
1. `render.yaml:51-54` → `MEILI_HOST: "http://localhost:7700"`, `MEILI_KEY: ""`. `api/Dockerfile`-da Meili prosesi yoxdur → konteynerdə 7700 portu boşdur.
2. `frontend/lib/meili.ts:3-7` — frontend NestJS-i **keçərək** hardcoded Meilisearch Cloud host-una (`ms-71ea7f55541b-49783.jpn.meilisearch.io`) qoşulur. Canlı yoxlama: `curl .../health` → `{"error":"Instance does not exist or is not ready yet"}`.
3. NestJS-in öz `GET /search` endpoint-i (`api/src/search/search.controller.ts:20-24`) frontend-də **heç vaxt çağırılmır** (grep → 0).
**Təsir:** Axtarış zənciri (`frontend/app/elanlar/page.tsx:102-145`): ölü Meili Cloud (6s-ə qədər boş gözləmə, `meili.ts:33`) → AI `/ai/search` → Postgres `ILIKE '%söz%'` (indekssiz seq scan). Yəni **hər axtarış ən pis yola düşür**.

> **Qeyd:** Layihə tarixçəsinə görə backend tərəfdə `MEILI_HOST`/`MEILI_KEY` Render dashboard-unda əl ilə eyni Meili Cloud instansına yönləndirilib. Bu, problemi **həll etmir** — çünki (a) həmin Cloud instansı canlı yoxlamada ölüdür, (b) frontend onsuz da NestJS-i keçərək birbaşa qoşulur, (c) `render.yaml` `localhost:7700` göstərməkdə davam edir (blueprint drift, C-09).

### C-09 [HIGH — şiddət düzəldilib] `GROQ_API_KEY` və `MEILI_*` render.yaml-da yoxdur — blueprint drift
**Sübut:** `api/.env.example`-da `GROQ_API_KEY`/`GROQ_MODEL` var, `render.yaml`-da `GROQ` sözü **heç yerdə yoxdur**. `api/src/ai/ai.service.ts:67-69` `enabled = !!apiKey`; `:88-90` və `:120-122` → `BadRequestException('AI konfiqurasiya olunmayıb (GROQ_API_KEY təyin edin)')`.

> ⚠️ **DƏQİQLƏŞDİRMƏ:** Layihə tarixçəsinə görə `GROQ_API_KEY` (və eyni şəkildə `MEILI_HOST`/`MEILI_KEY` Meili Cloud üçün) **Render dashboard-unda ƏL İLƏ əlavə olunub** — yəni runtime-da mövcud ola bilər. Backend audit anında cavab vermədiyi üçün bu **yoxlanıla bilmədi**. Ona görə şiddət CRITICAL-dan **HIGH**-a endirildi.

**Əsl risk — blueprint drift:** `render.yaml` reallığı əks etdirmir. Servis Blueprint-dən yenidən yaradılsa (və ya yeni mühit qurulsa) `GROQ_API_KEY` **itəcək**, `MEILI_HOST` isə `localhost:7700`-ə **qayıdacaq**. Bu, konfiqurasiyanın tək həqiqət mənbəyinin olmaması deməkdir.

**Tövsiyə:** Bütün runtime env dəyişənlərini `render.yaml`-a `sync: false` ilə elan et (dəyər dashboard-da qalsın, amma **mövcudluğu koddan görünsün**); `MEILI_HOST`-dakı `localhost:7700` yalançı dəyərini sil.

### C-10 [CRITICAL] Refresh token frontend-də atılır — istifadəçi 15 dəqiqədə çıxarılır
**Sübut:** `frontend/lib/auth.tsx:74` yalnız `payload.tokens.accessToken` saxlayır; `grep -rn "refreshToken|auth/refresh" frontend/` → **boş**. `JWT_ACCESS_TTL=900` (`render.yaml:42-43`).
**Təsir:** Backend-də qurulmuş güclü refresh rotation + reuse detection (`auth.service.ts:99-121`) **tamamilə ölü koddur**. Elan yerləşdirmə, çat, şəkil yükləmə axınları ortada 401 ilə kəsilir.

### C-11 [CRITICAL] Telefon OTP — default giriş metodu — 404 verir
**Sübut:** `frontend/components/AuthModal.tsx:19` default `'phone'`. `frontend/components/PhoneOtpForm.tsx:45,91` → `/auth/send-otp`, `/auth/verify-otp`. NestJS `auth.controller.ts`-də bu route-lar **yoxdur** (yalnız legacy `backend/src/routes/auth.js:111,148`-də var, o da deploy olunmur, üstəlik SMS orada `console.log` mock-dur: `backend/src/routes/auth.js:21-24`).
**Əlçatanlıq:** `layout.tsx` → `Header.tsx:10,221` → `AuthModal` → `PhoneOtpForm` — **bütün saytda**.
**Təsir:** Azərbaycan bazarında əsas qeydiyyat kanalı ilk addımda ölür.

### C-12 [CRITICAL] Rate limiting production-da işləmir — bütün sayt üçün tək bucket
**Sübut:** `api/src/main.ts:29` `app.set('trust proxy', 1)`; `@nestjs/throttler` `getTracker(req) { return req.ip }`. Bütün trafik `frontend/next.config.ts:22-25` server-side rewrite-i ilə Vercel-dən keçir → Render `req.ip` = Vercel egress IP.
**Təsir:** `THROTTLE_LIMIT=300/60s` bütün sayt üçün ortaqdır — platforma öz-özünü 429-a salır. Eyni zamanda login üçün `@Throttle({limit:10})` (`auth.controller.ts:28`) da qlobal olur: dəqiqədə 10 login cəhdindən sonra **bütün istifadəçilər** bloklanır, hesab əsaslı brute-force müdafiəsi isə ümumiyyətlə yoxdur. Əlavə: ThrottlerStorage in-memory-dir (`app.module.ts:39-44`), Redis storage qoşulmayıb.

### C-13 [CRITICAL] Fraud müdafiəsi praktiki olaraq yoxdur; elanlar moderasiyasız dərhal canlıya düşür
**Sübut:** `api/src/modules/listings/listings.service.ts:104` → `status: 'active'` sərt kodlanıb, halbuki eyni faylın JSDoc-u (`:52-56`) *"Status: 'review' (moderasiya növbəsinə düşür)"* yazır. 15 fraud komponentindən yalnız 2-si real (report qəbulu, ban statusu oxunması):

| Komponent | Vəziyyət |
|---|---|
| Telefon OTP | YOXDUR |
| Email verification | YOXDUR (`isEmailVerified` heç vaxt `true` olmur) |
| Cihaz fingerprint | YOXDUR |
| Duplicate elan detection | YOXDUR |
| Oğurlanmış şəkil detection | YOXDUR |
| Spam detection / CAPTCHA | YOXDUR |
| Eyni telefonla kütləvi hesab | YOXDUR |
| Şübhəli qiymət | yalnız legacy Express-də |
| Report sistemi | **VAR** (yalnız POST) |
| Moderator queue | YOXDUR |
| Block/ban | QISMƏN (oxunur, yazan endpoint yoxdur) |
| Audit log | YOXDUR (`AuditLog` modeli var, `grep -rn "auditLog" api/src` → 0) |
| Biznes verification | YOXDUR (`Store.isVerified` yalnız oxunur) |
| "Təsdiqlənmiş satıcı" badge | UI VAR, backend YOXDUR (`SellerVerification.tsx:20-23` — `setTimeout` mock) |

### C-14 [CRITICAL] Public elan siyahısı telefon nömrəsi + ünvan + dəqiq koordinat qaytarır
**Sübut:** `api/src/modules/listings/dto/listing-response.dto.ts:34,90` `contactPhone`; `api/src/modules/listings/listings.controller.ts:36-40` `@Public() @Get() findAll()`, səhifə başına 50 elan (`listings.service.ts:315`).
**Təsir:** Anonim skript `GET /api/v1/listings?page=N&limit=50` ilə bütün bazanın telefon nömrələrini yığa bilər → spam/scam call-center bazası + şəxsi məlumatların qorunması riski. Turbo.az/Tap.az-da nömrə "Nömrəni göstər" düyməsinin arxasındadır.

---

## 4. BROKEN FEATURES

### 4.1 Frontend çağırır, backend-də YOXDUR — 24 çağırış / 21 komponent

| Frontend fayl:sətir | Endpoint | Vəziyyət | İstifadəçiyə çatır? |
|---|---|---|---|
| `components/PhoneOtpForm.tsx:45` | `POST /auth/send-otp` | YOXDUR | **BƏLİ** (sayt-boyu login modalı) |
| `components/PhoneOtpForm.tsx:91` | `POST /auth/verify-otp` | YOXDUR | **BƏLİ** |
| `app/elan-yerlesdir/toplu/page.tsx:25` | `GET /api/import/template` | YOXDUR | **BƏLİ** |
| `app/elan-yerlesdir/toplu/page.tsx:63` | `POST /api/import/listings` | YOXDUR | **BƏLİ** |
| `components/AvatarUploader.tsx:41` | `POST /api/upload/images` | YOXDUR (düzgünü `/media/upload`) | xeyr (import olunmur) |
| `components/AvatarUploader.tsx:52` | `PATCH /auth/me` | YOXDUR (`me` yalnız `@Get`) | xeyr |
| `components/FilterSidebar.tsx:53` | `GET /cities` | YOXDUR | xeyr (orphan) |
| `components/UniversalFullFilter.tsx:28` | `GET /cities` | YOXDUR | xeyr (orphan) |
| `components/UniversalTopBar.tsx:25` | `GET /cities` | YOXDUR | xeyr (orphan) |
| `components/MortgagePreapproval.tsx:15` | `POST /realestate/mortgage-preapprove` | YOXDUR | xeyr |
| `components/NeighborhoodScore.tsx:10` | `GET /realestate/neighborhood/:district` | YOXDUR | xeyr |
| `components/PriceHeatmap.tsx:11` | `GET /realestate/heatmap` | YOXDUR | xeyr |
| `components/SavedMatches.tsx:9` | `GET /realestate/match-saved-searches` | YOXDUR | xeyr |
| `components/PriceInsight.tsx:21` | `GET /insights/listing/:id/price-position` | YOXDUR | xeyr |
| `components/SuperSearch.tsx:48` | `GET /search-smart/smart` | YOXDUR | xeyr |
| `components/SearchAutocomplete.tsx:43` | `GET /search/popular` | YOXDUR | xeyr |
| `components/VoiceSearch.tsx:79` | `POST /voice/parse` | YOXDUR | xeyr |
| `components/AIAssistantChat.tsx:35` | `POST /voice/parse` | YOXDUR | xeyr (layout-da şərhdə) |
| `components/FloatingVoiceFAB.tsx:89` | `POST /voice/parse` | YOXDUR | xeyr |
| `components/AISimilar.tsx:12` | `GET /ai/similar/:id` | YOXDUR | xeyr (orphan) |
| `components/AISmartSuggest.tsx:18` | `GET /ai/suggest` | YOXDUR | xeyr |
| `components/AIFraudScore.tsx:22` | `POST /ai/fraud-score` | YOXDUR | xeyr |
| `components/AISummary.tsx:18` | `POST /ai/summarize` | YOXDUR | xeyr (orphan) |
| `components/AITranslate.tsx:15` | `POST /ai/translate` | YOXDUR | xeyr (orphan) |
| `components/ReportModal.tsx:49` | `POST /listings/:id/report` | YOXDUR (düzgünü `POST /reports`) | xeyr |

**NestJS-də tamamilə mövcud olmayan controller-lər:** `cities`, `realestate`, `insights`, `search-smart`, `voice`, `import`, `upload`. Hamısı `backend/src/routes/` (legacy Express) altında qalıb və heç vaxt köçürülməyib.

### 4.2 Cavab zərfi (envelope) uyğunsuzluqları — eyni bug 10 yerdə

NestJS `TransformInterceptor` (`api/src/common/interceptors/transform.interceptor.ts:11-23`) hər cavabı `{ ok: true, data, meta? }` formatına salır. Köhnə Express formatını (`{items}`, `{listing}`, `{total}`) gözləyən yerlər:

| Fayl:sətir | Gözləyir | Nəticə |
|---|---|---|
| `app/profil/page.tsx:24` | `d.items` | Dashboard KPI (aktiv/satılan/arxiv) və "Son elanlarım" **həmişə 0/boş** |
| `app/profil/elanlarim/[id]/stats/page.tsx:14` | `d.listing` | Səhifə **sonsuz "Yüklənir..."** |
| `app/muqayise/page.tsx:14` | `d.listing` | Müqayisə cədvəli **həmişə boş** |
| `app/admin/page.tsx:25-26` | `l.total` | Admin KPI **həmişə "..."** |
| `components/QuickView.tsx:25` | `d.listing` | ölü kod, bug real |
| `components/QuickViewModal.tsx:16` | `d.listing` | ölü kod |
| `components/AISimilar.tsx:12` | `d.items` | ikiqat sınıq |
| `components/SmartSuggestionsForYou.tsx:11` | `d.items` | ölü kod |
| `components/FeaturedCarousel.tsx:15-16` | `d.items` | ölü kod |
| `components/CommandPalette.tsx:59` | `d.items` | `layout.tsx:146`-da şərhdə |

**Kök səbəb:** `frontend/lib/api.ts`-də mərkəzləşdirilmiş `unwrap()` yoxdur.

### 4.3 Route status matrisi (36 route)

| Route | Status | Səbəb |
|---|---|---|
| `/` | WORKING (kod) / **BROKEN (canlı)** | kod düzgün, backend ölü → boş |
| `/elanlar` | WORKING (kod) / **BROKEN (canlı)** | SSR cavabı bitmir (C-02) |
| `/elanlar/[id]` | WORKING | SSR + JSON-LD real |
| `/k/[category]`, `/seher/[city]`, `/seher/[city]/[category]` | WORKING (redirect) | real məzmun yoxdur |
| `/emlak`, `/neqliyyat` | WORKING (redirect) | vertikal landinq **yoxdur** |
| `/elan-yerlesdir` | PARTIAL | atribut sahələri yoxdur (C-06); klient validasiyası backend ilə uyğunsuz (`page.tsx:123-124` min 3/10 vs DTO min 10/20) |
| `/elan-yerlesdir/toplu` | **BROKEN** | `import` controller yoxdur |
| `/login`, `/qeydiyyat`, `/register` | PARTIAL | OTP sınıq, sosial giriş ölü, "Şifrəni unutdun?" `onClick`-siz (`login/page.tsx:60`) |
| `/profil` | **BROKEN** | envelope bugu → statistika həmişə 0 |
| `/profil/elanlarim` | WORKING | — |
| `/profil/elanlarim/[id]/stats` | **BROKEN + MOCK** | envelope bugu + `Math.random()` qrafik |
| `/profil/mesajlar` | WORKING | 5s polling |
| `/profil/sevimliler`, `/bildirisler`, `/reyler`, `/saxlanmis` | WORKING | — |
| `/profil/balans` | **MOCK** | `DEMO_TX` hardcoded, "25.00 ₼" statik |
| `/profil/sebet` | **MOCK** | `checkout()` → `toast('Sifariş yaradıldı (demo)')` |
| `/profil/ayarlar` | **MOCK** | yalnız localStorage, backend çağırışı **yoxdur** |
| `/profil/baxilanlar` | WORKING (local) | localStorage, dizayn üzrə |
| `/admin` | **PARTIAL/BROKEN** | 8 alt-modul linkinin hamısı 404 |
| `/muqayise` | **BROKEN** | envelope bugu |
| `/lab` | **MOCK** | 200+ toggle sadəcə localStorage |
| `/elaqe` | **MOCK** | forma `setSent(true)` edir, heç nə göndərmir |
| `/biznes`, `/reklam`, `/karyera`, `/komek`, `/qaydalar`, `/mexfilik` | WORKING (statik) | `/biznes` "Seç" düymələri `href='#'` |
| `/sekille-axtar`, `/ai-elan` | WORKING (kod) / BROKEN (canlı) | GROQ açarı yox |

---

## 5. DATABASE ASSESSMENT

### 5.1 Ümumi

- **Provider:** PostgreSQL, Prisma 5.22 (`api/prisma/schema.prisma:8-11`), connection string yalnız `env("DATABASE_URL")`.
- **Sxem:** 843 sətir, **38 model**, 14 enum. `docs/v2/04_database_schema.md`-dəki 38 modelin adları ilə hərfi eynidir.
- **Migration:** 2 fayl — `20260610074609_init` (896 sətir: 38 CREATE TABLE, 14 CREATE TYPE, 32 CREATE INDEX, 20 UNIQUE INDEX, 34 FOREIGN KEY) + `20260610080218_add_last_login`.
- **SCHEMA DRIFT: YOXDUR** ✅ — sütun-sütun müqayisə edilib, çatışmayan/artıq cədvəl, sütun və ya enum dəyəri tapılmayıb. Bu, komandanın `prisma migrate dev` intizamına riayət etdiyini göstərir və **saxlanmalıdır**.
- **Qeyd:** 10 iyundan (init migration) bəri heç bir sxem təkamülü olmayıb — yəni ~3 aydır data modeli irəliləməyib.

### 5.2 [CRITICAL] 38 modeldən 17-si ÖLÜDÜR

`api/src` altında adı bir dəfə də keçməyən modellər (grep 0 nəticə):

`Profile` (:77), `Brand` (:216), `VehicleModel` (:227), `ListingAttributeValue` (:363), **`VehicleDetails` (:383)**, **`RealEstateDetails` (:411)**, **`JobDetails` (:434)**, `StoreBranch` (:495), `CompanyProfile` (:510), `ListingStatDaily` (:641), `Package` (:665), `Subscription` (:676), `Promotion` (:688), `Payment` (:700), `Banner` (:716), `ImportJob` (:796), `AuditLog` (:829).

**Təsir:** Üç vertikalın (Nəqliyyat / Əmlak / İş) BÜTÜN professional sahələri — VIN, vuruq, mərtəbə, çıxarış, ipoteka, maaş, təcrübə — cədvəldə var, kodda yoxdur. **Vertikallar sxemdə var, məhsulda yoxdur.** Monetizasiya, analitika, audit, toplu import da sıfır implementasiyadır.

### 5.3 [CRITICAL] Atribut saxlama strategiyası — ən pis aralıq vəziyyət

`docs/v2/04_database_schema.md:711-716` açıq qərar verir: *"Yazı zamanı hər ikisi doldurulur"* (JSONB + normalized EAV). Faktda:
- `Listing.attributes Json @default("{}")` (`schema.prisma:294`) — **yeganə real mənbə**, filtr də oradan (`listings.service.ts:387-405`).
- `ListingAttributeValue` — **heç vaxt yazılmır** (`listings.service.ts:79-121` tranzaksiyasında yalnız `listing` + `listingImage`). Buna baxmayaraq `migration.sql:710,713`-də iki indeks **boş cədvəlin üstündə** durur.
- `VehicleDetails` / `RealEstateDetails` / `JobDetails` — heç vaxt yazılmır/oxunmur.

**Nəticə:** normalizə olunmuş sürətli sorğu yolu bağlıdır, bütün yük indekssiz JSONB-nin üstünə düşür. **Aralıq vəziyyət hər iki variantdan pisdir.**

### 5.4 [CRITICAL] İndeks planı milyonlarla elan üçün yararsızdır

Əsas siyahı sorğusu (`listings.service.ts:314-432`):
```sql
WHERE status='active' AND category_id IN (...) AND district_id IN (...)
ORDER BY created_at DESC LIMIT 20 OFFSET N
```
Mövcud indekslər (`schema.prisma:339-344`): `(status, createdAt DESC)`, `(categoryId, status)`, `(districtId, status)`, `(vertical, status)`, `(storeId)`, `(source, status)`.

**Heç biri həm filtri, həm sıralamanı örtmür.** Planner ya milyonlarla sətri filtrləyəcək, ya nəhəng nəticəni RAM-da sort edəcək.

Əlavə boşluqlar:
- `Listing.attributes` JSONB üzərində **GIN indeksi yoxdur** (`rg "GIN|gin" api/prisma/migrations/` → 0). `docs/v2/04:714` və `docs/v2/09:79-84` bunu tələb edir, tətbiq olunmayıb.
- `Listing.ownerId` üzərində **indeks yoxdur** → "Mənim elanlarım" və user cascade delete tam skan.
- `price`, `views` üzrə sıralama **indekssizdir** → filesort.
- `expires_at` **indekssizdir** və heç bir proses onu emal etmir (`@Cron` grep → 0, `@nestjs/schedule` package.json-da yoxdur) → **elanlar heç vaxt bitmir**.
- `Listing.slug` — nə `@unique`, nə indeksli, nə də heç bir sorğuda oxunur (SEO ölü sütunu).
- `conversations.buyer_id/seller_id` — **nə FK, nə indeks** (`schema.prisma:538-550`) → hər istifadəçinin mesaj qutusu tam skan.
- **20+ UUID sütunu FK-sızdır:** `reports` (0 FK), `payments.user_id`, `subscriptions.*`, `promotions.*`, `listing_stat_daily.listing_id`, `banners.region_id`, `audit_logs.actor_id`, `vehicle_details.brand_id/model_id`, `reviews.listing_id`, `messages.sender_id`.

### 5.5 [CRITICAL] Full-text axtarış üçün DB tərəfi sıfırdır

`migration.sql`-də `CREATE EXTENSION` **0 dəfə**, `tsvector` **0 dəfə**, `GIN` **0 dəfə**. Nə `pg_trgm`, nə `unaccent`, nə `postgis`. Bütün indekslər adi B-tree. Kod isə `listings.service.ts:377-384`-də `title/description contains` (= `ILIKE '%söz%'`) istifadə edir → **leading wildcard heç bir B-tree indeksdən istifadə edə bilmir** → TEXT `description` üzərində tam seq scan.

### 5.6 [HIGH] Çoxdillilik model səviyyəsində yarımçıqdır

| Model | AZ | RU | EN |
|---|---|---|---|
| `Category` | ✅ `nameAz` | ✅ sahə var, **seed doldurmur** | ✅ sahə var, **seed doldurmur** |
| `CategoryAttribute` | ✅ `labelAz` | ✅ sahə var, doldurulmur | ❌ **`labelEn` sahəsi YOXDUR** |
| `CategoryAttribute.options` | düz massiv (AZ) | ❌ | ❌ |
| `Region` | ✅ | ✅ (seed doldurur) | ❌ `nameEn` yoxdur |
| `District` | ✅ | ❌ (`SeedDistrict`-də sahə yoxdur) | ❌ |
| `Listing` | ✅ `title`/`description` | ❌ **ümumiyyətlə yoxdur** | ❌ |

**Kritik dizayn səhvi:** `options` massivi həm göstərilən etiket, həm də saxlanan dəyərdir (`listings.service.ts:398` `equals: value`). Dil dəyişəndə filtr **sınacaq**.

### 5.7 [HIGH] Denormalized sayğaclar canlı saxlanılmır

- `Category.listingsCount` — oxunur (`categories.service.ts:26,62`), yazan yeganə yer `api/prisma/seed.ts:259` → **deploy anındakı rəqəmdə donub qalır**.
- `User.rating` / `reviewsCount` / `Store.rating` — cavabda qaytarılır, **heç vaxt yazılmır** → həmişə 0.
- `Listing.callClicks` / `whatsappClicks` — heç vaxt artırılmır → həmişə 0.
- Yalnız `favoritesCount` düzgün saxlanılır (`favorites.service.ts:26,38`).

### 5.8 [MEDIUM] Miqyas idarəsi yoxdur

- `PARTITION` sözü migration-da **0 dəfə**.
- `SearchLog` hər axtarışda, `ErpSyncLog` payload JSON-larla yazılır — retention/arxiv/TTL **yoxdur**.
- `ListingStatDaily` — 1M aktiv elanda gündə 1M sətir modelidir, partition yoxdur (üstəlik kod onu istifadə etmir).
- Connection pooling konfiqurasiya edilməyib — `connection_limit`, `pool_timeout`, pgbouncer **yoxdur**.
- Soft delete / versiyalaşma yoxdur (`deletedAt` grep → 0).

### 5.9 Müsbət tərəflər (SAXLANMALI)

✅ Schema ↔ migration **sıfır drift**
✅ Pul sahələri **Decimal** (`Listing.price DECIMAL(14,2)`, `Payment.amount`, `Package.priceMonthly`) — Float deyil
✅ Cascade siyasətlərinin əsas hissəsi məntiqli: `listing→images CASCADE`, `category→listings RESTRICT`, `store→listings SET NULL`
✅ `RefreshToken` modeli (tokenHash `@unique`, userAgent, ipAddress, revokedAt) — çoxcihazlı sessiya üçün hazır
✅ ERP modelləri (`@@unique([integrationId, externalId])`, `listingId @unique`) — idempotent sync üçün düzgün
✅ Geo modeli (`NearbyDistrict` + `@@unique([originId,targetId])` + `@@index([originId, rank])`) — düzgün qurulub
✅ `PrismaService.cleanDatabase()` `NODE_ENV!=='test'` olduqda exception atır — production-da təsadüfi TRUNCATE-dən qorunma

---

## 6. CATEGORY & DYNAMIC FILTER ASSESSMENT

> Bu, auditin ən vacib bölməsidir — tapşırığın özəyi budur.

### 6.1 Hazırkı vəziyyət: iki paralel, bir-birindən xəbərsiz filtr dünyası

**Dünya 1 — HƏQİQİ data-driven zəncir (işləyir):**
```
schema.prisma:158-214 (Category self-relation + CategoryAttribute + AttributeType)
  → prisma/seed/categories.ts (117 kateqoriya node, 3 səviyyə, 71 atribut dəsti, 141 atribut tərifi)
  → categories.service.ts:70-92 getAttributes()
  → app/elanlar/page.tsx:180-195 (server-side fetch, `attrD.data` DÜZGÜN açılır)
  → components/CategoryFilters.tsx (select/number-range/boolean render)
  → a_* URL parametrləri → attrs JSON
  → listings.service.ts:387-405 (Prisma JSONB path filtri)
```
Bu zəncir **tam işləyir və sistemdə yeganə production-ready dinamik filtr yoludur**.

**Dünya 2 — HARDCODED (359 sətir lüğət):**
- `frontend/lib/transport-data.ts` (138 sətir): `CAR_BRANDS` (~70 marka, 800+ model), `BODY_TYPES`, `FUEL_TYPES`, `TRANSMISSION_TYPES`, `DRIVETRAIN_TYPES`, `COLORS`, `MARKET_FROM`, `SELLER_KIND`, `EQUIPMENT` (30).
- `frontend/lib/realestate-data.ts` (221 sətir): `BAKU_DISTRICTS` (~120), `BAKU_METRO` (25), `BAKU_LANDMARKS` (~100) + 20-dən çox lüğət.
- İstifadəçiləri: `TransportFullFilter`, `RealEstateFullFilter`, `TransportTopBar`, `RealEstateTopBar`, `RealEstateFilter`, `MarketPriceAnalyzer`, `LocationPicker` — **7 komponent, heç biri DB-yə toxunmur**.
- Bu komponentlərin hamısı orphan `*Client.tsx` zəncirindədir → **istifadəçiyə heç vaxt çatmır**.

### 6.2 Tələb olunan struktura uyğunluq

Tapşırıqda tələb olunan zəncir:
```
Category → Subcategory → Attribute definitions → Attribute options
        → Category-specific filters → Category-specific listing form → Searchable/filterable values
```

| Tələb | Vəziyyət | Sübut |
|---|---|---|
| Category → Subcategory (çoxsəviyyəli) | ✅ VAR | `schema.prisma:158-182` self-relation, seed-də 3 səviyyə |
| Attribute definitions | ✅ VAR | `CategoryAttribute` (`:195-214`), 141 tərif |
| **Attribute options (ayrıca cədvəl)** | ❌ **YOXDUR** | `options Json?` — düz massiv, ID-siz, dilsiz, iyerarxiyasız |
| Category-specific filters (render) | ⚠️ QİSMƏN | `CategoryFilters.tsx` yalnız `select`/`number`/`boolean` render edir; `multiselect`/`range`/`date`/`location` **render olunmur** |
| **Category-specific listing form** | ❌ **YOXDUR** | `elan-yerlesdir/page.tsx:128-136` — `attributes` göndərilmir (C-06) |
| Searchable/filterable values | ⚠️ QİSMƏN | `isFilterable` işləyir; **`isSearchable` heç yerdə oxunmur** (`grep` → yalnız select + seed) |
| **Admin CRUD** | ❌ **YOXDUR** | `categories.controller.ts` — 0 yazma endpoint-i (C-05) |
| **Kaskad asılılıq (marka→model→nəsil)** | ❌ **YOXDUR** | `AttributeType` enum-unda `dependent`/`reference` yoxdur; `CategoryAttribute`-da `dependsOn`/`showIf`/`parentOptionId` yoxdur; `Generation` modeli ümumiyyətlə yoxdur |

### 6.3 Konkret nümunələr üzrə cavab

**Nəqliyyat → Avtomobil → Marka → Model → İl → Mühərrik...**
- `CAR_ATTRS` (`seed/categories.ts:45-59`): brand, model, year, mileage, fuel, engine_volume, transmission, drive, body, color, no_accident, not_painted, credit, barter.
- **Marka/Model render olunmur** (options NULL — C-07). Nəsil, at gücü, VIN, sahib sayı, opsiyalar, bazar versiyası, salon/şəxsi seed-də **yoxdur**.
- `Brand` + `VehicleModel` DB-də seed olunub (10 marka × 5 model), amma **heç bir endpoint onları vermir** (`grep "prisma.brand" api/src` → 0). Frontend-də isə 70 marka hardcoded → **iki uyğunsuz mənbə** ("LADA" vs "Lada (VAZ)").

**Daşınmaz əmlak → Mənzil → Otaq → Sahə → Mərtəbə...**
- `FLAT_ATTRS` (`seed/categories.ts:97-107`): deal_type, building_type, rooms, area, floor, total_floors, repair, has_extract, has_mortgage.
- **Metro, qəsəbə, qaz/su/istilik/lift/parking/balkon YOXDUR.** Geo iyerarxiyası yalnız Region→District — **qəsəbə səviyyəsi yoxdur**. Metro üçün DB modeli yoxdur (yalnız `RealEstateDetails.metro` sərbəst mətn + frontend-də 25 stansiyalıq koordinatsız massiv).

**Elektronika → Telefon → Brend → Model → Yaddaş...**
- Taksonomiya var (`elektronika → telefonlar → mobil-telefonlar`, `categories.ts:436-443`), atributlar var, amma yenə brand/model options NULL problemi.

### 6.4 [CRITICAL] Yekun cavab

> **"Hazırkı schema bu strukturu dəstəkləyə bilərmi?"**
>
> **QİSMƏN — və ən vacib hissəsində XEYR.**
>
> Taksonomiya bazası (117 node, 141 atribut) və `/elanlar` zənciri **güclü təməldir və saxlanmalıdır**. Lakin:
> 1. **Admin CRUD yoxdur** → developer olmadan kateqoriya əlavə etmək mümkün deyil;
> 2. **Elan forması atribut soruşmur** → filtrləyəcək data heç vaxt yaranmır;
> 3. **`options` düz JSON massivdir** → ID yox, tərcümə yox, iyerarxiya yox, kaskad yox;
> 4. **359 sətir hardcoded lüğət** frontend-də qalır;
> 5. **GIN indeksi yoxdur** → milyon elanda hər filtr seq scan.
>
> Yəni engine-in **skeleti düzgündür, əzələləri yoxdur**.

---

## 7. LISTING ENGINE ASSESSMENT

| Funksiya | Status | Sübut |
|---|---|---|
| Elan yaratma | ✅ WORKING | `listings.service.ts:57-130` — kateqoriya/rayon yoxlaması, atribut validasiyası, `$transaction`, Meili best-effort |
| — atributlarla | ❌ **BROKEN** | forma `attributes` göndərmir (C-06) |
| Edit | ⚠️ PARTIAL | `listings.service.ts:290-304` — **şəkillərə toxunmur**, `vertical`-ı yeniləmir, `validateAttributes` çağırmır |
| Draft | ❌ MISSING | `ListingStatus.draft` var, heç vaxt set edilmir |
| Publish | ⚠️ auto | `:104` sərt `status:'active'` |
| Expire | ❌ **MISSING** | `expiresAt` yazılır (`:77,105`), **heç bir job emal etmir** → elanlar heç vaxt bitmir |
| Archive | ✅ WORKING | `POST /listings/:id/archive` |
| Delete | ❌ MISSING | `@Delete` endpoint-i yoxdur |
| Moderation | ❌ **MISSING** | `rejectionReason` grep → 0; moderator queue yoxdur |
| Status lifecycle | ⚠️ 9 status var, 4-ü işlənir | `draft/review/rejected/blocked` heç vaxt set edilmir |
| Seller | ⚠️ PARTIAL | `owner_name`/`owner_rating` `ListingResponse`-da **yoxdur**, amma `ListingCard.tsx:33,185` gözləyir → reytinq ulduzu heç vaxt görünmür |
| Business seller | ⚠️ PARTIAL | `stores` backend real, frontend **heç istifadə etmir** (`/magaza` route yoxdur) |
| Media | ⚠️ efemer | C-04 |
| Location | ⚠️ PARTIAL | `lat/lng` sahələri var, formada input **yoxdur** → praktikada heç vaxt dolmur |
| Attributes | ❌ BROKEN | C-06 |
| Pricing | ✅ Decimal | ⚠️ `listing-response.dto.ts:74` `price ? Number(price) : null` → **`price=0` səhvən `null`** olur (pulsuz elanlar) |
| Currency | ✅ VAR | AZN/USD/EUR/RUB regex validasiyası |
| Promotion | ❌ MOCK | `isVip`/`isPremium` sahələri var; əsas `orderBy` (`:413-419`) onları **nəzərə almır**; set edən endpoint yoxdur; `vipUntil` sahəsi yoxdur |
| Views | ⚠️ sadə | hər `GET /listings/:id`-də `views: {increment:1}` UPDATE — dedup/buferləmə/bot filtri yoxdur → hot-row kilidi |
| Statistics | ❌ MOCK | `ListingStatDaily` istifadəsiz; `/profil/elanlarim/[id]/stats` `Math.random()` |

**Vertikal dərinlik — tələb vs reallıq:**

| Turbo.az tələbi | Sxemdə | Seed-də | Kodda işləyir |
|---|---|---|---|
| marka, model | ✅ | ✅ (options NULL) | ❌ |
| **nəsil (generation)** | ❌ | ❌ | ❌ |
| kuzov, il, mühərrik həcmi, yanacaq, sürətlər q., ötürücü, yürüş, rəng | ✅ | ✅ | ⚠️ yalnız JSONB |
| **at gücü (horsepower)** | ❌ | ❌ | ❌ |
| **bazar versiyası** | ❌ | ❌ | ❌ |
| **salon/şəxsi (sellerType)** | ❌ (yalnız `User.sellerType`) | ❌ | ❌ |
| kredit, barter | ✅ (`Listing.hasCredit/hasBarter`) | ✅ | ✅ |
| vuruq, rənglənib | ✅ `noAccident/notPainted` | ✅ | ⚠️ JSONB |
| VIN, sahib sayı, opsiyalar | ✅ `VehicleDetails` | ❌ | ❌ (cədvəl ölü) |

| Bina.az tələbi | Vəziyyət |
|---|---|
| əməliyyat, növ, otaq, sahə, mərtəbə, təmir, çıxarış, ipoteka | ✅ sxemdə + seed-də (JSONB-də) |
| **qəsəbə** | ❌ geo iyerarxiyası 2 səviyyəlidir |
| **metro** | ❌ model yoxdur, sərbəst mətn |
| **xəritə radiusu / polygon** | ❌ `QueryListingsDto`-da parametr yoxdur, PostGIS yoxdur |
| **m² qiyməti** | ❌ `pricePerM2` sahəsi var, doldurulmur |
| qaz/su/istilik/lift/parking/balkon | ❌ seed-də yoxdur |

| JobSearch tələbi | Vəziyyət |
|---|---|
| vəzifə, maaş, qrafik, təcrübə | ⚠️ `JOB_ATTRS` cəmi **4 atribut** |
| sənaye, remote/hybrid/office, təhsil, dil | ❌ |
| **CV / namizəd / müraciət / shortlist / ATS** | ❌ **model ümumiyyətlə yoxdur** (`grep "cv|resume|candidate|application" schema.prisma` → yalnız `cvRequired`) |

---

## 8. SEARCH ASSESSMENT

### 8.1 Faktiki axtarış zənciri (`frontend/app/elanlar/page.tsx:102-145`)

```
1. meiliSearch()  → Meilisearch Cloud (frontend/lib/meili.ts:3-7, hardcoded host)
                    ❌ CANLI: {"error":"Instance does not exist or is not ready yet"}
                    ⏱ AbortSignal.timeout(6000) → hər sorğuya 6s-ə qədər boş gözləmə
2. 0 nəticə → POST /ai/search (Groq)
                    ❌ GROQ_API_KEY yoxdur → 400
3. 0 nəticə → GET /listings?q=  (Prisma ILIKE '%söz%')
                    ❌ pg_trgm/tsvector indeksi yoxdur → seq scan
```

**NestJS-in öz `SearchService`-i** (`api/src/search/search.service.ts`, tam index settings ilə: searchableAttributes, filterableAttributes, sortableAttributes, sinonimlər) `GET /search` endpoint-ində mövcuddur, **amma frontend onu heç vaxt çağırmır** (grep → 0). Yəni ən yaxşı qurulmuş inteqrasiya istifadəçi axınından tam təcrid olunub.

### 8.2 Tapıntılar

| # | Severity | Tapıntı | Sübut |
|---|---|---|---|
| S-01 | CRITICAL | Frontend-in Meili Cloud instansı mövcud deyil | canlı `curl .../health` |
| S-02 | CRITICAL | İki fərqli Meili host, NestJS `SearchService` heç vaxt çağırılmır | `render.yaml:51-52` vs `lib/meili.ts:3-7` |
| S-03 | CRITICAL | Postgres FTS yoxdur → `ILIKE '%..%'` seq scan | `migration.sql`-də 0 extension |
| S-04 | HIGH | `POST /search/reindex` production-da 500 verəcək | `search.service.ts:132-147` try/catch-siz |
| S-05 | HIGH | Autocomplete/suggest **işləmir** | `/search/popular`, `/search/suggestions` yoxdur; `SuperSearch`/`SearchAutocomplete` həm sınıq, həm ölü kod |
| S-06 | HIGH | NLP axtarışda **il (year) sahəsi ümumiyyətlə yoxdur** | `ai.service.ts:11-24` promptda `year` yoxdur → "2020-dən yuxarı" itir. Legacy `voice-parser.js:151-169` bunu regex ilə düzgün tuturdu → **funksional geriləmə** |
| S-07 | HIGH | NLP axtarışda rəng parse olunur, **filtrdə istifadə olunmur** | `ai.service.ts:19` çıxarır, `runSearch()` (`:156-205`) `u.color`-u `where`-ə əlavə etmir |
| S-08 | MEDIUM | Facet/aggregation **yoxdur** | `search.service.ts:163-167` `facets` parametri ötürülmür |
| S-09 | MEDIUM | Meili `filterableAttributes` hardcoded 8 sahədir | `search.service.ts:77`; `toDoc()` (`:240-241`) yalnız brand/model çıxarır, onlar da filterable siyahısında **yoxdur**; `isSearchable` bayrağı heç yerdə oxunmur |
| S-10 | MEDIUM | `SearchLog` yazılır, **heç yerdə oxunmur** | tək INSERT `search.service.ts:173`, o da çağırılmayan endpoint-də |
| S-11 | LOW | Meili master key **boşdur** | `render.yaml:53-54` → deploy olunduğu gün indeks internetdən açıq olacaq |

### 8.3 NLP nümunə testi

Sorğu: **"Bakıda 2020-dən yuxarı ağ BMW 530 50 minə qədər"**

| Gözlənilən | Faktiki |
|---|---|
| `city=Bakı` | ✅ `region=baki` |
| `price<=50000` | ✅ `priceMax` |
| `make=BMW, model=530` | ⚠️ yalnız `keywords`-a düşür (struktur filtr yox) |
| `year>=2020` | ❌ **itir** (promptda `year` sahəsi yoxdur) |
| `color=white` | ❌ **itir** (parse olunur, filtrdə istifadə olunmur) |
| `category=auto` | ⚠️ `vertical`/`category` heuristikası ilə |

---

## 9. AUTHENTICATION & SECURITY

### 9.1 Production-ready hissələr (SAXLANMALI) ✅

| Komponent | Sübut |
|---|---|
| **argon2id** (memoryCost 19456, timeCost 2, parallelism 1) — OWASP 2024 uyğun | `auth.service.ts:35-40` |
| Refresh token DB-də **SHA-256 hash** kimi | `auth.service.ts:169,183-185` |
| **Atomik rotation + reuse detection** (`updateMany().count !== 1`) tək `$transaction`-da | `auth.service.ts:99-121` |
| **Default-deny** qlobal `JwtAuthGuard`, açılış yalnız `@Public()` ilə (25 istifadə) | `app.module.ts:66-68` |
| HS256 alg-pinning + `payload.type !== 'access'` yoxlaması (alg-confusion və token-swap müdafiəsi) | `jwt.strategy.ts:11-24` |
| `JWT_SECRET` min 32 simvol, default **yoxdur**, `generateValue: true` | `env.validation.ts:15`, `render.yaml:40-41` |
| **ERP HMAC guard** — kanonik imza, `timingSafeEqual`, 5dəq pəncərə, Redis `SET NX PX` nonce | `erp-auth.guard.ts:49-113` — **layihənin ən yetkin təhlükəsizlik komponenti** |
| `ValidationPipe` `whitelist + forbidNonWhitelisted + transform` → mass-assignment müdafiəsi | `main.ts:43-51` |
| Xəta filtri stack trace-i **yalnız server loguna** yazır | `all-exceptions.filter.ts:32-39,76-85` |
| Media: sharp ilə webp re-encode (EXIF itir), SVG rədd, UUID ad, `limitInputPixels` | `media.service.ts:48-72` |
| **IDOR müdafiəsi tam** — listings/chat/saved-searches/notifications/favorites hamısında sahiblik yoxlanır | `listings.service.ts:267,288`, `chat.service.ts:89,121`, və s. |
| **SQL injection praktiki olaraq yoxdur** — yeganə `$executeRawUnsafe` `NODE_ENV!=='test'` ilə bloklanır | `prisma.service.ts:30-39` |
| CSRF vektoru yoxdur (Bearer header, cookie deyil) | `lib/api.ts:11` |
| `.env` git-də **yoxdur** (`git ls-files \| grep env` → yalnız `.example`) | `.gitignore:4-5` |

### 9.2 Kritik boşluqlar

| # | Severity | Tapıntı |
|---|---|---|
| A-01 | CRITICAL | Refresh token frontend-də atılır → 15 dəq-də logout (C-10) |
| A-02 | CRITICAL | Telefon OTP 404 (C-11) |
| A-03 | CRITICAL | **RBAC praktiki olaraq yoxdur** — bütün API-də 1 `@Roles`. 6 rol (`user/pro/business/moderator/admin/super_admin`) heç bir endpoint açmır |
| A-04 | CRITICAL | **`UsersModule` boşdur** — `ls api/src/modules/users/` → yalnız `{dto}` adlı boş qovluq. Profil redaktəsi, parol dəyişmə, hesab silmə **yoxdur** (GDPR riski) |
| A-05 | CRITICAL | **Email verification və şifrə bərpası yoxdur** — parolunu unudan istifadəçi hesabını əbədi itirir. `PasswordResetToken`/`EmailVerificationToken` modeli yoxdur. `login/page.tsx:60` "Şifrəni unutdun?" düyməsinin `onClick`-i yoxdur |
| A-06 | CRITICAL | Rate limiting sıradan çıxıb (C-12) |
| A-07 | HIGH | Access token **localStorage-də** → XSS-də tam hesab ələ keçirmə. CSP olmaması riski artırır |
| A-08 | HIGH | Logout yalnız client-side — `POST /auth/logout` heç vaxt çağırılmır → refresh token DB-də 7 gün diri qalır |
| A-09 | HIGH | `UserStatus` (`banned/suspended/pending`) **heç vaxt yazılmır** → ban sistemi işləmir |
| A-10 | HIGH | **Mağaza yaradılması rolu şərtsiz `business`-ə dəyişir** — `stores.service.ts:61-64`. Admin/moderator öz mağazasını yaratsa **imtiyazını itirir**, geri qaytarmaq üçün API yoxdur |
| A-11 | HIGH | **Admin istifadəçisi yaratmaq mexanizmi yoxdur** — seed-də admin yoxdur, rol dəyişən endpoint yoxdur → admin panelə heç kim girə bilmir (yalnız birbaşa SQL). *Müsbət: hardcoded admin parolu da yoxdur* |
| A-12 | HIGH | Public siyahıda `contactPhone` (C-14) |
| A-13 | HIGH | Legacy `backend/src/routes/upload.js:14-27` — uzantı `originalname`-dən alınır, `fileFilter` yalnız client `mimetype`-ə baxır, `express.static` ilə servis olunur → **saxlanan XSS**. *Deploy olunmur, amma repo-da qalır* |
| A-14 | MEDIUM | Frontend-də **CSP / X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy yoxdur** (canlı təsdiqləndi). `next.config.ts`-də `headers()` funksiyası yoxdur. `x-powered-by: Next.js` açıqdır |
| A-15 | MEDIUM | Ban edilmiş istifadəçinin access tokeni 15 dəq etibarlı qalır — `jwt.strategy.ts` DB/Redis-ə baxmır |
| A-16 | MEDIUM | Refresh reuse aşkarlandıqda **token ailəsi ləğv edilmir** → oğrunun tokeni 7 gün işləyir |
| A-17 | MEDIUM | **Rəy sistemi əməliyyat təsdiqi tələb etmir** → saxta rəy fabriki (`reviews.service.ts:13-35` yalnız self-review yoxlayır) |
| A-18 | MEDIUM | Şikayətdə dublikat yoxlaması və ayrıca limit yoxdur → report-bombing |
| A-19 | MEDIUM | Vaxtı keçmiş refresh token-lər **heç vaxt təmizlənmir** → 100k aktiv istifadəçidə gündə ~10M sətir |
| A-20 | MEDIUM | AI `image` sahəsində `@Matches(/^data:image\//)` yoxlaması yoxdur (`ai.controller.ts:17`) — ixtiyari URL Groq-a ötürülür |
| A-21 | MEDIUM | `isPhoneVerified`/`isEmailVerified` heç vaxt `true` olmur və heç bir qapı şərti kimi işlədilmir → təsdiqsiz istifadəçi limitsiz elan yerləşdirir |
| A-22 | HIGH | **ERP `webhookSecret` DB-də PLAINTEXT** — `schema.prisma:747`, şifrələmə yoxdur (`apiKey` isə düzgün hash-lənib) |
| A-23 | MEDIUM | Legacy Express-də CORS `'*'` + `credentials: true`, xəta mesajı sızması, `hash-admin.js:4` default `admin123` |
| A-24 | LOW | Auth üçün **heç bir test yoxdur** |
| A-25 | LOW | `/auth/logout` body-dəki tokenin çağırana aid olduğunu yoxlamır |
| A-26 | LOW | `CreateListingDto.attributes` — açar sayı/ölçü limiti yoxdur (body limit 8MB); şəkil URL-i ixtiyari xarici host ola bilər |

---

## 10. FRONTEND ASSESSMENT

### 10.1 Komponent inventarı (147 fayl)

| Kateqoriya | Say | Qeyd |
|---|---|---|
| Ümumi | **147** | — |
| Backend çağıran | 35 | — |
| **REAL** (mövcud endpoint) | **14** | `CityPicker`, `Header`, `InfiniteListings`, `NotificationBell`, `ReportButton`, `SaveSearchButton`, `SellerReviews`, `MessageSeller`, + 6 (bug/ölü) |
| **BROKEN** (endpoint yoxdur) | **21** | 4.1 cədvəlinə bax |
| **MOCK** | **29+** | aşağıda |
| **İSTİFADƏSİZ** (0 import) | **67** | aşağıda |
| **Əməli ölü/əlçatmaz** | **≈75 (51%)** | 67 + transitiv əlçatmaz 6 + şərhdə 2 |

**İSTİFADƏSİZ 67 komponent:**
`AIAssistant, AIFraudScore, AIListingRewrite, AISmartSuggest, AutoCategorize, AutoRenewToggle, AvatarUploader, BestTimeToPublish, BoostModal, BulkPriceUpdate, BusinessPanel, BuyerProfilePreview, CategoryGrid, CategoryTiles, CountdownTimer, CurrencyToggle, DensityToggle, DraftBanner, DraftRestoreBanner, DuplicateListingButton, FeaturedCarousel, FollowButton, LangToggle, ListingForecast, ListingMiniStats, ListingTemplate, LiveBidding, LiveDealsTicker, LivePresence, MeetingScheduler, ModeToggle, NotificationsDropdown, PriceInsight, PricingAssistant, PrintListing, ProTipsCarousel, QrShare, QuickPriceEstimate, QuickView, QuickViewModal, ReadMore, RealEstateAdvancedModal, RecentlySoldFeed, RecentlyViewed, RulesChecker, ScheduledListing, SearchAutocomplete, SearchHistory, SecretChat, SellerCard, ServiceReminder, ShareButton, ShareMenu, SmartInbox, SmartSuggestionsForYou, SoldReservedBadge, Stories, SuperSearch, TestDriveBooking, TrendingSearches, VerifiedBadge, View360, VoiceNote, VoiceSearch, WatermarkInfo, WishlistGroups, XPBadge`

**MOCK nümunələri (fayl:sətir):**
`ListingForecast.tsx:12-15` (Math.random), `LivePresence.tsx:5` ("Mock live presence — gerçəkdə Socket.io"), `LiveDealsTicker.tsx:19`, `LiveViewerStats.tsx:12-13`, `MapInner.tsx:35` (`jitter()` saxta koordinat), `PriceHistory.tsx:5-7` ("Mock: 6 nöqtə"), `QuickPriceEstimate.tsx:11`, `profil/elanlarim/[id]/stats/page.tsx:19-27` ("Demo data"), `profil/balans/page.tsx:6-11` (`DEMO_TX`), `profil/sebet/page.tsx:38-41` ("demo"), `profil/ayarlar/page.tsx:24-34`, `elaqe/page.tsx:24`, `lab/LabClient.tsx:7-33`, `SmartAlerts.tsx:5-9`, `ReferralProgram.tsx:7,19-21`, `AchievementBadges.tsx:4-11`, `LoyaltyPoints.tsx:4`, `TelegramBotConnect.tsx:6,16`, `EmailDigest.tsx:9-12`, `AutoReplyBot.tsx:16`, `SellerVerification.tsx:20-23`, `PlateLookup.tsx:54` ("Demo məlumatlar"), `View360.tsx:25` ("Demo: gerçəkdə Pannellum"), `AIAssistant.tsx:66` ("Mock AI — gələcəkdə Anthropic Claude API"), `WishlistGroups.tsx`, `SearchHistory.tsx`, `PriceDropAlert.tsx`, `DuplicateListingButton.tsx`, `VINChecker.tsx:26-45` (`checksum % 7 === 0` ilə uydurma "sığorta hadisəsi riski" — **hüquqi risk**), `TrustScore.tsx:4-12` (istifadə etdiyi sahələr API cavabında yoxdur → bal həmişə 50).

### 10.2 [HIGH] `/profil` dashboard-un çoxu hardcoded

`LoyaltyPoints` (1240 xal), `SmartAlerts`, `ReferralProgram` (12 dəvət/8 qoşulub/40 ₼), `AchievementBadges` — hamısı `profil/page.tsx:8-11,61-69`-da render olunur. **Hər istifadəçi eyni rəqəmləri görür.**

### 10.3 [HIGH] `/lab` — 200+ "funksiya" sırf vitrindir

`frontend/lib/lab-features.ts` (266 sətir) + `LabClient.tsx:23-34` — `toggle()` yalnız `Set`-i localStorage-a yazır. İstifadəçi "AI Negotiation Bot", "Voice-to-Listing" aktivləşdirir, heç nə dəyişmir.

### 10.4 [MEDIUM] Orphan "köhnə arxitektura" alt-ağacı — 7 fayl

`app/elanlar/ListingsClient.tsx`, `app/elanlar/[id]/ListingDetailClient.tsx`, `app/emlak/RealEstateClient.tsx`, `app/neqliyyat/TransportClient.tsx`, `app/k/[category]/CategoryFilterClient.tsx`, `app/seher/[city]/CityFilterClient.tsx`, `app/seher/[city]/[category]/CityCategoryFilterClient.tsx` — **heç bir aktiv `page.tsx` onları import etmir**. `next.config.ts`-dəki şərh bunu təsdiqləyir (dairəvi redirect refaktorinqindən sonra silinməyiblər). Bu ağac içində 13+ sınıq endpoint çağırışı saxlayır.

### 10.5 Build vəziyyəti (faktiki icra edilib)

```
frontend: npx tsc --noEmit --incremental false  → 11 xəta (exit 2)
          hamısı TS7006 (implicit any), hamısı components/TransportFullFilter.tsx-də (ölü fayl)
          tsconfig: "strict": true

api:      npx tsc --noEmit --incremental false  → 0 xəta (exit 0)
api:      npx eslint "src/**/*.ts"              → 0 problem (exit 0)
api:      npx jest --ci                         → Test Suites: 1 failed, 7 passed, 8 total
                                                   Tests: 3 failed, 9 passed, 12 total
          FAIL src/modules/listings/listings.service.spec.ts
          "Nest can't resolve dependencies of the ListingsService (PrismaService,
           CategoriesService, ?). ... SearchService at index [2]"
```

**Vacib düzəliş:** `frontend/next.config.ts`-dəki şərh — *"Faza 1: ~140 komponentdə köhnə implicit-any tipi borcu var"* — **KÖHNƏLİB**. Faktiki tip borcu **11 xəta / 1 fayl**dır (o fayl da ölü koddur). Yəni `typescript.ignoreBuildErrors: true` və `eslint.ignoreDuringBuilds: true` bayraqları **artıq lazımsızdır** və bir neçə saatlıq işlə söndürülə bilər. Hazırda onlar gələcək real xətaları da gizlədir — bu, davam edən risk mənbəyidir.

---

## 11. MARKETPLACE FEATURE MATRIX

| Funksiya | Status | Backend | Frontend | Qeyd |
|---|---|---|---|---|
| favorites | ✅ WORKING | `favorites.service.ts:21-51` | `lib/favorites.ts:1-46` | Qonaq → auth **merge yoxdur** (login-də localStorage sevimliləri itir) |
| chat/mesajlaşma | ⚠️ WORKING (polling) | `chat.service.ts` (yalnız REST) | `profil/mesajlar:49` `setInterval(5000)` | **WebSocket Gateway yoxdur**; `socket.io-client` package.json-da var, **heç yerdə import olunmur** |
| notifications | ⚠️ PARTIAL | yalnız 2 tetikləyici: `chat.service.ts:133`, `reviews.service.ts:41` | `NotificationBell:37` (30s poll) | `price_drop`, `saved_search`, `moderation`, `erp_sync_error` enum-da var, **heç biri işlədilmir**. Push/Email/SMS **yoxdur** |
| saved searches | ⚠️ PARTIAL | yalnız CRUD | `SaveSearchButton:43` "xəbər tutacaqsınız" | **Matcher job yoxdur** — `grep "@Processor\|new Worker\|@Cron" api/src` → 0. **UI yalan vəd verir** |
| reviews | ⚠️ WORKING (nəzarətsiz) | `reviews.service.ts:13-50` | `SellerReviews`, `/profil/reyler` | Əməliyyat təsdiqi yoxdur; `/profil/reyler:58` "əməliyyatdan sonra rəy yaza bilər" — **yalan** |
| seller rating | ❌ BROKEN | `ListingResponse`-da sahə **yoxdur** | `ListingCard:33,185` gözləyir | Reytinq ulduzu **heç vaxt göstərilmir** |
| business accounts | ⚠️ PARTIAL | `stores.service.ts:61-64` | `/biznes` "Seç" → `href='#'` | Real qeydiyyat/ödəniş axını yoxdur |
| shops/mağaza | ⚠️ PARTIAL | ✅ real, test var | ❌ **`/magaza` route YOXDUR** | Backend hazırdır, UI heç istifadə etmir |
| moderation | ❌ MISSING | — | `/admin/moderation` → 404 | Auto-publish |
| reporting | ⚠️ PARTIAL | yalnız `POST /reports` | `ReportButton` işləyir | GET/PATCH yoxdur → şikayət **əbədi `open`** |
| VIP | ❌ MOCK | `isVip` əsas `orderBy`-da **yoxdur** | `BoostModal:17-21` yalnız `toast` | Set edən endpoint yoxdur, `vipUntil` sahəsi yoxdur |
| Premium | ❌ MOCK | `isPremium` heç yerdə sıralamada yoxdur | eyni | Dekorativ bayraq |
| bump/irəli çək | ❌ MOCK | endpoint yoxdur | `BoostModal` hardcoded planlar | `docs/v2/11:36-44`-də planlaşdırılıb, yazılmayıb |
| payments | ❌ MISSING | `prisma.payment` → 0 istifadə | — | Yalnız sxem |
| subscriptions | ❌ MISSING | `prisma.package/subscription` → 0 | `/biznes` statik | Yalnız sxem |
| analytics | ❌ MOCK | `ListingStatDaily` → 0 istifadə | `stats/page.tsx:25-26` `Math.random()` | — |
| recommendations | ✅ WORKING | `findSimilar()` real DB sorğusu | elan detalında | — |
| recently viewed | ✅ WORKING (local) | — | `lib/recent.ts` | Cihazlararası sinxr. yoxdur |
| compare | ✅ WORKING (local) | — | `lib/compare.ts` | ⚠️ `/muqayise` envelope bugu ilə **boş görünür** |
| map search | ❌ BROKEN | radius/bbox parametri **yoxdur** | `MapView` **əlçatmaz** (orphan zəncir) | `MapInner:35` saxta jitter koordinat |
| AI listing creation | ⚠️ WORKING (kod) | `ai.controller.ts` real, kateqoriya **DB-dən dinamik** çəkilir | `/ai-elan` | ❌ prod-da GROQ açarı yox |

**Ödəniş provayderi:** `grep -rniE "epoint\|pasha\|kapital\|payriff\|stripe" api/ frontend/` → **yalnız 2 statik mətn faylı** (`qaydalar/page.tsx:49`, `mexfilik/page.tsx:45` — "Pulpal, Epoint" adları çəkilir). **Kodda sıfır inteqrasiya.** Hüquqi/uyğunluq riski: istifadəçi razılaşması mövcud olmayan xidməti təsvir edir.

---

## 12. SEO ASSESSMENT

| # | Severity | Tapıntı | Sübut |
|---|---|---|---|
| SEO-01 | CRITICAL | **Canlı sitemap cəmi 5 URL** | `curl .../sitemap.xml` → 853 bayt, 5 `<loc>`, yalnız statik path. `sitemap.ts:59` limit=50, API sorğuları sükutlu `catch { }` bloklarında udulur (`:40,53,71`) |
| SEO-02 | CRITICAL | **`/elanlar` və bütün facet URL-ləri root-a canonical verir** | canlı HTML: `rel="canonical" href="https://360tap.az"`. `/elanlar/page.tsx`-də `generateMetadata` **yoxdur** |
| SEO-03 | CRITICAL | **hreflang mövcud olmayan `/ru`, `/en` səhifələrinə yönləndirir** | `layout.tsx:32-39` `alternates.languages`; `frontend/app` altında `/ru`, `/en` qovluğu **yoxdur** → GSC hreflang xətaları |
| SEO-04 | HIGH | `/elanlar/[id]`-də canonical yoxdur; `jsonLdProduct` helper istifadə olunmur | `elanlar/[id]/page.tsx:35-53`, `:105-114` |
| SEO-05 | HIGH | Pagination tam client-side, crawl edilə bilən səhifə yoxdur | `InfiniteListings.tsx` — `?page=N` URL, `rel=next/prev` yoxdur → hər filtrdə yalnız ilk 50 elan indeksləşə bilər |
| SEO-06 | HIGH | `Breadcrumb`, `jsonLdItemList`, `jsonLdFAQ`, `jsonLdLocalBusiness` **ölü koddur** | `lib/seo.ts:127-213` tərif olunub, heç yerdə çağırılmır |
| SEO-07 | MEDIUM | Elan URL-i **UUID**, slug istifadə olunmur | `ListingCard.tsx:99` `/elanlar/${item.id}`; `schema.prisma:287` slug var, unique deyil, indeksli deyil |
| SEO-08 | MEDIUM | `/k/[category]`, `/seher/[city]` sadəcə redirect — real məzmun yoxdur, amma `opengraph-image.tsx` yazılıb (ölü kod). robots allow edir, sitemap generasiya etmir |
| SEO-09 | MEDIUM | `/elanlar/[id]/opengraph-image.tsx` **köhnə API sxemi** istifadə edir (`d.listing`, `city_name`, `media`) → paylaşım şəkli həmişə fallback |
| SEO-10 | LOW | `robots.ts` `/blog` allow edir, route mövcud deyil |

**JSON-LD mövcud:** `Organization` + `WebSite/SearchAction` (`layout.tsx:127-134`) hər səhifədə; sadə `Product` (`elanlar/[id]/page.tsx:105-114`, `sku`/`seller`/`aggregateRating`/`condition` yoxdur).

---

## 13. PERFORMANCE & SCALABILITY

### 13.1 Backend / DB (1M+ elan hədəfi)

| Problem | Təsir |
|---|---|
| Uyğun composite indeks yoxdur | Kateqoriya/rayon səhifəsi saniyələrlə açılacaq |
| **Offset pagination + hər sorğuda filtrli `COUNT(*)`** (`listings.service.ts:423-432`) | `page=500` praktiki olaraq işləməyəcək; 1M sətirdə `COUNT(*)` saniyələr |
| `price`/`views` indekssiz sıralama | filesort |
| `ILIKE '%..%'` | tam seq scan |
| `attributes` JSONB indekssiz | hər vertikal filtr tam skan |
| Hər `?category=` sorğusunda **bütün kateqoriya cədvəli yaddaşa yüklənir** (`listings.service.ts:340`) | keşsiz, materialized path yoxdur |
| Hər `GET /listings/:id`-də `views` UPDATE | hot-row kilidi + WAL yükü |
| Connection pooling yoxdur | horizontal scale-in ilk anında bağlantı limiti sınacaq |
| Partition/retention yoxdur | `SearchLog`, `ErpSyncLog`, `ListingStatDaily` idarəolunmaz böyüyəcək |
| `expires_at` emal olunmur | aktiv elan sayı yalnız artır |
| `RefreshToken` təmizlənmir | 100k aktiv istifadəçidə gündə ~10M sətir |
| **Chat polling** 5s | 100k istifadəçidə ~20 000 req/s (1-5% aktiv olsa belə 200-1000 req/s) yalnız çat üçün |

### 13.2 Frontend

| Problem | Sübut |
|---|---|
| 36 route-dan **21-i (57%) `'use client'`** | SEO + LCP itkisi |
| **29 xam `<img>`** vs 5 faylda `next/image` | `Gallery.tsx`, `QuickView`, `SellerCard`, profil səhifələri — optimallaşma/lazy-load itir |
| `/elanlar/[id]` `cache: 'no-store'` + `ListingCard` `prefetch={true}` | Infinite-scroll-da hər görünən kart backend-ə tam round-trip prefetch göndərir → **Render free tier-ə ağır yük** |
| Font `@import` (`globals.css:1`) `next/font` əvəzinə | render-blocking round-trip, FOUT/CLS |
| `generateStaticParams` **heç yerdə istifadə olunmur** | ISR-dən faydalanılmır |
| Yalnız 1 `dynamic()` (`MapView.tsx:7`) | qalan ağır komponentlər əsas bundle-da |
| **Server-side `fetch`-də timeout yoxdur** | C-02 — backend ölərsə səhifə sonsuz asılır |
| 51% ölü komponent | build vaxtı + typecheck yükü |

### 13.3 Infrastruktur

- **Render FREE tier:** 15 dəq passivlikdən sonra yuxu, efemer disk, tək region (US — Azərbaycan istifadəçiləri üçün yüksək gecikmə), pulsuz Postgres limitləri.
- Keep-alive iki qatda (GitHub Actions cron + client-side skript) — bu, problemin **simptomunu** örtür, həllini yox.
- **Docker root istifadəçi ilə işləyir** və hər start-da `prisma:seed` çağırır (`api/Dockerfile:14-26`) — production DB-yə yazma riski.
- CI/CD: yalnız keep-alive cron. **Test/lint/build gate yoxdur.**
- `vercel.json` yoxdur → region, funksiya limitləri, headers, cache siyasəti təyin olunmayıb.
- `API_ORIGIN` Vercel-də təyin olunmasa, `next.config.ts` dev fallback-ına düşür və `localhost:5400`-ə (Express) getməyə çalışır.

---

## 14. DEPLOYMENT & INFRASTRUCTURE

| Element | Vəziyyət |
|---|---|
| Frontend | Vercel (`frontend/.vercel/project.json`), `vercel.json` **yoxdur** |
| Backend | Render **free tier**, Docker (`api/Dockerfile`), `healthCheckPath: /health` |
| DB | Render free Postgres (`plan: free`) |
| Redis | Render free Key Value — **BullMQ-də heç bir processor yoxdur**, yalnız ThrottlerStorage üçün də istifadə edilmir (in-memory qalıb) |
| Meilisearch | **Deploy olunmayıb** (`MEILI_HOST=localhost:7700`) |
| Obyekt storage | **YOXDUR** |
| Disk / volume | **YOXDUR** → efemer (C-04) |
| CI/CD | yalnız `.github/workflows/keep-alive.yml` |
| CORS | `render.yaml:56-57` — **canlı domen `https://360tap.az` whitelist-də YOXDUR** (yalnız `360tap-az.vercel.app` + `localhost:5401`). Hazırda funksional problem yaratmır (proxy), amma WebSocket əlavə ediləndə səssiz sınacaq |

**Env dəyişənləri (dəyərlər göstərilmir):**

| Dəyişən | `.env.example` | `render.yaml` | Problem |
|---|---|---|---|
| `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_*`, `THROTTLE_*`, `REDIS_URL`, `CORS_ORIGINS` | ✅ | ✅ | — |
| `MEILI_HOST` / `MEILI_KEY` | ✅ | ⚠️ | render.yaml-da `localhost:7700`/boş; dashboard-da Meili Cloud-a yönəldilib, **amma o instans canlıda ölüdür** |
| **`MEDIA_DIR`** | ✅ | ❌ **YOXDUR** | default `./uploads` → efemer |
| `MEDIA_BASE_URL` | ✅ | ✅ | — |
| **`GROQ_API_KEY`, `GROQ_MODEL`** | ✅ | ❌ **YOXDUR** | dashboard-da əl ilə əlavə olunub (tarixçəyə görə) → **blueprint drift** (C-09) |
| **`API_ORIGIN`** (frontend) | — | Vercel-də (koddan görünmür) | təyin olunmasa dev fallback-a düşür |
| `NEXT_PUBLIC_MEILI_*` | — | — | `lib/meili.ts:3-7` **hardcoded** |

✅ `.env` faylları git-ə düşməyib (`git ls-files | grep env` → yalnız `.example`).

---

## 15. LEGACY / DUPLICATE CODE

### 15.1 `backend/` — köhnə Express qatı

**Deploy olunmur** — `render.yaml`-da yalnız `tap360-api` (`dockerfilePath: ./api/Dockerfile`). `DEPLOY.md` təsdiqləyir: *"Express-ə qalan funksiyalar (chat, bəzi köhnə route-lar) deploy olunmur."*

**~60 Express endpoint-dən ~24-ü NestJS-də var, ~36-sı yoxdur.**

**İKİ AYRI DB:** `backend/.env` → `avito_az`, `api/.env` → `marketplace_dev`. Cədvəl adları da fərqlidir:

| Express (`001_init.sql`) | NestJS (`schema.prisma`) |
|---|---|
| `cities` (:56) | `regions` + `districts` (2 səviyyəli, fərqli model) |
| `listing_media` (:111) | `listing_images` (:360) |
| `chats` (:136) | `conversations` (:550) |
| `complaints` (:172) | `reports` (:600) |

**[HIGH] Legacy kod onsuz da sınıq idi:** `backend/src/routes/ai.js:16`, `smart-search.js:167`, `realestate.js:18,39,145`, `image-search.js:83,122` — hamısı `WHERE status='published'` yoxlayır, amma `001_init.sql:87` default `'active'`-dir və `'published'` heç yerdə set edilmir → bu 12+ sorğu **legacy DB-də belə həmişə boş nəticə qaytarırdı**. `ai.js:191-208` isə `ORDER BY m.position` yazır, sütun adı `sort_order`-dir (`001_init.sql:116`) → DB xətası.

**Dəyərli məntiqin taleyi:**

| Fayl | Tale |
|---|---|
| `voice-parser.js` | **İTİRİLİB** (il/qiymət regex parse-ı — funksional geriləmə, bax S-06) |
| `smart-search.js`, `search-helpers.js` | İTİRİLİB (Meili ilə konseptual əvəzlənmə) |
| `image-search.js` (pg-trigram) | İTİRİLİB (Groq vision ilə əvəzlənib) |
| `insights.js` (qiymət mövqeyi) | İTİRİLİB |
| `realestate.js` (6 endpoint) | **İTİRİLİB** — `RealEstateDetails` modeli var, controller yoxdur |
| `import.js` (Excel) | **İTİRİLİB** — `ImportJob` modeli var, kod yoxdur → `/elan-yerlesdir/toplu` sınıq |
| `ai.js` (7 endpoint) | **HAMISI İTİRİLİB** — 5 frontend komponenti hələ də onları çağırır |
| `chats.js` | Əsas hissə köçüb; `unread-count`, tam detal, **real-time** itirilib |
| `complaints.js` | POST köçüb, `GET /me` itirilib |
| `notifications.js`, `saved-searches.js` | ✅ Tam köçüb |
| `cities.js` | Əvəzlənib (regions/districts) — 3 komponent hələ `/cities` çağırır |
| `clientlog.js` | İtirilib (dəyərsiz) |

**[CRITICAL] Dev ↔ Prod rewrite fərqi:** `frontend/next.config.ts` — production-da BÜTÜN `/api/*` NestJS-ə gedir; dev-də isə **yalnız** `/api/health`, `/api/geo/*`, `/api/media/*` NestJS-ə, **qalan hamısı legacy Express-ə (5400)**. Nəticə: developer lokalda `/api/ai/*`, `/api/realestate/*`, `/api/voice/*`, `/api/import/*`, `/api/cities`, `/api/auth/send-otp`, `/api/insights/*`, `/api/search-smart/*` funksiyalarının **işlədiyini görür**, production-da isə hamısı 404. Bu, 4-cü bölmədəki 24 sınıq endpoint-in niyə fərq edilmədiyini izah edir. Əlavə: Express `bcrypt`, NestJS `argon2` istifadə edir → parol hash-ləri **uyğunsuzdur**.

**[MEDIUM] socket.io:** `backend/src/socket.js` (115 sətir, JWT-auth, `chat:typing/send/read`) — NestJS-də **WebSocket Gateway yoxdur** (`find api/src -iname "*gateway*"` → boş). `socket.io-client` `frontend/package.json:18`-də asılılıq kimi var, **heç yerdə import olunmur** → ölü asılılıq.

### 15.2 Frontend daxili duplikatlar

- 7 orphan `*Client.tsx` (10.4-ə bax)
- `ReportButton` (işlək, `/reports`) vs `ReportModal` (sınıq, `/listings/:id/report`)
- `QuickView` vs `QuickViewModal` (hər ikisi ölü, eyni bug)
- `QRCodeShare` vs `QrShare`, `ShareButton` vs `ShareMenu`, `NotificationBell` vs `NotificationsDropdown`
- `transport-data.ts` / `realestate-data.ts` — DB-dəki `Brand`/`VehicleModel` və `Region`/`District` ilə duplikat
- `backend/src/routes/smart-search.js.bak`, `backend/src/index.js.bak` — backup fayllar
- `backend/import-magazam.cjs` — hardcoded `/Users/mr.maqa/Downloads/...` yolu ilə birdəfəlik lokal skript

### 15.3 Yekun qərar: `backend/` **SİLİNMƏLİDİR**

Production-a təsiri **yoxdur** (deploy olunmur), ona görə silmək canlı sayta təhlükəsizdir.

**Silinsə nə sınar:**
- Production-da: **HEÇ NƏ**
- Dev-də: `next.config.ts` dev rewrite-ları düzəldilməzsə, yuxarıda sadalanan bütün `/api/*` yolları connection-refused alacaq

**Silmədən əvvəl mütləq:**
1. `next.config.ts` dev rewrite-larını production ilə eyniləşdir (bütün `/api/*` → NestJS)
2. Production DB-də `admin@360tap.az` hesabının parolunun `admin123` olmadığını yoxla (`backend/src/scripts/hash-admin.js:4` default)
3. Köçürülməli məntiq üzrə qərar ver: `voice-parser` (il/qiymət parse), `realestate` (6 endpoint), `import` (Excel) — literal köçürmə mümkün deyil (DB sxemi fərqli), **yenidən yazılmalıdır**

---

## 16. WHAT CAN BE KEPT (SAXLANMALI)

### Arxitektura və stack
✅ **NestJS 10 + Prisma 5 + PostgreSQL + Next.js 15 App Router + Tailwind** — hədəf üçün düzgün seçimdir, dəyişdirilməməlidir
✅ **Modul strukturu** (`api/src/modules/*`) — sağlam, genişlənə bilən
✅ **Prisma sxeminin skeleti** — 38 model, sıfır drift, `docs/v2` dizaynı ilə uyğun

### Backend komponentləri
✅ `auth.service.ts:35-40` — **argon2id** parametrləri (OWASP uyğun)
✅ `auth.service.ts:99-121` — atomik refresh rotation + reuse detection
✅ `app.module.ts:66-68` + `jwt-auth.guard.ts` — **default-deny** qlobal guard modeli
✅ `jwt.strategy.ts:11-24` — HS256 pinning + token tipi yoxlaması
✅ `main.ts:43-51` — `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`)
✅ `all-exceptions.filter.ts` — məlumat sızması yoxdur, Prisma xətaları düzgün map olunur
✅ `erp-auth.guard.ts` (bütöv) — **layihənin ən yetkin komponenti**; HMAC + `timingSafeEqual` + timestamp pəncərəsi + Redis nonce
✅ `erp.service.ts:95-190` — idempotent hash + Serializable tranzaksiya
✅ `media.service.ts:48-72` — sharp re-encode, blurhash, SVG rədd, UUID ad *(yalnız storage hədəfi dəyişməlidir)*
✅ `listings.service.ts:140-218` — `validateAttributes()`, 8 AttributeType üçün tam validasiya, AZ xəta mesajları
✅ `listings.service.ts:57-130` — create() axını (yoxlamalar + `$transaction` + best-effort indeksləmə)
✅ `listings.service.ts:236-249` — `findSimilar()` real DB sorğusu
✅ `listings.service.ts:319-361` — region-first filtr + kateqoriya alt-ağacı BFS (məntiq düzgündür)
✅ `categories.service.ts:13-46` — `getTree()` tək sorğu + in-memory ağac (N+1 yoxdur)
✅ `geo.service.ts` + `utils/haversine.ts` — test edilib, düzgün
✅ `prisma.service.ts:30-32` — `cleanDatabase()` production qorunması
✅ DTO qatı (`create-listing.dto.ts` — valyuta/telefon regex, `IsLatitude`, max 20 şəkil)

### Data / məzmun
✅ **`api/prisma/seed/categories.ts` (554 sətir)** — 117 kateqoriya node, 3 səviyyə, 71 atribut dəsti, **141 atribut tərifi**. Məzmun keyfiyyəti Tap.az/OLX səviyyəsindədir. Bu, layihənin **ən dəyərli data aktivi**dir
✅ `api/prisma/seed/regions.ts` — 73 region, ~84 rayon, real koordinatlarla (Bakı 12 inzibati rayonla)
✅ `NearbyDistrict` haversine seed-i
✅ `api/prisma/seed.ts` — tam idempotent upsert məntiqi

### Frontend
✅ `/`, `/elanlar`, `/elanlar/[id]` SSR axını (kod düzgündür)
✅ **Uçdan-uca data-driven filtr zənciri** (`elanlar/page.tsx:155-195` + `CategoryFilters.tsx` + `listings.service.ts:387-405`) — sistemdə yeganə işləyən dinamik filtr yolu, üzərinə tikilməlidir
✅ Dizayn sistemi / Tailwind konfiqurasiyası, mobil hamburger menyu (`Header.tsx:143-219`), bottom-sheet filtr pattern-i
✅ `lib/seo.ts` helper-ləri (yazılıb, sadəcə qoşulmayıb)
✅ `lib/favorites.ts`, `lib/compare.ts`, `lib/recent.ts` — sadə və işlək

---

## 17. WHAT MUST BE REFACTORED

| # | Sahə | Nə edilməli |
|---|---|---|
| R-01 | **Sessiya / token** | Refresh token-i `httpOnly+Secure+SameSite` cookie-yə keçir; access token yaddaşda; `lib/api.ts`-ə 401 interceptor + single-flight refresh; `logout()` `POST /auth/logout` çağırsın; `logout-all` + `GET /auth/sessions` əlavə et |
| R-02 | **Cavab zərfi** | `lib/api.ts`-də mərkəzləşdirilmiş `unwrap()`; 10 yerdəki `d.items`/`d.listing`/`l.total` düzəlişi (4.2 cədvəli) |
| R-03 | **İndeks planı** | Partial composite indekslər: `(status, category_id, created_at DESC) WHERE status='active'`, `(status, district_id, created_at DESC)`, `(status, vertical, created_at DESC)`, `(status, price)`, `(status, views)`, `(owner_id, created_at DESC)`; `attributes` üçün `GIN (jsonb_path_ops)` + tez-tez range filtrlənən açarlar üçün ifadə indeksləri |
| R-04 | **Pagination** | Offset → keyset (cursor `(created_at, id)`); dəqiq `COUNT(*)` → təxmini sayğac (Meili `estimatedTotalHits` / `pg_class.reltuples`) |
| R-05 | **FK bütövlüyü** | 20+ FK-sız UUID sütununa relation + `onDelete` siyasəti + indeks (`reports`, `payments`, `conversations.buyer_id/seller_id`, `messages.sender_id`, `audit_logs.actor_id`, ...) |
| R-06 | **Rate limiting** | Custom `ThrottlerGuard.getTracker()`: auth üçün `req.user.sub`, anonim üçün Vercel-in imzalı orijinal client IP-si; `ThrottlerStorageRedis`; login üçün per-identifier lockout; Vercel WAF edge-də |
| R-07 | **Fon prosesləri** | BullMQ-ə real processor-lar: elan expiry, `RefreshToken` cleanup, sayğac uzlaşdırma, `SavedSearch` matcher, Meili reindex |
| R-08 | **`listings.update()`** | Şəkil sinxronizasiyası; `categoryId` dəyişəndə `assertExists` + `vertical` yeniləmə + `validateAttributes`; `attributes` həmişə validasiya olunsun (`if (dto.attributes)` şərtini götür — yoxsa `isRequired` heç vaxt işləmir) |
| R-09 | **Gizlilik** | `contactPhone`-u siyahı cavabından çıxar → `POST /listings/:id/reveal-contact` (auth + throttle + AuditLog); siyahıda lat/lng yuvarlaqlaşdırılsın |
| R-10 | **Chat** | 5s polling → WebSocket Gateway (Redis pub/sub) və ya SSE; oxunma/yazır statusu |
| R-11 | **Təhlükəsizlik başlıqları** | `next.config.ts`-ə `headers()`: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`; `poweredByHeader: false` |
| R-12 | **SSR dayanıqlılığı** | Bütün server-side `fetch`-lərə `AbortSignal.timeout(5000)` + `try/catch` + degradasiya UI |
| R-13 | **Build gate** | Frontend tip borcu cəmi **11 xətadır** — düzəlt və `typescript.ignoreBuildErrors` / `eslint.ignoreDuringBuilds` bayraqlarını **söndür** |
| R-14 | **Test** | `listings.service.spec.ts`-ə `SearchService` mock-u (hazırda düşür); auth üçün spec; e2e (401/403) |
| R-15 | **Docker** | `USER app` (non-root); `prisma:seed`-i CMD-dən çıxar; migration-ı ayrıca pre-deploy step |
| R-16 | **Serializasiya** | `listing-response.dto.ts:74` `price ? Number(price) : null` → `price != null ? price.toString() : null` (price=0 itir) |
| R-17 | **Rəy/şikayət nəzarəti** | Rəy üçün əlaqə/əməliyyat ön şərti; `@@unique([reporterId, listingId])`; ayrıca throttle |
| R-18 | **Kateqoriya ağacı** | `path`/`depth` (materialized path / ltree) sütunları və ya Redis keş — hər sorğuda tam cədvəl yükləməsini aradan qaldır |
| R-19 | **Connection pooling** | `DATABASE_URL`-a `connection_limit`/`pool_timeout`; horizontal scale-dən əvvəl PgBouncer/Accelerate + `directUrl` |
| R-20 | **Ölü kod təmizliyi** | 67 istifadəsiz komponent + 7 orphan `*Client.tsx` + `socket.io-client` asılılığı + `.bak` fayllar |
| R-21 | **Rol məntiqi** | `stores.service.ts:61-64` — yalnız `user`/`pro` → `business`; `sellerType` ilə `role`-u ayır |

---

## 18. WHAT MUST BE REBUILT (YENİDƏN QURULMALI)

### 18.1 Kateqoriya / Atribut engine — **ƏN YÜKSƏK PRİORİTET**

Mövcud model dəyişikliksiz hədəfi ödəyə bilmir. Yeni model:

```prisma
model CategoryAttribute {
  // mövcud: categoryId, key, labelAz, labelRu, type, unit,
  //         isRequired, isFilterable, isSearchable, sortOrder
  labelEn            String?          // YENİ
  groupName          String?          // YENİ — forma qruplaşdırması
  dependsOnKey       String?          // YENİ — kaskad (marka→model)
  showIfValue        Json?            // YENİ — şərti göstərmə
  minValue           Decimal?         // YENİ
  maxValue           Decimal?         // YENİ
  validationRegex    String?          // YENİ
  optionsSource      Json?            // YENİ — {source:'brands', vertical:'transport'}
  isActive           Boolean @default(true)  // YENİ
  options            AttributeOption[]       // YENİ — Json əvəzinə relation
}

model AttributeOption {          // TAMAMİLƏ YENİ
  id             String  @id @default(uuid()) @db.Uuid
  attributeId    String  @db.Uuid
  value          String                // DB-də saxlanan KANONİK dəyər
  labelAz        String
  labelRu        String?
  labelEn        String?
  parentOptionId String? @db.Uuid      // marka opsiyası → model opsiyaları
  sortOrder      Int     @default(0)
  isActive       Boolean @default(true)
  @@unique([attributeId, value])
  @@index([attributeId, parentOptionId, sortOrder])
}

enum AttributeType { ... , reference }   // YENİ dəyər

model VehicleGeneration { ... }          // YENİ — Brand → VehicleModel → Generation
```

**Kritik dizayn prinsipi:** JSONB-də **kanonik `value`** saxlanılsın, göstərilən etiket yox. Hazırda `options` massivi həm etiket, həm dəyərdir (`listings.service.ts:398` `equals: value`) → dil dəyişəndə filtr sınır.

**Əlavə olaraq:**
- `AdminModule`: `POST/PATCH/DELETE /admin/categories`, `/admin/categories/:id/attributes`, `/admin/attributes/:id/options`, `PATCH /admin/categories/reorder` — hamısı `@Roles('admin','super_admin')` + `AuditLog`
- Admin UI: Filter Builder (key/label/tip/options/unit/bayraqlar + canlı önizləmə)
- **Dinamik elan forması**: `categoryId` seçiləndə `GET /categories/:slug/attributes` → tip üzrə input render → `payload.attributes`
- `CategoryFilters.tsx`-ə `multiselect` (checkbox), `range`, `date` render-i
- 359 sətir hardcoded lüğəti (`transport-data.ts`, `realestate-data.ts`) DB-yə köçür və faylları **sil**

### 18.2 Atribut saxlama strategiyası — qərar verilib tətbiq olunmalı

**Tövsiyə olunan model (hibrid, aydın rollarla):**
1. `Listing.attributes` JSONB → **oxu keşi**, `GIN (jsonb_path_ops)` indeksi ilə
2. `ListingAttributeValue` → **yazma zamanı tranzaksiya daxilində doldurulsun** (dəqiq range/multiselect sorğuları üçün, indeksləri artıq var)
3. `VehicleDetails` / `RealEstateDetails` / `JobDetails` → **vertikal-spesifik tipli sürətli sorğular üçün doldurulsun** və çatışmayan sahələr əlavə edilsin
4. Meilisearch → **faceted filtr və axtarış** üçün (CategoryAttribute-dan dinamik `filterableAttributes`)

*Alternativ (daha sadə): 2 və 3-dən imtina edib yalnız JSONB + GIN + generated column indeksləri. Amma o halda `ListingAttributeValue`/`VehicleDetails`/`RealEstateDetails`/`JobDetails` **migration ilə silinməlidir** — hazırkı aralıq vəziyyət ən pisidir.*

### 18.3 Vertikal dərinlik

- **Nəqliyyat:** `VehicleDetails`-ə `generation`, `horsepower`, `marketVersion`, `sellerKind`; `brandId`/`modelId` üçün real relation + FK + indeks; `Brand`/`VehicleModel`/`VehicleGeneration` üçün endpoint-lər; seed-də 70 marka / 800+ model
- **Əmlak:** `Settlement` (qəsəbə) + `MetroStation` modelləri; PostGIS + `geography(Point,4326)` + GIST indeks; `QueryListingsDto`-ya `lat/lng/radiusKm/bbox/polygon`; `pricePerM2` yazı zamanı hesablansın; qaz/su/istilik/lift/parking/balkon atributları
- **İş:** `Resume`, `Candidate`, `JobApplication` modelləri + status axını (`new→shortlist→interview→offer→rejected`); `JobDetails`-ə `employmentType`, `workMode`, `industry`, `salaryPeriod`, `salaryCurrency`; işəgötürən paneli

### 18.4 Axtarış arxitekturası

- **Tək Meilisearch mənbəsi** — Meilisearch Cloud (idarə olunan) tövsiyə olunur; `MEILI_MASTER_KEY` `generateValue`, frontend yalnız **search-only key** ilə və ya SSR vasitəsilə
- Frontend-in birbaşa hardcoded host çağırışını (`lib/meili.ts:3-7`) **sil**, NestJS `GET /search`-ə keç
- `filterableAttributes` `CategoryAttribute.isFilterable`-dan **dinamik** qurulsun (`attr_<key>` prefiksi)
- **Facet sayğacları** (`facets` parametri), autocomplete/suggest endpoint-i, `_geo` sahəsi (`_geoRadius`/`_geoBoundingBox`)
- Postgres fallback: `pg_trgm` + `unaccent` + generated `tsvector` + GIN
- NLP qatı: `year`/`yearMin`/`yearMax` sahələrini prompta əlavə et, `color`-u filtrdə istifadə et, legacy `voice-parser.js` regex məntiqini bərpa et

### 18.5 Media storage
Cloudflare R2 / AWS S3 + CDN; presigned upload (API CPU-su istifadə olunmasın); thumbnail variantları; `MEDIA_BASE_URL` → CDN domeni

### 18.6 Admin panel və moderasiya
`/admin/*` alt səhifələri (users, listings, moderation, complaints, categories, payments, analytics, audit); `frontend/middleware.ts` ilə server-tərəf qoruma; moderasiya növbəsi + risk skoru; `AuditLog` interceptor

### 18.7 Monetizasiya
Azərbaycan ödəniş provayderi (Epoint / PashaPay / Kapital / Payriff) inteqrasiyası; `Package`/`Subscription`/`Payment`/`Promotion` modellərini koda bağla; `vipUntil` sahəsi + expiry job; `isVip`/`isPremium` sıralamaya təsir etsin

### 18.8 Çoxdillilik
URL-də dil prefiksi (`/az`, `/ru`, `/en`) və ya `next-intl`; DB tərəfi tərcümələr (`Category.nameRu/nameEn`, `CategoryAttribute.labelEn`, `AttributeOption` etiketləri, `Region/District.nameEn`); `Listing` üçün `ListingTranslation` (AI tərcümə dərc anında bir dəfə); backend xəta mesajları üçün i18n açarları; `LangToggle`-ı **render et**

### 18.9 Auth tamamlanması
Telefon OTP + real SMS provayderi (Redis TTL, cəhd limiti); email verification; `PasswordResetToken`; `UsersModule` (profil, parol, email/telefon dəyişmə, hesab silmə); RBAC bütün admin endpoint-lərində; ban/suspend axını + Redis `tokenVersion`

### 18.10 Silinməli
`backend/` (tam), 67 istifadəsiz komponent, 7 orphan `*Client.tsx`, `socket.io-client`, `.bak` fayllar, `import-magazam.cjs`, `avito screen/` (git-də deyil)

---

## 19. TARGET ARCHITECTURE RECOMMENDATION

```
┌──────────────────────────────────────────────────────────────────────┐
│  CLIENT                                                              │
│  Next.js 15 App Router (Vercel)                                      │
│  · Server Components üstünlüklü (hazırda 57% client → hədəf <30%)    │
│  · /[locale]/ route qrupu (az | ru | en) + hreflang                  │
│  · next/image hər yerdə + CDN                                        │
│  · CSP/XFO/nosniff başlıqları (next.config headers())                │
│  · Bütün SSR fetch-lərdə timeout + degradasiya                       │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ /api/* rewrite (eyni origin, httpOnly cookie)
┌──────────────────────────▼───────────────────────────────────────────┐
│  API — NestJS 10 (paid tier hosting, EU region)                      │
│  Modullar: auth · users · admin · categories · attributes · listings │
│            · vertical(transport/realestate/jobs) · geo · media       │
│            · search · chat(WS) · social · billing · moderation · erp │
│  Guards: Throttler(identity-based, Redis) → JWT → Roles → AuditLog   │
│  Workers (BullMQ): expiry · saved-search matcher · reindex ·         │
│                    counters · token cleanup · notifications          │
└───┬───────────────┬──────────────┬───────────────┬───────────────────┘
    │               │              │               │
┌───▼─────────┐ ┌───▼──────────┐ ┌─▼───────────┐ ┌─▼──────────────────┐
│ PostgreSQL  │ │ Meilisearch  │ │ Redis       │ │ Object Storage     │
│ + pg_trgm   │ │ (Cloud)      │ │ · throttle  │ │ Cloudflare R2 / S3 │
│ + unaccent  │ │ · dinamik    │ │ · OTP       │ │ + CDN              │
│ + PostGIS   │ │   facets     │ │ · pub/sub   │ │ presigned upload   │
│ + tsvector  │ │ · _geo       │ │ · queue     │ │ thumbnail variantı │
│ + GIN(attrs)│ │ · sinonim    │ │ · keş       │ │                    │
│ + PgBouncer │ └──────────────┘ └─────────────┘ └────────────────────┘
└─────────────┘
```

### 19.1 Kateqoriya engine — hədəf axını

```
ADMIN                                    İSTİFADƏÇİ
  │                                          │
  ├─ POST /admin/categories                  ├─ GET /categories/tree (Redis keş)
  ├─ POST /admin/categories/:id/attributes   ├─ GET /categories/:slug/attributes
  ├─ POST /admin/attributes/:id/options      │     → dinamik FİLTR paneli
  │     (parentOptionId ilə kaskad)          │     → dinamik ELAN FORMASI
  │                                          │
  └─→ Category / CategoryAttribute /         └─→ POST /listings { attributes: {...} }
      AttributeOption cədvəlləri                    │
              │                                     ├─ validateAttributes (sxem)
              ├─→ Meili index settings              ├─ Listing.attributes (JSONB + GIN)
              │   avtomatik yenilənir               ├─ ListingAttributeValue (dual-write)
              └─→ Redis keş invalidasiyası          └─ VehicleDetails/RealEstateDetails/
                                                       JobDetails (vertikala görə)
```

**Bu axın qurulduqdan sonra yeni kateqoriya əlavə etmək = admin paneldə 5 dəqiqəlik iş, deploy YOXDUR.**

### 19.2 Hosting tövsiyəsi (Render free-dən çıxış)

| Variant | Aylıq təxmini | Qeyd |
|---|---|---|
| Render Starter (web $7 + Postgres $7 + Redis $10 + disk $1/GB) | **~$25-30** | ən az dəyişiklik, disk problemi həll olunur |
| Railway / Fly.io (EU region) | **~$20-40** | Azərbaycana daha yaxın gecikmə (Frankfurt) |
| Meilisearch Cloud (Build plan) | **~$30** | idarə olunan, master key təhlükəsizliyi |
| Cloudflare R2 (10GB + trafik) | **~$1-5** | S3-dən ucuz, egress pulsuz |
| **CƏMİ** | **~$55-75/ay** | MVP miqyası üçün kifayət |

**Region:** Frankfurt (EU-Central) — Bakıya ~60-80ms, US-dən ~180-220ms yaxşıdır.

---

## 20. MIGRATION RISKS

| # | Risk | Ehtimal | Təsir | Azaltma |
|---|---|---|---|---|
| M-01 | **Mövcud elanların `attributes = {}` olması** — dinamik forma qurulandan sonra köhnə elanlar filtrlərdə görünməyəcək | Yüksək | Yüksək | Backfill skripti: mövcud `attributes` açarlarını kanonik `AttributeOption.value`-lara map et; map olunmayanlar üçün moderasiya növbəsi |
| M-02 | **`options` massivindən `AttributeOption` cədvəlinə keçid** — hazırda JSONB-də AZ etiket saxlanır, hədəfdə kanonik `value` | Yüksək | Yüksək | İki mərhələ: (1) `AttributeOption` yarat + `value=labelAz` ilə doldur (geriyə uyğun); (2) backfill sonrası kanonik `value`-ya keç |
| M-03 | **Marka/model dedublikasiyası** — DB-də 10 marka, frontend-də 70, seed elanlarında "LADA" vs "Lada (VAZ)" | Yüksək | Orta | Kanonik slug lüğəti + fuzzy match + əl ilə təsdiq üçün admin ekranı |
| M-04 | **Yüklənmiş şəkillərin itməsi** — efemer diskdə hazırda nə varsa, obyekt storage-a köçürmə anına qədər itə bilər | **Çox yüksək** | Kritik | **Dərhal** storage-a keç; mövcud fayllar onsuz da hər deploy-da itir → real itki yoxdur, amma gecikmə hər gün yeni itki deməkdir |
| M-05 | **SEO URL dəyişikliyi** (UUID → slug, `/az` prefiksi) | Orta | Yüksək | 301 redirect cədvəli; köhnə URL-lər ən azı 12 ay saxlanılsın; sitemap-də yalnız yeni URL-lər; GSC-də ünvan dəyişikliyi bildirişi |
| M-06 | **PostGIS miqrasiyası** — `lat/lng` `Float` → `geography(Point)` | Orta | Orta | Generated column ilə paralel yaz, sonra keç; `lat/lng` onsuz da demək olar boşdur (formada input yoxdur) → risk aşağıdır |
| M-07 | **Cookie-əsaslı sessiyaya keçid** — mövcud localStorage tokenləri etibarsız olacaq | Yüksək | Aşağı | Bir dəfəlik məcburi yenidən giriş; istifadəçilər onsuz da 15 dəq-də çıxarılır |
| M-08 | **`backend/` silinməsi** dev mühitini sındıra bilər | Yüksək | Aşağı | Əvvəlcə `next.config.ts` dev rewrite-larını NestJS-ə yönləndir, sonra sil |
| M-09 | **İndeks yaratma zamanı lock** — böyük cədvəldə `CREATE INDEX` | Orta | Orta | `CREATE INDEX CONCURRENTLY`; iş saatlarından kənar |
| M-10 | **Ödəniş inteqrasiyası** — hüquqi/uyğunluq | Orta | Yüksək | `qaydalar/page.tsx:49` və `mexfilik/page.tsx:45` hazırda mövcud olmayan provayderləri adlandırır — **inteqrasiyadan əvvəl mətn düzəldilməlidir** |
| M-11 | **Downtime** — backend onsuz da ölüdür | — | — | Bu miqrasiya üçün nadir fürsət: **canlı trafik praktiki olaraq yoxdur**, ona görə böyük dəyişikliklər indi ən ucuzdur |
| M-12 | **Geri dönüş planı** | — | — | Hər faza ayrıca branch + Vercel preview + Render preview environment; DB migration-ları geri-uyğun (əvvəl sütun əlavə et, sonra köhnəni sil) |

**Ən vacib müşahidə:** Backend hazırda ölü, elanlar boş, real istifadəçi datası minimaldır. **Bu, böyük struktur dəyişikliyi üçün ən aşağı riskli andır.** Altı ay sonra 100k elanla eyni işi görmək dəfələrlə bahalı olacaq.

---

## 21. PRIORITIZED IMPLEMENTATION ROADMAP

### FAZA 0 — Təcili sabitləşdirmə (1-3 gün) 🔴 BLOKER
| # | İş | Səbəb |
|---|---|---|
| 0.1 | **Render Postgres/servisin vəziyyətini yoxla, backend-i qaldır** | C-01 |
| 0.2 | Migration-ı Docker `CMD`-dən ayır; `prisma:seed`-i çıxar; DB olmadan boot + `/health: degraded` | C-01 |
| 0.3 | **Bütün SSR `fetch`-lərə `AbortSignal.timeout(5000)` + fallback UI** | C-02, C-03 |
| 0.4 | `GROQ_API_KEY`/`MEILI_*`/`MEDIA_DIR`-i `render.yaml`-a `sync:false` ilə elan et (blueprint drift) | C-09 |
| 0.5 | `next.config.ts` dev rewrite-larını prod ilə eyniləşdir (bütün `/api/*` → NestJS) | 15.1 |
| 0.6 | Təhlükəsizlik başlıqları (`headers()` + `poweredByHeader:false`) | A-14 |
| 0.7 | `CORS_ORIGINS`-ə `https://360tap.az` əlavə et, `localhost` çıxar | 14 |
| 0.8 | `contactPhone`-u public siyahıdan çıxar | C-14 |

### FAZA 1 — İnfrastruktur və təmizlik (1-2 həftə) 🔴 BLOKER
| # | İş |
|---|---|
| 1.1 | **Render free → paid (və ya Railway/Fly, EU region)** + persistent Postgres |
| 1.2 | **Obyekt storage (R2/S3) + CDN**, presigned upload, `MEDIA_BASE_URL` → CDN |
| 1.3 | **`backend/` qovluğunu tamamilə sil** (əvvəl 0.5 tamamlansın) |
| 1.4 | 67 istifadəsiz komponent + 7 orphan `*Client.tsx` + `socket.io-client` sil |
| 1.5 | **Cavab zərfi buglarını düzəlt** + `lib/api.ts`-də mərkəzi `unwrap()` (R-02) |
| 1.6 | 11 TS xətasını düzəlt, `ignoreBuildErrors`/`ignoreDuringBuilds` **söndür** (R-13) |
| 1.7 | **CI gate:** GitHub Actions — `tsc --noEmit` + `eslint` + `jest` hər PR-da |
| 1.8 | `listings.service.spec.ts` düzəlt (SearchService mock) |
| 1.9 | Docker: non-root user, multi-stage optimallaşdırma |

### FAZA 2 — Kateqoriya / Atribut Engine (3-4 həftə) 🟠 ƏSAS DƏYƏR
| # | İş |
|---|---|
| 2.1 | `AttributeOption` cədvəli + `CategoryAttribute` genişlənməsi (`labelEn`, `dependsOnKey`, `showIfValue`, `min/max`, `regex`, `groupName`, `isActive`, `optionsSource`) |
| 2.2 | `AttributeType.reference` + `Brand`→`VehicleModel`→`VehicleGeneration` + endpoint-lər |
| 2.3 | **`AdminModule`** — kateqoriya/atribut/opsiya CRUD + `@Roles` + `AuditLog` |
| 2.4 | **Admin UI** — Filter Builder + kateqoriya ağacı drag/drop |
| 2.5 | **Dinamik elan forması** (`elan-yerlesdir`-də `GET /categories/:slug/attributes` → input render → `payload.attributes`) — *C-06-nı həll edir* |
| 2.6 | `CategoryFilters.tsx`-ə `multiselect`/`range`/`date` render-i |
| 2.7 | `transport-data.ts` + `realestate-data.ts` (359 sətir) → DB-yə köçür, faylları sil |
| 2.8 | brand/model `options` seed-ini düzəlt — *C-07-ni həll edir* |
| 2.9 | `validateAttributes` həmişə çağırılsın (`isRequired` işləsin); naməlum açarlar rədd edilsin |
| 2.10 | Mövcud elanlar üçün backfill skripti (M-01, M-02) |

### FAZA 3 — Data qatı və miqyas (2-3 həftə) 🟠
| 3.1 | Partial composite indekslər + `owner_id` indeksi (R-03) |
| 3.2 | `attributes` üçün `GIN (jsonb_path_ops)` + ifadə indeksləri |
| 3.3 | `pg_trgm` + `unaccent` + generated `tsvector` + GIN |
| 3.4 | Keyset (cursor) pagination + təxmini `total` (R-04) |
| 3.5 | 20+ FK + indeks əlavəsi (R-05) |
| 3.6 | Connection pooling / PgBouncer (R-19) |
| 3.7 | **BullMQ processor-ları:** expiry, token cleanup, sayğac uzlaşdırma, reindex (R-07) |
| 3.8 | Kateqoriya ağacı üçün Redis keş / materialized path (R-18) |
| 3.9 | `SearchLog`/`ErpSyncLog` partition + retention |

### FAZA 4 — Axtarış (2-3 həftə) 🟠
| 4.1 | **Tək Meilisearch mənbəsi** (Cloud), master key, search-only key |
| 4.2 | `lib/meili.ts` hardcoded host-u sil → NestJS `GET /search` |
| 4.3 | `filterableAttributes` `CategoryAttribute`-dan dinamik |
| 4.4 | **Facet sayğacları** + autocomplete/suggest endpoint-ləri |
| 4.5 | NLP: `year`/`yearMin`/`yearMax` + `color` filtri (S-06, S-07) |
| 4.6 | Postgres FTS fallback-ı işə sal |
| 4.7 | `reindex` endpoint-inə try/catch (S-04) |

### FAZA 5 — Auth, Trust, Moderasiya (3-4 həftə) 🟠
| 5.1 | **Cookie-əsaslı sessiya + 401 interceptor + refresh** (R-01) — *C-10-u həll edir* |
| 5.2 | **Telefon OTP + real SMS provayderi** (Redis TTL, cəhd limiti) — *C-11-i həll edir* |
| 5.3 | Email verification + `PasswordResetToken` + parol bərpası (A-05) |
| 5.4 | **`UsersModule`** — profil, parol, email/telefon, hesab silmə (A-04) |
| 5.5 | **RBAC** bütün admin endpoint-lərində + `AuditLog` interceptor (A-03) |
| 5.6 | Super-admin bootstrap axını (A-11); `stores.service.ts` rol bugu (A-10) |
| 5.7 | **Moderasiya növbəsi** + risk skoru + approve/reject + `rejectionReason` (C-13) |
| 5.8 | Ban/suspend axını + Redis `tokenVersion` (A-09, A-15) |
| 5.9 | Şikayət idarəetməsi (GET/PATCH + unique constraint) |
| 5.10 | Identity-əsaslı rate limiting + Redis storage (R-06) — *C-12-ni həll edir* |
| 5.11 | Duplicate elan detection + şəkil pHash + `isPhoneVerified` qapısı |
| 5.12 | ERP `webhookSecret` şifrələnməsi (A-22) |

### FAZA 6 — Vertikallar (6-10 həftə) 🟡
| 6.1 | **Nəqliyyat (360 Auto):** `VehicleDetails` koda bağlanması + `generation`/`horsepower`/`marketVersion`/`sellerKind`; 70 marka / 800+ model seed; vertikal landinq səhifəsi |
| 6.2 | **Əmlak (360 Əmlak):** `Settlement` + `MetroStation`; **PostGIS + GIST**; `radius/bbox/polygon` endpoint-i; **Map View** (clustering ilə) canlı route-a; `pricePerM2`; kommunal atributlar |
| 6.3 | **İş (360 İş):** `Resume`/`Candidate`/`JobApplication` + ATS axını; `JobDetails` genişlənməsi; işəgötürən paneli |
| 6.4 | Elan detal səhifəsinin zənginləşdirilməsi: `ListingPriceHistory` modeli, kredit kalkulyatoru, video, `GET /users/:id/listings` |

### FAZA 7 — Monetizasiya (3-4 həftə) 🟡
| 7.1 | Azərbaycan ödəniş provayderi inteqrasiyası |
| 7.2 | `Package`/`Subscription`/`Payment`/`Promotion` kodda işə salınsın |
| 7.3 | `vipUntil` + expiry job + `isVip`/`isPremium` sıralamaya təsir |
| 7.4 | `/magaza/[slug]` səhifəsi + mağaza yaratma axını (backend hazırdır) |
| 7.5 | Biznes paneli, balans/pul kisəsi (mock-ları real et) |
| 7.6 | `qaydalar`/`mexfilik` mətnlərini real provayderlərlə uyğunlaşdır (M-10) |

### FAZA 8 — i18n + SEO (2-3 həftə) 🟡
| 8.1 | `/[locale]/` route qrupu + `next-intl`; `LangToggle` render |
| 8.2 | DB tərcümələri (`nameRu/nameEn`, `labelEn`, `AttributeOption` etiketləri) + seed |
| 8.3 | `ListingTranslation` + AI tərcümə (dərc anında bir dəfə) |
| 8.4 | **Sitemap index** + real URL generasiyası (SEO-01) |
| 8.5 | Canonical + hreflang düzəlişi (SEO-02, SEO-03) |
| 8.6 | Slug URL-lər + 301 redirect (SEO-07, M-05) |
| 8.7 | `Breadcrumb`/`ItemList`/`Product` JSON-LD-lərin qoşulması |
| 8.8 | Crawl edilə bilən pagination |

### FAZA 9 — Real-time və performans (2-3 həftə) 🟢
| 9.1 | WebSocket Gateway (Redis pub/sub) — chat + bildirişlər (R-10) |
| 9.2 | `next/image` bütün 29 xam `<img>` üçün; `next/font` |
| 9.3 | Client komponent nisbətini 57% → <30% |
| 9.4 | ISR/`generateStaticParams`, CDN cache siyasəti, `vercel.json` |
| 9.5 | `ListingStatDaily` real statistika (Redis buffer → flush) |

**Ümumi təxmini müddət:** Faza 0-5 (bloker + əsas dəyər) ≈ **11-16 həftə**; tam yol xəritəsi ≈ **26-36 həftə** (1 backend + 1 frontend developer üçün).

---

## ARCHITECTURE VERDICT

### ➤ **VARIANT B — Əsas hissələri saxlayıb ciddi refactor etmək**

*(Domen özəyi — kateqoriya/atribut engine, atribut saxlama + indeks qatı, axtarış və media storage — yerində **yenidən qurulmaqla**.)*

### Texniki əsaslandırma

**1. Stack seçimi düzgündür və dəyişdirməyə səbəb yoxdur.**
NestJS 10 + Prisma 5 + PostgreSQL + Next.js 15 App Router — milyonlarla elanlı multi-category marketplace üçün sənaye standartıdır. Auditdə tapılan heç bir problem stack seçimindən qaynaqlanmır; hamısı *tətbiq* səviyyəsindədir. `api/` tərəfində `tsc --noEmit` **0 xəta**, `eslint` **0 problem** verir — kod keyfiyyəti təməli sağlamdır.

**2. Sxem drift-i sıfırdır — bu, nadir və qiymətli göstəricidir.**
843 sətirlik `schema.prisma` ilə 896 sətirlik migration sütun-sütun uyğundur. Bu, komandanın migration intizamına riayət etdiyini göstərir və yenidənqurmanı **artıq deyil, təhlükəli** edir: sxemin quruluşu düzgündür, problem onun **yarısının koda bağlanmamasında** və **fiziki optimallaşdırma qatının (indeks/extension/partition) olmamasında**dır. Bunların hər ikisi migration ilə həll olunur, yenidənqurma ilə deyil.

**3. Layihədə həqiqətən production-keyfiyyətli, təkrar yazılması bahalı olan komponentlər var.**
`erp-auth.guard.ts` (HMAC + `timingSafeEqual` + nonce replay müdafiəsi), `auth.service.ts` (argon2id + atomik refresh rotation + reuse detection), `media.service.ts` (sharp re-encode + blurhash + SVG rədd), `validateAttributes()` (8 tip üçün tam validasiya), IDOR müdafiəsinin bütün yazma yollarında mövcudluğu — bunlar sıfırdan yazılsa həftələr aparardı və yenidənqurmada itirilmə riski var.

**4. Ən dəyərli aktiv koddan kənardadır: taksonomiya.**
`seed/categories.ts` — 117 kateqoriya node, 3 səviyyə, 141 atribut tərifi; `seed/regions.ts` — 73 region, ~84 rayon real koordinatlarla. Bu, aylarla məzmun işidir və hansı arxitektura seçilsə də saxlanılmalıdır. Variant C bu aktivi qorumaq üçün onsuz da miqrasiya tələb edərdi — yəni C-nin əlavə dəyəri yoxdur.

**5. Buna baxmayaraq bu, "Variant A — davam etmək" DEYİL.**
Auditdə **27 CRITICAL** tapıntı var. Tapşırığın əsas tələbi (admin-driven kateqoriya engine) mövcud modeldə **ifadə oluna bilmir**: `options` düz JSON massivdir (ID yox, tərcümə yox, kaskad yox), `dependsOn`/`showIf` sahələri yoxdur, admin CRUD sıfırdır, elan forması atribut soruşmur. Bu, kosmetik düzəlişlə həll olunmur — `AttributeOption` cədvəli, `CategoryAttribute` genişlənməsi, `AdminModule` və dinamik forma **sıfırdan qurulmalıdır**. Eyni şəkildə axtarış (iki ayrı, hər ikisi ölü Meilisearch), media storage (efemer disk) və vertikal modellər (3 ölü cədvəl) yenidən qurulur.

**6. İndi dəyişmək ən ucuz andır.**
Backend canlıda cavab vermir, ana səhifə 0 elan göstərir, sitemap 5 URL-dir, real istifadəçi datası minimaldır (son commit `c86604e` canlı test elanlarını təmizləyib). Miqrasiya riski praktiki olaraq sıfırdır. Altı ay sonra 100k elan və aktiv istifadəçi bazası ilə eyni struktur dəyişikliyi **dəfələrlə bahalı və riskli** olacaq.

### Nə demək deyil

Bu hökm **"kiçik düzəlişlərlə davam edək"** demək deyil. Faktiki iş həcmi:
- **~10-12 yeni migration** (indekslər, extension-lar, `AttributeOption`, i18n sahələri, PostGIS, FK-lar)
- **4 yeni backend modulu** (`admin`, `users`, `moderation`, `billing`) + `verticals`
- **Frontend-in ~51%-nin silinməsi** (75 ölü/əlçatmaz komponent) və elan formasının yenidən yazılması
- **`backend/` qovluğunun tam silinməsi**
- **Hosting və storage-ın dəyişməsi**

Yəni: **platforma saxlanılır, məhsulun özəyi yenidən qurulur.**

### Bir cümlə ilə

> 360tap.az-ın **təməli düzgün atılıb, amma binanın yarısı tikilməyib və bir hissəsi maketdən ibarətdir**. Təməli sökmək lazım deyil — üzərində tikməyə başlamaq lazımdır, əvvəlcə kateqoriya/atribut engine-indən.

---

## ƏLAVƏ: Audit metodologiyası və məhdudiyyətlər

**Aparılan işlər:**
- 18 ölçü üzrə kod auditi (6 ölçü adversarial verifikasiyadan keçib)
- Faktiki icra: `npx tsc --noEmit` (frontend + api), `npx eslint`, `npx jest --ci`
- Canlı smoke test: 25 frontend route + 6 backend endpoint + başlıq analizi
- `schema.prisma` ↔ `migration.sql` sütun-sütun drift müqayisəsi
- Frontend endpoint çağırışları ↔ NestJS controller-lərinin tutuşdurulması

**Məhdudiyyətlər (dürüstlük üçün):**
- **Backend canlıda cavab vermədiyi üçün** DB-nin real vəziyyəti (cədvəl ölçüləri, sətir sayları, bağlantı sayı), API cavab formatları və runtime davranışı **yoxlanıla bilmədi**. Bütün backend nəticələri kod oxunuşuna əsaslanır.
- `npm audit` işlədilməyib — konkret CVE nömrələri **təsdiqlənməyib**, yalnız versiya faktları göstərilib (React 19 RC, multer 1.x, xlsx).
- Render Postgres-in dayanma səbəbi (plan limiti / 90 gün / başqa) **təsdiqlənməyib**.
- **Render dashboard-undakı runtime env dəyişənləri görünmür.** `render.yaml`-da olmayan, amma dashboard-da əl ilə əlavə olunmuş dəyişənlər (`GROQ_API_KEY`, `MEILI_HOST`/`MEILI_KEY`) auditdə **yoxlanıla bilmədi** — bu, C-08 və C-09-un şiddətinə təsir edir və hesabatda açıq qeyd olunub.
- `next build` işlədilməyib (uzun sürür) — build statusu `tsc --noEmit` nəticəsinə əsaslanır.

**Bu audit zamanı heç bir fayl dəyişilməyib, heç bir migration işlədilməyib, DB-yə heç nə yazılmayıb, deploy edilməyib.**
*(Yeganə yan təsir: `npx tsc` build artefaktı olan `frontend/tsconfig.tsbuildinfo` faylını yeniləyib — bu, mənbə kodu deyil.)*
