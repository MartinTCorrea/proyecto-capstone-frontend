# Documento de Avance — PR14: Frontend de Recursos, Credenciales y Tablón de Anuncios (Módulo 5)

**Proyecto:** SGAOB (Sistema de Gestión de Árbitros y Oficiales de Básquetbol)  
**Hito:** PR14 — Frontend del Módulo de Información y Recursos  
**Fecha:** 27 de Septiembre de 2026  
**Responsable:** Equipo Capstone / Antigravity Agent  
**Estado:** Completado y Verificado (Protocolo Pre-Commit 100% aprobado)  

---

## 1. Alcance Completado

En este PR14 se implementó la interfaz de usuario completa para el **Módulo 5: Información y Recursos**, satisfaciendo los requerimientos funcionales **RF17 a RF20**, los casos de uso **CU-09 y CU-10**, y la regla de seguridad del **Anexo A.5**.

### Capacidades de Interfaz Entregadas:
1. **Cliente API Tipado (`resources.api.ts`)**:
   - Conexión con todos los endpoints del backend (`GET /api/resources`, `GET /api/resources/:id`, `POST /api/resources`, `PATCH /api/resources/:id`, `DELETE /api/resources/:id`).
   - Implementación de la descarga nativa en el navegador del archivo CSV con UTF-8 BOM (`downloadNominationsCsv`) para Microsoft Excel (RF20).
2. **Insignias y Componentes Visuales (`ResourceTypeBadge.tsx`)**:
   - Badges semánticos accesibles para `DOCUMENTO` (Azul / FileText), `CREDENCIAL` (Rojo / Key / Lock) y `COMUNICADO` (Púrpura / Megaphone).
3. **Tarjeta Adaptativa de Recursos (`ResourceCard.tsx`)**:
   - **Documentos (RF17):** Visualización de bases, manuales y reglamentos FIBA con botón de acceso y descarga directa del archivo (`fileUrl`).
   - **Comunicados (RF19):** Publicaciones oficiales de la Comisión Técnica con autor, fecha y formateo de texto multilínea legible.
   - **Credenciales Seguras (RF18, Anexo A.5):** Bloque protegido visible **únicamente para la Comisión Técnica**, con enmascaramiento por defecto (`••••••••••••`), botón para alternar visualización (Mostrar / Ocultar) y botón para copiar token al portapapeles.
4. **Modal de Creación y Edición (`CreateResourceModal.tsx`, `EditResourceModal.tsx` — CU-10)**:
   - Formularios accesibles para la Comisión Técnica con validación en tiempo real.
   - Si se selecciona tipo `CREDENCIAL`, la interfaz advierte y fuerza la visibilidad `ADMIN` (cumpliendo la regla del Anexo A.5).
5. **Modal de Exportación de Asignaciones a Excel (`ExportNominationsModal.tsx` — RF20, CU-09)**:
   - Diálogo interactivo para filtrar la exportación por rango de fechas, torneo y recinto.
   - Descarga automática instantánea del archivo CSV estructurado y listo para Excel.
6. **Página Principal de Recursos (`ResourcesPage.tsx`)**:
   - Pestañas organizadas:
     - **Tablón de Comunicados (RF19)**
     - **Documentos y Protocolos (RF17)**
     - **Bóveda de Credenciales (RF18, visible exclusivamente para Comisión Técnica)**
   - Buscador textual en vivo y botones de acción rápida.
7. **Integración en Navegación y Rutas (`App.tsx`, `Navbar.tsx`)**:
   - Enlace `/recursos` integrado en la barra de navegación superior (desktop y menú móvil) y protegido por `RoleGuard`.

---

## 2. Trazabilidad con Requerimientos Funcionales

| ID | Requerimiento / Decisión | Implementación en PR14 | Estado |
|---|---|---|---|
| **RF17** | Sección "Recursos" para subir/enlazar documentos | `ResourceCard` con pestaña "Documentos y Protocolos" y botón de descarga. | Cumplido |
| **RF18** | Almacenamiento seguro y visualización de credenciales | Pestaña "Bóveda de Credenciales" restringida para CT con enmascaramiento y copia segura. | Cumplido |
| **RF19** | Tablón de anuncios / comunicados generales | Pestaña principal "Tablón de Comunicados" con búsqueda textual en vivo. | Cumplido |
| **RF20** | Exportación de la grilla de asignaciones a Excel | `ExportNominationsModal` conectado a `resourcesApi.downloadNominationsCsv`. | Cumplido |
| **CU-09** | Ver y exportar grilla de asignaciones | Botón superior "Exportar Asignaciones (RF20)" accesible en la vista de recursos. | Cumplido |
| **CU-10** | Gestionar recursos, credenciales y comunicados | `CreateResourceModal` y `EditResourceModal` para alta y mantenimiento. | Cumplido |
| **Anexo A.5**| Forzado incondicional de visibilidad `ADMIN` para credenciales | Sincronizado en formulario y reforzado en backend. | Cumplido |

---

## 3. Archivos Nuevos y Modificados

```text
apps/web/
├── src/
│   ├── api/
│   │   └── resources.api.ts              [NUEVO] Cliente API y descarga blob CSV
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.tsx                [MODIFICADO] Enlace a /recursos en desktop y móvil
│   │   └── resources/
│   │       ├── ResourceTypeBadge.tsx     [NUEVO] Badge accesible por tipo de recurso
│   │       ├── ResourceCard.tsx          [NUEVO] Tarjeta interactiva con soporte seguro de credenciales
│   │       ├── CreateResourceModal.tsx   [NUEVO] Modal de publicación para Comisión Técnica
│   │       ├── EditResourceModal.tsx     [NUEVO] Modal de edición de recursos
│   │       └── ExportNominationsModal.tsx[NUEVO] Modal de descarga de grilla Excel (RF20)
│   ├── pages/
│   │   └── ResourcesPage.tsx             [NUEVO] Página principal de recursos y comunicados
│   └── App.tsx                           [MODIFICADO] Ruta protegida /recursos con RoleGuard
docs/
└── avance-pr14.md                        [NUEVO] Informe de avance y trazabilidad PR14
```

---

## 4. Evidencia Verificable de Cumplimiento (Protocolo Pre-Commit AGENTS.md)

1. **`npx tsc --noEmit -p apps/api/tsconfig.json`**:
   - Exit code: 0 (Cero errores de tipos en backend y tests).
2. **`npm run lint --prefix apps/web`**:
   - Exit code: 0 (Cero errores de tipos y cero imports no utilizados en frontend).
3. **`npm run test --prefix apps/api`**:
   - **119/119 unit tests pasando** en 16 suites (100%).
4. **`npm run test:e2e --prefix apps/api`**:
   - **39/39 e2e tests pasando** contra PostgreSQL (100%).
