# 06 — Admin Panel Strukturu

## Əsas prinsiplər
- **Ayrı subdomain:** `admin.avito.az` (CSP daha sərt, IP allow-list opsional).
- **Mütləq 2FA:** Admin rolu üçün məcburi.
- **RBAC:** Hər əməliyyat icazə yoxlanışı (OPA və ya öz middleware).
- **Audit log:** Bütün dəyişikliklər (before/after JSON ilə).
- **Feature flag:** Yeni modullar mərhələli aktiv.

## Modul struktur

```
admin/
├── dashboard/         # KPI, real-time
├── users/            # istifadəçi idarəsi
├── listings/         # elan idarəsi + moderasiya
├── moderation/       # mərkəzi moderasiya queue
├── complaints/       # şikayət və mübahisə
├── shops/            # mağaza idarəsi
├── payments/         # ödəniş, refund
├── subscriptions/    # abunəliklər
├── ads/              # reklam kampaniyaları
├── banners/          # banner CMS
├── catalog/          # kateqoriya + atribut
├── geo/              # şəhər + rayon
├── premium/          # premium xidmətlər kataloqu
├── seo/              # SEO səhifələr
├── blog/             # blog idarəsi
├── notifications/    # sistem bildirişi
├── analytics/        # hesabatlar
├── audit/            # audit log axtarış
├── settings/         # sistem parametrlər
└── team/             # admin komandası + rollar
```

## RBAC matrisi

| Modul | viewer | support | moderator | senior_mod | ad_manager | finance | admin | super_admin |
|---|---|---|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Users — view | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| Users — suspend | — | — | — | ✅ | — | — | ✅ | ✅ |
| Users — ban | — | — | — | — | — | — | ✅ | ✅ |
| Users — credit balance | — | ✅ | — | — | — | ✅ | ✅ | ✅ |
| Listings — view | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |
| Listings — approve/reject | — | — | ✅ | ✅ | — | — | ✅ | ✅ |
| Listings — block | — | — | — | ✅ | — | — | ✅ | ✅ |
| Moderation — decide | — | — | ✅ | ✅ | — | — | ✅ | ✅ |
| Complaints — resolve | — | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |
| Payments — view | ✅ | ✅ | — | — | — | ✅ | ✅ | ✅ |
| Payments — refund | — | — | — | — | — | ✅ | ✅ | ✅ |
| Ads — approve | — | — | — | — | ✅ | — | ✅ | ✅ |
| Banners — manage | — | — | — | — | ✅ | — | ✅ | ✅ |
| Catalog — manage | — | — | — | — | — | — | ✅ | ✅ |
| Settings | — | — | — | — | — | — | ✅ | ✅ |
| Team — manage | — | — | — | — | — | — | — | ✅ |
| Audit — view | — | — | — | ✅ | — | ✅ | ✅ | ✅ |

## Dashboard ana ekran komponentləri

| Widget | Məlumat | Yenilənmə |
|---|---|---|
| KPI Tiles | DAU, MAU, yeni elan, gəlir | 5 dəq |
| Revenue Trend | son 30 gün | gündəlik |
| Top Categories | elan sayına görə | gündəlik |
| Top Cities | aktiv elan | gündəlik |
| Moderation Queue | sayı + ortalama gözləmə | real-time |
| Open Complaints | sayı + yaş | real-time |
| Recent Registrations | son 20 | real-time |
| System Health | uptime, queue depth | 1 dəq |

## Moderasiya növbəsi (workflow)

```
[Yeni elan] 
    ↓
[AI moderasiya pipeline]
    ├─→ NSFW şəkil aşkarlandı  → priority=10, manual review
    ├─→ Qadağan söz             → priority=8, auto-reject (yüksək confidence)
    ├─→ Dublikat                 → priority=6, manual review
    ├─→ Saxta qiymət anomaliyası → priority=4, manual review
    └─→ Təmiz                    → status='active'
    ↓
[Manual moderator paneli]
    ├─→ "Təsdiq" → status='active', notify owner
    ├─→ "Rədd"   → status='rejected', reason göndər
    └─→ "Geri qaytar" → əlavə məlumat tələbi
```

### Moderator UI komponentləri
- **TaskCard** — şəkil/qiymət/satıcı/AI flag-lar yan-yana
- **Bulk decide** — eyni qaydaya görə toplu rədd
- **Quick reject reasons** — şablon səbəblər
- **Owner history** — keçmiş rejection sayı
- **Similar listings** — duplicate suspect

## İstifadəçi əməliyyatları (UserActionsPanel)

| Əməliyyat | Səlahiyyət | Dialog tələbli |
|---|---|---|
| Profilə bax | viewer+ | yox |
| Bütün elanlarını gör | viewer+ | yox |
| Mesajlarını oxu | senior_mod+ (icazə loga düşür) | bəli (səbəb) |
| Müvəqqəti suspend | senior_mod+ | bəli (müddət + səbəb) |
| Permanent ban | admin+ | bəli (səbəb) |
| Balansa kredit | finance/admin | bəli (məbləğ + səbəb) |
| Verifikasiya manual | admin | bəli |
| Hesabı silmə | super_admin | bəli (təsdiq) |

## Audit log strukturu

Hər əməliyyat üçün:
```json
{
  "id": "uuid",
  "admin_id": "uuid",
  "admin_name": "Anar Aliyev",
  "action": "user.suspend",
  "entity_type": "user",
  "entity_id": "uuid",
  "before": { "status": "active" },
  "after":  { "status": "suspended", "until": "2026-06-01" },
  "reason": "Saxta elanlar üçün şikayət",
  "ip_address": "1.2.3.4",
  "user_agent": "Mozilla/5.0 ...",
  "created_at": "2026-05-08T10:23:00Z"
}
```

### Audit search filtrləri
- Admin
- Action növü (user.* / listing.* / payment.*)
- Tarix aralığı
- Entity ID

## Hesabatlar

### Gəlir hesabatı
- Günlük / həftəlik / aylıq qrafik
- Mənbə: VIP / Boost / Subscription / Ad
- Kateqoriya kəsiyi
- Şəhər kəsiyi
- Top 50 ödəyici (anonim opsional)
- Refund məbləği

### Elan hesabatı
- Yerləşdirilən elan sayı
- Aktivləşmə nisbəti
- Orta moderasiya müddəti
- Rədd faizi (səbəblərə görə)
- Orta həyat dövrü (yerləşdirildi → satıldı)

### İstifadəçi hesabatı
- Yeni qeydiyyat
- Aktivləşmə (ilk elan / ilk mesaj)
- Retention (D1, D7, D30)
- Top satıcılar (elan + gəlir)
- Bloklanmış istifadəçilər

## Sistem ayarları (`/admin/settings`)

| Bölmə | Parametrlər |
|---|---|
| Ümumi | Sayt adı, logo, kontakt email |
| Funksional | Maintenance mode, registration on/off |
| Moderasiya | Auto-approve threshold, AI confidence min |
| Limit | Pulsuz elan ay başına, max şəkil, max video |
| Komissiya | Escrow %, payment processor fees |
| SEO | Robots.txt, default meta |
| Bildiriş | SMTP, FCM key, SMS provider |
| Təhlükəsizlik | 2FA məcburi rolları, sessiya müddəti |
| Feature flags | Yeni modulları aktivləşdir |

## Texnologiya

- **Framework:** Next.js 15 (App Router) — `apps/admin`
- **UI:** **Refine.dev** (data fetching & forms) + **shadcn/ui**
- **Charts:** Recharts / Tremor
- **Tables:** TanStack Table (server-side)
- **Forms:** React Hook Form + Zod
- **State:** TanStack Query
- **Auth:** NextAuth + role middleware

## Performans hədəfləri
- Dashboard ana səhifə LCP ≤ 1.5s
- Cədvəl 100K sətir ilə server-side paginate (20-50 görünür)
- Bulk action ≤ 5s (background queue ilə progress göstərilir)
