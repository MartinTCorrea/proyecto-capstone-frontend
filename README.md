# SGAOB — Sistema de Gestión de Árbitros y Oficiales de Básquetbol

Proyecto Capstone de Ingeniería en Informática (Duoc UC) para la digitalización y optimización de la gestión de personal técnico deportivo (árbitros y oficiales de mesa).

---

## 1. Stack Tecnológico

- **Frontend:** React + TypeScript + Vite (`apps/web`)
- **Backend:** NestJS + TypeScript (`apps/api`)
- **Base de Datos:** PostgreSQL 16
- **ORM:** Prisma
- **Autenticación:** Azure / Microsoft Entra External ID (OAuth2/OIDC, JWT)
- **Colas Asíncronas:** BullMQ + Redis 7
- **Monorepo:** npm workspaces (`packages/shared`, `apps/api`, `apps/web`)
- **Entorno Local:** Docker Compose (PostgreSQL, Redis, Mailpit)

---

## 2. Estructura del Monorepo

```text
.
├── apps/
│   ├── api/             # Backend NestJS (REST API + Swagger)
│   └── web/             # Frontend React (SPA accesibilidad WCAG)
├── packages/
│   └── shared/          # Contratos TypeScript, enums de dominio y DTOs comunes
├── docker-compose.yml   # Servicios locales (Postgres, Redis, Mailpit)
├── .env.example         # Plantilla de variables de entorno
├── AGENTS.md            # Reglas de negocio y directrices de ingeniería
└── package.json         # Configuración raíz de workspaces
```

---

## 3. Puesta en Marcha en Entorno Local

### Prerrequisitos
- **Node.js**: `>= 20.x` (recomendado v20.x o v24.x)
- **npm**: `>= 10.x`
- **Docker** y **Docker Compose**

### Pasos de Instalación

1. **Clonar e instalar dependencias:**
   ```bash
   git clone <repo-url>
   cd CapstoneMain
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```

3. **Iniciar servicios de infraestructura con Docker Compose:**
   ```bash
   docker compose up -d
   ```
   Esto levantará:
   - PostgreSQL en `localhost:5432`
   - Redis en `localhost:6379`
   - Mailpit (servidor de correo simulado) en `localhost:8025` (Web UI) y `localhost:1025` (SMTP)

4. **Compilar paquetes compartidos:**
   ```bash
   npm run build --workspace=@sgaob/shared
   ```

5. **Iniciar el backend (NestJS en modo desarrollo):**
   ```bash
   npm run start:dev --workspace=@sgaob/api
   ```
   - API: `http://localhost:3000/api`
   - Documentación Swagger: `http://localhost:3000/api/docs`

6. **Iniciar el frontend (React en modo desarrollo):**
   ```bash
   npm run dev --workspace=@sgaob/web
   ```
   - Frontend: `http://localhost:5173`

---

## 4. Scripts Globales del Monorepo

Desde la raíz se pueden ejecutar los siguientes comandos:
- `npm run build`: Compila todos los workspaces en orden de dependencia.
- `npm run test`: Ejecuta la suite de pruebas unitarias.
- `npm run lint`: Valida tipos y reglas de estilo.
- `npm run format`: Formatea el código con Prettier.

---

## 5. Reglas de Contribución y Calidad

- **TypeScript Strict:** No usar `any`. Modo estricto activado en todos los proyectos.
- **Conventional Commits:** Seguir formato `feat:`, `fix:`, `docs:`, `setup:`, `refactor:`, `test:`.
- **Arquitectura Modular en NestJS:** Patrón `controller → service → repository`.
- **Migraciones versionadas con Prisma:** Nunca `synchronize: true`.

