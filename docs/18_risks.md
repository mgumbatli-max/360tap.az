# 18 — Risklər və Həll Yolları

## Risk matrisi (5×5)

```
Təsir →     Aşağı (1)  Orta (2)  Yüksək (3)  Çox Yüksək (4)  Kritik (5)
Ehtimal ↓
Çox aşağı   ░          ░         ▒           ▒                ▓
Aşağı       ░          ▒         ▒           ▓                ▓
Orta        ▒          ▒         ▓           ▓                █
Yüksək      ▒          ▓         ▓           █                █
Çox yüksək  ▓          ▓         █           █                █
```

(▒ orta, ▓ yüksək, █ kritik — fokus tələb edir)

## A. Bazar və biznes riskləri

### A1. Tap.az dominant lider — bazara giriş çətin
- **Ehtimal:** Yüksək
- **Təsir:** Çox Yüksək
- **Səviyyə:** █ Kritik

**Mitigation:**
1. **USP fokus** — AI moderasiya, escrow, premium UX → Tap.az-ın yapmadıqları sahələrdə qalib ol
2. **Sürət** — mobil performans, 1-toxunuş elan yerləşdirmə
3. **Regional fokus** — ilk 6 ayda Bakı + Sumqayıt yox, regionlara getmək (rəqabətsiz lokal bazar)
4. **B2B fokus** — biznes alətləri Tap.az-da zəifdir (toplu yükləmə, API, analitika)
5. **Endirim aqressiv** — ilk 6 ay pulsuz mağaza paketi
6. **Niche giriş** — 1-2 vertikal (məs. avto + xidmət) ilə domine et, sonra genişlən

### A2. Aşağı monetizasiya konversiyası
- **Ehtimal:** Orta
- **Təsir:** Yüksək
- **Səviyyə:** ▓

**Mitigation:**
- A/B test premium qiymətləri
- Bonus balans (yeni qeydiyyat üçün 5 ₼ → boost dadır)
- Paket trialı (30 gün pulsuz Pro)
- Up-sell automation (3 baxış olan elana "VIP et" CTA)
- Bundle promotion (3 boost = 2 qiymət)

### A3. Hüquqi tənzimləyici dəyişikliklər (KMQ, vergi)
- **Ehtimal:** Aşağı
- **Təsir:** Yüksək
- **Səviyyə:** ▒

**Mitigation:**
- Hüquqşünas məsləhət (kvartal review)
- Modullu compliance layer (cookie banner, DSAR proses)
- e-Qaimə inteqrasiyası vaxtında
- Lokal hosting opsionu (regulasiya tələb etsə)

### A4. Reklam blokerləri yaxud üçüncü tərəf cookie-nin ölümü
- **Ehtimal:** Yüksək (artıq baş verir)
- **Təsir:** Orta
- **Səviyyə:** ▓

**Mitigation:**
- First-party data fokus (öz qeydiyyat, öz analytics)
- Server-side tracking (Posthog self-host)
- SEO + content marketinq əsas trafik mənbəyi
- Email marketinq inkişafı

## B. Texniki risklər

### B1. Skala edə bilməmək (DB/search bottleneck)
- **Ehtimal:** Orta
- **Təsir:** Çox Yüksək
- **Səviyyə:** ▓

**Mitigation:**
- Read replicas (Postgres) Sprint 6-dan
- Connection pooling (PgBouncer)
- Index strategiyası daimi review
- Query plan analyzer (slow query log)
- Search ayrıca scale (Meilisearch cluster)
- Cache aggressiv (Redis cluster)
- Load testing hər major sprint-də (k6)

### B2. Şəkil yükləmə yavaş (regionlar üçün)
- **Ehtimal:** Yüksək
- **Təsir:** Orta
- **Səviyyə:** ▓

**Mitigation:**
- Client-side compression (web worker, browser-image-compression)
- Direct-to-S3 upload (presigned URL)
- Multiple resolution variant (imgproxy on-demand)
- CDN geo-distribution (Cloudflare R2 + edge)
- Progressive upload (background)
- Offline queue (PWA)

### B3. Real-time chat scale
- **Ehtimal:** Orta
- **Təsir:** Yüksək
- **Səviyyə:** ▓

**Mitigation:**
- Sticky session (sticky load balancer)
- Redis adapter (Socket.io)
- Horizontal scale (3+ pod)
- Message queue (BullMQ for offline messages)
- Compression (per-message)
- Rate-limit per connection (qoruyucu)

### B4. Üçüncü tərəf provider downtime (Pulpal, SMS)
- **Ehtimal:** Yüksək
- **Təsir:** Yüksək
- **Səviyyə:** █

**Mitigation:**
- Multi-provider abstraksiya (Pulpal + Epoint, Atlas + Twilio)
- Auto-failover (5 dəq sağlamlıq yox → switch)
- Status page (status.marketplace.az)
- Graceful degradation (ödənişsiz funksionallıq qalır)

### B5. Yüksək texniki borc (məsələn hazırkı işləyən prototip + yeni stack)
- **Ehtimal:** Yüksək
- **Təsir:** Orta
- **Səviyyə:** ▓

**Mitigation:**
- Hər sprint 15% effort-u tech debt-ə
- "Boy scout rule": kod toxunduqda təmizlə
- Strangler pattern: köhnə Express → yeni NestJS modul-modul
- ADR-lər (Architecture Decision Records)

### B6. Dependency security vulnerability
- **Ehtimal:** Yüksək
- **Təsir:** Yüksək (kritik CVE-lərdə)
- **Səviyyə:** █

**Mitigation:**
- Snyk / Dependabot avtomatik
- Hər PR-də vulnerability scan
- npm audit cron
- pnpm + lockfile + audit
- Avtomatik PR-lar minor patch upgrade üçün

## C. Təhlükəsizlik və məxfilik

### C1. Saxta elan və fraud (scammer)
- **Ehtimal:** Çox Yüksək
- **Təsir:** Çox Yüksək
- **Səviyyə:** █

**Mitigation:**
- Telefon verifikasiyası məcburi
- AI moderasiya (mətn + şəkil)
- Risk skoru istifadəçi (yeni hesab + bahalı elan = manual review)
- Escrow ilə təhlükəsiz alış (Faza 3)
- Şikayət sistemi sürətli SLA (24 saat)
- Public "scam education" (təhlükəsizlik səhifəsi)
- Şübhəli profil işarəsi (badge)
- Bank məlumatlarının çatda yazılmasına xəbərdarlıq (regex)

### C2. Data breach (PII leak)
- **Ehtimal:** Aşağı
- **Təsir:** Kritik
- **Səviyyə:** █

**Mitigation:**
- Encryption at rest (KMS)
- Encryption in transit (TLS 1.3)
- PII şifrələnmiş sahələr (telefon hash + encrypt)
- Database access audit
- Penetration test illik
- Bug bounty proqramı
- Incident response plan (4 saat reaksiya)
- Backup şifrələnmiş + ayrı region

### C3. DDoS / brute force
- **Ehtimal:** Yüksək
- **Təsir:** Yüksək
- **Səviyyə:** █

**Mitigation:**
- Cloudflare WAF + DDoS protection
- Rate-limit hər endpoint
- CAPTCHA (sensitive forms)
- IP reputation database
- Login throttling (5 fail → 15 dəq lock)
- Token rotation

### C4. Account takeover
- **Ehtimal:** Orta
- **Təsir:** Yüksək
- **Səviyyə:** ▓

**Mitigation:**
- 2FA təklif (admin üçün məcburi)
- Şübhəli login alert (email)
- Device fingerprint
- Geo-location anomaly detection
- Recent password change confirmation

## D. Operasional risklər

### D1. Moderasiya queue böyüməsi (manual scale problemi)
- **Ehtimal:** Yüksək
- **Təsir:** Yüksək
- **Səviyyə:** █

**Mitigation:**
- AI auto-approve (yüksək confidence + təmiz tarix)
- Multi-tier moderation (junior → senior → admin)
- Bulk decide UI
- Moderation outsourcing (qonşu ölkə, AZ dilli)
- Trust score: high-trust user → auto-publish
- Spam filter daha sıx (yüklənməsi azalsın)

### D2. Müştəri dəstək həcmi
- **Ehtimal:** Yüksək
- **Təsir:** Orta
- **Səviyyə:** ▓

**Mitigation:**
- Self-service (FAQ, guide)
- Chatbot (FAQ-bazlı, Faza 2 AI-bazlı)
- Ticket sistemi (Zendesk və ya öz)
- Tier 1 outsourcing
- Macros (şablon cavablar)

### D3. Komanda istedadı çatışmazlığı
- **Ehtimal:** Yüksək (Azerbaycan bazarı)
- **Təsir:** Yüksək
- **Səviyyə:** █

**Mitigation:**
- Remote-first (regional + Türkiyə + Gürcüstan)
- Senior bias (1 senior > 2 junior MVP fazasında)
- Mentor proqramı (junior idxalı)
- Kompetitiv kompensasiya (90 percentile lokal)
- Tech blog + meetup (employer brand)

### D4. Komandanın churn-ü (key person risk)
- **Ehtimal:** Orta
- **Təsir:** Yüksək
- **Səviyyə:** ▓

**Mitigation:**
- Knowledge sharing (sənədlər, ADR)
- Pair programming
- Bus factor ≥ 2 hər kritik sahədə
- Ownership rotation
- Retain bonus

## E. Maliyyə riskləri

### E1. CAC > LTV
- **Ehtimal:** Yüksək (early stage)
- **Təsir:** Çox Yüksək
- **Səviyyə:** █

**Mitigation:**
- Organic kanal fokus (SEO, referral)
- Paid kanal sıx test + dayan
- Cohort analiz hər ay
- Diversifikasiya (content, partnership)
- B2B akvizisiya (yüksək LTV)

### E2. Funding çatışmazlığı (runway)
- **Ehtimal:** Orta
- **Təsir:** Kritik
- **Səviyyə:** █

**Mitigation:**
- Scenario planning (3 mərhələ: konservativ / orta / aqressiv)
- Bridge funding planı
- Profitability path Q4 2027
- Cost discipline (hire only when proven need)

### E3. Provider qiymət artımı (cloud, sms, email)
- **Ehtimal:** Yüksək
- **Təsir:** Orta
- **Səviyyə:** ▓

**Mitigation:**
- Multi-vendor strategy
- Reserved instance (cloud)
- Bulk SMS contract
- Self-host alternativlər (MinIO, SMTP)

## F. Compliance riskləri

### F1. KMQ pozuntusu
- **Ehtimal:** Aşağı
- **Təsir:** Yüksək
- **Səviyyə:** ▒

**Mitigation:**
- DPO təyini
- Data minimization (yalnız lazım olan)
- DSAR proses (export, delete)
- Retention policy (audit log 1 il, log 90 gün)
- Cookie banner (CMP)
- Hüquqşünas review

### F2. Vergi uyğunsuzluğu
- **Ehtimal:** Aşağı
- **Təsir:** Yüksək
- **Səviyyə:** ▒

**Mitigation:**
- Mühasib məsləhəti
- e-Qaimə inteqrasiya (Faza 3)
- Avtomatik vergi hesabatı
- VÖEN doğrulanması (vergiler.gov.az)

## G. Reputasiya riskləri

### G1. Public scam case (jurnalistlər yazır)
- **Ehtimal:** Orta
- **Təsir:** Yüksək
- **Səviyyə:** ▓

**Mitigation:**
- Crisis communication plan
- PR rabitə hazır şablon
- Tez reaksiya (24 saat ərzində açıqlama)
- Şəffaflıq (statistika hesabatı)
- Müraciət edən qurbanın ödəniş kompensasiyası (good will)

### G2. Mənfi rəylər
- **Ehtimal:** Yüksək
- **Təsir:** Aşağı
- **Səviyyə:** ▒

**Mitigation:**
- Aktiv social listening
- Cavab strategiyası (24 saat)
- Müştəri uğur hekayələri (case studies)
- Influencer outreach

## Risk register təşkili

```
Hər risk üçün:
- Sahibi (owner)
- Statusi (open / mitigating / closed)
- Last review date
- Next review date
- Linked tasks (Jira)

Aylıq risk review meeting:
- Top 10 risk
- Hərəkətlərin status
- Yeni risklər
- Mitigation plan-da uyğunlaşma
```

## Incident response plan

### Severity səviyyələri
- **SEV1:** Tam downtime, data loss → 5 dəq reaksiya, war room
- **SEV2:** Partial downtime, kritik feature → 30 dəq reaksiya
- **SEV3:** Minor bug, az təsirlə → next business day

### Roller
- **Incident Commander** — Tech Lead
- **Communications** — PM
- **Subject Matter Expert** — modul sahibi
- **Scribe** — QA

### Post-incident
- Blameless post-mortem 48 saat ərzində
- Root cause analiz
- Action items + owners
- Public status update (lazımdırsa)
