# 19 — Gəlir Modeli

## Gəlir mənbələri (xülasə)

| № | Mənbə | Tip | Hədəf payı (24 ay) |
|---|---|---|---|
| 1 | Pulsuz limitdən sonrakı elan | Pay-per-listing | 8% |
| 2 | Promotion (VIP/Boost/Top) | Pay-per-feature | 35% |
| 3 | Mağaza abunəlikləri | SaaS | 25% |
| 4 | Banner + sponsor reklam | Auction/CPM | 15% |
| 5 | Escrow komissiya (Faza 3) | %-of-GMV | 10% |
| 6 | Çatdırılma marjası (Faza 3) | %-of-shipping | 3% |
| 7 | API / White-label | B2B SaaS | 4% |

## 1. Pay-per-listing (limitdən sonra)

### Qaydalar
- Hər istifadəçi ay ərzində **3 pulsuz** elan dərc edə bilər (kateqoriyaya görə tənzimlənə bilər)
- Yüksək tələbli kateqoriyalar (Avto, Mənzil) — 1 pulsuz
- Pulsuz limit bitdikdə əlavə elan **1.5–3 ₼ / ədəd**

### Qiymət cədvəli (kateqoriyaya görə)

| Kateqoriya | Pulsuz/ay | Əlavə elan |
|---|---|---|
| Telefon, Geyim, Xırda | 3 | 1 ₼ |
| Avtomobil | 1 | 5 ₼ |
| Daşınmaz əmlak | 1 | 7 ₼ |
| İş elanı | 3 | 2 ₼ |
| Xidmət | 5 | 1.5 ₼ |
| Heyvan, Hobbi | 5 | 1 ₼ |

### Proqnoz (24-cü ay)
- 50K aktiv yerləşdirici
- Orta 5 elan/ay → 250K elan
- Pulsuzdan 3-üncü kvartil 2 əlavə → 100K ödənişli
- Orta qiymət 2 ₼ → **200 000 ₼ / ay**

## 2. Promotion paketləri (Premium xidmətlər)

### Paket kataloqu

| Kod | Ad | Müddət | Qiymət | Effekt |
|---|---|---|---|---|
| `boost` | Yuxarı qaldır | bir dəfəlik | 1 ₼ | bumped_at = now |
| `top_3d` | Top 3 gün | 3 gün | 3 ₼ | kateqoriyada üst |
| `top_7d` | Top 7 gün | 7 gün | 6 ₼ | kateqoriyada üst |
| `vip_7d` | VIP 7 gün | 7 gün | 5 ₼ | VIP rozeti + üst |
| `vip_14d` | VIP 14 gün | 14 gün | 9 ₼ | |
| `vip_30d` | VIP 30 gün | 30 gün | 17 ₼ | |
| `premium_7d` | Premium 7 gün | 7 gün | 12 ₼ | ana səhifədə + VIP |
| `premium_30d` | Premium 30 gün | 30 gün | 40 ₼ | |
| `highlight` | Rəngli kart | + müddət | +30% | sarı/qızılı fon |
| `urgent` | Təcili etiketi | + müddət | +50% | qırmızı badge |

### Bundle paketləri (endirim)

| Bundle | Qiymət | Tərkib | Endirim |
|---|---|---|---|
| Starter | 8 ₼ | 1 boost + 1 top_3d + 5 əlavə elan | -20% |
| Smart | 25 ₼ | VIP 14d + Highlight | -15% |
| Mega | 60 ₼ | Premium 30d + Urgent | -10% |

### Proqnoz
- 60K MAU, 12% promotion alır → 7 200 alıcı/ay
- Orta səbət 12 ₼ → **86 400 ₼ / ay** sadəcə Premium-dan

### A/B test ediləsi parametrlər
- Qiymət (5 ₼ vs 7 ₼ vs 9 ₼ üçün VIP 7d)
- Bundle təklifi check-out anında
- Xəbərdarlıq mesajları ("Elanınız 30 sıralanır → VIP ilə top 3-də olar")

## 3. Mağaza abunəlikləri (SaaS)

### Plan kataloqu

| Plan | Aylıq | İllik | Elan limiti | Komanda | API |
|---|---|---|---|---|---|
| **Free** | 0 | 0 | 5 / ay | 1 | yox |
| **Start** | 49 ₼ | 490 ₼ | 50 / ay | 2 | yox |
| **Business** | 99 ₼ | 990 ₼ | 200 / ay | 5 | məhdud |
| **Pro** | 249 ₼ | 2490 ₼ | limitsiz | 15 | tam |
| **Enterprise** | sazişlə | sazişlə | limitsiz | limitsiz | tam + dedicated |

### Plan üstünlükləri

| Funksiya | Free | Start | Business | Pro |
|---|---|---|---|---|
| Mağaza profili (logo, banner) | ✗ | ✓ | ✓ | ✓ |
| Komanda üzvləri | 1 | 2 | 5 | 15 |
| Toplu yükləmə | ✗ | ✗ | 5/ay | limitsiz |
| Excel import | ✗ | ✗ | ✓ | ✓ |
| API açar | ✗ | ✗ | məhdud | tam |
| Webhook | ✗ | ✗ | ✗ | ✓ |
| Sadə statistika | ✓ | ✓ | ✓ | ✓ |
| Ətraflı analitika | ✗ | ✗ | ✓ | ✓ |
| Lead tracker | ✗ | ✗ | ✓ | ✓ |
| Reklam endirimi | 0 | 5% | 10% | 20% |
| Premium görünmə | ✗ | ✗ | ✓ | ✓ |
| Verified badge | ✗ | ✓ | ✓ | ✓ |
| Prioritet dəstək | ✗ | ✗ | ✗ | ✓ |
| Özəl trener (onboard) | ✗ | ✗ | ✗ | ✓ |

### Proqnoz (24-cü ay)
- 1500 mağaza
- Paylanma: 50% Free, 30% Start, 15% Business, 5% Pro
- ARR: 1500 × (0.30×49 + 0.15×99 + 0.05×249) × 12 = ~735 000 ₼ / il
- Aylıq: ~**61 250 ₼**

## 4. Reklam (Banner + Sponsor)

### Reklam yerləri (placement)

| Yer | Format | CPM | CPC | Aylıq stok |
|---|---|---|---|---|
| Ana səhifə banner (yuxarı) | 1200×400 | 15 ₼ | 0.50 ₼ | 5M baxış |
| Ana səhifə banner (orta) | 1200×200 | 8 ₼ | 0.30 ₼ | 5M baxış |
| Kateqoriya banner | 970×250 | 10 ₼ | 0.40 ₼ | 30M baxış |
| Search results banner | 970×250 | 12 ₼ | 0.45 ₼ | 50M baxış |
| Sidebar (mobil yoxdur) | 300×600 | 5 ₼ | 0.20 ₼ | 20M baxış |
| Sponsor elan (search-də) | native | 6 ₼ | 0.25 ₼ | 100M baxış |

### Auction (Faza 2)
GSP (Generalized Second-Price):
```
Hər slot üçün:
  qalib = max(bid × predicted_CTR × quality_score)
  ödənilən = ikinci ən yüksək bid + 0.01 ₼
```

### Proqnoz
- Search nəticəsi: 50M baxış × 12 ₼ CPM = 600 000 ₼
- Lakin fill rate 30% → 180 000 ₼ effektiv
- Ana səhifə + kateqoriya: 100 000 ₼
- **Cəmi: ~280 000 ₼ / ay** (24-cü ay)

### Ad-block uyğunluğu
- Native ads (sponsor elan kart kimi)
- Server-side rendered (block edilməsi çətin)

## 5. Escrow komissiya (Faza 3)

### Model
- Alıcı ödəyir → platforma saxlayır → satıcıya ötürür
- Komissiya: **3-5%** məbləğdən
- Minimum: 1 ₼

### Komissiya pillər
| Məbləğ | Komissiya |
|---|---|
| 0 - 100 ₼ | 5% (min 1 ₼) |
| 100 - 1000 ₼ | 4% |
| 1000 - 10000 ₼ | 3% |
| 10000+ ₼ | 2.5% (sazişlə) |

### Proqnoz (24-cü ay, escrow Faza 3-də gec başladığı üçün ehtiyatlı)
- 5% trafikdən escrow istifadə edir
- 50 000 əqd × 100 ₼ ortalama = 5M ₼ GMV
- 3.5% komissiya → **175 000 ₼ / ay**

## 6. Çatdırılma marjası (Faza 3)

### Model
- Logistika provayderindən endirim alırıq (toplu nisbət)
- İstifadəçidən tam qiymət alırıq
- Fərq → bizim mənfəət (5-10%)

### Misal
- Bravo Express qiymət: 4 ₼ (B2B endirim)
- İstifadəçidən: 4.50 ₼
- Marja: 0.50 ₼ (12.5%)

### Proqnoz
- 30 000 çatdırılma / ay × 0.50 ₼ marja = **15 000 ₼ / ay**

## 7. API / White-label (B2B)

### Public API
- Free: 1000 sorğu/gün
- Pro plan: limitsiz (paket daxilində)
- Enterprise: custom rate-limit

### White-label (Faza 4)
- Bütün platforma üçün branded versiya
- Ay başına: 5000-15000 ₼ (sazişlə)
- Setup fee: 50 000 ₼

### Proqnoz
- 5 white-label müştəri × 8 000 ₼ = **40 000 ₼ / ay**
- API çağırışı sürətli ödəniş: minimal

## Ümumi gəlir proqnozu (24-cü ay)

| Mənbə | Aylıq | %-i |
|---|---|---|
| Pay-per-listing | 200 000 | 28% |
| Promotion | 86 000 | 12% |
| Subscription | 61 000 | 8% |
| Reklam | 280 000 | 38% |
| Escrow (Faza 3) | 50 000 | 7% (gec başladı) |
| Çatdırılma | 15 000 | 2% |
| API/WL | 40 000 | 5% |
| **Cəmi** | **732 000 AZN** | 100% |

## Unit economics

### CAC (Customer Acquisition Cost)
- Hədəf: ≤ 12 ₼ / qeydiyyatlı istifadəçi
- Hədəf: ≤ 40 ₼ / paying customer

### LTV (Lifetime Value)
- Free user (12 ay): ~8 ₼
- Premium user: ~120 ₼
- Mağaza Business: ~1500 ₼
- Mağaza Pro: ~6500 ₼

### LTV/CAC oranı
- Free user: 0.7 (zərərlidir → freemium hunt)
- Paying user: 3.0+ (sağlam)
- Mağaza: 8.0+ (çox sağlam)

## Pricing strategiyası

### Penetration pricing (ilk 6 ay)
- Aqressiv aşağı qiymət (rəqibdən -30%)
- Tap.az daha çox təklif edirsə bizim VIP daha aşağı
- "First listing free" hər kateqoriya üçün

### Value pricing (6-12 ay)
- Bazara giriş bitir → qiymət bazar səviyyəsi
- A/B test optimal qiymət

### Premium pricing (12+ ay)
- USP məhsul → premium qiymət (Tap.az + 20-30%)
- Differentiation: AI, escrow, mobil UX

## Yardımçı gəlir kanalları (eksperimentlər)

### Lead generation B2B
- Avtomobil dilerlərinə kvalifikasiya olunmuş lead satışı
- 5-15 ₼ / lead

### Co-branded financing
- İpoteka brokerləri ilə partnership (referral fee)
- Avto kredit kalkulyator + bank inteqrasiya

### Membership programı
- "Marketplace Plus" — illik 99 ₼ (ad-free, prioritet dəstək, 10 boost)

### Affiliate
- Eksternal hyperlinks (məsələn təmir məsləhəti → ustabaşılar.az)
- 5-10% partner komissiya

## A/B test backlog (qiymət optimizasiyası)

1. VIP 7d: 5 ₼ vs 7 ₼ vs 9 ₼
2. Bundle: ayrıca vs paket təklifi
3. Free limit: 3 vs 5 elan/ay
4. Kategoriya pricing: differentiated vs flat
5. Subscription: monthly vs annual default

## Cohort analiz (kvartal)

```
Sprint sonu hər ay:
- Qeydiyyat ay: 100 user
- D7 active: 45
- D30 active: 28
- İlk ödəniş: 8 (8% paying conversion)
- 6-cı ay aktiv ödəyici: 5
- LTV (12 ay): cohort ortalaması
```

Cohort dashboard: Mixpanel / Posthog / öz ClickHouse query.
