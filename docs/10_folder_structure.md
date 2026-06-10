# 10 — Folder Structure (Monorepo)

## Üst səviyyə

```
avito-az/
├── apps/
│   ├── web/                # Next.js 15 — istifadəçi UI (port 5401)
│   ├── admin/              # Next.js 15 — admin panel  (port 5402)
│   ├── api/                # NestJS 10 — REST + WS     (port 5400)
│   └── worker/             # BullMQ workers (image, search, email)
│
├── packages/
│   ├── ui/                 # paylaşılan dizayn sistem (shadcn + custom)
│   ├── config/             # tsconfig, eslint, prettier shared
│   ├── db/                 # Prisma schema + client + migrations
│   ├── types/              # paylaşılan TypeScript tipləri (DTO, enum)
│   ├── api-client/         # frontend → backend tip-təhlükəsiz client
│   ├── i18n/               # tərcümələr, ICU
│   ├── analytics/          # event tracking SDK (web + mobile)
│   └── utils/              # paylaşılan helperlər (slug, format, validators)
│
├── infra/
│   ├── docker/             # Dockerfile-lar
│   ├── compose/            # docker-compose (dev, test)
│   ├── k8s/                # Kubernetes manifest-lər
│   ├── terraform/          # infrastruktur kodu
│   ├── helm/               # helm charts
│   └── scripts/            # deploy, backup, seed CLI
│
├── docs/                   # bu sənədlər
├── tests/
│   ├── e2e/                # Playwright (web + admin)
│   ├── load/               # k6 ssenarilər
│   └── fixtures/           # paylaşılan test data
│
├── .github/
│   ├── workflows/          # CI/CD
│   └── CODEOWNERS
│
├── package.json            # root (workspaces)
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
├── README.md
└── CLAUDE.md / AGENTS.md
```

## `apps/web` — Next.js (istifadəçi)

```
web/
├── app/
│   ├── (public)/                       # public route group
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # /
│   │   ├── elanlar/
│   │   │   ├── page.tsx                # /elanlar
│   │   │   └── [slug]/page.tsx         # /elanlar/[id]-[slug]
│   │   ├── k/
│   │   │   ├── [category]/page.tsx
│   │   │   └── [category]/[sub]/page.tsx
│   │   ├── seher/[city]/page.tsx
│   │   ├── magaza/[slug]/page.tsx
│   │   ├── istifadeci/[id]/page.tsx
│   │   ├── blog/page.tsx
│   │   ├── blog/[slug]/page.tsx
│   │   └── (legal)/
│   │       ├── qaydalar/page.tsx
│   │       └── mexfilik/page.tsx
│   │
│   ├── (auth)/                          # auth route group
│   │   ├── giris/page.tsx
│   │   ├── qeydiyyat/page.tsx
│   │   ├── sifre-unutdum/page.tsx
│   │   └── layout.tsx                  # full-screen
│   │
│   ├── (cabinet)/                       # auth-required group
│   │   ├── kabinet/
│   │   │   ├── layout.tsx              # sidebar layout
│   │   │   ├── page.tsx                # dashboard
│   │   │   ├── elanlarim/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/redakte/page.tsx
│   │   │   ├── secilmisler/page.tsx
│   │   │   ├── mesajlar/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [chatId]/page.tsx
│   │   │   ├── bildirisler/page.tsx
│   │   │   ├── balans/page.tsx
│   │   │   ├── odenisler/page.tsx
│   │   │   └── ayarlar/
│   │   │       ├── profil/page.tsx
│   │   │       ├── sifre/page.tsx
│   │   │       └── 2fa/page.tsx
│   │   ├── elan-yerlesdir/
│   │   │   ├── layout.tsx              # wizard layout
│   │   │   ├── page.tsx                # step 1
│   │   │   ├── melumat/page.tsx
│   │   │   ├── qiymet/page.tsx
│   │   │   ├── sekiller/page.tsx
│   │   │   ├── mekan/page.tsx
│   │   │   ├── elaqe/page.tsx
│   │   │   ├── odenisli/page.tsx
│   │   │   ├── onbaxis/page.tsx
│   │   │   └── ugur/[id]/page.tsx
│   │   └── magaza-kabineti/
│   │       └── ...
│   │
│   ├── api/                             # Next.js API routes (BFF)
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── upload/route.ts
│   │   └── og/[id]/route.ts            # dynamic OG image
│   │
│   ├── sitemap.ts                       # dynamic sitemap
│   ├── robots.ts
│   ├── manifest.ts                      # PWA manifest
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── globals.css
│   └── layout.tsx                       # root layout
│
├── components/
│   ├── ui/                              # atom-level (Button, Input...)
│   ├── common/                          # molecule (FormField, SearchBar...)
│   ├── layout/                          # Header, Footer, MobileNav
│   ├── listing/                         # ListingCard, ListingGallery
│   ├── post/                            # wizard step components
│   ├── search/                          # FilterPanel, SearchBar
│   ├── chat/                            # ChatWindow, MessageList
│   ├── auth/
│   ├── dashboard/
│   ├── shop/
│   └── providers/                       # AuthProvider, QueryProvider
│
├── lib/
│   ├── api.ts                           # fetch wrapper (api-client istifadə edir)
│   ├── auth.ts                          # NextAuth config
│   ├── i18n.ts
│   ├── socket.ts                        # Socket.io client
│   ├── store/                           # Zustand stores
│   │   ├── post-wizard.ts
│   │   └── ui.ts
│   └── seo.ts
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-listings.ts
│   ├── use-realtime.ts
│   └── ...
│
├── middleware.ts                         # auth check, locale, A/B
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
└── public/
    ├── icons/
    ├── images/
    └── locales/
```

## `apps/admin` — Next.js (admin)

```
admin/
├── app/
│   ├── (auth)/giris/page.tsx
│   ├── (panel)/
│   │   ├── layout.tsx                   # sidebar + topbar
│   │   ├── page.tsx                     # dashboard
│   │   ├── istifadeciler/
│   │   ├── elanlar/
│   │   │   ├── page.tsx
│   │   │   └── moderasiya/page.tsx
│   │   ├── sikayetler/
│   │   ├── magazalar/
│   │   ├── reklamlar/
│   │   ├── bannerler/
│   │   ├── odenisler/
│   │   ├── kateqoriyalar/
│   │   ├── seherler/
│   │   ├── seo/
│   │   ├── blog/
│   │   ├── audit-log/
│   │   ├── statistika/
│   │   ├── parametrler/
│   │   └── komanda/
│   └── api/
│       └── (admin BFF)
│
├── components/
│   ├── data-table/                      # TanStack Table wrapper
│   ├── filters/
│   ├── moderation/                      # TaskCard, BulkActions
│   ├── charts/                          # Recharts wrappers
│   └── forms/
│
├── lib/
│   ├── refine.ts                        # Refine config
│   ├── permissions.ts                   # RBAC client
│   └── queries/                         # TanStack Query keys
│
└── ...
```

## `apps/api` — NestJS

```
api/
├── src/
│   ├── main.ts                          # bootstrap (port 5400)
│   ├── app.module.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── google.strategy.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   └── dto/
│   │   ├── users/
│   │   ├── categories/
│   │   ├── cities/
│   │   ├── listings/
│   │   ├── search/                      # Meilisearch
│   │   ├── media/                       # S3 upload
│   │   ├── chats/                       # WS gateway daxil
│   │   ├── notifications/
│   │   ├── payments/
│   │   ├── promotions/
│   │   ├── shops/
│   │   ├── reviews/
│   │   ├── complaints/
│   │   ├── moderation/
│   │   ├── ads/
│   │   ├── analytics/
│   │   ├── delivery/                    # Faza 3
│   │   ├── escrow/                      # Faza 3
│   │   └── admin/
│   │       └── (admin endpoints, RBAC guard)
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/                     # exception filters
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts
│   │   │   └── audit.interceptor.ts
│   │   ├── pipes/
│   │   ├── guards/
│   │   │   └── roles.guard.ts
│   │   └── middleware/
│   │       └── rate-limit.ts
│   │
│   ├── infra/
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   ├── redis/
│   │   ├── s3/
│   │   ├── meilisearch/
│   │   ├── bullmq/
│   │   └── kafka/                       # Faza 2
│   │
│   ├── config/
│   │   ├── configuration.ts
│   │   └── validation.schema.ts
│   │
│   └── workers/
│       ├── search-indexer.processor.ts
│       ├── email.processor.ts
│       ├── moderation-ai.processor.ts
│       └── notifications.processor.ts
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── nest-cli.json
├── package.json
└── tsconfig.json
```

## `packages/db` — Prisma

```
db/
├── prisma/
│   ├── schema.prisma                    # tam sxem
│   ├── migrations/
│   └── seed/
│       ├── categories.ts
│       ├── cities.ts
│       ├── premium-services.ts
│       └── index.ts
├── src/
│   └── client.ts                        # PrismaClient singleton
└── package.json
```

## `packages/ui` — Dizayn sistem

```
ui/
├── src/
│   ├── components/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── typography.ts
│   └── styles/
│       └── globals.css
├── stories/                             # Storybook
└── package.json
```

## `packages/types`

```
types/
├── src/
│   ├── api/
│   │   ├── auth.ts
│   │   ├── listings.ts
│   │   └── ...
│   ├── enums.ts
│   └── index.ts
└── package.json
```

## `apps/worker` — BullMQ workers

```
worker/
├── src/
│   ├── main.ts
│   ├── queues/
│   │   ├── search-indexer.ts
│   │   ├── email.ts
│   │   ├── image-processing.ts
│   │   ├── moderation-ai.ts
│   │   ├── notifications.ts
│   │   └── analytics-events.ts
│   └── processors/
└── package.json
```

## `infra/`

```
infra/
├── docker/
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   ├── admin.Dockerfile
│   └── worker.Dockerfile
├── compose/
│   ├── docker-compose.yml               # dev (postgres, redis, meili, minio, mailhog)
│   ├── docker-compose.prod.yml
│   └── docker-compose.test.yml
├── k8s/
│   ├── base/
│   │   ├── api-deployment.yaml
│   │   ├── web-deployment.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   └── overlays/
│       ├── staging/
│       └── production/
├── terraform/
│   ├── main.tf
│   ├── postgres.tf
│   ├── redis.tf
│   └── s3.tf
└── helm/
    └── avito-az/
```

## Kök fayllar

### `package.json`
```json
{
  "name": "avito-az",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "type-check": "turbo run type-check",
    "db:migrate": "pnpm --filter @avito/db prisma migrate deploy",
    "db:studio":  "pnpm --filter @avito/db prisma studio",
    "db:seed":    "pnpm --filter @avito/db tsx prisma/seed/index.ts"
  },
  "devDependencies": {
    "turbo": "^2.x",
    "typescript": "^5.x"
  }
}
```

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build":      { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev":        { "cache": false, "persistent": true },
    "lint":       {},
    "test":       { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] }
  }
}
```

### `pnpm-workspace.yaml`
```yaml
packages:
  - apps/*
  - packages/*
```

### `.env.example`
```
# Database
DATABASE_URL=postgres://...
DIRECT_URL=postgres://...

# Redis
REDIS_URL=redis://localhost:6379

# Meilisearch
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=...

# S3
S3_ENDPOINT=...
S3_BUCKET=avito-az-prod
S3_ACCESS_KEY=...
S3_SECRET=...

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Payments
PULPAL_MERCHANT_ID=...
PULPAL_SECRET=...
EPOINT_PUBLIC_KEY=...

# Email
POSTMARK_API_KEY=...

# SMS
ATLAS_API_KEY=...

# Monitoring
SENTRY_DSN=...
```

### `docker-compose.yml` (dev)
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: avito_az
      POSTGRES_USER: avito
      POSTGRES_PASSWORD: avito
    ports: ["5433:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  meilisearch:
    image: getmeili/meilisearch:v1.10
    environment:
      MEILI_MASTER_KEY: dev_master_key
    ports: ["7700:7700"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: avito
      MINIO_ROOT_PASSWORD: avito_secret
    ports: ["9000:9000", "9001:9001"]

  mailhog:
    image: mailhog/mailhog
    ports: ["1025:1025", "8025:8025"]

volumes:
  pgdata:
```

## Kod təşkil prinsipləri

### Naming
- **Komponent fayllar:** `PascalCase.tsx` (`ListingCard.tsx`)
- **Hook fayllar:** `use-*.ts` (`use-listings.ts`)
- **Utility fayllar:** `kebab-case.ts`
- **API route:** `route.ts` (Next.js konvensiya)
- **NestJS:** `*.controller.ts`, `*.service.ts`, `*.module.ts`

### Module barrel
Hər package-də `src/index.ts` — public API (re-export). Daxili modullar başqa packageyə görünmür.

### Path aliases
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@avito/ui":         ["../../packages/ui/src"],
      "@avito/types":      ["../../packages/types/src"],
      "@avito/api-client": ["../../packages/api-client/src"],
      "@avito/db":         ["../../packages/db/src"]
    }
  }
}
```

### Test yerləşdirmə
- Unit test: komponent yanında (`Component.test.tsx`)
- Integration: `tests/integration/`
- E2E: `tests/e2e/` (kök səviyyədə, bütün apps-ı tutur)

## Cəmi
**~17 əsas qovluq · ~95 səhifə · ~120 komponent · 33 DB cədvəl · ~180 API endpoint**
