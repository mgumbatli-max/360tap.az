# Avito.az

Azərbaycan üçün universal elanlar və marketplace platforması. Avito.ru analoqu.

## Memarlıq

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js 15) — port 5401          │
│  /api/* → backend proxy                      │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Backend (Express + Node.js 22) — port 5400  │
│  REST API, JWT auth, file upload             │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  PostgreSQL 16 — DB: avito_az                │
│  (magazam_erp, healthvault-dan ayrı)         │
└─────────────────────────────────────────────┘
```

## İzolasiya

| Komponent | Avito.az | digər layihələr |
|---|---|---|
| Backend port | **5400** | magazam-erp: 3001 · tibbi-app: 3100 |
| Frontend port | **5401** | tibbi-app: 3100 |
| Database | **avito_az** | magazam_erp · healthvault |
| Folder | `~/Projects/Avito.az` | ayrı |

## Quraşdırma

### 1. Backend

```bash
cd backend
npm install
npm run migrate          # DB sxem + seed
npm run seed:hash        # admin parolu (bcrypt)
npm run dev              # http://localhost:5400
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5401
```

## Ətraf mühit (.env)

**Backend** (`backend/.env`):
```
PORT=5400
DATABASE_URL=postgres://mr.maqa@localhost:5432/avito_az
JWT_SECRET=avito_az_super_secret_change_in_prod_2026
CORS_ORIGIN=http://localhost:5401
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=/api
```

## Defolt hesablar

| Rol | Email | Parol |
|---|---|---|
| Admin | admin@avito.az | admin123 |

## API endpointlər

| Metod | URL | Təsvir |
|---|---|---|
| GET | `/api/health` | Sağlamlıq |
| POST | `/api/auth/register` | Qeydiyyat |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Cari istifadəçi |
| GET | `/api/categories` | Kateqoriya ağacı |
| GET | `/api/cities` | Şəhərlər |
| GET | `/api/listings` | Axtarış / siyahı |
| GET | `/api/listings/:id` | Detal |
| POST | `/api/listings` | Yeni elan |
| PATCH | `/api/listings/:id` | Yenilə |
| DELETE | `/api/listings/:id` | Arxivləşdir |
| POST | `/api/listings/:id/favorite` | Sevimliyə əlavə |
| POST | `/api/upload/images` | Şəkil yüklə |
| GET | `/api/listings/me/list` | Mənim elanlarım |

## Frontend səhifələr

- `/` — Ana səhifə (hero, kateqoriyalar, son elanlar)
- `/elanlar` — Axtarış + filtrlər
- `/elanlar/[id]` — Elan detal
- `/elan-yerlesdir` — Yeni elan formu
- `/login`, `/register` — Auth
- `/profil` — İstifadəçi profili + öz elanları

## Texniki tapşırıq

Tam TT: [`TEXNIKI_TAPSIRIQ.md`](./TEXNIKI_TAPSIRIQ.md)

## Stack

**Backend:** Node.js 22 · Express 4 · PostgreSQL 16 · JWT · bcryptjs · zod · multer
**Frontend:** Next.js 15 · React 19 RC · TypeScript · TailwindCSS 3 · Lucide Icons
**DB:** uuid-ossp · pg_trgm · citext extensiyaları

## Növbəti addımlar (Faza 2)

- Real-time chat (WebSocket)
- AI moderasiya (mətn + şəkil)
- Escrow ödəniş (Pulpal/Epoint)
- Push bildiriş (FCM/APNs)
- ElasticSearch axtarış
- Admin panel
- Mobil tətbiqlər (React Native)
