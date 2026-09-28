# SGAOB — Documento de Avance de Proyecto: PR11
**Sistema de Gestión de Árbitros y Oficiales de Básquetbol**  
**Proyecto Capstone — Ingeniería en Informática, Duoc UC**  
**Hito:** Módulo 4 (Nominaciones y Asignaciones) — Cruce de Disponibilidad, Separación Estricta de Roles, Despacho de Alertas y Respuesta de Designación (Backend)  
**Fecha de corte:** Septiembre 2026  
**Equipo de desarrollo:** SGAOB Team  

---

## 1. Resumen Ejecutivo

El presente informe documenta formalmente la finalización del Pull Request **PR11** (`feat(api/nominations)`), correspondiente al núcleo del **Módulo 4: Nominaciones y Asignaciones (RF11–RF16)** en el backend de SGAOB (NestJS + PostgreSQL 18 + Nodemailer).

En este hito se implementó la lógica de negocio más crítica del sistema: el motor de asignación técnica que cruza de manera determinista la disponibilidad horaria declarada por los oficiales (RF12) con los bloques de cada partido, asegurando el cumplimiento estricto de la separación de roles entre Árbitro de campo y Oficial de mesa (Anexo A.1), soportando la modalidad de 3 árbitros (Anexo A.2), despachando notificaciones automáticas por correo (RF14) y permitiendo a los designados confirmar o justificar su rechazo formalmente (RF15).

Asimismo, en respuesta directa al requerimiento del usuario, se generó la guía técnica detallada para pruebas en Postman, cURL y Swagger UI en [`docs/postman-guia-pruebas-nominaciones.md`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/docs/postman-guia-pruebas-nominaciones.md).

---

## 2. Alcance Real Ejecutado

1. **Cruce Inteligente de Disponibilidad y Detección de Conflictos ([`nominations.service.ts`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/api/src/modules/nominations/nominations.service.ts)):**
   - Endpoint `GET /api/nominations/available-candidates`: Evalúa en tiempo real a los candidatos activos para un slot específico (CU-07, Paso 2).
   - Valida que la disponibilidad horaria declarada (`HORARIO_1`, `HORARIO_2` o `FULL`) cubra el bloque del partido (`MatchTimeBlock`).
   - Detecta si el candidato ya está asignado a otro partido en el mismo bloque horario y fecha (prevención de colisiones de horario).
2. **Validación Dura de Acreditación Técnica (Anexo A.1):**
   - Restricción dura a nivel de servicio y base de datos:
     - Para slots `ARBITRO_PRINCIPAL`, `ARBITRO_1` o `ARBITRO_2`, el usuario **debe poseer obligatoriamente** el rol `ARBITRO`.
     - Para slots `OFICIAL_1`, `OFICIAL_2` u `OFICIAL_3`, el usuario **debe poseer obligatoriamente** el rol `OFICIAL_MESA`.
   - Rechazo inmediato con código `400 Bad Request` si la acreditación no coincide.
3. **Modalidad de 3 Árbitros (Anexo A.2):**
   - Soporte nativo para el slot `ARBITRO_2`, permitiendo ternas arbitrales completas en partidos de alta relevancia deportiva.
4. **Excepción Administrativa de Disponibilidad (Override):**
   - La Comisión Técnica puede habilitar `overrideAvailability: true` con justificación obligatoria (`overrideReason`), auditada en `AuditLog` como `NOMINATION_OVERRIDDEN` para casos de emergencia o reemplazos de último minuto.
5. **Despacho Automático de Notificaciones por Correo (RF14):**
   - Integración con [`MailService.sendNominationAlert`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/api/src/common/mail/mail.service.ts), registrando la trazabilidad en `notifications` y guardando la marca temporal `notifiedAt`.
6. **Flujo de Respuesta de Nominación (RF15):**
   - Endpoint `PATCH /api/nominations/:id/respond`: Permite al usuario nominado aceptar (`CONFIRMED`) o rechazar (`REJECTED`). Si se rechaza, es obligatorio ingresar un motivo explicativo (`rejectionReason`).
7. **Control de Duplicidad e Integridad Relacional:**
   - Control de unicidad de slot (`@@unique([matchId, matchRole])`) y unicidad de usuario por encuentro (`@@unique([matchId, userId])`).

---

## 3. Endpoints Implementados en `NominationsController`

| Método | Endpoint | Roles Autorizados | Propósito |
|---|---|---|---|
| `GET` | `/api/nominations` | CT, Árbitro, Oficial | Listar asignaciones con filtros combinables (partido, usuario, estado, rango de fechas). |
| `GET` | `/api/nominations/available-candidates` | CT | **Cruce inteligente:** Lista candidatos disponibles y no disponibles para un partido y slot. |
| `GET` | `/api/nominations/:id` | CT, Árbitro, Oficial | Detalle completo de la nominación y datos del encuentro. |
| `POST` | `/api/nominations` | Comisión Técnica | Crear nominación con validaciones duras y despacho de correo. |
| `PATCH` | `/api/nominations/:id/respond` | Árbitro nominado, CT | Responder nominación (confirmar o rechazar con motivo obligatorio). |
| `DELETE` | `/api/nominations/:id` | Comisión Técnica | Revocar asignación liberando el slot para reasignación. |

---

## 4. Trazabilidad con Requerimientos Funcionales (Módulo 4)

| Código RF | Requerimiento Funcional | Estado | Evidencia de Implementación |
|---|---|---|---|
| **RF11** | Comisión Técnica asigna personal a un partido | **Cumplido** | Endpoint `POST /api/nominations` con auditoría en `AuditLog`. |
| **RF12** | Asignación condicionada a disponibilidad declarada | **Cumplido** | Algoritmo `checkAvailabilityMatch()` y endpoint `available-candidates`. |
| **RF13** | Roles específicos por partido (Árbitro Principal, Árbitro 1, Árbitro 2, Oficiales) | **Cumplido** | Enum `MatchRole`, validación dura de roles Anexo A.1 y soporte de 3 árbitros Anexo A.2. |
| **RF14** | Notificación formal de nominación al personal | **Cumplido** | Despacho de correo vía `MailService.sendNominationAlert` y persistencia en `notifications`. |
| **RF15** | Confirmación o rechazo con motivo explicativo | **Cumplido** | Endpoint `PATCH /api/nominations/:id/respond` con validación de `rejectionReason`. |
| **RF16** | Grilla/tabla de asignaciones por fecha, torneo o recinto | **Cumplido (Backend)** | Filtros dinámicos en `GET /api/nominations` (preparado para la vista visual en PR12). |

---

## 5. Evidencia Verificable de Funcionamiento

### 5.1 Pruebas Unitarias (Jest)
Ejecución de `npm run test` en `apps/api`:
- **Suites evaluadas:** 14 passed, 14 total.
- **Tests unitarios:** **101 passed, 101 total** (100% de éxito).
- Cobertura de nuevas suites:
  - `src/modules/nominations/nominations.service.spec.ts`: Cruce de bloques horarios, detección de colisiones de horario, validación de acreditaciones arbitrales vs mesa, excepciones con override y confirmación/rechazo con motivo.
  - `src/modules/nominations/nominations.controller.spec.ts`: Mapeo de DTOs, permisos RBAC y respuestas HTTP.

```text
Test Suites: 14 passed, 14 total
Tests:       101 passed, 101 total
Snapshots:   0 total
Time:        14.553 s
Ran all test suites.
```

### 5.2 Pruebas de Integración y End-to-End (Supertest)
Ejecución de `npm run test:e2e` en `apps/api` contra la base de datos real PostgreSQL 18:
- **Suites evaluadas:** 1 passed, 1 total.
- **Tests E2E:** **31 passed, 31 total** (100% de éxito).

```text
  Nominations Endpoints (e2e, RF11-RF16, Anexo A.1, A.2)
    √ GET /api/nominations/available-candidates - Consulta candidatos acreditados para un slot (CU-07) (12 ms)
    √ POST /api/nominations - Rechaza asignación si el usuario no tiene el rol correspondiente (400, Anexo A.1) (8 ms)
    √ POST /api/nominations - Comisión Técnica asigna personal disponible a partido (201, RF11, RF14) (52 ms)
    √ POST /api/nominations - Rechaza slot duplicado en el mismo partido (409 Conflict) (8 ms)
    √ GET /api/nominations - Consulta listado de nominaciones con filtros (200, RF16) (8 ms)
    √ PATCH /api/nominations/:id/respond - Árbitro confirma nominación (200, RF15) (10 ms)
    √ DELETE /api/nominations/:id - Comisión Técnica revoca nominación liberando el slot (200) (7 ms)

Test Suites: 1 passed, 1 total
Tests:       31 passed, 31 total
Time:        5.278 s
```

### 5.3 Compilación del Monorepo
Ejecución de `npm run build` desde la raíz:
- `@sgaob/shared`: Compilación TypeScript exitosa.
- `@sgaob/api`: Compilación NestJS exitosa.
- `@sgaob/web`: Compilación Vite + React exitosa (1658 módulos transformados en 3.31s).
