# SGAOB — Documento de Avance de Proyecto: PR8.5
**Sistema de Gestión de Árbitros y Oficiales de Básquetbol**  
**Proyecto Capstone — Ingeniería en Informática, Duoc UC**  
**Hito:** Fase de Investigación, Pruebas y Factibilidad Técnica de APIs Externas (NBN23 / Swish)  
**Fecha de corte:** Septiembre 2026  
**Equipo de desarrollo:** SGAOB Team  

---

## 1. Resumen Ejecutivo

El presente informe documenta los resultados técnicos de la fase de análisis e investigación del **PR8.5**, ejecutada de manera previa al desarrollo del **Módulo 3: Integración y Sincronización (RF07–RF10)**.

El objetivo central de este hito fue evaluar exhaustivamente la factibilidad, disponibilidad, estructura de datos y viabilidad operativa de consumir APIs públicas o comunitarias para la sincronización automática de partidos de básquetbol (específicamente NBN23 y Swish), garantizando a la vez que el sistema SGAOB cuente con una **arquitectura 100% autónoma y tolerante a fallos**, capaz de funcionar de forma independiente incluso si no se dispone de credenciales de pago o acceso a servidores de terceros.

Para ello, se descargaron y auditaron dos repositorios de código abiertos en el espacio de trabajo temporal:
1. `https://github.com/Guuri11/swish`
2. `https://github.com/NBN23dev/widget-docs`

A continuación se detalla el análisis de cada componente, las conclusiones técnicas y el diseño de la arquitectura de sincronización que se implementará en el PR9.

---

## 2. Auditoría Técnica de Repositorios

### 2.1 Repositorio 1: `Guuri11/swish`

- **URL origen:** `https://github.com/Guuri11/swish`
- **Autor:** Guuri11 (Desarrollador independiente).
- **Stack tecnológico analizado:** Java 17, Spring Boot, Spring Security, Spring Data JPA, H2 Database (en memoria), WebSockets, OpenAPI/Swagger.
- **Propósito del proyecto:** Es una aplicación backend escolar/universitaria para un marcador electrónico (*scoreboard*) que permite realizar operaciones CRUD locales de partidos (`Games`), jugadores (`Players`), usuarios y equipos. Su demostración incluye un partido de prueba simulado de la NBA (Golden State Warriors vs Los Angeles Lakers 2021).
- **Hallazgo clave:**
  - El proyecto **NO** es un cliente, SDK ni puente hacia la plataforma oficial de básquetbol NBN23 Swish.
  - Es simplemente un proyecto personal que utilizó la palabra *"Swish"* (término tradicional del básquetbol para un tiro que entra limpio a la canasta) como nombre de su aplicación.
- **Dictamen técnico:** **Descartado.** No proporciona conectividad con los sistemas de la federación ni con datos oficiales de partidos.

### 2.2 Repositorio 2: `NBN23dev/widget-docs`

- **URL origen:** `https://github.com/NBN23dev/widget-docs`
- **Autor:** NBN23dev (Organización oficial de desarrollo de NBN23).
- **Stack tecnológico analizado:** Documentación técnica de integración web HTML/JavaScript para componentes embebidos (*widgets*).
- **Propósito del proyecto:** Describe cómo las ligas, clubes o federaciones afiliadas a NBN23 pueden incrustar el widget oficial de resultados y calendarios en sus propios sitios web (ej. WordPress o HTML plano) utilizando el script compilado `https://widget.nbn23.com/widget-react.js.gz`.
- **Hallazgo clave:**
  - El widget requiere obligatoriamente una clave de acceso:
    ```javascript
    swish_widget_app.init({
      mountOn: "my_widget",
      apiKey: "mandatoryApiKey",
    });
    ```
  - La clave `apiKey` es provista de forma contractual y cerrada por NBN23 a las organizaciones con licencias comerciales para identificar la liga o torneo a renderizar en el navegador del cliente.
  - El repositorio **no documenta una API REST pública ni abierta** de servidor a servidor (backend-to-backend) con endpoints JSON para la descarga automatizada de carteleras por parte de aplicaciones de terceros independientes.
  - Los scripts del widget ejecutan peticiones cifradas/minificadas directamente desde el navegador contra microservicios propietarios de NBN23 bajo control de origen (CORS) y autenticación restringida.
- **Dictamen técnico:** Confirma que el ecosistema oficial de NBN23 opera bajo un modelo de API comercial cerrada para clientes federados.

---

## 3. Restricciones del Proyecto Capstone y Alineamiento con el Prompt de Referencia

Al contrastar la realidad del ecosistema con las reglas del proyecto:
1. **Presupuesto Máximo (USD $235):** Las licencias de acceso a APIs privadas de gestión deportiva federada típicamente conllevan costos de miles de dólares por temporada, excediendo ampliamente el presupuesto total del proyecto Capstone.
2. **Requerimiento No Funcional de Fiabilidad (Sección 6 del Prompt):**
   > *"Ante caída de NBN23/Swish, el sistema no debe fallar — debe alertar y mantener visibles los últimos datos sincronizados."*
3. **Criterio de Aceptación Explícito (Sección 12 del Prompt):**
   > *"La sincronización con NBN23 y Swish funciona en un ambiente de prueba (mock si aún no hay acceso real a las APIs)."*
4. **Independencia Operativa y Autonomía:**
   - La Comisión Técnica debe ser capaz de operar el sistema SGAOB en torneos no federados, ligas escolares (ej. Copa Soprole), torneos universitarios o municipales donde NBN23 no se utiliza.
   - En consecuencia, el sistema **debe disponer de creación y edición 100% manual de partidos**, manteniendo las mismas capacidades de nominación, disponibilidad horaria y notificaciones.

---

## 4. Arquitectura de Solución para el Módulo de Sincronización (Módulo 3)

Para dar respuesta rigurosa tanto a los requerimientos funcionales (RF07–RF10) como a la autonomía del sistema, se ha diseñado una arquitectura basada en el **Patrón Adapter / Provider** con desacoplamiento total:

```mermaid
flowchart TD
    subgraph Frontend["Frontend (React + Tailwind)"]
        MatchList["Cartelera de Partidos (/partidos)"]
        CreateMatch["Modal Crear Partido Manual"]
        SyncButton["Botón Sincronizar Ahora (RF09)"]
        ConfigTab["Configuración Conexión (RF07)"]
    end

    subgraph BackendAPI["Backend NestJS (Módulo Matches & Integrations)"]
        MatchesController["MatchesController (CRUD & Sync Trigger)"]
        SyncService["MatchSyncService"]
        BullQueue["Cola Asíncrona BullMQ (match-sync-queue)"]
        QueueProcessor["SyncQueueProcessor (Worker)"]
        StateDetector["Detector de Cambios de Estado (RF10)"]
    end

    subgraph Providers["Capa de Proveedores (Patrón Adapter)"]
        ProviderInterface["Interfaz: MatchSyncProvider"]
        MockProvider["MockSyncProvider (Por defecto / Sandbox)\n- Generador de fixture chileno realista\n- Simulación de cambios de horario/suspensión"]
        Nbn23Provider["Nbn23SyncProvider (Adaptador Oficial)\n- Conexión vía NBN23_API_KEY y API_URL"]
    end

    subgraph Data["Persistencia y Notificaciones"]
        PostgresDB[("PostgreSQL 18\n(Tablas matches, audit_logs)")]
        MailService["MailService (Alerta a árbitros nominados si cambia estado)"]
        Redis[("Redis (Broker de Cola)")]
    end

    SyncButton -->|POST /api/matches/sync| MatchesController
    CreateMatch -->|POST /api/matches (platform: MANUAL)| MatchesController
    MatchesController --> BullQueue
    BullQueue -.-> Redis
    QueueProcessor --> SyncService
    SyncService --> ProviderInterface
    ProviderInterface -.-> MockProvider
    ProviderInterface -.-> Nbn23Provider
    SyncService --> StateDetector
    StateDetector --> PostgresDB
    StateDetector -->|Si partido cambia de fecha/hora o suspende| MailService
```

### 4.1 Componentes de la Arquitectura

1. **Gestión Manual de Partidos (`platform: MANUAL`):**
   - Endpoints `POST /api/matches`, `PATCH /api/matches/:id`, `DELETE /api/matches/:id`.
   - Permite a la Comisión Técnica registrar partidos indicando torneo, categoría, equipos, recinto y fecha/hora.
   - Calcula automáticamente el bloque horario (`HORARIO_1`, `HORARIO_2` o `AMBOS`) mediante la tabla `TimeBlockConfig` (Anexo A.4).
2. **Proveedor Sandbox / Mock (`MockSyncProvider`):**
   - Proveedor predeterminado y listo para usar en demostraciones y defensas del proyecto Capstone sin costo alguno.
   - Genera carteleras realistas de básquetbol nacional (ej. LNB Chile, Libcentro, Torneos Universitarios FENAUDE, Torneos Escolares), con equipos reales (ej. Universidad Católica, Boston College, Colegio Los Leones, Sportiva Italiana, etc.).
   - Admite simulación de eventos en vivo: reprogramación de horarios, cambio de recintos y suspensión de partidos para probar en caliente el RF10.
3. **Adaptador para APIs Externas (`Nbn23SyncProvider`):**
   - Implementa la interfaz `MatchSyncProvider`.
   - Si en el archivo local `.env` se configuran `NBN23_API_URL` y `NBN23_API_KEY`, el conector realiza peticiones HTTP reales mediante `HttpService` de NestJS (`@nestjs/axios`).
4. **Cola de Procesamiento Asíncrono (BullMQ + Redis):**
   - Cumple el requerimiento no funcional de rendimiento (reflejo en base de datos en menos de 10s con tolerancia a reintentos ante fallos).
   - Cola `match-sync-queue` que procesa tanto la sincronización programada periódica (cron) como la sincronización manual bajo demanda activada por el usuario (RF09).
5. **Detección Automática de Cambios de Estado y Notificación (RF10):**
   - Si un partido ya importado sufre modificaciones externas en su fecha/hora o pasa a estado `SUSPENDED` o `CANCELLED`, el motor detecta la discrepancia, actualiza el registro en PostgreSQL, registra una traza de auditoría en `AuditLog` y despacha un correo de alerta inmediata al personal ya asignado en la tabla `nominations`.

---

## 5. Trazabilidad con los Requerimientos Funcionales (Módulo 3)

| Código RF | Requerimiento Funcional | Estrategia de Implementación |
|---|---|---|
| **RF07** | Configuración/conexión con NBN23 y Swish | Modelo `IntegrationConfig`, endpoints para parametrizar credenciales y probar conectividad con fallback a modo Mock. |
| **RF08** | Sincronización automatizada de partidos (fecha, recinto, equipos, torneo) | Tarea programada en cola BullMQ que procesa lotes de partidos y los clasifica en `MatchTimeBlock`. |
| **RF09** | Sincronización manual bajo demanda (botón "actualizar ahora") | Endpoint `POST /api/matches/sync` que encola inmediatamente el trabajo y retorna feedback visual en frontend. |
| **RF10** | Identificador de origen único y alertas automáticas ante reprogramación/suspensión | Constraint `@@unique([platform, externalId])`, detección de diffs en `MatchSyncService` y disparo de alertas al personal nominado. |
| **Autonomía** | Creación y administración manual de partidos y torneos | Soporte de `MatchPlatform.MANUAL` en el modelo y formulario interactivo completo en frontend. |

---

## 6. Próximos Pasos (Plan PR9 y PR10)

- **PR9 (Backend):**
  1. Actualización de Prisma (`MatchPlatform` con soporte `MANUAL`).
  2. Implementación de `MatchSyncModule` con BullMQ, `MatchSyncProvider`, `MockSyncProvider` y `Nbn23SyncProvider`.
  3. Endpoints de partidos: `GET /api/matches` (filtros por fecha, torneo, estado), `POST /api/matches` (creación manual), `PATCH /api/matches/:id` (edición manual) y `POST /api/matches/sync` (sincronización bajo demanda).
  4. Lógica de cálculo automático de `timeBlock` y detector de alertas RF10.
  5. Pruebas unitarias en Jest y pruebas E2E con PostgreSQL y Redis.
- **PR10 (Frontend):**
  1. Cartelera visual de partidos (`MatchesPage`), filtros por fecha, torneo y recinto.
  2. Modal interactivo para creación manual de partidos.
  3. Botón de sincronización con indicador de carga y alertas de estado.
