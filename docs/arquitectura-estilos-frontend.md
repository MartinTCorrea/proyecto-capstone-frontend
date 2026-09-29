# Guía de Arquitectura Visual y Modularidad Estética del Frontend — SGAOB

Este documento sirve como **manual maestro de referencia** para el equipo de desarrollo, diseñadores y agentes de IA que vayan a modificar, rediseñar o enriquecer la estética, paleta de colores, tipografía, disposición de elementos o componentes del frontend (`apps/web`).

---

## 1. ¿Cómo está modulado el Frontend?

El frontend está estructurado bajo **Atomic Design simplificado y Modularidad Funcional (1:1 con el Backend)**, completamente desarrollado con **React + TypeScript (Vite)** y estilizado con **Tailwind CSS**. Esto permite cambiar estilos de forma aislada sin romper la lógica de negocio ni el comportamiento de otros módulos.

```text
apps/web/src/
├── index.css                   # [Capa 0: Global] Directivas Tailwind, fuentes y resets accesibles
├── tailwind.config.js          # [Capa 0: Config] Paleta de colores ('brand'), breakpoints, extensiones
├── api/                        # [Capa Datos: Clientes HTTP Axios con Bearer Token automático]
│   ├── client.ts               # Cliente base Axios (baseURL '/api', inyector de JWT y manejo de 401)
│   ├── auth.api.ts             # Endpoints /auth/me, /auth/dev-token, /auth/cognito-login, etc.
│   ├── users.api.ts            # CRUD de usuarios, activación, roles y consentimiento
│   ├── availability.api.ts     # Declaración semanal y consulta de disponibilidad
│   ├── matches.api.ts          # Cartelera, reprogramaciones y sincronización NBN23/Swish
│   ├── nominations.api.ts      # Asignación y confirmación/rechazo de designaciones
│   └── resources.api.ts        # Bóveda de credenciales, comunicados y exportación CSV
├── context/
│   └── AuthContext.tsx         # Estado global de sesión, usuario, JWT y persistencia localStorage
├── hooks/
│   └── useAuth.ts              # Hook de consumo obligatorio para autenticación (Regla AGENTS.md)
├── components/
│   ├── layout/                 # [Capa 1: Shell Global]
│   │   ├── MainLayout.tsx      # Estructura del marco exterior, fondo (bg-slate-50), ancho máximo (max-w-7xl)
│   │   └── Navbar.tsx          # Barra superior, navegación, branding, dropdowns y menú responsive
│   ├── common/                 # [Capa 2: Componentes Atómicos Reutilizables]
│   │   └── LoadingSpinner.tsx  # Spinners de carga accesibles
│   ├── auth/                   # [Capa 2: Autenticación y Guards]
│   │   ├── DevAuthSwitcher.tsx # Barra inferior flotante de desarrollo para pruebas rápidas
│   │   ├── ProtectedRoute.tsx  # Guard de ruta autenticada
│   │   └── RoleGuard.tsx       # Guard condicional por rol técnico
│   ├── users/                  # [Capa 3: Módulo Visual de Usuarios]
│   │   ├── UsersTable.tsx      # Grilla de usuarios, columnas, acciones
│   │   ├── CreateUserModal.tsx # Formulario modal de creación
│   │   ├── AssignRolesModal.tsx# Formulario modal de roles técnicos
│   │   ├── StatusChangeModal.tsx# Modal de confirmación de activación/suspensión
│   │   └── DataConsentModal.tsx# Modal de consentimiento informado de datos (Ley 19.628)
│   ├── availability/           # [Capa 3: Módulo Visual de Disponibilidad]
│   │   ├── WeeklyCalendarGrid.tsx # Calendario semanal interactivo (Lunes a Domingo)
│   │   ├── AvailabilitySummaryView.tsx # Vista consolidada de la Comisión Técnica
│   │   └── DeadlineStatusBadge.tsx# Insignia de estado del plazo límite
│   ├── matches/                # [Capa 3: Módulo Visual de Partidos y Cartelera]
│   │   ├── MatchesTable.tsx    # Tabla interactiva con filtros
│   │   ├── MatchStatusBadge.tsx# Badges de estado (Programado, Finalizado, etc.)
│   │   ├── MatchPlatformBadge.tsx# Badges de origen (NBN23, Swish, Manual)
│   │   ├── CreateMatchModal.tsx# Formulario de alta manual de partido
│   │   ├── EditMatchModal.tsx  # Formulario de reprogramación / cambio de estado
│   │   └── SyncControlModal.tsx# Panel de control de integración NBN23/Swish
│   ├── nominations/            # [Capa 3: Módulo Visual de Asignaciones]
│   │   ├── NominationStatusBadge.tsx
│   │   ├── MatchRoleBadge.tsx
│   │   ├── AssignNominationModal.tsx
│   │   ├── RespondNominationModal.tsx
│   │   └── MatchesAssignmentsGrid.tsx
│   └── resources/              # [Capa 3: Módulo de Recursos e Información]
│       ├── ResourceCard.tsx    # Tarjeta de documento, credencial o comunicado
│       ├── ResourceTypeBadge.tsx# Badges por tipo de recurso
│       ├── CreateResourceModal.tsx
│       └── ExportNominationsModal.tsx # Generador de planilla de viáticos (Excel)
└── pages/                      # [Capa 4: Vistas / Páginas Enrutadas]
    ├── DashboardPage.tsx       # Tarjetas de resumen, KPIs y accesos directos
    ├── LoginPage.tsx           # Selector híbrido (Evaluación 1-Clic + AWS Cognito Cloud)
    ├── UsersManagementPage.tsx # Página de administración de usuarios
    ├── AvailabilityPage.tsx    # Página de disponibilidad semanal
    ├── MatchesPage.tsx         # Página de cartelera de partidos
    ├── NominationsPage.tsx     # Página de grilla de nominaciones
    ├── ResourcesPage.tsx       # Bóveda de credenciales, circulares y exportación
    └── UnauthorizedPage.tsx    # Página 403 de acceso denegado
```

---

## 2. Puntos Clave para Cambios Estéticos

### A. Paleta de Colores de la Marca (`brand`)
Si deseas cambiar el color primario de toda la aplicación (actualmente una gama de azul deportivo profesional), edita **`apps/web/tailwind.config.js`**:

```javascript
// apps/web/tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Color principal de botones, links activos y foco
          600: '#2563eb', // Hover de botones y encabezados destacados
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
    },
  },
  plugins: [],
};
```
*Cualquier cambio aquí afectará instantáneamente a botones, badges, barras de navegación y acentos en toda la plataforma.*

---

### B. Fondo y Ancho del Contenedor Principal
Para modificar el espaciado global o el fondo de las pantallas, edita **`apps/web/src/components/layout/MainLayout.tsx`**:
- Fondo global: `bg-slate-50` (puedes cambiarlo a `bg-gray-100`, `bg-neutral-50`, `bg-zinc-50`, etc.).
- Ancho de lectura: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (cambiar a `max-w-6xl` si se busca mayor concentración, o `max-w-full px-6` para estilo dashboard expandido).

---

### C. Barra de Navegación (`Navbar.tsx`)
Para cambiar el estilo del encabezado (hacerlo oscuro, flotante, minimalista, o cambiar el logo):
- Archivo: `apps/web/src/components/layout/Navbar.tsx`.
- Contenedor de la barra: `bg-white border-b border-slate-200`. Si prefieres navbar oscuro, puedes cambiarlo a `bg-slate-900 border-slate-800 text-white`.
- Enlaces de navegación: clases `text-slate-600 hover:text-slate-900` y `text-brand-600 bg-brand-50` para el link activo.

---

### D. Badges e Insignias de Estado
Todos los badges están centralizados en pequeños componentes dedicados:
- **`MatchStatusBadge.tsx`**: Colores de partidos (Verde para `COMPLETED`, Azul para `SCHEDULED`, Ámbar para `SUSPENDED`, Rojo para `CANCELLED`).
- **`DeadlineStatusBadge.tsx`**: Indicador de plazo de disponibilidad (Verde: abierto, Amarillo: próximo a vencer, Rojo: cerrado).
- **`NominationStatusBadge.tsx`**: Estados de nominación (Azul: PENDING, Verde: CONFIRMED, Rojo: REJECTED).
- **`ResourceTypeBadge.tsx`**: Tipos de recurso (Azul: Documento, Púrpura: Credencial Bóveda, Ámbar: Comunicado).

---

### E. Estilos de Tablas y Tarjetas (Cards)
Todas las tablas (`UsersTable.tsx`, `MatchesTable.tsx`, `MatchesAssignmentsGrid.tsx`, `AvailabilitySummaryView.tsx`) siguen una convención visual estándar:
- Contenedor Card: `bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden`.
- Cabecera de tabla (`<thead>`): `bg-slate-50 text-slate-500 uppercase text-xs tracking-wider`.
- Filas de tabla (`<tr>`): `hover:bg-slate-50/80 transition-colors`.

---

### F. Modales y Diálogos
Los modales de la aplicación (`CreateMatchModal.tsx`, `EditMatchModal.tsx`, `AssignRolesModal.tsx`, etc.) utilizan una capa backdrop uniforme:
- Fondo con desenfoque: `fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4`.
- Tarjeta de diálogo centrada: `bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 animate-in fade-in zoom-in-95`.

---

## 3. Catálogo e Inventario Completo de Emojis e Iconos en el Frontend

Esta sección detalla exactamente **en qué archivo y línea** se encuentra cada emoji e icono de la aplicación para que puedas localizarlos y modificarlos fácilmente.

---

### A. Emojis Literales en la Interfaz (Texto / Logo)

| Archivo | Ubicación / Elemento | Emoji Actual | Código / Línea | Cómo Cambiarlo |
|---|---|:---:|---|---|
| [`apps/web/src/components/layout/Navbar.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/layout/Navbar.tsx) | Logo superior del encabezado | `🏀` | Línea 37: `<div ...>🏀</div>` | Reemplazar `🏀` por otro emoji, por un icono SVG (`<Trophy className="w-6 h-6 text-white" />`), o por una imagen `<img src="/logo.png" className="w-8 h-8 object-contain" />`. |
| [`apps/web/src/pages/LoginPage.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/pages/LoginPage.tsx) | Logo central sobre formulario de login | `🏀` | Línea 186: `<div ...>🏀</div>` | Reemplazar `🏀` por tu logo institucional o imagen PNG/SVG. |
| [`apps/web/src/pages/DashboardPage.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/pages/DashboardPage.tsx) | Saludo de bienvenida en el banner | `👋` | Línea 36: `Hola, {user.firstName} {user.lastName} 👋` | Puedes cambiar el emoji `👋` por otro o retirarlo directamente. |

---

### B. Inventario de Iconos SVG (`lucide-react`) por Módulo

Todos los iconos provienen de la librería profesional **`lucide-react`**. Si deseas cambiar alguno, solo debes importar el nuevo nombre desde `'lucide-react'` y sustituirlo en el JSX.

#### 1. Navegación, Layout y Autenticación
- **`Navbar.tsx`**: `User`, `LogOut`, `Calendar`, `Trophy`, `ClipboardList`, `Users`, `FolderArchive`, `Menu`, `X`.
- **`LoginPage.tsx`**:
  - `Shield`: Insignia de seguridad y accesos de administración.
  - `Lock`: Campo de contraseña y credenciales.
  - `Mail`: Campo de correo electrónico en formulario Cognito.
  - `Cloud`: Pestaña y botón de inicio de sesión con AWS Cognito.
  - `Sparkles`: Pestaña de acceso rápido sandbox (1 Clic).
  - `ArrowRight`: Flecha de acción de login en tarjetas.
  - `AlertCircle`: Alerta de error de credenciales o configuración pendiente.
  - `CheckCircle2`: Insignia de conexión exitosa a AWS Cognito (`us-east-1`).
  - `ExternalLink`: Botón para abrir AWS Hosted UI.
  - `Loader2`: Spinner animado durante el proceso de autenticación.
- **`DevAuthSwitcher.tsx`**: `Shield` (Admin), `UserCheck` (Árbitro), `Users` (Mesa), `ChevronUp` / `ChevronDown`, `RefreshCw`.
- **`UnauthorizedPage.tsx`**: `ShieldAlert` (403 Forbidden), `ArrowLeft`.

#### 2. Módulo de Usuarios (`apps/web/src/components/users/`)
- **`UsersTable.tsx`**: `Shield` (Admin), `UserCheck` (Árbitro), `Users` (Mesa), `CheckCircle2` (Activo), `AlertTriangle` (Inactivo), `Settings` (Gestionar roles), `RefreshCw` (Cambiar estado), `Phone`, `Mail`.
- **`CreateUserModal.tsx`**: `UserPlus` (Cabecera), `X` (Cerrar), `AlertCircle` (Validación), `Loader2` (Spinner).
- **`AssignRolesModal.tsx`**: `Shield` (Admin), `UserCheck` (Árbitro), `Users` (Mesa), `Info` (Regla Anexo A.1), `X`, `Loader2`.
- **`StatusChangeModal.tsx`**: `AlertTriangle` (Advertencia de suspensión), `X`, `Loader2`.
- **`DataConsentModal.tsx`**: `ShieldCheck` (Consentimiento de privacidad), `AlertCircle`, `Loader2`.

#### 3. Módulo de Disponibilidad (`apps/web/src/components/availability/`)
- **`WeeklyCalendarGrid.tsx`**:
  - `Sun`: Bloque `HORARIO_1` (Jornada matutina / tarde).
  - `Moon`: Bloque `HORARIO_2` (Jornada nocturna / vespertina).
  - `Check`: Botón `FULL` (Día completo).
  - `X`: Botón `NO` (No disponible).
  - `Calendar`, `Clock`: Encabezados y selectores de fecha.
- **`AvailabilitySummaryView.tsx`**: `Users`, `Calendar`, `Filter`, `Phone`, `Mail`, `RefreshCw`, `Sun`, `Moon`, `CheckCircle`.
- **`DeadlineStatusBadge.tsx`**: `Clock` (Plazo pendiente), `AlertTriangle` (Cierre próximo), `CheckCircle` (Declarado), `ShieldAlert` (Plazo vencido).

#### 4. Módulo de Partidos y Cartelera (`apps/web/src/components/matches/`)
- **`MatchesTable.tsx`**: `Calendar` (Fecha), `MapPin` (Recinto), `Trophy` (Torneo), `Edit` (Editar), `Trash2` (Eliminar), `Users` / `UserPlus` (Asignaciones).
- **`CreateMatchModal.tsx` & `EditMatchModal.tsx`**: `Calendar`, `MapPin`, `Trophy`, `Clock`, `Shield`, `AlertTriangle`, `Edit3`, `X`.
- **`SyncControlModal.tsx`**: `RefreshCw` (Sincronizar), `Database` (Swish/NBN23), `ShieldCheck` (Estado Online), `Layers` (Cola BullMQ).
- **`MatchStatusBadge.tsx`**: `Clock` (Programado), `AlertTriangle` (Reprogramado), `XCircle` (Cancelado/Suspendido), `CheckCircle2` (Finalizado).
- **`MatchPlatformBadge.tsx`**: `Database` (Swish/NBN23), `ShieldCheck` (Oficial), `Cpu` (Sandbox).

#### 5. Módulo de Nominaciones (`apps/web/src/components/nominations/`)
- **`MatchesAssignmentsGrid.tsx`**: `Calendar`, `MapPin`, `Trophy`, `Users` (Terna), `UserCheck` (Confirmado), `Clock` (Pendiente), `Plus` (Asignar).
- **`AssignNominationModal.tsx`**: `Shield` (Árbitro Principal), `UserCheck` (Árbitro Asistente), `Users` (Mesa Técnica), `AlertCircle` (Incompatibilidad), `CheckCircle2` (Candidato Disponible), `Clock` (Tope horario).
- **`RespondNominationModal.tsx`**: `CheckCircle2` (Confirmar designación), `XCircle` (Rechazar designación), `MapPin`, `Calendar`, `Trophy`.
- **`MatchRoleBadge.tsx`**: `Shield` (Roles arbitrales), `Users` (Roles de mesa).
- **`NominationStatusBadge.tsx`**: `Clock` (PENDING), `CheckCircle2` (CONFIRMED), `XCircle` (REJECTED).

#### 6. Módulo de Información y Recursos (`apps/web/src/components/resources/`)
- **`ResourcesPage.tsx`**: `FileText` (Pestaña Documentos), `Key` (Pestaña Bóveda Credenciales), `Megaphone` (Pestaña Comunicados), `Download` (Exportar Excel), `Plus` (Publicar), `Search`, `Lock`.
- **`ResourceCard.tsx`**: `FileText`, `Megaphone`, `Key`, `Lock`, `Eye`, `EyeOff`, `Copy`, `Check`, `Download`, `Calendar`, `User`, `Edit`, `Trash2`.
- **`ResourceTypeBadge.tsx`**: `FileText`, `Key`, `Megaphone`.
- **`ExportNominationsModal.tsx`**: `FileSpreadsheet` / `Download` (Generar CSV para Excel con UTF-8 BOM), `Calendar`, `Trophy`, `MapPin`.

---

## 4. Reglas de Oro de Arquitectura Frontend para Nuevas Instancias (Innegociables)

Cualquier instancia o desarrollador que modifique el frontend **debe cumplir estrictamente las siguientes reglas** para evitar errores de compilación o regresiones:

1. **Cero Variables o Imports Huérfanos (`noUnusedLocals` y `noUnusedParameters`):**
   * El proyecto corre con TypeScript estricto. Si importas un icono o declaras una variable y no la usas en el JSX, `npm run lint --prefix apps/web` (**`tsc --noEmit`**) fallará y romperá el pipeline.
2. **Importación Estricta del Hook `useAuth`:**
   * Importa SIEMPRE desde `../hooks/useAuth`:
     ```tsx
     // CORRECTO:
     import { useAuth } from '../hooks/useAuth';
     // INCORRECTO (Prohibido por AGENTS.md):
     import { useContext } from 'react';
     import { AuthContext } from '../context/AuthContext';
     ```
3. **Consumo de Tipos desde `@sgaob/shared`:**
   * Las interfaces (`UserDto`, `MatchDto`, `NominationDto`, `RoleName`, `MatchStatus`, etc.) provienen del paquete compartido. Si necesitas modificar un enum o contrato, edítalo en `packages/shared/src/` y ejecuta inmediatamente `npm run build --prefix packages/shared`.
4. **Cliente HTTP Centralizado (`apiClient`):**
   * Todas las peticiones al backend deben realizarse a través de las funciones de `apps/web/src/api/` (que utilizan `apiClient` con timeout y token Bearer automático). Nunca uses `fetch('http://localhost:3000/...')` hardcodeado.
5. **Preservar los Modos en `LoginPage.tsx`:**
   * En `LoginPage.tsx` deben mantenerse vivas las dos pestañas:
     * **Modo Evaluación Rápida (1 Clic):** Vital para comisiones evaluadoras y defensas del proyecto sin dependencias de red.
     * **Modo AWS Cognito (Cloud):** Autenticación oficial contra el User Pool en `us-east-1`.
6. **Protocolo Obligatorio de Verificación antes de Entregar:**
   * Tras hacer cualquier cambio en el frontend, ejecuta siempre:
     ```bash
     npm run lint --prefix apps/web
     npm run build --prefix apps/web
     ```
   * Ambos comandos deben terminar con **código de salida 0 (cero errores)**.

---

## 5. Directrices de Estilo para el Rediseño (Skill `ui-ux-pro-max`)

El proyecto tiene instalado el skill especializado **`ui-ux-pro-max`** (`.agent/skills/ui-ux-pro-max/SKILL.md`). Al realizar el rediseño del frontend, sigue estas recomendaciones de diseño profesional:

* **Estilo Visual Recomendado:** *Modern Minimalist Sport / Athletic Professional*. Limpio, estructurado, con contrastes nítidos y sin saturación excesiva.
* **Paleta de Acentos:**
  * Primario: Azul Real / Navy (`#1d4ed8` a `#1e3a8a`).
  * Secundario / Acento Deportivo: Ámbar / Naranja básquetbol (`#f59e0b` a `#ea580c`).
  * Neutros: Pizarras limpias (`slate-50` para fondo, `slate-900` para títulos, `slate-600` para subtítulos).
* **Feedback y Micro-interacciones:**
  * Todos los botones interactivos deben incluir `transition-all duration-200 active:scale-[0.98]`.
  * Estados de foco accesibles: `focus:ring-2 focus:ring-brand-500 focus:outline-none`.
  * Tablas y listas vacías deben contar siempre con un estado vacío ilustrado (*Empty State*) amigable.
