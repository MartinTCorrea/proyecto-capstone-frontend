# ==============================================================================
# SGAOB Backend API — Production Multi-stage Dockerfile (Paso 9 - Optimización)
# ==============================================================================

# Etapa 1: Construcción y generación de artefactos
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos para aprovechar caché de capas Docker
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm ci

# Copiar código fuente
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Compilar Shared Library y generar Prisma Client
RUN npm run build --prefix packages/shared
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Etapa 2: Imagen mínima de Producción
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Usuario no privilegiado para compliance de seguridad
USER node

# Copiar paquetes y artefactos compilados requeridos para ejecución
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --chown=node:node --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --chown=node:node --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --chown=node:node --from=builder /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main"]
