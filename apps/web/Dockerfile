# ==============================================================================
# SGAOB Frontend Web — Production Multi-stage Dockerfile (Paso 9 - Optimización)
# ==============================================================================

# Etapa 1: Compilación de la aplicación React + Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN npm ci

# Copiar código fuente
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Compilar Shared Library y Frontend SPA
RUN npm run build --prefix packages/shared
WORKDIR /app/apps/web
RUN npm run build

# Etapa 2: Servidor web ligero Nginx Alpine
FROM nginx:alpine AS runner

# Copiar configuración personalizada optimizada
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos HTML/CSS/JS generados
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
