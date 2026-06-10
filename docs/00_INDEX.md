# Avito.az — Layihə Sənəd Paketi

**Versiya:** 1.0 · **Tarix:** 2026-05-08 · **Status:** Layihə bazası

| № | Sənəd | Təsvir |
|---|---|---|
| 01 | [Arxitektura](./01_architecture.md) | HLA, stack, mikroservis, ölçəkləmə |
| 02 | [Verilənlər bazası](./02_database_schema.md) | Tam Prisma sxem, 30+ cədvəl |
| 03 | [Səhifələr](./03_pages.md) | Bütün veb səhifələrin xəritəsi |
| 04 | [Komponentlər](./04_components.md) | UI komponent ağacı və atomic dizayn |
| 05 | [API](./05_api_endpoints.md) | REST endpoint spesifikasiyası |
| 06 | [Admin Panel](./06_admin_panel.md) | RBAC, modullar, əməliyyatlar |
| 07 | [MVP Plan](./07_mvp_plan.md) | MVP scope, qəbul meyarları |
| 08 | [Sprint Plan](./08_sprint_plan.md) | 12 sprint, 24 həftə |
| 09 | [UX Flow](./09_ux_flow.md) | İstifadəçi və admin axınları |
| 10 | [Folder Structure](./10_folder_structure.md) | Monorepo struktur, kod təşkili |

## Texnologiya stack özəti
- **Frontend:** Next.js 15 (App Router, RSC, ISR)
- **Backend:** NestJS 10 (modular, Prisma, REST + WebSocket)
- **DB:** PostgreSQL 16 + Prisma ORM
- **Cache:** Redis 7 (sessions, rate-limit, queue)
- **Search:** Meilisearch (MVP) → Elasticsearch (scale)
- **Storage:** S3-compatible (MinIO local, AWS S3 prod)
- **Auth:** JWT + NextAuth (OAuth providers)
- **Queue:** BullMQ (Redis əsaslı)
- **Real-time:** Socket.io
- **Monorepo:** Turborepo
- **Mobile-ready:** Next.js PWA → React Native (Faza 3)
