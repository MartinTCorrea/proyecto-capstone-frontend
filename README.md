# SGAOB — Sistema de Gestión de Árbitros y Oficiales de Básquetbol

![Status](https://img.shields.io/badge/Status-100%25%20Completed-brightgreen)
![Tests](https://img.shields.io/badge/Tests-191%20Passing-success)
![Coverage](https://img.shields.io/badge/Functional%20Requirements-RF01--RF20%20(100%25)-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![AWS](https://img.shields.io/badge/AWS-API%20Gateway%20%7C%20Cognito%20%7C%20EC2-orange)
![Vercel](https://img.shields.io/badge/Frontend-Vercel%20Edge%20CDN-black)

Plataforma integral web para la digitalización, sincronización y optimización operativa de la gestión de árbitros y oficiales de mesa en el básquetbol chileno.

**Proyecto Capstone de Ingeniería en Informática — Escuela de Informática y Telecomunicaciones, Duoc UC.**

---

## 1. Diagrama de Arquitectura del Sistema

El sistema implementa una arquitectura híbrida desacoplada de alta disponibilidad y latencia reducida:

```mermaid
graph TD
    subgraph Client["1. Capa de Clientes"]
        Browser["Navegador Web / Mobile\n(SPA React 18 + Vite)"]
    end

    subgraph FrontendPlatform["2. Plataforma Frontend (Vercel Edge CDN)"]
        VercelCDN["Vercel Global Edge Network\n• Single Page Application (SPA)\n• Enrutamiento con vercel.json\n• Despliegue continuo desde GitHub"]
    end

    subgraph AWSCloud["3. Amazon Web Services (AWS Academy Lab - us-east-1)"]
        Cognito["Amazon Cognito User Pool\n• Emisión y verificación de tokens JWT\n• Allowed Callback URLs hacia Vercel"]
        APIGW["Amazon API Gateway (HTTP API v2)\n• Enrutamiento proxy: /{proxy+}\n• Manejo nativo de CORS\n• Enmascaramiento de la IP del servidor"]
        
        subgraph EC2["Instancia AWS EC2 (Docker Compose)"]
            NestAPI["Backend NestJS 10 (Puerto 3000)\n• Prefijo: /api\n• Swagger: /api/docs\n• CORS Dinámico"]
            Postgres[("PostgreSQL 16\n(Prisma ORM)")]
            Redis[("Redis 7\n(Colas BullMQ)")]
            Mailpit["Mailpit SMTP (Emulador de Correo)"]
            
            NestAPI --> Postgres
            NestAPI --> Redis
            NestAPI --> Mailpit
        end
        
        APIGW -->|Proxy HTTP puerto 3000| NestAPI
        NestAPI -->|Valida firma JWT con JWKS| Cognito
    end

    subgraph ExternalPlatforms["4. Plataformas Externas"]
        SwishAPI["Plataformas Swish / NBN23 (Sandbox $0)"]
    end

    Browser -->|1. Carga SPA estática| VercelCDN
    Browser -->|2. Login / Autenticación| Cognito
    Cognito -->|3. Retorna Bearer JWT| Browser
    Browser -->|4. Peticiones REST con Bearer JWT| APIGW
    NestAPI -->|Sincronización Asíncrona| SwishAPI
```

---

## 2. Módulos y Requerimientos Funcionales (RF01 - RF20)

| Módulo | Casos de Uso | Requerimientos | Capacidades Principales |
|---|---|---|---|
| **1. Seguridad y Usuarios** | CU-01, CU-02 | **RF01, RF02, RF03** | Autenticación agnóstica (Amazon Cognito / JWT), registro formal de consentimiento de datos personales con IP/timestamp, gestión de perfiles y estados de cuenta (`ACTIVE`, `INACTIVE`, `PENDING_ROLE`), y **separación estricta de roles técnicos (Árbitro vs Oficial de Mesa, Anexo A.1)**. |
| **2. Disponibilidad** | CU-03, CU-04 | **RF04, RF05, RF06** | Declaración masiva semanal por bloques (`HORARIO_1`, `HORARIO_2`, `FULL`, `NO`), validación automática de regla de cierre (Miércoles 23:59), bloques parametrizados según día hábil o fin de semana (**Anexo A.4**) y consolidado administrativo para la Comisión Técnica. |
| **3. Integración y Sincronización** | CU-05, CU-06 | **RF07, RF08, RF09, RF10** | Cartelera unificada de partidos, creación manual autónoma, prueba de conectividad y sincronización asíncrona mediante **BullMQ y Redis** contra Swish y NBN23 (entorno Sandbox sin costo), y detección de reprogramaciones con alerta automática al personal designado (**RF10**). |
| **4. Nominaciones y Asignaciones** | CU-07, CU-08 | **RF11, RF12, RF13, RF14, RF15, RF16** | Cruce algorítmico inteligente (filtro por disponibilidad declarada, topes de horario y exclusión estricta de roles incorrectos), soporte para **modalidad de 3 árbitros (Anexo A.2)**, alertas por correo, confirmación o rechazo justificado y grilla interactiva de visualización. |
| **5. Información y Recursos** | CU-09, CU-10 | **RF17, RF18, RF19, RF20** | Repositorio oficial de bases y reglamentos FIBA en PDF (**RF17**), **Bóveda segura de credenciales API forzando visibilidad ADMIN (Anexo A.5)** con enmascaramiento UI (**RF18**), tablón de comunicados en vivo (**RF19**) y **exportación oficial de asignaciones en formato CSV con BOM UTF-8 para Microsoft Excel (RF20)**. |

---

## 3. Estructura del Monorepo

```text
.
├── apps/
│   ├── api/                     # Backend NestJS 10 (TypeScript Strict)
│   │   ├── prisma/              # Esquema relacional, migraciones versionadas y seeds
│   │   ├── src/                 # Controladores, servicios, DTOs, guards y exception filters
│   │   ├── test/                # Pruebas e2e (app.e2e-spec.ts y pilot-validation.e2e-spec.ts)
│   │   └── Dockerfile           # Imagen Docker multi-stage optimizada para producción
│   └── web/                     # Frontend React 18 + Vite (SPA)
│       ├── src/                 # Componentes modulares, hooks, páginas lazy y cliente API
│       ├── vercel.json          # Configuración de reescritura de rutas SPA en Vercel
│       └── Dockerfile           # Imagen Docker multi-stage (opcional para entornos locales)
├── packages/
│   └── shared/                  # Contratos de dominio, enums y tipos compartidos
├── docs/                        # Informes de avance PR1–PR20 y manuales operativos
├── docker-compose.yml           # Infraestructura local (Postgres, Redis, Mailpit)
├── docker-compose.prod.yml      # Pila optimizada de producción (API, Postgres, Redis, Mailpit)
├── .env.example                 # Plantilla de variables de entorno del sistema
└── README.md                    # Documentación principal del repositorio
```

---

## 4. Puesta en Marcha

### Prerrequisitos
- **Node.js:** `>= 20.x`
- **npm:** `>= 10.x`
- **Docker & Docker Compose**

---

### Opción A: Modo Desarrollo Rápido (Local)

1. **Clonar e instalar dependencias del monorepo:**
   ```bash
   git clone https://github.com/MartinTCorrea/proyectocapstone.git
   cd proyectocapstone
   npm install
   ```

2. **Configurar el entorno:**
   ```bash
   cp .env.example .env
   ```

3. **Iniciar los servicios base en Docker:**
   ```bash
   docker compose up -d
   ```
   *Servicios levantados: PostgreSQL (5432), Redis (6379), Mailpit SMTP (1025) y Web UI (8025).*

4. **Compilar la librería compartida:**
   ```bash
   npm run build --prefix packages/shared
   ```

5. **Aplicar migraciones de base de datos:**
   ```bash
   npm run prisma:migrate --prefix apps/api
   ```

6. **Iniciar el Backend (NestJS):**
   ```bash
   npm run start:dev --prefix apps/api
   ```
   - API REST: `http://localhost:3000/api`
   - Documentación Interactiva Swagger: `http://localhost:3000/api/docs`

7. **Iniciar el Frontend (React + Vite):**
   ```bash
   npm run dev --prefix apps/web
   ```
   - Interfaz Web: `http://localhost:5173`

---

### Opción B: Despliegue Híbrido en Producción (Vercel + Amazon API Gateway + AWS EC2)

Consulta la guía detallada paso a paso en:  
👉 [`docs/guia-despliegue-vercel-aws-apigateway.md`](docs/guia-despliegue-vercel-aws-apigateway.md)

1. **Backend en AWS EC2:**
   ```bash
   sudo docker compose -f docker-compose.prod.yml up --build -d
   sudo docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy
   sudo docker compose -f docker-compose.prod.yml exec -T api npm run prisma:seed
   ```
2. **Amazon API Gateway (HTTP API v2):**
   Configurado con integración proxy `http://<IP_EC2>:3000/{proxy}` y CORS habilitado.
3. **Frontend en Vercel:**
   Conectado al repositorio GitHub con build command `npm run build:web` y variable `VITE_API_URL` apuntando al Gateway.

---

## 5. Credenciales de Prueba y Selector de Roles

La aplicación incluye un componente interactivo (**DevAuthSwitcher**) que permite autenticarse instantáneamente sin depender de servicios externos de identidad:

| Perfil de Prueba | Correo Electrónico | Rol Asignado | Capacidades |
|---|---|---|---|
| **Comisión Técnica (Admin)** | `admin.comision@sgaob.cl` | `ADMIN_COMISION_TECNICA` | Gestión completa de usuarios, creación de partidos, cruce de ternas, bóveda de credenciales y exportación a Excel. |
| **Árbitro Principal** | `arbitro.principal@sgaob.cl` | `ARBITRO` | Declaración de disponibilidad, recepción y confirmación/rechazo de designaciones arbitrales, descarga de reglamentos. |
| **Árbitro Secundario** | `arbitro.asistente@sgaob.cl` | `ARBITRO` | Declaración horaria, respuesta a nominaciones de slot Árbitro 1 o 2. |
| **Oficial de Mesa** | `oficial.mesa@sgaob.cl` | `OFICIAL_MESA` | Declaración horaria, asignación exclusiva a puestos de mesa técnica (Anotador, Cronometrador, 24 seg). |

---

## 6. Aseguramiento de Calidad y Pruebas Automatizadas

El proyecto cuenta con un total de **191 pruebas automatizadas aprobadas al 100%**:

### 1. Pruebas Unitarias del Backend (128 tests en 18 suites)
```bash
npm run test --prefix apps/api
```
*Cubre toda la lógica de negocio: cruce de disponibilidad, cálculo de bloques por tipo de día, separación de roles, notificaciones, filtros de excepciones y auditoría.*

### 2. Pruebas de Integración y Simulación Piloto E2E (63 tests en 2 suites)
```bash
npm run test:e2e --prefix apps/api
```
*Ejecuta contra PostgreSQL la suite base y la simulación piloto del ciclo completo de un torneo (CU-01 a CU-10).*

### 3. Verificación Estricta de Tipos y Linters (0 errores)
```bash
npx tsc --noEmit -p apps/api/tsconfig.json
npm run lint --prefix apps/web
```

### 4. Compilación del Frontend para Vercel
```bash
npm run build:web
```

---

## 7. Documentación Técnica del Proyecto

En el directorio [`/docs`](docs/) se encuentran los informes detallados de cada hito:

- [`docs/guia-despliegue-vercel-aws-apigateway.md`](docs/guia-despliegue-vercel-aws-apigateway.md): **Guía Operativa de Despliegue Híbrido**.
- [`docs/avance-pr20.md`](docs/avance-pr20.md): Reporte del Desacople Arquitectónico Híbrido y Amazon API Gateway.
- [`docs/informe-final-capstone.md`](docs/informe-final-capstone.md): **Informe Académico Final de Cierre**.
- [`docs/avance-pr19.md`](docs/avance-pr19.md): Reporte de Modernización Integral Frontend y Standalone SaaS.
- [`docs/arquitectura-estilos-frontend.md`](docs/arquitectura-estilos-frontend.md): Guía de diseño modular de interfaces.
- Informes de avance progresivo: `avance-pr1-pr2.md` a `avance-pr18.md`.

---

## 8. Equipo de Desarrollo (Duoc UC)

- **Esteban Fuentes**
- **Javier Sanchez**
- **Martín Troncoso**
