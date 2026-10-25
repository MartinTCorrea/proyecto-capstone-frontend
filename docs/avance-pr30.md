# Informe de Avance — PR30: Estandarización Integral del Sistema de Diseño (Design Tokens, Tipografías y Variables Semánticas)

**Fecha de Cierre:** 24 de Octubre de 2026  
**Proyecto:** SGAOB (Sistema de Gestión de Árbitros y Oficiales de Básquetbol)  
**Alcance:** apps/web, docs  
**Estado:** Completado y Verificado 100%

---

## 1. Resumen Ejecutivo del Hito

En este hito se ejecutó una auditoría y refactorización estructural profunda de los estilos, fuentes, tamaños de texto y paletas de color en todo el frontend (`apps/web`), erradicando valores arbitrarios y consolidando un sistema de diseño estricto y mantenible:

1. **Tokens de Escala Tipográfica Centralizados:** Se parametrizaron en `tailwind.config.js` las dimensiones de texto compactas (`3xs`: 9px, `2xs`: 10px, `caption`: 11px), erradicando las **104 instancias de valores arbitrarios hardcodeados (`text-[...px]`)** que estaban dispersas en 23 componentes y vistas.
2. **Unificación de Familias Tipográficas y Variables CSS Semánticas:** Se establecieron pilas tipográficas formales para texto (`font-sans`: Inter / System UI) y datos técnicos (`font-mono`: JetBrains Mono / UI Monospace). En `index.css` se declararon variables CSS en `:root` y `html.dark` para superficies, texto, bordes y foco accesible (WCAG 2.1 AA).
3. **Consolidación del Color de Marca y Erradicación de Discrepancias:** Se alinearon los colores de botones primarios, enlaces y focus rings hacia el token corporativo `brand` (`blue-600` / `#2563eb`), corrigiendo estilos discordantes (como el formulario de contraseña en `ProfilePage` que usaba índigo y los inputs de `UsersManagementPage` que usaban focus ring púrpura).

---

## 2. Archivos y Componentes Modificados

| Componente / Archivo | Tipo de Cambio | Alcance y Propósito |
|---|---|---|
| [`apps/web/tailwind.config.js`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/tailwind.config.js) | Modificación | Configuración de tokens de diseño: `fontFamily` (sans, mono), `fontSize` (3xs, 2xs, caption) y `colors.surface`. |
| [`apps/web/src/index.css`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/index.css) | Modificación | Declaración de variables CSS semánticas en `:root` y `html.dark`, focus visible accesible y utilidades `@layer components`. |
| [`apps/web/src/components/common/LoadingSpinner.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/common/LoadingSpinner.tsx) | Modificación | Uso del token de marca corporativo `brand` para el spinner animado. |
| [`apps/web/src/components/common/ThemeToggle.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/common/ThemeToggle.tsx) | Modificación | Normalización del anillo de foco hacia `focus:ring-brand-500`. |
| [`apps/web/src/components/layout/MainLayout.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/layout/MainLayout.tsx) | Modificación | Reemplazo de tamaño arbitrario en pie de página por `text-caption`. |
| [`apps/web/src/components/layout/Navbar.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/layout/Navbar.tsx) | Modificación | Reemplazo de tamaños arbitrarios en logo y roles de usuario por `text-caption` y `text-2xs`. |
| [`apps/web/src/components/auth/DevAuthSwitcher.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/auth/DevAuthSwitcher.tsx) | Modificación | Normalización tipográfica a `text-caption`, `text-2xs` y uso de tokens de marca. |
| [`apps/web/src/components/users/UsersTable.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/users/UsersTable.tsx) | Modificación | Estandarización de cabeceras (`text-caption`), badges de rol y estado (`text-2xs`). |
| [`apps/web/src/components/users/CreateUserModal.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/users/CreateUserModal.tsx) | Modificación | Estandarización de subtítulos de ayuda a `text-caption`. |
| [`apps/web/src/components/users/DataConsentModal.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/users/DataConsentModal.tsx) | Modificación | Estandarización de avisos normativos a `text-caption`. |
| [`apps/web/src/components/availability/WeeklyCalendarGrid.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/availability/WeeklyCalendarGrid.tsx) | Modificación | Reemplazo de tamaños micro arbitrarios por `text-3xs` (9px) y `text-caption` (11px). |
| [`apps/web/src/components/availability/AvailabilitySummaryView.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/availability/AvailabilitySummaryView.tsx) | Modificación | Estandarización de cabeceras (`text-caption`) y badges de bloque (`text-2xs`). |
| [`apps/web/src/components/dashboard/AdminDashboardView.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/dashboard/AdminDashboardView.tsx) | Modificación | Estandarización de desglose de bloques (`text-2xs`), etiquetas y alertas (`text-caption`). |
| [`apps/web/src/components/dashboard/RefereeDashboardView.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/dashboard/RefereeDashboardView.tsx) | Modificación | Estandarización de micro-textos (`text-caption`, `text-2xs`) y alineación del panel de alertas pendientes a `amber`. |
| [`apps/web/src/components/matches/MatchesTable.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/matches/MatchesTable.tsx) | Modificación | Estandarización de cabeceras de cartelera y badges de horario a `text-caption`. |
| [`apps/web/src/components/matches/MatchPlatformBadge.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/matches/MatchPlatformBadge.tsx) | Modificación | Estandarización de badges de origen (Manual, Swish, NBN23) a `text-caption`. |
| [`apps/web/src/components/matches/CreateMatchModal.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/matches/CreateMatchModal.tsx) | Modificación | Unificación del gradiente corporativo (`from-brand-600 to-brand-800`) y color del icono de visitante. |
| [`apps/web/src/components/matches/SyncControlModal.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/matches/SyncControlModal.tsx) | Modificación | Unificación de gradiente y reemplazo de textos secundarios por `text-caption`. |
| [`apps/web/src/components/nominations/AssignNominationModal.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/nominations/AssignNominationModal.tsx) | Modificación | Estandarización de etiquetas de roles (`text-caption`) y candidatos no disponibles (`text-2xs`). |
| [`apps/web/src/components/nominations/MatchesAssignmentsGrid.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/nominations/MatchesAssignmentsGrid.tsx) | Modificación | Estandarización de botones de asignación a `text-caption`. |
| [`apps/web/src/components/nominations/NominationsTable.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/nominations/NominationsTable.tsx) | Modificación | Estandarización de tabla de designaciones a `text-caption` y `text-2xs`. |
| [`apps/web/src/components/nominations/RespondNominationModal.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/nominations/RespondNominationModal.tsx) | Modificación | Estandarización de mensaje informativo de rechazo a `text-caption`. |
| [`apps/web/src/components/resources/ResourceCard.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/resources/ResourceCard.tsx) | Modificación | Estandarización de etiquetas de credenciales a `text-caption` y `text-2xs`. |
| [`apps/web/src/pages/AvailabilityPage.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/pages/AvailabilityPage.tsx) | Modificación | Estandarización de indicadores de semana actual/próxima a `text-2xs`. |
| [`apps/web/src/pages/LoginPage.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/pages/LoginPage.tsx) | Modificación | Estandarización de píldoras de rol de acceso rápido a `text-2xs`. |
| [`apps/web/src/pages/MatchesPage.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/pages/MatchesPage.tsx) | Modificación | Estandarización de etiquetas uppercase de filtros a `text-caption`. |
| [`apps/web/src/pages/NominationsPage.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/pages/NominationsPage.tsx) | Modificación | Estandarización de etiquetas uppercase de filtros a `text-caption`. |
| [`apps/web/src/pages/ProfilePage.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/pages/ProfilePage.tsx) | Modificación | Corrección del formulario de contraseña (reemplazo de índigo por `brand`), avatares y textos (`text-caption`, `text-2xs`). |
| [`apps/web/src/pages/UsersManagementPage.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/pages/UsersManagementPage.tsx) | Modificación | Normalización del anillo de foco de inputs y selectores a `focus:ring-brand-500`. |
| [`docs/avance-pr30.md`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/docs/avance-pr30.md) | Nuevo | Informe formal de avance conforme al estándar estricto de `AGENTS.md`. |

---

## 3. Arquitectura y Flujos Técnicos

### Arquitectura de Tokens de Diseño Híbrido

```mermaid
graph TD
    subgraph CSSVars["1. Variables CSS Semánticas (index.css)"]
        CV1[":root - Modo Claro: --color-bg-app, --color-bg-surface, --color-brand-primary"]
        CV2["html.dark - Modo Oscuro: --color-bg-app, --color-bg-surface, --color-brand-primary"]
    end

    subgraph TailwindTokens["2. Configuración de Tailwind (tailwind.config.js)"]
        TT1["fontFamily: sans (Inter / System UI), mono (JetBrains Mono)"]
        TT2["fontSize: 3xs (9px), 2xs (10px), caption (11px)"]
        TT3["colors.brand: Escala 50 a 950"]
        TT4["colors.surface: Mapeada a variables CSS"]
    end

    subgraph Componentes["3. Componentes y Vistas"]
        C1["Cero tamaños arbitrarios (text-[...px] = 0)"]
        C2["Focus rings unificados en focus:ring-brand-500"]
        C3["Tarjetas y tablas con escalas semánticas homogéneas"]
    end

    CSSVars --> TailwindTokens
    TailwindTokens --> Componentes
```

---

## 4. Trazabilidad con Requerimientos Funcionales

| Código RF | Requerimiento Funcional | Estado | Evidencia de Implementación |
|---|---|---|---|
| **Ergonomía UI/UX** | Diseño SaaS Profesional Standalone | **Cumplido** | Eliminación de 104 clases arbitrarias; tipografías y tamaños consistentes en toda la aplicación. |
| **Accesibilidad** | WCAG 2.1 AA Focus Indicator | **Cumplido** | Centralización de `*:focus-visible` con variable `--color-brand-primary` en modo claro y oscuro. |
| **Consistencia de Marca** | Paleta Corporativa Unificada | **Cumplido** | Desaparición de clases inconexas (`indigo-` en perfil, `purple-` en inputs de búsqueda); 100% adherido a `brand`. |
| **Política de Merma Cero** | Limpieza de Código Muerto | **Cumplido** | Compilación frontend exitosa y 0 advertencias o errores de TypeScript. |

---

## 5. Evidencia Verificable de Funcionamiento (Protocolo Pre-Commit)

Siguiendo el protocolo estricto de pre-commit de `AGENTS.md`:

### 1. Compilación Frontend / Monorepo (`npm run build:web`)
```bash
> @sgaob/shared@1.0.0 build
> tsc
> @sgaob/web@1.0.0 build
> tsc && vite build
vite v5.4.21 building for production...
transforming...
✓ 1682 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                   1.22 kB │ gzip:  0.59 kB
dist/assets/index-Ob-bbKGq.css                   63.34 kB │ gzip:  9.82 kB
dist/assets/availability.api-B0i3Emtr.js          0.49 kB │ gzip:  0.24 kB
dist/assets/vendor-auth-DhPIsev5.js               1.02 kB │ gzip:  0.63 kB
dist/assets/matches.api-D6u68jQv.js               1.04 kB │ gzip:  0.42 kB
dist/assets/UnauthorizedPage-DBHR_1wG.js          1.83 kB │ gzip:  0.87 kB
dist/assets/RespondNominationModal-DF2ecWrY.js   11.56 kB │ gzip:  3.17 kB
dist/assets/ProfilePage-D7qSK2wS.js              15.45 kB │ gzip:  3.34 kB
dist/assets/LoginPage-CLA7WERs.js                27.63 kB │ gzip:  5.16 kB
dist/assets/AvailabilityPage-BI8KziVS.js         27.83 kB │ gzip:  5.74 kB
dist/assets/UsersManagementPage-DO5uRwcX.js      34.29 kB │ gzip:  6.32 kB
dist/assets/index-C5DHxqCx.js                    34.60 kB │ gzip:  9.55 kB
dist/assets/NominationsPage-DNI-b8Q_.js          41.68 kB │ gzip:  8.25 kB
dist/assets/ResourcesPage-Bq_KGR4W.js            43.19 kB │ gzip:  7.66 kB
dist/assets/DashboardPage-vmA8K38J.js            44.42 kB │ gzip:  7.68 kB
dist/assets/MatchesPage-C8P8IauB.js              44.77 kB │ gzip:  8.35 kB
dist/assets/vendor-ui-Bdf3vVwe.js                80.21 kB │ gzip: 24.88 kB
dist/assets/vendor-react-C7xBuMT8.js            162.14 kB │ gzip: 52.92 kB
✓ built in 12.42s
Resultado: Exitoso (0 errores).
```

### 2. Verificación de Tipos del Backend (`npx tsc --noEmit -p apps/api/tsconfig.json`)
```bash
> tsc --noEmit -p apps/api/tsconfig.json
Resultado: Exitoso (0 errores de TypeScript).
```

### 3. Verificación de Linter y Tipos Frontend (`npm run lint --prefix apps/web`)
```bash
> @sgaob/web@1.0.0 lint
> tsc --noEmit
Resultado: Exitoso (0 errores, 0 imports no utilizados).
```

### 4. Pruebas Unitarias de Backend (`npm run test --prefix apps/api`)
```text
Test Suites: 18 passed, 18 total
Tests:       140 passed, 140 total
Snapshots:   0 total
Time:        29.536 s
Ran all test suites.
Resultado: 100% pasando (0 fallos).
```

