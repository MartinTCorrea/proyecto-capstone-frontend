# SGAOB — Arquitectura Permanente con AWS (AWS Academy Lab)
**Amazon API Gateway + Amazon Cognito + NestJS + PostgreSQL**  
**Proyecto Capstone — Ingeniería en Informática, Duoc UC**

---

## 1. Visión General de la Arquitectura en AWS

Para responder a los requerimientos de evaluación del Capstone y aprovechar los créditos del **AWS Academy Learner Lab**, se adopta una arquitectura en nube donde **Amazon API Gateway** actúa como el punto de entrada permanente único hacia el backend, y **Amazon Cognito** provee la autenticación federada OIDC/JWT.

```mermaid
flowchart LR
    subgraph Client["Cliente Web"]
        Frontend["Frontend React 18\n(Vite + TypeScript)\nAWS Amplify / S3 / Local"]
    end

    subgraph AWSCloud["AWS Academy Learner Lab (us-east-1)"]
        Cognito["Amazon Cognito\nUser Pool (CIAM)\nEmisión de JWT (OIDC)"]
        APIGW["Amazon API Gateway\n(HTTP API v2)\nRutas: ANY /{proxy+}\nCORS + Throttling"]
        EC2["Instancia EC2 / App Runner\nBackend NestJS 10 (Puerto 3000)\nAPI Prefix: /api\nSwagger: /api/docs"]
        
        APIGW -->|Proxy HTTP Privado/Público| EC2
    end

    subgraph Persistence["Servicios de Datos y Mensajería"]
        RDS[("PostgreSQL 16 / 18\nsgaob_db")]
        Redis[("Redis 7\nColas BullMQ")]
        SES["MailService (SMTP / SES)\nAlertas de Nominación"]
    end

    Frontend -->|1. Sign-In Correo/Password| Cognito
    Cognito -->|2. Retorna ID Token & Access Token (JWT)| Frontend
    Frontend -->|3. Request con Bearer JWT| APIGW
    EC2 -->|4. Valida firma JWT contra JWKS de Cognito| Cognito
    EC2 --> Persistence
```

---

## 2. Componente 1: Amazon API Gateway Permanente (HTTP API v2)

### ¿Por qué HTTP API v2 y no REST API?
1. **Rendimiento:** Latencia de proxy inferior a 10ms.
2. **Costo y cuota:** 71% más económico que REST API clásica, ideal para ajustarse al presupuesto y límites de AWS Academy ($100 de crédito por sesión).
3. **Soporte nativo de CORS:** Manejo de preflight `OPTIONS` automático a nivel de gateway sin recargar el servidor NestJS.
4. **Proxy catch-all simple:** Redirección transparente de `ANY /{proxy+}` hacia NestJS.

### Guía de Despliegue en AWS Academy Learner Lab

1. **Desplegar NestJS en EC2:**
   - Lanzar una instancia EC2 (Ubuntu 24.04 o Amazon Linux 2023, tipo `t3.small` o `t3.micro`).
   - En el Security Group, abrir el puerto `3000` (o `80`) para tráfico HTTP.
   - Clonar el repositorio y ejecutar el backend con PM2 o Docker Compose:
     ```bash
     npm run build --workspace=@sgaob/api
     npm run start:prod --workspace=@sgaob/api
     ```

2. **Crear el HTTP API en la Consola de AWS Academy:**
   - Ir al servicio **Amazon API Gateway** en la región `us-east-1`.
   - Seleccionar **Create API** → **HTTP API** → **Build**.
   - **API Name:** `sgaob-api-gateway`.
   - En **Integrations**: seleccionar **HTTP** y colocar la URL pública de tu EC2:
     ```text
     http://<IP-PUBLICA-EC2>:3000
     ```
   - **Configure routes:**
     - Method: `ANY` | Resource path: `/{proxy+}` | Integration: `http://<IP-PUBLICA-EC2>:3000/{proxy}`
     - Method: `ANY` | Resource path: `/api/{proxy+}` | Integration: `http://<IP-PUBLICA-EC2>:3000/api/{proxy}`
     - Method: `GET` | Resource path: `/api/health` | Integration: `http://<IP-PUBLICA-EC2>:3000/api/health`
   - **Configure stages:** Dejar el stage por defecto `$default` con **Auto-deploy: Enabled**.

3. **Configurar CORS en el API Gateway:**
   - En el menú lateral de API Gateway, seleccionar **CORS**.
   - **Access-Control-Allow-Origin:** `*` (o la URL de tu frontend React).
   - **Access-Control-Allow-Methods:** `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
   - **Access-Control-Allow-Headers:** `Content-Type, Authorization`.

4. **Resultado del Gateway:**
   AWS te entregará una URL permanente:
   ```text
   https://<api-id>.execute-api.us-east-1.amazonaws.com
   ```
   Tu endpoint de salud responderá en:
   ```text
   https://<api-id>.execute-api.us-east-1.amazonaws.com/api/health
   ```

5. **Configurar el Frontend React (`apps/web`):**
   En tu archivo de entorno de frontend:
   ```env
   VITE_API_BASE_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/api
   ```

---

## 3. Componente 2: Autenticación con Amazon Cognito

### Configuración del User Pool en AWS Academy Lab

1. En la consola de AWS, ir a **Amazon Cognito** → **User Pools** → **Create User pool**.
2. **Opciones de inicio de sesión:** Seleccionar **Email** y **Username**.
3. **Requisitos de contraseña:** Estándar (mínimo 8 caracteres).
4. **MFA:** Opcional (seleccionar "No MFA" para simplificar pruebas académicas).
5. **Configuración de recuperación:** Solo Email.
6. **App Client (Cliente de aplicación):**
   - Nombre: `sgaob-web-client`.
   - Tipo: **Public client** (Single-page application).
   - Generar secreto de cliente: **No generar secret** (obligatorio para SPAs React).
7. **Detalles obtenidos:**
   - **User Pool ID:** ej. `us-east-1_AbC123XyZ`
   - **App Client ID:** ej. `3n4b5v6c7x8z9...`
   - **Endpoint JWKS:**
     ```text
     https://cognito-idp.us-east-1.amazonaws.com/<USER_POOL_ID>/.well-known/jwks.json
     ```

### Estrategia JWT Agnóstica en NestJS (`apps/api`)
El backend valida el token JWT emitido por Cognito mediante su clave pública JWKS sin necesidad de llamadas HTTP síncronas bloqueantes en cada petición:
```text
Authorization: Bearer <ID_TOKEN_COGNITO>
```
NestJS extrae el `sub` (identificador único del usuario en Cognito) y lo compara con el campo `external_id` de la tabla `users` en PostgreSQL.

---

## 4. Garantía de Continuidad: Modo Dual (Cognito + Local Dev)

Para evitar que el equipo quede bloqueado si expira la sesión de 4 horas del laboratorio de AWS Academy durante una sesión de programación:
- La estrategia de autenticación soportará la variable `AUTH_PROVIDER`:
  - `AUTH_PROVIDER=cognito`: Valida contra AWS Cognito (entorno de producción / evaluación docente).
  - `AUTH_PROVIDER=local`: Permite autenticar con tokens locales firmados por el backend para desarrollo offline y pruebas unitarias rápidas.

Esta arquitectura garantiza un 100% de cumplimiento con los requerimientos de la asignatura Capstone sin riesgo de caídas de servicio.
