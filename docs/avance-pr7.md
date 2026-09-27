# SGAOB — Documento de Avance de Proyecto: PR7
**Sistema de Gestión de Árbitros y Oficiales de Básquetbol**  
**Proyecto Capstone — Ingeniería en Informática, Duoc UC**  
**Hito:** Módulo 2 (Disponibilidad) — Declaración Masiva Semanal, Validación de Plazo de Cierre (Miércoles 23:59), Configuración de Bloques y Consolidado Administrativo (Backend)  
**Fecha de corte:** Septiembre 2026  
**Equipo de desarrollo:** SGAOB Team  

---

## 1. Resumen Ejecutivo

El presente informe documenta formalmente la finalización del Pull Request **PR7** (`feat(api/availability)` — Commit `e61bbae`), que inaugura la implementación del **Módulo 2: Disponibilidad** en la capa backend de la API REST ([`apps/api`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/api)).

En esta etapa se implementó la lógica de negocio que permite a los árbitros y oficiales de mesa declarar sus bloques de disponibilidad para la semana calendario (RF04), la validación estricta y automatizada del plazo de cierre semanal fijado los **miércoles a las 23:59:59** con soporte de excepción administrativa por fuerza mayor (RF05), la gestión de parámetros de bloques horarios (Anexo A.4), y la generación del consolidado de disponibilidad para la programación de partidos por parte de la Comisión Técnica (RF06).

### Alcance Real Ejecutado
- **Módulo de Disponibilidad ([`AvailabilityModule`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/api/src/modules/availability/availability.module.ts)):** Módulo NestJS registrado en [`AppModule`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/api/src/app.module.ts) que integra `AvailabilityController`, `AvailabilityService` y el servicio global de auditoría.
- **Parametrización de Bloques Horarios (Anexo A.4):** Endpoints para consultar (`GET /api/availability/blocks`) y actualizar (`PATCH /api/availability/blocks/:id`) los límites horarios de los bloques `HORARIO_1` y `HORARIO_2` en días laborales y fines de semana.
- **Declaración Masiva con Control de Plazo (RF04, RF05):** Endpoint `POST /api/availability/bulk` con transacción atómica de *upsert* en PostgreSQL sobre la restricción única `[userId, date]`. Aplica el algoritmo de cálculo de fecha límite (`getDeadlineForDate`) rechazando fechas vencidas (`400 Bad Request`) salvo que un Administrador de Comisión Técnica ejecute un *override*.
- **Consulta Personal y Consolidado de Programación (RF06):**
  - `GET /api/availability/my`: Retorna las fechas y bloques declarados por el usuario autenticado con filtros opcionales de rango (`startDate`, `endDate`).
  - `GET /api/availability/summary`: Endpoint exclusivo para Comisión Técnica que totaliza el personal disponible agrupado por bloque (`HORARIO_1`, `HORARIO_2`, `FULL`, `NO`) y filtra por rol técnico (`ARBITRO` u `OFICIAL_MESA`).
- **Verificación Automatizada:** Cobertura de pruebas con **64 tests unitarios** (9 suites) y **17 tests End-to-End (E2E)** ejecutados contra PostgreSQL 18.

---

## 2. Arquitectura y Flujo de Control de Disponibilidad

```mermaid
flowchart TD
    subgraph Client["Cliente / Árbitro / Mesa"]
        UserReq["Petición POST /api/availability/bulk\n{ availabilities: [{ date, block }] }"]
    end

    subgraph Security["Capa de Autenticación y Autorización"]
        JwtGuard["JwtAuthGuard (Bearer Token)"]
        RolesGuard["RolesGuard (@Roles)"]
    end

    subgraph BusinessLogic["Lógica de Negocio (AvailabilityService)"]
        DeadlineCheck{"¿Fecha objetivo dentro de plazo?\n(Miércoles 23:59 de la semana)\ngetDeadlineForDate(date)"}
        AdminBypass{"¿Es Admin Comisión Técnica?\n(Bypass justificado)"}
        Reject400["Rechaza con 400 Bad Request\n'Plazo de declaración vencido (RF05)'"]
        UpsertTx["Prisma $transaction\navailability.upsert([userId, date])"]
        AuditLogAction["AuditService.log(\nAVAILABILITY_SUBMITTED)"]
    end

    subgraph Database["Base de Datos PostgreSQL 18 (sgaob_db)"]
        AvailTable[("availabilities\n(@@unique([userId, date]))")]
        ConfigTable[("time_block_configs\n(@@unique([dayType, blockCode]))")]
        AuditTable[("audit_logs")]
    end

    UserReq --> JwtGuard --> RolesGuard --> DeadlineCheck
    DeadlineCheck -->|Dentro de plazo| UpsertTx
    DeadlineCheck -->|Fuera de plazo| AdminBypass
    AdminBypass -->|Sí (Comisión Técnica)| UpsertTx
    AdminBypass -->|No (Árbitro/Mesa)| Reject400

    UpsertTx --> AvailTable
    UpsertTx --> AuditLogAction
    AuditLogAction --> AuditTable
```

---

## 3. Decisiones de Diseño y Reglas de Negocio Implementadas

### 3.1. Algoritmo de Cálculo de Plazo Límite Semanal (RF05)
* **Regla de Negocio:** La programación de designaciones arbitrales para el fin de semana exige que todo árbitro y oficial de mesa informe su disponibilidad a más tardar el **miércoles a las 23:59:59** de la semana en curso.
* **Implementación:** Se diseñó una función matemática pura desacoplada:
  ```typescript
  export function getDeadlineForDate(dateStr: string): Date {
    const target = new Date(`${dateStr.split('T')[0]}T00:00:00.000Z`);
    const dayOfWeek = target.getUTCDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(target);
    monday.setUTCDate(target.getUTCDate() + diffToMonday);

    const wednesday = new Date(monday);
    wednesday.setUTCDate(monday.getUTCDate() + 2);
    wednesday.setUTCHours(23, 59, 59, 999);
    return wednesday;
  }
  ```
  Si la fecha y hora de la petición supera dicho miércoles o la fecha objetivo pertenece al pasado, se rechaza la operación automáticamente.

### 3.2. Mecanismo de Excepción por Fuerza Mayor (Override Administrativo)
* Si un árbitro sufre una lesión imprevista el jueves o se requiere un reemplazo de emergencia para el fin de semana, la Comisión Técnica (`RoleName.ADMIN_COMISION_TECNICA`) puede registrar la disponibilidad fuera de plazo. El sistema detecta el rol del solicitante (`isBypass = user.roles.includes(...)`), permite la actualización y deja constancia explícita en `audit_logs` con la etiqueta `isBypassDeadline: true`.

### 3.3. Transacciones Atómicas Idempotentes
* Mediante `tx.availability.upsert` sobre el índice compuesto `@@unique([userId, date])`, el endpoint soporta tanto declaraciones iniciales como modificaciones dentro del plazo sin riesgo de duplicar filas ni generar colisiones de concurrencia.

---

## 4. Matriz de Endpoints del Módulo de Disponibilidad

| Método | Endpoint | Roles Permitidos | DTO Entrada | Código Exitoso | Descripción |
|---|---|---|---|---|---|
| `GET` | `/api/availability/blocks` | Autenticado | Ninguno | `200 OK` | Consulta los bloques horarios activos (Anexo A.4). |
| `PATCH` | `/api/availability/blocks/:id` | `ADMIN_COMISION_TECNICA` | `UpdateTimeBlockDto` | `200 OK` | Modifica `startTime`, `endTime` o `description` de un bloque horario. |
| `GET` | `/api/availability/my` | `ARBITRO`, `OFICIAL_MESA`, `ADMIN` | `QueryAvailabilityDto` | `200 OK` | Consulta la disponibilidad declarada por el usuario autenticado. |
| `POST` | `/api/availability/bulk` | `ARBITRO`, `OFICIAL_MESA`, `ADMIN` | `DeclareAvailabilityBulkDto` | `200 OK` | Declaración masiva semanal. Valida plazo de miércoles 23:59 (RF05). |
| `GET` | `/api/availability/summary` | `ADMIN_COMISION_TECNICA` | `QueryAvailabilitySummaryDto` | `200 OK` | Consolidado de árbitros y oficiales disponibles por fecha y bloque (RF06). |

---

## 5. Trazabilidad a Requerimientos del Sistema (ERS)

| Requerimiento Funcional | Descripción ERS | Cobertura en PR7 |
|---|---|---|
| **RF04** (Declaración de Disponibilidad) | Declaración por fecha calendario en bloques `HORARIO_1`, `HORARIO_2`, `FULL`, `NO`. | **100% Backend** (`DeclareAvailabilityBulkDto`, `declareBulk`, `upsert`). |
| **RF05** (Plazo de Cierre Semanal) | Cierre estricto el miércoles 23:59 con excepción administrativa. | **100% Backend** (`getDeadlineForDate`, rechazo 400 y bypass administrativo). |
| **RF06** (Consulta y Consolidado) | Consulta personal del árbitro y consolidado para designaciones de la Comisión Técnica. | **100% Backend** (`getMyAvailability`, `getAvailabilitySummary` con conteos). |
| **Anexo A.4** (Bloques Parametrizables) | Configuración de rangos horarios para días laborales y fines de semana. | **100% Backend** (`getTimeBlocks`, `updateTimeBlock` con validación de horas). |

---

## 6. Evidencia de Funcionamiento y Pruebas Automatizadas

### 6.1. Pruebas Unitarias (Jest)
```bash
npm run test --workspace=@sgaob/api
```
**Resultado de la ejecución:**
```text
PASS src/common/guards/roles.guard.spec.ts
PASS src/modules/users/users.service.spec.ts
PASS src/app.controller.spec.ts
PASS src/common/mail/mail.service.spec.ts
PASS src/modules/auth/auth.service.spec.ts
PASS src/modules/auth/jwt.strategy.spec.ts
PASS src/modules/users/users.controller.spec.ts
PASS src/modules/availability/availability.service.spec.ts
PASS src/modules/availability/availability.controller.spec.ts

Test Suites: 9 passed, 9 total
Tests:       64 passed, 64 total
Snapshots:   0 total
Time:        12.379 s
```

### 6.2. Pruebas de Integración End-to-End (E2E)
Ejecutadas contra la base de datos real PostgreSQL (`sgaob_db`):
```bash
npm run test:e2e --workspace=@sgaob/api
```
**Resultado de la ejecución:**
```text
PASS test/app.e2e-spec.ts (6.458 s)
  AppController (e2e)
    √ /api/health (GET) (35 ms)
    Auth Endpoints (e2e)
      √ /api/auth/me (GET) (8 ms)
      √ /api/auth/dev-token (POST) (127 ms)
      √ /api/auth/me (GET) (10 ms)
    Users Endpoints (e2e)
      √ GET /api/users - Rechazo a no administradores (403) (7 ms)
      √ POST /api/users - Creación de usuario por Admin (201) (42 ms)
      √ POST /api/users - Rechazo correo duplicado (409) (8 ms)
      √ GET /api/users - Listado paginado al Admin (200) (73 ms)
      √ GET /api/users/:id - Detalle de usuario (200) (9 ms)
      √ PATCH /api/users/:id/roles - Asignación doble rol ARBITRO + OFICIAL_MESA (200) (23 ms)
      √ POST /api/users/consent - Consentimiento de datos (200) (10 ms)
    Availability Endpoints (e2e)
      √ GET /api/availability/blocks - Bloques horarios parametrizados (200) (10 ms)
      √ POST /api/availability/bulk - Rechazo fechas pasadas por plazo vencido (400, RF05) (7 ms)
      √ POST /api/availability/bulk - Declaración masiva fechas futuras (200, RF04) (16 ms)
      √ GET /api/availability/my - Consulta de disponibilidad personal (200, RF06) (9 ms)
      √ GET /api/availability/summary - Denegación a árbitros sin rol admin (403) (5 ms)
      √ GET /api/availability/summary - Consolidado de personal disponible al Admin (200, RF06) (10 ms)

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        6.899 s
```

### 6.3. Compilación de Todo el Monorepo (TypeScript Strict)
```bash
npm run build
```
**Resultado:** Compilación 100% exitosa en `@sgaob/shared`, `@sgaob/api` y `@sgaob/web`.

---

## 7. Próximo Paso en el Cronograma

### PR8: Frontend del Módulo de Disponibilidad (`apps/web`)
- Implementar la vista interactiva de **Disponibilidad** (`/disponibilidad`):
  - **Calendario Semanal Interactivo (Lunes a Domingo):** Selector visual con los bloques parametrizados (`Horario 1`, `Horario 2`, `Full`, `No disponible`).
  - **Semáforo y Temporizador de Plazo (RF05):** Indicador visual del estado del plazo límite (Verde: Plazo abierto; Ámbar: Cierre próximo; Rojo: Plazo vencido).
  - **Panel de Consolidado para Comisión Técnica (RF06):** Vista administrativa con selector de fecha, visualización de conteos por bloque y nómina de árbitros y oficiales disponibles para alimentar las designaciones arbitrales.

---

## 8. Vinculación con el Perfil de Egreso Capstone

El avance alcanzado en PR7 refuerza las siguientes competencias:
* **Automatización de Reglas de Negocio Deportivas:** Implementación de restricciones temporales críticas (cierre de inscripciones) que resuelven los problemas reales de coordinación que enfrentan las ligas de básquetbol.
* **Diseño de APIs Escalables y Transaccionales:** Manejo eficiente de operaciones masivas (*bulk upserts*) y agregaciones agrupadas para reportes administrativos.
* **Aseguramiento de Calidad Riguroso:** Implementación y validación de 64 pruebas unitarias y 17 pruebas E2E que aseguran el correcto funcionamiento de los límites horarios y las políticas de acceso.
