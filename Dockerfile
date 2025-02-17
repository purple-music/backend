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

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs --ingroup nodejs
USER nestjs

RUN npm ci --omit=dev && npm cache clean --force

ENV NODE_ENV production

COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma

COPY --from=build --chown=nestjs:nodejs /app/dist ./dist

# Copy package.json and package-lock.json
COPY --from=dependencies --chown=nestjs:nodejs /app/package*.json ./

# Copy build dependencies
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]

# === DEVELOPMENT ===
FROM base AS development

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs --ingroup nodejs
USER nestjs

COPY . .

COPY --from=dependencies /app/node_modules ./node_modules

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:dev"]
