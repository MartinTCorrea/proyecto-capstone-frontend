# Informe de Avance — PR27: Reestructuración Ergonómica de Disponibilidad Semanal en 2 Tarjetas Maestras

**Fecha de Cierre:** 24 de Octubre de 2026  
**Proyecto:** SGAOB (Sistema de Gestión de Árbitros y Oficiales de Básquetbol)  
**Alcance:** apps/web, docs  
**Estado:** Completado y Verificado 100%

---

## 1. Resumen Ejecutivo del Hito

En este hito se ejecutó el rediseño integral de la grilla de declaración de disponibilidad semanal en `apps/web` ([`WeeklyCalendarGrid.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/availability/WeeklyCalendarGrid.tsx)), resolviendo la sobrecarga visual de las 7 tarjetas verticales independientes:

1. **Agrupación en 2 Tarjetas Maestras Contextuales:** Se sustituyó la grilla de 7 columnas individuales por dos contenedores unificados:
   * **Tarjeta 1: Días Hábiles (Lunes a Viernes):** Agrupa los 5 días laborales con sus parámetros específicos (Horario 1 escolar/formativo y Horario 2 nocturno/adulto).
   * **Tarjeta 2: Fin de Semana (Sábado y Domingo):** Agrupa las jornadas intensivas de fin de semana (Horario 1 matutino y Horario 2 vespertino/nocturno).
2. **Eliminación de la Merma Espacial y Repetición de Textos:** Se suprimieron los 6 márgenes divisorios intermedios que comprimían cada día a un ancho diminuto (~140px). Los rangos horarios de referencia (`H1`, `H2` y `Jornada Completa`) se exponen como chips informativos en la cabecera de cada tarjeta maestra, evitando repetir las leyendas 28 veces.
3. **Filas Ergonómicas con Selector Segmentado:** Cada día se despliega como una fila espaciosa con un bloque segmentado de 4 botones interactivos (`Horario 1`, `Horario 2`, `Jornada Completa`, `No Disponible`), con resaltado temático en alta visibilidad para la opción activa y microinteracciones de confirmación.

---

## 2. Archivos y Componentes Modificados

| Componente / Archivo | Tipo de Cambio | Alcance y Propósito |
|---|---|---|
| [`apps/web/src/components/availability/WeeklyCalendarGrid.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/availability/WeeklyCalendarGrid.tsx) | Modificación | Rediseño estructural de la grilla a 2 tarjetas maestras apiladas, cabeceras con resumen de horarios y filas de día con controles segmentados. |
| [`docs/avance-pr27.md`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/docs/avance-pr27.md) | Nuevo | Informe formal de avance del hito con diagramas, trazabilidad funcional y pruebas pre-commit. |

---

## 3. Arquitectura y Flujos Técnicos

### Estructura de Contenedores y Flujo de Selección

```mermaid
graph TD
    A[Semana Seleccionada: Lunes a Domingo] --> B[Segmentación de Días]
    B --> C[Tarjeta 1: Días Hábiles - Lunes a Viernes]
    B --> D[Tarjeta 2: Fin de Semana - Sábado y Domingo]
    
    C --> C1[Cabecera con Resumen Horario: H1 15:30-19:30 | H2 19:30-22:00 | JC 15:30-22:00]
    C --> C2[5 Filas de Días Hábiles con Selectores Segmentados]
    
    D --> D1[Cabecera con Resumen Horario: H1 09:00-15:00 | H2 15:00-22:00 | JC 09:00-22:00]
    D --> D2[2 Filas de Fin de Semana con Selectores Segmentados]
    
    C2 --> E[Actualización Reactiva de Disponibilidad]
    D2 --> E
    E --> F[Guardado Masivo y Atómico en Backend]
```

---

## 4. Trazabilidad con Requerimientos Funcionales y Estándares UX

| Código RF / Directriz | Requerimiento Funcional | Estado | Evidencia de Implementación |
|---|---|---|---|
| **RF04** | Declaración de Disponibilidad Semanal | **Cumplido** | Interfaz ágil, intuitiva y espaciosa para árbitros y oficiales de mesa. |
| **RF05 / Anexo A.4** | Bloques Horarios Parametrizados | **Cumplido** | Separación clara entre jornada laboral y de fin de semana con horas de referencia dinámicas desde `TimeBlockConfig`. |
| **Ergonomía UI/UX** | Diseño SaaS Profesional Standalone | **Cumplido** | Eliminación del muro de 7 tarjetas comprimidas; adopción de selectores segmentados con estados hover y foco accesibles. |

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
dist/index.html                                   1.17 kB │ gzip:  0.57 kB
dist/assets/index-ChdQ72IG.css                   63.06 kB │ gzip:  9.75 kB
dist/assets/availability.api-BSlxUIh_.js          0.49 kB │ gzip:  0.24 kB
dist/assets/vendor-auth-DhPIsev5.js               1.02 kB │ gzip:  0.63 kB
dist/assets/matches.api-DRgEKIJf.js               1.04 kB │ gzip:  0.41 kB
dist/assets/UnauthorizedPage-Bqcv4PvU.js          1.83 kB │ gzip:  0.86 kB
dist/assets/RespondNominationModal-Do7JE7ee.js   11.56 kB │ gzip:  3.17 kB
dist/assets/ProfilePage-CpafgyZC.js              15.46 kB │ gzip:  3.34 kB
dist/assets/LoginPage-DI3AvM77.js                20.82 kB │ gzip:  4.45 kB
dist/assets/AvailabilityPage-D5nARPrg.js         29.90 kB │ gzip:  6.03 kB
dist/assets/UsersManagementPage-B29uxhI8.js      34.30 kB │ gzip:  6.32 kB
dist/assets/index-BvshWsge.js                    34.43 kB │ gzip:  9.48 kB
dist/assets/NominationsPage-BC9ovvlW.js          41.68 kB │ gzip:  8.25 kB
dist/assets/ResourcesPage-D4pqo3TG.js            43.18 kB │ gzip:  7.67 kB
dist/assets/DashboardPage-SkR_VQTH.js            44.44 kB │ gzip:  7.69 kB
dist/assets/MatchesPage-Dt8wlZz9.js              44.76 kB │ gzip:  8.35 kB
dist/assets/vendor-ui-Bdf3vVwe.js                80.21 kB │ gzip: 24.88 kB
dist/assets/vendor-react-C7xBuMT8.js            162.14 kB │ gzip: 52.92 kB
✓ built in 3.89s
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
Tests:       136 passed, 136 total
Snapshots:   0 total
Time:        12.336 s
Ran all test suites.
Resultado: 100% pasando (0 fallos).
```

