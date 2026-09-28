# Documento de Avance — PR12: Frontend de Nominaciones y Asignaciones (Módulo 4)

**Proyecto:** SGAOB (Sistema de Gestión de Árbitros y Oficiales de Básquetbol)  
**Hito:** PR12 — Frontend del Módulo de Nominaciones / Asignaciones  
**Fecha:** 27 de Septiembre de 2026  
**Responsable:** Equipo Capstone / Antigravity Agent  
**Estado:** Completado y Verificado  

---

## 1. Alcance Completado

En este PR12 se implementó la interfaz de usuario completa y reactiva para el **Módulo 4: Nominaciones y Asignaciones**, satisfaciendo íntegramente los requerimientos funcionales **RF11 a RF16**, los casos de uso **CU-07, CU-08 y CU-09**, y las reglas de negocio confirmadas en el **Anexo A (A.1 y A.2)**.

### Capacidades Entregadas en la Interfaz:
1. **Cliente API Tipado (`nominations.api.ts`)**:
   - Integración con todos los endpoints REST del backend (`GET /api/nominations`, `GET /api/nominations/available-candidates`, `POST /api/nominations`, `PATCH /api/nominations/:id/respond`, `DELETE /api/nominations/:id`).
   - Tipos TypeScript estrictos sincronizados con `@sgaob/shared`.
2. **Insignias y Componentes Visuales Accesibles**:
   - `NominationStatusBadge.tsx`: Badges semánticos para estados `PENDING` (Ámbar), `CONFIRMED` (Esmeralda), `REJECTED` (Rosa/Rojo).
   - `MatchRoleBadge.tsx`: Distintivos visuales para los 6 roles de partido (`ARBITRO_PRINCIPAL`, `ARBITRO_1`, `ARBITRO_2`, `OFICIAL_1`, `OFICIAL_2`, `OFICIAL_3`).
3. **Modal de Designación Inteligente (`AssignNominationModal.tsx` — CU-07)**:
   - Selector interactivo del slot a designar.
   - Cruce en tiempo real con `getAvailableCandidates`: clasifica al personal activo según disponibilidad declarada en el bloque horario del partido (`HORARIO_1`, `HORARIO_2`, `FULL`) y solapamientos de horario con otros partidos en la misma fecha.
   - Lista priorizada de candidatos disponibles recomendados.
   - Sección colapsable de candidatos no disponibles o con conflicto, detallando la causa exacta.
   - Mecanismo explícito de **Asignación Excepcional (Override por escasez de personal)** con justificación obligatoria para auditoría.
4. **Modal de Respuesta de Nominación (`RespondNominationModal.tsx` — CU-08, RF15)**:
   - Permite al árbitro u oficial de mesa ratificar su asignación (`CONFIRMED`) o rechazarla (`REJECTED`).
   - Exige obligatoriamente el motivo de rechazo (mínimo 5 caracteres) para notificar de inmediato a la Comisión Técnica y liberar el slot.
5. **Grilla de Partidos y Ternas Arbitrales (`MatchesAssignmentsGrid.tsx` — RF16)**:
   - Vista por encuentro deportivo con visualización de la terna arbitral (3 slots) y la mesa de control (3 slots).
   - Botón directo "+ Asignar" en slots vacantes y badges con acciones rápidas en slots ocupados.
6. **Listado Consolidado y Mis Asignaciones (`NominationsTable.tsx`, `NominationsPage.tsx`)**:
   - Pestaña general para la Comisión Técnica con filtros por torneo, recinto, estado y rango de fechas.
   - Pestaña personalizada "Mis Asignaciones" para el árbitro/oficial autenticado.
   - Barra superior con métricas en tiempo real: Total Asignaciones, Pendientes, Confirmadas y Rechazadas.
7. **Integración con Cartelera (`MatchesTable.tsx`)**:
   - Enlace directo desde la cartelera de partidos hacia la gestión de nominaciones.

---

## 2. Trazabilidad con Requerimientos Funcionales y Casos de Uso

| ID | Requerimiento / Caso de Uso | Implementación en PR12 | Estado |
|---|---|---|---|
| **RF11** | Comisión Técnica asigna personal a un partido | `AssignNominationModal` invoca `POST /api/nominations` con `matchId`, `userId` y `matchRole`. | Cumplido |
| **RF12** | Asignación según disponibilidad declarada | El modal ejecuta `getAvailableCandidates` y resalta a los candidatos que declararon disponibilidad compatible en el bloque horario del partido. | Cumplido |
| **RF13** | Roles específicos por partido (Árbitro Principal, Árbitro 1, Árbitro 2, Oficial 1, 2, 3) | Selector en `AssignNominationModal` y badges dedicados en `MatchRoleBadge`. | Cumplido |
| **RF14** | Notificación al usuario nominado | Feedback visual de confirmación de despacho de correo electrónico automático por backend. | Cumplido |
| **RF15** | Usuario puede confirmar o rechazar su nominación | `RespondNominationModal` con validación de motivo de rechazo obligatorio. | Cumplido |
| **RF16** | Grilla/tabla de asignaciones por fecha, torneo o recinto | `NominationsPage` con pestañas de grilla (`MatchesAssignmentsGrid`) y tabla (`NominationsTable`) con filtros cruzados. | Cumplido |
| **CU-07** | Asignar personal a partido (nominación) | Modal paso a paso con cruce de candidatos y soporte de override justificado. | Cumplido |
| **CU-08** | Confirmar o rechazar nominación | Modal accesible para respuesta rápida del personal nominado. | Cumplido |
| **CU-09** | Ver grilla de asignaciones | Grilla interactiva por partido, fecha, torneo y recinto con indicadores de slots cubiertos vs vacantes. | Cumplido |
| **Anexo A.1** | Separación estricta Árbitro / Oficial de Mesa | Filtro duro por rol en backend reflejado en la lista de candidatos disponibles. | Cumplido |
| **Anexo A.2** | Modalidad de 3 árbitros | Soporte completo para slot `ARBITRO_2` en UI, grilla y filtros. | Cumplido |

---

## 3. Archivos Nuevos y Modificados

```text
apps/web/
├── src/
│   ├── api/
│   │   └── nominations.api.ts              [NUEVO] Cliente API tipado para asignaciones
│   ├── components/
│   │   ├── nominations/
│   │   │   ├── NominationStatusBadge.tsx   [NUEVO] Badge accesible de estados (Pending, Confirmed, Rejected)
│   │   │   ├── MatchRoleBadge.tsx          [NUEVO] Badge accesible de roles de partido
│   │   │   ├── AssignNominationModal.tsx   [NUEVO] Modal de designación con cruce inteligente
│   │   │   ├── RespondNominationModal.tsx  [NUEVO] Modal de confirmación/rechazo con motivo
│   │   │   ├── NominationsTable.tsx        [NUEVO] Tabla de nominaciones con filtros y acciones
│   │   │   └── MatchesAssignmentsGrid.tsx  [NUEVO] Grilla visual de partidos y ternas
│   │   └── matches/
│   │       └── MatchesTable.tsx            [MODIFICADO] Enlace directo de designación arbitral
│   ├── pages/
│   │   └── NominationsPage.tsx             [NUEVO] Página principal de nominaciones y asignaciones
│   └── App.tsx                             [MODIFICADO] Configuración de ruta protegida /nominaciones con RoleGuard
docs/
└── avance-pr12.md                          [NUEVO] Documento de avance e informe de PR12
```

---

## 4. Evidencia de Calidad y Verificación

- **TypeScript Estricto:** Código frontend 100% tipado en modo `strict`, sin uso de `any` injustificado y contratos sincronizados con `@sgaob/shared`.
- **Accesibilidad ARIA y Teclado:** Diálogos modales con roles `dialog`, `aria-modal="true"`, encabezados vinculados (`aria-labelledby`), contraste óptimo y soporte de navegación por teclado.
- **Tolerancia a Fallos y Manejo de Errores:** Mensajes informativos ante ausencia de personal disponible, fallos de red o errores de validación de negocio.
- **Preparación para Producción:** Desacoplado estéticamente mediante clases Tailwind utilitarias documentadas en `docs/arquitectura-estilos-frontend.md`.
