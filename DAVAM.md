# DAVAM NÖQTƏSİ — production sabitləşdirmə (2026-09-05, ikinci sessiya)

> Bu fayl kompüter söndürüləndən sonra işi **eyni yerdən** davam etdirmək üçündür.

---

## 0. SON SESSİYADA NƏ OLDU (2026-09-05, axşam)

### E2E ARTIQ TAM YAŞILDIR: **225/225** (əvvəl 218/225)

Sınıqların kök səbəbi tapıldı və düzəldildi — testlərin özündə deyil, **rate limit**-də idi:
`POST /auth/register` üzərində `@Throttle({limit:5, ttl:60_000})` var, E2E isə 12 qeydiyyat
göndərir. Bütün Playwright worker-ləri eyni soketdən gəlir (`ip:::1`), ona görə worker sayını
azaltmaq kömək etmirdi. Sübut (ardıcıl, `--workers=1` icra):

```
1-5  ✓          ← limit dolur
6    ✘  31s     ← 429
7    ✘  31s     ← 429
8-9  ✓          ← 6+7-nin 62s gözləməsi TTL pəncərəsini sıfırladı
```

### CANLIDA TAPILAN İKİ CİDDİ DEFEKT (ölçülüb, hələ TAM həll olunmayıb)

**(1) Rate limit bucket-i bütün istifadəçilər arasında PAYLAŞILIR.**
Ölçmə: `https://360tap.az/api/auth/login`-ə ardıcıl 14 sorğu → 14-cü **429**. Eyni anda
birbaşa `tap360-api.onrender.com`-a gedən sorğu keçirdi. Səbəb: `clientIp()` XFF zəncirinin
son elementini götürür (`TRUST_PROXY=1`), proxy arxasında bu Vercel-in çıxış IP-sidir.
**Nəticə: bir nəfər ~14 sorğu ilə bütün saytın girişini 60 saniyəlik bağlaya bilər.**
→ Diaqnostika əlavə olundu: `GET /api/health/net` (IP-lər hash-lənir, xam IP verilmir).
→ **NÖVBƏTİ ADDIM:** deploy-dan sonra canlıda `curl https://360tap.az/api/health/net` işlət,
   `chainLength`-ə bax və `TRUST_PROXY`-ni render.yaml-da düzgün hop sayına bağla.

**(2) Canlıda Redis QOPUQDUR** — `/api/health/ready` → `redis: "reconnecting"`.
Throttler səssizcə yaddaş fallback-ində işləyir (restartda sayğac sıfırlanır).
→ Render Key Value bağlantısı (`REDIS_URL`, `rediss://`, `family=0`) yoxlanmalıdır.


### İKİNCİ MƏRHƏLƏ — rate limit açarı DÜZƏLDİLDİ (middleware + imzalı IP)

Canlı ölçmə (`GET /api/health/net`) göstərdi ki, seçilən açar hər iki yolda EYNİ idi
(`605cb15cb0` = Render-in daxili proxy-si), yəni rate limit heç kimi ayırd etmirdi.
Zəncirin uzunluğu isə yola görə dəyişir (proxy 4 element, birbaşa 3) — ona görə sadəcə
`TRUST_PROXY` hop sayını düzəltmək işləmirdi.

**Həll (3 qat):**
1. `frontend/middleware.ts` — Vercel edge-də istifadəçinin real IP-sini oxuyur və
   `INTERNAL_IP_SECRET` ilə HMAC imzalayıb `/api/*` sorğularına qoşur.
2. `api/src/common/client-ip.ts` — imzanı yoxlayır (timing-safe, 5 dəqiqəlik yaş limiti).
   Prioritet: imzalı IP → `cf-connecting-ip` → köhnə XFF hop məntiqi.
3. 11 unit test (`client-ip.spec.ts`) — saxta imza, başqa sirr, imzasız başlıq, köhnə/gələcək
   timestamp, sirr yoxdur — hamısı RƏDD edilir.

Lokal uçdan-uca ölçmə:
| Sınaq | Nəticə |
|---|---|
| Frontend üzərindən XFF | `selectedKey` ≠ `socket` → imza qəbul edildi ✅ |
| Birbaşa XFF (imzasız) | `selectedKey` = `socket` → rədd ✅ |
| Saxta `x-client-ip` | `selectedKey` = `socket` → rədd ✅ |

⚠️ **QALAN ADDIM — SİRRİ PLATFORMALARDA QUR (yoxsa düzəliş İŞLƏMİR):**
`INTERNAL_IP_SECRET` dəyəri `api/.env`-dədir. EYNİ dəyər hər iki yerdə olmalıdır:
  · **Vercel** → Project Settings → Environment Variables → `INTERNAL_IP_SECRET`
  · **Render** (tap360-api) → Environment → `INTERNAL_IP_SECRET`
Sirr yoxdursa kod fail-safe davranır: imza yoxlanmır, köhnə (zəif) məntiqə düşür — yəni
heç nə sınmır, sadəcə düzəliş aktivləşmir.

### SSR diaqnostikası əlavə olundu
`lib/server-fetch.ts` artıq production-da da uğursuzluğun SƏBƏBİNİ loglayır
(`TIMEOUT` / `ŞƏBƏKƏ XƏTASI` / `HTTP <status>`). Əvvəl «Elan müvəqqəti yüklənmir»
ekranının səbəbi heç yerdə görünmürdü. İlk icrada dərhal iki şey üzə çıxdı:
`17 × HTTP 503 /ai/search` (lokalda `GROQ_API_KEY` yoxdur — canlıda var) və
`1 × TIMEOUT /search`.


### SSR trafiki də ayrıldı (ikinci boşluq bağlandı)
Middleware yalnız BRAUZER `/api/*` sorğularını imzalayır. Səhifə render-i zamanı
`lib/server-fetch.ts`-dən gedən sorğular isə Next.js serverindən çıxır — nə middleware-dən
keçir, nə də istifadəçinin açarını daşıyır. Diaqnostik log bunu dərhal göstərdi:
`18 × HTTP 429 /api/v1/listings/<id>` (limit route başına ayrı sayıldığı üçün `/listings`
normal işləyirdi, `/listings/:id` dolmuşdu — problem buna görə uzun müddət yanlış yerdə
axtarıldı). İndi SSR sorğuları `x-internal-ssr` + HMAC imzası daşıyır; backend onu
YALNIZ GET üçün qəbul edir (auth/yazma limitləri toxunulmaz). 20 unit test bunu qoruyur.

### E2E-nin son vəziyyəti: 223–225 / 225
`E2E_THROTTLE_BYPASS` düzgün ötürüləndə SSR 429 tamamilə yox oldu (log: 0).
Qalan 0–2 sınıq `02-search-filters.spec.ts:104` və `01-public.spec.ts:74` —
`waitForURL` timeout-ları. Bunlar İLK icrada da (düzəlişlərdən əvvəl) sınmışdı,
yəni yeni regressiya deyil. Maşın yükü 40+ load average-ə çatanda təkrarlanır.
⚠️ ÖLÇMƏ QAYDASI: E2E-ni yüklü maşında qiymətləndirmə — `uptime` load average
10-dan aşağı olmalıdır, əks halda brauzer klikləri gecikir və nəticə yalançı olur.

### Bu sessiyada tətbiq olunan düzəlişlər

| Düzəliş | Fayl | Sübut |
|---|---|---|
| 429 artıq sərt 404-ə çevrilmir (SEO deindeksləmə riski) | `frontend/lib/server-fetch.ts` | ölçüldü: HTTP 404 → 200 |
| Mağaza metadata-sı 429-da `noindex` qoymur | `frontend/app/magaza/[slug]/page.tsx` | kod |
| 429 mesajı azərbaycancadır + saniyə göstərir | `api/src/app.module.ts` | `«Çox sayda cəhd oldu. 60 saniyə sonra yenidən yoxlayın.»` |
| Hesab bloklanmasında `Retry-After` başlığı qoyulur | `api/src/app.module.ts` | kod |
| E2E throttle keçidi (yalnız qeyri-production, gizli açar) | `api/src/app.module.ts`, `frontend/e2e/fixtures.ts` | açarsız 429 · açarla 7/7 · yanlış açarla 429 · `NODE_ENV=production`-da 429 |
| `clientIp` ayrıca modula çıxarıldı (dövri asılılıq) | `api/src/common/client-ip.ts` | tsc təmiz |
| Diaqnostik `GET /health/net` | `api/src/health/health.controller.ts` | lokalda işləyir |

⚠️ **E2E-ni işə salarkən açar lazımdır** (yoxsa yenə 7 test sınacaq):
```bash
cd frontend
E2E_ALLOW_WRITE=1 E2E_THROTTLE_BYPASS=$(grep E2E_THROTTLE_BYPASS ../api/.env | cut -d= -f2) \
  npx playwright test
```
Açar `api/.env`-dədir (git-ə düşmür); `api/.env.example`-da sənədləşib.

---


## 0-B. BİLDİRİŞ TETİKLƏYİCİLƏRİ QURULDU (2026-09-06)

Audit (82 agent, 77 tapıntı) göstərdi ki, bildirişin ÇATDIRILMA borusu tam işlək idi
(model, 4 endpoint, Header-də zəng, bildirişlər səhifəsi), lakin bildirişi YARADAN
mənbə yalnız iki yerdə vardı: `chat.service.ts:171` və `reviews.service.ts:101`.
`NotificationType` enum-unda `price_drop` və `saved_search` dəyərləri var idi, amma
onları bir sətir kod belə yaratmırdı.

### Əlavə olunan üç bildiriş
| Bildiriş | Mexanizm | Sübut |
|---|---|---|
| Saxlanmış axtarışa uyğun yeni elan | cron, hər 15 dəq (`alerts/saved-search.service.ts`) | real icra: `saved_search=1` bildiriş yarandı (əvvəl 0 idi), təkrar icrada 0 |
| Elanın müddəti bitir | cron, gündə 1 dəfə (`alerts/expiry.service.ts`) | real icra: «iPhone 15 Pro Max 512GB elanının müddəti 2 gün sonra bitir», təkrar icrada 0 (7 günlük cooldown) |
| Sevimli elan satıldı/arxivləndi | `listings.service.ts setStatus()` çəngəli | 5 unit test |

Cron mexanizmi: `@nestjs/schedule@4` (NestJS 10 ilə uyğun versiya — v12 NestJS 11 tələb edir).
**Redis TƏLƏB ETMİR** — canlıda Redis hələ `reconnecting` vəziyyətindədir.

### Tələ: saxlanmış axtarışın formatı
`SavedSearch.query` frontend URL formatındadır (`a_brand=BMW`), backend isə `attrs` JSON
gözləyir. Tərcümə olmasa matcher atribut filtrlərini SƏSSİZCƏ itirər və istifadəçi
«BMW» axtarışına görə bütün avtomobillər üçün bildiriş alardı. `alerts/query-translate.ts`
bunu həll edir, 10 unit test qoruyur.

### Saxta UI-lar SÖNDÜRÜLDÜ
Canlıda istifadəçiyə yalan vəd verən 7 komponent render olunduqları yerdən çıxarıldı
(fayllar saxlanıldı, şərhlə izah edildi): `PriceDropAlert`, `PriceHistory` (Math.random!),
`FollowButton`, `PushSubscribe`, `TelegramBotConnect`, `EmailDigest`, `SavedMatches` (404).

### ⚠️ AŞKARLANAN, HƏLƏ DÜZƏLDİLMƏYƏN DEFEKT
**«Endirimli» sürətli filtri sınıqdır.** `QuickFilterChips.tsx:7` `sort=price_dropped`
göndərir, backend isə yalnız `new|price_asc|price_desc|popular` qəbul edir
(`query-listings.dto.ts:34`). Ölçüldü: backend **422**, istifadəçi «elan tapılmadı» görür.
Düzəliş üçün backend-ə endirim filtri (`oldPrice > price`) əlavə olunmalıdır — ayrı iş.

### Yoxlama
api unit **76/76** (əvvəl 47) · tsc (api+frontend) təmiz · `next build` keçir ·
E2E **224/225** (qalan 1 sınıq yükdən asılı flaky, düzəlişlə bağlı deyil).

---


## 0-C. SÜRƏTLİ FİLTRLƏR DÜZƏLDİLDİ (2026-09-06)

Ana səhifə/elanlar səhifəsindəki 8 sürətli filtr çipindən **7-si sınıq idi** — hamısı
backend-də mövcud olmayan parametrlər göndərirdi və HTTP **422** alırdı. İstifadəçi
düyməyə basıb «elan tapılmadı» görürdü.

Ölçmə (əvvəl → sonra):
| Filtr | Əvvəl | İndi |
|---|---|---|
| Çatdırılma var | 422 | 17 elan |
| Şəkilli | 422 | 107 elan |
| VIP | 422 | 4 elan |
| Təsdiqli satıcı | 422 | 2 elan |
| Bu gün (`sort=new`) | ✅ işləyirdi | ✅ |

Backend: `query-listings.dto.ts`-ə 4 boolean filtr (`hasDelivery`, `withPhoto`, `vip`,
`verified`) + `listings.service.ts`-də where şərtləri. 6 unit test.

⚠️ **İKİ AD ÜSLUBU**: URL-ə yazan komponentlər tarixən iki fərqli üslub işlədib —
çiplər `hasDelivery`, panel/sidebar isə `has_delivery` (`FilterSidebar`,
`UniversalTopBar`, `UniversalFullFilter`, `FilterChips`). Yalnız birini dəstəkləmək
digər qrupu sınıq saxlayardı, üstəlik paylaşılmış köhnə linklər də snake_case daşıyır.
`app/elanlar/page.tsx` HƏR İKİSİNİ qəbul edir, backend isə tək ad bilir.
Ölçüldü: `hasDelivery=1` = `has_delivery=1` = 17 elan (hər cütlük üçün eyni).

**ÇIXARILAN ÜÇ ÇİP** (real data yoxdur, saxlamaq yalan vəd olardı):
`Endirimli` (oldPrice > price şərtinə uyğun elan sayı SIFIR), `Sürətli satılır`
(proqnoz modeli yoxdur), `AI tövsiyəsi` (şəxsiləşdirmə yoxdur).

Yoxlama: api unit **82/82** · tsc təmiz · filtrlərin uçdan-uca ölçməsi yuxarıda.

---


## 0-D. DAVAM NÖQTƏSİ — 2026-09-06, gecə (Redis + filtr auditi)

> **AÇAN KİMİ BURADAN BAŞLA.** Bütün kod commit + push olunub (`ed24338`), işçi ağac təmizdir.

### QALAN YEGANƏ İŞ: tam E2E regressiyası
Sürətli filtr testləri (`e2e/06-filters.spec.ts`) **33/33 keçir**, lakin TAM dəst
(225 + 33 test) yenidən icra OLUNMAYIB — maşında **başqa layihə** (`360tools.az`)
E2E işlədirdi, yük 14-18 load average idi. Bu şəraitdə nəticə etibarsızdır.

```bash
# 1) Mühit
brew services start postgresql@16
cd api      && npm run build && node dist/main &
cd frontend && rm -rf .next && npm run build && npm run start &

# 2) YÜKÜ YOXLA (kritik — 8 core maşın)
uptime            # load average 5-dən aşağı olmalıdır
pgrep -f 360tools.az   # başqa layihənin testi işləməməlidir

# 3) Tam E2E
cd frontend
E2E_ALLOW_WRITE=1 E2E_THROTTLE_BYPASS=$(grep -E "^E2E_THROTTLE_BYPASS=" ../api/.env | cut -d= -f2) \
  npx playwright test --reporter=json > /tmp/e2e.json
node <xülasə skripti> /tmp/e2e.json      # skript §3-dədir

# 4) Production E2E
E2E_BASE_URL=https://360tap.az npx playwright test --project=desktop 01-public 02-search 06-filters
```

### BU SESSİYADA BİTMİŞ İŞLƏR
| Yoxlama | Nəticə |
|---|---|
| Backend + frontend build | ✅ PASS |
| Typecheck (api + frontend) | ✅ PASS |
| ESLint | ✅ 0 error (əvvəl 2) · 308 warning (köhnə borc) |
| Unit testlər | ✅ **86/86** (sessiya başında 47) |
| Production API smoke | ✅ **12/12** |
| Filtr E2E (yeni) | ✅ **33/33** |
| Tam E2E regressiya | ⏳ QALIB (yuxarıdakı əmr) |

### REDIS — HÖKM: kod PASS, infrastruktur FAIL ⚠️
`family: 0` düzəlişi edildi (`api/src/redis/redis-family.ts` — tək mənbə, həm
RedisModule, həm BullMQ işlədir). Lokalda təsdiqləndi: `Redis qoşuldu (family=0)`.

**LAKİN canlıda səbəb BAŞQADIR.** `/api/health/ready` diaqnostikası:
```
error:     connect ECONNREFUSED 10.14.113.104:6379
family:    0
target:    redis://red-d8kseajtqb8s73agob20:6379  (TLS: false)
effective: eyni  ·  raw: 37 simvol, "redis://"
```
DNS həll olunur, URL düzgündür, ioredis ilə bizim oxunuşumuz eynidir — bağlantı
**port səviyyəsində rədd edilir**. Yəni Render Key Value servisi cavab vermir.
Kodla həll oluna bilməz.

➡️ **İSTİFADƏÇİDƏN:** Render dashboard → `tap360-redis` statusu. Ehtimallar:
(a) pulsuz Key Value müddəti bitib silinib (DNS qeydi qalıb), (b) API-dən fərqli
regiondadır — `render.yaml`-da region ÜMUMİYYƏTLƏ təyin olunmayıb.

### TAPILAN VƏ DÜZƏLDİLƏN BUGLAR (bu sessiya, cəmi 6)
1. **HIGH** 7 sürətli filtr 422 verirdi → 4-ü real edildi, 3-ü çıxarıldı (data yoxdur)
2. **HIGH** `has_credit`/`has_barter` SƏSSİZCƏ tətbiq olunmurdu (50 elan qaytarırdı) → düzəldi
3. **HIGH** `only_shops` ≠ `verified` semantik səhv (öz əvvəlki düzəlişimdə) → ayrıldı
4. **MEDIUM** ESLint 2 error (Playwright `use()` React hook sanılırdı) → `e2e/` üçün söndürüldü
5. **MEDIUM** Redis `family` (lokalda təsdiqləndi, canlıda əsas səbəb başqadır)
6. **LOW** `FilterSidebar` + `ListingsClient` ölü kod → qeyd edildi, toxunulmadı

### ⚠️ AŞKARLANAN, TOXUNULMAYAN (qərar istəyir)
**`ListingsClient.tsx` HEÇ YERDƏ İŞLƏDİLMİR** (ölü kod). Nəticədə `QuickFilterChips`,
`UniversalTopBar`, `UniversalFullFilter` istifadəçiyə **görünmür** — ölçüldü: `/elanlar`
HTML-ində çip mətnlərinin heç biri yoxdur. Backend filtrləri işləyir və URL ilə
əlçatandır, amma onları işə salan çiplər UI-da yoxdur.
`/elanlar`-ın canlı filtr UI-si: `CategoryFilters` + `FilterChips`.
➡️ Qərar lazımdır: ölü komponentləri canlandırmaq (yeni UI işi) yoxsa silmək?

---

## 0-E. DAVAM NÖQTƏSİ — 2026-09-06, səhər (naviqasiya atılması + çiplər)

> **AÇAN KİMİ BURADAN BAŞLA.** Kod commit + push olunub (`6fb43bf`), işçi ağac təmizdir.

### TAM E2E NƏHAYƏT YAŞILDIR: **270/270** (əvvəl 251/258, 7 sınıq)
`--workers=4`, boş maşın, production build. Flaky yoxdur, ötürülən yoxdur.

### TAPILAN ƏSAS DEFEKT: naviqasiya SƏSSİZCƏ ATILIR (~5%)
Əvvəlki sessiyada bu 7 sınıq «yükdən asılı flaky» sayılmışdı — **hökm SƏHV idi.**
Boş maşında `--workers=1` ilə 4/4 təkrarlandı, sonra brauzer daxilindən
instrumentasiya ilə mexanizm tutuldu:

```
fetch başladı  /elanlar?category=avtomobiller&a_brand=BMW&_rsc=...  signal=VAR
fetch OK 200
...və bitdi — pushState YOX · abort() YOX · konsol xətası YOX · təkrar sorğu YOX
```
App Router RSC cavabını **alır**, sonra tranzisiyanı **commit etmir**: URL dəyişmir,
idarə olunan `<select>` köhnə dəyərinə qayıdır, istifadəçi «heç nə olmadı» görür.
Şəbəkədə görünən `net::ERR_ABORTED` səbəb yox, NƏTİCƏDİR (gövdəni oxuyan tərəf axını atır).

**Tezlik** (hər biri ayrıca ölçmə): 1/20 · 1/20 · 3/40 · 1/40 · 2/80 ≈ **5%**.
Playwright `page.route` müdaxiləsi ilə də, ONSUZ da eyni → **test artefaktı deyil**.
Eyni defekt adi `<Link>` keçidlərini də vurur (`01-public.spec.ts:74` buna görə qırmızı idi).

### TƏKZİB EDİLƏN İKİ FƏRZİYYƏ (ikisi də ölçüldü — təxminlə bağlanmadı)
| Fərziyyə | Nəticə |
|---|---|
| React RC (`19.0.0-rc-...20241106`) Next 15.5.19-un peer aralığını pozur | Stabil **19.1.1**-ə keçirildi → defekt **QALDI** (3/40). Yenilənmə peer-uyğunluq üçün saxlanıldı, amma səbəb bu deyil. Brauzerdə işləyən React onsuz da Next-in öz bundle-ıdır. |
| `useTransition`/`isPending` ilə gözləmə aşkarlamaq | Atılma halında `isPending` **ƏBƏDİ true** qalır (reducer promise-i settle olmur) → bərpa 8079 ms-ə uzanırdı. Siqnal kimi **yararsız**, kodda saxlanılmadı. |

30 agentlik düşmən-yoxlamalı workflow icra olundu: 45 tapıntıdan **yalnız 1-i** yoxlamadan
sağ çıxdı və o da məhz seçilmiş həlli təsdiqlədi (watchdog + sərt keçid).

### TƏTBİQ OLUNAN HƏLL
Səbəb router-in daxilindədir və yamalana bilmir, ona görə **nəticə yoxlanılır**:
* `frontend/lib/resilient-navigation.ts` — `useResilientPush()`: push-dan **2.5 s** sonra
  ünvan dəyişməyibsə (və istifadəçi hələ də həmin səhifədədirsə) `location.assign` ilə tamamlanır.
  2.5 s əsası: lokalda normal yumşaq naviqasiya **median 24 ms · maksimum 172 ms** (40 icra).
* `frontend/components/NavigationGuard.tsx` — eyni qoruma **bütün daxili `<a>` keçidləri** üçün,
  kök layout-da. Şərtlər: sol klik · dəyişdirici düymə yox · eyni origin · ünvan fərqli.
  Kənarda qalır: `target`, `download`, `#` çövrələri, `data-nav-guard="off"`.
* `CategoryFilters`, `FilterChips`, `QuickFilterChips` → qoruyucu naviqasiyaya keçdi.
* `ListingCard`-da məcburi `prefetch={true}` götürüldü (siyahıda ~50 tam RSC prefetch-i
  istifadəçinin öz naviqasiyası ilə yarışırdı).

**Ölçülmüş nəticə:** qoruyucu ilə **160 icrada istifadəçi üçün sınıq SIFIR**
(2 halda atılma baş verdi və bərpa olundu).

⚠️ **QALAN UPSTREAM İZ:** agent axtarışı Next.js-də simptomu hərfən təkrarlayan açıq issue
(#96413 «same-route query navigation silently fails to commit») və qohum ailənin YEGANƏ
düzəldilmiş üzvünü (#84299 → PR #95391, **Next.js 16.3.0**, 15.5.x-ə backport YOX) tapdı.
Yəni Next 16-ya keçid bu qoruyucunu artıq lazımsız edə bilər — **yoxlanılmayıb**, təxmindir.

### SÜRƏTLİ FİLTR ÇİPLƏRİ CANLANDIRILDI (istifadəçi qərarı ilə)
`app/elanlar/ListingsClient.tsx` heç yerdən import olunmurdu (ölü kod) — nəticədə çiplər
istifadəçiyə **ümumiyyətlə görünmürdü**. Fayl silindi, `QuickFilterChips` özü-özünə
yetərli edildi (`useSearchParams` + real `<a href>`, toggle + `aria-pressed`,
snake_case linkləri də aktiv sayır) və `/elanlar`-a qoşuldu.
«Bu gün» → **«Ən yeni»**: çip `sort=new` göndərir, bu sıralamadır, tarix filtri deyil
(backend-də `createdAt >= bu gün` filtri **yoxdur**) — köhnə ad vermədiyimiz vədi verirdi.
12 yeni E2E testi çiplərin GÖRÜNDÜYÜNÜ də qoruyur.

`UniversalTopBar`/`UniversalFullFilter` **ölü kod DEYİL** — `/k/<kateqoriya>` və `/seher/*`
səhifələrində işlədilir (əvvəlki sessiyanın qeydi bu hissədə yanlış idi).

### BU SESSİYADA YOXLAMA CƏDVƏLİ
| Yoxlama | Nəticə |
|---|---|
| Tam E2E (270 test, 3 viewport) | ✅ **270/270** |
| api unit | ✅ **86/86** |
| tsc (api + frontend) | ✅ təmiz |
| ESLint (frontend) | ✅ 0 error · 305 warning (köhnə borc) |
| `next build` | ✅ keçir |
| Atılma tezliyi (qoruyucudan sonra) | ✅ 160 icra · istifadəçi üçün 0 sınıq |
| Deploy | ✅ push `8d582a7` → Vercel/Render avtomatik, canlıda təsdiqləndi |
| **Canlı E2E** (desktop · 01-public + 02-search + 06-filters) | ✅ **52/52** (əvvəlki baseline: 33 keçdi / 22 sındı) |

### CANLIDA ÜZƏ ÇIXAN İKİ ŞEY
1. **Öz düzəlişimin qüsuru — ikiqat bərpa (DÜZƏLDİLDİ, `8d582a7`).** Çipə klik həm öz
   `onClick`-indəki qoruyucuya, həm də `NavigationGuard`-a düşürdü; atılma anında hər
   ikisi `location.assign` çağırırdı və birinci sənəd sorğusu ikincisi tərəfindən ləğv
   olunurdu (`GET /elanlar — net::ERR_ABORTED`). Həll: `recoverNavigation()` səhifə ömrü
   boyu bir dəfə işləyir + çipin `<a>`-sında `data-nav-guard="off"`.
2. **React #418 (hidratasiya) — BİR DƏFƏ göründü, təkrarlanmır.** Deploy oturandan sonra
   həmin test **3/3** keçir. Ehtimal: rollout anında CDN köhnə HTML-i, brauzer isə yeni
   JS-i almışdı. **Sübut edilməyib** — növbəti deploy-dan sonra yenidən yoxlanmalıdır.

### ⚠️ MAŞIN QEYDİ
Bu sessiyada E2E iki dəfə **yaddaş çatışmazlığına** görə öldürüldü — başqa layihənin
`next-server (v16.2.9)` prosesi 1.86 GB tuturdu. Belə vəziyyətdə `--workers=2` işlədin
(270 test 3.7 dəqiqə çəkir) və nəticəni yükə görə şərh etməyin.

### NÖVBƏTİ ADDIMLAR
1. ~~Canlıda yoxlama~~ ✅ edildi (52/52).
2. **Redis** — istifadəçi Render dashboard-da `tap360-redis` statusuna baxacaq (§0-D-yə bax).
3. **Production DB seed** — hələ edilməyib, Render DB parolu lazımdır (§4.2-b).
4. **Admin hesabı e-poçtu** — istifadəçidən gözlənilir.
5. Yoxlanılmamış namizəd: ardıcıl iki `apply()` — ikincisi köhnə `params`-dan qurulduğu üçün
   birinci filtri səssizcə silə bilər (agent iddiası, **ölçülməyib**).

---

## 1. İŞ MÜHİTİNİ QALDIRMAQ (açan kimi ilk bunlar)

```bash
# Postgres
brew services start postgresql@16     # və ya postgresql

# Backend (port 5500, prefiks /api/v1)
cd /Users/mr.maqa/Projects/360tap.az/api
npm run build && node dist/main &      # yoxlama: curl -s -o /dev/null -w '%{http_code}' localhost:5500/health

# Frontend (port 5401) — DİQQƏT: TƏMİZ BUILD ŞƏRTDİR
cd /Users/mr.maqa/Projects/360tap.az/frontend
rm -rf .next && npm run build && npm run start &
```

### ⚠️ İKİ DƏFƏ VAXT İTİRDİYİM TƏLƏ
`next dev` və `next start` **eyni `.next` qovluğunu** işlədir. Dev serveri işə salsam,
production build-i üzərinə yazılır və server köhnə manifest üçün chunk-lara **HTTP 400**
qaytarır → E2E-də 140+ yalançı «konsol xətası» görünür.
**Qayda:** E2E-dən əvvəl həmişə `rm -rf .next && npm run build`, dev serveri isə
paralel İŞLƏTMƏ (lazımdırsa əvvəl E2E-ni bitir, sonra dev aç, sonra yenidən build et).

---

## 2. HANSI İŞ BİTİB

| Sahə | Vəziyyət |
|---|---|
| 132 MEDIUM/LOW tapıntının triajı | ✅ REAL 94 · ALREADY_FIXED 16 · COSMETIC 22 |
| 94 REAL defektin düzəlişi | ✅ 78 düzəldilib, 36 buraxılıb (səbəbləri qeyd olunub) |
| Hidratasiya xətası (React #418) | ✅ iki kök səbəb də düzəldilib (ICU + `timeAgo`) |
| Kök kateqoriya filtrləri | ✅ vertikal roll-up (≥50% astana) |
| Avtomobil marka/model asılılığı | ✅ 63 marka + `attribute-taxonomy.ts` |
| Diakritiksiz axtarış | ✅ `menzil` = `mənzil` = 5 nəticə |
| DEMO nişanı | ✅ `isDemo` sütunu + kart rozeti + detal bantı |
| Ölü keçidlər (`/komek`, header, satıcı) | ✅ |
| Unit testlər (api) | ✅ 27/27 keçir |
| tsc (api + frontend) | ✅ hər ikisi təmiz |
| `next build` | ✅ keçir |

### Ölçülmüş nəticələr (lokal)
```
neqliyyat      → Marka(77) · Növ(30) · Buraxılış ili     ← əvvəl BOŞ
dasinmaz-emlak → Əməliyyat(3) · Otaq · Sahə · Çıxarış    ← əvvəl BOŞ
is-elanlari    → Maaş · İş qrafiki(5) · Təcrübə(4)
avtomobiller   → Marka(63) · Model(markadan asılı) + 12  ← əvvəl Marka(0)
q=menzil → 5   q=mənzil → 5   q=__ → 0   q=iP_one → 0
```

---

## 3. QALDIĞIM DƏQİQ YER

E2E **225/225 keçir** (§0-a bax). tsc (api+frontend) təmiz, unit 27/27.
Qalan iş: yuxarıdakı iki canlı defekt (TRUST_PROXY ölçməsi + Redis) və §4-dəki bəndlər.

## 4. QALAN İŞLƏR (prioritet sırası ilə)

### 4.1 — Təmiz E2E icrası və qalan sınıqların bağlanması
Yuxarıdakı əmr. Gözlənilən qalıq: 0–3 sınıq.

### 4.2 — PRODUCTION-A TƏTBİQ ⚠️ İSTİFADƏÇİDƏN MƏLUMAT LAZIMDIR
Bu düzəlişlərin **heç biri hələ canlıda deyil**:

**(a) Kod deploy-u** — `git push` → Vercel (frontend) + Render (backend) avtomatik.

**(b) Production DB seed-i** — YENİ atribut opsiyaları (63 marka, xidmət filtrləri,
audio markaları) yalnız lokal bazadadır. Lazım olan:
```bash
DATABASE_URL='<Render tap360-db connection string>' npm run prisma:seed
# Demo elanlar OPT-IN olduğu üçün mövcud 115 elana TOXUNMUR.
```
❗ **Render DB parolu bu sessiyada saxlanılmayıb** — istifadəçidən istəmək lazımdır
(host məlumdur: `dpg-dac0dv8n74is738npfh0-a.oregon-postgres.render.com / tap360_ul0z`).

**(c) Production miqrasiyası** — `is_demo` sütunu:
```bash
DATABASE_URL='<render>' npx prisma migrate deploy
DATABASE_URL='<render>' psql -c "UPDATE listings SET is_demo=true WHERE owner_id=(SELECT id FROM users WHERE email='demo@360tap.az');"
psql -c "UPDATE listings SET expires_at=now()+interval '90 days' WHERE status='active' AND expires_at<now();"
```

**(d) Production E2E** — deploy-dan sonra:
```bash
E2E_BASE_URL=https://360tap.az npx playwright test --project=desktop 01-public 02-search 05-responsive
```
Deploy-dan ƏVVƏLKİ baseline: **33 keçdi / 22 sındı**.

### 4.3 — İstifadəçinin son sualı (o özü verəcək)
**Admin hesabı e-poçtu** — istifadəçi «sonda verəcəyəm» dedi. Soruşulmayıb, gözlənilir.

### 4.4 — Açıq qalan qərarlar (məhsul sahibinə aiddir, kod hazırdır)
1. **`expiresAt` tətbiqi** — sahə heç yerdə istifadə olunmur. Filtri açmaq
   kataloqun 92%-ni gizlədər. Cron + yeniləmə UX qərarı gözləyir.
2. **İctimai satıcı profili** — `/profil/<id>` səhifəsi və `users` endpoint-i yoxdur
   (qovluq boşdur). Ölü keçid götürüldü; səhifə istənilirsə yeni funksiyadır.
3. **Meili axtarış indeksi** — Postgres fallback işləyir, Meili instansı yoxdur.
4. **`search_logs` retention** — 90 gündən köhnə sətirlərin təmizlənməsi.

---

## 5. TAPINTI SƏNƏDLƏRİ (harada nə var)

| Fayl | Məzmun |
|---|---|
| `scratchpad/live-findings.md` | özüm ölçdüyüm F-1…F-15 defektləri |
| `scratchpad/triage-verdicts.json` | 132 tapıntının hökmü (REAL/COSMETIC/…) |
| `scratchpad/fix_*.json` | qrup-qrup düzəliş siyahıları |
| `scratchpad/overlap-check.md` | qrup sərhədləri üst-üstə düşən fayllar |
| `tasks/w6kdyre8b.output` | triaj workflow-unun tam nəticəsi |
| `tasks/w91zxi24y.output` | düzəliş workflow-unun tam nəticəsi (78 fixed / 36 skipped) |

Scratchpad yolu:
`/private/tmp/claude-501/-Users-mr-maqa-Projects-360tap-az/0509fec7-86c2-44ce-8d36-94a4f382f532/`

⚠️ `/private/tmp` yenidən başlatmada **silinə bilər**. Ən vacib məzmun bu fayla və
commit mesajına köçürülüb; itsə də iş davam edə bilər.

---

## 6. TƏLƏBLƏRİN VƏZİYYƏTİ (istifadəçinin 10 bəndi)

| # | Tələb | Vəziyyət |
|---|---|---|
| 1 | 132 tapıntının triajı + real olanların düzəlişi | ✅ 78/94 düzəldilib |
| 2 | Tam E2E (28 ssenari) | ✅ qoşqu hazır, 218/225 keçir — təkrar icra lazım |
| 3 | Brauzerdə real interaksiya (HTTP status yox) | ✅ Playwright, real klik/forma/elan yaratma |
| 4 | Konsol/şəbəkə/hidratasiya/daşma təmiz | ✅ fixture avtomatik yoxlayır |
| 5 | Kateqoriyaya xas filtrlər (Avito modeli) | ✅ üç vertikal fərqli dəst verir |
| 6 | Demo data QALSIN, amma işarələnsin | ✅ `isDemo` + rozet + bant |
| 7 | Monetizasiya SÖNÜLÜ qalsın | ✅ yoxlanıb: bütün bayraqlar `false`, ödəniş endpoint-ləri 404 |
| 8 | Admin hesabına toxunma | ✅ toxunulmayıb, e-poçt gözlənilir |
| 9 | Hər düzəlişdən sonra regressiya | ✅ tsc + unit + E2E hər mərhələdə |
| 10 | Yekun struktur hesabat | ⏳ E2E təkrar icrasından sonra |
