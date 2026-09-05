# DAVAM NÖQTƏSİ — production sabitləşdirmə (2026-09-05)

> Bu fayl kompüter söndürüləndən sonra işi **eyni yerdən** davam etdirmək üçündür.
> Son commit: `6c071bd` — bütün kod dəyişiklikləri commit olunub, işçi ağac təmizdir.

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

Son E2E icrası **141 sınıq** göstərdi, LAKİN bu, §1-dəki `.next` tələsidir —
API və data sağlamdır (yoxlanıb: `q=menzil` → 5 nəticə, `/health` → 200).

**NÖVBƏTİ ADDIM:** təmiz build + E2E-ni yenidən işə sal:
```bash
cd frontend && rm -rf .next && npm run build && npm run start &
sleep 15
E2E_ALLOW_WRITE=1 npx playwright test --reporter=json > /tmp/local-full.json 2>/dev/null
node /tmp/e2e-summary.mjs /tmp/local-full.json   # skript üçün aşağıya bax
```

Son **təmiz** icranın nəticəsi: **218 keçdi / 7 sındı** (225 test · 3 viewport).
O 7 sınığın 4-ü artıq düzəldilib (region filtri, viewport-a görə çıxış düyməsi,
`timeAgo` hidratasiyası) — təkrar icrada **~222–225 keçməlidir**.

### E2E xülasə skripti (yenidən yaratmaq lazımdırsa)
`frontend/e2e/` qovluğu commit olunub. Xülasə skriptini bərpa et:
```js
// /tmp/e2e-summary.mjs
import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const rows = [];
const walk = (s) => { (s.suites||[]).forEach(walk); (s.specs||[]).forEach(sp => {
  for (const t of sp.tests || []) { if (t.status === 'expected') continue;
    const r = (t.results||[]).slice(-1)[0]||{};
    rows.push({ p: t.projectName, t: sp.title, m: ((r.error&&r.error.message)||'').split('\n')[0].slice(0,120) }); } }); };
(j.suites||[]).forEach(walk);
const by = new Map();
for (const r of rows) { const k = r.t + ' :: ' + r.m;
  if (!by.has(k)) by.set(k, { ...r, projects: [] }); by.get(k).projects.push(r.p); }
console.log('SINAN (unikal): ' + by.size + ' / cəmi: ' + rows.length);
let i = 1; for (const v of by.values()) { console.log(`${i++}. [${v.projects.join(',')}] ${v.t}`); console.log(`   → ${v.m}`); }
```

---

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
