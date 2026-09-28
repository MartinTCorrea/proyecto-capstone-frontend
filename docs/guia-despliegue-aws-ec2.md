# Guía Paso a Paso: Despliegue y Puesta en Marcha de SGAOB en AWS EC2

Este documento contiene la guía operativa definitiva para volver a desplegar o reiniciar el ecosistema **SGAOB** en una instancia EC2 de **AWS Academy Learner Lab** (o cualquier servidor Ubuntu en AWS) desde cero.

---

## 1. Preparación en la Consola de AWS

### Paso 1.1: Iniciar el Laboratorio
1. En la plataforma de AWS Academy, haz clic en **"Start Lab"**.
2. Espera a que el círculo junto a **`AWS ●`** cambie a color verde y el temporizador comience a correr.
3. Haz clic en **`AWS Details`** (arriba a la derecha) y descarga la llave SSH (**`Download PEM`** o `labsuser.pem` / `vockey.pem`).
4. Haz clic sobre **`AWS ●`** para abrir la consola de administración en una nueva pestaña.

---

### Paso 1.2: Lanzar la Instancia EC2
1. En la consola de AWS, asegúrate de estar en la región **`N. Virginia (us-east-1)`**.
2. Busca el servicio **EC2** y haz clic en el botón naranja **"Launch instance"**.
3. Configura los campos:
   - **Name:** `sgaob-server`
   - **AMI:** Selecciona **Ubuntu** (*Ubuntu Server 24.04 LTS o 22.04 LTS, 64-bit x86*).
   - **Instance type:** Selecciona **`t3.small`** o **`t2.small`** (2 GB RAM). *(Si solo permite `t2.micro`, selecciónala; crearemos 2 GB de memoria Swap para compensar).*
   - **Key pair:** Selecciona la clave predeterminada **`vockey`**.
   - **Network settings:** Haz clic en **Edit**:
     - *Security group name:* `sgaob-sg`
     - **Regla 1 (SSH):** Tipo `SSH` | Puerto `22` | Origen `0.0.0.0/0`
     - **Regla 2 (Frontend Web):** Tipo `HTTP` | Puerto `80` | Origen `0.0.0.0/0`
     - **Regla 3 (Backend API):** Tipo `Custom TCP` | Puerto `3000` | Origen `0.0.0.0/0`
     - **Regla 4 (Mailpit Web UI):** Tipo `Custom TCP` | Puerto `8025` | Origen `0.0.0.0/0`
   - **Configure storage:** Cambia `8 GiB` a **`20 GiB`** (tipo `gp3`).
4. Haz clic en **"Launch instance"**.
5. Ve a la lista de instancias, selecciona `sgaob-server` y copia la **Dirección IPv4 pública** (ej: `3.239.105.151`).

---

## 2. Configuración del Servidor (Terminal de Ubuntu)

### Paso 2.1: Conectarte por la terminal
1. En la consola de EC2, selecciona la máquina y haz clic en **"Connect"**.
2. En la pestaña **"EC2 Instance Connect"**, haz clic en el botón naranja **"Connect"** para abrir la terminal web.
*(O por SSH local: `ssh -i "ruta/vockey.pem" ubuntu@<TU_IP_PUBLICA>`)*.

---

### Paso 2.2: Actualizar el sistema y crear memoria Swap
Copia y pega este bloque completo en la terminal:

```bash
# 1. Actualización de paquetes
sudo apt update && sudo apt upgrade -y

# 2. Creación de 2 GB de memoria Swap (evita que se congele durante compilaciones)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 3. Instalación de Docker y Git
sudo apt install -y git docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```
*(Si al finalizar aparece la pantalla azul de reinicio de servicios o scanning processes, solo presiona `Enter`)*.

---

### Paso 2.3: Clonar el proyecto y configurar el archivo `.env`
Ejecuta los siguientes comandos (reemplazando `<TU_IP_PUBLICA>` por la IP de tu EC2):

```bash
# 1. Clonar el repositorio
git clone https://github.com/MartinTCorrea/proyectocapstone.git
cd proyectocapstone

# 2. Crear y configurar variables de entorno
cp .env.example .env

# 3. Asignar la IP pública de tu servidor en el .env (reemplaza 3.239.105.151 con tu IP actual)
sed -i 's|http://localhost:5173|http://3.239.105.151|g' .env
sed -i 's|AUTH_PROVIDER=cognito|AUTH_PROVIDER=local|g' .env
```

---

## 3. Despliegue de Contenedores y Base de Datos

### Paso 3.1: Compilar y levantar la pila completa en Docker
Ejecuta:
```bash
sudo docker compose -f docker-compose.prod.yml up --build -d
```
*(Esto descargará Postgres, Redis, Mailpit y compilará la API NestJS y el Frontend React/Nginx. Tardará unos 2-3 minutos)*.

---

### Paso 3.2: Aplicar migraciones y cargar datos semilla (Seed)
Una vez que el build finalice y los contenedores estén corriendo:

```bash
# 1. Crear las tablas en PostgreSQL con Prisma
sudo docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# 2. Cargar roles del sistema y bloques horarios
sudo docker compose -f docker-compose.prod.yml exec api npm run prisma:seed
```

---

### Paso 3.3: Verificar el estado de los servicios
Ejecuta:
```bash
sudo docker compose -f docker-compose.prod.yml ps
```
Los 5 contenedores deben reportar estado **`Up`**:
- `sgaob-web-prod` (Puerto 80)
- `sgaob-api-prod` (Puerto 3000)
- `sgaob-postgres-prod` (Puerto 5432)
- `sgaob-redis-prod` (Puerto 6379)
- `sgaob-mailpit-prod` (Puertos 1025 y 8025)

---

## 4. Enlaces de Acceso Web

Abre en cualquier navegador de tu computador:
1. **Frontend SGAOB:** `http://<TU_IP_PUBLICA>`
2. **Swagger Docs API:** `http://<TU_IP_PUBLICA>:3000/api/docs`
3. **Bandeja Mailpit:** `http://<TU_IP_PUBLICA>:8025`

---

## 5. Comandos Útiles de Mantenimiento

### Actualizar la aplicación con nuevos cambios de GitHub
Si subiste cambios a la rama `main` en GitHub, actualizas tu servidor así:
```bash
cd ~/proyectocapstone
git pull origin main
sudo docker compose -f docker-compose.prod.yml up --build -d
```

### Ver logs en vivo en caso de error
```bash
# Ver logs de la API NestJS
sudo docker logs -f sgaob-api-prod

# Ver logs del Frontend Nginx
sudo docker logs -f sgaob-web-prod

# Ver logs de PostgreSQL
sudo docker logs -f sgaob-postgres-prod
```

### Reiniciar o Detener los servicios
```bash
# Reiniciar todos los servicios
sudo docker compose -f docker-compose.prod.yml restart

# Detener los contenedores sin borrar los datos
sudo docker compose -f docker-compose.prod.yml down

# Volver a iniciar los contenedores
sudo docker compose -f docker-compose.prod.yml up -d
```

---

## 6. ¿Qué pasa cuando el Learner Lab se apaga tras 4 horas?

En AWS Academy, la sesión del laboratorio dura 4 horas y luego se apaga automáticamente:
1. Al día siguiente entras a AWS Academy y haces clic en **"Start Lab"**.
2. Entras a la consola de AWS -> **EC2**.
3. Seleccionas tu máquina `sgaob-server` -> **Instance state** -> **Start instance**.
4. Como la IP pública de AWS puede cambiar al reiniciar la máquina:
   - Copias la nueva IP pública asignada.
   - En la terminal actualizas la variable `FRONTEND_URL` en tu archivo `.env`.
   - Ejecutas `sudo docker compose -f docker-compose.prod.yml up -d`.
   - **Toda tu base de datos y tus datos guardados permanecen intactos** en los volúmenes Docker de tu disco EBS.
