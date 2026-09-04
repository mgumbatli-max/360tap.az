# 360tap.az — UX SPESİFİKASİYASI (Avito modeli)

> **Bu sənəd vahid mənbədir.** Bütün səhifə/komponent işləri buradan oxunur.
> Ölçülər Avito.ru-nun 1440–2000 px enində ekran görüntülərindən çıxarılıb.

## 0. HÜQUQİ SƏRHƏD — POZULMAZ

Kopyalanan: **struktur, düzüm, qarşılıqlı təsir məntiqi, informasiya arxitekturası**.
Bunlar funksional dizayndır və müəllif hüququ ilə qorunmur.

Kopyalanmayan (heç bir halda):
- Avito logosu, «Avito» sözü, ağcaqayın yarpağı işarəsi
- Avito-nun 3D illüstrasiyaları (avtomobil, ev, çamadan, divan, telefon və s.) —
  **onları «bir az dəyişdirmək» də pozuntudur.** Öz ikonlarımızı sıfırdan qururuq.
- Avito-nun mətnləri («Добро пожаловать домой», «#яПомогаю», «Авито Доставка» və s.)
- Avito-nun brend rəngləri birbaşa deyil — bizim `tap` palitramız istifadə olunur.

Bizim əvəzləyicilərimiz:
| Avito-da | Bizdə |
|---|---|
| 3D render illüstrasiyalar | `lucide-react` ikonları + `tap` qradiyent fonlu dairə/kvadrat |
| Ağcaqayın yarpağı + «Avito» | mövcud `components/Logo.tsx` (360tap) |
| «Разместить объявление» | «Elan yerləşdir» |
| «Во всех регионах» | «Bütün Azərbaycan» |

---

## 1. QLOBAL ÖLÇÜLƏR

```
Konteyner:        max-w-[1360px] mx-auto px-6      (Avito ~1360 px işçi sahə)
Şaquli ritm:      bölmələr arası 32 px (py-8), böyük bloklar arası 48 px
Radiuslar:        kart 16px · düymə 8px · pill/hap 999px · mega-menyu 24px
Kölgə:            kartlarda kölgə YOXDUR — yalnız açıq boz fon fərqi
Fon:              səhifə #FFFFFF · bölmə/kart #F5F6F7 · footer #F5F6F7
Sərhəd:           #E5E7EB (yalnız lazım olanda)
```

**Kritik fərq (bizim hazırkı dizaynla):** Avito kartlarda kölgə və sərhəd İŞLƏTMİR.
Ayırıcı — fon rəngi fərqi və boşluqdur. `shadow-card` istifadəsi azaldılmalıdır.

## 2. TİPOQRAFİYA

| Rol | Ölçü / çəki |
|---|---|
| H1 səhifə başlığı | 32px / 700 (mobil 24px) |
| H1 + say (məs. «Nəqliyyat 87 519») | başlıq 700 qara, say 700 **açıq boz** (#9CA3AF) — yan-yana |
| H2 bölmə | 22px / 700 |
| H3 kart başlığı | 15px / 600 |
| Qiymət (detal) | 28px / 700 |
| Qiymət (kart) | 16px / 700 |
| Gövdə | 14px / 400 |
| Kiçik/meta | 13px / 400, rəng #6B7280 |

Azərbaycan diakritikləri qorunmalıdır — `font-variant-ligatures: none` saxla.

## 3. HEADER — 2 SƏTİR (+ opsional banner)

### 3.0 Promo banner (opsional, bağlanan)
Tam en, hündürlük 56px, mərkəzləşmiş mətn + link, sağda `X`. `localStorage` ilə bağlı qalır.

### 3.1 Utility sətri (yalnız ≥1024px)
Hündürlük 40px. Şrift 13px.
- **Sol:** `Biznes üçün ⌄` · `Karyera` · `Kömək` · `Kataloqlar ⌄`
- **Sağ:** ♥ (sevimlilər) · 🛒 (səbət) · `🔒 Giriş və qeydiyyat` · `+ Elan yerləşdir`
- `+ Elan yerləşdir` — **düymə deyil, mətn linkidir** (Avito-da belədir), 600 çəki.

### 3.2 Əsas sətir
Hündürlük 72px, elementlər arası 16px:
1. **Logo** (+ vertikal səhifələrdə yanında adi çəkidə bölmə adı: «360tap **Nəqliyyat**»)
2. **«Bütün kateqoriyalar»** — dolu `tap` fonlu pill düymə, sol tərəfdə 9-nöqtəli grid ikon.
   Mega-menyu AÇIQ olanda ikon `X`-ə çevrilir.
3. **Axtarış** — `flex-1`, hündürlük 52px:
   - input: sol tərəfdə lupa ikonu, radius 8px sol tərəf, **2px `tap` sərhəd**
   - sağda bitişik `Tap` düyməsi (dolu `tap`, ağ mətn, radius 8px sağ tərəf)
   - input və düymə **bir vahid kimi** görünür (aralarında boşluq yoxdur)
4. **Region seçici** — `◤ Bütün Azərbaycan`, ikon + mətn, sərhədsiz

Header `sticky top-0 z-50`.

## 4. MEGA-MENYU

«Bütün kateqoriyalar» düyməsinə klikdə açılır. Header-in altından tam enə yaxın panel:
```
radius: 24px (yuxarı künclər düz, aşağı künclər yumru)
fon: ağ · kölgə: 0 12px 32px rgba(0,0,0,.12)
grid: [280px sol siyahı] [1fr alt-kateqoriya sütunları] [300px Servislər]
```
- **Sol sütun:** kök kateqoriyalar, hər sətir = ikon + ad + `›`.
  Aktiv sətir açıq boz fonlu (#F5F6F7) və radius 12px.
  **Hover ilə aktivləşir** (klik gözlənilmir).
- **Orta:** aktiv kateqoriyanın alt qrupları, **3 sütunda**.
  Qrup başlığı 15px/700 + `›`, altında leaf-lər 14px/400.
  6-dan çox leaf varsa: 5-i göstər + «Daha 5» linki.
- **Sağ:** açıq mavi (#EAF6FF) radius 16px qutu — «Servislər»:
  bizdə → `AI ilə elan yarat`, `Şəkillə axtar`, `Müqayisə`, `Biznes üçün`.
- Esc və çöl klik bağlayır. Açıq ikən body scroll bloklanmır (Avito-da da açıqdır).

## 5. ANA SƏHİFƏ

### 5.1 Kateqoriya plitələri
```
grid: 5 sütun × 2 sətir (lg) · 3 (md) · 2 (mobil)
plitə: fon #F5F6F7, radius 16px, hündürlük 120px, padding 16px
mətn: sol-yuxarı, 15px/600, maksimum 2 sətir
ikon: SAĞ-AŞAĞI künc, 56px, `tap` qradiyentli yumşaq fonlu dairə içində
hover: fon #EDEEF0
```
Sağda ayrıca **«Biznes üçün»** paneli (eyni fon, radius 16px):
başlıq 17px/700 + 3 mini plitə (Avadanlıq · Yer · Mallar) + altda pill düymə.

### 5.2 Elan lenti
Plitələrdən sonra birbaşa **başlıqsız** kart şəbəkəsi (Avito-da «Свежие» başlığı yalnız
vertikal səhifələrdədir). 5 sütun (xl) · 4 (lg) · 3 (md) · 2 (mobil), boşluq 20px.

## 6. ELAN KARTI (şəbəkə)

```
Kölgə YOX. Sərhəd YOX. Fon: şəffaf.
şəkil: aspect 4/3, radius 12px, object-cover
başlıq: 15px/600, 2 sətir kəsim, şəkildən 8px aşağı
qiymət: 16px/700, başlıqdan 4px aşağı        ← Avito-da qiymət başlığın ALTINDADIR
məkan: 13px, #6B7280, sol tərəfdə kiçik pin ikonu
♥: şəklin SAĞ-AŞAĞI küncündə DEYİL — kartın mətn hissəsində, başlıqla eyni sətirdə sağda
⋯: ♥-in altında/yanında, kontekst menyu
rozet (VIP/çatdırılma): şəklin SOL-YUXARI küncündə, ağ yarımşəffaf pill
```
Hover: şəkil bir qədər böyümür — **yalnız başlıq `tap` rənginə keçir** (Avito minimaldır).

## 7. ELAN DETALI

```
grid: [1fr əsas] [400px sağ rels], boşluq 32px, lg-dən aşağı tək sütun
```

### 7.1 Əsas sütun (yuxarıdan aşağı)
1. **Breadcrumb** — `Ana səhifə › Kateqoriya › Alt kateqoriya`, 13px, aralarında `›`
2. **H1** — 32px/700
3. **Qalereya** — böyük şəkil (aspect 4/3, radius 12px), yanlarda ‹ › dairəvi düymələr;
   altda 4 kiçik thumb (72×54, radius 8px), aktiv olanın `tap` sərhədi
4. **«Xüsusiyyətlər»** — H2 + iki sütunlu ad/dəyər siyahısı
5. **«Yerləşmə»** — H2 + ünvan mətni + `Ətraflı öyrən` linki (mavi)
6. **«Təsvir»** — H2 + mətn
7. **Meta sətri** — `№ 12345 · bu gün 14:49 · 0 baxış` — 13px boz
8. **«Elandan şikayət et»** düyməsi — boz fonlu (#F5F6F7), radius 8px, sərhədsiz
9. **«Oxşar elanlar ⌄»** — açılan bölmə
10. Altda boz keçidlər sətri (`Pişiklər · Qoyunlar · ...`)

### 7.2 Sağ rels
1. **Qiymət** 28px/700 — sağında ♥ (dairəvi, sərhədli)
2. **CTA düymələr — YAN-YANA, hər biri 48px hündürlük, radius 8px:**
   - adi elan: `Telefonu göstər` (**yaşıl** #00C853) + `Yaz` (**tap** mavi)
   - çatdırılmalı elan: `Çatdırılma ilə al` + `Səbətə at` (hər ikisi bənövşəyi #7C3AED)
3. **Satıcı bloku** — ad 17px/700 · `5,0 ★★★★★ 6 rəy` · `Şəxsi şəxs`/`Mağaza` ·
   `İzlə` (mavi link)
4. **«Satıcıdan soruş»** —
   - boz fonlu (#F5F6F7) radius 12px «söhbət qutusu», içində `Salam!` + sağda göndər ikonu
   - altında **tünd (#1F2937) pill çipləri**, ağ mətn, 13px:
     `Nə vaxt baxmaq olar?` · `Bu gün baxmaq olar?` · `Sabah baxmaq olar?`
   - klik → həmin mətnlə söhbət açılır
5. **Rəylər** bölməsi — rəy yoxdursa: izahlı mətn + `Bütün rəylər` boz düyməsi

## 8. VERTİKAL / KATEQORİYA LANDİNQİ (`/elanlar?category=…`)

Avito-nun «Недвижимость» modeli:
1. **Mərkəzləşmiş böyük H1** (44px/800) — kateqoriyaya uyğun şüar
2. **Seqment tabları** — pill qrupu (`Al` · `Uzunmüddətli kirayə` · `Günlük`),
   aktiv olanın ağ fonu + nazik sərhədi
3. **Üfüqi filtr paneli** — fon #F5F6F7, radius 16px, hündürlük 64px:
   `[ikon+etiket] | [ikon+etiket] | [ikon+etiket] ... [Bütün filtrlər] [Xəritədə] [QARA CTA]`
   - bölmələr arasında 1px şaquli ayırıcı
   - sondakı CTA **qara fon, ağ mətn**, radius 12px: `1000+ elan göstər`
4. **«Kateqoriyalar»** plitələri + sağda **«Servislər»** plitələri (fərqli qrup başlıqları)
5. **«Ən yenilər»** kart şəbəkəsi

Vakansiya modeli (fərqli): sol **filtr sidebar** (checkbox siyahıları + «Daha çox göstər»)
+ sağda 4 sütunlu populyar keçidlər + açıq mavi axtarış kartı.

## 9. GİRİŞ MODALI

```
mərkəz, en 520px, radius 16px, ağ, kölgəli · fon overlay qara/40
```
- Başlıq `Giriş` 24px/700, sağ-yuxarıda böyük `×` (modaldan KƏNARDA, Avito belədir)
- İki input: `Telefon və ya e-poçt`, `Parol` — **boz fonlu (#F5F6F7), sərhədsiz**, 48px, radius 8px
- Sətir: solda `☑ Parolu yadda saxla` · sağda `Parolu unutdunuz?` (mavi link)
- `Daxil ol` — dolu `tap`, 48px, **enə görə yığcam** (tam en DEYİL, ~110px)
- Alt zolaq (fon #FAF9F7, modalın aşağı hissəsi):
  `Və ya davam et` + sosial dairələr + `Hesabınız yoxdur?` + **ağ fonlu** `Qeydiyyatdan keç`
  düyməsi + hüquqi mətn 12px boz linklərlə

## 10. FOOTER

Avito footer-i **4 sütunlu DEYİL** — tək sətir keçidlər + hüquqi mətn + sosial:
```
fon #F5F6F7, üstdə 1px sərhəd, padding 40px 0
```
1. **Keçid sətri** (15px, sarılan): `Kömək` `Təhlükəsizlik` `Reklam` `Şirkət haqqında`
   `Karyera` `Bloq` `Tətbiq` `Regionlar ⌄` `Daha ⌄`
2. **Hüquqi paraqraf** 13px boz, içində altı xətli linklər:
   `360tap.az — Azərbaycanın elan saytı. © 2026 … Qaydalar. Məxfilik siyasəti.`
3. **Sosial dairələr** — 44px qara dairələr, ağ ikon (WhatsApp, Telegram, Instagram, Facebook)

## 11. MOBİL

- Header: logo + axtarış + hamburger. Utility sətri gizli.
- Kateqoriya plitələri 2 sütun.
- Elan detalı tək sütun; **CTA düymələr ekranın altına yapışan sticky panel olur**.
- Mega-menyu → tam ekran drawer, geri düyməsi ilə iki səviyyəli naviqasiya.

## 12. QARANLIQ REJİM

Layihədə artıq CSS dəyişənli qaranlıq rejim var (`app/globals.css`).
Yeni fonlar sabit hex ilə YAZILMAMALIDIR — mövcud `bg-ink-*` / dəyişən sistemi işlədilməlidir,
əks halda qaranlıq rejim sınır.
