# 10 — Panellər: Admin / Mağaza / İstifadəçi / Public

> Hər panel üçün ayrı requirements. Rollar: `user`, `pro`, `business`, `moderator`, `admin`, `super_admin`.

---

## 1. Public sayt (qonaq + istifadəçi)

| Bölmə | Tələblər |
|-------|----------|
| Ana səhifə | Region-aware hero, region blokları, kateqoriya grid, "sənin regionunda yeni elanlar", "yaxın mağazalar", "real stokda məhsullar", ERP mağazalar |
| Kateqoriya/listing | Region+kateqoriya filter, dynamic filterlər, sort, infinite scroll, vertical kartlar |
| Detail | Qalereya, satıcı kartı, əlaqə (zəng/WhatsApp/mesaj), oxşar+yaxın region, AZ field adları |
| Mağaza profili | `/store/<slug>` — bax PRD 5.3 |
| Axtarış | Meilisearch, region-first, autocomplete |
| Auth | Vahid login/register, OTP (P1) |

---

## 2. İstifadəçi paneli (`/profil`)

Mövcud marşrutlar saxlanır/sadələşdirilir:

| Bölmə | Tələb |
|-------|-------|
| Elanlarım | aktiv/gözləyən/arxiv, redaktə, boost/promote, statistika (`/elanlarim/[id]/stats`) |
| Mesajlar | chat (Faza-2) |
| Sevimlilər | favoritlər |
| Saxlanmış axtarışlar | saved search + bildiriş aç/bağla |
| Bildirişlər | in-app siyahı |
| Baxılanlar | son baxılan elanlar |
| Balans | promote/paket ödənişləri (Faza-2) |
| Reylər | aldığı/verdiyi rəylər (Faza-2) |
| Ayarlar | profil, telefon/WhatsApp/Instagram, parol, dil |

---

## 3. Mağaza paneli (`/biznes`) — business rol

| Bölmə | Tələb | Faza |
|-------|-------|------|
| Dashboard | aktiv elan, baxış, əlaqə statistikası | P1 |
| Mağaza profili | logo, cover, ad, ünvan, saatlar, sosial, çatdırılma/zəmanət şərtləri | P0 |
| Filiallar | StoreBranch CRUD (region/GPS) | P1 |
| Elanlar | mağaza elanları, toplu redaktə | P1 |
| Toplu elan | Excel/CSV import (Faza-3), toplu forma | P2 |
| Endirimlər | old_price kampaniyaları | P1 |
| **ERP** | bağlantı statusu, son sync, xətalar, məhsul siyahısı | P1 |
| Statistika | elan üzrə baxış/klik/favorit | P1 |
| Paket | aktiv abunə, yüksəltmə | P1 |

---

## 4. Admin paneli (`/admin`) — admin/moderator

Brief bölmə 14 tam:

| Modul | Funksiya |
|-------|----------|
| **Dashboard** | əsas metrikalar (elan, istifadəçi, ERP, gəlir) |
| **Elanlar** | siyahı, axtarış, redaktə, status dəyiş |
| **Moderasiya** | təsdiq növbəsi (approve/reject + səbəb), dublikat/spam siqnalları |
| **İstifadəçilər** | siyahı, ban/suspend, rol |
| **Mağazalar** | verify, status |
| **ERP mağazaları** | inteqrasiyalar, sync logları, manual re-sync, xəta monitorinqi |
| **Kateqoriyalar** | CRUD, ağac, SEO |
| **Dynamic attributes / Filter builder** | bax `09` |
| **Regionlar / Şəhərlər / Yaxın rayon mapping** | CRUD, nearby override |
| **Şikayətlər** | report axını, həll |
| **Ödənişlər / Paketlər / Promosiyalar** | monetizasiya idarəsi |
| **Banner reklamlar** | placement, region, müddət |
| **SEO səhifələri** | region/kateqoriya landing mətnləri |
| **Search logs / Tapılmayan axtarışlar** | sinonim/kontent boşluğu |
| **ERP sync logs / Import jobs** | monitorinq |
| **Audit logs** | bütün dəyişikliklər |
| **Spam / Qara siyahı** | telefon/söz/şəkil filterləri |
| **Bildirişlər** | sistem bildirişləri göndər |

### Moderasiya qaydaları (brief 15)
- Yeni elan → təsdiqə düşə bilər (konfiqurasiya).
- Təsdiqlənmiş mağaza → avtomatik yayım.
- **ERP mağaza → yüksək etibar** (avtomatik).
- Dublikat aşkar (başlıq+şəkil hash), eyni şəkil xəbərdarlığı, saxta qiymət siqnalı, şübhəli söz filteri, telefon spam yoxlama.
- Bütün admin əməliyyatları **audit log**-da.

---

## 5. Rol → icazə matrisi (xülasə)

| Əməliyyat | user | pro | business | moderator | admin |
|-----------|:----:|:---:|:--------:|:---------:|:-----:|
| Elan yerləşdir | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mağaza yarat | – | – | ✓ | – | ✓ |
| ERP bağla | – | – | ✓ | – | ✓ |
| Moderasiya | – | – | – | ✓ | ✓ |
| Kateqoriya/attribute | – | – | – | – | ✓ |
| İstifadəçi ban | – | – | – | ✓ | ✓ |
| Monetizasiya idarə | – | – | – | – | ✓ |
