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

## 3. Catálogo e Inventario Completo de Emojis e Iconos en el Frontend

Esta sección detalla exactamente **en qué archivo y línea** se encuentra cada emoji e icono de la aplicación para que puedas localizarlos y modificarlos fácilmente.

---

### A. Emojis Literales en la Interfaz (Texto / Logo)

| Archivo | Ubicación / Elemento | Emoji Actual | Código / Línea | Cómo Cambiarlo |
|---|---|:---:|---|---|
| [`apps/web/src/components/layout/Navbar.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/components/layout/Navbar.tsx) | Logo superior del encabezado | `🏀` | Línea 37: `<div ...>🏀</div>` | Reemplazar `🏀` por otro emoji, por un icono SVG (`<Trophy className="w-6 h-6 text-white" />`), o por una imagen `<img src="/logo.png" className="w-8 h-8 object-contain" />`. |
| [`apps/web/src/pages/LoginPage.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/pages/LoginPage.tsx) | Logo central sobre formulario de login | `🏀` | Línea 61: `<div ...>🏀</div>` | Reemplazar `🏀` por tu logo institucional o imagen PNG/SVG. |
| [`apps/web/src/pages/DashboardPage.tsx`](file:///c:/Users/mella/OneDrive/Documentos/Proyectos/CapstoneMain/apps/web/src/pages/DashboardPage.tsx) | Saludo de bienvenida en el banner | `👋` | Línea 36: `Hola, {user.firstName} {user.lastName} 👋` | Puedes cambiar el emoji `👋` por otro o retirarlo directamente. |

---

### B. Inventario de Iconos SVG (`lucide-react`) por Módulo

Todos los iconos provienen de la librería profesional **`lucide-react`**. Si deseas cambiar alguno, solo debes importar el nuevo nombre desde `'lucide-react'` y sustituirlo en el JSX.

#### 1. Navegación, Layout y Autenticación
- **`Navbar.tsx`**:
  - `User`: Icono del perfil de usuario y avatar.
  - `LogOut`: Botón para cerrar sesión.
  - `Calendar`: Enlace a "Disponibilidad".
  - `Trophy`: Enlace a "Partidos".
  - `ClipboardList`: Enlace a "Nominaciones".
  - `Users`: Enlace a "Usuarios".
  - `FolderArchive`: Enlace a "Recursos".
  - `Menu` / `X`: Botón de apertura y cierre del menú móvil.
- **`LoginPage.tsx`**:
  - `Shield`: Insignia de seguridad y accesos de administración.
  - `Lock`: Campo de contraseña y credenciales.
  - `ArrowRight`: Flecha de acción de login.
  - `AlertCircle`: Alerta de error de conexión.
- **`DevAuthSwitcher.tsx`**:
  - `Shield`: Botón de rol Comisión Técnica.
  - `UserCheck`: Botón de rol Árbitro.
  - `Users`: Botón de rol Oficial de Mesa.
  - `ChevronUp` / `ChevronDown`: Plegar/desplegar barra flotante.
  - `RefreshCw`: Indicador de cambio de token.
- **`UnauthorizedPage.tsx`**:
  - `ShieldAlert`: Icono grande de advertencia 403 Forbidden.
  - `ArrowLeft`: Botón para volver al inicio.

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
- **`ResourceCard.tsx`**:
  - `FileText`: Tipo Documento / PDF.
  - `Megaphone`: Tipo Comunicado.
  - `Key` / `Lock`: Tipo Credencial protegida.
  - `Eye` / `EyeOff`: Alternar máscara de contraseña (`••••••••`).
  - `Copy` / `Check`: Copiar credencial al portapapeles con feedback de copiado.
  - `Download`: Descargar archivo.
  - `Calendar`, `User`, `Edit`, `Trash2`.
- **`ResourceTypeBadge.tsx`**: `FileText`, `Key`, `Megaphone`.
- **`ExportNominationsModal.tsx`**: `FileSpreadsheet` / `Download` (Generar CSV para Excel con UTF-8 BOM), `Calendar`, `Trophy`, `MapPin`.

---

### C. Guía Práctica: Cómo Cambiar un Icono o Poner una Imagen Propia

#### 1. Reemplazar un icono por otro de `lucide-react`:
1. Busca en [lucide.dev/icons](https://lucide.dev/icons) el nombre del icono que prefieras (por ejemplo: `Award`, `Flame`, `Zap`, `BookOpen`).
2. En el archivo correspondiente, agrégalo a la lista de importación:
   ```tsx
   import { Award } from 'lucide-react';
   ```
3. Sustituye el icono viejo en el JSX:
   ```tsx
   // Antes:
   <Trophy className="w-5 h-5 text-amber-500" />
   // Después:
   <Award className="w-5 h-5 text-amber-500" />
   ```

#### 2. Reemplazar el emoji `🏀` por un logo oficial (PNG o SVG propio):
1. Guarda tu archivo de logo en la carpeta pública del frontend:
   `apps/web/public/logo.png`
2. En `apps/web/src/components/layout/Navbar.tsx` (Línea 37) y en `LoginPage.tsx` (Línea 61):
   ```tsx
   // Reemplaza el bloque con el emoji:
   <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
     🏀
   </div>

   // Por tu imagen:
   <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-md border border-slate-200">
     <img src="/logo.png" alt="Logo SGAOB" className="w-full h-full object-contain" />
   </div>
   ```

---

## 4. Resumen de Independencia Visual
- Ningún estilo depende de CSS hardcodeado ni de bibliotecas de terceros opacas; todo es 100% Tailwind CSS nativo.
- Toda la tipografía utiliza fuentes de sistema limpias (`font-sans`).
- Accesibilidad ARIA y contraste garantizados en todos los estados (`focus:ring-2 focus:ring-brand-500`).

