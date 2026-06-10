# 06 — Frontend Arxitektura (Next.js)

> Next.js 15 App Router, SSR/ISR (SEO + sürət), TypeScript, Tailwind + **shadcn/ui** (quraşdırılmalı), mobile-first.

---

## 1. Render strategiyası

| Səhifə | Strategiya | Səbəb |
|--------|-----------|-------|
| Ana səhifə (region) | **ISR** (revalidate ~60s) per-region | SEO + sürət |
| Region+kateqoriya landing | **ISR** + dynamic params | SEO landing |
| Listing grid | **SSR** ilk yük + client-side filter/infinite scroll | təzə data + sürət |
| Detail | **SSR** (SEO, structured data) | SEO + paylaşım |
| Search | **Client** (Meilisearch) + SSR shell | interaktivlik |
| Profil/Panel | **Client** (auth-qorumalı) | şəxsi |

---

## 2. Marşrut strukturu (hədəf `app/`)

```
app/
  layout.tsx                      # Header, Footer, RegionProvider, Toast
  page.tsx                        # Ana səhifə (region-aware hero + bloklar)
  (regional)/
    [region]/
      page.tsx                    # Region ana səhifəsi  → /qebele
      [category]/page.tsx         # Region+kateqoriya     → /qebele/telefonlar
      [category]/[slug]/page.tsx  # SEO detail (opsional) → /qebele/iphone-15-pro
  elanlar/
    page.tsx                      # Universal grid (filter)
    [id]/page.tsx                 # Detail
  neqliyyat/page.tsx              # Vertical landing (transport)
  emlak/page.tsx                  # Vertical landing (realestate)
  is-elanlari/page.tsx            # Vertical landing (job)  [karyera → rename]
  store/[slug]/page.tsx           # Mağaza public profili
  elan-yerlesdir/
    page.tsx                      # Sihirbaz: kateqoriya→forma→region→şəkil
    toplu/page.tsx                # Toplu (business)
  axtaris/page.tsx                # Search nəticələri
  profil/...                      # İstifadəçi paneli (bax 10)
  biznes/...                      # Mağaza paneli (bax 10)
  admin/...                       # Admin paneli (bax 10)
  (auth)/login, register          # Vahid auth (3 marşrut → 1)
  sitemap.ts, robots.ts           # SEO
```

> Köhnə `/seher/[city]` → `/[region]` strukturuna miqrasiya (redirect saxla).

---

## 3. Komponent iyerarxiyası (nüvə)

```
layout/
  Header  (Logo · Categories · SearchBar · RegionSelector · PostButton · Favorites · Messages · Notifications · Profile)
  Footer
  BottomNav (mobil: Ana · Axtarış · Elan+ · Mesajlar · Profil)
  RegionModal (12 region + yaxınlıq + bütün AZ + xəritə)

home/
  Hero (region-aware başlıq + böyük search + "yaxınlığımda" + "bütün AZ")
  RegionBlocks · CategoryGrid · NewInRegion · NearbyStores · InStockProducts · ErpVerifiedStores

listing/
  ListingCard            (universal — badge sistemi)
  VehicleCard / RealEstateCard / JobCard   (vertical-specific)
  ListingGrid · ListingSkeleton · Pagination/InfiniteScroll
  FilterSidebar · FilterChips · DynamicFilters · SortBar
  EmptyState (+ "yaxın rayonlarda bax" / "bütün AZ")

detail/
  Gallery (+ video/360 P1) · PriceBlock · BadgeRow · SellerCard
  ContactActions (Zəng · WhatsApp · Mesaj) · MapBlock · AttributesTable (AZ)
  SimilarListings · NearbyRegionListings · StoreOtherListings · ReportButton

shared/
  Badge (VIP/Premium/ERP-stock/InStock/Delivery/Credit/Warranty/PickupToday)
  ImagePlaceholder · FavoriteButton · CompareButton · ShareMenu · Breadcrumb
```

---

## 4. Badge sistemi (listing kartı)

| Badge | Şərt | Görünüş |
|-------|------|---------|
| VIP / Premium | `isVip/isPremium` | rəngli lent |
| **ERP stok** | `source=erp && inStock` | yaşıl "ERP təsdiqlənmiş stok" |
| Stokda var/yox | `inStock` | yaşıl/boz |
| Çatdırılma | `hasDelivery` | ikon |
| Kredit | `hasCredit` | ikon |
| Zəmanət | `hasWarranty` | ikon |
| Mağaza/Fərdi | `sellerType` | etiket |
| Bu gün götür | `pickupToday` | etiket |

Şəkilsiz elan → peşəkar `ImagePlaceholder` + **sıralamada aşağı prioritet**.

---

## 5. State idarəsi

- **Region:** `RegionProvider` (React Context) — mənbə prioriteti: URL `[region]` → cookie → localStorage → geolokasiya. Server-də cookie-dən oxunur (SSR uyğunluq).
- **Auth:** `lib/auth.tsx` (mövcud) — token `360tap_token` (rebrand).
- **Favoritlər/müqayisə:** localStorage + auth olanda server sync.
- **Filterlər:** URL query (paylaşıla bilən, SSR-uyğun).
- Data fetching: `lib/api.ts` wrapper + React Server Components (server) / SWR-vari client fetch.

---

## 6. Dizayn sistemi

- **shadcn/ui** quraşdır (button, input, select, dialog, sheet, dropdown, tabs, badge, card).
- Tailwind dizayn tokenləri: brand rəng, region accent, spacing scale.
- Tipografiya, ikon dəsti (vahid — lucide-react var).
- Kateqoriya ikonları: **vahid stil** (eyni grid, ölçü, rəng).
- Dark mode mövcud (`ThemeToggle`) — saxla.

---

## 7. Mobile-first

- Bottom navigation, sticky **Zəng/WhatsApp** düymələri (detail).
- Filterlər: mobil **Sheet** (bottom drawer) + quick filter chip-lər.
- Böyük search, region selector öndə.
- Kamera ilə şəkil yükləmə (`<input capture>`).
- **PWA**: manifest + service worker (mövcud `PWAInstallBanner`, `PushSubscribe`).

---

## 8. Performans

- `next/image` + S3 + blurhash placeholder + lazy load.
- ISR region/kateqoriya landing; Redis-backed API cache.
- Infinite scroll + pagination hibrid.
- Kod bölgüsü: Lab/AI komponentləri `dynamic(() => ..., { ssr:false })`.
- Core Web Vitals hədəf: LCP <2.5s, CLS <0.1, INP <200ms.

---

## 9. Lab/dev rejim

- `lib/lab-features.ts` (mövcud) → feature flag: Lab komponentləri yalnız `?lab=1` və ya admin/dev rejimdə.
- Public istifadəçi sadə, fokuslu UI görür (gimmick gizli).

---

## 10. Köhnə komponentlərin taleyi (xülasə)

| Aksiya | Nümunə |
|--------|--------|
| Saxla + cilala | Header, ListingCard, FilterSidebar, vertical filterlər, CityPicker→RegionSelector, SellerCard, MapView |
| Birləşdir | 3 auth marşrutu → 1; `QuickView`/`QuickViewModal` dublikatları |
| Lab-a köçür | LiveBidding, GroupBuy, Stories, XP, Loyalty, Escrow, SecretChat |
| Real-fayda saxla | AutoCategorize, AISimilar, PriceInsight |
| Sil/arxiv | təkrarlanan/işləməyən demo komponentlər |
