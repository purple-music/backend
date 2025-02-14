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

COPY --chown=nestjs:nodejs migrate-and-start.sh ./
RUN chmod +x migrate-and-start.sh

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
COPY --from=dependencies /root/.npm /root/.npm

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
