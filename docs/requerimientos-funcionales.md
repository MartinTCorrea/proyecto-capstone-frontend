# SGAOB — Especificación de Requerimientos Funcionales (RF01 a RF20)

**Sistema de Gestión de Árbitros y Oficiales de Básquetbol (SGAOB)**  
**Proyecto de Título / Capstone — Escuela de Informática y Telecomunicaciones, Duoc UC**  
**Versión:** 1.0.0 (Aprobado / 100% Implementado)  
**Fecha de Emisión:** Octubre 2026  
**Cobertura de Pruebas:** 191/191 tests automatizados aprobados (128 unitarios + 63 e2e)  

---

## 1. Matriz General de Trazabilidad (RF vs. Módulos y Casos de Uso)

| Código | Requerimiento Funcional | Módulo | Caso de Uso | Estado de Implementación | Componentes / Endpoints Principales |
|---|---|---|---|:---:|---|
| **RF01** | Autenticación, Gestión de Sesión y Consentimiento Informado | M1: Seguridad y Usuarios | CU-01 | **100% Aprobado** | `POST /api/users/consent`<br>`DataConsentModal.tsx` |
| **RF02** | Segregación Estricta de Roles Técnicos (Árbitro vs. Mesa) | M1: Seguridad y Usuarios | CU-02 | **100% Aprobado** | `PATCH /api/users/:id/roles`<br>`AssignRolesModal.tsx` |
| **RF03** | Administración y Estados de Cuenta del Padrón de Usuarios | M1: Seguridad y Usuarios | CU-02 | **100% Aprobado** | `GET /api/users`, `PATCH /api/users/:id/status`<br>`UsersManagementPage.tsx` |
| **RF04** | Declaración Masiva Semanal de Disponibilidad Horaria | M2: Disponibilidad | CU-03 | **100% Aprobado** | `POST /api/availability/bulk`<br>`WeeklyCalendarGrid.tsx` |
| **RF05** | Validación Automatizada de Plazo Límite y Bloques Paramétricos | M2: Disponibilidad | CU-03 | **100% Aprobado** | `GET /api/availability/blocks`<br>`getDeadlineForDate()`, `DeadlineStatusBadge.tsx` |
| **RF06** | Consolidado Administrativo de Disponibilidad del Personal | M2: Disponibilidad | CU-04 | **100% Aprobado** | `GET /api/availability/summary`<br>`AvailabilitySummaryView.tsx` |
| **RF07** | Diagnóstico y Conectividad con Plataformas Externas | M3: Integración y Cartelera | CU-05 | **100% Aprobado** | `GET /api/matches/integrations/test`<br>`SyncControlModal.tsx`, `MockSyncProvider` |
| **RF08** | Cartelera Centralizada y Creación Manual de Encuentros | M3: Integración y Cartelera | CU-06 | **100% Aprobado** | `POST /api/matches`, `GET /api/matches`<br>`MatchesTable.tsx`, `CreateMatchModal.tsx` |
| **RF09** | Sincronización Asíncrona Programada y Bajo Demanda | M3: Integración y Cartelera | CU-06 | **100% Aprobado** | `POST /api/matches/sync`<br>`match-sync.queue.ts` (BullMQ + Redis) |
| **RF10** | Detección Automática de Reprogramaciones y Alertas de Cambio | M3: Integración y Cartelera | CU-06 | **100% Aprobado** | `PATCH /api/matches/:id`<br>`MailService.sendMatchStatusChangeAlert` |
| **RF11** | Asignación y Composición de Ternas y Mesas de Control | M4: Nominaciones | CU-07 | **100% Aprobado** | `POST /api/nominations`<br>`AssignNominationModal.tsx` |
| **RF12** | Cruce Algorítmico Inteligente con Disponibilidad Horaria | M4: Nominaciones | CU-07 | **100% Aprobado** | `GET /api/nominations/available-candidates`<br>`checkAvailabilityMatch()` |
| **RF13** | Restricción Dura de Roles Técnicos y Detección de Topes | M4: Nominaciones | CU-07 | **100% Aprobado** | Validación estricta en `NominationsService`<br>`BadRequestException` (Anexo A.1) |
| **RF14** | Despacho Automatizado de Notificaciones de Designación | M4: Nominaciones | CU-07 | **100% Aprobado** | `MailService.sendNominationAlert`<br>`notifications` table (timestamp `notifiedAt`) |
| **RF15** | Confirmación Formal y Rechazo Justificado de Designaciones | M4: Nominaciones | CU-08 | **100% Aprobado** | `PATCH /api/nominations/:id/respond`<br>`RespondNominationModal.tsx` |
| **RF16** | Grilla Interactiva y Matriz de Visualización de Asignaciones | M4: Nominaciones | CU-07, CU-08 | **100% Aprobado** | `GET /api/nominations`<br>`MatchesAssignmentsGrid.tsx` |
| **RF17** | Repositorio Oficial de Reglamentos FIBA y Bases de Torneos | M5: Información y Recursos | CU-10 | **100% Aprobado** | `POST /api/resources` (`type: DOCUMENTO`)<br>`ResourceCard.tsx`, visor PDF |
| **RF18** | Bóveda Segura de Credenciales API con Visibilidad Restringida | M5: Información y Recursos | CU-10 | **100% Aprobado** | Forzado `visibility: ADMIN` (Anexo A.5)<br>`CredentialVaultModal.tsx`, 403 Forbidden |
| **RF19** | Tablón Digital de Comunicados Oficiales y Avisos Urgentes | M5: Información y Recursos | CU-10 | **100% Aprobado** | `POST /api/resources` (`type: COMUNICADO`)<br>`ResourcesPage.tsx` |
| **RF20** | Exportación Oficial de la Grilla de Asignaciones a Excel / CSV | M5: Información y Recursos | CU-09 | **100% Aprobado** | `GET /api/resources/export/nominations`<br>CSV con UTF-8 BOM (`\uFEFF`) para Excel |

---

## 2. Detalle de Requerimientos Funcionales

### Módulo 1: Seguridad y Gestión de Usuarios

#### **RF01 — Autenticación, Gestión de Sesión y Consentimiento Informado**
* **Código:** `RF01`
* **Caso de Uso:** CU-01 (Autenticación y Validación de Privacidad).
* **Actores:** Administrador (Comisión Técnica), Árbitro, Oficial de Mesa.
* **Descripción:** El sistema debe proveer un mecanismo desacoplado para el inicio de sesión y validación de identidad (compatible con tokens Bearer JWT, Amazon Cognito User Pools y Microsoft Entra External ID). Adicionalmente, el sistema debe registrar de forma obligatoria y auditable la aceptación expresa del consentimiento informado para el tratamiento de datos personales de cada usuario, persistiendo la fecha y hora exacta (`dataConsentDate`) y la dirección IP de origen.
* **Criterios de Aceptación:**
  1. Si un usuario autenticado no ha registrado su consentimiento (`data_consent = false`), la interfaz debe desplegar un banner superior bloqueante de advertencia.
  2. El consentimiento se confirma formalmente mediante una petición `POST /api/users/consent`.
  3. Toda aceptación queda registrada en la bitácora inmutable de auditoría (`audit_logs`).

#### **RF02 — Segregación Estricta de Roles Técnicos (Anexo A.1)**
* **Código:** `RF02`
* **Caso de Uso:** CU-02 (Administración del Padrón Deportivo).
* **Actores:** Administrador (Comisión Técnica).
* **Descripción:** El sistema debe gestionar las acreditaciones deportivas de los usuarios mediante roles independientes y no excluyentes: `ADMIN_COMISION_TECNICA`, `ARBITRO` y `OFICIAL_MESA`. Conforme a la regla del **Anexo A.1**, el sistema debe permitir que un usuario posea una o ambas acreditaciones técnicas, manteniendo la segregación necesaria para que en las operaciones de asignación solo se habiliten los puestos pertinentes a sus roles válidos.
* **Criterios de Aceptación:**
  1. La Comisión Técnica puede asignar o revocar acreditaciones técnicas de forma granular mediante `PATCH /api/users/:id/roles`.
  2. Los roles se administran de forma independiente mediante casillas de verificación en la interfaz.
  3. Un usuario no puede quedar sin roles asignados si su cuenta se encuentra activa.

#### **RF03 — Administración y Estados de Cuenta del Padrón de Usuarios**
* **Código:** `RF03`
* **Caso de Uso:** CU-02 (Gestión de Cuentas y Estados).
* **Actores:** Administrador (Comisión Técnica).
* **Descripción:** El sistema debe permitir a la Comisión Técnica pre-registrar nuevos oficiales, consultar el padrón deportivo con filtros paginados por nombre, correo y acreditación técnica, y modificar el estado de la cuenta entre `ACTIVE`, `INACTIVE` y `PENDING_ROLE`.
* **Criterios de Aceptación:**
  1. Los usuarios con estado `INACTIVE` quedan automáticamente excluidos del cruce algorítmico de designaciones y bloqueados para iniciar sesión.
  2. Toda modificación de datos de perfil o estado de cuenta genera un registro en `AuditLog` (`USER_UPDATED`).

---

### Módulo 2: Disponibilidad Horaria

#### **RF04 — Declaración Masiva Semanal de Disponibilidad Horaria**
* **Código:** `RF04`
* **Caso de Uso:** CU-03 (Declaración de Disponibilidad Semanal).
* **Actores:** Árbitro, Oficial de Mesa.
* **Descripción:** El sistema debe permitir al personal técnico declarar su disponibilidad horaria por fecha calendario para una o varias semanas a través de una grilla interactiva, seleccionando entre las opciones: `HORARIO_1`, `HORARIO_2`, `FULL` (ambos bloques) o `NO` (no disponible).
* **Criterios de Aceptación:**
  1. Debe procesar declaraciones masivas atómicas mediante `POST /api/availability/bulk` sobre la clave compuesta `(user_id, date)`.
  2. Permite actualizar disponibilidades previas sin generar registros duplicados (operación idempotente tipo *upsert*).
  3. La interfaz web provee atajos de productividad para clonar la pauta de la semana anterior o marcar días completos en lote (**Anexo A.3**).

#### **RF05 — Validación Automatizada de Plazo Límite y Bloques Paramétricos (Anexo A.4)**
* **Código:** `RF05`
* **Caso de Uso:** CU-03 (Control de Plazo de Declaración).
* **Actores:** Sistema, Árbitro, Oficial de Mesa, Administrador (Comisión Técnica).
* **Descripción:** El sistema debe bloquear automáticamente la declaración y modificación de disponibilidad cuando la fecha actual supere el plazo reglamentario fijado para los **miércoles a las 23:59:59** de la semana en curso (`getDeadlineForDate`). Las solicitudes extemporáneas de árbitros u oficiales deben ser rechazadas con error HTTP `400 Bad Request`. Adicionalmente, el sistema debe estructurar los bloques según el tipo de día:
  * **Día Hábil (Laboral):** Horario 1 (15:30–19:30) y Horario 2 (19:30–22:00).
  * **Fin de Semana:** Horario 1 (09:00–15:00) y Horario 2 (15:00–22:00).
* **Criterios de Aceptación:**
  1. Si un usuario no administrador intenta declarar fuera de plazo, el sistema arroja error descriptivo (`Plazo de declaración vencido`).
  2. La Comisión Técnica cuenta con un mecanismo de excepción administrativa justificada (*override*) por fuerza mayor (`overrideDeadline: true`), el cual queda registrado en auditoría.
  3. Los bloques horarios se consultan dinámicamente desde la entidad `TimeBlockConfig`.

#### **RF06 — Consolidado Administrativo de Disponibilidad del Personal**
* **Código:** `RF06`
* **Caso de Uso:** CU-04 (Consolidado de Disponibilidad para Programación).
* **Actores:** Administrador (Comisión Técnica).
* **Descripción:** El sistema debe generar y presentar a la Comisión Técnica una vista consolidada de todo el personal disponible para una fecha o rango de fechas seleccionado, totalizando y agrupando por bloque (`HORARIO_1`, `HORARIO_2`, `FULL`) y filtrando por acreditación deportiva (`ARBITRO` u `OFICIAL_MESA`).
* **Criterios de Aceptación:**
  1. El endpoint `GET /api/availability/summary` agrupa el total de oficiales disponibles y enlista su detalle individual.
  2. Excluye automáticamente a usuarios con cuentas suspendidas o con declaración en bloque `NO`.

---

### Módulo 3: Integración y Cartelera de Partidos

#### **RF07 — Diagnóstico y Conectividad con Plataformas Externas**
* **Código:** `RF07`
* **Caso de Uso:** CU-05 (Prueba de Conectividad con Plataformas Externas).
* **Actores:** Administrador (Comisión Técnica), Sistema.
* **Descripción:** El sistema debe proveer interfaces y endpoints de diagnóstico (`GET /api/matches/integrations/test`) para verificar en tiempo real la conectividad con plataformas externas de gestión deportiva (Swish y NBN23).
* **Criterios de Aceptación:**
  1. La arquitectura implementa el patrón **Adapter / Provider** (`MatchSyncProvider`).
  2. Dispone de un proveedor Sandbox / Mock que simula de forma realista torneos y categorías chilenas a costo cero ($0 USD).

#### **RF08 — Cartelera Centralizada y Creación Manual de Encuentros**
* **Código:** `RF08`
* **Caso de Uso:** CU-06 (Gestión de Cartelera de Partidos).
* **Actores:** Administrador (Comisión Técnica), Árbitro, Oficial de Mesa.
* **Descripción:** El sistema debe mantener una cartelera centralizada de encuentros deportivos mostrando torneo, categoría, equipos (local vs. visitante), recinto, fecha, hora, estado y bloque horario clasificado automáticamente. Debe permitir a la Comisión Técnica registrar partidos de forma manual y autónoma (`platform: MANUAL`), generando identificadores únicos (`MANUAL-XXXXXXXX`).
* **Criterios de Aceptación:**
  1. El sistema calcula y asigna automáticamente el bloque horario (`HORARIO_1`, `HORARIO_2` o `AMBOS`) contrastando la hora programada con la configuración de `TimeBlockConfig` según sea día hábil o fin de semana.
  2. La cartelera admite filtros combinables por rango de fechas, torneo, gimnasio y estado.

#### **RF09 — Sincronización Asíncrona Programada y Bajo Demanda**
* **Código:** `RF09`
* **Caso de Uso:** CU-06 (Sincronización de Cartelera).
* **Actores:** Administrador (Comisión Técnica), Sistema.
* **Descripción:** El sistema debe procesar la ingesta y actualización de partidos desde plataformas externas de forma desacoplada y asíncrona mediante colas de tareas (**BullMQ + Redis**) activadas por cron o bajo demanda del administrador (`POST /api/matches/sync`).
* **Criterios de Aceptación:**
  1. En caso de corte o indisponibilidad del broker Redis, el sistema debe degradar automáticamente a una cola asíncrona en memoria (*Direct Async Fallback*), garantizando cero fallos en el servicio HTTP.
  2. Los partidos sincronizados evitan duplicados mediante la restricción de unicidad compuesta `(platform, external_id)`.

#### **RF10 — Detección Automática de Reprogramaciones y Alertas de Cambio**
* **Código:** `RF10`
* **Caso de Uso:** CU-06 (Reprogramación Operativa y Alertas).
* **Actores:** Sistema, Árbitro, Oficial de Mesa, Administrador (Comisión Técnica).
* **Descripción:** El sistema debe detectar automáticamente cambios críticos en los encuentros deportivos (cambio de fecha/hora, cambio de recinto o actualización a estados `RESCHEDULED`, `SUSPENDED` o `CANCELLED`).
* **Criterios de Aceptación:**
  1. Si un partido modificado posee personal técnico previamente nominado, el sistema debe despachar alertas automáticas por correo electrónico a cada oficial afectado (`MailService.sendMatchStatusChangeAlert`).
  2. Todo cambio de programación o recinto queda registrado con fines de trazabilidad en `AuditLog`.

---

### Módulo 4: Nominaciones y Asignaciones

#### **RF11 — Asignación y Composición de Ternas y Mesas de Control**
* **Código:** `RF11`
* **Caso de Uso:** CU-07 (Designación de Personal Técnico).
* **Actores:** Administrador (Comisión Técnica).
* **Descripción:** El sistema debe permitir a la Comisión Técnica conformar las ternas arbitrales y los puestos de mesa de control para un partido. Soporta los siguientes roles de partido (`MatchRole`):
  * **Cuerpo Arbitral:** Árbitro Principal, Árbitro 1 y Árbitro 2 (modalidad de 3 árbitros para alta competencia según **Anexo A.2**).
  * **Mesa de Control:** Oficial 1 (Anotador), Oficial 2 (Cronometrador) y Oficial 3 (Operador de 24 segundos).
* **Criterios de Aceptación:**
  1. Toda asignación se inicializa en estado `PENDING`.
  2. Se garantiza la unicidad de slot en el partido (`@@unique([matchId, matchRole])`) y la unicidad de usuario por encuentro (`@@unique([matchId, userId])`).

#### **RF12 — Cruce Algorítmico Inteligente con Disponibilidad Horaria**
* **Código:** `RF12`
* **Caso de Uso:** CU-07 (Filtrado de Candidatos Acreditados y Disponibles).
* **Actores:** Administrador (Comisión Técnica), Sistema.
* **Descripción:** El sistema debe proveer una función de cruce algorítmico en tiempo real (`GET /api/nominations/available-candidates`) que presente únicamente a los candidatos que hayan declarado disponibilidad compatible con la fecha y bloque horario del encuentro (`HORARIO_1`, `HORARIO_2` o `FULL`).
* **Criterios de Aceptación:**
  1. Los oficiales que declararon bloque `NO` o no registraron disponibilidad son clasificados como no disponibles.
  2. Permite a la Comisión Técnica aplicar una excepción justificada (*override*) con motivo obligatorio (`overrideAvailability: true`), auditada como `NOMINATION_OVERRIDDEN`.

#### **RF13 — Restricción Dura de Roles Técnicos y Detección de Topes Horarios (Anexo A.1)**
* **Código:** `RF13`
* **Caso de Uso:** CU-07 (Validación de Acreditación Técnica y Colisiones).
* **Actores:** Sistema.
* **Descripción:** El sistema debe aplicar validaciones estrictas e inviolables en la capa de negocio:
  1. **Separación de roles (Anexo A.1):** Un usuario no puede ser asignado a un puesto de árbitro si no posee el rol `ARBITRO`, ni a un puesto de mesa si no posee el rol `OFICIAL_MESA`. Cualquier intento es rechazado con error HTTP `400 Bad Request`.
  2. **Prevención de colisiones de horario:** El sistema detecta y bloquea la asignación simultánea de un oficial a dos partidos distintos que compartan fecha y bloque horario.

#### **RF14 — Despacho Automatizado de Notificaciones de Designación**
* **Código:** `RF14`
* **Caso de Uso:** CU-07 (Notificación de Asignación).
* **Actores:** Sistema, Árbitro, Oficial de Mesa.
* **Descripción:** Al momento de registrar una nominación en el sistema, este debe generar y enviar de manera automática un correo electrónico informativo al oficial designado con los detalles completos del encuentro (torneo, categoría, equipos, fecha, hora, recinto y rol asignado).
* **Criterios de Aceptación:**
  1. El sistema registra la fecha y hora de despacho (`notifiedAt`) y persiste la trazabilidad en la tabla `notifications`.

#### **RF15 — Confirmación Formal y Rechazo Justificado de Designaciones**
* **Código:** `RF15`
* **Caso de Uso:** CU-08 (Respuesta a la Designación Técnica).
* **Actores:** Árbitro, Oficial de Mesa, Administrador (Comisión Técnica).
* **Descripción:** El sistema debe permitir al oficial designado ingresar a su portal y responder formalmente a cada nominación pendiente: confirmándola (`CONFIRMED`) o rechazándola (`REJECTED`).
* **Criterios de Aceptación:**
  1. Si se rechaza la nominación, el sistema exige de forma obligatoria el ingreso de un motivo justificado (`rejectionReason`).
  2. La respuesta actualiza la marca temporal `respondedAt` y queda reflejada en la grilla de la Comisión Técnica.

#### **RF16 — Grilla Interactiva y Matriz de Visualización de Asignaciones**
* **Código:** `RF16`
* **Caso de Uso:** CU-07, CU-08 (Monitoreo de Cobertura de Encuentros).
* **Actores:** Administrador (Comisión Técnica), Árbitro, Oficial de Mesa.
* **Descripción:** El sistema debe proporcionar una vista tabular e interactiva de asignaciones con filtros combinables por torneo, recinto, fecha, oficial y estado de nominación (`PENDING`, `CONFIRMED`, `REJECTED`).
* **Criterios de Aceptación:**
  1. Permite a la Comisión Técnica monitorear en tiempo real la cobertura de partidos y el estado de confirmación de cada puesto.
  2. Permite revocar una designación (`DELETE /api/nominations/:id`), liberando el slot para reasignación.

---

### Módulo 5: Información, Recursos y Bóveda Segura

#### **RF17 — Repositorio Oficial de Reglamentos FIBA y Bases de Torneos**
* **Código:** `RF17`
* **Caso de Uso:** CU-10 (Consulta y Descarga de Material Técnico).
* **Actores:** Administrador (Comisión Técnica), Árbitro, Oficial de Mesa.
* **Descripción:** El sistema debe permitir a la Comisión Técnica publicar, categorizar y gestionar documentos oficiales (`type: DOCUMENTO`), tales como el Reglamento Oficial de Baloncesto FIBA, guías de mecánicas arbitrales y bases de competencias locales, permitiendo a los árbitros y oficiales consultarlos y descargarlos mediante enlaces directos a archivos PDF.
* **Criterios de Aceptación:**
  1. Los recursos de tipo documento soportan visibilidad pública (`PUBLIC`) o autenticada (`AUTHENTICATED`).
  2. La interfaz de usuario provee tarjetas de acceso rápido con visor o descarga directa.

#### **RF18 — Bóveda Segura de Credenciales API con Visibilidad Restringida (Anexo A.5)**
* **Código:** `RF18`
* **Caso de Uso:** CU-10 (Bóveda Segura de Acceso).
* **Actores:** Administrador (Comisión Técnica), Sistema.
* **Descripción:** El sistema debe proveer una bóveda centralizada para registrar credenciales, tokens y accesos a plataformas federativas (`type: CREDENCIAL`). En cumplimiento estricto del **Anexo A.5**, la capa de negocio fuerza incondicionalmente la visibilidad a `visibility: ADMIN`.
* **Criterios de Aceptación:**
  1. Árbitros y oficiales de mesa no pueden listar credenciales ni consultar su detalle directo por ID, recibiendo un error HTTP `403 Forbidden`.
  2. En la interfaz administrativa de la Comisión Técnica, las claves se muestran enmascaradas con opción de copiado y visualización protegida.

#### **RF19 — Tablón Digital de Comunicados Oficiales y Avisos Urgentes**
* **Código:** `RF19`
* **Caso de Uso:** CU-10 (Tablón de Avisos y Comunicados).
* **Actores:** Administrador (Comisión Técnica), Árbitro, Oficial de Mesa.
* **Descripción:** El sistema debe proveer un tablón digital de anuncios y comunicados oficiales (`type: COMUNICADO`), permitiendo a la Comisión Técnica difundir circulares, citaciones a clínicas de capacitación o avisos de contingencia deportiva.
* **Criterios de Aceptación:**
  1. Los comunicados son legibles para todos los usuarios autenticados.
  2. La interfaz incluye un motor de búsqueda textual por título y contenido.

#### **RF20 — Exportación Oficial de la Grilla de Asignaciones a Excel / CSV con BOM UTF-8**
* **Código:** `RF20`
* **Caso de Uso:** CU-09 (Exportación Oficial de la Programación Semanal).
* **Actores:** Administrador (Comisión Técnica).
* **Descripción:** El sistema debe permitir a la Comisión Técnica exportar la grilla completa o filtrada de designaciones técnicas en formato CSV estructurado (`GET /api/resources/export/nominations`), incorporando cabeceras de descarga directa y el prefijo de codificación Byte Order Mark (**UTF-8 BOM `\uFEFF`**).
* **Criterios de Aceptación:**
  1. Garantiza la apertura nativa e inmediata en Microsoft Excel sin alteraciones en tildes, caracteres especiales o nombres en español.
  2. Admite filtros por rango de fechas, torneo y gimnasio.
  3. Exporta: Fecha, Hora, Bloque Horario, Torneo, Categoría, Recinto, Equipos, Rol Designado, Nombre del Oficial, Email, Teléfono, Estado de Designación y Motivo de Rechazo.

---

## 3. Anexo A: Reglas de Negocio Críticas Incorporadas

* **Anexo A.1 — Separación Estricta de Roles:** Un usuario no puede ser nominado como árbitro si solo posee acreditación de oficial de mesa, y viceversa. Esta regla es validada tanto a nivel de backend (`BadRequestException`) como en el cruce de candidatos del frontend (**RF02, RF13**).
* **Anexo A.2 — Modalidad de 3 Árbitros:** Se incluyó el slot `ARBITRO_2` en el enum `MatchRole`, permitiendo ternas arbitrales completas para competencias de alto nivel (LNB) sin alterar la estructura relacional base (**RF11**).
* **Anexo A.3 — Atajos de Productividad en Disponibilidad:** El frontend incorpora botones para clonar la pauta semanal anterior o completar masivamente los días hábiles y fines de semana con un solo clic (**RF04**).
* **Anexo A.4 — Bloques Horarios Diferenciados por Tipo de Día:** Horario 1 y Horario 2 poseen rangos horarios distintos según el tipo de día (Día Hábil: 15:30–19:30 y 19:30–22:00; Fin de Semana: 09:00–15:00 y 15:00–22:00), almacenados y consultados desde la tabla `TimeBlockConfig` (**RF05, RF08**).
* **Anexo A.5 — Forzado Incondicional de Visibilidad para Credenciales:** Cada vez que se crea o modifica un recurso de tipo `CREDENCIAL`, la capa de servicio fuerza `visibility = ADMIN`, arrojando `403 Forbidden` a cualquier árbitro u oficial que intente consultarlo (**RF18**).

