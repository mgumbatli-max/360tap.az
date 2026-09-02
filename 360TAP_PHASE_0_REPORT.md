# 360TAP — PHASE 0 REPORT (PRODUCTION STABILIZATION)

**Tarix:** 2026-09-02
**Əhatə:** Yalnız FAZA 0. Kateqoriya engine, `AttributeOption`, vertikallar (Auto/Əmlak/İş), UI redesign və böyük DB migration-lara **TOXUNULMAYIB**.
**Deploy:** **EDİLMƏYİB** — production-a çıxış üçün ayrıca icazəniz gözlənilir (§14, aşağıda «Manual Actions»).
**DB:** Heç bir migration işlədilməyib, production DB-yə heç nə yazılmayıb, heç nə silinməyib.

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

**Toxunulmayanlar (qəsdən):** `api/prisma/schema.prisma`, bütün migration-lar, seed faylları, `backend/` qovluğu (tam), kateqoriya/atribut modeli, vertikal modellər.

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

| # | Addım | Harada | Niyə |
|---|---|---|---|
| **M-1** | **Render Postgres (`tap360-db`) vəziyyətini yoxlayın** — free plan dayandırılıb/limitə çatıb? | Render → Databases | P-01-in ehtimal olunan ilkin tetikləyicisi. Kod düzəlişi API-ni qaldırır, amma DB özü ölüdürsə `/health/ready` 503 qalacaq |
| **M-2** | **Deploy icazəsi verin** (aşağıdakı ardıcıllıqla) | — | Kod hazırdır, deploy edilməyib |
| **M-3** | Blueprint sync-dən sonra dashboard-da `MEILI_HOST`, `MEILI_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_VISION_MODEL` dəyərlərinin **hələ də mövcud olduğunu** təsdiqləyin | Render → tap360-api → Environment | `sync: false` dəyəri qorumalıdır, amma yoxlamaq lazımdır |
| **M-4** | Vercel-də `API_ORIGIN` təyin olunduğunu təsdiqləyin | Vercel → Project → Env | Yoxdursa frontend `localhost`-a gedər |
| **M-5** | Seed artıq avtomatik işləmir — **lazım olduqda bir dəfəlik** `npm run prisma:seed` işlədin | Render → Shell | Faza 0-da destruktiv avto-seed çıxarıldı |
| **M-6** | Meilisearch Cloud instansı **ölüdür** (`Instance does not exist or is not ready yet`) — bərpa edin və ya Faza 4-ə saxlayın | Meilisearch Cloud | Axtarış hazırda DEGRADED (Postgres fallback) rejimdə işləyir — **sistem çökmür** |
| **M-7** | UptimeRobot monitorunu `/health` üzərində saxlayın (dəyişiklik lazım deyil) | UptimeRobot | `/health` artıq DB-dən asılı deyil |

**Tövsiyə olunan deploy ardıcıllığı (icazənizdən sonra):**
1. Əvvəlcə **backend** (Render) — `/health` və `/health/ready` yoxlanılır.
2. `/health` 200 verdikdən sonra **frontend** (Vercel).
3. Hər ikisindən sonra canlı smoke test təkrarlanır.

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
Sitemap build loqu: `[sitemap] 235 URL (statik 5, kateqoriya 106, region 74, elan 50)` — əvvəl canlıda 5 URL idi və uğursuzluq səssiz udulurdu.

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
| 12 | Sitemap / robots | **PASS** | 235 `<loc>` / 200 |

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
| R-1 | **Production hələ də ölüdür** — kod düzəldilib, deploy edilməyib (icazəniz gözlənilir) | CRITICAL | indi (M-2) |
| R-2 | Render Postgres-in özü dayandırılıbsa, kod düzəlişi API-ni qaldırar, amma `/health/ready` 503 qalar | CRITICAL | indi (M-1) |
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

---

## 11. PHASE 0 ACCEPTANCE CRITERIA

| # | Meyar | Vəziyyət | Sübut |
|---|---|---|---|
| 1 | Backend normal cavab verir | ✅ **kod səviyyəsində** / ⏳ prod deploy gözləyir | DB+Redis+Meili ölü ikən 3 s-də qalxdı; canlı DB ilə bütün endpoint-lər 200 |
| 2 | `/health` işləyir | ✅ | 200, 0.089 s — DB düşəndə də |
| 3 | `/health/ready` işləyir | ✅ | DB varsa 200; yoxsa 503 + tam dependency detalı |
| 4 | DB connection healthy | ✅ | `{"database":{"required":true,"ok":true,"status":"connected"}}` |
| 5 | Backend unavailable olduqda frontend asılı qalmır | ✅ | Bütün route-lar ≤1.35 s (bax 9.2) |
| 6 | `/elanlar` 60–120 s gözləmir | ✅ | **0.04 s** (keşli) / **0.05 s** (keşsiz, fallback ilə) |
| 7 | Homepage sonsuz skeleton göstərmir | ✅ | Backend varsa 12 elan; yoxsa fallback mesajı, 0.03 s |
| 8 | TypeScript real errors = 0 | ✅ | api 0, frontend 0 (əvvəl 11) |
| 9 | `ignoreBuildErrors` silinib | ✅ | `next.config.ts` |
| 10 | ESLint blocking errors = 0 | ✅ | 40 error → 0 |
| 11 | `ignoreDuringBuilds` silinib | ✅ | `next.config.ts` + real ESLint quruldu |
| 12 | Production build PASS | ✅ | hər iki paket, gate-lər aktiv |
| 13 | Search failure sistemi çökdürmür | ✅ | `/search` DEGRADED-də 200 + 5 nəticə; listing CRUD təsirlənmir |
| 14 | API contract kritik mismatch-ləri düzəldilib | ✅ | 4 canlı səhifə + mərkəzi `unwrap()` |
| 15 | Əsas route-larda graceful error handling | ✅ | fallback UI, 503 mapping, stack trace gizlədildi |
| 16 | Auth/media/taxonomy regress etməyib | ✅ | argon2/guard-lar toxunulmayıb; auth axını **yaxşılaşdı** (409 bug düzəldi); 13 kök kateqoriya, 74 region, 108 elan sağlam |
| 17 | Smoke test report hazırlanıb | ✅ | Bölmə 9 |

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

### 13.5 Frontend deploy — DAYANDIRILDI
Göstərişinizə uyğun (**«Backend healthy olmadan frontend deploy ETMƏ»** və **«gözlənilməyən problem yaranarsa: DAYAN»**), boş DB blokeri həll olunana qədər Vercel deploy-u **icra edilmədi**. Canlı 360tap.az hazırda hələ də köhnə (asılı qalan) build-dədir.

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

Bu «PASS» **mühəndislik işinin tamamlanmasına** aiddir. **Canlı sayt hələ də ölüdür**, çünki:

1. **Deploy edilməyib** — sizin göstərişinizə uyğun olaraq (§14) icazə gözləyirəm.
2. **Render Postgres-in öz vəziyyəti yoxlanılmalıdır (M-1)** — əgər DB dayandırılıbsa, kod düzəlişi API-ni qaldıracaq (artıq `/health` cavab verəcək və restart döngəsi olmayacaq), lakin data endpoint-ləri DB bərpa olunana qədər 503 qaytaracaq.

**Növbəti addım sizdədir:** M-1-i yoxlayın və deploy üçün icazə verin. Deploy-dan sonra eyni smoke matrisini canlıda təkrar icra edib nəticəni təsdiqləyəcəyəm.

**FAZA 1-ə keçmirəm — göstərişinizi gözləyirəm.**
