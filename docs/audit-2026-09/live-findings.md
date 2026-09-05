# CANLI YOXLAMADA TAPILAN DEFEKTLƏR (triajdan asılı olmayan, özüm ölçdüm)

## F-1 [HIGH · tələb #5] Kök kateqoriyalarda atribut yoxdur
13 kök kateqoriyadan 12-si `/categories/<slug>/attributes` üçün BOŞ massiv qaytarır
(yalnız `is-elanlari` 4 atribut verir). `CategoryFilters` opsiyasız select-ləri atır →
`/elanlar?category=neqliyyat` və `?category=dasinmaz-emlak` EYNİ ümumi zolağı göstərir
(Region · Qiymət · Sıralama). Yəni avtomobil, əmlak və vakansiya faktiki olaraq eyni
generic filtr formasını paylaşır — istifadəçinin qadağan etdiyi hal.
ÖLÇÜ: curl /api/v1/categories/neqliyyat/attributes → []
FIX: `CategoriesService.getAttributes` — kateqoriyanın öz atributu yoxdursa,
alt kateqoriyaların ≥50%-də təkrarlanan açarları topla (opsiyalar birləşdirilir).

## F-2 [HIGH · tələb #2 brend→model] Avtomobil marka/model filtri ümumiyyətlə yoxdur
`avtomobiller` kateqoriyasında `brand` və `model` atributları `select` tipindədir,
LAKİN `options` NULL-dur. `CategoryFilters` `(a.options?.length ?? 0) > 0` şərti ilə
onları süzür → marka və model filtrləri heç render olunmur.
63 markalıq model bazası `frontend/lib/transport-data.ts`-də MÖVCUDDUR, amma yalnız
`TransportFullFilter`-də işlədilir — o komponentin səhifəsi (`app/neqliyyat/page.tsx`)
silinib, next.config redirect-i ilə əvəzlənib → komponent ÖLÜ KODDUR.
ÖLÇÜ: psql → category_attributes.options IS NULL (avtomobiller.brand, .model)
FIX: marka opsiyalarını DB-yə seed et + `model` select-ini seçilmiş markadan asılı et.

## F-3 [MEDIUM] Opsiyasız digər select atributları
`ehtiyat-hisseleri.brand`, `yuk-avtobus.brand`, `audio.brand` — eyni səbəbdən görünmür.

## F-4 [MEDIUM] Bütöv vertikallarda filtr yoxdur
`xidmetler` + 7 alt kateqoriyasının HAMISI 0 atribut.
`elektronika/komputerler` və `elektronika/tv-audio` orta səviyyə — 0 atribut
(halbuki onların öz alt kateqoriyalarında 2-4 atribut var).

## F-6 [HIGH · tələb #2 transliterasiya] Diakritiksiz axtarış işləmir
ÖLÇÜ (lokal, /api/v1/listings?q=):
  "mənzil" → 5 nəticə   |  "menzil" → 0
  "şəhər"  → 1 nəticə   |  "seher"  → 0
`search.service.ts`-də transliterasiya məntiqi VAR və unit testi keçir, amma saytın
işlətdiyi `/listings?q=` yolu ondan istifadə etmir — sadə `contains` insensitive.
Azərbaycan istifadəçisinin əksəriyyəti diakritiksiz yazır → axtarışın böyük hissəsi ölü.
FIX: `listings` cədvəlinə diakritiksiz normallaşdırılmış axtarış sütunu + sorğunun
eyni funksiya ilə normallaşdırılması.

## F-5 [COSMETIC] Boş qovluq artefaktı
`api/src/modules/categories/{dto}` — brace-expansion səhvindən qalmış boş qovluq.

---

## F-7 [BLOCKER · tələb #4] HƏR SƏHİFƏDƏ HİDRATASİYA XƏTASI — DÜZƏLDİLDİ ✅
React error #418. Ölçülmüş kök səbəb: `toLocaleString('az-AZ')` / `toLocaleDateString('az-AZ')`
nəticəni mühitin ICU bazasından alır və iki mühit RAZILAŞMIR:
      Node 24 (SSR)      Chrome 153 (klient)
ədəd  1.234.567,5        1,234,567.5
tarix 15.01.2026         2026-01-15
Nəticə: SSR-də çap olunan qiymət brauzerdə başqa cür render olunur → React SSR
ağacını atıb hər şeyi klientdə yenidən qurur. 95 çağırış yeri.
DÜZƏLİŞ: `frontend/lib/format.ts` — ICU-dan asılı olmayan `azNumber/azPrice/azDate/
azDateLong/azDateTime`. 58 fayl, 91 çağırış codemod ilə köçürüldü. tsc təmiz.
YOXLAMA: dev serverdə ana səhifə və /elanlar?category=avtomobiller — xəta yoxdur.

## F-1 DÜZƏLDİLDİ ✅  (kök kateqoriya atributları)
`CategoriesService.getAttributes` — öz atributu olmayan kateqoriya üçün alt ağacdan
≥50% astanası ilə ümumi dəst hesablanır, opsiyalar birləşdirilir.
NƏTİCƏ (ölçülmüş):
  neqliyyat      → Marka(77) · Növ(30) · Buraxılış ili
  dasinmaz-emlak → Əməliyyat(3) · Otaq sayı · Sahə · Çıxarış
  is-elanlari    → Maaş(min/max) · İş qrafiki(5) · Təcrübə(4)
Üç vertikal artıq fərqli filtr dəsti göstərir. Yarpaq davranışı dəyişməyib.

## F-2 YARIM DÜZƏLDİLDİ ⏳  (marka opsiyaları hazır, model asılılığı agentdə)
seed: `CAR_BRAND_OPTIONS` (63 marka) → avtomobiller.brand, ehtiyat-hisseleri.brand
yuk-avtobus.brand → 17 yük markası. Ölçülmüş: avtomobiller Marka(63) ✅
Model select-inin markadan asılı doldurulması `fix:fe_listings` agentindədir.

## F-3 DÜZƏLDİLDİ ✅ audio.brand → 15 opsiya
## F-4 DÜZƏLDİLDİ ✅ xidmetler + 7 alt bölmə → 4 atribut (SERVICE_ATTRS)

## F-8 [MEDIUM] expiresAt data uyğunsuzluğu — DATA DÜZƏLİŞİ EDİLDİ ✅
104 aktiv elanın 113-dən expires_at-ı keçmişdə idi. Sahə heç yerdə tətbiq olunmur
(nə sorğuda, nə cron-da, nə UI-da) → istifadəçiyə görünən təsiri yox idi, amma
filtri açan hər kəs kataloqun 92%-ni gizlədərdi. Lokal DB-də +90 gün uzadıldı.
QALIR: tətbiq (cron + yeniləmə UX) məhsul qərarıdır — sahibə verilir.

## ⚠️ PRODUCTION-DA HƏLƏ TƏTBİQ EDİLMƏYİB
Yeni atribut opsiyaları (marka/xidmət) production DB-də YOXDUR — seed yalnız lokala
işlədi. Render DB parolu bu sessiyada saxlanılmayıb.
LAZIM: `DATABASE_URL=<render> npm run prisma:seed` (demo elanlar OPT-IN olduğu üçün
mövcud elanlara toxunmur) + expires_at UPDATE-i.

---
# PRODUCTION E2E BASELINE (desktop, 55 test) — keçdi 33 · sındı 22

## F-9 [MEDIUM] /komek səhifəsində 64 ölü FAQ keçidi
Bütün sual başlıqları `href="#"` — istifadəçi klikləyir, heç nə açılmır.
Ölçü: brauzerdə `document.querySelectorAll('a')` → href==='#' olan 67 element
(3-ü header-dəndir, 64-ü FAQ sualıdır).

## F-10 [LOW] Header-də 3 semantik ölü keçid
Sevimlilər · Səbət · «Elan yerləşdir» qonaq üçün `href="#"` + onClick(modal).
Klik İŞLƏYİR, amma orta düymə / «yeni tabda aç» heç nə etmir və skrinrider
«hədəfsiz keçid» oxuyur. Düzgün forma: href="/login" + e.preventDefault().

## F-11 [MEDIUM] Satıcı profili keçidi 404 verir
Elan detalında satıcı adı `/profil/<ownerId>`-ə keçid verir, LAKİN
`frontend/app/profil/[id]/page.tsx` MÖVCUD DEYİL.
Ölçü: elan detalında şəbəkə → `404 GET /profil/139c2937-...?_rsc=...`
Yəni HƏR elan səhifəsində satıcı adına klik ölü keçiddir.

## Production-da təsdiqlənən, lokalda ARTIQ DÜZƏLƏN defektlər
· React #418 hidratasiya — hər səhifədə (F-7) → lokalda düzəlib, DEPLOY LAZIMDIR
· neqliyyat kökündə vertikal filtr yoxdur (F-1) → düzəlib, DEPLOY + SEED lazımdır
· avtomobillərdə Marka select-i yoxdur (F-2) → seed lazımdır

## Yalançı siqnal kimi təsnif edilib (defekt deyil)
`?_rsc=` prefetch sorğularının `net::ERR_ABORTED` olması — Next.js App Router
spekulyativ prefetch edir və naviqasiyada onları ləğv edir. İstifadəçiyə təsiri
yoxdur. Test süzgəcinə əlavə edildi.
