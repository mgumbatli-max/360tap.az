# 360tap.az — Faza 0 (Təməl) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** NestJS `api/`-ni 360tap.az-ın əsas backend-i kimi qurmaq — genişləndirilmiş Prisma schema (33 model), dev infrastruktur (Postgres/Redis/Meilisearch/MinIO/BullMQ), region/kateqoriya/brand seed (GPS + haversine nearby), tamamlanmış auth, media upload və frontend proxy-nin köhnə Express-dən yeni API-yə mərhələli keçidi — **canlı frontend qırılmadan**.

**Architecture:** Express `backend/` (port 5400) keçid dövründə paralel işləyir. Yeni NestJS `api/` (port **5500**) endpoint-bə-endpoint dövrəyə girir. Frontend (port 5401) `next.config.ts` rewrite-ları **split** edilir: miqrasiya olunmuş yollar → 5500, qalanı → 5400. Hər addım smoke test ilə yoxlanır.

**Tech Stack:** NestJS 10, Prisma 5 + PostgreSQL 16, Redis, Meilisearch, MinIO (S3-uyğun), BullMQ, argon2, passport-jwt, Jest, Docker Compose.

**Spec mənbəyi:** `docs/v2/04_database_schema.md`, `05_api_design.md`, `07_region_first_and_search.md`, `12_risks_and_roadmap.md` §3.

---

## İcra statusu — 2026-06-10 ✅

Faza 0 icra olundu (inline, brew-native — Docker əvəzinə Homebrew servisləri).

| Task | Status | Qeyd |
|------|--------|------|
| 1. Preflight (git) | ✅ | git init + .gitignore |
| 2. İnfrastruktur | ✅ | **brew-native** (Postgres `marketplace_dev`, Redis, Meilisearch); Docker yox |
| 3. Config + health + redis/queue | ✅ | API boot, `/health` yaşıl |
| 4. Prisma schema | ✅ | **38 model**, init migration |
| 5. Seed | ✅ | 15 region, 18 rayon, 97 nearby, 20 kateqoriya, 24 atribut, 10 brend, 50 model |
| 6. Auth | ✅ | rotation/logout/me/RBAC mövcud idi + districtId uyğunlaşması |
| 7. Geo modulu | ✅ | regions/districts/nearby/resolve; Qəbələ→[Oğuz,İsmayıllı,Göyçay,Şəki,...] |
| 8. Media | ✅ | upload (sharp+blurhash) + yerli storage + statik serving |
| 9. Listings/categories paritet | ⚠️ Qismən | Mövcud endpoint-lər yeni schema ilə işlək; region-filter `findAll` → Faza 1 |
| 10. Frontend proxy split | ✅ | geo/health/media→5500, qalan→5400; canlı sayt qırılmadı |
| 11. Smoke + README | ✅ | 5/5 test, frontend proxy smoke yaşıl, `api/README.md` |

**Deviation:** docker-compose əvəzinə brew-native (istifadəçi seçimi); media S3 əvəzinə yerli fayl (Faza 0); DB adı `tap360` əvəzinə mövcud `marketplace_dev`.

---

## Əhatə və qeydlər

- **TDD adaptasiyası:** Kod modulları (auth, geo, media) üçün Jest testləri (test→fail→implement→pass). İnfrastruktur/schema/seed üçün "test" = **verifikasiya əmri** (healthcheck, `psql` sayğac, `curl`). Bu, foundation işinin təbiətinə uyğundur.
- **Git:** Cari qovluq hələ git deposu deyil → **Task 1** git init edir. Bütün commit addımları bundan sonra işləyir.
- **Paket meneceri:** `api/`-də `npm` (package-lock.json mövcud).
- **Heç bir köhnə data itməsi yox:** Express DB-yə toxunulmur; yeni NestJS ayrı DB/schema-da işləyir, sonra data köçürmə (Faza 1 sonu).

---

## Fayl strukturu (yaradılacaq/dəyişəcək)

```
360tap.az/
  .gitignore                         (Create — yoxdursa)
  docker-compose.dev.yml             (Create — Postgres/Redis/Meili/MinIO)
  api/
    .env                             (Create/Modify — DB/Redis/Meili/S3/JWT)
    .env.example                     (Create)
    prisma/
      schema.prisma                  (Modify — 33 modelə genişləndir)
      migrations/                    (Create — yeni migration)
      seed.ts                        (Modify — region/category/brand seed)
      seed/
        regions.ts                   (Create — region+rayon+GPS data)
        categories.ts                (Create — kateqoriya ağacı + attributes)
        brands.ts                    (Create — transport brendləri)
        nearby.ts                    (Create — haversine nearby generator)
    src/
      config/configuration.ts        (Modify — redis/meili/s3 config əlavə)
      config/env.validation.ts       (Modify — yeni env-lər)
      health/health.controller.ts    (Create — /health, infra checks)
      health/health.module.ts        (Create)
      redis/redis.module.ts          (Create — ioredis provider)
      queue/queue.module.ts          (Create — BullMQ konfiqurasiya)
      search/meili.service.ts        (Create — Meilisearch client + index init)
      search/search.module.ts        (Create)
      media/media.controller.ts      (Create — POST /media/upload)
      media/media.service.ts         (Create — S3 upload + blurhash)
      media/media.module.ts          (Create)
      modules/geo/geo.controller.ts  (Create — /geo/*)
      modules/geo/geo.service.ts     (Create)
      modules/geo/geo.module.ts      (Create)
      modules/geo/utils/haversine.ts (Create)
      modules/auth/auth.service.ts   (Modify — refresh rotation)
      modules/auth/auth.controller.ts(Modify — /auth/me, logout)
      common/guards/roles.guard.ts   (Modify — RBAC tamamla)
  frontend/
    next.config.ts                   (Modify — proxy split 5500/5400)
```

---

## Task 1: Preflight — git, .gitignore, monorepo təsdiqi

**Files:**
- Create: `/Users/mr.maqa/Projects/360tap.az/.gitignore` (yoxdursa)

- [ ] **Step 1: Git deposunu başlat (yoxdursa)**

Run:
```bash
cd /Users/mr.maqa/Projects/360tap.az
git rev-parse --is-inside-work-tree 2>/dev/null || git init
```
Expected: `true` (artıq var) və ya `Initialized empty Git repository...`.

- [ ] **Step 2: .gitignore yarat/yenilə**

`.gitignore`:
```gitignore
node_modules/
.next/
dist/
.env
.env.local
*.log
.DS_Store
api/uploads/
backend/uploads/
/tmp/
```

- [ ] **Step 3: Node/npm versiyalarını yoxla**

Run: `node -v && npm -v`
Expected: Node ≥ 20, npm ≥ 10.

- [ ] **Step 4: İlk commit**

```bash
git add .gitignore
git commit -m "chore: faza0 — git init + gitignore"
```

---

## Task 2: Dev infrastruktur (Docker Compose)

**Files:**
- Create: `docker-compose.dev.yml`
- Create: `api/.env`, `api/.env.example`

- [ ] **Step 1: docker-compose.dev.yml yarat**

`docker-compose.dev.yml`:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: tap360
      POSTGRES_USER: tap360
      POSTGRES_PASSWORD: tap360pass
    ports: ["5433:5432"]
    volumes: ["tap_pg:/var/lib/postgresql/data"]
  redis:
    image: redis:7-alpine
    ports: ["6380:6379"]
  meilisearch:
    image: getmeili/meilisearch:v1.10
    environment:
      MEILI_MASTER_KEY: tap360_meili_dev
    ports: ["7700:7700"]
    volumes: ["tap_meili:/meili_data"]
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: tap360
      MINIO_ROOT_PASSWORD: tap360pass
    ports: ["9000:9000", "9001:9001"]
    volumes: ["tap_minio:/data"]
volumes:
  tap_pg: {}
  tap_meili: {}
  tap_minio: {}
```
> Qeyd: portlar (5433/6380/7700/9000) yerli konfliktdən qaçmaq üçün seçildi.

- [ ] **Step 2: api/.env.example yarat**

`api/.env.example`:
```env
PORT=5500
DATABASE_URL=postgresql://tap360:tap360pass@localhost:5433/tap360?schema=public
REDIS_URL=redis://localhost:6380
MEILI_HOST=http://localhost:7700
MEILI_KEY=tap360_meili_dev
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=tap360-media
S3_ACCESS_KEY=tap360
S3_SECRET_KEY=tap360pass
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=2592000
```

- [ ] **Step 3: api/.env yarat (example-dən kopya)**

Run: `cp api/.env.example api/.env`

- [ ] **Step 4: İnfrastrukturu qaldır və yoxla**

Run:
```bash
docker compose -f docker-compose.dev.yml up -d
sleep 5
docker compose -f docker-compose.dev.yml ps
pg_isready -h localhost -p 5433 && redis-cli -p 6380 ping && curl -s http://localhost:7700/health
```
Expected: hamısı `running`; `accepting connections`; `PONG`; `{"status":"available"}`.

- [ ] **Step 5: MinIO bucket yarat**

Run (mc və ya konsol :9001):
```bash
# brew install minio-mc; mc alias set local http://localhost:9000 tap360 tap360pass
mc mb --ignore-existing local/tap360-media
```
Expected: bucket yaradıldı.

- [ ] **Step 6: Commit**

```bash
git add docker-compose.dev.yml api/.env.example
git commit -m "chore(infra): faza0 dev compose (pg/redis/meili/minio)"
```

---

## Task 3: NestJS config + health + infra modulları

**Files:**
- Modify: `api/src/config/configuration.ts`, `api/src/config/env.validation.ts`
- Create: `api/src/health/health.controller.ts`, `health.module.ts`
- Create: `api/src/redis/redis.module.ts`, `api/src/queue/queue.module.ts`
- Test: `api/src/health/health.controller.spec.ts`

- [ ] **Step 1: Asılılıqlar əlavə et**

Run:
```bash
cd api && npm i ioredis @nestjs/bullmq bullmq meilisearch @aws-sdk/client-s3 sharp blurhash
```
Expected: quraşdırıldı.

- [ ] **Step 2: configuration.ts genişləndir**

`api/src/config/configuration.ts` — `AppConfig` və return obyektinə əlavə:
```ts
redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6380',
meili: { host: process.env.MEILI_HOST ?? 'http://localhost:7700', key: process.env.MEILI_KEY ?? '' },
s3: {
  endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  bucket: process.env.S3_BUCKET ?? 'tap360-media',
  accessKey: process.env.S3_ACCESS_KEY ?? '',
  secretKey: process.env.S3_SECRET_KEY ?? '',
},
```
(AppConfig interfeysinə uyğun tipləri də əlavə et.)

- [ ] **Step 3: Health test yaz (failing)**

`api/src/health/health.controller.spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('GET /health → ok=true', async () => {
    const mod = await Test.createTestingModule({ controllers: [HealthController] }).compile();
    const ctrl = mod.get(HealthController);
    expect((await ctrl.check()).ok).toBe(true);
  });
});
```

- [ ] **Step 4: Testi işlət (fail)**

Run: `cd api && npx jest health.controller -i`
Expected: FAIL — `Cannot find module './health.controller'`.

- [ ] **Step 5: HealthController + module yaz**

`api/src/health/health.controller.ts`:
```ts
import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  async check() {
    return { ok: true, service: '360tap.az api', ts: Date.now() };
  }
}
```
`api/src/health/health.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
@Module({ controllers: [HealthController] })
export class HealthModule {}
```
`app.module.ts`-ə `HealthModule` import et.

- [ ] **Step 6: Testi işlət (pass)**

Run: `cd api && npx jest health.controller -i`
Expected: PASS.

- [ ] **Step 7: Redis + Queue modulları yaz**

`api/src/redis/redis.module.ts` (global ioredis provider):
```ts
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export const REDIS = 'REDIS';
@Global()
@Module({
  providers: [{ provide: REDIS, inject: [ConfigService],
    useFactory: (c: ConfigService) => new Redis(c.get('redisUrl')) }],
  exports: [REDIS],
})
export class RedisModule {}
```
`api/src/queue/queue.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
@Module({
  imports: [BullModule.forRootAsync({ inject: [ConfigService],
    useFactory: (c: ConfigService) => ({ connection: { url: c.get('redisUrl') } }) })],
  exports: [BullModule],
})
export class QueueModule {}
```
`app.module.ts`-ə `RedisModule`, `QueueModule` import et.

- [ ] **Step 8: API-ni qaldır və health yoxla**

Run: `cd api && npm run start:dev` (ayrı terminal) → sonra `curl -s http://localhost:5500/api/v1/health`
Expected: `{"ok":true,...}` (global prefix `api/v1`-i main.ts-də təsdiq et).

- [ ] **Step 9: Commit**

```bash
git add api/src/config api/src/health api/src/redis api/src/queue api/src/app.module.ts api/package.json
git commit -m "feat(api): faza0 config + health + redis/queue modules"
```

---

## Task 4: Prisma schema genişləndirmə (33 model) + migration

**Files:**
- Modify: `api/prisma/schema.prisma`
- Create: `api/prisma/migrations/<ts>_faza0/migration.sql` (prisma generate edir)

> Mənbə: `docs/v2/04_database_schema.md` §3 — modellər birə-bir köçürülür. Mövcud User/Category/CategoryAttribute/City/Listing/ListingImage genişləndirilir.

- [ ] **Step 1: Geo modelləri əlavə et (Region, District, NearbyDistrict)**

`schema.prisma`-ya `docs/v2/04` §3.2 blokunu əlavə et. `City` modelini `District`-ə uyğunlaşdır (və ya City→District rename + Region əlavə). `User.cityId` → `districtId`.

- [ ] **Step 2: Catalog genişlət (Category.vertical, Brand, VehicleModel)**

`docs/v2/04` §3.3 blokunu əlavə et (`Category`-yə `vertical`, `seoTitle/Description`, `Brand`, `VehicleModel`).

- [ ] **Step 3: Listing genişlət + detail modelləri**

`docs/v2/04` §3.4 (Listing: source/stockQty/inStock/hasWarranty/pickupToday/callClicks/whatsappClicks/storeId/districtId/vertical/oldPrice) + §3.5 (VehicleDetails, RealEstateDetails, JobDetails) + `ListingAttributeValue`.

- [ ] **Step 4: Store/Company, Engagement, Commerce, ERP, Ops modelləri**

`docs/v2/04` §3.6–§3.10 bloklarını əlavə et (Store, StoreBranch, CompanyProfile, Favorite, Conversation, Message, Review, Report, SavedSearch, Notification, ListingStatDaily, Package, Subscription, Promotion, Payment, Banner, ErpIntegration, ErpProductLink, ErpSyncLog, ImportJob, SearchLog, AuditLog).

- [ ] **Step 5: Schema-nı validate et**

Run: `cd api && npx prisma validate`
Expected: `The schema ... is valid 🚀`.

- [ ] **Step 6: Migration yarat və tətbiq et**

Run: `cd api && npx prisma migrate dev --name faza0_full_schema`
Expected: migration yaradıldı + DB-yə tətbiq olundu, `prisma generate` avtomatik.

- [ ] **Step 7: Cədvəlləri yoxla (verifikasiya testi)**

Run:
```bash
psql postgresql://tap360:tap360pass@localhost:5433/tap360 -c "\dt" | grep -E "regions|districts|nearby_districts|stores|listings|erp_integrations" | wc -l
```
Expected: ≥ 6 (əsas yeni cədvəllər mövcud).

- [ ] **Step 8: Commit**

```bash
git add api/prisma/schema.prisma api/prisma/migrations
git commit -m "feat(db): faza0 — full 33-model prisma schema + migration"
```

---

## Task 5: Seed — Region/District/Nearby + Category + Brand

**Files:**
- Create: `api/prisma/seed/regions.ts`, `categories.ts`, `brands.ts`, `nearby.ts`
- Modify: `api/prisma/seed.ts`
- Create: `api/prisma/seed/haversine.test.ts`

- [ ] **Step 1: Haversine funksiyası üçün test yaz (failing)**

`api/prisma/seed/haversine.test.ts`:
```ts
import { haversineKm } from './nearby';
test('Bakı–Sumqayıt ~30km', () => {
  const d = haversineKm(40.4093, 49.8671, 40.5897, 49.6686);
  expect(d).toBeGreaterThan(20);
  expect(d).toBeLessThan(45);
});
```

- [ ] **Step 2: Testi işlət (fail)**

Run: `cd api && npx jest haversine -i`
Expected: FAIL — `nearby` modulu yoxdur.

- [ ] **Step 3: nearby.ts (haversine + generator) yaz**

`api/prisma/seed/nearby.ts`:
```ts
export function haversineKm(lat1:number,lng1:number,lat2:number,lng2:number){
  const R=6371,toRad=(d:number)=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1),dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
// districts: {id,lat,lng}[] → NearbyDistrict yazıları (top N, ≤maxKm)
export function buildNearby(districts:{id:string;lat:number;lng:number}[], topN=6, maxKm=120){
  const out:{originId:string;targetId:string;distanceKm:number;rank:number}[]=[];
  for(const o of districts){
    const near=districts.filter(t=>t.id!==o.id)
      .map(t=>({t,d:haversineKm(o.lat,o.lng,t.lat,t.lng)}))
      .filter(x=>x.d<=maxKm).sort((a,b)=>a.d-b.d).slice(0,topN);
    near.forEach((x,i)=>out.push({originId:o.id,targetId:x.t.id,distanceKm:Math.round(x.d),rank:i}));
  }
  return out;
}
```

- [ ] **Step 4: Testi işlət (pass)**

Run: `cd api && npx jest haversine -i`
Expected: PASS.

- [ ] **Step 5: regions.ts data yaz (12+ region + rayon + GPS)**

`api/prisma/seed/regions.ts` — nümunə struktur (real GPS data ilə doldur):
```ts
export const REGIONS = [
  { slug:'baki', nameAz:'Bakı', lat:40.4093, lng:49.8671, districts:[
      { slug:'baki-yasamal', nameAz:'Yasamal', lat:40.39, lng:49.80 },
      { slug:'baki-nesimi',  nameAz:'Nəsimi',  lat:40.38, lng:49.84 },
  ]},
  { slug:'sumqayit', nameAz:'Sumqayıt', lat:40.5897, lng:49.6686, districts:[
      { slug:'sumqayit-merkez', nameAz:'Sumqayıt mərkəz', lat:40.5897, lng:49.6686 } ]},
  { slug:'gence', nameAz:'Gəncə', lat:40.6828, lng:46.3606, districts:[/*...*/]},
  { slug:'qebele', nameAz:'Qəbələ', lat:40.9803, lng:47.8456, districts:[
      { slug:'qebele-merkez', nameAz:'Qəbələ mərkəz', lat:40.9803, lng:47.8456 } ]},
  { slug:'quba', nameAz:'Quba', lat:41.3617, lng:48.5128, districts:[/*...*/]},
  { slug:'xacmaz', nameAz:'Xaçmaz', lat:41.4592, lng:48.8065, districts:[/*...*/]},
  { slug:'lenkeran', nameAz:'Lənkəran', lat:38.7540, lng:48.8510, districts:[/*...*/]},
  { slug:'seki', nameAz:'Şəki', lat:41.1919, lng:47.1706, districts:[/*...*/]},
  { slug:'mingecevir', nameAz:'Mingəçevir', lat:40.7700, lng:47.0489, districts:[/*...*/]},
  { slug:'shamaxi', nameAz:'Şamaxı', lat:40.6311, lng:48.6411, districts:[/*...*/]},
  { slug:'masalli', nameAz:'Masallı', lat:39.0342, lng:48.6658, districts:[/*...*/]},
  { slug:'oguz', nameAz:'Oğuz', lat:41.0717, lng:47.4656, districts:[/*...*/]},
];
```
> Tam rayon siyahısı və GPS açıq mənbədən doldurulur (R3 — `docs/v2/12`).

- [ ] **Step 6: categories.ts + brands.ts yaz**

`categories.ts` — 4 vertical kök (transport/realestate/job/universal) + alt-kateqoriyalar + hər birinə `CategoryAttribute` (bax `docs/v2/09` §4). `brands.ts` — `frontend/lib/transport-data.ts`-dəki marka/modelləri köçür.

- [ ] **Step 7: seed.ts yaz (hamısını bağla)**

`api/prisma/seed.ts` — REGIONS→Region+District upsert; `buildNearby` ilə NearbyDistrict; categories; brands. Idempotent (upsert).

- [ ] **Step 8: Seed işlət və yoxla**

Run:
```bash
cd api && npx prisma db seed
psql postgresql://tap360:tap360pass@localhost:5433/tap360 -tc \
 "select (select count(*) from regions), (select count(*) from districts), (select count(*) from nearby_districts), (select count(*) from categories);"
```
Expected: regions ≥ 12, districts > 12, nearby_districts > 0, categories > 4.

- [ ] **Step 9: Commit**

```bash
git add api/prisma/seed.ts api/prisma/seed
git commit -m "feat(db): faza0 seed — regions/districts/nearby + categories + brands"
```

---

## Task 6: Auth tamamlama (refresh rotation, RBAC, /auth/me)

**Files:**
- Modify: `api/src/modules/auth/auth.service.ts`, `auth.controller.ts`
- Modify: `api/src/common/guards/roles.guard.ts`
- Test: `api/src/modules/auth/auth.service.spec.ts`

- [ ] **Step 1: Refresh rotation testi yaz (failing)**

`auth.service.spec.ts` — `rotateRefresh(oldToken)` köhnəni revoke edib yenisini qaytarmalı:
```ts
it('rotateRefresh köhnə tokeni revoke edir', async () => {
  const { refreshToken } = await service.login(creds);
  const next = await service.rotateRefresh(refreshToken);
  await expect(service.rotateRefresh(refreshToken)).rejects.toThrow(); // köhnə artıq keçərsiz
  expect(next.refreshToken).not.toBe(refreshToken);
});
```
(PrismaService mock və ya test DB ilə.)

- [ ] **Step 2: Testi işlət (fail)**

Run: `cd api && npx jest auth.service -i`
Expected: FAIL — `rotateRefresh` yoxdur.

- [ ] **Step 3: rotateRefresh + revoke implement et**

`auth.service.ts`-də: refresh token hash-i `RefreshToken` cədvəlində; rotate zamanı köhnəni `revokedAt=now`, yenisini yarat. Validate zamanı `revokedAt` null + `expiresAt>now` yoxla.

- [ ] **Step 4: Testi işlət (pass)**

Run: `cd api && npx jest auth.service -i`
Expected: PASS.

- [ ] **Step 5: /auth/me + /auth/logout əlavə et**

`auth.controller.ts`: `@Get('me')` (JWT guard, current user); `@Post('logout')` (refresh revoke).

- [ ] **Step 6: RolesGuard tamamla**

`roles.guard.ts`: `@Roles(...roles)` metadata oxu, `user.role` yoxla, icazəsizdə 403.

- [ ] **Step 7: E2E smoke (verifikasiya)**

Run:
```bash
curl -s -XPOST localhost:5500/api/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"t@t.az","password":"Passw0rd!","fullName":"Test"}' | head -c 200
```
Expected: access+refresh qaytarılır.

- [ ] **Step 8: Commit**

```bash
git add api/src/modules/auth api/src/common/guards/roles.guard.ts
git commit -m "feat(auth): faza0 — refresh rotation, /me, /logout, RBAC"
```

---

## Task 7: Geo modulu (/geo/*)

**Files:**
- Create: `api/src/modules/geo/geo.controller.ts`, `geo.service.ts`, `geo.module.ts`, `utils/haversine.ts`
- Test: `api/src/modules/geo/geo.service.spec.ts`

- [ ] **Step 1: resolve testi yaz (failing)**

`geo.service.spec.ts`:
```ts
it('resolve(lat,lng) ən yaxın rayonu qaytarır', async () => {
  const d = await service.resolveNearest(40.98, 47.84); // Qəbələ
  expect(d.regionSlug).toBe('qebele');
});
```

- [ ] **Step 2: Testi işlət (fail)**

Run: `cd api && npx jest geo.service -i` → FAIL.

- [ ] **Step 3: GeoService + Controller yaz**

`geo.service.ts`: `regions()`, `districts(regionSlug)`, `nearby(districtId)` (NearbyDistrict rank-lı), `resolveNearest(lat,lng)` (haversine min). `geo.controller.ts`: `docs/v2/05` §4 endpoint-ləri (`@Public`). `geo.module.ts` app-a import.

- [ ] **Step 4: Testi işlət (pass)**

Run: `cd api && npx jest geo.service -i` → PASS.

- [ ] **Step 5: Endpoint verifikasiyası**

Run: `curl -s localhost:5500/api/v1/geo/regions | head -c 200`
Expected: region siyahısı JSON.

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/geo
git commit -m "feat(geo): faza0 — regions/districts/nearby/resolve endpoints"
```

---

## Task 8: Media modulu (S3 upload + blurhash)

**Files:**
- Create: `api/src/media/media.controller.ts`, `media.service.ts`, `media.module.ts`
- Test: `api/src/media/media.service.spec.ts`

- [ ] **Step 1: blurhash testi yaz (failing)**

`media.service.spec.ts` — kiçik test şəkli üçün `toBlurhash(buffer)` qeyri-boş string qaytarmalı.

- [ ] **Step 2: Testi işlət (fail)**

Run: `cd api && npx jest media.service -i` → FAIL.

- [ ] **Step 3: MediaService yaz**

`media.service.ts`: `sharp` ilə resize/metadata, `blurhash` encode, `@aws-sdk/client-s3` ilə MinIO-ya PUT, public URL qaytar (`{url,width,height,blurHash}`).

- [ ] **Step 4: Testi işlət (pass)**

Run: `cd api && npx jest media.service -i` → PASS.

- [ ] **Step 5: Controller (multipart) + verifikasiya**

`media.controller.ts`: `POST /media/upload` (`FileInterceptor`). Verifikasiya:
```bash
curl -s -XPOST localhost:5500/api/v1/media/upload -H "Authorization: Bearer <token>" -F file=@/tmp/360screen_01.png | head -c 200
```
Expected: `{ url, width, height, blurHash }`.

- [ ] **Step 6: Commit**

```bash
git add api/src/media
git commit -m "feat(media): faza0 — S3 upload + blurhash"
```

---

## Task 9: Listings/Categories endpoint paritetı (frontend üçün minimum)

**Files:**
- Modify: `api/src/modules/listings/listings.service.ts`, `listings.controller.ts`
- Modify: `api/src/modules/categories/categories.service.ts`

> Məqsəd: frontend-in işlədiyi əsas endpoint-ləri (`GET /listings`, `GET /listings/:id`, `GET /categories/tree`, `GET /categories/:slug/attributes`) yeni schema ilə işlək et. Express cavab formatına uyğunlaşdır (`{data,meta}`).

- [ ] **Step 1: listings list testi yaz (failing)** — region+kateqoriya filter, pagination meta.
- [ ] **Step 2: Testi işlət (fail).**
- [ ] **Step 3: ListingsService.findAll genişlət** — `region/district/category/vertical/priceMin/Max/sort/page` filter; `district→region` join; `{data,meta}`.
- [ ] **Step 4: Testi işlət (pass).**
- [ ] **Step 5: categories tree + attributes endpoint** (`docs/v2/05` §5).
- [ ] **Step 6: Verifikasiya** — `curl localhost:5500/api/v1/listings?region=qebele` JSON qaytarır.
- [ ] **Step 7: Commit** — `git commit -m "feat(api): faza0 — listings/categories endpoint parity"`.

---

## Task 10: Frontend proxy split (5500 ↔ 5400)

**Files:**
- Modify: `frontend/next.config.ts` (rewrite-lar)

> Mövcud (line ~12): `{ source: '/api/:path*', destination: 'http://localhost:5400/api/:path*' }`. Miqrasiya olunmuş yollar 5500-ə, qalanı 5400-ə.

- [ ] **Step 1: rewrites split et**

`next.config.ts` `rewrites()`:
```ts
async rewrites() {
  const NEST = 'http://localhost:5500/api/v1';
  const EXPRESS = 'http://localhost:5400/api';
  return [
    { source: '/api/geo/:path*',        destination: `${NEST}/geo/:path*` },
    { source: '/api/health',            destination: `${NEST}/health` },
    { source: '/api/media/:path*',      destination: `${NEST}/media/:path*` },
    // qalan hər şey köhnə Express-ə (fallback ən sonda)
    { source: '/api/:path*',            destination: `${EXPRESS}/:path*` },
  ];
}
```
> Qeyd: yeni endpoint NestJS-də tam işlədikcə müvafiq sətir 5500-ə köçürülür (mərhələli).

- [ ] **Step 2: Hər iki backend + frontend qaldır**

Run (3 terminal): Express `cd backend && npm run dev`; NestJS `cd api && npm run start:dev`; Frontend `cd frontend && npm run dev`.

- [ ] **Step 3: Smoke test (verifikasiya)**

Run:
```bash
curl -s localhost:5401/api/health | head -c 120      # → NestJS (ok:true)
curl -s localhost:5401/api/geo/regions | head -c 120  # → NestJS region siyahısı
curl -s -o /dev/null -w "listings via express: %{http_code}\n" localhost:5401/api/listings
```
Expected: health/geo NestJS-dən; listings hələ Express-dən 200.

- [ ] **Step 4: Frontend brauzer yoxlaması**

Ana səhifə (`localhost:5401`) açılır, qırılma yoxdur (köhnə endpoint-lər işləyir, geo yeni API-dən).

- [ ] **Step 5: Commit**

```bash
git add frontend/next.config.ts
git commit -m "feat(frontend): faza0 — proxy split nest(5500)/express(5400)"
```

---

## Task 11: Faza 0 yekun smoke + sənəd yeniləmə

**Files:**
- Modify: `docs/v2/12_risks_and_roadmap.md` (Faza 0 ✓ qeyd)
- Create: `api/README.md` (dev başlatma təlimatı)

- [ ] **Step 1: Tam Jest + lint**

Run: `cd api && npm test && npm run lint`
Expected: bütün testlər PASS, lint təmiz.

- [ ] **Step 2: Bütün infra + 3 servis qalxır (yekun smoke)**

Run: health (5500), geo, register, media upload, frontend ana səhifə — hamısı işləyir.

- [ ] **Step 3: api/README.md yaz** — `docker compose up`, `.env`, `prisma migrate`, `prisma db seed`, `npm run start:dev` ardıcıllığı.

- [ ] **Step 4: roadmap-da Faza 0 işarələ + commit**

```bash
git add docs/v2/12_risks_and_roadmap.md api/README.md
git commit -m "docs: faza0 tamamlandı — smoke yaşıl, dev təlimat"
```

---

## Self-Review (spec coverage)

| Spec tələbi (args/docs) | Task |
|--------------------------|------|
| NestJS əsas backend konfiqurasiya | 3, 6, 7, 9 |
| Prisma schema 33 model | 4 |
| İnfrastruktur (PG/Redis/Meili/S3/BullMQ) | 2, 3 |
| Region/District/NearbyDistrict seed (GPS, haversine) | 5 |
| Category + Brand seed | 5 |
| Auth tamamlama | 6 |
| Media upload | 8 |
| Frontend proxy köhnə→yeni keçid | 10 |
| Canlı frontend qırılmasın (Express paralel) | 10 (split), 2 (ayrı DB) |

**Açıq asılılıqlar (icradan əvvəl təsdiq):**
1. Tam region+rayon+GPS data (Task 5 Step 5) — R3.
2. Meilisearch index init Faza 1-ə qalır (Task 3-də yalnız bağlantı; search modulu Faza 1).
3. Köhnə Express DB-dən data köçürmə Faza 1 sonunda (bu planda yeni boş DB).

> **Növbəti faza:** region-first listing axını, Meilisearch index + search, dynamic attribute formaları (Faza 1) — ayrıca plan.
