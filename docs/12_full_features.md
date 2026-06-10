# 12 — Tam Versiya Funksional Siyahısı

> MVP-də olanlar, Faza 2/3-də gələnlər, və qeyri-vacib (nice-to-have) ayrıca işarələnir.

## Vəziyyət leqendi
- ✅ MVP — Sprint 1-10
- 🟡 F2 — Faza 2 (Sprint 11-16)
- 🔵 F3 — Faza 3 (Sprint 17-22)
- 🟣 F4 — Beynəlxalqlaşma (Sprint 23-28)
- 💎 NTH — nice-to-have / arzuolunan

## 1. Hesab və autentifikasiya

| Funksiya | Status |
|---|---|
| Email + parol qeydiyyat | ✅ |
| Telefon + OTP qeydiyyat | ✅ |
| Email təsdiq linki | ✅ |
| Parol bərpa | ✅ |
| Google OAuth | ✅ |
| Apple OAuth | 🟡 |
| Facebook OAuth | 🟡 |
| 2FA — TOTP (Google Authenticator) | 🟡 |
| 2FA — SMS | 🟡 |
| Active sessiya idarəsi (cihazlar siyahısı) | ✅ |
| Uzaq logout | ✅ |
| ASAN İmza güclü identifikasiya | 🔵 |
| Magic link login | 💎 |
| Passkeys (WebAuthn) | 💎 |
| Device fingerprinting | 🟡 |

## 2. Profil

| Funksiya | Status |
|---|---|
| Avatar yükləmə | ✅ |
| Ad, şəhər, bio | ✅ |
| Telefon və email təsdiq nişanı | ✅ |
| Şəxsiyyət təsdiqi (manual KYC) | 🟡 |
| Biznes təsdiqi (VÖEN) | 🟡 |
| Reyting (oxu) | ✅ |
| Rəylər (yazma) | 🟡 |
| Profil paylaşma | ✅ |
| Hesabı silmə (soft + hard delete cron) | ✅ |
| Hesab dondurma (öz istəyi ilə) | 🟡 |

## 3. Kateqoriyalar

| Funksiya | Status |
|---|---|
| 3 səviyyəli ağac | ✅ |
| Dinamik atributlar | ✅ |
| Kateqoriyaya görə filter | ✅ |
| İkonlar | ✅ |
| SEO meta hər kateqoriya üçün | ✅ |
| Çoxdilli adlar | 🟣 |
| Admin yeni kateqoriya yaratma | ✅ |
| Atribut sxemi versiyalama | 🟡 |
| Kateqoriya işləmə zamanı dəyişmə (live) | 🟡 |

## 4. Elan yerləşdirmə

| Funksiya | Status |
|---|---|
| 8-addımlı wizard | ✅ |
| Kateqoriya cascade | ✅ |
| Dinamik atribut formu | ✅ |
| Şəkil upload (max 20) | ✅ |
| Video upload (max 1, 60s) | 🟡 |
| Auto-compress + WebP | ✅ |
| Drag & drop sıralama | ✅ |
| Mobil kameradan birbaşa | ✅ |
| Şəkil watermark (mağaza üçün) | 🟡 |
| Xəritə pin | ✅ |
| Dəqiq ünvanı gizlətmə | ✅ |
| AI başlıq təklifi | 🔵 |
| AI təsvir generatoru | 🔵 |
| AI kateqoriya təklifi (şəkildən) | 🔵 |
| AI qiymət tövsiyəsi (median) | 🔵 |
| Qaralama saxlama | ✅ |
| Şablon elan (köçür) | 🟡 |
| Toplu yükləmə (CSV) | 🟡 |
| API ilə yükləmə | 🔵 |
| Maks elan limiti (kateqoriya × paket) | ✅ |
| Avto-müddət uzatma (paket istifadəçilər) | 🟡 |
| Müddət bitmə xəbərdarlığı | ✅ |

## 5. Axtarış və filter

| Funksiya | Status |
|---|---|
| Full-text axtarış (Meilisearch) | ✅ |
| Typo tolerance | ✅ |
| Kateqoriya, şəhər filtri | ✅ |
| Qiymət range slider | ✅ |
| Dinamik atribut filtrləri | ✅ |
| Sıralama (yeni / qiymət / populyar) | ✅ |
| Cursor pagination | ✅ |
| Saxlanılan axtarış | 🟡 |
| Saved search bildiriş (yeni uyğun elan) | 🟡 |
| Xəritə görünüşü (cluster) | 🟡 |
| Radius search (5/10/25/50 km) | 🟡 |
| Sinonim axtarış | 🟡 |
| AI semantic search (vector) | 🔵 |
| Voice search (mobile) | 💎 |
| Image search ("buna oxşar") | 💎 |

## 6. Elan detalları

| Funksiya | Status |
|---|---|
| Şəkil qalereyası (swipe, zoom) | ✅ |
| Atribut cədvəli | ✅ |
| Satıcı kartı + reyting | ✅ |
| Oxşar elanlar | 🟡 (vector ilə daha yaxşı F3) |
| Telefon (klik tracking) | ✅ |
| WhatsApp link | ✅ |
| Saytdaxili chat | ✅ |
| Sevimliyə əlavə | ✅ |
| Şikayət | ✅ |
| Paylaşma (native + sosial) | ✅ |
| Xəritə | ✅ |
| Dynamic OG image | ✅ |
| JSON-LD (Product, Offer) | ✅ |
| Baxış sayğacı | ✅ |
| Qiymət tarixçəsi qrafiki | 🟡 |
| Anti-fraud xəbərdarlığı | ✅ |

## 7. Mesajlaşma

| Funksiya | Status |
|---|---|
| Real-time chat (WS) | ✅ |
| Mətn mesaj | ✅ |
| Şəkil göndərmə | ✅ |
| Səs mesajı | 🟡 |
| Görüldü statusu | ✅ |
| Yazır indikatoru | ✅ |
| Online status | ✅ |
| Bloklama | 🟡 |
| Şikayət | 🟡 |
| Spam aşkarlama (AI) | 🔵 |
| Telefon nömrəsi maska | 🟡 |
| Tərcümə düyməsi | 🔵 |
| Hazır cavab şablonları | 🟡 |
| Video zəng | 💎 |
| Səsli zəng | 💎 |
| Chat history export | 💎 |

## 8. Bildirişlər

| Funksiya | Status |
|---|---|
| In-app notification drawer | ✅ |
| Email bildiriş | ✅ |
| SMS bildiriş (yalnız OTP MVP-də) | ✅ |
| Push notification (web) | 🟡 |
| Push notification (mobile RN) | 🔵 |
| WhatsApp bildiriş | 🟡 |
| Bildiriş tərcihləri (kanal × növ) | ✅ |
| Daily / weekly digest | 🟡 |
| Quiet hours (səssiz saatlar) | 💎 |

## 9. Ödəniş və monetizasiya

| Funksiya | Status |
|---|---|
| Pulpal kart ödənişi | ✅ |
| Epoint kart ödənişi | 🟡 |
| Apple Pay / Google Pay | 🟡 |
| Balans cüzdanı | 🟡 |
| Promo kod | 🟡 |
| Bonus balans | 🟡 |
| Faktura ilə ödəniş (B2B) | 🟡 |
| Refund (manual + auto) | 🟡 |
| Avtomatik abunə yenilənmə | 🟡 |
| Pay-as-you-go | ✅ |

### Premium xidmətlər

| Xidmət | Status |
|---|---|
| Yuxarı qaldır (Boost) | ✅ |
| VIP elan | ✅ |
| Premium elan | 🟡 |
| Ana səhifədə göstər | 🟡 |
| Kateqoriyada üst sıra | 🟡 |
| Rəngli (Highlight) | 🟡 |
| Təcili etiket | 🟡 |
| Limit artır | 🟡 |
| Avto-bump (gündə bir) | 💎 |

### Paketlər (Subscriptions)

| Paket | Status |
|---|---|
| Pulsuz | ✅ |
| Start (kiçik mağaza) | 🟡 |
| Business | 🟡 |
| Pro | 🟡 |
| Enterprise (custom) | 🔵 |

## 10. Mağaza və biznes

| Funksiya | Status |
|---|---|
| Mağaza profili (logo, banner) | 🟡 |
| Mağaza kateqoriyaları | 🟡 |
| Komanda üzvləri (RBAC) | 🟡 |
| Toplu yükləmə CSV | 🟡 |
| API açar | 🔵 |
| Webhook | 🔵 |
| Mağaza statistikası | 🟡 |
| Lead tracker | 🟡 |
| Reklam kabineti | 🟡 |
| Banner yaratma | 🟡 |
| Faktura çapı | 🟡 |
| Sertifikat / verified badge | 🟡 |
| Mağaza izləmə (follow) | 🟡 |
| Mağaza rəyləri | 🟡 |

## 11. Reytinq və rəylər

| Funksiya | Status |
|---|---|
| 1-5 ulduz | 🟡 |
| Mətn rəy | 🟡 |
| Şəkilli rəy | 💎 |
| Rəyə cavab | 🟡 |
| Saxta rəy aşkarlama | 🔵 |
| Rəy şikayəti | 🟡 |
| Reyting hesablama (weighted) | 🟡 |

## 12. Şikayət və mübahisə

| Funksiya | Status |
|---|---|
| Elan şikayəti | ✅ |
| İstifadəçi şikayəti | 🟡 |
| Mesaj şikayəti | 🟡 |
| Rəy şikayəti | 🟡 |
| Şikayət status izləmə | ✅ |
| Sübut şəkli yükləmə | 🟡 |
| Mübahisə (escrow) | 🔵 |
| SLA tracker | 🟡 |

## 13. Moderasiya

| Funksiya | Status |
|---|---|
| Manual moderasiya queue | ✅ |
| Avto-rules (qadağan söz) | ✅ |
| AI mətn moderasiya | 🔵 |
| AI şəkil moderasiya (NSFW) | 🔵 |
| Dublikat aşkarlama (perceptual hash) | 🟡 |
| Risk skoru istifadəçi üçün | 🟡 |
| Bulk moderate | 🟡 |
| Moderator performans dashboard | 🟡 |

## 14. Admin panel

| Funksiya | Status |
|---|---|
| Login + 2FA | ✅ |
| Dashboard KPI | ✅ |
| İstifadəçi idarəsi | ✅ |
| Elan idarəsi | ✅ |
| Moderasiya növbəsi | ✅ |
| Şikayət növbəsi | ✅ |
| Kateqoriya idarəsi | ✅ |
| Şəhər idarəsi | ✅ |
| Banner CMS | 🟡 |
| Reklam onay | 🟡 |
| Premium kataloqu idarəsi | 🟡 |
| SEO səhifələri | 🟡 |
| Blog idarəsi | 🟡 |
| Audit log axtarış | ✅ |
| Sistem ayarları | ✅ |
| Komanda idarəsi (admin RBAC) | ✅ |
| Sistem broadcast (bütün istifadəçilərə) | 🟡 |
| Hesabatlar (PDF/Excel export) | 🟡 |

## 15. SEO

| Funksiya | Status |
|---|---|
| Statik səhifə meta | ✅ |
| Dinamik elan meta | ✅ |
| sitemap.xml (parçalanmış) | ✅ |
| robots.txt | ✅ |
| JSON-LD | ✅ |
| Open Graph + Twitter Card | ✅ |
| Canonical | ✅ |
| Şəhər × kateqoriya SEO landing | ✅ |
| Hreflang (multi-lang) | 🟣 |
| Schema variants (LocalBusiness, Job, RealEstate) | 🟡 |
| Blog | 🟡 |
| FAQ schema | 🟡 |

## 16. Çatdırılma və Escrow (Faza 3)

| Funksiya | Status |
|---|---|
| Azerpoct inteqrasiya | 🔵 |
| Bravo Express | 🔵 |
| Qiymət hesablayıcı | 🔵 |
| Tracking | 🔵 |
| Etiket çapı | 🔵 |
| Escrow ödəniş | 🔵 |
| Escrow mübahisə | 🔵 |

## 17. AI funksiyaları (Faza 2-3)

| Funksiya | Status |
|---|---|
| Başlıq təklifi | 🔵 |
| Təsvir generatoru | 🔵 |
| Kateqoriya təklifi | 🔵 |
| Qiymət tövsiyəsi | 🔵 |
| Saxta elan riski skoru | 🔵 |
| Dublikat aşkarlama | 🟡 |
| Smart search (semantic) | 🔵 |
| Chat cavab köməkçisi | 🔵 |
| Admin insight (anomaly) | 🔵 |
| Şikayətdə avtomatik klassifikasiya | 🔵 |

## 18. Beynəlxalq genişlənmə (Faza 4)

| Funksiya | Status |
|---|---|
| Multi-language (AZ/RU/EN) | 🟣 |
| Multi-currency | 🟣 |
| Multi-country | 🟣 |
| Region tax compliance | 🟣 |
| Lokal ödəniş provayderlər | 🟣 |

## Cəmi sayım

| Status | Sayı | Təxmini effort |
|---|---|---|
| ✅ MVP | 95+ | ~9 ay (10 sprint) |
| 🟡 F2 | 70+ | ~6 ay (6 sprint) |
| 🔵 F3 | 35+ | ~6 ay (6 sprint) |
| 🟣 F4 | 10+ | ~6 ay (6 sprint) |
| 💎 NTH | 15+ | bazada — boş zamana |
| **Cəmi** | **220+** | **~27 ay (28 sprint)** |
