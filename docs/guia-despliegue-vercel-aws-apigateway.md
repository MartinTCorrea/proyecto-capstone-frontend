# Guía Operativa: Despliegue de SGAOB con Vercel + Amazon API Gateway + AWS EC2

**Proyecto:** Sistema de Gestión de Árbitros y Oficiales de Básquetbol (SGAOB)  
**Arquitectura:** Frontend en Vercel (Edge CDN) + Pasarela Ingress en Amazon API Gateway HTTP API v2 (AWS Academy Lab) + Backend NestJS con PostgreSQL y Redis en AWS EC2.

---

## 1. Visión General de la Infraestructura

```
[ Usuario en Navegador ]
         │
         ▼
[ Vercel Edge CDN: https://sgaob-web.vercel.app ] ───(Login)───► [ Amazon Cognito ]
         │                                                              ▲
         │ (Peticiones /api/* con Bearer JWT)                           │
         ▼                                                              │
[ Amazon API Gateway HTTP API v2: https://<api-id>.execute-api.us-east-1.amazonaws.com ]
         │ (Proxy HTTP puerto 3000)
         ▼
[ Instancia AWS EC2 ] ──────────────────────────────────────────┘ (Verificación JWKS)
  ├── NestJS 10 API (Puerto 3000)
  ├── PostgreSQL 16 (sgaob_db)
  ├── Redis 7 (BullMQ)
  └── Mailpit (SMTP & Web UI)
```

---

## 2. Paso 1: Puesta en Marcha del Backend en AWS EC2

1. Conéctate a tu instancia EC2 por SSH o EC2 Instance Connect.
2. Clona o actualiza el repositorio:
   ```bash
   cd ~/sgaob || git clone https://github.com/MartinTCorrea/proyectocapstone.git ~/sgaob
   cd ~/sgaob
   git pull origin main
   ```
3. Configura el archivo `.env`:
   ```bash
   cp .env.example .env
   ```
   Asegúrate de tener configurado:
   ```env
   NODE_ENV=production
   PORT=3000
   API_PREFIX=api
   FRONTEND_URL=http://localhost:5173,https://*.vercel.app
   AUTH_PROVIDER=cognito
   COGNITO_USER_POOL_ID=us-east-1_lkheaHXdI
   COGNITO_CLIENT_ID=28acj6aedtj69hjhbmr5lej5a6
   COGNITO_JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lkheaHXdI/.well-known/jwks.json
   ```
4. Levanta los contenedores optimizados (la API, base de datos y Redis, sin levantar Nginx para ahorrar memoria):
   ```bash
   sudo docker compose -f docker-compose.prod.yml up --build -d
   ```
5. Verifica que la API responda en el puerto 3000:
   ```bash
   curl http://localhost:3000/api/health
   ```
   Debe responder: `{"status":"ok", ...}`.

---

## 3. Paso 2: Crear el Amazon API Gateway (HTTP API v2) en AWS Academy Lab

1. En la consola de AWS, asegúrate de estar en la región **`N. Virginia (us-east-1)`**.
2. Dirígete a **Amazon API Gateway** y haz clic en **Create API**.
3. En la tarjeta **HTTP API**, haz clic en **Build**.
4. **Paso 1 - Create an API:**
   * **API name:** `sgaob-api-gateway`
   * Haz clic en **Add integration**:
     * Selecciona **HTTP**.
     * URL: `http://<IP_PUBLICA_EC2>:3000` (ej: `http://3.239.105.151:3000`).
   * Haz clic en **Next**.
5. **Paso 2 - Configure routes:**
   * Agrega las siguientes rutas:
     * Method: `ANY` | Resource path: `/{proxy+}` | Integration: `http://<IP_PUBLICA_EC2>:3000/{proxy}`
     * Method: `ANY` | Resource path: `/api/{proxy+}` | Integration: `http://<IP_PUBLICA_EC2>:3000/api/{proxy}`
     * Method: `GET` | Resource path: `/api/health` | Integration: `http://<IP_PUBLICA_EC2>:3000/api/health`
   * Haz clic en **Next**.
6. **Paso 3 - Define stages:**
   * Deja el stage `$default` con **Auto-deploy: Enabled**.
   * Haz clic en **Next** y luego en **Create**.
7. **Paso 4 - Configurar CORS en API Gateway:**
   * En el menú lateral izquierdo de tu API, selecciona **CORS**.
   * Haz clic en **Configure**:
     * **Access-Control-Allow-Origin:** `*` (o `https://*.vercel.app`, `http://localhost:5173`).
     * **Access-Control-Allow-Methods:** `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
     * **Access-Control-Allow-Headers:** `Content-Type, Authorization, Accept`.
     * **Access-Control-Allow-Credentials:** `Yes` (activado).
   * Haz clic en **Save**.
8. **Copiar la URL del Gateway:**
   * En los detalles de la API copia el **Invoke URL**:
     `https://<api-id>.execute-api.us-east-1.amazonaws.com`
   * Prueba el endpoint de salud desde tu terminal local:
     ```bash
     curl -i https://<api-id>.execute-api.us-east-1.amazonaws.com/api/health
     ```

---

## 4. Paso 3: Desplegar el Frontend en Vercel

1. Inicia sesión en [Vercel](https://vercel.com/) con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** ➔ **"Project"**.
3. Importa el repositorio `proyectocapstone`.
4. En la pantalla de configuración del proyecto:
   * **Framework Preset:** Selecciona **Vite**.
   * **Root Directory:** Deja `.` (raíz del repositorio).
   * **Build and Output Settings:** Activa el switch "Override" y configura:
     * **Build Command:** `npm run build:web`
     * **Output Directory:** `apps/web/dist`
     * **Install Command:** `npm install`
   * **Environment Variables:** Agrega las siguientes variables:
     * `VITE_API_URL`: `https://<api-id>.execute-api.us-east-1.amazonaws.com/api`
     * `VITE_AUTH_PROVIDER`: `cognito`
     * `VITE_AWS_REGION`: `us-east-1`
     * `VITE_COGNITO_USER_POOL_ID`: `us-east-1_lkheaHXdI`
     * `VITE_COGNITO_CLIENT_ID`: `28acj6aedtj69hjhbmr5lej5a6`
5. Haz clic en **Deploy**.
6. En ~60 segundos Vercel te entregará tu dominio público seguro con HTTPS (ej: `https://sgaob-web.vercel.app`).

---

## 5. Paso 4: Actualizar las URLs en Amazon Cognito

1. En la consola de AWS, dirígete a **Amazon Cognito** ➔ **User Pools**.
2. Selecciona tu User Pool (`us-east-1_lkheaHXdI`).
3. Ve a la pestaña **App integration** y baja hasta **App client list**.
4. Haz clic sobre tu App Client (`28acj6aedtj69hjhbmr5lej5a6`) y selecciona **Edit** en *Hosted UI*.
5. En **Allowed callback URLs**, añade tu URL de Vercel:
   * `https://sgaob-web.vercel.app`
   * `https://sgaob-web.vercel.app/login`
   * `http://localhost:5173` (para mantener desarrollo local)
6. En **Allowed sign-out URLs**, añade exactamente las mismas URLs.
7. Guarda los cambios.

---

## 6. Verificación Final de la Arquitectura Desacoplada

1. Abre en tu navegador la URL de Vercel (`https://sgaob-web.vercel.app`).
2. Abre las herramientas de desarrollo del navegador (**F12** ➔ pestaña **Network**).
3. Inicia sesión con tus credenciales o en modo demo/local.
4. Observa el tráfico de red:
   * Las peticiones (`/api/users/me`, `/api/matches`, etc.) se envían a `https://<api-id>.execute-api.us-east-1.amazonaws.com/api/...`.
   * El estado HTTP retorna `200 OK`.
   * La IP de tu servidor EC2 nunca queda expuesta en la barra de direcciones ni en el cliente web.
