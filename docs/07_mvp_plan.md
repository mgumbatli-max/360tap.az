# 07 — MVP Development Plan

## MVP məqsədi
Bazara minimum işlek versiyanı 4 ay ərzində çıxarmaq, real istifadəçi geri bildirimini almaq, gəlir kanallarını sınamaq.

## Təcrübə nüvəsi (must-have for launch)

### 1. Hesab və autentifikasiya
- ✅ Email + parol qeydiyyat
- ✅ Telefon + OTP
- ✅ Google OAuth
- ✅ Şifrə bərpası
- ✅ JWT (access + refresh)
- ⏸ 2FA (post-launch)

### 2. Profil
- ✅ Şəkil, ad, şəhər, bio
- ✅ Verifikasiya (telefon, email)
- ✅ Reyting (read-only)

### 3. Kateqoriyalar
- ✅ 15 əsas + alt-kateqoriyalar
- ✅ 5 kateqoriya üçün xüsusi atributlar (Avtomobil, Telefon, Mənzil, İş, Xidmət)

### 4. Elan yerləşdirmə (8-addımlı wizard)
- ✅ Kateqoriya cascade
- ✅ Başlıq + təsvir (Zod validasiya)
- ✅ Dinamik atributlar
- ✅ Şəkil yükləmə (max 10 MVP-də) + sıxma
- ✅ Şəhər + xəritə pin (basic)
- ✅ Telefon + chat
- ⏸ VIP/Premium ödəniş (sadə "Yuxarı qaldır" — 1 paket)
- ✅ Ön baxış + təsdiq

### 5. Axtarış & filter
- ✅ Meilisearch ilə tam-mətn
- ✅ Kateqoriya, şəhər, qiymət range, vəziyyət filtrləri
- ✅ Sıralama: yeni / qiymət ↑↓ / populyar
- ⏸ Xəritə görünüşü
- ⏸ Saxlanılan axtarış + bildiriş (Faza 2)

### 6. Elan detalları
- ✅ Şəkil qalereyası, swipe
- ✅ Qiymət, satıcı kartı, oxşar elanlar
- ✅ Telefon (göstər düyməsi), chat düyməsi
- ✅ Şikayət düyməsi
- ✅ Sevimliyə əlavə
- ✅ JSON-LD SEO

### 7. Mesajlaşma (sadə)
- ✅ Real-time (Socket.io)
- ✅ Mətn + 1 şəkil
- ✅ Görüldü statusu
- ⏸ Bloklama, spam aşkarlama (Faza 2)

### 8. İstifadəçi kabineti
- ✅ Mənim elanlarım (statuslara görə)
- ✅ Sevimlilər
- ✅ Mesajlar
- ✅ Bildirişlər (in-app + email)
- ✅ Profil ayarları

### 9. Moderasiya
- ✅ Manual təsdiq queue
- ⏸ AI moderasiya (Faza 2)

### 10. Admin panel (basic)
- ✅ Login + 2FA
- ✅ Dashboard (KPI 5 ədəd)
- ✅ İstifadəçi siyahısı + suspend
- ✅ Elan moderasiyası
- ✅ Şikayətlər queue
- ✅ Kateqoriya idarəsi
- ✅ Şəhər idarəsi
- ✅ Audit log (read-only)

### 11. Ödəniş (sadə)
- ✅ "Yuxarı qaldır" — 1-3 AZN
- ✅ Pulpal entegrasiyası
- ⏸ Balans cüzdanı (Faza 2)
- ⏸ VIP/Premium paketləri (Faza 2)

### 12. SEO
- ✅ SSR ana səhifə + elan + kateqoriya
- ✅ JSON-LD (Product, BreadcrumbList)
- ✅ sitemap.xml (parçalanmış)
- ✅ robots.txt
- ✅ Open Graph + Twitter Card
- ✅ Şəhər × kateqoriya landing səhifələri (avtomatik)

### 13. PWA
- ✅ Manifest, service worker
- ✅ "Ana ekrana əlavə et"
- ✅ Offline shell (header + sevimlilər)
- ⏸ Push notification (Faza 2)

### 14. Bildiriş
- ✅ In-app
- ✅ Email (yeni mesaj, elan təsdiq, müddət bitmə)
- ⏸ SMS (yalnız OTP)
- ⏸ Push (Faza 2)

### 15. Mobil-first dizayn
- ✅ Responsive (320 → 1920)
- ✅ Touch-optimized
- ✅ WCAG AA
- ✅ Tünd rejim

## Out of scope (Faza 2-yə)

- Mağaza / biznes hesabı
- Toplu yükləmə (CSV/API)
- Reklam kabineti və kampaniyalar
- Premium paketlər (VIP / Top / Highlight çoxlu seçim)
- Reytinq / rəy
- AI funksiyaları (başlıq, qiymət, moderasiya)
- Çatdırılma və escrow
- Multi-language (yalnız AZ)
- Multi-currency (yalnız AZN)
- Komanda / shop members

## Qəbul meyarları (Acceptance)

### Funksional
- [ ] Bütün MVP must-have hissələri end-to-end işləyir.
- [ ] 50 nəfərlik betta test mərhələsində kritik bug yoxdur.
- [ ] Pulpal real ödənişlər test mode-dan canlıya keçirilib.
- [ ] Email göndərmə > 99% çatdırılma rate.

### Performans
- [ ] Ana səhifə LCP ≤ 2.5s (P75, 4G real cihaz).
- [ ] Axtarış cavabı ≤ 300ms (P95).
- [ ] API P99 ≤ 500ms.
- [ ] 1 000 paralel istifadəçi simulyasiyası uğurla keçilib (k6).

### Təhlükəsizlik
- [ ] Penetration test keçirilib, kritik/yüksək risk yoxdur.
- [ ] OWASP Top 10 üzrə yoxlama tamam.
- [ ] PII şifrələnmiş.
- [ ] Rate-limit aktiv və test edilib.

### Keyfiyyət
- [ ] Backend test əhatəsi ≥ 75%.
- [ ] Frontend kritik flow E2E (Playwright) ≥ 10 ssenari.
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95.
- [ ] Crash-free rate ≥ 99% (Sentry).

### Hüquqi
- [ ] Oferta, məxfilik, KMQ sənədləri dərc edilib (hüquqşünas baxışı).
- [ ] Cookie banner aktiv.
- [ ] DSAR (data export/delete) prosesi sənədləşdirilib.

### Hazırlıq
- [ ] CI/CD pipeline işləyir.
- [ ] Staging mühiti production konfiqurasiyası ilə.
- [ ] Monitoring + alerting aktiv (Grafana, Sentry, PagerDuty).
- [ ] Backup + DR təcrübəsi keçirilib.
- [ ] Runbook-lar mövcud (incident, rollback, restore).

## Komanda və müddət

| Rol | Sayı | Sprint başına saat |
|---|---|---|
| Product Manager | 1 | 80 |
| Tech Lead | 1 | 80 |
| Backend Engineer | 3 | 240 |
| Frontend Engineer | 2 | 160 |
| QA Engineer | 1 | 80 |
| DevOps | 0.5 | 40 |
| Designer | 1 | 80 |
| Cəmi | 9.5 | 760 |

**Sprint:** 2 həftə · **MVP üçün sprint sayı:** 8 (16 həftə) · **Buffer:** 2 sprint (4 həftə) → **Cəmi: 20 həftə (~4.5 ay)**.

## Riskli sahələr və azaldılma

| Risk | Azaldılma |
|---|---|
| Pulpal inteqrasiyası gec olar | Sprint 4-də başlat, fallback Stripe test mode |
| Şəkil yükləməsi yavaş | imgproxy + S3 + presigned URL (sprint 3) |
| Meilisearch sync gecikməsi | Event-driven indexer + sınaq |
| Mobil performans (regional internet) | Aggressive image optimization, code splitting |
| Saxta elan / fraud | Manual moderasiya MVP-də, AI Faza 2-də |

## Launch strategiyası

### Soft launch (Sprint 8 sonu)
- 500 dəvət olunmuş istifadəçi
- Bakı + Sumqayıt fokus
- 2 kateqoriya: Telefon, Avtomobil
- Real ödəniş, real moderasiya

### Public launch (Sprint 10 sonu)
- Bütün Azərbaycan
- Bütün kateqoriyalar
- Performance marketing kampaniyası
- ASO, PR, influencer
