# Bildiriş tetikləyiciləri — dizayn

**Tarix:** 2026-09-06
**Vəziyyət:** təsdiqlənib, icraya hazır

## Problem

Bildirişin ÇATDIRILMA borusu tam işləkdir: `Notification` modeli, 4 endpoint (`GET /notifications`,
`GET /notifications/unread-count`, `POST /notifications/read-all`, `POST /notifications/:id/read`),
Header-də `NotificationBell` (30 saniyəlik polling), `/profil/bildirisler` səhifəsi.

Çatışmayan — bildirişi YARADAN mənbələr. Audit (77 tapıntı) göstərdi ki, bildiriş yalnız iki yerdən
yaradılır: `chat.service.ts:171` (yeni mesaj) və `reviews.service.ts:101` (yeni rəy).
`NotificationType` enum-unda `price_drop` və `saved_search` dəyərləri var, amma onları bir sətir kod
belə yaratmır.

Bundan əlavə, canlıda istifadəçiyə YALAN VƏD verən komponentlər var — real vəd göstərib yalnız
`localStorage`-a yazırlar və ya heç nə etmirlər:

| Komponent | Vəd | Faktiki |
|---|---|---|
| `PriceDropAlert.tsx` | «Qiymət düşəndə xəbər ver» | `localStorage`, serverə sorğu yoxdur |
| `FollowButton.tsx` | «yeni elanlardan xəbər tutacaqsınız» | `localStorage` |
| `EmailDigest.tsx` | «Həftəlik xülasəyə abunə oldunuz» | yalnız toast |
| `TelegramBotConnect.tsx` | Telegram qoşulması | `useState` |
| `PushSubscribe.tsx` | «Push bildirişləri aktivdir» | abunə heç yerə yazılmır |
| `PriceHistory.tsx` | «Son 6 ay qiymət dinamikası» | `Math.random()` |
| `NotificationsDropdown.tsx` | — | mock, heç yerdə render olunmur |
| `SavedMatches.tsx` | — | mövcud olmayan endpoint (404) |

## Qərarlar

1. **Qurulacaq bildirişlər:** yeni uyğun elan · elanın müddəti bitir · sevimli elanın statusu dəyişdi
2. **Periodik mexanizm:** `@nestjs/schedule` (in-process cron). Redis-ə ehtiyac yoxdur — canlıda Redis
   `reconnecting` vəziyyətindədir; Render pulsuz planda tək instans olduğu üçün təkrarlanma riski yoxdur.
3. **Saxta UI-lar:** render olunduqları yerdən çıxarılır, fayllar saxlanılır (şərhlə izah edilərək).
   Qiymət xəbərdarlığı bu mərhələyə daxil deyil.

## Arxitektura

Yeni modul: `api/src/modules/alerts/`. Bütün tetikləyicilər burada toplanır ki, mövcud modullar
toxunulmadan qalsın. Yeganə istisna — `listings.service.ts:setStatus()` içindəki bir çəngəl.

```
alerts/
  alerts.module.ts        — ScheduleModule qeydiyyatı, servislərin bağlanması
  saved-search.service.ts — saxlanmış axtarış uyğunlaşdırıcısı (cron: hər 15 dəq)
  expiry.service.ts       — müddət xatırlatması (cron: gündə 1 dəfə)
  query-translate.ts      — frontend URL formatı → backend sorğu formatı
  *.spec.ts               — unit testlər
```

Bildiriş yaratmaq üçün mövcud `NotificationsService.create()` istifadə olunur. O, xətanı QƏSDƏN udur
(`notifications.service.ts:28-33`), yəni bildiriş sınsa əsas axın pozulmur — bu, «heç nəyi pozma»
şərtinin texniki təminatıdır.

### 1. Yeni uyğun elan (`saved_search`)

Cron hər 15 dəqiqədə `notify = true` olan `SavedSearch` sətirlərini gəzir. Hər biri üçün
`lastNotifiedAt`-dan (yoxdursa `createdAt`-dan) sonra dərc olunmuş və sorğuya uyğun gələn elanları
sayır. Sayı > 0 olarsa bildiriş yaradır və `lastNotifiedAt`-ı yeniləyir.

**TƏLƏ — format uyğunsuzluğu.** `SaveSearchButton.tsx:25` atribut filtrlərini frontend URL formatında
(`a_<açar>=<dəyər>`) saxlayır; backend isə `attrs` adlı tək JSON parametri gözləyir
(`listings/dto/query.dto`). Tərcümə olmadan matcher həmişə boş nəticə verər. `query-translate.ts`
məhz bu çevrilməni edir və ayrıca unit testlə qorunur.

### 2. Elanın müddəti bitir (`listing_expiring`)

Cron gündə bir dəfə `status = active` və `expiresAt` növbəti 3 gün içində olan elanların sahibinə
xatırlatma göndərir.

**Kütləvi bildiriş riski.** DAVAM.md canlıda kataloqun ~92%-inin `expiresAt`-ının keçmiş olduğunu
qeyd edir (lokalda hazırda 0-dır). Cron bunları da götürsəydi ilk işə düşmədə minlərlə bildiriş
yaranardı. İki qoruma:
- Yalnız `expiresAt > now` olanlar (vaxtı ARTIQ keçmiş elanlara toxunulmur).
- Eyni elan üçün son 7 gündə bildiriş varsa təkrar göndərilmir (`data.listingId` üzrə yoxlama).

### 3. Sevimli elanın statusu dəyişdi (`listing_status`)

Cron deyil — `listings.service.ts:468 setStatus()` içində çəngəl. Köhnə status orada onsuz da
oxunur (`select: { ownerId, status, publishedAt }`), yəni əlavə sorğu yoxdur. Status `active`-dən
`sold` / `archived` / `expired`-ə keçəndə həmin elanı sevimlilərə salmış istifadəçilərə bildiriş
gedir (elan sahibinin özü istisna olunur).

**Performans:** `favorites` cədvəlində yalnız `@@id([userId, listingId])` var, `listingId` üzrə
ayrıca indeks yoxdur — tərs axtarış (elana görə istifadəçilər) seq scan olardı. Miqrasiya ilə
`@@index([listingId])` əlavə olunur.

## Sxem dəyişiklikləri

```prisma
enum NotificationType {
  message
  price_drop
  saved_search
  moderation
  erp_sync_error
  system
  listing_expiring   // YENİ
  listing_status     // YENİ
}

model Favorite {
  // ...
  @@index([listingId])  // YENİ — tərs axtarış üçün
}
```

Mövcud enum dəyərləri silinmir və dəyişdirilmir; yalnız əlavə olunur — köhnə sətirlər etibarlı qalır.

## Frontend

- `bildirisler/page.tsx` və `NotificationBell.tsx` ikon/rəng xəritələrinə iki yeni tip əlavə olunur.
  Naməlum tip üçün fallback onsuz da var, yəni bu, sınmaya səbəb ola bilməzdi — sadəcə görünüş üçündür.
- `/profil/saxlanmis` səhifəsinə `notify` açarı əlavə olunur. Backend `PATCH /saved-searches/:id`
  endpointi HAZIRDIR (`saved-searches.controller.ts`), sadəcə UI-dan çağırılmır.
- Saxta komponentlər render olunduqları yerlərdən çıxarılır (fayllar qalır).

## Test

- `query-translate.spec.ts` — URL formatı → sorğu formatı çevrilməsi, kənar hallar.
- `saved-search.service.spec.ts` — uyğun elan tapılanda bildiriş yaranır; tapılmayanda yaranmır;
  `lastNotifiedAt` yenilənir.
- `expiry.service.spec.ts` — vaxtı keçmiş elana bildiriş getmir; 3 gün içindəkinə gedir;
  7 gün ərzində təkrar getmir.
- Status çəngəli üçün test: status dəyişəndə favoritə salanlara bildiriş, sahibə getmir.
- Sonra: tam E2E (225 test) + `tsc` + mövcud unit dəsti (47) regressiya üçün.

## Pozulmama zəmanətləri

1. `NotificationsService.create()` xətanı udur → bildiriş sınsa əsas axın işləməyə davam edir.
2. Cron ayrıca modul daxilindədir, mövcud sorğu yollarına toxunmur.
3. `setStatus()` çəngəli `await` edilir, amma `create()` throw etmədiyi üçün status dəyişikliyini
   poza bilmir.
4. Enum yalnız genişlənir, mövcud dəyərlər dəyişmir.
5. Saxta komponentlərin faylları silinmir — geri qaytarmaq bir sətirlik işdir.
