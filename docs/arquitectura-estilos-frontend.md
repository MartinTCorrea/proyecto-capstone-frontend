# Guía de Arquitectura Visual y Modularidad Estética del Frontend — SGAOB

Este documento sirve como manual de referencia para el equipo de desarrollo y diseño en caso de que desees modificar la estética, paleta de colores, tipografía, disposición de elementos o componentes del frontend (`apps/web`).

---

## 1. ¿Cómo está modulado el Frontend?

El frontend está estructurado bajo **Atomic Design simplificado y Modularidad Funcional (1:1 con el Backend)**, completamente estilizado con **Tailwind CSS**. Esto permite cambiar estilos de forma aislada sin romper la lógica de negocio ni el comportamiento de otros módulos.

```text
apps/web/src/
├── index.css                   # [Capa 0: Global] Directivas Tailwind, fuentes y resets
├── tailwind.config.js          # [Capa 0: Config] Paleta de colores ('brand'), breakpoints, extensiones
├── components/
│   ├── layout/                 # [Capa 1: Shell Global]
│   │   ├── MainLayout.tsx      # Estructura del marco exterior, fondo (bg-slate-50), ancho máximo (max-w-7xl)
│   │   └── Navbar.tsx          # Barra superior, navegación, branding, dropdowns y menú responsive
│   ├── common/                 # [Capa 2: Componentes Atómicos Reutilizables]
│   │   └── LoadingSpinner.tsx  # Spinners de carga accesibles
│   ├── auth/                   # [Capa 2: Autenticación y Guards]
│   │   ├── DevAuthSwitcher.tsx # Barra inferior flotante de desarrollo
│   │   ├── ProtectedRoute.tsx  # Guard de ruta autenticada
│   │   └── RoleGuard.tsx       # Guard condicional por rol
│   ├── users/                  # [Capa 3: Módulo Visual de Usuarios]
│   │   ├── UsersTable.tsx      # Grilla de usuarios, columnas, acciones
│   │   ├── CreateUserModal.tsx # Formulario modal de creación
│   │   ├── AssignRolesModal.tsx# Formulario modal de roles técnicos
│   │   └── StatusChangeModal.tsx# Modal de confirmación de activación/suspensión
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
│   └── nominations/            # [Capa 3: Módulo Visual de Asignaciones (PR12)]
│       ├── NominationStatusBadge.tsx
│       ├── MatchRoleBadge.tsx
│       ├── AssignNominationModal.tsx
│       ├── RespondNominationModal.tsx
│       └── NominationsTable.tsx
└── pages/                      # [Capa 4: Vistas / Páginas Enrutadas]
    ├── DashboardPage.tsx       # Tarjetas de resumen, KPIs y accesos directos
    ├── LoginPage.tsx           # Pantalla de acceso y selección rápida sandbox
    ├── UsersManagementPage.tsx # Página de administración de usuarios
    ├── AvailabilityPage.tsx    # Página de disponibilidad semanal
    ├── MatchesPage.tsx         # Página de cartelera de partidos
    └── NominationsPage.tsx     # Página de grilla de nominaciones
```

---

## 2. Puntos Clave para Cambios Estéticos

### A. Paleta de Colores de la Marca (`brand`)
Si deseas cambiar el color primario de toda la aplicación (actualmente una gama de azul deportivo profesional), solo debes editar **`apps/web/tailwind.config.js`**:

```javascript
// apps/web/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6', // Color principal de botones, links activos y foco
          600: '#2563eb', // Hover de botones
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
      },
    },
  },
};
```
*Cualquier cambio aquí afectará instantáneamente a botones, badges, barras de navegación y acentos en toda la plataforma.*

---

### B. Fondo y Ancho del Contenedor Principal
Para modificar el espaciado global o el fondo de las pantallas, edita **`apps/web/src/components/layout/MainLayout.tsx`**:
- Fondo global: cambia `bg-slate-50` por `bg-gray-100`, `bg-neutral-50`, etc.
- Ancho de lectura: cambia `max-w-7xl` a `max-w-6xl` (más angosto) o `max-w-full px-8` (ancho completo).

---

### C. Barra de Navegación (`Navbar.tsx`)
Para cambiar el estilo del encabezado (hacerlo oscuro, minimalista, o cambiar el logo):
- Archivo: `apps/web/src/components/layout/Navbar.tsx`.
- Contenedor de la barra: `bg-white border-b border-slate-200`. Si prefieres navbar oscuro, puedes cambiarlo a `bg-slate-900 border-slate-800 text-white`.
- Enlaces de navegación: clases `text-slate-600 hover:text-slate-900` y `text-brand-600 bg-brand-50` para el link activo.

---

### D. Badges e Insignias de Estado
Todos los badges están centralizados en pequeños componentes dedicados:
- **`MatchStatusBadge.tsx`**: Colores de partidos (ej. Verde para `COMPLETED`, Azul para `SCHEDULED`, Ámbar para `SUSPENDED`, Rojo para `CANCELLED`).
- **`DeadlineStatusBadge.tsx`**: Indicador de plazo de disponibilidad (Verde: abierto, Amarillo: próximo a vencer, Rojo: cerrado).
- **`NominationStatusBadge.tsx`**: Estados de nominación (Pendiente, Confirmada, Rechazada).

*Modificar el diseño o los colores de cualquier badge se hace en su archivo respectivo y se refleja de inmediato en tablas, modales y tarjetas.*

---

### E. Estilos de Tablas y Tarjetas (Cards)
Todas las tablas (`UsersTable.tsx`, `MatchesTable.tsx`, `NominationsTable.tsx`) siguen una convención visual estándar:
- Contenedor Card: `bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden`.
- Cabecera de tabla (`<thead>`): `bg-slate-50 text-slate-500 uppercase text-xs tracking-wider`.
- Filas de tabla (`<tr>`): `hover:bg-slate-50/80 transition-colors`.

---

### F. Modales y Diálogos
Los modales de la aplicación (`CreateMatchModal.tsx`, `EditMatchModal.tsx`, `AssignRolesModal.tsx`, etc.) utilizan una capa backdrop uniforme:
- Fondo con desenfoque: `fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50`.
- Tarjeta de diálogo centrada: `bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 animate-in fade-in zoom-in-95`.

---

## 3. Resumen de Independencia Visual
- Ningún estilo depende de CSS hardcodeado ni de bibliotecas de terceros opacas; todo es 100% Tailwind CSS nativo.
- Toda la tipografía utiliza fuentes de sistema limpias (`font-sans`).
- Accesibilidad ARIA y contraste garantizados en todos los estados (`focus:ring-2 focus:ring-brand-500`).
