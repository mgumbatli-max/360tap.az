# 14 — Business Account Flow

## A. Mağaza / biznes hesabı yaradılması

```
[Adi user] → /kabinet/ayarlar
   ↓ "Biznes hesaba keç" düyməsi
[/biznes/qeydiyyat]
   ┌──────────────────────────────────────────┐
   │ Mağaza məlumatları:                      │
   │   - Mağaza adı (məs: TechZone)           │
   │   - Slug (auto, redaktə edilə bilər)     │
   │   - VÖEN (məcburi)                       │
   │   - Hüquqi ad                            │
   │   - Hüquqi ünvan                         │
   │   - Telefon (məsul şəxs)                 │
   │   - Sayt (opsional)                      │
   │   - Sahə: e-commerce / xidmət / ...      │
   ├──────────────────────────────────────────┤
   │ [Sənədlər yüklə]                         │
   │   - Reyestr çıxarışı (PDF)               │
   │   - Vergi qeydiyyat (PDF)                │
   │   - Şəxsiyyət vəsiqəsi (məsul)           │
   ├──────────────────────────────────────────┤
   │ Razılıq:                                 │
   │   ☐ Biznes oferta                        │
   │   ☐ Komissiya cədvəli                    │
   └──────────────────────────────────────────┘
   ↓ "Göndər"
   POST /shops + multipart docs
   ↓
   Status: pending verification
   ↓
Admin yoxlayır:
   - vergiler.gov.az API ilə VÖEN doğrulama
   - Sənədlərin əslliyi
   - Manual baxış
   ↓
   ✓ Approve → user.role = 'business'
                → shop.status = 'active'
                → verified badge ✓
                → email + push notification
                → onboarding wizard
   
   ✗ Reject → reason mətn göndər
              → əlavə sənəd istəyə bilər
```

## B. Onboarding (yeni mağaza)

```
[/biznes-kabinet/onboarding]
   Step 1: Mağaza profili (logo, banner, təsvir)
   Step 2: Kateqoriyalar (hansı sahələrdə işlədiyiniz)
   Step 3: İş saatları
   Step 4: Sosial şəbəkələr
   Step 5: İlk elanı yarat / paket seç
   ↓
   Tamamlanır → Dashboard
```

## C. Biznes Dashboard

```
┌────────────────────────────────────────────────────────────┐
│ TechZone Mağazası             [📊 Aktiv]   [⭐ 4.7]       │
├────────────────────────────────────────────────────────────┤
│ Sidebar                     │  Main                        │
│                             │                              │
│ 📊 Dashboard                │  KPI Cards (bu ay):          │
│ 📝 Elanlar (124)            │  • Baxış: 45 230  +12%       │
│ 📤 Toplu yükləmə            │  • Mesaj: 832     +8%        │
│ 📈 Statistika               │  • Klik telefon: 412 +15%    │
│ 📺 Reklamlar                │  • Yeni izləyici: 28         │
│ 👥 Komanda                  │                              │
│ 📦 Paketim                  │  Trend qrafikləri (30 gün)   │
│ 💳 Ödənişlər                │  [chart 1] [chart 2]         │
│ 🧾 Fakturalar               │                              │
│ 🔌 İnteqrasiyalar (API)     │  Top 10 elan (mesajla)       │
│ ⚙  Ayarlar                  │  [list]                      │
│                             │                              │
└────────────────────────────────────────────────────────────┘
```

## D. Toplu elan yükləmə (Bulk import)

```
[/biznes-kabinet/elanlar/toplu-yukleme]
   ↓
Step 1: Şablon yüklə
   ▶ Excel şablonu (bütün sütunlar + nümunə)
   ▶ Kateqoriyaya görə fərqli şablon
   ▶ Şəkil sütunu: URL siyahısı (vergüllə) və ya ZIP
   ↓
Step 2: Faylı yüklə
   - Drag & drop və ya seç
   - Maksimum 5000 sətir / fayl
   - Format: .xlsx, .csv
   - Şəkillər: ayrıca ZIP (max 500 MB)
   ↓
Step 3: Sütun mapping
   Sistem auto-detect, dəyişdirilə bilər:
   ┌────────────────────────┐
   │ Excel sütunu  →  Sahə  │
   │ ───────────────────────│
   │ Title         →  title │
   │ Price         →  price │
   │ Brand         →  attr.brand │
   │ Photos        →  images│
   └────────────────────────┘
   ↓
Step 4: Validation
   - Server tərəfindən hər sətir yoxlanır
   - Xəta cədvəli göstərilir (sətir #, səbəb)
   - "Səhvləri ixrac et" düyməsi (Excel)
   - "Yalnız uğurlu sətirləri yüklə" toggle
   ↓
Step 5: Import job başla
   POST /shops/:id/listings/bulk-import
   → BullMQ job yaradılır
   → Progress bar (real-time, WS update)
   → 1000 sətir / dəq sürət
   → Bitdikdə email
   ↓
Step 6: Hesabat
   - 4 850 sətir uğurlu
   - 130 sətir xəta (export)
   - 20 dublikat (skip)
   - Aktiv elan sayı yeniləndi
```

### Job worker (BullMQ)
```typescript
@Processor('bulk-import')
export class BulkImportProcessor {
  @Process()
  async handle(job: Job<{ shopId, fileUrl, mapping }>) {
    const stream = await s3.getStream(fileUrl);
    let row = 0;
    for await (const record of csvParse(stream)) {
      row++;
      try {
        await this.listingsService.create(shopId, mapRecord(record));
        job.progress({ done: row, errors: [] });
      } catch (e) {
        // collect errors, continue
      }
    }
    await this.notify(shopId, summary);
  }
}
```

## E. Komanda və icazələr (RBAC daxili mağaza)

```
[/biznes-kabinet/komanda]
   ┌────────────────────────────────────────────┐
   │ + Üzv əlavə et                             │
   │ ────────────────────────────────────────── │
   │ Anar Ə.   Owner    [tam icazə]             │
   │ Pərvin K. Manager  [redaktə + analitika]   │
   │ Lalə M.   Editor   [yalnız elan redaktə]   │
   │ Vüqar S.  Viewer   [yalnız oxu]            │
   └────────────────────────────────────────────┘
   ↓ "+ Üzv əlavə et"
[Modal]
   - Email (sistem yoxlayır, qeydiyyatı yoxdursa dəvət)
   - Rol seçimi
   - Custom permissions (advanced)
   ↓ Send invite
   - Email göndərilir
   - 7 gün live invite link
```

### Rol icazə matrisi (mağaza daxili)

| Əməliyyat | Owner | Manager | Editor | Viewer |
|---|---|---|---|---|
| Mağaza profili redaktə | ✅ | ✅ | — | — |
| Elan əlavə | ✅ | ✅ | ✅ | — |
| Elan redaktə | ✅ | ✅ | ✅ | — |
| Elan silmək | ✅ | ✅ | — | — |
| Toplu yükləmə | ✅ | ✅ | — | — |
| Mesaja cavab | ✅ | ✅ | ✅ | — |
| Statistika baxma | ✅ | ✅ | — | ✅ |
| Reklam yaratma | ✅ | ✅ | — | — |
| Ödəniş | ✅ | — | — | — |
| Komanda idarə | ✅ | — | — | — |
| Paket dəyişdir | ✅ | — | — | — |

## F. Reklam kabineti

```
[/biznes-kabinet/reklamlar]
   Tabs: [Aktiv] [Tarixçə] [Hesabatlar]
   ↓ "+ Yeni kampaniya"
[/biznes-kabinet/reklamlar/yeni]
   ─ Step 1: Hədəf
     - Hangi məhsul? (mövcud elan və ya banner)
     - Hədəf URL (avtomatik və ya manual)
   ─ Step 2: Auditoriya
     - Kateqoriya (multi-select)
     - Şəhər (multi-select)
     - Yaş, cins (gələcəkdə)
   ─ Step 3: Yer (placement)
     - Ana səhifə banner (yuxarı)
     - Ana səhifə banner (orta)
     - Kateqoriya banner
     - Search nəticəsi banner
     - Sponsor elan (axtarışda yuxarı)
   ─ Step 4: Banner yarat
     - Şəkil yüklə (web 1200×400, mobil 600×400)
     - Mətn (≤ 60 simvol)
     - "Pre-flight" yoxlama (auto)
   ─ Step 5: Büdcə + cədvəl
     - Ümumi büdcə: 100 ₼
     - Günlük limit: 10 ₼
     - Tarix: 10.05 → 20.05
     - Bid model: CPM (1₼/1000 baxış) və ya CPC (0.05₼/klik)
   ─ Step 6: Ödəniş
     - Balansdan çıx
     - Yaxud kart
   ─ Step 7: Submit → admin onay
   ↓
   Status: pending → approved → active
   ↓
   Real-time stats:
   - Baxış / klik / CTR / spent
   - Pause/resume düyməsi
   - Auto-stop büdcə bitəndə
```

### Auction modeli (Faza 2)

Bid sistemi: hər banner slotu üçün rəqib reklamlar var. Sistem qiymət + relevance + CTR əsasında qalibi seçir (Generalized Second-Price).

```
score = bid × predicted_CTR × shop_quality_score
```

## G. Statistika & Analitika

```
[/biznes-kabinet/statistika]
   ─ Tarix range picker (default 30 gün)
   ─ KPI tiles:
     • Toplam baxış
     • Toplam mesaj
     • Telefon klikləri
     • WhatsApp klikləri
     • Sevimliyə əlavə
     • Konversiya: baxış → mesaj %
   ─ Chart 1: Baxışlar (gündəlik)
   ─ Chart 2: Mesajlar (gündəlik)
   ─ Cədvəl: Top 20 elan (sort baxış / mesaj / klik)
     - Hər sətirdə "Boost" düyməsi
   ─ Heatmap: Hansı saatlarda mesaj alınır
   ─ Demographics (Faza 2): yaş, şəhər, cihaz
   ─ Export: PDF, Excel
```

## H. Lead tracker

```
[/biznes-kabinet/leadlar]
   - Hər mesaj / zəng kliki "lead" sayılır
   - CRM-əbənzər kanban:
     New → Contacted → Negotiation → Won / Lost
   - Manual status dəyişmə
   - Qeyd əlavə etmə
   - Lead-i komanda üzvünə həvalə etmə
   - Excel export (CRM köçürmə üçün)
```

## I. Paket idarəsi

```
[/biznes-kabinet/paketim]
   Cari paket: Business
   Bitmə: 12 İyun 2026 (35 gün qaldı)
   Auto-renew: ✅
   ─────────────────────────────
   İstifadə statistikası:
   • Aktiv elan: 124 / 500 limit
   • Toplu yükləmə: 4 / 10 ay
   • API çağırışı: 12 450 / 50 000 ay
   ─────────────────────────────
   [Paketi yenilə →]   [Paketi ləğv et]
   ─────────────────────────────
   Mövcud paketlər (upgrade/downgrade):
   • Pro 200₼/ay → limitsiz elan + API
   • Enterprise — qiyməti sazişlə
```

## J. API / İnteqrasiya

```
[/biznes-kabinet/inteqrasiyalar]
   ─ API açarları:
     - "Yeni açar yarat" → tək dəfə göstərilir
     - Açarlar siyahısı (məhdud icazələrlə yaradıla bilər)
     - Audit log: hər açarla nə edilib
   ─ Webhook:
     - URL əlavə et
     - Hadisələr seç (listing.created, message.received)
     - Test send
     - Retry policy
   ─ Marketplace inteqrasiyaları:
     - 1C, Logo, Bitrix
     - Shopify, WooCommerce export
     - Zapier connector
```

## K. Faktura və mali sənədlər

```
[/biznes-kabinet/fakturalar]
   - Aylıq xülasə
   - Tək tək ödənişlər
   - Hər biri üçün PDF faktura (rəsmi format, e-Qaimə inteqrasiyası Faza 3)
   - VÖEN-li faktura
   - Annual summary (vergi üçün)
```

## L. Verified / Premium status

| Status | Tələb |
|---|---|
| **Pending** | yenicə qeydiyyatdan keçib |
| **Verified** ✓ | VÖEN doğrulanıb, sənədlər təsdiq |
| **Premium** ⭐ | aktiv premium paketi var, ≥ 4.5 reyting |
| **Top Trader** 🏆 | son 6 ayda ≥ 50 satış + < 1% şikayət |

Hər status mağaza səhifəsində + elan kartlarında görünür.
