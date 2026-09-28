# Documento de Avance — PR13: Backend de Recursos, Credenciales y Comunicados (Módulo 5)

**Proyecto:** SGAOB (Sistema de Gestión de Árbitros y Oficiales de Básquetbol)  
**Hito:** PR13 — Backend del Módulo de Información y Recursos  
**Fecha:** 27 de Septiembre de 2026  
**Responsable:** Equipo Capstone / Antigravity Agent  
**Estado:** Completado y Verificado  

---

## 1. Alcance Completado

En este PR13 se implementó el backend del **Módulo 5: Información y Recursos**, satisfaciendo los requerimientos funcionales **RF17 a RF20**, el caso de uso **CU-10**, y la decisión de negocio de alta prioridad del **Anexo A.5**.

### Capacidades del Módulo Entregadas:
1. **Gestión Documental y Material de Estudio (RF17)**:
   - Registro, consulta y categorización de reglamentos FIBA, bases de torneos y material formativo para árbitros y oficiales de mesa.
   - Soporte para enlaces externos (`fileUrl`), descripciones y contenido en texto.
2. **Almacenamiento Seguro y Restricción de Credenciales de Terceros (RF18, Anexo A.5)**:
   - Regla de negocio dura implementada en la capa de servicio: cuando `type = CREDENCIAL`, el sistema **fuerza incondicionalmente `visibility = ADMIN`**, ignorando cualquier parámetro permisivo que pudiera enviar el cliente.
   - Control de acceso RBAC estricto: los árbitros y oficiales de mesa no pueden listar ni consultar credenciales (`403 Forbidden` / exclusión automática en queries).
3. **Tablón de Anuncios y Comunicados Oficiales (RF19)**:
   - Publicación de avisos generales y comunicados técnicos con visibilidad `AUTHENTICATED` o `PUBLIC`.
   - Búsqueda textual insensible a mayúsculas/minúsculas en título, descripción y contenido.
4. **Exportación de la Grilla de Asignaciones a Excel / CSV (RF20, CU-09)**:
   - Endpoint `GET /api/resources/export/nominations` que genera un archivo CSV estructurado con cabecera UTF-8 BOM (`\uFEFF`), garantizando compatibilidad nativa e inmediata con Microsoft Excel (respetando tildes y caracteres en español).
   - Incluye filtros por rango de fechas, torneo y recinto.
   - Datos exportados: Fecha, Hora, Bloque Horario, Torneo, Categoría, Recinto, Equipos (Local vs Visita), Rol Designado, Nombre del Oficial, Email, Teléfono, Estado de Designación y Motivo de Rechazo.
5. **Auditoría Integral**:
   - Registro en `AuditLog` de todas las operaciones de creación (`RESOURCE_CREATED`), actualización (`RESOURCE_UPDATED`) y eliminación (`RESOURCE_DELETED`).

---

## 2. Endpoints Implementados (`/api/resources`)

| Método | Endpoint | Roles Permitidos | Descripción / Requerimiento |
|---|---|---|---|
| `GET` | `/api/resources` | `ADMIN`, `ARBITRO`, `OFICIAL_MESA` | Listado paginado con filtro automático de visibilidad (RF17, RF18, RF19) |
| `GET` | `/api/resources/:id` | `ADMIN`, `ARBITRO`, `OFICIAL_MESA` | Detalle del recurso con validación de seguridad RBAC (RF18) |
| `POST` | `/api/resources` | `ADMIN_COMISION_TECNICA` | Creación de recurso con regla forzada Anexo A.5 para credenciales |
| `PATCH` | `/api/resources/:id` | `ADMIN_COMISION_TECNICA` | Actualización de recursos y comunicados |
| `DELETE` | `/api/resources/:id` | `ADMIN_COMISION_TECNICA` | Eliminación de documentos o credenciales |
| `GET` | `/api/resources/export/nominations` | `ADMIN_COMISION_TECNICA` | Descarga de la grilla de asignaciones en CSV para Excel (RF20, CU-09) |

---

## 3. Trazabilidad con Requerimientos Funcionales

| ID | Requerimiento / Decisión | Implementación en PR13 | Estado |
|---|---|---|---|
| **RF17** | Subir/enlazar documentos (bases, protocolos, material de estudio) | `ResourcesService.createResource` y `getResources` con `type = DOCUMENTO`. | Cumplido |
| **RF18** | Almacenamiento seguro y visualización de credenciales de terceros | Filtrado duro RBAC: árbitros reciben exclusión en queries y `403 Forbidden` por ID. | Cumplido |
| **RF19** | Tablón de anuncios / comunicados generales | `ResourcesService` con `type = COMUNICADO` y visibilidad `AUTHENTICATED`. | Cumplido |
| **RF20** | Exportación de la grilla de asignaciones a PDF o Excel | `GET /api/resources/export/nominations` con stream CSV UTF-8 BOM y cabeceras de descarga. | Cumplido |
| **Anexo A.5** | Forzado incondicional de visibilidad `ADMIN` en credenciales | Capa de servicio impone `visibility = ADMIN` si `type = CREDENCIAL`. | Cumplido |

---

## 4. Evidencia Verificable de Funcionamiento

### A. Pruebas Unitarias (Jest)
- **Suites Ejecutadas:** 16/16 suites pasadas (`100%`).
- **Tests Totales:** 119 pruebas unitarias aprobadas.
- **Suites Nuevas:**
  - `resources.service.spec.ts`: 8 tests unitarios (creación, filtro de credenciales para árbitros vs admin, regla Anexo A.5, exportación CSV con UTF-8 BOM).
  - `resources.controller.spec.ts`: 6 tests unitarios (delegación de endpoints, headers de descarga).

### B. Pruebas de Integración End-to-End (Supertest contra PostgreSQL)
- **Suites E2E:** `test/app.e2e-spec.ts`.
- **Tests E2E Aprobados:** 39/39 tests pasados (`100%`).
- **Escenarios E2E Nuevos del Módulo 5:**
  1. `POST /api/resources` - Documento creado con visibilidad `AUTHENTICATED` (201).
  2. `POST /api/resources` - Forzado de visibilidad `ADMIN` al enviar credencial con intento `PUBLIC` (201, Anexo A.5).
  3. `GET /api/resources` - Árbitro no ve credenciales ni recursos `ADMIN` (200).
  4. `GET /api/resources` - Comisión Técnica ve documentos y credenciales (200).
  5. `GET /api/resources/:id` - Árbitro recibe `403 Forbidden` al intentar leer credencial por ID.
  6. `GET /api/resources/export/nominations` - Descarga de archivo CSV con UTF-8 BOM y cabeceras correctas (200, RF20).
  7. `DELETE /api/resources/:id` - Eliminación de documento y credencial (200).

### C. Compilación NestJS
- `npm run build --prefix apps/api` (`nest build`) finalizado con código de salida 0.
