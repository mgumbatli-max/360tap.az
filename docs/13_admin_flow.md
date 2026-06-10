# 13 — Admin Flow

## A. Admin login axını

```
[admin.platform.az] → Cloudflare WAF + IP allow-list (opsional)
        ↓
[/giris] login form
        ↓
POST /admin/auth/login { email, password }
        ↓
Backend yoxlayır:
  - role IN (moderator, senior_mod, support, ad_manager, finance, admin, super_admin)
  - status = 'active'
  - 2FA tələb olunur (admin və super_admin üçün məcburi)
        ↓
[2FA TOTP forması]
        ↓
POST /admin/auth/2fa/verify { code }
        ↓
JWT (admin scope, 8 saatlıq) + refresh
        ↓
[/admin/dashboard] → KPI tiles
```

### Sessiya təhlükəsizliyi
- IP-ə bağlı sessiya (dəyişərsə force re-login)
- Hər inactivity 30 dəq sonra logout
- Bütün admin əməliyyatları `admin_logs` cədvəlinə düşür

## B. Dashboard ana ekran

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] Admin Panel              🔍 axtar  🔔  👤 Anar Ə.    │
├──────────────────────────────────────────────────────────────┤
│ Sidebar           │  Main                                     │
│                   │                                           │
│ 📊 Dashboard      │  ┌────────────┬────────────┬───────────┐ │
│ 👥 İstifadəçilər  │  │  DAU       │  MAU       │  Yeni     │ │
│ 📝 Elanlar        │  │  12 458    │  187 320   │  + 1 245  │ │
│ ⚖  Moderasiya 24  │  └────────────┴────────────┴───────────┘ │
│ 🚩 Şikayətlər 8   │  ┌────────────┬────────────┬───────────┐ │
│ 🏪 Mağazalar      │  │ Aktiv elan │  Gəlir/gün │  Premium  │ │
│ 💳 Ödənişlər      │  │  87 230    │  2 480 ₼   │  342      │ │
│ 📺 Reklamlar      │  └────────────┴────────────┴───────────┘ │
│ 🎨 Bannerlər      │                                           │
│ 🏷  Kateqoriyalar │  📈 Gəlir trend (30 gün)                 │
│ 🌐 Şəhərlər       │  [chart]                                  │
│ 💎 Premium        │                                           │
│ 🔍 SEO            │  🥇 Top kateqoriyalar     ⚠ Risk siqnallar│
│ 📰 Blog           │  1. Telefon 18%           - 3 yeni saxta  │
│ 🔔 Bildirişlər    │  2. Avto    12%             qeydiyyat     │
│ 📋 Audit log      │  3. Mənzil  8%            - 5 təkrar elan│
│ ⚙  Parametrlər    │                                           │
│ 👤 Komanda        │                                           │
└──────────────────────────────────────────────────────────────┘
```

### Real-time KPI mənbəyi
- DAU/MAU → ClickHouse (event-driven)
- Aktiv elan → Postgres + cache (5 dəq)
- Gəlir → Postgres `payments` table cron (1 dəq)
- Risk siqnallar → AntiFraud module (event-driven)

## C. İstifadəçi idarəsi axını

```
[/admin/istifadeciler]
   ↓
DataTable (server-side):
  - Filter: rol, status, şəhər, qeydiyyat tarixi, risk skoru
  - Search: ad, email, telefon, ID
  - Sort: hər sütun
  - Bulk select → bulk suspend
  - Export CSV (admin-only)
   ↓ "Detal"
[/admin/istifadeciler/:id]
   ┌───────────────────────────────────────────┐
   │ [Avatar] Anar Ə.    🟢 Active    Risk: 12 │
   │ ─────────────────────────────────────────│
   │ Tabs:                                     │
   │ • Overview                                │
   │ • Listings (24)                           │
   │ • Messages [admin-only]                   │
   │ • Payments                                │
   │ • Reviews & Complaints                    │
   │ • Audit Log                               │
   │ • Devices/Sessions                        │
   │ ─────────────────────────────────────────│
   │ Action Bar:                               │
   │ [Suspend ▼] [Verify] [Credit] [Ban] [More]│
   └───────────────────────────────────────────┘
   ↓ "Suspend ▼"
[Modal]
   - Müddət: 24 saat / 7 gün / 30 gün / custom
   - Səbəb: dropdown (saxta elan, spam, təhqir, qadağan...)
   - Mesaj göndər: switch (defolt yandır)
   ↓ Confirm
   POST /admin/users/:id/suspend
   → admin_logs (before/after JSON)
   → notification (email + in-app) istifadəçiyə
   → status = 'suspended', suspended_until = ...
   → bütün aktiv elanlar pause status-ı alır
   ↓
   Toast: "İstifadəçi 7 gün suspend edildi"
```

### "Mesajları görmə" axını (yüksək həssas)

```
Senior moderator+ → User detail → Messages tab
   ↓ "Mesajları aç" düyməsi
[Modal — səbəb tələb olunur]
   - Şikayət # (optional)
   - Mətn səbəb (məcburi, min 50 simvol)
   ↓ Confirm
   - admin_logs-a "user.messages.viewed" yazılır
   - İstifadəçiyə bildiriş göndərilmir (təhqiqat üçün)
   - Read-only mod, copy söndürülür
   - Watermark: admin ID + tarix
```

## D. Elan moderasiya axını

```
[/admin/elanlar/moderasiya]
   ↓
Queue (priority-sorted):
   ┌─────────────────────────────────────────────┐
   │ Filter: AI flag, kateqoriya, risk, satıcı   │
   │ ─────────────────────────────────────────── │
   │ [Card 1] iPhone 15 Pro 1500₼               │
   │   🚩 AI flag: dublikat (87% confidence)     │
   │   👤 Yeni satıcı (0 əvvəlki elan)           │
   │   🖼  10 şəkil (1 NSFW flag)                │
   │   [Bax] [Təsdiq] [Rədd ▼] [Bloklamaq]      │
   │ ─────────────────────────────────────────── │
   │ [Card 2] BMW X5 2020 45000₼                │
   │   ✅ AI moderasiya keçdi                    │
   │   👤 Verified business                      │
   │   [Bax] [Təsdiq]                           │
   └─────────────────────────────────────────────┘
   ↓ "Bax" düyməsi
[Modal split-screen]
   ┌──────────────────────┬──────────────────────┐
   │  Elanın görünüşü     │  Moderator alətləri  │
   │  (iframe preview)    │  ─────────────────── │
   │                      │  AI flag detayı:     │
   │                      │  - Dublikat: ID-...  │
   │                      │    şəkil 87%         │
   │                      │    başlıq 92%        │
   │                      │  ─────────────────── │
   │                      │  Satıcı tarixi:      │
   │                      │  - 3 əvvəlki rədd    │
   │                      │  ─────────────────── │
   │                      │  Quick actions:      │
   │                      │  [✓ Təsdiq]          │
   │                      │  [✗ Rədd ▼ səbəb]   │
   │                      │  [↺ Geri qaytar ▼]   │
   │                      │  [⚠ Bloklamaq]      │
   │                      │  [→ Növbəti]         │
   └──────────────────────┴──────────────────────┘
```

### "Rədd" səbəbləri (templated)
1. Saxta məhsul / xidmət
2. Qadağan kateqoriya
3. Yanlış kateqoriya
4. Qiymət uyğun deyil
5. Keyfiyyətsiz şəkil
6. Təkrar elan
7. Qadağan söz / nifrət
8. Yanlış kontakt
9. Digər (mətn yaz)

### "Geri qaytar" axını
- İstifadəçi əlavə məlumat təqdim edə bilər
- Status: `revision_requested`
- Email + push: "Elanınızı redaktə edin: ..."
- 3 gün ərzində cavab gəlməsə avtomatik `rejected`

## E. Şikayət axını

```
[/admin/sikayetler]
   ↓
Queue:
   - Yaş (yaşıl <24h, sarı 24-72h, qırmızı >72h)
   - Tip (saxta / nifrət / qiymət / digər)
   - Reporter risk
   ↓ Detal
[Modal]
   - Şikayətçi profili
   - Hədəf elan/istifadəçi/mesaj
   - Mətn səbəb
   - Sübut şəkilləri
   - Əvvəlki şikayətlər (bu hədəf üçün)
   ↓ Decide
   ┌── Müsbət şikayət ──┐
   │                    │
   │  Hədəf: elan       │
   │  ↓ Action:         │
   │  - Elanı bloklamaq │
   │  - İstifadəçi      │
   │    suspend         │
   │  - Reporter mükafat│
   │    (gələcəkdə)     │
   │                    │
   └────────────────────┘
   ↓ Notify
   - Reporter: "Şikayət təsdiqləndi"
   - Reported: "Hesabınız bloklandı, səbəb: ..."
   - admin_logs
```

## F. Banner / Reklam onay

```
[/admin/reklamlar]
   ↓
Tabs: [Pending] [Active] [Paused] [Finished]
   ↓ Pending tab → klikleme
[Detal səhifəsi]
   - Banner şəkli (preview)
   - Hədəf URL (yoxla)
   - Hədəf kateqoriya, şəhər
   - Büdcə, müddət
   - Sahibinin profili (verified business olmalıdır)
   ↓ Action
   - Approve → status='active', start scheduling
   - Reject → reason, notify
   - Reject + ban → spam istifadəçi
```

### Pre-flight yoxlamalar
- Şəkil malware skan
- URL safe-browsing API
- Mətn moderasiya (AI)
- Reklam siyasətinə uyğunluq

## G. Kateqoriya idarəsi

```
[/admin/kateqoriyalar]
   ┌──────────────────────────────┐
   │ Tree view + drag-drop sıralama│
   │ ┌─ Elektronika                │
   │ │  ├─ Telefon                 │
   │ │  │   ├─ iPhone               │
   │ │  │   └─ Samsung              │
   │ │  └─ Noutbuk                  │
   │ ├─ Avto                        │
   │ └─ ...                         │
   │ [+ Yeni kateqoriya]            │
   └──────────────────────────────┘
   ↓ Klikleme
[Detal]
   Tabs: General | Atributlar | SEO | Listings (saymaq)
   ─ General:
     - Slug, AZ/RU/EN ad, ikon
     - Active toggle
   ─ Atributlar:
     - Cədvəl: key, label, type, required, filterable
     - Drag sıralama
     - Yeni atribut: + key, type, options...
     - Versiyalaşma: dəyişikliklər mövcud elanlara təsir etmir
       (mövcudlar köhnə sxemdə qalır, yeni elanlar yeni ilə)
   ─ SEO:
     - Title, description, H1, content
     - Schema variant (LocalBusiness/Product/RealEstate/Vehicle/JobPosting)
```

## H. Sistem ayarları

| Bölmə | Parametr | Tip |
|---|---|---|
| Ümumi | Site name, logo, kontakt email | text |
| Maintenance | Saytı söndür + mesaj | toggle + textarea |
| Registration | Açıq / qapalı | toggle |
| Limits | Pulsuz elan/ay (default 3) | number |
| | Şəkil sayı maks (default 20) | number |
| | Title min/max (10/120) | number |
| | Description min/max (50/5000) | number |
| Moderasiya | Auto-approve threshold AI | slider 0-100 |
| | Risk skoru max (auto-block) | number |
| Komissiya | Escrow % (default 4) | number |
| | Boost qiyməti | number |
| Email | SMTP host/port/user/pass | text |
| | From address | email |
| Push | FCM Server Key | password |
| SMS | Provider, key | text |
| Feature flags | Cədvəl: key, on/off, % rollout | UI |

## I. Audit log axtarış

```
[/admin/audit-log]
   ↓
Filter:
  - Admin: dropdown
  - Action: user.suspend, listing.approve, ...
  - Entity type: user, listing, payment, ...
  - Date range
  - IP address
  ↓
Cədvəl (server-paginate):
  Admin | Action | Entity | Before | After | IP | Tarix
  ────────────────────────────────────────────────────
  Anar  | suspend| user   | active | susp. | 1.2| 5dəq
  ↓ klik → JSON diff modal
```

## J. Hesabatlar (Reports)

| Hesabat | Mənbə | Format |
|---|---|---|
| Gəlir gündəlik | Postgres `payments` | PDF, Excel |
| Premium satışları | Postgres + groupby | Excel |
| Top satıcılar | Postgres | Excel |
| Şəhər × kateqoriya aktivlik | ClickHouse | PDF |
| Moderator performans | Postgres + admin_logs | Excel |
| Vergi hesabatı (aylıq) | Postgres | PDF (rəsmi format) |

Bütün hesabatlar:
- Async generation (BullMQ job)
- Tamamlandıqda email + in-app
- 30 gün arxivdə saxlanılır
