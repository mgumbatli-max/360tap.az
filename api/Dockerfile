# 360tap.az API (NestJS) — production image
# node:20-slim (glibc) → sharp/argon2 prebuild + Prisma openssl uyğunluğu

# ---- builder ----
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
# builder ilə eyni platforma → native modullar (sharp/argon2) uyğundur
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
EXPOSE 5500

# ---- Faza 0: startup zənciri ----
# ƏVVƏL: `migrate deploy && (seed) && node dist/main.js`
#   → `&&` səbəbindən migrasiya uğursuz olanda VƏ YA asılı qalanda `node dist/main.js`
#     HEÇ VAXT işə düşmürdü; konteyner çıxırdı, Render restart döngəsinə düşürdü və
#     HTTP server heç vaxt `listen()`-ə çatmırdı (bütün API, /health daxil, timeout verirdi).
#   → Həmçinin `prisma:seed` HƏR başlanğıcda production DB-də deleteMany/cleanupTestData
#     icra edirdi (destruktiv).
#
# İNDİ:
#   · `;` → migrasiya nəticəsindən ASILI OLMADAN app qalxır (graceful degradation;
#     DB vəziyyəti /health/ready-də görünür).
#   · `timeout 120` → migrasiya sonsuz asıla bilməz.
#   · seed CMD-dən ÇIXARILDI — manual/one-off job kimi işlədilməlidir:
#       render → Shell:  npm run prisma:seed
#   · `exec` → node PID 1 olur və SIGTERM-i alır (enableShutdownHooks düzgün işləsin).
#   · `timeout` mövcud deyilsə (bəzi minimal image-lərdə) migrasiya YENƏ DƏ işləyir —
#     sadəcə vaxt həddi olmadan; hər halda app başlayır.
CMD ["sh", "-c", "if command -v timeout >/dev/null 2>&1; then timeout 120 npx prisma migrate deploy || echo '[boot] prisma migrate deploy UGURSUZ/TIMEOUT - API degraded rejimde baslayir (bax /health/ready)'; else npx prisma migrate deploy || echo '[boot] prisma migrate deploy UGURSUZ - API degraded rejimde baslayir (bax /health/ready)'; fi; exec node dist/main.js"]
