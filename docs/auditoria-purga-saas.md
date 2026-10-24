# Auditoría Integral: Depuración de Merma, Sobre-Información Técnica y Adecuación a SaaS Profesional

**Proyecto:** SGAOB — Sistema de Gestión de Árbitros y Oficiales de Básquetbol  
**Hito:** PR22 — Estandarización SaaS y Purga de Merma Técnica / Académica  
**Estado:** Aplicado y Verificado 100%

---

## 1. Resumen de la Purga Ejecutada

Se realizó un escaneo completo del monorepo (`apps/web`, `apps/api`, `packages/shared`, `docs/`) para suprimir cualquier elemento residual no acorde a un producto de software comercial tipo SaaS. La intervención comprendió tres frentes principales:

1. **Reordenamiento y Limpieza del Portal de Inicio de Sesión (`LoginPage.tsx`):**
   * Configuración de la autenticación oficial de usuarios como vista predeterminada al cargar la plataforma.
   * Relegación del entorno con usuarios simulados a una pestaña secundaria clara denominada *"Modo Test / Demo"*.
   * Eliminación completa de banners técnicos que exponían identificadores de infraestructura de AWS Cognito (`userPoolId`, región) e instrucciones de laboratorio académico (*AWS Academy / variables .env*).
   * Sustitución del botón *"Iniciar Sesión con AWS Cognito"* y spinner *"Autenticando con Cognito..."* por textos estándar SaaS: *"Iniciar Sesión"* e *"Iniciando sesión..."*.
   * Supresión de leyendas criptográficas técnicas para el usuario final (*"Validación de firma RS256 con claves JWKS"*).
   * Higienización de mensajes de error para no mencionar al "backend" ni detalles de arquitectura interna.

2. **Purga de Códigos de Requerimientos Funcionales (`RFxx`, `CU-xx`):**
   * Eliminación del tag `(CU-10)` del encabezado modal en `CreateResourceModal.tsx`.
   * Limpieza de sufijos `(RF05)`, `(RF12)` y `(RF15)` en las excepciones y motivos devueltos por `availability.service.ts` y `nominations.service.ts`.

3. **Neutralización de Sobre-Información de Servicios Cloud e Infraestructura Interna:**
   * Sustitución de menciones de colas internas (*"BullMQ"*) en `SyncControlModal.tsx` y `MatchesPage.tsx` por términos de negocio (*"ID de Tarea"* y *"Sincronización iniciada"*).
   * Limpieza de etiquetas de contraseña inicial en `CreateUserModal.tsx` y estado de actualización en `ProfilePage.tsx` (*"Actualizando contraseña..."* en lugar de *"Actualizando en Cognito..."*).
   * Estandarización de mensajes de excepción en `auth.service.ts` para reportar estados del sistema y no la marca comercial del proveedor de identidad.

---

## 2. Matriz Detallada de Cambios Aplicados

| Archivo Intervenido | Ubicación | Texto / Elemento Previo (No-SaaS) | Texto Limpio Definitivo (SaaS Profesional) |
|---|---|---|---|
| `apps/web/src/pages/LoginPage.tsx` | L28 | `useState<'dev' \| 'cognito'>('dev')` | `useState<'cognito' \| 'dev'>('cognito')` (Cognito predeterminado) |
| `apps/web/src/pages/LoginPage.tsx` | L247–275 | Selector con "Acceso Oficial (Cognito)" y "Acceso Rápido / Demo" | Pestaña 1: "Iniciar Sesión" (Lock) \| Pestaña 2: "Modo Test / Demo" (Sparkles) |
| `apps/web/src/pages/LoginPage.tsx` | L437–444 | "Autenticación Oficial (Amazon Cognito)" | "Ingreso a la Plataforma" con bajada institucional de negocio |
| `apps/web/src/pages/LoginPage.tsx` | L446–465 | Banner verde con UserPoolId y banner amarillo de AWS Academy | **Eliminado al 100%** de la interfaz visual |
| `apps/web/src/pages/LoginPage.tsx` | L538 | Botón "Iniciar Sesión con AWS Cognito" | "Iniciar Sesión" |
| `apps/web/src/pages/LoginPage.tsx` | L533 | "Autenticando con Cognito..." | "Iniciando sesión..." |
| `apps/web/src/pages/LoginPage.tsx` | L552, L560 | "O VÍA HOSTED UI" / "Abrir Portal Hosted UI de AWS" | "O mediante portal institucional" / "Ingresar mediante Portal SSO" |
| `apps/web/src/pages/LoginPage.tsx` | L566–570 | "Validación de firma RS256 con claves JWKS de Amazon Cognito." | **Eliminado al 100%** |
| `apps/web/src/pages/LoginPage.tsx` | L84, L124, L153 | Mensajes que mencionaban "backend" y "AWS Cognito" | Mensajes limpios y amigables para el usuario final |
| `apps/web/src/components/resources/CreateResourceModal.tsx` | L93 | `Nuevo Recurso o Comunicado (CU-10)` | `Nuevo Recurso o Comunicado` |
| `apps/web/src/components/users/CreateUserModal.tsx` | L138, L163 | "Contraseña Inicial (AWS Cognito) *" / "...en AWS Cognito" | "Contraseña Inicial *" / "...con sus credenciales." |
| `apps/web/src/pages/ProfilePage.tsx` | L416 | "Actualizando en Cognito..." | "Actualizando contraseña..." |
| `apps/web/src/components/matches/SyncControlModal.tsx` | L203 | "ID de Trabajo BullMQ: ..." | "ID de Tarea: ..." |
| `apps/web/src/pages/MatchesPage.tsx` | L328 | "Sincronización encolada en BullMQ exitosamente" | "Sincronización de cartelera iniciada exitosamente" |
| `apps/web/src/pages/UnauthorizedPage.tsx` | L16 | `Acceso No Autorizado (403 Forbidden)` | `Acceso No Autorizado` |
| `apps/api/src/modules/availability/availability.service.ts` | L144 | `... venció el miércoles previo a las 23:59 (RF05). ...` | `... venció el miércoles previo a las 23:59. ...` |
| `apps/api/src/modules/nominations/nominations.service.ts` | L201, L323, L442 | Cadenas con `(RF12)` y `(RF15)` | Cadenas limpias sin códigos de requerimiento |
| `apps/api/src/modules/auth/auth.service.ts` | L300, L303, L306, L666, L673, L772 | Menciones de "AWS Cognito" en excepciones y retornos | Menciones neutras relativas a la cuenta y credenciales |

---

## 3. Estado de Artefactos de Evaluación (Simulador de Roles)

* **`DevAuthSwitcher.tsx` en `MainLayout.tsx`:**  
  Permanece disponible para la conmutación rápida de perfiles durante presentaciones técnicas o demostraciones en vivo, coexistiendo de forma limpia con el inicio de sesión oficial predeterminado.

