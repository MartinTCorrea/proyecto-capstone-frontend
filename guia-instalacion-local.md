# Guía de Puesta en Marcha Local — SGAOB

Sistema de Gestión de Árbitros y Oficiales de Básquetbol (SGAOB) — Monorepo.

Esta guía detalla paso a paso cómo clonar, configurar, inicializar la base de datos y ejecutar tanto el backend como el frontend en un entorno de desarrollo local desde cero.

---

## 1. Servicios y Arquitectura Local

| Servicio | Tipo / Tecnología | Puerto / URL | Descripción |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | React 18 + Vite + TS | [http://localhost:5173](http://localhost:5173) | SPA de administración y gestión |
| **Backend API** | NestJS 10 + TS | [http://localhost:3000/api](http://localhost:3000/api) | API REST del sistema |
| **Swagger UI** | OpenAPI 3.0 | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) | Documentación interactiva de endpoints |
| **Base de Datos** | PostgreSQL 16 | `localhost:5432` | Base de datos relacional principal (`sgaob_db`) |
| **Caché / Colas** | Redis 7 | `localhost:6379` | Broker para colas de trabajo con BullMQ |
| **Correo Local** | Mailpit (Web UI / SMTP) | [http://localhost:8025](http://localhost:8025) / `1025` | Servidor SMTP simulado para desarrollo |

---

## 2. Prerrequisitos

Antes de comenzar, asegúrate de tener instalado en tu equipo:
- **Node.js**: `>= 20.x` (se recomienda v20.x o v24.x LTS).
- **npm**: `>= 10.x`.
- **Docker** y **Docker Desktop** (en ejecución).
- **Git**.

---

## 3. Pasos de Instalación y Activación

### Paso 1: Clonar el repositorio e instalar dependencias

Abre una terminal (PowerShell, Bash o Zsh) y ejecuta:

```bash
git clone <URL_DEL_REPOSITORIO>
cd proyectocapstone
npm install
```

---

### Paso 2: Configurar variables de entorno

Copia el archivo de ejemplo `.env.example` a `.env` en la raíz del proyecto:

- **En Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
- **En Linux / macOS / Git Bash:**
  ```bash
  cp .env.example .env
  ```

> **Nota:** La configuración predeterminada de `.env` ya viene lista para conectarse a los contenedores de Docker locales (`localhost:5432` para PostgreSQL y `localhost:6379` para Redis).

---

### Paso 3: Levantar contenedores con Docker Compose

Inicia PostgreSQL, Redis y Mailpit:

```bash
docker compose up -d
```

Verifica que los tres servicios estén corriendo y en estado `healthy`:
```bash
docker ps
```

---

### Paso 4: Compilar paquetes compartidos (`@sgaob/shared`)

El monorepo cuenta con un paquete compartido (`packages/shared`) que contiene contratos, tipos y enums utilizados por la API y el frontend. Debe compilarse antes de iniciar los servicios:

```bash
npm run build --workspace=@sgaob/shared
```

---

### Paso 5: Generar cliente de Prisma, aplicar migraciones y poblar datos

Ejecuta los siguientes comandos desde la raíz del proyecto para sincronizar la base de datos:

1. **Generar el cliente de Prisma:**
   ```bash
   npm run prisma:generate --workspace=@sgaob/api
   ```

2. **Aplicar las migraciones versionadas en PostgreSQL:**
   ```bash
   npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma
   ```

3. **Poblar roles y configuraciones iniciales (Seed):**
   ```bash
   npm run prisma:seed --workspace=@sgaob/api
   ```
   > Este comando registrará los roles base (`ADMIN_COMISION_TECNICA`, `ARBITRO`, `OFICIAL_MESA`) y la configuración de bloques horarios oficiales.

---

### Paso 6: Iniciar Backend y Frontend

Se recomienda abrir dos terminales independientes en la raíz del proyecto:

#### Terminal 1 — Backend (NestJS en modo observación/desarrollo):
```bash
npm run start:dev --workspace=@sgaob/api
```
- API REST: [http://localhost:3000/api](http://localhost:3000/api)
- Swagger Docs: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

#### Terminal 2 — Frontend (React + Vite):
```bash
npm run dev --workspace=@sgaob/web
```
- Aplicación Web: [http://localhost:5173](http://localhost:5173)

---

## 4. Comandos Globales y de Utilidad

### Visualizador de Base de Datos (Prisma Studio)
Para explorar y editar datos de forma visual e interactiva en el navegador:
```bash
npx prisma studio --schema=./apps/api/prisma/schema.prisma
```
Abre automáticamente [http://localhost:5555](http://localhost:5555).

### Detener los servicios de Docker
```bash
docker compose down
```
Para detener y eliminar también los volúmenes de datos:
```bash
docker compose down -v
```

### Construcción completa para producción
```bash
npm run build
```

### Validar linter y formato
```bash
npm run lint
npm run format:check
```

---

## 5. Solución de Problemas Comunes

1. **Error `listen EADDRINUSE: address already in use :::3000` o `:::5173`:**
   - Hay otra instancia previa ejecutándose en ese puerto.
   - En Windows, identifica el proceso con:
     ```powershell
     Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object OwningProcess
     ```
   - Puedes detenerlo con `Stop-Process -Id <PID> -Force`.

2. **Error de conexión a PostgreSQL (`Can't reach database server`):**
   - Asegúrate de que Docker Desktop esté abierto y corriendo.
   - Ejecuta `docker compose ps` para comprobar si el contenedor `sgaob-postgres` está en estado `Up (healthy)`.
   - Si no está activo, ejecútalo nuevamente con `docker compose up -d`.

