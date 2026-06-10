# 01 — Mövcud Vəziyyət və Gap Analizi

> Bu sənəd **real kod analizinə** əsaslanır (frontend, hər iki backend, DB sxemləri, komponentlər). Məqsəd: nə var, nə işləyir, nə zəifdir, nə dəyişməlidir.

---

## 1. Repozitoriya quruluşu

```
360tap.az/
├── frontend/        Next.js 15 + React 19 RC — CANLI (port 5401)
├── backend/         Express + xam SQL — CANLI (port 5400), frontend buna proxy edir
├── api/             NestJS + Prisma — YARIMÇIQ (frontend-ə qoşulmayıb)
├── docs/            22 köhnə planlaşdırma sənədi (arxiv)
├── avito screen/    turbo.az REFERANS screenshotları (cari dizayn deyil)
└── docs/v2/         ← bu yeni sənəd dəsti
```

> ⚠️ Tarixi qeyd: layihə əvvəl **avito.az** adlanıb (DB adı `avito_az`, localStorage açarları `avito_token`, `avito_selected_city`). 360tap.az-a rebrendinq edilib.

---

## 2. Frontend (canlı)

**Texnologiya:** Next.js 15.0.3, React 19 RC, TypeScript, Tailwind 3.4, leaflet, socket.io-client. shadcn/ui **quraşdırılmayıb** (xam Tailwind komponentləri).

### 2.1 Mövcud marşrutlar (`app/`)
| Marşrut | Təyinat |
|---------|---------|
| `/` | Ana səhifə |
| `/neqliyyat` | Nəqliyyat vertikalı |
| `/emlak` | Daşınmaz əmlak |
| `/karyera` | İş elanları |
| `/elanlar`, `/elanlar/[id]` | Universal listing + detal |
| `/k/[category]` | Kateqoriya səhifəsi |
| `/seher/[city]`, `/seher/[city]/[category]` | **Region marşrut skeleti (mövcud!)** |
| `/elan-yerlesdir`, `/elan-yerlesdir/toplu` | Elan əlavə + toplu |
| `/profil/*` | 12 profil alt-səhifəsi (elanlarım, mesajlar, sevimlilər, balans, reyler...) |
| `/admin` | Admin (tək səhifə) |
| `/login`, `/register`, `/qeydiyyat` | Auth (3 marşrut — **dublikat**) |
| `/biznes`, `/reklam`, `/lab`, `/muqayise`, `/sekille-axtar` | Biznes, reklam, Lab, müqayisə, şəkillə axtarış |

### 2.2 Komponentlər (~140 fayl) — təsnifat

**✅ Saxlanılır (peşəkar nüvə):**
`Header`, `Footer`, `ListingCard`, `ListingSkeleton`, `CategoryGrid/Tiles`, `FilterSidebar`, `FilterChips`, `QuickFilterChips`, `DynamicFilters`, `CityPicker`, `LocationPicker`, `SellerCard`, `Breadcrumb`, `MapView/MapInner`, `SearchAutocomplete`, `Logo`, `AuthModal`, `Stories`(?), `Compare*`, `PriceHistory`, `ShareMenu`, `WhatsAppFloat`, `ReportModal`, `NotificationsDropdown`, `MegaMenu`, vertical TopBar/FullFilter-lər (`TransportFullFilter`, `RealEstateFullFilter`, `UniversalFullFilter`).

**⚠️ Lab/dev rejimə köçür (spekulyativ, MVP-dən kənar):**
`LiveBidding`, `GroupBuy`, `LiveDealsTicker`, `LivePresence`, `LiveViewerStats`, `SecretChat`, `Stories`(əgər demo), `XPBadge`, `LoyaltyPoints`, `AchievementBadges`, `ReferralProgram`, `EscrowBadge`, `TestDriveBooking`, `MeetingScheduler`, `GroupBuy`, `CountdownTimer`, `RecentlySoldFeed`, `TelegramBotConnect`, `VoiceNote`, `FloatingVoiceFAB`.

**⚠️ AI komponentləri — yenidən qiymətləndir (yalnız real fayda verənlər qalsın):**
`AIAssistant`, `AIAssistantChat`, `AIFraudScore`, `AIListingRewrite`, `AINegotiator`, `AISimilar`, `AISmartSuggest`, `AISummary`, `AITranslate`, `AutoCategorize`, `MarketPriceAnalyzer`, `PricingAssistant`, `QuickPriceEstimate`.
→ MVP-də saxlanıla bilən real-faydalılar: **AutoCategorize** (elan əlavədə), **AISimilar/AISmartSuggest** (oxşar elanlar), **PriceInsight** (qiymət analizi). Qalanları sonra.

### 2.3 Data qatı
- `lib/api.ts` — sadə `fetch` wrapper, `NEXT_PUBLIC_API_URL || '/api'`, token `localStorage('avito_token')`. **Tək, sadə, yetərli** — saxlanılır, açar adı `360tap_token`-a dəyişdirilir.
- `lib/city.ts` — region seçimi **yalnız localStorage** (slug + ad). Server-side inteqrasiya, proximity, nearby məntiqi **yoxdur**. → ciddi genişləndirmə lazım (bax `07_region_first_and_search.md`).
- `lib/transport-data.ts`, `lib/realestate-data.ts` — statik vertical data (marka/model, əmlak tipləri). → DB-ə köçürülməli (Brand/Model cədvəlləri).

---

## 3. Backend-lər

### 3.1 `backend/` — Express (CANLI, port 5400)
- **Xam SQL** (`migrations/001_init.sql`, `002_seed.sql`), `pg` driver.
- **11 cədvəl:** users, categories (3-səviyyəli ağac), cities, listings, listing_media, favorites, chats, messages, reviews, complaints, payments.
- **Güclü tərəflər:** PostgreSQL extension-ları (`pg_trgm` fuzzy search, `btree_gin`, `citext`, `uuid-ossp`), GIN indekslər (`attributes` JSONB, `title` trgm), updated_at triggerlər, socket.io chat.
- **Marşrutlar:** auth, listings, categories, cities, search, smart-search, realestate, favorites, notifications, chats, complaints, import, upload, ai, voice, image-search, saved-searches, insights, clientlog.
- **Çatışmazlıq:** Store/StoreBranch yox, Region/District/nearby yox, CategoryAttribute (admin-managed) yox, ERP yox, Notification cədvəli yox, AuditLog yox, vertical detail cədvəlləri yox.

### 3.2 `api/` — NestJS + Prisma (YARIMÇIQ)
- **Təmiz, müasir Prisma schema:** User, RefreshToken, Category, **CategoryAttribute (dynamic attributes — artıq var!)**, City (lat/lng), Listing, ListingImage.
- **Modullar:** yalnız `auth`, `categories`, `listings` (3-ü). Stores, search, chat, payments, ERP yoxdur.
- **Güclü tərəflər:** UUID, snake_case mapping, enum-lar (UserRole, ListingStatus, PriceType, Condition, AttributeType), düzgün indekslər, JWT+argon2, Swagger, global guard/filter/interceptor.
- **Qərar:** bu **əsas backend olur**, genişləndirilir.

### 3.3 Miqrasiya nəticəsi
Express-də olan, NestJS-də olmayan **işləyən domenlər** Prisma-ya köçürülməlidir: **favorites, chats/messages, reviews, complaints, payments, cities seed**. Bax `12_risks_and_roadmap.md` → miqrasiya planı.

---

## 4. UI/UX gap analizi və konkret düzəlişlər

> Brief bölmə 1–24 + kod analizi əsasında. **P0** = MVP, **P1** = Faza-2, **P2** = sonra.

### 4.1 Ana səhifə
| # | Problem | Düzəliş | Pri |
|---|---------|---------|-----|
| H1 | Platformanın fərqi açıq deyil | Güclü **hero**: "Azərbaycanda hər şeyi öz regionunda tap" + alt mətn + böyük search | P0 |
| H2 | Region passivdir | Hero-da region seçimi öndə + "Mənim yaxınlığımda" + "Bütün Azərbaycan üzrə axtar" | P0 |
| H3 | ERP fərqi görünmür | "ERP ilə təsdiqlənmiş mağazalar" bölməsi/badge | P0 |
| H4 | Region blokları yox | Bakı, Sumqayıt, Gəncə, Qəbələ, Quba, Lənkəran, Şəki, Mingəçevir blokları | P0 |
| H5 | Region kontenti yox | "Sənin regionunda yeni elanlar", "Yaxın mağazalar", "Real stokda olan məhsullar" blokları | P0/P1 |

### 4.2 Header
- Sadələşdir: Logo · Bütün kateqoriyalar · **böyük search** · **region seçici (əsas funksiya)** · Elan yerləşdir · Seçilmişlər · Mesajlar · Bildirişlər · Login/profil.
- Region click → **modal** (Mənim yaxınlığımda, 12 region siyahısı, Bütün Azərbaycan, Xəritədən seç). Seçimdən sonra **bütün sayt** həmin regiona uyğunlaşır. **P0**

### 4.3 Listing kartı
Hazırda məlumat azdır. **Hər kartda olmalı:** şəkil/placeholder, başlıq, qiymət, region/şəhər, tarix, **mağaza/fərdi badge**, VIP/Premium badge, **ERP təsdiqlənmiş stok badge**, stokda var/yox, çatdırılma/kredit/zəmanət badge, favorit, müqayisə, **WhatsApp/zəng quick action**, baxış sayı, **"bu gün götürmək olar"** etiketi. Şəkilsiz elanlar üçün peşəkar placeholder + aşağı prioritet sıralama. **P0** (badge-lərin bir hissəsi P1).

### 4.4 Vertical kartları (fərqli olmalı)
- **Nəqliyyat** kartı: marka/model, il, mühərrik, yürüş, yanacaq, sürətlər qutusu, şəhər, qiymət, salon/fərdi, kredit/barter, "vuruğu yoxdur/rənglənməyib" badge.
- **Əmlak** kartı: otaq sayı, sahə, mərtəbə, rayon/metro, qiymət, 1 m² qiyməti, çıxarış/ipoteka badge, agentlik/fərdi.
- **İş** kartı (məhsul kartı kimi YOX): vəzifə, şirkət, maaş, şəhər, iş qrafiki, təcrübə, "yeni/təcili" badge, **1 klik müraciət**.
**P0** (əsas sahələr), zənginləşmə P1.

### 4.5 Detail səhifəsi
- **İngilis sözləri Azərbaycancaya çevril:** Area→Sahə, Floor→Mərtəbə, Rooms→Otaq sayı, Repair→Təmir, Extract→Çıxarış, Mortgage→İpoteka, Total Floors→Binanın mərtəbə sayı, Building Type→Bina növü. **P0**
- Əlavə: böyük qalereya, video/360 imkanı (P1), razılaşma etiketi, baxış sayı, xəritə, elan nömrəsi, güclü satıcı kartı, satıcının digər elanları, oxşar elanlar, **yaxın regionlarda oxşar**, qiymət tarixi (P1), qiymət düşəndə xəbər ver (P1), zəng/WhatsApp/mesaj/paylaş/şikayət/favorit/müqayisə.
- **Satıcı kartı:** tip (fərdi/mağaza/ERP mağazası/agentlik/avtosalon), təsdiqlənmiş badge, ERP stok badge, cavab sürəti, aktiv elan sayı, reytinq.

### 4.6 Ümumi
- **Lab/Lite/Pro** dev elementləri public istifadəçidə qarışıqlıq yaradırsa **gizlədilir** (admin/dev mode). **P0**
- **3 auth marşrutu** (`/login`, `/register`, `/qeydiyyat`) → birləşdirilir/yönləndirilir. **P0**
- Kateqoriya ikonları → vahid, peşəkar stil. **P1**

---

## 5. Xülasə: nə qalır, nə gedir, nə əlavə olunur

| Aksiya | Element |
|--------|---------|
| **Qalır (cilalanır)** | Frontend nüvə komponentləri, NestJS auth/categories/listings, PostgreSQL search infrastrukturu, region marşrut skeleti |
| **Köçürülür** | Express domenləri (favorites/chat/reviews/complaints/payments) → NestJS+Prisma |
| **Əlavə olunur** | Store/StoreBranch, Region/District/nearby, tam dynamic attributes, ERP gateway, Meilisearch, vertical detail modelləri, moderation, monetizasiya modelləri, admin/store panelləri |
| **Təxirə salınır (Lab)** | LiveBidding, GroupBuy, Stories, XP/Loyalty, Escrow, SecretChat, AI gimmick-lərin əksəriyyəti |
