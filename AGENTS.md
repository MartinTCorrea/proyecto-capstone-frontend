# AGENTS.md — SGAOB

Proyecto Capstone: Sistema de Gestión de Árbitros y Oficiales de Básquetbol.

**Antes de ejecutar cualquier tarea, lee completo `docs/Prompt_IA_Agentica_SGAOB.md`,
incluyendo el "Anexo A — Decisiones de negocio confirmadas" al final del archivo.**
Ese archivo contiene el contexto de negocio, los requerimientos funcionales (RF01–RF20),
los casos de uso, el cronograma y los criterios de aceptación. Este AGENTS.md solo
resume las reglas que no cambian entre tareas. **El Anexo A tiene prioridad sobre
cualquier supuesto anterior si hay contradicción.**

## Reglas críticas de negocio (Nominaciones — ver Anexo A para el detalle completo)
- Árbitro y Oficial de Mesa son roles independientes. Nominar como árbitro requiere
  rol `ARBITRO`; nominar como oficial requiere rol `OFICIAL_MESA`. Es una validación
  dura, no una advertencia salteable.
- Un partido admite hasta 3 árbitros (`ARBITRO_PRINCIPAL`, `ARBITRO_1`, `ARBITRO_2`),
  con máximo 1 Árbitro Principal. `ARBITRO_2` es un slot opcional para competencias
  importantes.
- Bloques horarios (`HORARIO_1`/`HORARIO_2`) dependen de si la fecha es día hábil o
  fin de semana — no son valores fijos. Deben quedar en una tabla de configuración,
  no hardcodeados.

## Stack obligatorio (no proponer alternativas)
- Frontend: React + TypeScript
- Backend: NestJS + TypeScript
- Base de datos: PostgreSQL
- ORM: Prisma o TypeORM (uno solo, consistente en todo el proyecto)
- Auth: Azure / Microsoft Entra External ID (OAuth2/OIDC, JWT). No usar Azure AD B2C
  (deprecado para clientes nuevos), no proponer Cognito ni Google.
- Colas: BullMQ + Redis para sincronización con NBN23/Swish
- Entorno local: Docker Compose (Postgres + Redis)

## Reglas de calidad, siempre
- TypeScript en modo `strict`.
- Arquitectura modular en NestJS (un módulo por módulo funcional), patrón
  controller → service → repository.
- DTOs con `class-validator` / `class-transformer` en cada endpoint.
- Documentar la API con `@nestjs/swagger`.
- Escribir tests (Jest) para toda lógica de negocio nueva, especialmente el cruce
  disponibilidad↔nominación y la actualización de estado de partidos.
- Migraciones de base de datos versionadas, nunca `synchronize: true`.
- ESLint + Prettier; Conventional Commits (`feat:`, `fix:`, `docs:`, etc.).
- Nunca commitear secretos: usar `.env` + `.env.example`.

## Antes de escribir código de un módulo nuevo
1. Resume el plan (modelo de datos afectado, endpoints, componentes) en el chat.
2. Espera confirmación si hay alguna ambigüedad no cubierta en el prompt de referencia.
3. Sigue el orden de módulos del cronograma (sección 10 del prompt de referencia):
   Seguridad y Usuarios → Disponibilidad → Integración/Sincronización →
   Nominaciones → Recursos.

## Restricciones del proyecto
Presupuesto total USD 235. Plazo: semana 5 a semana 15 del semestre. Equipo de 3
personas. Prioriza siempre servicios en capa gratuita/básica.
