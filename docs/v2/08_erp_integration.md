# 08 — ERP İnteqrasiyası (360biznes.az ↔ 360tap.az)

> Kontrakt **sıfırdan** dizayn olunur (ERP-də hələ açıq API yoxdur). Versiyalı (`/erp/v1`), idempotent, təhlükəsiz.

> **✅ İcra statusu (2026-06-10, Faza 1 Slice A):** Gateway quruldu və review ilə möhkəmləndirildi — `src/modules/erp`.
> Provisioning (`POST /me/store/erp/enable`) + publish/stock/price/delete. **ErpAuthGuard**: kanonik HMAC imza (`ts\nnonce\nMETHOD\npath\nsha256(body)`) + ±5dəq pəncərə + Redis nonce (replay bağlı). Idempotent (external_id+lastHash), Serializable transaction, təsdiqlənməmiş mağaza→review, stok 0→out_of_stock, side-channel sync reconcile. Smoke 12/12 yaşıl.
> **Qalan (Faza 1.5):** BullMQ async upsert + retry, S3 şəkil mirror, geri analytics (`GET stats`), ERP→marketplace kateqoriya mapping cədvəli, admin ERP monitorinq paneli.

---

## 1. Konsepsiya

ERP istifadəçisi (mağaza sahibi) ERP-də məhsul kartında **"360tap.az-da yayımla"** düyməsinə basır → məhsul real stok/qiymət/şəkil/filial ilə marketplace-də görünür. ERP-də dəyişiklik → marketplace avtomatik sinxron.

```
360biznes ERP                        360tap.az
─────────────                        ─────────
[Məhsul kartı]                       ErpIntegration (store başına)
  "360tap.az-da yayımla" ──POST──►   /erp/v1/products/publish
                                       → ErpProductLink (external_id)
                                       → Listing yarat/yenilə (source=erp)
  qiymət dəyişdi      ──PATCH──►      /erp/v1/products/:ext/price
  stok dəyişdi        ──PATCH──►      /erp/v1/products/:ext/stock
  məhsul silindi      ──DELETE─►      /erp/v1/products/:ext  → arxiv
  (geri) analytics    ◄──GET────      /erp/v1/products/:ext/stats
```

---

## 2. Autentifikasiya və təhlükəsizlik

- Hər ERP mağazası üçün **API key** (`ErpIntegration.apiKeyHash`) + **webhook secret** (HMAC).
- Sorğu başlıqları:
  - `X-Erp-Tenant: <erpTenantId>`
  - `Authorization: Bearer <api_key>`
  - `X-Signature: hmac_sha256(body, webhook_secret)` (payload bütövlüyü)
  - `Idempotency-Key: <uuid>` (təkrar emalın qarşısı)
- Rate limit + IP allowlist (opsional).
- ERP tenant yalnız öz mağazasının məhsullarını idarə edə bilər.

---

## 3. Kontrakt (payload sxem)

### 3.1 Publish (`POST /erp/v1/products/publish`)

```jsonc
{
  "external_id": "ERP-PROD-10293",      // ERP-də məhsul ID (unikal, idempotency açarı)
  "title": "iPhone 15 Pro 256GB",
  "category": "telefonlar",              // slug və ya mapping
  "subcategory": "apple",
  "brand": "Apple",
  "model": "iPhone 15 Pro",
  "price": 2899.00,
  "old_price": 3099.00,                  // endirim (opsional)
  "currency": "AZN",
  "stock_qty": 7,
  "images": ["https://erp.cdn/.../1.jpg", "..."],
  "description": "Original, zəmanətli...",
  "attributes": { "memory": "256GB", "color": "Titanium" },
  "warranty_months": 12,
  "store": { "branch": "Qəbələ filialı", "address": "Qəbələ ş., ...", "region": "qebele",
             "lat": 40.98, "lng": 47.84 },
  "delivery": true,
  "credit": true,
  "payment": ["cash", "card"],
  "whatsapp": "+994...",
  "seller_type": "erp_store",
  "active": true
}
```

**Cavab:**
```jsonc
{ "data": { "listing_id": "uuid", "url": "https://360tap.az/qebele/iphone-15-pro-...",
            "status": "active", "external_id": "ERP-PROD-10293" } }
```

### 3.2 Sync (toplu) (`POST /erp/v1/products/sync`)
`{ "products": [ {publish payload}, ... ] }` → BullMQ job, hər biri upsert.

### 3.3 Stok (`PATCH /erp/v1/products/:external_id/stock`)
`{ "stock_qty": 0 }` → stok=0 olduqda **Listing.status=out_of_stock** (və ya `inStock=false`).

### 3.4 Qiymət (`PATCH .../price`)
`{ "price": 2799, "old_price": 2899 }`.

### 3.5 Sil (`DELETE .../:external_id`)
Listing → `archived` (silinmir, link saxlanır).

### 3.6 Stats (geri analytics) (`GET .../:external_id/stats`)
```jsonc
{ "data": { "views": 1240, "whatsapp_clicks": 88, "call_clicks": 31,
            "favorites": 54, "period": "30d" } }
```

---

## 4. Sinxronizasiya qaydaları (brief 7)

| ERP hadisəsi | Marketplace nəticəsi |
|--------------|----------------------|
| Qiymət dəyişdi | Listing.price yenilənir |
| Stok dəyişdi | Listing.stockQty/inStock yenilənir |
| Stok = 0 | Listing → `out_of_stock` (və ya deaktiv) |
| Şəkil dəyişdi | ListingImage yenilənir |
| Məhsul silindi | Listing → `archived` |
| Filial dəyişdi | district/address/region yenilənir |
| Məhsul satıldı | stockQty azalır (sync ilə) |

### Dəyişiklik aşkarı (idempotency)
- Hər upsert-də payload-un hash-i (`ErpProductLink.lastHash`) saxlanır. Eyni hash → **no-op** (boş yazı qarşısı).
- `Idempotency-Key` ilə təkrar sorğular eyni nəticə qaytarır.

---

## 5. Emal axını (NestJS + BullMQ)

```
POST /erp/v1/products/publish
  → ERP modul: auth (key+HMAC) + validate DTO
  → ErpProductLink upsert (external_id)
  → BullMQ job "erp.upsert-listing"
       → kateqoriya/region mapping (slug resolve, region resolve via lat/lng → /geo/resolve)
       → Listing upsert (source=erp), şəkilləri S3-ə mirror (opsional)
       → ListingAttributeValue + JSONB doldur
       → Meilisearch index update
       → ErpSyncLog(ok)
  → xəta → ErpSyncLog(error) + mağazaya Notification(erp_sync_error) + retry (exponential backoff)
```

Geri analytics: gündəlik `ListingStatDaily` aqreqasiyası → ERP `GET stats` oxuyur (və ya push job).

---

## 6. Mapping problemləri (həll)

| Problem | Həll |
|---------|------|
| ERP kateqoriyası ≠ marketplace kateqoriyası | Admin paneldə **kateqoriya mapping** cədvəli (ERP kateqoriya → 360tap kateqoriya) |
| Region ERP-də string, marketplace-də District | `lat/lng` → `/geo/resolve` → district; fallback region slug |
| Şəkil ERP CDN-də | İlk versiyada ERP URL-i saxla; sonra S3-ə mirror (silinmə riskinə qarşı) |
| Atribut açarları fərqli | ERP `attributes` → CategoryAttribute `key` mapping (admin) |

---

## 7. ERP panel (mağaza tərəfi — brief 7)

ERP daxilində mağaza görür:
- 360tap.az-a göndərilmiş məhsullar (siyahı + status: aktiv/deaktiv/xəta).
- Sinxron xətaları (ErpSyncLog).
- Hər məhsul üçün: elan linki, baxış sayı, WhatsApp/zəng klikləri, favorit sayı.

Bu məlumatları ERP `GET /erp/v1/products/:ext/stats` + `GET /erp/v1/products` (siyahı) ilə alır.

---

## 8. Mağaza/admin tərəfi (360tap)

- Admin: **ERP mağazaları** modulu — inteqrasiyalar, sync logları, xəta monitorinqi, manual re-sync.
- Mağaza paneli: ERP bağlantı statusu, son sync vaxtı, xətalar.
- Listing kartında **"ERP ilə təsdiqlənmiş real stok"** badge (`source=erp && inStock`).

---

## 9. Versiyalama və geriyə uyğunluq

- Kontrakt `/erp/v1`. Dəyişiklik → `/erp/v2`, v1 dəstəklənir (deprecation pəncərəsi).
- DTO validation (class-validator) — naməlum sahələr rədd yox, log.
- Bütün ERP yazıları **audit log**-a düşür.

---

## 10. ERP komandası ilə razılaşma (açıq)

> Kontrakt bizim tərəfdən təyin olunur, amma ERP tərəfin reallaşdırması üçün razılaşma lazımdır:
1. `external_id` stabil və unikaldırmı?
2. Şəkil URL-ləri ictimai əlçatandırmı (mirror lazımdırmı)?
3. Region/filial ERP-də necə saxlanılır (GPS varmı)?
4. Geri analytics push (webhook) yoxsa pull (ERP cədvəldə soruşur)?
5. Kateqoriya/atribut lüğəti — ortaq mapping kim saxlayır.
