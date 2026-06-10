# 11 — Monetizasiya

> Modellər: promosiya (elan səviyyəsi), abunə (paket), reklam (banner), ERP/biznes paketləri.

---

## 1. Gəlir mənbələri (brief 16)

| Mənbə | Təsvir |
|-------|--------|
| Premium / VIP elan | elan önə çıxma (rəng, sıralama) |
| Boost (yuxarı qaldır) | elanı siyahıda yenilə |
| Ana səhifədə göstər | home placement |
| Kateqoriyada göstər | category placement |
| Region üzrə reklam | region-targeted |
| Banner reklam | home/category/region/listing placement |
| Mağaza premium paketi | genişləndirilmiş mağaza profili |
| Avtosalon / Əmlak agentliyi / İşəgötürən paketləri | vertical-spesifik |
| ERP müştəri paketi | ERP sync + toplu elan |
| API / import paketi | feed/API çıxış |

---

## 2. Abunə pillələri (paketlər)

| Paket | Elan limiti | Mağaza | Statistika | ERP sync | Promote | Prioritet |
|-------|-------------|--------|------------|----------|---------|-----------|
| **Free** | məhdud | – | – | – | ödənişli | – |
| **Standard** | çox | sadə səhifə | sadə | – | ödənişli | – |
| **Business** | böyük | premium profil | geniş | ✓ toplu | endirimli | – |
| **Premium** | maksimum | premium + | tam | ✓ | regionda önə + banner endirimi | prioritet moderasiya + API + reklam alətləri |

`Package.limits` JSONB: `{ maxActiveListings, hasStore, stats, erpSync, bulkUpload, apiAccess, ... }`.

---

## 3. Model axını

```
İstifadəçi paket seçir → POST /billing/subscribe → Payment(pending)
  → ödəniş provayder (MVP: manual/stub; sonra real gateway)
  → webhook /billing/webhook → Payment(paid) → Subscription(active)

Elan promote → POST /listings/:id/promote → Payment → Promotion(type, endsAt)
  → Listing.isVip/isPremium/promotedUntil set
```

- **MVP:** ödəniş **manual/stub** (admin təsdiq və ya test). Real gateway (məs. yerli provayder) Faza-2/3.
- Promosiya müddəti bitəndə (BullMQ cron) `Promotion` deaktiv, Listing flagləri sıfırlanır.

---

## 4. Sıralama məntiqi (listing)

Sıralama ağırlığı: `isPremium > isVip > promotedUntil(aktiv) > şəkilli > region-uyğun > təzəlik`. Şəkilsiz elanlar aşağı.

---

## 5. Reklam (banner)

- `Banner` modeli: placement (home/category/region/listing), regionId (region-targeted), müddət.
- Admin idarə (MVP); self-serve reklam kabineti Faza-3.

---

## 6. Metrikalar

- ARPU (biznes/mağaza), promote konversiyası, paket churn, banner CTR, ERP paket gəliri.
