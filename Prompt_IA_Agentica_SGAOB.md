# Prompt para IA Agéntica — Kickoff de Desarrollo del SGAOB

> Copia y pega este prompt completo como primer mensaje a tu IA agéntica (Claude Code, Cursor, etc.) dentro de un repositorio vacío o recién inicializado.

---

## 0. Rol y objetivo

Actúa como un **arquitecto/ingeniero de software senior full-stack**, con experiencia sólida en **TypeScript, React, NestJS, diseño de APIs REST, modelado de datos relacional y arquitecturas cloud**. Vas a liderar el desarrollo de un proyecto real de título (Capstone universitario), por lo que el código debe ser **profesional, mantenible y evaluable bajo estándares de industria**, no un prototipo desechable.

No empieces a escribir código todavía: primero lee todo este prompt, valida que el plan tiene sentido, y entrega los deliverables del **Paso 0** (sección 11) antes de generar la primera línea de código.

---

## 1. Contexto de negocio

El proyecto se llama **SGAOB — Sistema de Gestión de Árbitros y Oficiales de Básquetbol**. Es un Capstone de Ingeniería en Informática (Duoc UC) que digitaliza la gestión de personal técnico deportivo (árbitros y oficiales de mesa) de una asociación de básquetbol.

Hoy la coordinación se hace de forma manual e informal con **WhatsApp, Google Forms y planillas Excel**, generando errores de asignación, tiempos administrativos altos y mala comunicación. El sistema debe **reemplazar por completo** esos tres canales.

**Objetivo general:** centralizar, digitalizar y optimizar la gestión operativa del personal técnico deportivo mediante una plataforma web única.

---

## 2. Alcance: los 5 módulos del sistema

1. **Seguridad y Usuarios** — autenticación, roles (Administrador/Comisión Técnica, Árbitro, Oficial de Mesa), gestión CRUD de usuarios.
2. **Disponibilidad** — declaración de disponibilidad horaria por bloques (reemplaza Google Forms).
3. **Integración y Sincronización** — importación automática/manual de la cartelera de partidos desde plataformas externas **NBN23** y **Swish** vía API/Webhooks.
4. **Nominaciones/Asignaciones** — asignación de personal a partidos respetando disponibilidad, con notificación y confirmación/rechazo (reemplaza Excel).
5. **Información y Recursos** — repositorio documental, credenciales de terceros y tablón de anuncios (reemplaza WhatsApp).

---

## 3. Stack tecnológico obligatorio (no negociable)

- **Frontend:** React + **TypeScript**.
- **Backend:** NestJS + **TypeScript**.
- **Base de datos:** relacional (PostgreSQL), pensada para desplegarse en una capa gestionada económica (ej. AWS RDS / Azure Database, tier básico).
- **ORM:** Prisma o TypeORM (elige uno y sé consistente; Prisma es la sugerencia por DX y tipado, pero TypeORM es válido si prefieres la integración nativa de NestJS).
- **Autenticación:** delegada a **Azure**, usando **Microsoft Entra External ID** (el servicio CIAM actual de Microsoft para aplicaciones de cara a clientes/usuarios externos). *Nota importante:* Azure AD B2C —que es lo que suele aparecer primero al buscar "Azure" para este caso de uso— dejó de estar disponible para clientes nuevos desde mayo de 2025; Microsoft lo reemplazó por Entra External ID, así que crea el tenant ahí directamente y no partas por B2C. Implementación: OAuth2/OIDC contra Entra External ID (flujos de sign-up/sign-in personalizados vía "user flows"), emitiendo JWT que el backend NestJS valida (passport-azure-ad o `@azure/msal-node` + verificación de JWKS). El login sigue siendo por **correo y contraseña** desde la perspectiva del usuario (RF01); Entra External ID es quien gestiona esas credenciales — no implementes tu propio manejo de contraseñas en la base de datos, solo guarda el `id_externo`/`oid` del usuario y su rol de negocio (RF02, RF03) en tu propia tabla `User`.
- **Gestor de colas asíncrono:** BullMQ + Redis (o alternativa liviana equivalente) para las tareas de sincronización con NBN23/Swish y el reintento de notificaciones fallidas.
- **Mensajería/Notificaciones:** email (ej. Nodemailer / AWS SES / SendGrid, capa gratuita) + notificaciones in-app.
- **Arquitectura general:** Frontend (React) → API Gateway → Backend (NestJS, modular) → Base de datos + Gestor de colas + Mensajería. Comunicación HTTP/HTTPS, consumo de APIs RESTful y recepción de Webhooks.

**Restricción de presupuesto:** el presupuesto total del proyecto (dev + infraestructura) es de **USD 235**. Prioriza siempre servicios en capa gratuita/básica y **Docker Compose para desarrollo local** (Postgres + Redis) antes de asumir costos cloud.

---

## 4. Modelo de datos sugerido (punto de partida, valida y ajusta)

Entidades clave a modelar (ajusta nombres/relaciones según tu análisis, pero cúbrelas todas):

- `User` (id, nombre, email, rol, estado, consentimiento_datos, fecha_consentimiento)
- `Role` (Administrador/Comisión Técnica, Árbitro, Oficial de Mesa)
- `Availability` (usuario, día de semana, bloque horario: Horario1/Horario2/Full/NO)
- `Match` (id_origen_externo, fecha, hora, recinto, equipo_local, equipo_visita, categoría, torneo, estado: programado/suspendido/reprogramado/cancelado, plataforma_origen: NBN23/Swish)
- `Nomination` (match, usuario, rol_en_partido: Árbitro Principal/Árbitro 1/Oficial 1/2/3, estado: pendiente/confirmado/rechazado, motivo_rechazo)
- `Resource` (tipo: documento/credencial/comunicado, título, archivo_url o contenido, visibilidad)
- `IntegrationConfig` (plataforma, credenciales cifradas, estado_conexión)
- `AuditLog` (opcional pero recomendado para trazabilidad de nominaciones y cambios de partidos)

Diseña el modelo pensando en **escalabilidad** (es un criterio de evaluación explícito del Capstone) y en la **minimización de datos personales** (ver sección 6).

---

## 5. Requerimientos funcionales completos (RF01–RF20)

**Módulo Seguridad y Usuarios**
- RF01: registro y autenticación de usuarios mediante correo y contraseña.
- RF02: asignación de roles (Administrador/Comisión Técnica, Árbitro, Oficial de Mesa).
- RF03: administrador puede crear, editar, deshabilitar y listar perfiles.

**Módulo Disponibilidad**
- RF04: árbitros/oficiales ingresan disponibilidad por día de la semana.
- RF05: bloques horarios seleccionables (Horario 1, Horario 2, Full, NO).
- RF06: Comisión Técnica visualiza reporte consolidado de disponibilidad por fecha.

**Módulo Integración y Sincronización**
- RF07: configuración/conexión (API o Webhooks) con NBN23 y Swish.
- RF08: sincronización automatizada de partidos: fecha, horario, recinto, equipos, categoría, torneo.
- RF09: sincronización manual bajo demanda (botón "actualizar ahora").
- RF10: cada partido tiene un ID de origen único; si se suspende/cancela/reprograma externamente, el estado se actualiza automáticamente y se alerta al personal ya nominado.

**Módulo Nominaciones/Asignaciones**
- RF11: Comisión Técnica asigna personal a un partido.
- RF12: solo se puede asignar a usuarios con disponibilidad declarada para esa fecha/bloque.
- RF13: roles específicos por partido: Árbitro Principal, Árbitro 1, Oficial 1, Oficial 2, Oficial 3.
- RF14: notificación (email o in-app) al usuario nominado.
- RF15: el usuario puede confirmar o rechazar su nominación.
- RF16: vista de grilla/tabla de asignaciones por fecha, filtrable por torneo o recinto.

**Módulo Información y Recursos**
- RF17: sección "Recursos" para subir/enlazar documentos (bases, protocolos, material de estudio).
- RF18: almacenamiento seguro y visualización de credenciales de terceros.
- RF19: tablón de anuncios/comunicados generales.
- RF20: exportación de la grilla de asignaciones a PDF o Excel.

---

## 6. Requerimientos no funcionales (obligatorios de diseño, no opcionales)

- **Rendimiento:** 90% de transacciones web deben responder en <2s. Sincronización debe ser asíncrona vía cola, reflejando cambios de estado en BD en máx. 10s tras respuesta externa. Soportar ≥150 usuarios concurrentes sin degradación perceptible.
- **Seguridad:** integración segura con Azure / Microsoft Entra External ID; credenciales de terceros (NBN23/Swish) protegidas/cifradas en reposo; registro formal de consentimiento de tratamiento de datos por usuario.
- **Fiabilidad:** ante caída de NBN23/Swish, el sistema no debe fallar — debe alertar y mantener visibles los últimos datos sincronizados. Rollback + reintento en fallos de importación masiva. Reintento de notificaciones fallidas (máx. 3 veces). Tasa de errores 500 <0,5%.
- **Disponibilidad:** uptime 99,5% en horario clave (08:00–23:59). Mantenimientos solo en horario valle (02:00–06:00), notificados por el tablón. RTO <4h, RPO ≤24h (respaldos diarios).
- **Mantenibilidad:** separación clara Frontend/Backend, arquitectura modular (piensa en módulos NestJS 1:1 con los 5 módulos funcionales).
- **Portabilidad:** debe poder desplegarse indistintamente en AWS o Azure sin cambios de código, dentro del presupuesto.
- **Accesibilidad:** navegación completa por teclado (Tab) en toda la interfaz.
- **Usabilidad:** interfaz simple, clara y fácil de navegar.
- **Protección de datos:** minimizar los datos personales almacenados; pedir y registrar consentimiento explícito.

---

## 7. Casos de uso principales (resumen)

| ID | Caso de uso | Actor(es) principal(es) | RF asociados |
|---|---|---|---|
| CU-01 | Autenticar usuario | Todos los roles | RF01 |
| CU-02 | Gestionar perfiles y roles | Administrador | RF02, RF03 |
| CU-03 | Ingresar disponibilidad horaria | Árbitro, OMC | RF04, RF05 |
| CU-04 | Ver reporte consolidado de disponibilidad | Administrador | RF06 |
| CU-05 | Configurar integración NBN23/Swish | Administrador | RF07 |
| CU-06 | Sincronizar cartelera de partidos | Administrador, Sistema | RF08, RF09, RF10 |
| CU-07 | Asignar personal a partido (nominación) | Administrador | RF11–RF14 |
| CU-08 | Confirmar o rechazar nominación | Árbitro, OMC | RF15 |
| CU-09 | Ver y exportar grilla de asignaciones | Administrador | RF16, RF20 |
| CU-10 | Gestionar recursos, credenciales y comunicados | Administrador | RF17–RF19 |

Cada caso de uso tiene curso normal y cursos alternos definidos en el documento fuente (`PMOInformatica_Plantilla_de_Casos_de_Uso.docx`) — replica esa lógica de negocio exacta (incluyendo mensajes de error como "Usuario o contraseña inválidos" o "No hay personal disponible para los filtros seleccionados") en la implementación.

---

## 8. Restricciones del proyecto

- Presupuesto total: **USD 235**.
- Plazo fijo: semana 5 a semana 15 del semestre (11 semanas).
- Equipo de 3 personas (backend, frontend, documentación) — el código debe ser legible y dividido en tareas paralelizables por módulo.
- Stack obligatorio: React + NestJS (no proponer alternativas de framework).
- Dependencia de APIs externas (NBN23, Swish) fuera de nuestro control — diseña con **tolerancia a fallos** desde el día uno.
- Esfuerzo estimado: ~200 puntos de función (SiFP) y ~40 endpoints de backend — dimensiona el trabajo de forma realista y evita sobre-ingeniería.

---

## 9. Estándares de industria y buenas prácticas obligatorias

- **TypeScript estricto** (`strict: true`) en frontend y backend.
- **Arquitectura en capas / modular** en NestJS: `controller → service → repository`, un módulo NestJS por cada módulo funcional (Users, Availability, Integrations, Nominations, Resources), principios **SOLID**.
- **Validación de entrada** con `class-validator` / `class-transformer` (DTOs) en cada endpoint.
- **Documentación de API** autogenerada con `@nestjs/swagger` (OpenAPI).
- **Manejo de errores centralizado** (exception filters de NestJS) y logging estructurado.
- **Seguridad:** Helmet, CORS configurado explícitamente, rate limiting (`@nestjs/throttler`), variables sensibles solo en `.env` (nunca commiteadas — incluir `.env.example`).
- **Testing:** pruebas unitarias con Jest (backend y frontend), pruebas de integración/e2e con Supertest para la API, React Testing Library para componentes. Cobertura mínima razonable en la lógica de negocio crítica (disponibilidad, nominaciones).
- **Migraciones de base de datos** versionadas (Prisma Migrate o TypeORM migrations) — nunca `synchronize: true` en producción.
- **Control de versiones:** ramas por feature, **Conventional Commits** (`feat:`, `fix:`, `docs:`, etc.), PRs pequeños y revisables.
- **Calidad de código:** ESLint + Prettier configurados desde el inicio, con hook de pre-commit (Husky + lint-staged).
- **Entorno reproducible:** `docker-compose.yml` con Postgres y Redis para desarrollo local.
- **Accesibilidad:** HTML semántico, orden de tabulación correcto, etiquetas ARIA donde corresponda.
- **README completo:** instrucciones de instalación, variables de entorno requeridas, cómo correr tests, diagrama de arquitectura (aunque sea en texto/mermaid).

---

## 10. Plan de trabajo esperado (alineado al cronograma real del proyecto)

Sigue este orden de desarrollo — no adelantes módulos fuera de secuencia sin justificarlo:

1. **Diseño de arquitectura y modelo de datos** (ERD + estructura de carpetas + decisiones técnicas documentadas).
2. **Scaffolding**: repos/monorepo, backend NestJS y frontend React inicializados, linting, Docker Compose, CI básico (lint + test en cada push).
3. **Módulo Seguridad y Usuarios** (RF01–RF03) — incluye integración con Azure / Microsoft Entra External ID.
4. **Módulo Disponibilidad** (RF04–RF06).
5. **Módulo Integración y Sincronización** (RF07–RF10) — con cola asíncrona y manejo de reintentos.
6. **Módulo Nominaciones/Asignaciones** (RF11–RF16).
7. **Módulo Información y Recursos** (RF17–RF20).
8. **Pruebas de integración y validación piloto.**
9. **Corrección de errores y optimización.**
10. **Documentación final.**

---

## 11. Paso 0 — Qué debes entregarme ANTES de escribir código

1. Un diagrama/descripción del **modelo entidad-relación** propuesto (puede ser en Mermaid).
2. La **estructura de carpetas** propuesta para el monorepo (o repos separados), justificando la elección.
3. Confirmación de qué ORM usarás y por qué.
4. Cualquier ambigüedad o supuesto que detectes en este prompt (pregúntame antes de asumir). La autenticación ya está decidida: **Azure / Microsoft Entra External ID** — no la vuelvas a poner en duda ni propongas Cognito/Google como alternativa.
5. Un plan de commits/PRs para el primer módulo (Seguridad y Usuarios).

Solo después de que yo valide estos puntos, empieza a generar código, módulo por módulo, siguiendo el orden de la sección 10.

---

## 12. Criterios de aceptación (Definition of Done)

El proyecto se considera correctamente implementado cuando:
- Los 20 requerimientos funcionales (RF01–RF20) están implementados y probados.
- La sincronización con NBN23 y Swish funciona en un ambiente de prueba (mock si aún no hay acceso real a las APIs).
- Existen pruebas automatizadas para la lógica crítica (cruce disponibilidad↔nominación, actualización de estado de partidos).
- La documentación (README + Swagger) permite a un tercero levantar el proyecto sin ayuda adicional.
- El sistema cumple los NFR de la sección 6 de forma verificable (o al menos diseñado para cumplirlos, dado que es un entorno académico sin carga real de producción).

---

## Anexo A — Decisiones de negocio confirmadas (post Paso 0)

Estas reglas fueron confirmadas por el equipo tras revisar el ERD y las ambigüedades del Paso 0. **Tienen prioridad sobre cualquier supuesto que la IA haya hecho antes de esta fecha** — si algo en las secciones anteriores contradice esto, gana lo que dice aquí.

### A.1 Separación estricta de roles Árbitro / Oficial de Mesa (corrige RF13, CU-07)
Árbitro y Oficial de Mesa (OMC) son roles de negocio **independientes**, aunque el trabajo se parezca. Una persona puede tener uno, el otro, o ambos.
- Para nominar a alguien como `ARBITRO_PRINCIPAL`, `ARBITRO_1` o `ARBITRO_2`, el sistema **debe validar** que esa persona tiene el rol `ARBITRO` asignado (tabla `UserRole`).
- Para nominar a alguien como `OFICIAL_1`, `OFICIAL_2` u `OFICIAL_3`, debe tener el rol `OFICIAL_MESA` asignado.
- Esta validación es **dura**: si la persona no tiene el rol correspondiente, no debe aparecer como opción seleccionable en el paso de nominación (CU-07, paso 2) — no es una advertencia que se pueda saltar.
- Si un usuario tiene ambos roles, puede ser nominado libremente a cualquiera de los dos tipos de slot.

### A.2 Modalidad de 3 árbitros (corrige el modelo de datos de `Nomination`)
Un partido tiene como máximo **1 Árbitro Principal** (ya garantizado por la restricción de unicidad `(match_id, match_role)`). La cantidad normal de árbitros es 2 (`ARBITRO_PRINCIPAL` + `ARBITRO_1`), pero en competencias importantes se usa una modalidad de 3 árbitros.
- Agregar el valor `ARBITRO_2` al enum `match_role` de `Nomination`.
- No es necesario un campo nuevo de "modalidad" en `Match`: `ARBITRO_2` es simplemente un slot opcional que se llena solo cuando corresponde. La misma restricción de unicidad ya evita duplicados.

### A.3 Disponibilidad: ciclo semanal con atajo "misma semana anterior" (resuelve Ambigüedad 1)
Se mantiene la Opción A del ERD original (`Availability` por fecha de calendario específica, no plantilla fija). Se agrega una regla de UX, no de esquema:
- El flujo habitual es que cada domingo el usuario declara su disponibilidad para la semana siguiente.
- Al hacerlo, el formulario debe ofrecer la opción de **"mantener igual que la semana pasada"** (copia los bloques de la semana anterior como valores por defecto) o **personalizar día por día**.
- No se requiere una tabla de "plantilla recurrente" separada; esto es lógica de frontend/servicio, no de modelo de datos.

### A.4 Bloques horarios reales, distintos por tipo de día (resuelve Ambigüedad 2)
Los bloques `HORARIO_1` / `HORARIO_2` **no tienen un horario fijo universal** — dependen de si la fecha es día hábil o fin de semana:
- **Día hábil (Lunes a Viernes, principalmente torneos escolares):** `HORARIO_1` = 15:30–19:30, `HORARIO_2` = 19:30–22:00.
- **Fin de semana (Sábado y Domingo):** `HORARIO_1` = 9:00–15:00, `HORARIO_2` = 15:00–22:00.
- Como RF05 exige que estos bloques sean *configurables*, no los hardcodees en el código. Crea una tabla de referencia pequeña (ej. `TimeBlockConfig`: `day_type` [LABORAL, FIN_DE_SEMANA] + `block_code` [HORARIO_1, HORARIO_2] + `start_time` + `end_time`), editable desde un panel de administración, para que se puedan ajustar sin un nuevo deploy.
- El día hábil/fin de semana se determina a partir de la `date` ya guardada en `Availability` — no agregues un campo `day_of_week` redundante (ver Anexo A.5).

### A.5 Correcciones menores al ERD del Paso 0
- **`Availability`:** eliminar el campo `day_of_week` como columna almacenada; derivarlo siempre a partir de `date` en tiempo de consulta/aplicación, para evitar que ambos valores queden inconsistentes.
- **`Resource`:** cuando `type = CREDENCIAL`, la capa de servicio debe forzar `visibility = ADMIN` sin importar lo que se envíe desde el cliente — no depender solo del campo `visibility` puesto a mano.

