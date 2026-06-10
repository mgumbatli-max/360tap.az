# 02 — Product Requirements Document (PRD)

> 360tap.az — ERP-connected regional marketplace ekosistemi.

---

## 1. Problem və fürsət

**Problem:** Azərbaycanda elan bazarı Bakı-mərkəzlidir və vertikallara (Turbo.az, Bina.az, Boss.az, Tap.az) parçalanıb. Regionlardakı mağazalar onlayn deyil; real stok məlumatı heç bir platformada yoxdur — istifadəçi elanın hələ də mövcud olub-olmadığını bilmir.

**Fürsət:**
1. **Region-first** yanaşma ilə regional istifadəçiyə öz şəhərindəki real təklifləri göstərmək.
2. **ERP-connected** mağazalarla **real stok**, real qiymət — "elan hələ aktualdırmı?" probleminin həlli.
3. Bütün vertikalları bir platformada birləşdirmək.

## 2. Hədəf istifadəçilər (personalar)

| Persona | Təsvir | Əsas ehtiyac |
|---------|--------|--------------|
| **Regional alıcı** (Aysel, Qəbələ) | Öz rayonunda məhsul/xidmət axtarır | Yaxınlıqda **real stokda** olan təkliflər, çatdırılma |
| **Fərdi satıcı** (Elvin, Sumqayıt) | Köhnə əşya/maşın satır | Asan elan yerləşdirmə, WhatsApp/zəng |
| **ERP mağaza sahibi** (TechStore, Qəbələ) | 360biznes ERP istifadəçisi | 1 kliklə yüzlərlə məhsulu yayımlamaq, avtomatik sync |
| **Qeyri-ERP biznes** (avtosalon, agentlik) | Çoxlu elanı olan biznes | Mağaza profili, toplu elan, statistika, premium |
| **İşəgötürən** (şirkət) | Vakansiya yerləşdirir | Region üzrə işçi tapmaq, müraciət idarəsi |
| **Admin/Moderator** | Platforma operatoru | Moderasiya, ERP nəzarəti, monetizasiya |

## 3. Məhsul prinsipləri

1. **Region əvvəl, sonra hər şey** — hər ekran region kontekstlidir.
2. **Real stok etibarı** — ERP badge platformanın güvən nişanıdır.
3. **Vertical-aware** — nəqliyyat ≠ əmlak ≠ iş; hər biri öz lider saytı səviyyəsində.
4. **Mobile-first** — telefonda app kimi.
5. **Sürət** — ana səhifə ≤2s, search ≤500ms.
6. **Genişlənən** — yeni kateqoriya/atribut **kod yazmadan** (dynamic attributes).

---

## 4. Funksional tələblər — vertikallar

### 4.1 Universal elanlar (Tap.az səviyyəsi)
Kateqoriyalar: Elektronika, Telefonlar, Kompüterlər, Məişət texnikası, Ev və bağ, Geyim, Uşaq aləmi, Xidmətlər, Heyvanlar, Təmir-tikinti, Biznes və avadanlıq, Kənd təsərrüfatı, İdman, Təhsil, Sağlamlıq, Digər.
Hər kateqoriyada **dynamic attribute** sistemi (bax `09`).

### 4.2 Nəqliyyat (Turbo.az səviyyəsi)
- Detallar cədvəli: `VehicleDetails` (bax `04`).
- Filterlər (tam siyahı `09`-da): tip, marka, model, il, qiymət, valyuta, şəhər/rayon, ban növü, yanacaq, mühərrik həcmi, sürətlər qutusu, ötürücü, rəng, yürüş, yeni/sürülmüş, kredit, barter, vuruğu yox, rənglənməyib, gömrük, salon/fərdi, VIN, sahib sayı, oturacaq/qapı sayı, komfort opsiyaları (kamera, lyuk, dəri salon...), EV batareya, hibrid tipi.
- Brand/Model **DB-də** (cascading select).

### 4.3 Daşınmaz əmlak (Bina.az səviyyəsi)
- Detallar: `RealEstateDetails`.
- Əməliyyat: alış / kirayə / günlük.
- Filterlər: əmlak tipi (mənzil, həyət evi, villa, torpaq, obyekt, ofis, qaraj), yeni/köhnə tikili, otaq, sahə, mərtəbə, binanın mərtəbəsi, qiymət, 1m² qiyməti, şəhər/rayon/qəsəbə, metro, nişangah, xəritədə seç, təmir, çıxarış, ipoteka, agentlik/fərdi, kommunal (balkon, lift, qaz, su, işıq, kombi, mərkəzi istilik, parking, mühafizə), video/360, təcili, endirimli.

### 4.4 İş elanları (Jobsearch/Boss.az səviyyəsi)
- Detallar: `JobDetails` + `CompanyProfile`.
- İş kartı **vakansiya kartı** kimi görünür (məhsul kartı yox).
- Filterlər: şəhər/rayon, vəzifə, sahə, maaş aralığı, qrafik (tam/yarım ştat, uzaqdan, ofis, hibrid), təcrübə, təhsil, dil, şirkət, təcili, CV tələbi, online müsahibə.
- Detal: vəzifə, şirkət, maaş, ünvan, qrafik, tələblər, vəzifələr, şirkət haqqında, **müraciət et / CV göndər**, oxşar vakansiyalar.

---

## 5. Funksional tələblər — platforma

### 5.1 Region-first (bax `07`)
- İlk girişdə "Harada axtarırsınız?" → region seçimi (12 region + Mənim yaxınlığımda + Bütün Azərbaycan + Xəritədən seç).
- Seçilən region: ana səhifə, header, kateqoriya default filter, axtarış nəticələri — hamısı uyğunlaşır.
- Nəticə azdırsa: "Yaxın rayonlarda da bax" + "Bütün Azərbaycan üzrə göstər".

### 5.2 Axtarış (bax `07`)
- Meilisearch: AZ/RU/EN, səhv yazılış, transliterasiya (qebele→Qəbələ), sinonim (maşın=avtomobil), brend/model/region/kateqoriya tanıma, qiymət aralığı tanıma.
- Nümunə sorğular: "iPhone 15 Pro Qəbələ", "BMW X5 Gəncə", "kirayə ev Şəki", "gence ev kiraye".

### 5.3 Mağaza profili (bax `10`)
- Public səhifə `/store/<slug>`: logo, cover, ad, təsdiqlənmiş badge, **ERP sinxron badge**, ünvan, xəritə, iş saatları, telefon/WhatsApp/Instagram, filiallar, reytinq/rəylər, aktiv elan sayı, kateqoriyalar, endirimlər, stokda olan məhsullar, çatdırılma/zəmanət şərtləri.

### 5.4 ERP inteqrasiyası (bax `08`)
- ERP-də "360tap.az-da yayımla" → məhsul avtomatik marketplace-də (region, real stok).
- Sync: qiymət/stok/şəkil/filial dəyişikliyi; stok=0 → deaktiv/"stokda yoxdur"; məhsul silinəndə arxiv.
- ERP panelinə geri: baxış, WhatsApp/zəng klik, favorit sayı.

### 5.5 Elanla qarşılıqlı əlaqə
Favorit, müqayisə, saytdaxili mesaj (chat), zəng (klik track), WhatsApp (klik track), paylaş, şikayət, axtarışı saxla + bildiriş, qiymət düşəndə xəbər ver.

### 5.6 Moderasiya (bax `10`)
Yeni elan təsdiqə düşə bilər; təsdiqlənmiş mağaza avtomatik; ERP mağaza yüksək etibar; dublikat aşkar, eyni şəkil xəbərdarlığı, saxta qiymət, şübhəli söz filteri, telefon spam yoxlama, şikayət axını, audit log.

### 5.7 Monetizasiya (bax `11`)
Premium/VIP elan, boost, ana səhifə/kateqoriya/region reklam, banner, mağaza/avtosalon/agentlik/işəgötürən/ERP paketləri, API/import paketi. Paket pilləsi: Free / Standard / Business / Premium.

### 5.8 Bildirişlər
Yeni mesaj, qiymət düşməsi, saved search uyğunluğu, moderasiya nəticəsi, ERP sync xətası (mağaza üçün). Kanallar: in-app, push (PWA), email digest (P1).

---

## 6. Qeyri-funksional tələblər

| Sahə | Tələb |
|------|-------|
| **Performans** | Ana səhifə ≤2s (SSR/ISR), search 300–500ms, listing lazy-load + infinite scroll/pagination |
| **Mobile** | Mobile-first, bottom nav, sticky call/WhatsApp, kamera ilə şəkil, PWA |
| **SEO** | SSR, region+kateqoriya landing, dynamic sitemap, structured data, canonical, breadcrumb |
| **Etibarlılıq** | ERP sync idempotent + retry; sync xəta logu |
| **Təhlükəsizlik** | JWT (access+refresh), argon2, rate-limit, RBAC, audit log, spam/fraud yoxlama |
| **Miqyaslanma** | Stateless API, Redis cache, Meilisearch, queue (BullMQ), S3 media, CDN |
| **Əlçatanlıq** | API mobil app üçün hazır (REST, stabil müqavilə) |
| **Lokalizasiya** | AZ (əsas), RU, EN (mərhələli) |

---

## 7. Uğur metrikaları (KPI)

- Region seçim nisbəti (ilk session-da region seçən %).
- ERP mağaza sayı və ERP elan payı.
- Search → listing CTR; "tapılmayan axtarış" sayı (azaltmaq).
- Elan → əlaqə (WhatsApp/zəng/mesaj) konversiyası.
- P95 səhifə yüklənmə vaxtı, search latency.
- Aktiv elan sayı / region; region üzrə coverage.

## 8. Əhatə xarici (bu mərhələdə yox)

Tam ödəniş gateway inteqrasiyası (MVP-də stub/manual), mobile native app, AI elan generatoru (Lab), XML/feed import (P2), çox-valyutalı tam mühasibatlıq, beynəlxalq genişlənmə.

> Detallı MVP/faza ayrımı: `03_mvp_and_phasing.md`.
