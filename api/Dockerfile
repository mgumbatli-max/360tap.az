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
# Migrasiya + seed (idempotent, xəta app-ı qırmır) + başlat
CMD ["sh", "-c", "npx prisma migrate deploy && (npm run prisma:seed || echo 'seed skipped') && node dist/main.js"]
