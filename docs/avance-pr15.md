# Documento de Avance — PR15: Pruebas de Integración y Validación Piloto (Paso 8)

**Proyecto:** SGAOB (Sistema de Gestión de Árbitros y Oficiales de Básquetbol)  
**Hito:** PR15 — Pruebas de Integración y Validación Piloto (Paso 8 del cronograma)  
**Fecha:** 27 de Septiembre de 2026  
**Responsable:** Equipo Capstone / Antigravity Agent  
**Estado:** Completado y Verificado (Protocolo Pre-Commit 100% aprobado)  

---

## 1. Alcance Completado

En este PR15 se diseñó e implementó la suite completa de **Validación Piloto E2E (`apps/api/test/pilot-validation.e2e-spec.ts`)**, simulando de extremo a extremo el ciclo de vida real de un torneo de básquetbol chileno a través de los 5 módulos funcionales del sistema, cubriendo los 10 Casos de Uso (**CU-01 a CU-10**) y los 20 Requerimientos Funcionales (**RF01 a RF20**), junto con todas las reglas de negocio de los Anexos A.1, A.2, A.4 y A.5.

### Actores Simulados en el Piloto:
1. **Comisión Técnica (Administrador):** Gonzalo Comisión (`admin.pilot@sgaob.cl`, rol `ADMIN_COMISION_TECNICA`).
2. **Árbitro 1:** Claudio Vargas (`arbitro1.pilot@sgaob.cl`, rol `ARBITRO`).
3. **Árbitro 2:** Felipe Soto (`arbitro2.pilot@sgaob.cl`, rol `ARBITRO`).
4. **Oficial de Mesa:** Patricia Araya (`mesa.pilot@sgaob.cl`, rol `OFICIAL_MESA`).

---

## 2. Fases del Piloto E2E y Trazabilidad

| Fase | Casos de Uso | Requerimientos | Descripción del Flujo Ejecutado | Resultado |
|---|---|---|---|---|
| **Fase 1: Autenticación, Consentimiento y Roles** | CU-01, CU-02 | RF01, RF02, RF03 | - Registro formal de consentimiento de tratamiento de datos personales con timestamp.<br>- Consulta y validación de perfiles y roles segregados por Comisión Técnica. | Aprobado |
| **Fase 2: Declaración y Reporte de Disponibilidad** | CU-03, CU-04 | RF04, RF05, RF06, Anexo A.4 | - Consulta de bloques horarios parametrizados.<br>- Declaración masiva semanal: Árbitro 1 (`FULL`), Árbitro 2 (`HORARIO_2`), Oficial de Mesa (`HORARIO_2`).<br>- Generación de reporte consolidado administrativo por fecha y bloque. | Aprobado |
| **Fase 3: Cartelera e Integración** | CU-05, CU-06 | RF07, RF08, RF09 | - Prueba de conectividad exitosa con proveedor Sandbox Swish/NBN23 sin costo externo ($0).<br>- Creación de partido oficial "Universidad de Chile vs Club Puente Alto" en Gimnasio CEO Ñuñoa.<br>- Ejecución de sincronización bajo demanda con cola asíncrona. | Aprobado |
| **Fase 4: Designaciones y Cruce Inteligente** | CU-07, CU-08 | RF11, RF12, RF13, RF14, RF15, RF16, Anexo A.1, Anexo A.2 | - Cruce algorítmico de disponibilidad: Árbitros disponibles vs Oficial de mesa excluido de slots arbitrales.<br>- Designación de Árbitro Principal, Árbitro 1 y Oficial de Mesa 1.<br>- Notificación por correo simulada.<br>- Confirmación formal de Árbitro 1 (`CONFIRMED`) y rechazo justificado de Árbitro 2 (`REJECTED`).<br>- Auditoría de estados en grilla de nominaciones. | Aprobado |
| **Fase 5: Reprogramación y Alertas** | — | RF10 | - Cambio de recinto a Gimnasio Polideportivo Sergio Livingstone y actualización de estado a `RESCHEDULED`.<br>- Disparo de alertas de reprogramación al personal afectado. | Aprobado |
| **Fase 6: Recursos, Credenciales y Exportación** | CU-09, CU-10 | RF17, RF18, RF19, RF20, Anexo A.5 | - Publicación de comunicado oficial y reglamento en PDF.<br>- Registro seguro de credencial API con forzado estricto de visibilidad `ADMIN` (Anexo A.5).<br>- Verificación de seguridad: 403 Forbidden para árbitros al intentar acceder a credenciales privadas.<br>- Exportación oficial de la Grilla de Asignaciones en CSV con UTF-8 BOM para Microsoft Excel.<br>- Limpieza y teardown de entidades de prueba. | Aprobado |

---

## 3. Matriz de Cumplimiento de Requerimientos Funcionales (RF01 - RF20)

| Requerimiento | Descripción | Módulo | Verificación en Piloto E2E |
|---|---|---|---|
| **RF01** | Autenticación y consentimiento explícito | Seguridad | Test Fase 1: `POST /api/users/consent` |
| **RF02** | Gestión de roles independientes (Árbitro vs Mesa) | Seguridad | Test Fase 1 & 4: Separación de roles y filtros |
| **RF03** | Perfil de usuario y estados de cuenta | Seguridad | Test Fase 1: `GET /api/users` |
| **RF04** | Declaración semanal de disponibilidad | Disponibilidad | Test Fase 2: `POST /api/availability/bulk` |
| **RF05** | Regla de plazo (Miércoles 23:59) y bloques | Disponibilidad | Test Fase 2: `GET /api/availability/blocks` |
| **RF06** | Consolidado administrativo de disponibilidad | Disponibilidad | Test Fase 2: `GET /api/availability/summary` |
| **RF07** | Conectividad con plataformas externas (Swish/NBN23) | Integración | Test Fase 3: `GET /api/matches/integrations/test` |
| **RF08** | Cartelera unificada de partidos | Integración | Test Fase 3: `POST /api/matches` |
| **RF09** | Sincronización programada y bajo demanda | Integración | Test Fase 3: `POST /api/matches/sync` |
| **RF10** | Detección de reprogramaciones y cancelaciones | Integración | Test Fase 5: `PATCH /api/matches/:id` |
| **RF11** | Asignación y composición de ternas/mesas | Nominaciones | Test Fase 4: `POST /api/nominations` |
| **RF12** | Cruce automático con disponibilidad | Nominaciones | Test Fase 4: `GET /api/nominations/available-candidates` |
| **RF13** | Detección de incompatibilidades y topes | Nominaciones | Test Fase 4: Detección de solapamiento y roles |
| **RF14** | Notificación automática de asignación | Nominaciones | Test Fase 4: Despacho de alerta por correo |
| **RF15** | Confirmación o rechazo con motivo justificado | Nominaciones | Test Fase 4: `PATCH /api/nominations/:id/respond` |
| **RF16** | Grilla de asignaciones y visualización | Nominaciones | Test Fase 4: `GET /api/nominations` |
| **RF17** | Repositorio de documentos y reglamentos | Recursos | Test Fase 6: `POST /api/resources` (DOCUMENTO) |
| **RF18** | Almacenamiento seguro de credenciales | Recursos | Test Fase 6: Restricción ADMIN y 403 Forbidden |
| **RF19** | Tablón de comunicados y avisos urgentes | Recursos | Test Fase 6: `POST /api/resources` (COMUNICADO) |
| **RF20** | Exportación de grilla a Excel/CSV con BOM UTF-8 | Recursos | Test Fase 6: `GET /api/resources/export/nominations` |

---

## 4. Evidencia Verificable de Cumplimiento (Protocolo Pre-Commit AGENTS.md)

1. **`npx tsc --noEmit -p apps/api/tsconfig.json`**:
   - Exit code: 0 (Cero errores de compilación y verificación estricta de tipos).
2. **`npm run lint --prefix apps/web`**:
   - Exit code: 0 (Cero errores de tipos y cero variables/imports no utilizados en frontend).
3. **`npm run test --prefix apps/api`**:
   - **16 suites pasando, 119/119 unit tests aprobados** (100%).
4. **`npm run test:e2e --prefix apps/api`**:
   - **2 suites pasando, 63/63 e2e tests aprobados** (100% contra PostgreSQL local).
   - Incluye tanto la suite base (`app.e2e-spec.ts` con 49 tests) como la suite piloto integral (`pilot-validation.e2e-spec.ts` con 14 tests de ciclo completo).
