# 360tap.az API (NestJS)

Region-first, ERP-connected marketplace üçün əsas backend. Faza 0 təməli quruldu.

## Stack
NestJS 10 · Prisma 5 + PostgreSQL 16 · Redis · Meilisearch · BullMQ · yerli media storage (Faza 0; S3 sonra).

## Dev mühit (Homebrew native — Docker tələb olunmur)

### 1. Servislər (brew)
```bash
brew services start postgresql@16
brew install redis meilisearch        # bir dəfə
brew services start redis
brew services start meilisearch
```

### 2. Verilənlər bazası
```bash
createdb marketplace_dev              # yoxdursa
```

### 3. Env
```bash
cp api/.env.example api/.env          # sonra dəyərləri yoxla
# DATABASE_URL=postgresql://<user>@localhost:5432/marketplace_dev?schema=public
# REDIS_URL=redis://localhost:6379
# MEILI_HOST=http://localhost:7700
```

### 4. Schema + seed
```bash
cd api
npm install
npx prisma migrate dev                # schema tətbiqi
npm run prisma:seed                   # regions/districts/nearby + categories + brands
```

### 5. İşə sal
```bash
npm run start:dev                     # http://localhost:5500/api/v1  (health: /health)
```

## Portlar (dev)
| Servis | Port |
|--------|------|
| NestJS API | 5500 (`/api/v1`, health `/health`) |
| Frontend (Next.js) | 5401 |
| Express (köhnə, miqrasiya dövründə) | 5400 |
| Postgres / Redis / Meilisearch | 5432 / 6379 / 7700 |

Frontend `next.config.ts` proxy split edir: `/api/geo`, `/api/health`, `/api/media` → NestJS (5500); qalan → Express (5400).

## Faydalı əmrlər
```bash
npm run build           # nest build
npm test                # jest (hamısı)
npx prisma studio       # DB GUI
npx prisma migrate dev  # yeni migration
```

## Struktur
```
src/
  config/        konfiqurasiya + env validation
  health/        GET /health
  redis/ queue/  ioredis + BullMQ
  media/         POST /media/upload (sharp + blurhash)
  modules/
    auth/        register/login/refresh/logout/me (JWT + argon2)
    geo/         regions/districts/nearby/resolve (region-first)
    categories/  kateqoriya ağacı + dynamic attributes
    listings/    elan CRUD
prisma/
  schema.prisma  38 model
  seed/          regions/categories/brands data + haversine
```

> Tam arxitektura: `docs/v2/`. Plan: `docs/v2/plans/2026-06-10-faza0-foundation.md`.
