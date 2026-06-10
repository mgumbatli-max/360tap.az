# 09 — UI/UX Flow

## Əsas axınların xəritəsi

```
                    ┌───────────────┐
                    │     Qonaq     │
                    │ (anonymous)   │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
       gözdən keçir      axtarır        elan görür
            │               │               │
            └───────────────┴───────────────┘
                            │
                  istifadəçi tələbi (CTA)
                            │
        ┌─────────┬─────────┼─────────┬───────────┐
        │         │         │         │           │
   Qeydiyyat   Giriş    Mesaj yaz   Sevimli   Elan yerləşdir
        │         │         │         │           │
        └─────────┴────►Auth required◄┴───────────┘
                            │
                ┌───────────┴───────────┐
                │   Qeydiyyatlı user    │
                └───────────────────────┘
```

## Axın 1 — Qeydiyyat və ilk istifadə

```
[Ana səhifə]
   ↓ "Qeydiyyat" düyməsi
[/qeydiyyat]
   ├─→ Email + parol → POST /auth/register
   │     ↓
   │  [Email təsdiq linki göndərildi] (toast)
   │
   └─→ Telefon + OTP
         ↓
      [Telefon nömrəsi yaz] → POST /auth/send-otp
         ↓
      [6 hücrəli OTP input]  → POST /auth/verify-otp
         ↓
      JWT alındı, localStorage + cookie
         ↓
      [Onboarding ekranı (opsional)]
         ↓ "İlk elanını yarat" CTA
      [/elan-yerlesdir]
```

**Auth tələbi olan əməliyyatda:**
- Modal "Daxil olmalısan" (form içində)
- ya da `redirect=back-url` parametri ilə /giris
- successdən sonra avtomatik geri qayıdış

## Axın 2 — Elan yerləşdirmə (8-addımlı wizard)

```
Step 1: Kateqoriya
  ┌──────────────────────────────────┐
  │ Pop kateqoriyalar (Telefon...)  │  
  │ vəya Bütün kateqoriyalar görmək  │
  │ → Seçdikdə alt-kateqoriya açılır │
  │ → Final növ (3-cü səviyyə)       │
  └──────────────────────────────────┘
                ↓
Step 2: Əsas məlumat
  ┌──────────────────────────────────┐
  │ Başlıq (10-70 simvol, AI təklif) │
  │ Təsvir (50-5000)                 │
  │ Kateqoriyaya görə dinamik        │
  │   atributlar (marka, model...)   │
  └──────────────────────────────────┘
                ↓
Step 3: Qiymət
  ┌──────────────────────────────────┐
  │ Qiymət növü: Sabit/Müzakirə/Pul  │
  │ Məbləğ + valyuta                 │
  │ Kredit/Barter checkbox           │
  │ AI: "Orta bazar qiyməti: 300 ₼"  │
  └──────────────────────────────────┘
                ↓
Step 4: Şəkillər
  ┌──────────────────────────────────┐
  │ Drag & drop sahə                 │
  │ Kameradan birbaşa (mobil)        │
  │ Min 1, Max 20                    │
  │ Sürükləyərək sıralama            │
  │ Auto-compress (web worker)       │
  └──────────────────────────────────┘
                ↓
Step 5: Məkan
  ┌──────────────────────────────────┐
  │ Şəhər (geoip default)            │
  │ Rayon dropdown                   │
  │ Xəritə pin (opsional)            │
  └──────────────────────────────────┘
                ↓
Step 6: Əlaqə
  ┌──────────────────────────────────┐
  │ Telefon (təsdiqlənmiş)           │
  │ "WhatsApp ilə yazıla bilər"      │
  │ "Saytdaxili chat aç"             │
  └──────────────────────────────────┘
                ↓
Step 7: Ödənişli xidmət (opsional)
  ┌──────────────────────────────────┐
  │ Pulsuz (default)                 │
  │ Yuxarı qaldır - 1₼               │
  │ VIP 7 gün - 5₼                   │
  │ Premium 7 gün - 12₼              │
  └──────────────────────────────────┘
                ↓
Step 8: Ön baxış + təsdiq
  ┌──────────────────────────────────┐
  │ Real elan görünüşü               │
  │ "Düzəlt" / "Dərc et" düymələri   │
  └──────────────────────────────────┘
                ↓
[Uğur ekranı]
  ┌──────────────────────────────────┐
  │ ✓ Elan moderasiyaya göndərildi   │
  │ "Elanını paylaş" + sosial        │
  │ "Statistika gör"                 │
  └──────────────────────────────────┘
```

**Persistent state:** Zustand + localStorage. Əgər wizard ortasından çıxıbsa, qayıdanda davam etdirir.

## Axın 3 — Axtarış və alış

```
[Ana səhifə]
   ↓ Axtarış paneli + "iphone 15"
[/elanlar?q=iphone+15]
   │
   ├─ Sol: Filter sidebar
   │     ├─ Kateqoriya
   │     ├─ Qiymət range
   │     ├─ Şəhər (radius)
   │     ├─ Yeni/işlənmiş
   │     ├─ Marka, yaddaş (telefon-spesifik)
   │     └─ Çatdırılma var
   │
   ├─ Üst: Sort + view (grid/list/xəritə)
   │
   └─ Mərkəz: Kart ızgarası (premium yuxarıda)
        ↓ Karta tap
[/elanlar/[id]-iphone-15-pro-max-256gb]
   │
   ├─ Şəkil qalereyası (swipe, zoom)
   ├─ Başlıq + qiymət
   ├─ Atributlar cədvəli
   ├─ Təsvir
   ├─ Xəritə
   ├─ Satıcı kartı (reyting)
   ├─ Oxşar elanlar
   │
   └─ CTA-lar:
        ├─ "Nömrəni göstər" → telefon görünür (klik tracking)
        ├─ "Yaz" → /kabinet/mesajlar/[chatId]
        ├─ "WhatsApp" → wa.me link
        ├─ "Sevimli" → toggle (login lazımdır)
        ├─ "Şikayət et" → modal
        └─ "Paylaş" → native share / link copy
```

## Axın 4 — Mesajlaşma

```
[Elan səhifəsi] → "Yaz" düyməsi
  ↓
  Auth yoxlanır → əgər guest, modal "Daxil ol"
  ↓
  POST /chats { listing_id, initial_message }
  ↓
[/kabinet/mesajlar/[chatId]]
  ┌────────────────────────────────────────┐
  │ ← Geri    Satıcı: Anar Ə.    ⋮ Menyu  │
  │ ─────────────────────────────────────  │
  │ Elan: iPhone 15 - 1500₼                │
  │ ─────────────────────────────────────  │
  │                                        │
  │   "Sabah saat 5-də ola bilərmi?"  →   │
  │   ────────                             │
  │  ←  "Bəli, ünvanı göndərirəm"         │
  │     [Şəkil: ünvan kartı]               │
  │                                        │
  │ ─────────────────────────────────────  │
  │ [📎] [Mətn yaz...]            [Göndər] │
  └────────────────────────────────────────┘
```

**Real-time hadisələr:**
- `message:new` → bubble əlavə olunur
- `typing:start` → "yazır..." göstər
- `message:read` → ✓✓ blue
- `presence` → online dot

## Axın 5 — Mağaza profili (Faza 2)

```
[Mağaza axtarışı / Elan səhifəsindən "Mağazaya keç"]
   ↓
[/magaza/electrocity-baki]
  ┌────────────────────────────────────────┐
  │ [Cover banner]                         │
  │ ┌─[Logo]─ ElectroCity Bakı  ⭐ 4.8     │
  │           "Premium texnika"      [İzlə]│
  │ ─────────────────────────────────────  │
  │ Tabs: Elanlar / Haqqında / Rəylər      │
  │ ─────────────────────────────────────  │
  │ [Elan grid]                            │
  └────────────────────────────────────────┘
```

## Axın 6 — Premium / VIP alma

```
[/kabinet/elanlarim/[id]]
   ↓ "Yuxarı qaldır" düyməsi
[Modal: Paket seçimi]
  ┌─ Yuxarı qaldır - 1 ₼   [Seç]
  │   "Bir dəfə üst sıraya çıxar"
  │
  ├─ VIP 7 gün - 5 ₼      [Seç]
  │   "Vitrində VIP rozetlə"
  │
  └─ Premium 7 gün - 12 ₼  [Seç]
      "Kateqoriyada üst sıralarda"
   ↓
[Ödəniş səhifəsi]
   ├─ Balansdan (kifayətdirsə)
   └─ Kart ilə → Pulpal redirect
   ↓
[Pulpal səhifəsi → kart məlumatı]
   ↓
[Webhook /payments/webhook/pulpal]
   ↓
[Geri /kabinet/elanlarim/[id]?promotion=success]
   ├─ Toast: "VIP aktivləşdi → 7 gün"
   └─ Elan rozeti yenilənir
```

## Axın 7 — Moderasiya (admin)

```
[/admin/listings/moderasiya]
  ┌────────────────────────────────────────┐
  │ Filter: prioritet, AI flag, kateqoriya │
  │ ─────────────────────────────────────  │
  │ [Task kart]:                           │
  │ ┌─[Şəkillər]─ "iPhone 15 Pro 256GB"   │
  │ │            Qiymət: 1500₼ (median 1200)│
  │ │            Satıcı: Yeni (0 elan)     │
  │ │            🚩 AI: Dublikat ehtimalı    │
  │ │                                       │
  │ │ [Təsdiq] [Rədd ▼] [Geri qaytar]      │
  │ └──────────────────────────────────────│
  │ [next 24 task]                         │
  └────────────────────────────────────────┘
       ↓ "Rədd ▼" dropdown:
         ├─ Saxta məhsul
         ├─ Qiymət uyğun deyil
         ├─ Dublikat
         ├─ Qadağan kateqoriya
         └─ Digər (mətn yaz)
       ↓
       [Confirm dialog]
       ↓
       PATCH /admin/listings/:id/reject
       ↓
       Toast + növbəti task
       ↓
       Email satıcıya: "Elan rədd edildi, səbəb: ..."
```

## Mobil-spesifik axınlar

### Bottom navigation (5 tab)
```
┌──────────────────────────┐
│  🏠     🔍    ➕    💬    👤 │
│ Ana   Axtar  Yerlş  Chat  Profil│
└──────────────────────────┘
```
- Mərkəzdəki "+" düyməsi qabarıq (FAB)
- Auth lazım olduqda swipe-up modal "Daxil ol"

### PWA install prompt
- 3 sessiya sonra göstərilir
- "Ana ekrana əlavə et" toast
- iOS üçün manual təlimat ekranı

## Boş və xəta vəziyyətləri

| Hal | UI |
|---|---|
| Heç bir elan yoxdur | İllüstrasiya + "İlk elanı sən ver" CTA |
| Axtarış nəticəsi yoxdur | "Filtri dəyişdir" + populyar tövsiyələr |
| İnternet yoxdur (PWA) | Cache-dən sevimlilər + "yenidən cəhd" |
| 401 token expired | Auto-refresh, alınmasa /giris-ə redirect |
| 500 server error | "Nəsə pozuldu" + retry + Sentry log |
| Şəkil yüklənmədi | Placeholder + retry düyməsi |

## A11y checklist

- Bütün interaktiv elementlər keyboard nav-able (Tab/Shift+Tab/Enter/Esc)
- ARIA labels bütün ikonik düymələrdə
- Focus ring görünür
- Kontrast WCAG AA
- Alt text bütün şəkillərdə
- Skip-to-content linki
- Reduced motion media query dəstəklənir
