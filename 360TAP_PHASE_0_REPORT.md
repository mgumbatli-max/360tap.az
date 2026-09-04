# 360TAP — PHASE 0 REPORT (PRODUCTION STABILIZATION)

**Tarix:** 2026-09-02
**Əhatə:** Yalnız FAZA 0. Kateqoriya engine, `AttributeOption`, vertikallar (Auto/Əmlak/İş), UI redesign və böyük DB migration-lara **TOXUNULMAYIB**.
**Deploy:** **BACKEND EDİLDİ** (`8ce5328` → Render, 2026-09-02 11:20–11:27 UTC — bax §13) · **FRONTEND PUSH EDİLDİ** (`5150ee0` → `origin/main`, bu gün — Vercel auto-deploy tetikləndi; production-da **hələ təsdiqlənməyib**, bax §14.6) · **CI EDİLDİ** (`ffc44d8` — `.github/workflows/keep-alive.yml`). Qalan manual addımlar: §6 «Manual Actions».
**DB:** Mənim tərəfimdən **əl ilə** heç bir migration işlədilməyib, production DB-yə heç nə yazılmayıb, heç nə silinməyib. (Render konteyneri deploy zamanı `prisma migrate deploy` icra edir → sxem mövcuddur. Seed **istifadəçi tərəfindən** işlədilir — nəticə §14.9, status: ⏳ **GÖZLƏYİR**.)

---

## 1. PROBLEMS FOUND

| # | Problem | Şiddət | Necə aşkarlandı |
|---|---|---|---|
| P-01 | **Backend production-da bütün endpoint-lərə cavab vermir** (`/health` daxil, 70s timeout, HTTP 000) | CRITICAL | Canlı ölçmə |
| P-02 | Konteyner startup zənciri `&&` ilə bağlıdır: migrasiya uğursuz olsa app **heç vaxt başlamır** | CRITICAL | `api/Dockerfile:26` |
| P-03 | `PrismaService.onModuleInit` DB əlçatmaz olduqda **exception atır** → bootstrap reject → proses çıxır | CRITICAL | `api/src/prisma/prisma.service.ts:17-20` |
| P-04 | `bootstrap()` çağırışında `.catch()` yoxdur → unhandled rejection → səssiz çıxış | CRITICAL | `api/src/main.ts:61` |
| P-05 | `SearchService.onModuleInit` timeout-suz şəbəkə çağırışlarını `await` edir → Meili host asılı qalsa **bütün Nest bootstrap-ı bloklayır** | CRITICAL | `api/src/search/search.service.ts:72-101` |
| P-06 | Hər başlanğıcda `prisma:seed` işləyir — production DB-də `deleteMany`/`cleanupTestData` icra olunur | CRITICAL | `api/Dockerfile:26` + `prisma/seed.ts:33,82,116,266` |
| P-07 | `/elanlar` SSR cavabı **120 saniyəyə də tamamlanmır** (server-side `fetch`-də timeout yoxdur) | CRITICAL | Canlı ölçmə + `app/elanlar/page.tsx` |
| P-08 | Ana səhifə sonsuz skeleton — eyni kök səbəb (timeout-suz SSR fetch) | CRITICAL | Canlı ölçmə + `app/page.tsx:11` |
| P-09 | Axtarış zənciri 3 ardıcıl mərhələdə **cəmi ~20 s** gözlədə bilirdi (6s Meili + 9s AI + limitsiz keyword) | HIGH | Kod analizi |
| P-10 | `/health` yeganə probe-dur; liveness ↔ readiness ayrılmayıb → DB düşəndə Render restart döngəsi riski | HIGH | `health.controller.ts` |
| P-11 | Redis `maxRetriesPerRequest: null` → Redis düşəndə əmrlər **sonsuz növbəyə** düşür (ERP guard əbədi asılır) | HIGH | `redis.module.ts:14-16` |
| P-12 | **Qeydiyyatdan dərhal sonra login 409 verir** — refresh JWT payload-unda unikal komponent yoxdur, eyni saniyədə eyni token → `token_hash` unique pozuntusu | HIGH | Smoke test |
| P-13 | Search servisi düşəndə `/search` tam sıradan çıxırdı (fallback yox) | HIGH | Kod analizi |
| P-14 | `next.config.ts` dev-də `/api/*`-ı legacy Express-ə yönləndirir, prod-da NestJS-ə → **30+ funksiya dev-də «işləyir», prod-da 404** | HIGH | Kod analizi |
| P-15 | `typescript.ignoreBuildErrors: true` — 11 real TS xətası gizlədilirdi | HIGH | `npx tsc` |
| P-16 | `eslint.ignoreDuringBuilds: true` — **ESLint ümumiyyətlə quraşdırılmamışdı**, yəni lint gate mövcud deyildi | HIGH | `ls node_modules` |
| P-17 | Cavab zərfi uyğunsuzluğu 4 canlı səhifədə (`d.items`/`d.listing`/`l.total`) | HIGH | Kod + audit |
| P-18 | `app/error.tsx` production istifadəçisinə **stack trace göstərirdi** | HIGH | Kod |
| P-19 | Hər brauzer xətası mövcud olmayan `/api/clientlog`-a göndərilirdi (404 səs-küyü) | MEDIUM | `layout.tsx:94` |
| P-20 | `listings.service.spec.ts` **düşürdü** (SearchService DI mock yoxdur) — 12 testdən 3-ü fail | MEDIUM | `npx jest` |
| P-21 | Sitemap uğursuzluqları **səssiz udulurdu** (`catch { /* ignore */ }`) — canlıda 5 URL-ə düşməsini heç nə göstərmirdi | MEDIUM | `app/sitemap.ts` |
| P-22 | `opengraph-image.tsx` köhnə API kontraktı + səhv default port (`localhost:5400`) | MEDIUM | Kod |
| P-23 | Blueprint drift: `GROQ_API_KEY`, `GROQ_VISION_MODEL` render.yaml-da yoxdur; `MEILI_HOST` yalançı `localhost:7700` | MEDIUM | `render.yaml` |
| P-24 | Telefon-OTP **default giriş metodu** idi, backend endpoint-i isə yoxdur → qeydiyyat hunisi ilk addımda ölürdü | HIGH | `AuthModal.tsx:19` |

---

## 2. ROOT CAUSES

### KÖK SƏBƏB 1 — Opsional infrastruktur ilə proses başlanğıcı arasında izolyasiya yoxdur

Üç **müstəqil** nöqtədən hər biri tək başına HTTP serverin `listen()`-ə çatmasının qarşısını alırdı:

```
Dockerfile CMD:  migrate deploy  &&  seed  &&  node dist/main.js
                       ↑ uğursuz/asılı qalsa → app HEÇ VAXT başlamır

PrismaService.onModuleInit:  await $connect()   → throw → NestFactory.create() reject
main.ts:                     void bootstrap()   → .catch() YOX → unhandled rejection → proses çıxır

SearchService.onModuleInit:  await meili.createIndex()/updateSettings()  → timeout YOX → bootstrap bloklanır
```

Müşahidə olunan simptom bunu **tam təsdiqləyir**: TCP qoşulma 0.010 s-də alınırdı (Render edge cavab verir), lakin HTTP cavabı 70-120 s-ə gəlmirdi (edge-in arxasında sağlam upstream yox idi, çünki konteyner `listen()`-ə çatmamışdı).

> **Qeyd (dürüstlük üçün):** Render dashboard-una və konteyner loglarına çıxışım olmadığı üçün canlıda **hansı** üçünün işə düşdüyünü təsdiqləyə bilmədim. Hər üçü real defektdir və hər üçü düzəldildi — bu, səbəbin hansı olmasından asılı olmayaraq problemi həll edir.

### KÖK SƏBƏB 2 — Server-side `fetch`-lərdə vaxt həddi yoxdur
`app/page.tsx`, `app/elanlar/page.tsx`, `app/elanlar/[id]/page.tsx`, `app/sitemap.ts`, `opengraph-image.tsx` — hamısında `try/catch` var idi, **timeout yox idi**. Backend cavab verməyəndə `await fetch(...)` sonsuz gözləyirdi, React streaming boundary heç vaxt həll olunmurdu → HTTP cavabı bitmirdi. Ana səhifədəki 66 skeleton və `/elanlar`-ın 120 s-lik asılı qalması **eyni kök səbəbin** iki təzahürü idi.

### KÖK SƏBƏB 3 — Yalançı build gate-ləri
`ignoreBuildErrors` şərhi «~140 komponentdə tip borcu» iddia edirdi; **faktiki borc 11 xəta / 1 fayl** idi və səbəbi köməkçi komponentlərin (`Select`, `Check`, `Section`, `Pill`) `any` proplarıydı. `ignoreDuringBuilds` isə **mövcud olmayan** bir yoxlamanı söndürürdü.

### KÖK SƏBƏB 4 — Refresh token-də unikal komponent yoxdur
`refreshPayload = {sub, email, role, type}` + `iat`/`exp` (saniyə dəqiqliyi). Eyni saniyədə verilən iki refresh token **bayt-bayt eyni** olurdu → SHA-256 hash eyni → `RefreshToken.tokenHash` unique constraint pozulurdu → istifadəçi `409 «Bu token_hash artıq mövcuddur»` alırdı.

### KÖK SƏBƏB 5 — Dev ↔ prod marşrutlaşdırma ayrılığı
Dev-də `/api/*`-ın böyük hissəsi legacy Express-ə, prod-da NestJS-ə gedirdi. Nəticədə 30+ sınıq endpoint aylarla fərq edilmədi.

---

## 3. CHANGES MADE

### 3.1 Backend availability (§1)
- **`api/Dockerfile`** — startup zənciri yenidən quruldu:
  `timeout 120 npx prisma migrate deploy || echo '...'; exec node dist/main.js`
  → `&&` yerinə `;` (migrasiya app-ı bloklamır), `timeout` (sonsuz asılma yox), **seed CMD-dən çıxarıldı** (destruktiv), `exec` (node PID 1 → SIGTERM düzgün işləyir).
- **`api/src/prisma/prisma.service.ts`** — `onModuleInit` artıq **atmır**: 10 s connect timeout, uğursuzluqda eksponensial backoff ilə (2s→60s, `unref()`-li) arxa plan retry, `getDbStatus()` və `ping()` API-si. Xəta mətnində connection string maskalanır.
- **`api/src/main.ts`** — `bootstrap().catch(...)` + `process.on('unhandledRejection'|'uncaughtException')`; strukturlu startup loqu (secret YOX, yalnız `set`/`MISSING`).
- **`api/src/redis/redis.module.ts`** — fail-fast: `maxRetriesPerRequest: 2`, `enableOfflineQueue: false`, `connectTimeout: 5s`, `retryStrategy`, `'error'` handler (emal olunmamış event prosesi qırmasın).

### 3.2 Health probe ayrılması (§1)
- **`GET /health`** — liveness. Xarici asılılıq yoxlamır, **heç vaxt 503 vermir** (Render `healthCheckPath` buna baxır → DB düşəndə restart döngəsi olmur).
- **`GET /health/ready`** — readiness. DB `SELECT 1` (məcburi), search + Redis (opsional) statusu. DB düşəndə **503 + tam dependency detalı**.
- `main.ts`-də `setGlobalPrefix(..., { exclude: ['health', 'health/ready'] })`.
- `AllExceptionsFilter`-ə `details` ötürülməsi əlavə olundu ki, readiness detalı 503 cavabında itməsin.

### 3.3 Search resilience (§6)
- `MeiliSearch` client-inə **5 s timeout**.
- `onModuleInit` artıq **bloklamır** (fire-and-forget).
- **AVAILABLE / DEGRADED / UNAVAILABLE** statusu (`getStatus()`), `/health/ready`-də görünür.
- **`/search` üçün Postgres fallback** — Meili əlçatmaz olduqda axtarış dayanmır, DB keyword axtarışı ilə cavab verir; cavabda `meta.degraded: true`.
- `POST /search/reindex` artıq 500 yox, aydın **503** qaytarır.
- Listing CRUD onsuz da axtarışdan asılı deyildi (`void this.search.indexListing(...)`) — bu qorunub saxlanıldı.

### 3.4 SSR timeout-ları və fallback (§2, §3)
- **YENİ: `frontend/lib/server-fetch.ts`** — `serverFetch` / `serverGet`: `AbortSignal.timeout` (default 5 s), heç vaxt throw etmir, `{ data, meta, unavailable }` qaytarır. `unavailable` sayəsində səhifə **«nəticə yoxdur»** ilə **«backend əlçatmaz»**-ı ayırd edir.
- Tətbiq olundu: `app/page.tsx`, `app/elanlar/page.tsx` (hər iki qol), `app/elanlar/[id]/page.tsx`, `app/elanlar/[id]/opengraph-image.tsx`, `app/sitemap.ts`.
- **Axtarış üçün ÜMUMİ vaxt büdcəsi (8 s)** — Meili → AI → keyword mərhələləri qalan vaxtdan pay alır (əvvəl cəmlənib ~20 s ola bilirdi).
- Yeni fallback UI: ana səhifə, `/elanlar` və elan detalında «Elanlar müvəqqəti yüklənmir» + təkrar cəhd düyməsi. Elan detalı artıq backend düşəndə səhvən **404 göstərmir**.

### 3.5 Build gate-ləri (§4, §5)
- 11 TS xətası **kök səbəbdən** düzəldildi: `TransportFullFilter.tsx`-də `Section`/`Select`/`Pill`/`Check` komponentlərinə real prop tipləri verildi (`any`, `@ts-ignore`, `@ts-expect-error` **istifadə olunmayıb**).
- `typescript.ignoreBuildErrors` və `eslint.ignoreDuringBuilds` **silindi**.
- **ESLint sıfırdan quruldu**: `eslint` + `eslint-config-next` devDep, **YENİ `frontend/eslint.config.mjs`** (`next/core-web-vitals` + `next/typescript`).
- 40 lint error → **0**:
  - `react-hooks/rules-of-hooks` (1) — `useThisTitle` əslində hook deyildi, adı ESLint-i çaşdırırdı → **`applyTitle`** adlandırıldı (qayda söndürülmədi).
  - `@next/next/no-html-link-for-pages` (3) — `<a href="/">` → `<Link href="/">` + import.
  - `react/no-unescaped-entities` (36) — dəqiq sətir:sütun üzrə `&quot;`/`&apos;` escape edildi.
- `npm run typecheck` və `npm run lint` skriptləri hər iki paketə əlavə olundu.

### 3.6 API kontraktı (§9)
- **`frontend/lib/api.ts`**-ə mərkəzləşdirilmiş `unwrap()` / `unwrapMeta()` — yeni `{ok,data,meta}` prioritetdir, köhnə açarlar (`items`/`listing`/`categories`/...) geriyə uyğunluq üçün saxlanılıb (**sistem yenidən yazılmayıb**).
- Ən təhlükəli 4 uyğunsuzluq düzəldildi: `/profil` (statistika həmişə 0 idi), `/profil/elanlarim/[id]/stats` (sonsuz «Yüklənir...»), `/muqayise` (həmişə boş), `/admin` (KPI həmişə «...»).

### 3.7 Error handling (§10)
- `app/error.tsx` — stack trace artıq **yalnız development**-də görünür; `/api/clientlog`-a ölü sorğu silindi.
- `app/layout.tsx` — hər brauzer xətasını 404 endpoint-ə göndərən inline blok silindi.
- `AllExceptionsFilter` — `PrismaClientInitializationError`/`RustPanicError` → **503 «Xidmət müvəqqəti əlçatmazdır»** (əvvəl 500 «Daxili server xətası»).
- `/profil/elanlarim/[id]/stats` — xəta halında sonsuz spinner yerinə aydın mesaj + geri linki.
- Bilinən çatışmayan endpoint-lər üçün dürüst mesajlar: telefon-OTP və toplu import artıq xam API xətası yox, izahlı mətn göstərir.

### 3.8 Auth düzəlişi (§13 regression zamanı tapıldı)
- `JwtPayload`-a `jti?` əlavə olundu; refresh token payload-una `randomBytes(16)` ilə unikal `jti` yazılır → **409 bug-ı aradan qalxdı**.

### 3.9 Dev ↔ prod pariteti (§8)
- `next.config.ts` rewrites: dev artıq **prod ilə eyni** hədəfə (NestJS) yönləndirir. `backend/` **SİLİNMƏDİ**.

### 3.10 Konfiqurasiya (§7)
- `render.yaml`: `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_VISION_MODEL`, `MEILI_HOST`, `MEILI_KEY` → `sync: false` ilə **elan olundu** (dəyər dashboard-da qalır, mövcudluğu koddan görünür); `MEDIA_DIR` əlavə olundu; `CORS_ORIGINS`-ə canlı domen; `healthCheckPath` şərhlə dəqiqləşdirildi.

### 3.11 Observability (§11)
- Strukturlu startup loqu (asılılıq konfiqurasiyası: `set`/`MISSING`, **secret dəyər yoxdur**).
- DB bağlantı vəziyyəti + retry loqları; Redis `ready`/`error` loqları (bir dəfə, spam yox); Search status keçidləri loglanır.
- Sitemap uğursuzluqları artıq **səssiz udulmur** — `console.warn` + yekun URL sayı loglanır.
- `unhandledRejection` / `uncaughtException` handler-ləri.

---

## 4. FILES CHANGED

**Yeni (3):**
| Fayl | Məqsəd |
|---|---|
| `frontend/lib/server-fetch.ts` | Timeout-lu, throw etməyən SSR fetch helper-i |
| `frontend/eslint.config.mjs` | ESLint flat config (next/core-web-vitals) |
| `360TAP_PHASE_0_REPORT.md` | Bu hesabat |

**Dəyişdirilmiş — backend (13):**
`api/Dockerfile` · `api/package.json` · `api/src/main.ts` · `api/src/prisma/prisma.service.ts` · `api/src/redis/redis.module.ts` · `api/src/health/health.controller.ts` · `api/src/health/health.module.ts` · `api/src/health/health.controller.spec.ts` · `api/src/search/search.service.ts` · `api/src/search/search.controller.ts` · `api/src/common/filters/all-exceptions.filter.ts` · `api/src/modules/auth/auth.service.ts` · `api/src/modules/auth/types/jwt-payload.type.ts` · `api/src/modules/listings/listings.service.spec.ts`

**Dəyişdirilmiş — frontend (26):**
`next.config.ts` · `package.json` · `lib/api.ts` · `lib/meili.ts` · `app/page.tsx` · `app/layout.tsx` · `app/error.tsx` · `app/sitemap.ts` · `app/elanlar/page.tsx` · `app/elanlar/[id]/page.tsx` · `app/elanlar/[id]/opengraph-image.tsx` · `app/profil/page.tsx` · `app/profil/elanlarim/[id]/stats/page.tsx` · `app/muqayise/page.tsx` · `app/admin/page.tsx` · `app/elan-yerlesdir/toplu/page.tsx` · `app/elanlar/ListingsClient.tsx` · `app/emlak/RealEstateClient.tsx` · `app/neqliyyat/TransportClient.tsx` · `app/qaydalar/page.tsx` · `components/TransportFullFilter.tsx` · `components/AuthModal.tsx` · `components/PhoneOtpForm.tsx` · `components/AIAssistant.tsx` · və 6 komponentdə yalnız JSX escape (`AutoCategorize`, `DraftRestoreBanner`, `FloatingVoiceFAB`, `LocationPicker`, `SavedMatches`, `SuperSearch`, `VoiceSearch`, `WishlistGroups`)

**Konfiqurasiya (1):** `render.yaml`

**Toxunulmayanlar (qəsdən):** `api/prisma/schema.prisma`, bütün migration-lar, `backend/` qovluğu (tam), kateqoriya/atribut modeli, vertikal modellər.

> **⚠️ DÜZƏLİŞ (2026-09-02):** Bu hesabatın ilk versiyası (`57735f3`) «seed faylları»nı da toxunulmayanlar siyahısına yazmışdı. Həmin iddia **KÖHNƏLİB** — hesabat commit-indən **sonra** `api/prisma/seed.ts` iki commit-də dəyişdirildi:
>
> | Commit | Dəyişiklik |
> |---|---|
> | `25ee6c8` | Demo elanlar **OPT-IN** edildi (`SEED_DEMO_LISTINGS=true`). Default seed artıq yalnız real data yazır (geo + kateqoriyalar + brendlər); `seedListings()`, `cleanupTestData()`, `seedFillEmptyCategories()` yalnız flag ilə işə düşür → production-a saxta inventar yazılmır |
> | `366ecd5` | `printTarget()` — seed hər işə salmada hədəf DB-nin host/ad-ını çap edir (`⚠️ LOKAL BAZA` / `☁️ UZAQ BAZA`); parol və istifadəçi **çap olunmur**. Səbəb: Prisma `.env`-i avtomatik yükləyir və seed səssizcə lokala yazır — bu real baş vermiş səhvdir |
>
> **Sübut:** `git diff --stat 8ce5328^ HEAD -- api/prisma/` → `api/prisma/seed.ts | 47 ++++----` (43 əlavə / 4 silinmə). `schema.prisma` və migration qovluğu **həqiqətən toxunulmayıb** — diff-də yalnız `seed.ts` görünür.

---

## 5. ENVIRONMENT ISSUES

**Dəyişən inventarı (yalnız adlar — heç bir dəyər yazılmayıb):**

| Dəyişən | Kateqoriya | render.yaml-da | Qeyd |
|---|---|---|---|
| `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` | **REQUIRED** (env.validation-da məcburi) | ✅ | Yoxdursa app boot olmur (fail-fast — doğrudur) |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `THROTTLE_TTL`, `THROTTLE_LIMIT`, `MEDIA_BASE_URL` | OPTIONAL (default var) | ✅ | — |
| `REDIS_URL` | OPTIONAL | ✅ | Yoxdursa API degraded işləyir |
| `MEILI_HOST`, `MEILI_KEY` | OPTIONAL | ✅ (indi `sync:false`) | Yoxdursa axtarış **DEGRADED** (Postgres fallback) |
| `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_VISION_MODEL` | OPTIONAL | ✅ (indi `sync:false`) | Yoxdursa `/ai/*` aydın xəta verir, qalan API işləyir |
| `MEDIA_DIR` | OPTIONAL | ✅ (əlavə olundu) | ⚠️ Render free-də disk **efemerdir** |
| `API_ORIGIN` (frontend) | **REQUIRED (Vercel)** | — | Təyin olunmasa frontend `localhost:5500`-ə getməyə çalışır |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MEILI_HOST`, `NEXT_PUBLIC_MEILI_SEARCH_KEY`, `NEXT_PUBLIC_GOOGLE_VERIFY`, `NEXT_PUBLIC_YANDEX_VERIFY`, `NEXT_PUBLIC_API_URL` | OPTIONAL (Vercel) | — | Vercel tərəfi — yoxlaya bilmədim |

**Aşkarlanan drift (repoda düzəldildi):**
- `GROQ_API_KEY`, `GROQ_MODEL` blueprint-də ümumiyyətlə yox idi → `sync: false` ilə elan olundu.
- `GROQ_VISION_MODEL` kodda istifadə olunur, blueprint-də yox idi → əlavə olundu.
- `MEILI_HOST` blueprint-də **yalançı** `http://localhost:7700` dəyəri ilə idi → `sync: false`.
- `MEDIA_DIR` yox idi → əlavə olundu.
- `CORS_ORIGINS`-də canlı domen (`https://360tap.az`) yox idi → əlavə olundu.

**Düzəldilə bilməyən (dashboard tələb edir):** aşağıdakı «Manual Actions» bölməsinə bax.

---

## 6. MANUAL ACTIONS REQUIRED

> Bunları **mən edə bilmirəm** — Render/Vercel dashboard-una çıxış və ya sizin təsdiqiniz lazımdır.
> **Status sütunu 2026-09-02 axşam vəziyyətini göstərir** (§13 və §14 ölçmələrindən sonra).

| # | Addım | Harada | Niyə | Status |
|---|---|---|---|---|
| **M-1** | **Render Postgres (`tap360-db`) vəziyyətini yoxlayın** — free plan dayandırılıb/limitə çatıb? | Render → Databases | P-01-in ehtimal olunan ilkin tetikləyicisi. Kod düzəlişi API-ni qaldırır, amma DB özü ölüdürsə `/health/ready` 503 qalacaq | ✅ **BAĞLANDI** — `/health/ready` 200, `database: connected`. İnstans **canlıdır**; problem **məzmun** boşluğudur (R-15) |
| **M-2** | **Deploy icazəsi verin** (aşağıdakı ardıcıllıqla) | — | ~~Kod hazırdır, deploy edilməyib~~ | ✅ **BAĞLANDI** — backend `8ce5328` deploy edildi (§13.2); frontend `5150ee0` push edildi. ⏳ Vercel production build təsdiqi qalır (§14.6) |
| **M-3** | Blueprint sync-dən sonra dashboard-da `MEILI_HOST`, `MEILI_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_VISION_MODEL` dəyərlərinin **hələ də mövcud olduğunu** təsdiqləyin | Render → tap360-api → Environment | `sync: false` dəyəri qorumalıdır, amma yoxlamaq lazımdır | ⏳ **AÇIQ** — dashboard çıxışı tələb edir |
| **M-4** | Vercel-də `API_ORIGIN` təyin olunduğunu təsdiqləyin | Vercel → Project → Env | Yoxdursa frontend `localhost`-a gedər | ✅ **DOLAYI TƏSDİQ** — canlı `360tap.az` boş DB-nin cavablarını göstərir (0 elan), yəni real backend-ə gedir, `localhost`-a yox |
| **M-5** | Seed artıq avtomatik işləmir — **lazım olduqda bir dəfəlik** `npm run prisma:seed` işlədin | Render → Shell | Faza 0-da destruktiv avto-seed çıxarıldı | ⏳ **İCRADADIR** — istifadəçi tərəfindən işlədilir, nəticə §14.9-a yazılacaq |
| **M-6** | Meilisearch Cloud instansı **ölüdür** (`Instance does not exist or is not ready yet`) — bərpa edin və ya Faza 4-ə saxlayın | Meilisearch Cloud | Axtarış hazırda DEGRADED (Postgres fallback) rejimdə işləyir — **sistem çökmür** | ⏳ **AÇIQ** — canlıda hələ `degraded` (§14.8 / A-1) |
| **M-7** | UptimeRobot monitorunu `/health` üzərində saxlayın (dəyişiklik lazım deyil) | UptimeRobot | `/health` artıq DB-dən asılı deyil | ✅ **CI qatı əlavə olundu** — `ffc44d8` ilə `.github/workflows/keep-alive.yml` (hər 5 dəq `/health` ping) |

**Deploy ardıcıllığı — icra olundu:**
1. ✅ **Backend** (Render, `8ce5328`) — `/health` və `/health/ready` yoxlanıldı (§13.2).
2. ✅ **Frontend push** (`5150ee0` → `origin/main`) — `/health` 200 verdikdən sonra. ⏳ Vercel production build-i hələ təsdiqlənməyib (§14.6).
3. ⏳ **Canlı smoke test** — §14-də icra olundu, lakin **boş DB** üzərində. Seed-dən sonra §9 matrisi canlıda **təkrarlanmalıdır**.

---

## 7. TESTS EXECUTED

| Test | Nəticə |
|---|---|
| `api: npm run typecheck` | ✅ 0 xəta |
| `api: npm run lint` | ✅ 0 problem |
| `api: npm test` (jest) | ✅ **8/8 suite, 15/15 test** (əvvəl: 7/8 suite, 12 testdən 3-ü FAIL) |
| `api: npm run build` | ✅ |
| `frontend: npm run typecheck` | ✅ 0 xəta (əvvəl: 11) |
| `frontend: npm run lint` | ✅ **0 error** (307 warning — keyfiyyət borcu, bloklamır) |
| `frontend: npm run build` | ✅ (tsc + eslint gate-ləri **aktiv** vəziyyətdə) |

**Yeni testlər:** `health.controller.spec.ts` genişləndirildi — liveness DB düşəndə də 200 qaytarır; readiness DB düşəndə 503 atır; search DEGRADED olsa da hazır sayılır.
**Düzəldilən test:** `listings.service.spec.ts` — `SearchService` mock-u əlavə olundu.

**Əl ilə davranış testləri:**
- **DB + Redis + Meili tamamilə əlçatmaz** vəziyyətdə API başlatma → **3 saniyədə qalxdı**, `/health` 200 (0.089 s), `/health/ready` 503 (tam detal ilə), `/api/v1/categories` 503 (0.004 s, hang yox).
- Auth axını: register 201 → **login 200** (əvvəl 409) → təkrar login 200 → yanlış parol 401 → `/auth/me` 200 → tokensiz 401 → refresh 200 → **refresh reuse 401** (reuse detection işləyir).
- Yazma axını: favorite add/list/remove ✅, elan yaratma 201 → GET 200 → arxivləmə 200.
- Axtarış DEGRADED: Meili yoxdur → `/api/v1/search?q=iphone` **200, 5 nəticə** (Postgres fallback), `meta.degraded: true`.

> **Qeyd:** Bütün testlər **lokal dev DB** (`marketplace_dev`) üzərində aparılıb. Production DB-yə toxunulmayıb. Dev DB-də 2 test istifadəçisi və 1 arxivlənmiş test elanı qalıb (silinmədi — destruktiv əməliyyatdan çəkindim).

---

## 8. BUILD RESULTS

```
API        typecheck ✓   lint ✓ (0)   test ✓ (15/15)   build ✓
FRONTEND   typecheck ✓   lint ✓ (0 error / 307 warning)   build ✓
```

Frontend build çıxışı: `/` statik + ISR (30 s revalidate), `/elanlar` və `/elanlar/[id]` dinamik (searchParams / no-store — gözlənilən).
Sitemap build loqu (**KEŞLİ LOKAL BUILD**): `[sitemap] 235 URL (statik 5, kateqoriya 106, region 74, elan 50)`.

> **⚠️ Bu rəqəm build sübutu kimi ETİBARSIZDIR.** 235 URL Next.js `fetch` keşindən gəlir — həmin entry-lər əvvəllər **dolu lokal DB** (`localhost:5500`) ilə yazılmışdı. Keş təmiz olduqda və ya canlı (boş) API ilə işlədikdə sitemap **5 URL**-dir (yalnız statik marşrutlar). Canlı təsdiq: `curl https://360tap.az/sitemap.xml | grep -c '<loc>'` → **5**. Sitemap-ın həqiqi düzəlişi URL sayı deyil, **uğursuzluğun artıq səssiz udulmaması**dır (`console.warn` + yekun URL sayının loglanması). Real URL sayı yalnız production DB seed edildikdən sonra ölçülməlidir.

**307 warning-in tərkibi (bloklamır, Faza 1 borcu):** əsasən `@typescript-eslint/no-explicit-any`, `no-unused-vars`, `@next/next/no-img-element`, `react-hooks/exhaustive-deps`.

---

## 9. SMOKE TEST MATRIX

### 9.1 Canlı backend ilə (lokal, uçdan-uca)

| # | Ssenari | Status | Sübut |
|---|---|---|---|
| 1 | Homepage | **PASS** | 200, 0.01 s, 12 elan linki (əvvəl: 0 elan, 66 skeleton) |
| 2 | Category page (`?category=avtomobiller`) | **PASS** | 200, 0.06 s, «Avtomobillər» + 5 elan |
| 3 | Search (`?q=iphone`) | **PASS** | 200, 1.58 s, 5 nəticə (Postgres fallback ilə) |
| 4 | Listing list (`/elanlar`) | **PASS** | 200, 0.03 s, 50 elan (əvvəl: **heç vaxt bitmirdi**) |
| 5 | Listing detail | **PASS** | 200, 0.03 s, qiymət render olunur |
| 6 | Login | **PASS** | səhifə 200; API: login 200, yanlış parol 401 |
| 7 | Register | **PASS** | səhifə 200; API: 201 + token |
| 8 | Create listing | **PASS** | səhifə 200; API: 201 → GET 200 → arxiv 200 |
| 9 | Favorites | **PASS** | add 201 → list 200 (1) → remove 200 |
| 10 | Profile | **PASS** | 200; `/listings/me/list` 200 (envelope düzəldi) |
| 11 | Admin login/API | **PARTIAL** | səhifə 200 və rol qapısı işləyir; **admin API-ləri hələ mövcud deyil** (Faza 5) |
| 12 | Sitemap / robots | **PASS (şərti)** | robots 200 · sitemap 200. `<loc>` sayı **ölçü sübutu deyil**: lokalda keşdən 235, canlıda (boş DB) **5** — bax §8 qeydi |

### 9.2 Backend TAM ÖLÜ ikən (əsas qəbul meyarı)

| Route | Əvvəl | İndi |
|---|---|---|
| `/` | sonsuz skeleton | **200, 0.03 s** |
| `/elanlar` | **120 s-də bitmirdi** | **200, 0.04 s** |
| `/elanlar?region=lenkeran` (keşsiz) | hang | **200, 0.05 s + «müvəqqəti yüklənmir» fallback** |
| `/elanlar?category=heyvanlar&sort=price_asc` (keşsiz) | hang | **200, 0.02 s + fallback** |
| `/elanlar?priceMin=7777` (keşsiz) | hang | **200, 0.03 s + fallback** |
| `/elanlar?q=<yeni>` | hang | **200, 1.35 s + fallback** |
| `/elanlar/<id>` | 404 (yanlış) | **200 + «müvəqqəti yüklənmir»** |
| `/login`, `/elan-yerlesdir` | — | **200, <0.01 s** |

Heç bir səhifədə stack trace görünmür.

### 9.3 Bilinən PARTIAL / FAIL

| Ssenari | Status | Səbəb |
|---|---|---|
| Telefon-OTP ilə giriş | **FAIL (dizayn üzrə)** | Backend endpoint-i yoxdur → **Faza 5**. Faza 0-da: default metod email edildi + aydın mesaj |
| Toplu Excel import | **FAIL (dizayn üzrə)** | `/api/import/*` NestJS-ə köçürülməyib → **Faza 6**. Faza 0-da aydın mesaj |
| `/k/*`, `/seher/*` | **PARTIAL** | 200 + `<meta refresh>` (Next.js streaming redirect), 301/307 deyil → SEO borcu, **Faza 8** |
| Admin modulları | **PARTIAL** | 8 alt-səhifə və admin API-ləri yoxdur → **Faza 5** |

---

## 10. REMAINING RISKS

| # | Risk | Şiddət | Faza |
|---|---|---|---|
| ~~R-1~~ | ~~**Production hələ də ölüdür** — kod düzəldilib, deploy edilməyib~~ → ✅ **RESOLVED (2026-09-02)** — backend `8ce5328` deploy edildi və canlıda sağlamdır (45/45 sorğu 200); frontend `5150ee0` push edildi. Qalıq: Vercel production build-inin təsdiqi (§14.6) | ~~CRITICAL~~ | ✅ bitdi |
| ~~R-2~~ | ~~Render Postgres-in özü dayandırılıbsa `/health/ready` 503 qalar~~ → ✅ **RESOLVED (2026-09-02)** — `GET /health/ready` **200**, `database: {"ok":true,"status":"connected"}`. DB instansı **canlıdır**; problem instans deyil, **məzmun** boşluğudur (R-15) | ~~CRITICAL~~ | ✅ bitdi |
| R-3 | **Yüklənən şəkillər hər deploy-da itir** (efemer disk, obyekt storage yoxdur) | CRITICAL | Faza 1 |
| R-4 | Rate limiting Vercel proxy səbəbindən tək bucket-dir (bütün sayt üçün ortaq) | CRITICAL | Faza 5 |
| R-5 | Refresh token frontend-də saxlanmır → istifadəçi 15 dəqiqədə çıxarılır | CRITICAL | Faza 5 |
| R-6 | Moderasiya/fraud müdafiəsi yoxdur; elanlar avto-dərc olunur | CRITICAL | Faza 5 |
| R-7 | Public elan siyahısı `contactPhone` qaytarır (scraping) | HIGH | Faza 5 (tez alına bilər) |
| R-8 | Frontend-də CSP / X-Frame-Options / nosniff başlıqları yoxdur | MEDIUM | Faza 1 (Faza 0 əhatəsində deyildi) |
| R-9 | Sitemap 50 elanla məhduddur, canonical root-a işarə edir, hreflang ölü route-lara gedir | HIGH | Faza 8 |
| R-10 | `backend/` legacy qovluğu hələ repodadır (deploy olunmur, dev-də də artıq istifadə edilmir) | MEDIUM | Faza 1 |
| R-11 | 307 ESLint warning + ~75 ölü komponent | MEDIUM | Faza 1 |
| R-12 | DB indeks planı milyonlarla elan üçün yararsızdır (GIN/FTS/composite yoxdur) | HIGH | Faza 3 |
| R-13 | `/auth/refresh` cavabı `{data:{accessToken,...}}`, register/login isə `{data:{user,tokens}}` — kontrakt uyğunsuzluğu (frontend hazırda refresh çağırmır) | LOW | Faza 5 |
| R-14 | Dev DB-də 2 test istifadəçisi + 1 arxivlənmiş test elanı qalıb | LOW | — |
| **R-15** | **Production DB boşdur** — sxem mövcuddur, sətir yoxdur (`categories` 0, `geo/regions` 0, `listings` 0 / `meta.total: 0`). Sayt qalxıb, amma **məzmunsuzdur**: kateqoriya menyusu boş, elan siyahısı boş, sitemap 5 URL, axtarış 0 nəticə. Seed **istifadəçi tərəfindən icra olunur** — nəticə §14.9 | **CRITICAL** | ⏳ indi (M-5) |
| **R-16** | **Render Postgres `plan: free`** (`render.yaml:14`) — Render free Postgres yaradıldıqdan **30 gün sonra silinir** və **avtomatik backup yoxdur**. Yəni seed-dən sonra da data **müddətlidir**: instans ömrü bitəndə hər şey yenidən itəcək və bərpa mənbəyi yalnız `seed.ts` olacaq. ⚠️ Qeyd: bu risk **gələcəyə** aiddir — mövcud boşluğun səbəbi kimi **sübut olunmayıb** (bax §14.7 «təkzib cəhdi») | **HIGH** | Faza 1 (plan qərarı Faza 1-ə saxlanıldı) |

---

## 11. PHASE 0 ACCEPTANCE CRITERIA

> **«Mühit» sütunu niyə əlavə olundu:** meyarların bir hissəsi **yalnız lokal DB-də** doğrulanıb. Production DB
> boş olduğu üçün eyni rəqəmlər canlıda **təkrarlanmır** (məs. meyar 16: lokal 13/74/108 ↔ production **0/0/0**).
> Kağız üzərində PASS ≠ production-da PASS — cədvəl bunu artıq özü göstərir.
>
> Mühit dəyərləri: **KOD** = repo/konfiq faylı · **BUILD** = lokal build/test gate-i · **LOKAL** = lokal DB
> (`marketplace_dev`, dolu) · **CANLI** = production (`tap360-api.onrender.com` / `360tap.az`, boş DB).

| # | Meyar | Mühit | Vəziyyət | Sübut |
|---|---|---|---|---|
| 1 | Backend normal cavab verir | LOKAL + **CANLI** | ✅ | Lokal: DB+Redis+Meili ölü ikən 3 s-də qalxdı. Canlı: 45/45 paralel sorğu **200**, maks 0.91 s (§14.3) |
| 2 | `/health` işləyir | LOKAL + **CANLI** | ✅ | Lokal 200 / 0.089 s (DB düşəndə də). Canlı 200, `uptimeSec` monoton artır |
| 3 | `/health/ready` işləyir | LOKAL + **CANLI** | ✅ | Lokal: DB yoxdursa 503 + detal. Canlı: **200**, tam dependency ağacı |
| 4 | DB connection healthy | **CANLI** | ✅ | `{"database":{"required":true,"ok":true,"status":"connected"}}` — canlıdan alınıb. ⚠️ **Bağlantı** sağlamdır, **məzmun** yoxdur (R-15) |
| 5 | Backend unavailable olduqda frontend asılı qalmır | LOKAL (Faza 0 build-i) | ✅ / ⏳ | Bütün route-lar ≤ 1.35 s (§9.2). Canlıda bu ssenari **təkrarlana bilmir** — backend hazırda sağlamdır; həm də Vercel production hələ Faza 0 build-ini vermir (§14.6) |
| 6 | `/elanlar` 60–120 s gözləmir | LOKAL + **CANLI** | ✅ | Lokal **0.04 s** / **0.05 s** (keşsiz). Canlı `GET https://360tap.az/elanlar` → **200, 0.54 s** |
| 7 | Homepage sonsuz skeleton göstərmir | LOKAL + **CANLI** | ✅ | Lokal: 12 elan / fallback, 0.03 s. Canlı: **200, 0.58 s**, SSR markup-da `$RX` = **0** (həll olunmamış Suspense sərhədi yoxdur) |
| 8 | TypeScript real errors = 0 | KOD + BUILD | ✅ | `api` 0, `frontend` 0 (əvvəl 11) |
| 9 | `ignoreBuildErrors` silinib | KOD | ✅ | `next.config.ts`-də yalnız şərh qalıb, açar yoxdur |
| 10 | ESLint blocking errors = 0 | BUILD | ✅ | 40 error → **0** (307 warning qalır — R-11) |
| 11 | `ignoreDuringBuilds` silinib | KOD | ✅ | `next.config.ts` + real ESLint quruldu |
| 12 | Production build PASS | BUILD | ✅ | Hər iki paket, gate-lər aktiv; `next build` exit 0, 38/38 statik səhifə (§14.2) |
| 13 | Search failure sistemi çökdürmür | LOKAL + **CANLI** | ✅ | Lokal: DEGRADED-də 200 + 5 nəticə. Canlı: `/search?q=iphone` **200**, `meta.degraded: true`, 0 nəticə (boş DB) |
| 14 | API contract kritik mismatch-ləri düzəldilib | LOKAL | ✅ / ⏳ | 4 səhifə + mərkəzi `unwrap()`. **Canlıda ölçülə bilmir** — boş DB heç bir siyahı qaytarmır, envelope faktiki data ilə yoxlanmayıb |
| 15 | Əsas route-larda graceful error handling | LOKAL + **CANLI** | ✅ | Lokal: fallback UI, 503 mapping. Canlı: 14 route-un heç birində xam xəta/stack trace yoxdur (§14.4) |
| 16 | Auth/media/taxonomy regress etməyib | **YALNIZ LOKAL** | ⚠️ **PASS (lokal) / ⏳ CANLI** | Lokal: argon2/guard-lar toxunulmayıb, auth axını **yaxşılaşdı** (409 bug düzəldi), **13 kök kateqoriya, 74 region, 108 elan**. ⛔ **Bu rəqəmlər production-a AİD DEYİL** — canlıda **0 kateqoriya / 0 region / 0 elan**. Taksonomiya production-da yalnız seed-dən sonra doğrulana bilər (§14.9) |
| 17 | Smoke test report hazırlanıb | SƏNƏD | ✅ | §9 (lokal) + §14 (production doğrulaması) |

**Nəticə:** 17 meyardan **16-sı** öz mühitində ödənilib. Meyar **16** kağız üzərində PASS-dır, **production-da hələ
yox** — production DB seed edilib eyni sayğaclar (kateqoriya / region / elan) canlıda ≠ 0 alınana qədər bu meyar
production üçün **AÇIQ** sayılır.

---

## 12. RECOMMENDATION FOR PHASE 1

Faza 0 texniki baza problemlərini həll etdi, lakin **məlumat davamlılığı hələ təmin olunmayıb**. Faza 1 üçün prioritet sırası:

1. **Obyekt storage + CDN (R-3)** — ən yüksək prioritet. Hazırda hər deploy istifadəçi şəkillərini silir; bu, Faza 2-də real elan axını başlayanda dərhal məlumat itkisinə çevriləcək. Cloudflare R2 + presigned upload.
2. **Render free → paid (EU region)** — efemer disk, cold start və tək-region gecikməsini birdəfəlik həll edir (~$25-30/ay).
3. **CI gate** — GitHub Actions-da `typecheck + lint + test + build` hər PR-da. Faza 0-da gate-lər bərpa olundu, amma onları **məcbur edən** avtomatik mexanizm yoxdur.
4. **`backend/` silinməsi** — dev rewrite artıq NestJS-ə yönləndiyi üçün risk minimaldır; əvvəlcə köçürülməli məntiq (voice-parser, realestate, import) siyahılansın.
5. **Ölü kod təmizliyi** — ~75 əlçatmaz komponent + 7 orphan `*Client.tsx`. Bu, Faza 2-də kateqoriya engine işini xeyli asanlaşdıracaq.
6. **Təhlükəsizlik başlıqları (R-8)** — CSP/XFO/nosniff (Faza 0 əhatəsinə daxil deyildi, ona görə edilmədi).

**Faza 2-yə keçməzdən əvvəl 1 və 3 tamamlanmalıdır** — əks halda kateqoriya engine üzərində qurulan elanların şəkilləri itəcək və regressiyalar yenidən aşkarlanmadan keçəcək.

---

---

## 13. PRODUCTION DEPLOYMENT — BACKEND (2026-09-02, 11:20–11:27 UTC)

### 13.1 Nə edildi
- Commit `8ce5328` (**yalnız `api/` + `render.yaml`**) → `origin/main`-ə push → Render auto-deploy.
- `.github/` **qəsdən commit edilmədi** (GitHub token-də `workflow` scope yoxdur → push rədd olunardı).
- Frontend **DEPLOY EDİLMƏDİ** (aşağıdakı blokerə görə).

### 13.2 Backend nəticəsi: ✅ UĞURLU

| Yoxlama | Nəticə |
|---|---|
| Push→cavab müddəti | **66 saniyə** |
| `GET /health` | **200** — `{"ok":true,"service":"360tap.az api","uptimeSec":147}` |
| Yeni kodun təsdiqi | `uptimeSec` sahəsi **yalnız Faza 0 kodunda var** → deploy təsdiqləndi |
| Restart döngəsi | **YOX** — uptime davamlı artır (19→29→40→75→82→88→147 s) |
| `GET /health/ready` | **200**, `database: connected` |
| Cavab müddətləri | `/health` 0.27 s · `/categories` 0.30 s · `/listings` 0.29 s · `/search` 0.60 s |

**Kök səbəb düzəlişi canlıda təsdiqləndi:** İlk ~30 saniyədə `/health/ready` **503** qaytardı (`database: disconnected — Can't reach database server at dpg-…:5432`), lakin `/health` **200** verməyə davam etdi və proses **çıxmadı**. Arxa plan retry backoff DB-yə yenidən qoşuldu → `/health/ready` 200-ə keçdi.
Köhnə kodda bu ssenari prosesin ölümü ilə bitirdi (`$connect()` throw → unhandled rejection). **Bu, Faza 0-ın ən vacib düzəlişinin canlı sübutudur.**

### 13.3 ⛔ BLOKER: Production database BOŞDUR

| Endpoint | HTTP | Nəticə |
|---|---|---|
| `/api/v1/categories` | 200 | **0 kateqoriya** |
| `/api/v1/geo/regions` | 200 | **0 region** |
| `/api/v1/listings?limit=5` | 200 | **0 elan**, `meta.total: 0` |
| `/api/v1/search?q=iphone` | 200 | 0 nəticə, `meta.degraded: true` (Postgres fallback işləyir) |

**Sxem sağlamdır, data yoxdur:** cavablar `200 + boş massiv`-dir. Cədvəllər mövcud olmasaydı Prisma `P2021` → 5xx qaytarardı. Yəni `prisma migrate deploy` işləyib, cədvəllər var, **sətir yoxdur**.

**Bu, Faza 0 dəyişikliyindən QAYNAQLANMIR — sübutlar:**
1. Dəyişikliyim DB-yə yazan bir əməliyyatı **çıxarıb** (startup seed), əlavə etməyib. Yazma əməliyyatının silinməsi data silə bilməz.
2. Deploy-dan əvvəl app **heç vaxt başlamırdı** (70 s timeout-lar; köhnə `/health`-də `uptimeSec` sahəsi yox idi) → mənim kodum production DB-yə heç vaxt toxunmayıb.
3. Audit günü (dəyişiklikdən əvvəl) canlı ana səhifədə **0 qiymət etiketi**, sitemap-da **5 URL** var idi — artıq datasız vəziyyət.
4. Production-da nə migration, nə seed işlətmişəm.

**Ehtimal olunan səbəb (təsdiqlənməyib):** Render **free** Postgres-in ömrü bitib/instans yenidən yaradılıb. Əvvəlki davranışda köhnə `Dockerfile` hər başlanğıcda `prisma:seed` işlədirdi və boş DB-ni avtomatik doldururdu — lakin app heç vaxt başlamadığı üçün bu da baş vermədi. Faza 0-da avto-seed (destruktiv olduğu üçün) çıxarıldığından, boş DB indi boş qalır.

### 13.4 Digər asılılıqların canlı vəziyyəti

| Asılılıq | Status | Təsir |
|---|---|---|
| PostgreSQL | ✅ `connected` | — |
| Meilisearch | ⚠️ `degraded` (`MeiliSearchApiError`) | **Sistem çökmür** — `/search` Postgres fallback ilə 200 qaytarır (`meta.degraded: true`). Auditdə tapılan ölü Meili Cloud instansı ilə uyğundur |
| Redis | ⚠️ `reconnecting` | Opsional — API işləyir. Render free Key Value yoxlanmalıdır |

### 13.5 Frontend deploy — DAYANDIRILDI *(bu status sonra dəyişdi — bax §14.6)*
Göstərişinizə uyğun (**«Backend healthy olmadan frontend deploy ETMƏ»** və **«gözlənilməyən problem yaranarsa: DAYAN»**), 11:27 UTC-də Vercel deploy-u **icra edilmədi**.

> **YENİLƏNMƏ (2026-09-02, günortadan sonra):** Backend sağlam olduğu təsdiqləndikdən sonra frontend commit-i `5150ee0` **`origin/main`-ə push edildi** (əvvəl `ahead 1` idi) → Vercel auto-deploy tetikləndi. Eyni gün `ffc44d8` (`.github/workflows/keep-alive.yml`) də push edildi — bu, `workflow` scope problemi həll olunduğu üçün mümkün oldu (§13.1-də «qəsdən commit edilmədi» yazılmışdı; artıq git-də 1 workflow var). **Vercel production build-inin faktiki vəziyyəti §14.6-də ölçülüb.**

---

## 14. FAZA 0 PRODUCTION DOĞRULAMASI (2026-09-02)

### 14.1 Metodologiya

**23 agentli paralel doğrulama.** Faza 0-ın hər iddiası (§7, §8, §9, §11) müstəqil agentlərə paylandı; hər agent
öz sahəsini sıfırdan ölçdü. **Hər kritik tapıntı üçün ayrıca «adversarial təkzib cəhdi»** aparıldı — yəni tapıntını
təsdiqləmək yox, **yıxmaq** üçün kontr-sübut axtarıldı. Yalnız təkzib cəhdindən sağ çıxan iddialar bu bölməyə düşdü.

> Bu metodun praktiki nəticəsi: aşağıdakı «Açıq problemlər» cədvəlindəki bəndlərin bir hissəsi məhz təkzib
> cəhdləri zamanı üzə çıxdı, hesabatın ilkin iddialarından deyil. Eyni səbəbdən §8-dəki `235 URL` rəqəmi
> **etibarsız elan olundu** və §4-dəki «seed faylları toxunulmayıb» iddiası **köhnəlmiş** kimi düzəldildi.

### 14.2 Build gate-ləri — həqiqətən işləyirmi?

| Paket | Yoxlama | Nəticə |
|---|---|---|
| API | `tsc` | ✅ **0 xəta** |
| API | `eslint` | ✅ **0 xəta, 0 xəbərdarlıq** |
| API | `jest` | ✅ **8 suite, 15 test** |
| API | `nest build` | ✅ OK |
| Frontend | `tsc` | ✅ **0 xəta** |
| Frontend | `eslint` | ✅ **0 xəta**, 307 xəbərdarlıq (bloklamır — R-11) |
| Frontend | `next build` | ✅ **exit 0**, **38/38 statik səhifə**, **9.81 s** |

**Gate-lərin real olduğu ayrıca təsdiqləndi:** `next.config.ts`-də `typescript.ignoreBuildErrors` və
`eslint.ignoreDuringBuilds` açarları **fiziki olaraq yoxdur** (yalnız niyə silindiyini izah edən şərh qalıb), və
build çıxışında **«Linting and checking validity of types»** mərhələsi real işləyir. Yəni gate «bərpa olundu»
iddiası kosmetik deyil — build tipi/lint xətası ilə **həqiqətən düşür**.

### 14.3 Canlı backend — davranış və təhlükəsizlik

| Ölçü | Nəticə |
|---|---|
| Paralel yük | **45 sorğunun hamısı 200**, ən yavaş **0.91 s** |
| Proses sabitliyi | `uptimeSec` **monoton artır** → **restart döngəsi YOXDUR** (Faza 0-ın əsas düzəlişinin canlı sübutu) |
| Auth qapısı | Tokensiz qorunan endpoint-lər → **401** |
| Validasiya | Səhv gövdə/parametr → **422** |
| CORS | Yalnız `https://360tap.az` + `https://www.360tap.az`; digər origin-lər rədd olunur |
| Təhlükəsizlik başlıqları | **helmet** aktiv · **HSTS** var · `x-powered-by` **yoxdur** |
| Rate limit | **300 sorğu / 60 s** (aktiv və cavab başlıqlarında görünür) |
| Yazma cəhdləri | ⛔ **Bütün yazma cəhdləri 401/422 ilə rədd olundu** — production DB-yə bu doğrulama zamanı **heç nə yazılmadı** |

### 14.4 Frontend × boş DB — asılı qalma aradan qalxıbmı?

| Ölçü | Nəticə |
|---|---|
| Yoxlanan route sayı | **14** |
| Ən yavaş route | **2.26 s** |
| Əvvəlki davranış | 60–120 s asılı qalma → ✅ **ARADAN QALXIB** |
| Suspense sərhədləri | **Hamısı həll olunur** — SSR markup-da `$RX` = **0**, sonsuz skeleton yoxdur |
| Xəta sızması | Xam xəta mətni / stack trace **yoxdur** |
| Şablon bütövlüyü | header + footer **hər route-da** render olunur |
| Boş-vəziyyət mesajları | SSR markup-ında **real gəlir** (client-side «sonradan görünən» mesaj deyil) |

> Yəni boş DB **çirkin, lakin sınıq olmayan** sayt verir: səhifələr açılır, naviqasiya işləyir, istifadəçi
> «heç nə yoxdur» mesajı görür — spinner-də ilişmir və xəta ekranı almır.

### 14.5 Performans bazası (**BOŞ DB** — bu tavan deyil, **döşəmə**dir)

| Ölçü | Nəticə |
|---|---|
| Backend median cavab | **0.25–0.58 s** |
| Frontend median cavab | **0.25–0.36 s** |
| Timeout | **Yoxdur** |
| Sıxılma | **brotli hər yerdə** — FE HTML-də **78–82 %** azalma |
| Statik asset | `immutable` + CDN **HIT** |
| Cold start | 17 dəqiqəlik boşdayanmadan sonra **MÜŞAHİDƏ OLUNMADI** |

> ⚠️ **Bu rəqəmlər baza (döşəmə) sayılmalıdır, hədəf yox.** Boş DB-də sorğular sıfır sətir qaytarır — nə JOIN,
> nə sıralama, nə səhifələmə yükü var. Seed-dən sonra eyni ölçmələr **təkrar** aparılmalı və real baza kimi
> yazılmalıdır.

### 14.6 Vercel production build-i — ⏳ TƏSDİQLƏNMƏYİB

`5150ee0` **`origin/main`-ə push edildi** (təsdiqləndi: `git branch -r --contains 5150ee0` → `origin/main`).
Lakin bu doğrulama anında canlı Vercel deployment-i **hələ Faza 0-dan əvvəlki build-i** verirdi. Sübut:

| Yoxlama | Nəticə |
|---|---|
| Marker | `5150ee0` `frontend/app/layout.tsx`-dən `fetch('/api/clientlog', …)` inline blokunu **sildi** |
| Lokal mənbə | `grep clientlog frontend/app/layout.tsx` → yalnız şərh (blok yoxdur) |
| Canlı HTML | 3 ayrı **`x-vercel-cache: MISS`** (təzə render) cavabında `clientlog` **hər dəfə 2 dəfə** mövcuddur |
| Nəticə | Canlı production build-i `5150ee0`-dən **əvvəlkidir** — deploy ya davam edir, ya tetiklənməyib, ya da uğursuz olub |

> **Bu, «frontend deploy edildi» iddiasını hazırda təsdiqləmir.** Push faktdır; **production-a çatması fakt deyil**.
> Yoxlama əmri (təkrar icra üçün):
> `curl -s "https://360tap.az/elanlar?q=cb$RANDOM" | grep -c clientlog` → **0** olduqda yeni build canlıdadır.
> Vercel dashboard-da `5150ee0` deployment-inin statusu da yoxlanmalıdır.

### 14.7 Təkzib cəhdi — «Production DB artıq bir dəfə itibmi?»

R-16 (Render free Postgres) qeyd edilərkən cazibədar, lakin **təhlükəli** bir izah özünü təklif edir:
*«DB artıq bir dəfə silinib, ona görə boşdur.»* Bu iddia **xüsusi olaraq yıxılmağa cəhd edildi və SÜBUT OLUNMADI.**

**İddianın yeganə görünən dayağı:** Next.js `fetch` keşində **74 region** və **46 elan** qaytaran cavab
entry-lərinin mövcudluğu — yəni «nə vaxtsa dolu API cavab vermişdi».

| Yoxlama | Tapıntı | Nəticə |
|---|---|---|
| Həmin 74 region / 46 elan entry-lərinin **hədəf host**-u | `localhost:5500` / `127.0.0.1:5500` | ⛔ **LOKAL API** — production deyil |
| `tap360-api.onrender.com` üçün olan keş entry-ləri | **hamısı bu gün yazılıb** | Tarixi məlumat daşımır |
| Həmin production entry-lərinin məzmunu | **hamısı 0 element** qaytarır | Production heç vaxt dolu görünməyib |

**Hökm:** keşdəki «dolu» cavablar **lokal dev API-nin izidir**, production-un deyil. Production DB-nin
nə vaxtsa dolu olduğuna dair **heç bir sübut tapılmadı** — §13.3-dəki müşahidələr (audit günü canlıda
0 qiymət etiketi, sitemap 5 URL) də əksini deyil, **eynisini** göstərir.

> **Buna görə R-16 keçmişə deyil, GƏLƏCƏYƏ aid risk kimi yazılıb.** «DB itib» kimi bir izah sənədə
> **qəsdən salınmadı** — çünki o, sübutsuzdur. R-16-nın real məzmunu budur: `plan: free` Postgres-in
> ömrü məhduddur və backup-ı yoxdur, ona görə **seed-dən sonrakı data da müddətlidir**.
>
> **İstifadəçi qərarı:** indi seed edilir; **plan (free → paid) qərarı Faza 1-ə saxlanılır.**

### 14.8 Açıq problemlər (Faza 0-dan qalan)

| # | Problem | Hazırkı təsir | Faza |
|---|---|---|---|
| A-1 | **Meilisearch instansı mövcud deyil** | `/search` **DEGRADED** — Postgres fallback ilə 200 qaytarır, təxminən **~326 ms cərimə**. **Circuit breaker yoxdur** → hər sorğu ölü Meili-yə cəhd edib timeout-a düşür | Faza 4 |
| A-2 | **Redis heç vaxt qoşulmur** | API işləyir (opsional), lakin **ERP nonce yolu latent 500 riski** daşıyır — hazırda **atəş açmır**, çünki həmin yol canlıda çağırılmır | Faza 1 |
| A-3 | **SEO status kodları** — `/k/*`, `/seher/*` 301/307 yerinə 200 + `<meta refresh>` | Axtarış sistemləri üçün zəif siqnal | ayrıca düzəldilir (§9.3, Faza 8) |
| A-4 | **Frontend-də 0 test** | Heç bir avtomatik regress qoruması yoxdur — bütün frontend doğrulaması əl ilə/agent ilə aparılır | Faza 1 |
| A-5 | **Vercel production build-i təsdiqlənməyib** | Faza 0 frontend düzəlişləri (SSR timeout, fallback UI, error.tsx) canlıda **hələ aktiv olmaya bilər** — bax §14.6 | indi |

### 14.9 Production seed — ⏳ **GÖZLƏYİR**

Seed **istifadəçi tərəfindən** icra olunur (`npm run prisma:seed`, `M-5`). Bu bölmə **nəticə gəldikdən sonra**
doldurulacaq. **Nəticə məlum olmadığı üçün burada heç bir rəqəm yazılmayıb.**

**Seed-dən dərhal sonra yoxlanmalı (doldurulacaq):**

| Yoxlama | Gözlənilən | Faktiki | Status |
|---|---|---|---|
| Seed loqunda hədəf DB | `☁️ UZAQ BAZA` (lokal **deyil**) | — | ⏳ GÖZLƏYİR |
| `GET /api/v1/categories` | 13 kök kateqoriya | — | ⏳ GÖZLƏYİR |
| `GET /api/v1/geo/regions` | 74 region | — | ⏳ GÖZLƏYİR |
| `GET /api/v1/listings?limit=5` | `meta.total` > 0 (demo OPT-IN olduğu üçün **0 gözləniləndir**, əgər `SEED_DEMO_LISTINGS=true` verilməyibsə) | — | ⏳ GÖZLƏYİR |
| `curl https://360tap.az/sitemap.xml \| grep -c '<loc>'` | > 5 | — | ⏳ GÖZLƏYİR |
| Ana səhifədə kateqoriya menyusu | dolu | — | ⏳ GÖZLƏYİR |
| §11 meyar 16 (taksonomiya) | production-da PASS | — | ⏳ GÖZLƏYİR |

> ⚠️ **Diqqət (`25ee6c8`-dən sonra):** default seed **demo elan yaratmır**. Yəni seed uğurlu olsa belə
> `listings` **0 qalacaq** — bu **gözlənilən** davranışdır, nasazlıq deyil. Elan sayının artması üçün ya real
> istifadəçi elanları, ya da açıq şəkildə `SEED_DEMO_LISTINGS=true` lazımdır (production-da **tövsiyə olunmur**).

---

## PHASE 0 VERDICT (LOKAL): **PASS**  ·  PRODUCTION PHASE 0: **GÖZLƏMƏDƏ**

**Bütün 17 qəbul meyarı ödənilib və lokal olaraq uçdan-uca doğrulanıb.**

Faza 0-ın əsas hədəfi — *«Frontend → API → Database → Search → Media zəncirinin hər hissəsi işləməlidir»* — kod səviyyəsində tam təmin olunub və sübutla ölçülüb:

- Ən kritik defekt (**API-nin heç vaxt `listen()`-ə çatmaması**) kök səbəb səviyyəsində, üç müstəqil nöqtədə düzəldildi və DB+Redis+Meili tamamilə söndürülmüş halda test edildi.
- İkinci kritik defekt (**SSR-in sonsuz asılması**) aradan qaldırıldı: `/elanlar` 120 s-dən **0.04 s**-ə düşdü.
- Build gate-ləri həqiqi hala gətirildi (11 TS + 40 lint xətası **kök səbəbdən** düzəldildi, heç bir suppress istifadə edilmədən).
- Smoke test zamanı əlavə real bug tapıldı və düzəldildi (**qeydiyyat→login 409**).
- Mövcud işləyən hissələr (argon2 auth, guard-lar, media servisi, taksonomiya, elan datası) **regress etmədi**.

### ⚠️ PASS-ın şərti: production-da təsdiq hələ qalır

Bu «PASS» **mühəndislik işinin tamamlanmasına** aiddir. **Canlı sayt artıq ölü deyil — qalxıb və cavab verir, lakin məzmunsuzdur.** Ölçülmüş vəziyyət:

| Nə | Vəziyyət | Sübut |
|---|---|---|
| Backend əlçatanlığı | ✅ **HƏLL OLUNDU** | `tap360-api.onrender.com` — 45/45 sorğu 200, `/health/ready` 200, `database: connected` |
| Frontend əlçatanlığı | ✅ **HƏLL OLUNDU** | `360tap.az/` 200 / 0.58 s · `/elanlar` 200 / 0.54 s — 60–120 s asılı qalma **yoxdur** |
| Saytın **məzmunu** | ⛔ **BOŞ** | 0 kateqoriya, 0 region, 0 elan, sitemap 5 URL. Səbəb: production DB boşdur (R-15); seed **istifadəçi tərəfindən icra olunur** — §14.9 |
| Vercel production **build-i** | ⏳ **TƏSDİQLƏNMƏYİB** | Canlı HTML hələ `5150ee0`-də silinmiş `/api/clientlog` blokunu daşıyır → §14.6 |

**Yəni əvvəlki iki bloker-dən biri bağlandı:** M-1 (Render Postgres instansı) ✅ — DB canlıdır və qoşulur; M-2 (deploy icazəsi) ✅ — backend deploy edildi, frontend push edildi. **Açıq qalan:** M-5 (seed) və Vercel build təsdiqi.

**Növbəti addımlar:** (1) seed nəticəsini §14.9-ya yazmaq, (2) Vercel deployment-in `5150ee0`-ə keçdiyini təsdiqləmək (§14.6), (3) hər ikisindən sonra §9 smoke matrisini **canlıda** təkrar icra etmək.

**FAZA 1-ə keçmirəm — göstərişinizi gözləyirəm.**
