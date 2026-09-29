# Avance PR18 — Integración AWS Cognito y Switch de Autenticación Híbrida / Agnóstica

**Fecha:** 28 de Septiembre de 2026  
**Proyecto:** SGAOB (Sistema de Gestión de Árbitros y Oficiales de Básquetbol)  
**Entorno de Nube:** AWS Academy Learner Lab (`us-east-1`)  
**Estado:** Completado y Verificado 100%

---

## 1. Resumen Ejecutivo y Objetivos

El objetivo de este hito fue consolidar el **Requerimiento Funcional RF01 (Autenticación e Identidad Institucional)** mediante la vinculación en vivo de **Amazon Cognito User Pool** en AWS Academy Learner Lab (`us-east-1`), complementado con una **arquitectura híbrida desacoplada**.

Esta arquitectura permite alternar de forma transparente entre:
1. **Modo Evaluación Rápida (1 Clic / Agnóstico Offline):** Emisión instantánea de tokens simétricos `HS256` para los 4 perfiles clave (*Administrador de Comisión Técnica*, *Árbitro de Campo*, *Oficial de Mesa*, *Doble Rol*), asegurando una experiencia fluida e inmediata durante defensas de título y evaluación de rúbricas académicas sin depender de servicios externos.
2. **Modo AWS Cognito (Producción Cloud):** Autenticación estándar OIDC mediante usuario y contraseña o *Cognito Hosted UI*, con verificación criptográfica asimétrica `RS256` utilizando las claves públicas del endpoint JWKS de Amazon Cognito en `us-east-1`.

---

## 2. Componentes y Arquitectura Implementada

### 2.1 Backend (`apps/api`)

* **`JwtStrategy` Híbrido (`jwt.strategy.ts`):**
  * Detecta dinámicamente el algoritmo en la cabecera del token JWT:
    * `HS256`: Se verifica con la clave secreta local (`JWT_SECRET`), garantizando que la suite automatizada de pruebas y el acceso rápido de 1 clic funcionen sin interrupciones.
    * `RS256`: Se delega a `passportJwtSecret` (`jwks-rsa`) para validar criptográficamente la firma con la clave pública descargada de `https://cognito-idp.us-east-1.amazonaws.com/{UserPoolId}/.well-known/jwks.json`.
* **Sincronización y Auto-aprovisionamiento JIT (`auth.service.ts`):**
  * Auto-vinculación de usuarios pre-registrados mediante `externalId` o `email`.
  * Sincronización automática de roles si el token contiene grupos de Cognito (`cognito:groups`).
* **Nuevos Endpoints en `AuthController` (`auth.controller.ts`):**
  * `POST /api/auth/cognito-login`: Autentica credenciales contra Cognito vía `InitiateAuth` (`USER_PASSWORD_AUTH`) utilizando `fetch` nativo de Node.js v20.
  * `GET /api/auth/cognito-config`: Expone al frontend el estado de la conexión, el `clientId`, la región y la URL del *Hosted UI*.
* **DTO Estricto (`cognito-login.dto.ts`):**
  * Validación con `class-validator` y tipado estricto con aserción definida `!`.

### 2.2 Frontend (`apps/web`)

* **Selector Visual en `LoginPage.tsx`:**
  * Selector por pestañas con diseño UI/UX responsivo y feedback de estado:
    * **Pestaña "Evaluación Rápida (1 Clic)":** Botones interactivos con colores institucionales por rol.
    * **Pestaña "AWS Cognito (Cloud)":** Formulario con validación reactiva de email y contraseña, badge indicador de conexión al User Pool de AWS, y botón para *Hosted UI*.
* **Captura Automática de Callback OIDC:**
  * Detección en `useEffect` de fragmentos de URL (`#id_token=...` / `#access_token=...`) para redirección transparente tras inicio de sesión en AWS Hosted UI.
* **Contexto de Autenticación (`AuthContext.tsx`):**
  * Nuevos métodos `loginWithCognito` y `loginWithToken`.

---

## 3. Identificadores de AWS Cognito en Producción

* **Región:** `us-east-1` (US East - N. Virginia)
* **User Pool ID:** `us-east-1_tI4HPAlWZ`
* **App Client ID:** `1r9j02ksktbej1du36dir395n`
* **Tipo de Cliente:** Public Client (Single-Page Application - SPA)
* **Flujos Habilitados:** `ALLOW_USER_PASSWORD_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`
* **Endpoint JWKS:** `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_tI4HPAlWZ/.well-known/jwks.json`

---

## 4. Evidencia Verificable de Cumplimiento Técnico

Siguiendo el protocolo estricto de pre-commit de `AGENTS.md`:

1. **Chequeo de Tipos Backend:**
   * Comando: `npx tsc --noEmit -p apps/api/tsconfig.json`
   * Resultado: **0 errores**.
2. **Linter y Tipos Frontend:**
   * Comando: `npm run lint --prefix apps/web`
   * Resultado: **0 errores**.
3. **Tests Unitarios:**
   * Comando: `npm run test --prefix apps/api`
   * Resultado: **18 test suites passed, 128 tests passed (100%)**.
4. **Tests de Integración E2E:**
   * Comando: `npm run test:e2e --prefix apps/api`
   * Resultado: **2 test suites passed, 63 tests passed (100%)**.
5. **Compilación de Producción:**
   * API: `nest build` exitoso.
   * Web: `tsc && vite build` exitoso (1673 módulos transformados, 0 warnings).
