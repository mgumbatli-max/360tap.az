# 16 — SEO Strategiyası və Strukturu

## A. URL strukturu (lokal Azərbaycan dilində, lakin universal)

```
/                                    Ana səhifə
/elanlar                             Bütün elanlar (filter URL)
/elanlar?q=iphone&category=telefon&city=baki

/k/[category]                        /k/elektronika
/k/[category]/[sub]                  /k/elektronika/telefon
/k/[category]/[sub]/[type]           /k/elektronika/telefon/iphone

/seher/[city]                        /seher/baki
/seher/[city]/[category]             /seher/baki/avtomobil
/seher/[city]/[category]/[sub]       /seher/baki/avtomobil/bmw

/elanlar/[id]-[slug]                 /elanlar/abc123-iphone-15-pro-256gb-titanium

/magaza/[slug]                       /magaza/electrocity
/istifadeci/[id]                     /istifadeci/anar-aliyev

/blog                                Blog index
/blog/[slug]                         Blog məqalə

/qaydalar, /mexfilik, /komek, /elaqe Statik səhifələr
```

### URL qaydaları
- **Çox kiçik hərf** + tire (no underscore, no camelCase)
- **AZ hərflərinin transliterasiyası**: ə→e, ı→i, ö→o, ü→u, ğ→g, ş→s, ç→c
- **Maksimum 6 sətir** dərinlik
- **Slug** elan başlığından + ID prefix (uniq + insanqavrayışlı)
- **Trailing slash yoxdur** (canonical-də 301)
- **Qaranqıqlığı önlə**: `/elanlar/123` deyil `/elanlar/123-iphone-15`

## B. Schema.org strukturlu data

### Ana səhifə
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Marketplace.az",
  "url": "https://marketplace.az",
  "logo": "https://cdn.marketplace.az/logo.png",
  "sameAs": ["https://facebook.com/...", "https://instagram.com/..."],
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://marketplace.az/elanlar?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

### Məhsul elanı (Product)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "iPhone 15 Pro Max 256GB Titanium",
  "image": ["https://cdn.../1.jpg", "..."],
  "description": "...",
  "brand": { "@type": "Brand", "name": "Apple" },
  "sku": "abc123",
  "offers": {
    "@type": "Offer",
    "url": "https://marketplace.az/elanlar/abc123-iphone-15-pro",
    "priceCurrency": "AZN",
    "price": "1500",
    "itemCondition": "https://schema.org/UsedCondition",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Person",
      "name": "Anar Əliyev",
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7", "reviewCount": "23" }
    }
  }
}
```

### Avtomobil (Vehicle)
```json
{
  "@type": "Vehicle",
  "name": "BMW X5 2020",
  "brand": "BMW",
  "model": "X5",
  "modelDate": "2020",
  "vehicleConfiguration": "xDrive40i",
  "fuelType": "Gasoline",
  "vehicleTransmission": "Automatic",
  "mileageFromOdometer": { "@type": "QuantitativeValue", "value": 45000, "unitCode": "KMT" },
  "offers": { ... }
}
```

### Daşınmaz əmlak (RealEstateListing)
```json
{
  "@type": "RealEstateListing",
  "name": "3 otaqlı mənzil — Yasamal",
  "datePosted": "2026-05-08",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Bakı",
    "addressRegion": "Yasamal"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 40.4, "longitude": 49.8 },
  "numberOfRooms": 3,
  "floorSize": { "@type": "QuantitativeValue", "value": 100, "unitCode": "MTK" },
  "offers": { ... }
}
```

### İş elanı (JobPosting)
```json
{
  "@type": "JobPosting",
  "title": "Frontend Developer",
  "datePosted": "...",
  "validThrough": "...",
  "description": "...",
  "hiringOrganization": { "@type": "Organization", "name": "TechCo" },
  "jobLocation": { ... },
  "baseSalary": { "@type": "MonetaryAmount", "currency": "AZN", "value": { "@type": "QuantitativeValue", "value": 2500, "unitText": "MONTH" } },
  "employmentType": "FULL_TIME"
}
```

### BreadcrumbList (hər səhifədə)
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Ana", "item": "https://..." },
    { "@type": "ListItem", "position": 2, "name": "Elektronika", "item": "..." },
    { "@type": "ListItem", "position": 3, "name": "Telefon", "item": "..." },
    { "@type": "ListItem", "position": 4, "name": "iPhone 15 Pro" }
  ]
}
```

### Mağaza (LocalBusiness)
```json
{
  "@type": "LocalBusiness",
  "name": "ElectroCity",
  "image": "...",
  "address": "...",
  "openingHours": "Mo-Sa 09:00-21:00",
  "telephone": "+994...",
  "aggregateRating": { ... }
}
```

## C. Meta tags

### Ana səhifə
```html
<title>Marketplace.az — Azərbaycanda elanlar və alqı-satqı</title>
<meta name="description" content="Avtomobil, mənzil, iş, elektronika və minlərlə kateqoriya. Pulsuz elan yerləşdir, milyonlarla insana çatdır.">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="https://cdn.../og-home.jpg">
<meta property="og:url" content="https://marketplace.az">
<meta name="twitter:card" content="summary_large_image">
```

### Elan səhifəsi (dynamic)
```html
<title>{{title}} — {{price}} ₼ — {{city}} | Marketplace.az</title>
<meta name="description" content="{{description.slice(0,160)}}">
<meta property="og:image" content="https://api.../og/{{id}}">  ← dynamic OG image
<link rel="canonical" href="https://marketplace.az/elanlar/{{id}}-{{slug}}">
```

### Filter səhifələri (canonical strategy)
```
URL: /elanlar?category=telefon&city=baki&min_price=500
- Filter URL → canonical → /seher/baki/elektronika/telefon
- Canonical: filter parametrləri olmayan SEO landing-ə yönəlir
- noindex yalnız: cursor pagination səhifələri (page=2+)
```

## D. SEO landing səhifələri (avtomatik generasiya)

### Səhifə tipləri
1. **Kateqoriya**: `/k/[category]`
2. **Sub-kateqoriya**: `/k/[category]/[sub]`
3. **Şəhər**: `/seher/[city]`
4. **Şəhər × kateqoriya**: `/seher/[city]/[category]`
5. **Şəhər × sub-kateqoriya**: `/seher/[city]/[category]/[sub]`
6. **Brend**: `/k/avtomobil/bmw` (atribut əsaslı)
7. **Populyar axtarış**: `/axtaris/iphone-15` (top 1000 query)

### Avtomatik məzmun
Hər landing-də:
- H1: "{{Şəhər}}-də {{Kateqoriya}} elanları"
- Açıqlayıcı paraqraf (template + AI generated)
- Top 12 elan (ISR)
- Sub-kateqoriya linkləri (faydalı navigasiya)
- Yan kateqoriyalar
- Blog post linkləri (related)
- FAQ accordion (SEO + faydalı)

### Misal HTML
```html
<h1>Bakıda Telefon elanları (1 235 elan)</h1>
<p>Bakı şəhərində 1 235 telefon elanı var. iPhone, Samsung, Xiaomi və digər markalar üzrə yeni və işlənmiş telefonlar tapacaqsınız. Qiymət aralığı 50 ₼ - 3 500 ₼.</p>

<section>
  <h2>Populyar markalar</h2>
  <ul>
    <li><a href="/k/elektronika/telefon/iphone">iPhone (450 elan)</a></li>
    <li><a href="/k/elektronika/telefon/samsung">Samsung (320 elan)</a></li>
  </ul>
</section>

<section>
  <h2>Şəhərlər</h2>
  <ul>
    <li><a href="/seher/sumqayit/elektronika/telefon">Sumqayıtda Telefon</a></li>
    ...
  </ul>
</section>

<section class="faq">
  <h2>Tez-tez verilən suallar</h2>
  <details>
    <summary>Bakıda telefon necə alınır?</summary>
    <p>...</p>
  </details>
</section>
```

## E. sitemap.xml strategiyası

```
sitemap.xml (master, parçalanmış):
├── sitemap-static.xml      # 50 statik səhifə
├── sitemap-categories.xml  # ~200 kateqoriya
├── sitemap-cities.xml      # 12 şəhər × 18 kateqoriya = 216
├── sitemap-listings-1.xml  # son 50 000 elan
├── sitemap-listings-2.xml  # 50K-100K
├── ...
├── sitemap-shops.xml       # bütün mağazalar
└── sitemap-blog.xml        # blog məqalələri
```

### Generation
- Static & catalog: SSG (build time + ISR 24 saat)
- Listings: dynamic API endpoint, `lastmod` filtri ilə incremental
- Hər partition max 50 000 URL

### Robots.txt
```
User-agent: *
Allow: /

# Filter URL-lər
Disallow: /elanlar?cursor=
Disallow: /api/

# Müəyyən bot-lar üçün crawl-delay
User-agent: AhrefsBot
Crawl-delay: 5

Sitemap: https://marketplace.az/sitemap.xml
```

## F. Performans (Core Web Vitals)

### Hədəflər (P75, real cihaz)
- **LCP** ≤ 2.0s (mobil), ≤ 1.5s (desktop)
- **INP** ≤ 200ms
- **CLS** ≤ 0.1

### Optimizasiyalar
- **Next.js RSC** — JavaScript göndərmir
- **Image optimization** — `next/image` + imgproxy + WebP/AVIF
- **Font** — `next/font` (Inter), preload, font-display: swap
- **Font subsetting** — yalnız AZ + Latin
- **CSS** — Tailwind purge + critical inline (~10KB)
- **Cache headers** — static assets `max-age=31536000, immutable`
- **CDN** — Cloudflare global edge
- **HTTP/3** Cloudflare default
- **Brotli compression**

### Lighthouse hədəfləri
- Performance ≥ 90 (mobil), ≥ 95 (desktop)
- Accessibility ≥ 95
- SEO ≥ 95
- Best Practices ≥ 95

## G. Texniki SEO checklist

- [ ] Server-side rendering bütün public səhifələrdə
- [ ] Hər səhifədə unique title + description
- [ ] H1 hər səhifədə bir
- [ ] Image alt text bütün şəkillərdə (avtomatik AI fallback)
- [ ] Internal linking structure (kateqoriya ↔ şəhər ↔ blog)
- [ ] Canonical URL hər səhifədə
- [ ] Hreflang (Faza 4-də multi-lang)
- [ ] Schema.org JSON-LD
- [ ] Open Graph + Twitter Card
- [ ] sitemap.xml + sitemap index
- [ ] robots.txt
- [ ] 404 səhifə + relevant tövsiyələr
- [ ] 301 redirect: trailing slash, www → non-www, http → https
- [ ] Breadcrumb hər səhifədə
- [ ] Pagination: rel=next/prev (köhnə) + cursor strategy
- [ ] AMP yoxdur — Core Web Vitals fokus
- [ ] HTTPS məcburi
- [ ] Mobile-first indexing hazır
- [ ] Page speed ≥ 90 (Lighthouse)
- [ ] Crawl budget optimization (priority hint)

## H. Content marketinq və link building

### Blog strategiyası
- Həftəlik 2 məqalə
- Kateqoriyalar: alış-veriş tövsiyələri, qiymət rəyləri, lifehack
- Hər məqalədə 3-5 daxili link (kateqoriya, populyar elan)
- AI generated draft → editor review

### Topic clusters (pillar-cluster)
```
PILLAR: "Bakıda mənzil almaq tam bələdçi"
  ↓ klasterlər:
  - "Bakı mənzil qiymətləri 2026"
  - "İpoteka necə alınır"
  - "Mənzil baxış: nəyə diqqət etmək"
  - "Mənzil sənədləri"
  - "İlk dəfə alıcılar üçün məsləhət"
```

### Backlink qaynaqları (white hat)
- PR (Trend.az, Report.az ilə müştərək məzmun)
- Statistika hesabatları (jurnalistlər linkləyir)
- Tool / kalkulyator (kredit, ipoteka)
- Komment-driven (forum, reddit kontekstli)
- Influencer review

## I. Lokal SEO

- Google Business Profile: ofis ünvanı
- Yandex.Business
- Lokal forum citation
- Schema LocalBusiness (mağazalar üçün)
- Şəhər × kateqoriya landing pages = lokal axtarış üçün əla

## J. International SEO (Faza 4)

```
URL strategy: /az, /ru, /en prefix
hreflang:
  <link rel="alternate" hreflang="az" href="https://marketplace.az/az/...">
  <link rel="alternate" hreflang="ru" href="https://marketplace.az/ru/...">
  <link rel="alternate" hreflang="en" href="https://marketplace.az/en/...">
  <link rel="alternate" hreflang="x-default" href="https://marketplace.az/...">

Lokalizasiya:
  - Tam tərcümə (UI + content)
  - Lokal valyuta default
  - Lokal şəhər
  - Tarix/ədəd format
```

## K. Monitoring və KPI

| Metric | Tool | Target (12 ay) |
|---|---|---|
| Organic sessions / ay | GA4 | 1.5 mln |
| Top 3 keyword sayı | Ahrefs | 5 000+ |
| Domain Rating | Ahrefs | ≥ 60 |
| Indexed pages | Search Console | 90% submitted |
| Avg position (top queries) | Search Console | ≤ 5 |
| Page speed score | Lighthouse | ≥ 90 |
| Click-through rate | GSC | ≥ 5% |
| Bounce rate | GA4 | ≤ 45% |

Həftəlik report: GSC + Ahrefs + GA4 birləşmə dashboard.
