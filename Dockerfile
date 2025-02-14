# === BASE IMAGE ===
FROM node:22-alpine AS base

# === DEPENDENCIES ===
FROM base AS dependencies

RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# === BUILD ===
FROM base AS build

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# === PRODUCTION ===
FROM base AS production

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma

COPY --from=build --chown=nestjs:nodejs /app/dist ./dist

EXPOSE 3000
CMD ["./migrate-and-start.sh"]

# === DEVELOPMENT ===
FROM base AS development

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY . .

COPY --from=dependencies /app/node_modules ./node_modules

EXPOSE 3000
CMD sh -c "npx prisma migrate deploy && npm run start:prod"
