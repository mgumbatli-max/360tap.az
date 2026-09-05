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
