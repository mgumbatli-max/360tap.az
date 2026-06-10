# 07 — Region-First Sistem, Axtarış və SEO

> Layihənin ən vacib fərqləndiricisi. Bütün UX region-first məntiqə görə qurulur.

> **✅ İcra statusu (2026-06-10):** Geo (region/district/nearby/resolve) + Meilisearch axtarış quruldu (`src/search`).
> Region tanıma (AZ+RU+EN), transliterasiya, sinonim/typo, incremental indexing (ERP→Meili, read-your-writes), reindex (admin-only), zero-result SearchLog. Review ilə möhkəmləndirildi (13 tapıntı).
> **Təxirə (Faza 1.5, review qeydləri):** (1) **nearby-region fallback** (az nəticədə "yaxın rayonlarda bax") — geo nearby + listings hazırdır, search/listings-ə bağlanmalıdır; (2) **moderasiya activation → indexListing** (hazırda user elanları 'review'-da qalır, activation flow yoxdur — qurulanda search.indexListing çağırılmalı); (3) estimatedTotalHits dəqiqləşdirmə, EN sinonim genişlənmə.

---

## 1. Region modeli

İki səviyyə: **Region** (Bakı, Qəbələ, Gəncə...) → **District** (rayon/qəsəbə). Hər ikisində GPS (`lat/lng`).
**NearbyDistrict** cədvəli rayonlar arası yaxınlığı saxlayır (haversine + admin override).

```
Region (qebele)
 ├ District (qebele-merkez)  lat/lng
 ├ District (vendam)
 └ ...
NearbyDistrict: qebele-merkez → [oguz, ismayilli, qax, seki] (distanceKm, rank)
```

### Seed strategiyası
1. 12+ region + rayonlar əl ilə/açıq mənbədən GPS koordinatları ilə.
2. NearbyDistrict job: hər rayon üçün haversine ilə ən yaxın N rayonu hesabla (məs. 100 km daxilində top 6), `rank` ver.
3. Admin override edə bilər (bəzi yaxınlıqlar coğrafi yox, məntiqi).

---

## 2. Region kontekstinin axını

**Mənbə prioriteti:** URL `[region]` → cookie `360tap_region` → localStorage → geolokasiya (`/geo/resolve`) → default (Bütün Azərbaycan).

```
İlk giriş → region soruş ("Harada axtarırsınız?")
  Seçim: Mənim yaxınlığımda | 12 region | Bütün Azərbaycan | Xəritədən seç
  → cookie + localStorage yaz, URL-i /[region]-a yönəlt
```

**Region seçiləndə (məs. Qəbələ):**
- Ana səhifə Qəbələ elanlarını göstərir.
- Header-də "Qəbələ" görünür.
- Kateqoriya səhifələrində default Qəbələ filteri.
- Axtarış nəticələri Qəbələdən başlayır.
- Nəticə azdırsa → **"Yaxın rayonlarda da bax"** (NearbyDistrict) + **"Bütün Azərbaycan üzrə göstər"**.

### Region-aware sorğu (backend)
`GET /listings?region=qebele` →
1. `district_id ∈ regionun rayonları` filtri.
2. Nəticə `< threshold` (məs. 10) → cavabda `meta.nearbyAvailable=true` + nearby rayon elanları ayrıca blok.
3. Sıralama: əvvəl region daxili, sonra nearby (rank-a görə), sonra (istənsə) bütün AZ.

---

## 3. Axtarış arxitekturası (Meilisearch)

### Niyə Meilisearch
Sürət (<50ms), typo-tolerance (built-in), sinonim, asan host, kiçik infrastruktur. (Typesense alternativ; Elasticsearch overkill bu mərhələdə.) Postgres `pg_trgm` **fallback** kimi qalır.

### İndekslər
- `listings` indeksi: `title, description, brand, model, category, region, district, attributes(searchable)`.
- Filterable: `vertical, categoryId, regionSlug, districtId, price, inStock, source, isVip, attrs.*`.
- Sortable: `price, createdAt, promotedUntil`.
- Searchable atributlar: `CategoryAttribute.isSearchable=true` olanlar avtomatik index-ə (bax `09`).

### Sorğu anlama (query understanding)
Tələb olunan davranış: "iPhone 15 Pro Qəbələ", "BMW X5 Gəncə", "gence ev kiraye", "qebele iphone".

Pipeline:
```
raw query
  → normalize (lowercase, trim)
  → transliterasiya map (qebele→qəbələ, gence→gəncə, masin→maşın, seki→şəki, ...)
  → token tagging:
       region tanı  (lüğət: region/district adları + transliterasiya)
       brend/model tanı (Brand/VehicleModel lüğəti)
       kateqoriya/sinonim tanı (maşın=avtomobil, ev=mənzil, kirayə=icarə, iş=vakansiya, noutbuk=laptop)
       qiymət aralığı tanı ("500 manata qədər", "1000-2000")
  → qalan söz = sərbəst mətn
  → Meilisearch sorğusu: q=mətn + filter(region, kateqoriya, brend) + synonyms
```

### Dil və sinonimlər
- AZ (əsas) + RU + EN.
- Sinonim lüğəti Meilisearch `settings.synonyms` + admin-redaktə.
- Transliterasiya cədvəli (kod + admin əlavə).
- "Tapılmayan axtarışlar" → `SearchLog(resultsCount=0)` → admin paneldə → sinonim/kontent boşluğu aşkarı.

### Endpoint-lər
`GET /search?q=&region=&vertical=` → nəticə + `meta.detectedRegion/detectedCategory/facets/nearbyAvailable`.
`GET /search/suggest?q=` → autocomplete (region/brend/model/kateqoriya tanıma).

---

## 4. SEO arxitekturası

### URL strukturu (region + kateqoriya)
```
/qebele                         region landing
/qebele/telefonlar              region + kateqoriya
/gence/avtomobiller             "
/seki/kiraye-evler              "
/sumqayit/vakansiyalar          "
/baki/iphone-15-pro             region + elan (SEO slug)
/store/qebele-techstore         mağaza
```

### Tələblər
| Element | Tətbiq |
|---------|--------|
| SSR/ISR | region+kateqoriya landing ISR (revalidate) |
| Dynamic sitemap | `sitemap.ts` — region×kateqoriya + aktiv elanlar |
| Meta title/description | per region+kateqoriya şablon ("Qəbələdə telefonlar — 360tap.az") |
| Canonical | filter kombinasiyalarında canonical əsas səhifəyə |
| Structured data | `Product`, `Offer`, `BreadcrumbList`, `JobPosting`, `RealEstateListing` (JSON-LD) |
| Breadcrumb | Region › Kateqoriya › Elan |
| Noindex | dərin filter kombinasiyaları (`?attrs[...]`) noindex |
| Şəkil opt. | `next/image`, WebP, ölçülər |
| Region landing pages | admin-managed SEO mətn (`SeoPage`/`Category.seoTitle`) |

### Region landing kontenti
Hər region+kateqoriya səhifəsi: H1, qısa SEO mətn, populyar alt-kateqoriyalar, yeni elanlar, yaxın regionlar linkləri (internal linking).

---

## 5. Region-first performans

- Region+kateqoriya landing **ISR** + Redis cache.
- `listings_count` denormalized (kateqoriya/region üzrə) — sürətli sayğac.
- Nearby hesablama **əvvəlcədən** (NearbyDistrict cədvəli), sorğu zamanı yox.

---

## 6. Açıq suallar / data ehtiyacları

1. Tam region+rayon siyahısı və GPS koordinatları (seed üçün) — açıq data və ya əl ilə.
2. Metro stansiyaları (Bakı əmlak üçün) siyahısı.
3. Sinonim/transliterasiya başlanğıc lüğəti (kod + admin genişlədir).
4. SEO landing mətnləri (admin və ya generasiya).
