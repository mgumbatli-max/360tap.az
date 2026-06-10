# 360tap.az — Deploy Runbook

> Hazırlanmış artefaktlar: `api/Dockerfile`, `render.yaml`, `frontend` (Vercel-ready, `API_ORIGIN` env).
> Aşağıdakı addımlar **interaktiv hesab girişi** tələb edir (mən onları sizin əvəzinizə edə bilmərəm).

## Arxitektura

```
Vercel (frontend, Next.js)  ──/api/* rewrite──►  Render (NestJS API)
                                                   ├─ Postgres (managed)
                                                   ├─ Redis (Key Value)
                                                   └─ Meilisearch (private service)
```

> ⚠️ **Vəziyyət qeydləri:**
> - Backend miqrasiyası (Express→NestJS) **davam edir**. Production-da frontend yalnız NestJS endpoint-lərinə bağlanır (geo, search, listings, stores, auth, media, ERP). Express-ə qalan funksiyalar (chat, bəzi köhnə route-lar) deploy olunmur.
> - Media Faza 1-də **yerli diskdir (ephemeral)** — Render-də restart-da itir. Production üçün S3/R2 lazımdır (Faza 1.5).

---

## Addım 1 — GitHub-a push

```bash
# Bir dəfə: GitHub girişi (interaktiv, brauzer)
gh auth login        # GitHub.com → HTTPS → web browser

# Private repo yarat + remote + push (mən bunu sizin üçün edə bilərəm giriş olandan sonra)
gh repo create 360tap-az --private --source=. --remote=origin --push
```

Token alternativi (brauzersiz):
```bash
echo "<GITHUB_PAT>" | gh auth login --with-token
```

## Addım 2 — Backend (Render Blueprint)

1. https://dashboard.render.com → **New → Blueprint**.
2. GitHub repo-nu (`360tap-az`) bağla. Render `render.yaml`-ı oxuyur.
3. Provision olunur: `tap360-db` (Postgres), `tap360-redis`, `tap360-meili`, `tap360-api`.
4. `tap360-api` env-lərində **`CORS_ORIGINS`** = (Vercel domeni, Addım 3-dən sonra) və **`MEDIA_BASE_URL`** = `https://<api>.onrender.com/uploads` təyin et.
5. İlk deploy `prisma migrate deploy` işlədir (Dockerfile CMD). Sonra seed:
   ```bash
   # Render Shell (tap360-api) və ya lokal DATABASE_URL ilə:
   npm run prisma:seed
   ```
6. Yoxla: `https://<api>.onrender.com/health` → `{"ok":true}`.

> Meilisearch host private service kimi `http://tap360-meili:7700` daxili adı ilə əlçatandır.

## Addım 3 — Frontend (Vercel)

1. https://vercel.com → **Add New → Project** → GitHub repo-nu import et.
2. **Root Directory:** `frontend`.
3. Framework: Next.js (avtomatik). Build: `next build`.
4. **Environment Variables:**
   - `API_ORIGIN` = `https://<api>.onrender.com`  (rewrites bütün `/api/*`-ı bura yönəldir)
   - `NEXT_PUBLIC_SITE_URL` = `https://360tap-az.vercel.app`
5. Deploy. URL alındıqdan sonra Render-də `CORS_ORIGINS`-ə həmin Vercel domenini əlavə et (Addım 2.4).

## Addım 4 — Yoxlama

```bash
curl https://360tap-az.vercel.app/api/health           # → NestJS health (Vercel proxy)
curl https://360tap-az.vercel.app/api/geo/regions      # → 15 region
# Brauzerdə ana səhifə + region browsing + axtarış
```

---

## Production sərtləşdirmə (Faza 1.5, deploy-dan sonra)

- **Media → S3/R2** (yerli disk ephemeral). `MediaService`-i S3 client-ə keç.
- **Meilisearch master key** + production rejim (artıq blueprint-də).
- **Migrasiya tamamla**: qalan Express route-larını NestJS-ə köçür və ya Express-i ayrıca deploy et.
- **Backup**: Postgres avtomatik backup planı.
- **Monitoring/log**: Render logs + error tracking (Sentry).
- **Domain**: 360tap.az → Vercel + api.360tap.az → Render.
