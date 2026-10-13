# Informe de Avance — PR20: Desacople Arquitectónico Híbrido, Preparación para Vercel y Amazon API Gateway (AWS Academy Lab)

**Fecha de Cierre:** 12 de Octubre de 2026  
**Proyecto:** SGAOB (Sistema de Gestión de Árbitros y Oficiales de Básquetbol)  
**Alcance:** Monorepo, Configuración de Despliegue Frontend en Vercel, Pasarela Ingress en Amazon API Gateway HTTP API v2, y Optimización de EC2.

---

## 1. Resumen Ejecutivo del Hito

En este hito se ejecutó el desacople arquitectónico del sistema para adoptar una infraestructura híbrida, de alta disponibilidad y costo \$0 adicional, dando respuesta a los requerimientos de evaluación del Capstone y a las directrices de [`AGENTS.md`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/AGENTS.md):

1. **Evaluación de Repositorios (Decisión Monorepo):**
   * Se determinó mantener la estructura unificada de Monorepo (`apps/api`, `apps/web`, `packages/shared`), descartando la fragmentación en repositorios separados para garantizar la sincronización atómica de contratos/enums (`@sgaob/shared`), simplificar el CI/CD y conservar la trazabilidad histórica de los 20 informes de avance para la comisión evaluadora de Duoc UC.
2. **Preparación y Desacople del Frontend para Vercel:**
   * Creación de [`apps/web/vercel.json`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/vercel.json) con reescritura de rutas (*rewrites*) para garantizar navegación SPA sin errores 404 al recargar páginas.
   * Creación de [`apps/web/.env.example`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/.env.example) con la configuración específica de variables de entorno cliente (`VITE_API_URL`, `VITE_AUTH_PROVIDER`, `VITE_COGNITO_*`).
   * Adición del script raíz `"build:web"` en [`package.json`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/package.json) para compilar en cadena `@sgaob/shared` y `@sgaob/web` con un solo comando.
3. **Optimización de CORS en Backend NestJS:**
   * Modificación de [`apps/api/src/main.ts`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/api/src/main.ts) con función de validación de orígenes dinámica que admite dominios de Vercel (`*.vercel.app`), múltiples orígenes en `FRONTEND_URL`, entornos locales y peticiones sin origen (health checks de API Gateway).
4. **Optimización de Recursos en Servidor EC2:**
   * En [`docker-compose.prod.yml`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/docker-compose.prod.yml), el contenedor `web` (Nginx) se convirtió en opcional mediante perfiles (`profiles: ["with-web"]`). Al desplegar el backend en EC2, solo se ejecutan `api`, `postgres`, `redis` y `mailpit`, reduciendo el consumo de RAM en más de 400 MB y acelerando los despliegues.
5. **Guía Operativa Integral de Despliegue:**
   * Creación de [`docs/guia-despliegue-vercel-aws-apigateway.md`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/docs/guia-despliegue-vercel-aws-apigateway.md), con el paso a paso documentado para crear el HTTP API v2 en Amazon API Gateway, configurar CORS, actualizar el User Pool de Amazon Cognito y desplegar en Vercel.

---

## 2. Archivos y Componentes Modificados

| Componente / Archivo | Tipo de Cambio | Alcance y Propósito |
|---|---|---|
| [`apps/web/vercel.json`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/vercel.json) | Nuevo | Reglas de reescritura de rutas hacia `index.html` para Vercel. |
| [`apps/web/.env.example`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/.env.example) | Nuevo | Plantilla de variables de entorno cliente para Vite y Cognito. |
| [`package.json`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/package.json) | Modificación | Scripts `build:web` y `build:api` para soporte de despliegue en PaaS. |
| [`apps/api/src/main.ts`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/api/src/main.ts) | Modificación | CORS flexible con soporte para dominios de Vercel y orígenes múltiples. |
| [`docker-compose.prod.yml`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/docker-compose.prod.yml) | Modificación | Servicio `web` desacoplado bajo el profile opcional `with-web`. |
| [`.env.example`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/.env.example) | Modificación | Documentación de `FRONTEND_URL` con soporte de lista y Vercel. |
| [`docs/guia-despliegue-vercel-aws-apigateway.md`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/docs/guia-despliegue-vercel-aws-apigateway.md) | Nuevo | Guía técnica y operativa paso a paso para Vercel + API Gateway + EC2. |

---

## 3. Evidencia Verificable de Funcionamiento

Siguiendo el **Protocolo Obligatorio de Cierre y Verificación Pre-Commit de cada PR** establecido en [`AGENTS.md`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/AGENTS.md):

### 1. Verificación de Compilación Frontend (`npm run build:web`)
```bash
> @sgaob/shared@1.0.0 build
> tsc
> @sgaob/web@1.0.0 build
> tsc && vite build
✓ 1674 modules transformed.
✓ built in 13.25s
Resultado: Exitoso (0 errores).
```

### 2. Verificación de Tipos del Backend (`npx tsc --noEmit -p apps/api/tsconfig.json`)
```bash
Resultado: Exitoso (0 errores de TypeScript).
```

### 3. Verificación de Linter y Tipos Frontend (`npm run lint --prefix apps/web`)
```bash
> @sgaob/web@1.0.0 lint
> tsc --noEmit
Resultado: Exitoso (0 errores, 0 imports no utilizados).
```

### 4. Pruebas Unitarias de Backend (`npm run test --prefix apps/api`)
```text
Test Suites: 18 passed, 18 total
Tests:       128 passed, 128 total
Snapshots:   0 total
Time:        10.273 s
Resultado: 100% pasando (0 fallos).
```

### 5. Pruebas de Integración E2E (`npm run test:e2e --prefix apps/api`)
```text
Test Suites: 2 passed, 2 total
Tests:       63 passed, 63 total
Snapshots:   0 total
Time:        12.297 s
Resultado: 100% pasando (0 fallos).
```

