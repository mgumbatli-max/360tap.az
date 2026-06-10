# 03 — Səhifələrin tam siyahısı

## Konvensiyalar
- Url-lər mobile-first və SEO dostudur (lokal lüğətdə Azərbaycan dilində).
- Hər səhifə üçün: SSR/SSG/CSR strategiyası, auth tələbi, render rejimi qeyd olunur.

## A. PUBLIC (qonaq giriş ola bilər)

| URL | Səhifə | Render | Auth | Notlar |
|---|---|---|---|---|
| `/` | Ana səhifə | ISR (60s) | yox | hero, kateqoriyalar, premium, son elanlar |
| `/elanlar` | Bütün elanlar + filtr | SSR | yox | URL əsaslı filtr, paginate cursor |
| `/elanlar/[id]-[slug]` | Elan detal | SSR (cache 30s) | yox | OG image, JSON-LD |
| `/k/[category]` | Kateqoriya | SSR | yox | `/k/avtomobiller` |
| `/k/[category]/[sub]` | Alt-kateqoriya | SSR | yox | `/k/avtomobiller/bmw` |
| `/k/[category]/[sub]/[type]` | 3-cü səviyyə | SSR | yox | `/k/dasinmaz-emlak/menziller/satilir` |
| `/seher/[city]` | Şəhər | SSR | yox | `/seher/baki` |
| `/seher/[city]/[category]` | Şəhər + kateqoriya | SSR | yox | `/seher/baki/avtomobiller` SEO landing |
| `/magaza/[slug]` | Mağaza profili | SSR | yox | banner, elan ızgarası |
| `/magaza/[slug]/elanlar` | Mağaza elanları | SSR | yox | filtr |
| `/magaza/[slug]/reyler` | Mağaza rəyləri | SSR | yox | |
| `/istifadeci/[id]` | Satıcı profili | SSR | yox | |
| `/axtaris` | Search nəticələri | CSR + SSR shell | yox | URL-də query |
| `/blog` | Blog index | SSG | yox | |
| `/blog/[slug]` | Blog məqaləsi | SSG | yox | |
| `/about` | Haqqımızda | SSG | yox | |
| `/qaydalar` | İstifadə qaydaları | SSG | yox | |
| `/mexfilik` | Məxfilik siyasəti | SSG | yox | |
| `/komek` | Yardım mərkəzi | SSG | yox | |
| `/komek/[topic]` | Yardım mövzusu | SSG | yox | FAQ |
| `/elaqe` | Bizimlə əlaqə | SSG | yox | |
| `/sitemap.xml` | Sitemap | dynamic | yox | parçalanmış |
| `/robots.txt` | Robots | static | yox | |
| `/manifest.webmanifest` | PWA manifest | static | yox | |

## B. AUTH (qeydiyyat olmayan)

| URL | Səhifə | Render | Auth |
|---|---|---|---|
| `/giris` | Giriş | CSR | guest only |
| `/qeydiyyat` | Qeydiyyat | CSR | guest only |
| `/qeydiyyat/telefonu-tesdiqle` | OTP | CSR | partial |
| `/sifre-unutdum` | Parol bərpa istəyi | CSR | guest only |
| `/sifre-yenile` | Yeni parol | CSR | reset token |
| `/auth/callback/[provider]` | OAuth callback | server | — |

## C. İSTİFADƏÇİ KABİNETİ (auth tələbli)

| URL | Səhifə |
|---|---|
| `/kabinet` | Dashboard ümumi |
| `/kabinet/elanlarim` | Bütün elanlarım (status filtri) |
| `/kabinet/elanlarim/aktiv` | Aktiv elanlar |
| `/kabinet/elanlarim/moderasiya` | Moderasiyada |
| `/kabinet/elanlarim/satildi` | Satılan elanlar |
| `/kabinet/elanlarim/arxiv` | Arxiv |
| `/kabinet/elanlarim/[id]/redakte` | Elan redaktə |
| `/kabinet/elanlarim/[id]/statistika` | Elan statistikası |
| `/kabinet/elanlarim/[id]/promote` | VIP/Premium al |
| `/kabinet/secilmisler` | Seçilmiş elanlar |
| `/kabinet/saxlanmis-axtaris` | Saxlanılan axtarışlar |
| `/kabinet/mesajlar` | Chat siyahısı |
| `/kabinet/mesajlar/[chatId]` | Chat detalı |
| `/kabinet/bildirisler` | Bildirişlər |
| `/kabinet/odenisler` | Ödəniş tarixçəsi |
| `/kabinet/balans` | Balans + topup |
| `/kabinet/abuneliklerim` | Aktiv paketlər |
| `/kabinet/reyler` | Rəylər |
| `/kabinet/sikayetler` | Mənim şikayətlərim |
| `/kabinet/ayarlar` | Profil ayarları |
| `/kabinet/ayarlar/profil` | Ad, foto, şəhər |
| `/kabinet/ayarlar/telefon` | Telefon təsdiqi |
| `/kabinet/ayarlar/email` | Email təsdiqi |
| `/kabinet/ayarlar/sifre` | Parol dəyişdir |
| `/kabinet/ayarlar/2fa` | İki addımlı |
| `/kabinet/ayarlar/cihazlar` | Aktiv sessiyalar |
| `/kabinet/ayarlar/bildirisler` | Bildiriş tərcihləri |
| `/kabinet/ayarlar/dil` | Dil və valyuta |
| `/kabinet/ayarlar/silmek` | Hesabı sil |

## D. ELAN YERLƏŞDİRMƏ (8 addımlı)

| URL | Addım |
|---|---|
| `/elan-yerlesdir` | Başlanğıc / kateqoriya seçimi |
| `/elan-yerlesdir/melumat` | Başlıq + təsvir |
| `/elan-yerlesdir/qiymet` | Qiymət şərtləri |
| `/elan-yerlesdir/sekiller` | Şəkil + video |
| `/elan-yerlesdir/mekan` | Şəhər, xəritə |
| `/elan-yerlesdir/elaqe` | Telefon, chat |
| `/elan-yerlesdir/odenisli` | VIP/Boost seçim (opsional) |
| `/elan-yerlesdir/onbaxis` | Ön baxış + təsdiq |
| `/elan-yerlesdir/ugur/[id]` | Uğur səhifəsi |

> Eyni mövzu üçün **wizard layout** komponenti, addımlar arası **Zustand persist store**.

## E. MAĞAZA / BİZNES KABİNETİ (auth + role: pro/business)

| URL | Səhifə |
|---|---|
| `/magaza-kabineti` | Dashboard |
| `/magaza-kabineti/elanlar` | Elan idarəsi |
| `/magaza-kabineti/elanlar/toplu-yukleme` | CSV/Excel import |
| `/magaza-kabineti/elanlar/api-keys` | API açarları |
| `/magaza-kabineti/komanda` | Komanda üzvləri |
| `/magaza-kabineti/komanda/icazeler` | RBAC matrix |
| `/magaza-kabineti/profil` | Mağaza profili (logo, banner) |
| `/magaza-kabineti/statistika` | Analitika dashboardu |
| `/magaza-kabineti/leadlar` | Mesaj/zəng leadləri |
| `/magaza-kabineti/reklamlar` | Kampaniyalar |
| `/magaza-kabineti/reklamlar/yeni` | Yeni kampaniya |
| `/magaza-kabineti/reklamlar/[id]` | Kampaniya detalı |
| `/magaza-kabineti/abune` | Premium abunə |
| `/magaza-kabineti/fakturalar` | İnvoyslar |
| `/magaza-kabineti/inteqrasiyalar` | API, webhook |

## F. ADMİN PANEL (subdomain `admin.avito.az`)

| URL | Səhifə |
|---|---|
| `/admin` | Dashboard (KPI) |
| `/admin/istifadeciler` | İstifadəçilər |
| `/admin/istifadeciler/[id]` | Detal + əməliyyatlar |
| `/admin/elanlar` | Bütün elanlar |
| `/admin/elanlar/moderasiya` | Moderasiya növbəsi |
| `/admin/elanlar/[id]` | Elan detalı |
| `/admin/sikayetler` | Şikayət növbəsi |
| `/admin/sikayetler/[id]` | Şikayət detalı |
| `/admin/magazalar` | Mağazalar |
| `/admin/magazalar/[id]` | Mağaza detalı |
| `/admin/reklamlar` | Reklam kampaniyaları |
| `/admin/reklamlar/[id]` | Kampaniya detal |
| `/admin/bannerler` | Banner CMS |
| `/admin/bannerler/yeni` | Yeni banner |
| `/admin/odenisler` | Ödəniş hesabatı |
| `/admin/odenisler/[id]` | Ödəniş detalı |
| `/admin/abuneliklerm` | Abunəliklər |
| `/admin/kateqoriyalar` | Kateqoriya idarəsi |
| `/admin/kateqoriyalar/[id]/atributlar` | Atribut sxemi |
| `/admin/seherler` | Şəhər/rayon |
| `/admin/premium-xidmetler` | Premium kataloqu |
| `/admin/seo` | SEO səhifələri |
| `/admin/seo/[path]` | SEO səhifə redaktə |
| `/admin/blog` | Blog idarəsi |
| `/admin/blog/yeni` | Yeni post |
| `/admin/blog/[id]/redakte` | Post redaktə |
| `/admin/bildirisler` | Sistem bildirişi göndər |
| `/admin/audit-log` | Audit log axtarış |
| `/admin/statistika` | Ümumi statistika |
| `/admin/statistika/gelir` | Gəlir hesabatları |
| `/admin/statistika/elan` | Elan statistikası |
| `/admin/statistika/istifadeci` | İstifadəçi statistikası |
| `/admin/parametrler` | Sistem ayarları |
| `/admin/icazeler` | Rol və icazə matrisi |
| `/admin/komanda` | Admin komandası |

## G. SİSTEM SƏHİFƏLƏRİ

| URL | Səhifə |
|---|---|
| `/404` | Tapılmadı |
| `/500` | Server xətası |
| `/offline` | PWA offline |
| `/maintenance` | Texniki iş |

## Cəmi: ~95+ səhifə
