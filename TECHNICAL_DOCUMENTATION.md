# Documentación Técnica - Panel de Control iWeb

Este documento describe la arquitectura, las tecnologías utilizadas y la estructura del proyecto del Centro de Operaciones/Panel de Control de iWeb.

---

## 1. Tecnologías Utilizadas

El proyecto está construido sobre un stack de desarrollo frontend moderno:

- **Framework**: [Next.js 16](https://nextjs.org/) (usando el modelo de enrutamiento **App Router**).
- **Librería de UI**: [React 19](https://react.dev/).
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) (con integración a través de `@tailwindcss/postcss`).
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) para tipado estático y robustez.
- **Tipografías**: Fuentes de Google (Geist y Geist Mono) optimizadas mediante `next/font`.
- **Gestor de Paquetes**: `pnpm`.

---

## 2. Estructura de Directorios

La estructura de directorios sigue las convenciones de Next.js App Router:

```text
control-panel/
├── app/                      # Rutas de la aplicación (App Router)
│   ├── api/                  # Endpoints de API para autenticación y operaciones seguras
│   ├── dashboard/            # Rutas hijas protegidas del panel
│   │   ├── analiticas/       # Vista de estadísticas de facturación, ingresos y KPI
│   │   ├── clientes/         # Vista de gestión comercial (ABM de clientes)
│   │   ├── proyectos/        # Vista de seguimiento de proyectos internos
│   │   ├── rendimiento/      # Vista de monitoreo técnico (CPU, RAM, contenedores)
│   │   └── layout.tsx        # Layout compartido del dashboard (con Sidebar y Topbar)
│   ├── login/                # Página de inicio de sesión
│   ├── globals.css           # Estilos CSS globales y configuración de Tailwind CSS
│   ├── layout.tsx            # Layout raíz de la aplicación
│   └── page.tsx              # Punto de entrada (redirección basada en sesión)
├── components/               # Componentes de React reutilizables
│   ├── analytics/            # Componentes específicos de la vista de analíticas
│   ├── auth/                 # Guardianes de seguridad y login
│   ├── clients/              # Componentes de tablas, badges y modales para Clientes
│   ├── icons/                # Iconos SVG exportados como componentes
│   ├── layout/               # Componentes estructurales (Sidebar, Topbar, Notificaciones)
│   ├── performance/          # Componentes para monitoreo de rendimiento
│   ├── projects/             # Componentes para gestión de proyectos
│   └── ui/                   # Elementos genéricos de la interfaz (Card, Modal, Dialogs, etc.)
├── data/                     # Datos estáticos / Mocks simulados
├── types/                    # Definición de interfaces TypeScript
├── lib/                      # Utilidades, ayudantes y almacenamiento mock
├── next.config.ts            # Configuración de Next.js
├── tailwind.config.js        # Configuración de estilos (vía postcss o config básica)
└── package.json              # Dependencias del proyecto y scripts npm
```

---

## 3. Funcionamiento de la Aplicación

### Enrutamiento e Inicio de Sesión

- La raíz `/` redirige al usuario basándose en su estado de autenticación.
- Si no está autenticado, es redirigido a `/login`.
- Si está autenticado, entra a `/dashboard/analiticas`.
- La ruta `/dashboard` y sus subrutas están protegidas por:
  1. Un **Middleware de Next.js** en el servidor, que comprueba una cookie de sesión segura (`iweb_session`).
  2. Un componente **`AuthGuard`** a nivel de React que verifica la persistencia en el cliente y maneja estados de carga del navegador.

### Flujo de Datos y Simulación

- Toda la información mostrada de clientes, proyectos y telemetría proviene de datos simulados en la carpeta `data/`.
- Para simular operaciones CRUD (Crear, Leer, Actualizar, Borrar) y que los datos modificados por el usuario no se pierdan al navegar, la aplicación utiliza una mini-DB reactiva montada sobre el `localStorage` en `lib/storage.ts`.
- Esto permite realizar ediciones completas y simulaciones funcionales fieles a una API real.

---

## 4. Integración con VPS (Futuro)

Este panel de control se diseñó para operar como interfaz de control de una VPS remota.

- **Sin manejo de archivos locales**: La interfaz no realiza operaciones directas sobre el sistema de archivos del servidor web del frontend, lo que aísla de fallos de seguridad locales.
- **Consumo de APIs de VPS**: Para pasar de datos simulados a datos reales de producción de la VPS, se sustituirán las utilidades de `lib/storage.ts` por servicios de fetch reales que consuman endpoints seguros (por ejemplo, endpoints REST que expongan el estado de Docker, sockets ssh controlados o métricas Prometheus).
- **Monitoreo en Tiempo Real**: El módulo de "Rendimiento" puede conectarse mediante WebSockets o Server-Sent Events (SSE) a un agente ligero en la VPS para actualizar en vivo el consumo de CPU y RAM de cada contenedor de Docker.

---

## 5. Manual de Despliegue en VPS

Este manual describe el proceso para desplegar el Panel de Control en producción en una VPS con Linux (Ubuntu/Debian), configurando **PM2** para la persistencia del proceso y **Nginx** como proxy inverso para apuntar al dominio `ops.iwebtecnology.com` con SSL.

### 5.1. Requisitos Previos

En la VPS destino, asegúrate de tener instalados los siguientes componentes:

1. **Node.js** (v18.x o superior) y **pnpm** (instalador global recomendado: `npm install -g pnpm`).
2. **PM2** (gestor de procesos para Node.js): `npm install -g pm2`.
3. **Nginx**: `sudo apt update && sudo apt install nginx -y`.
4. **Certbot** (para certificados SSL): `sudo apt install certbot python3-certbot-nginx -y`.
5. **Docker**: Para que el panel detecte dinámicamente los contenedores, Docker debe estar instalado y el usuario que ejecuta la app de Node.js debe pertenecer al grupo `docker`.

### 5.2. Permisos de Docker (Importante)

Dado que el backend de Next.js ejecuta comandos CLI (`docker ps` y `docker stats`) mediante subprocesos en la ruta `/api/docker/containers`, el usuario del sistema que corre la aplicación necesita permisos de Docker.
Ejecuta el siguiente comando en la VPS sustituyendo `$USER` por el usuario del despliegue (ej. `ubuntu` o `www-data`):

```bash
sudo usermod -aG docker $USER
# Reinicia tu sesión de terminal o el servicio para aplicar los cambios:
newgrp docker
```

### 5.3. Preparación del Código y Construcción

1. Clona el repositorio en la VPS (ej. en `/var/www/control-panel`).
2. Crea el archivo `.env.local` con las credenciales de producción:
   ```bash
   ADMIN_USER=tu_usuario_root
   ADMIN_PASSWORD=tu_contraseña_segura
   JWT_SECRET=un_secreto_largo_y_seguro
   ```
3. Instala las dependencias de producción:
   ```bash
   pnpm install --frozen-lockfile
   ```
4. Construye la aplicación optimizada para producción:
   ```bash
   pnpm build
   ```

### 5.4. Configuración del Proceso con PM2 (Opción A)

Para que el servidor de Next.js corra en segundo plano de manera continua de forma nativa e inicie automáticamente en caso de reinicio de la VPS:

1. Arranca la aplicación con PM2 en el puerto **3027**:
   ```bash
   pm2 start pnpm --name "iweb-ops-panel" -- start --port 3027
   ```
2. Guarda el listado de procesos actual:
   ```bash
   pm2 save
   ```
3. Genera y configura el script de inicio del sistema:
   ```bash
   pm2 startup
   ```
   *(Sigue las instrucciones que se impriman en consola para ejecutar el comando de sudo resultante).*

---

### 5.5. Configuración con Docker y Docker Compose (Opción B - Recomendada)

Si prefieres aislar el panel de control dentro de un contenedor, se han provisto un `Dockerfile` y un `docker-compose.yml` en la raíz del proyecto.

#### 5.5.1. Archivo Dockerfile
El contenedor utiliza una imagen ligera de Node.js Alpine, instala `pnpm` para la construcción y descarga el cliente CLI de `docker` para que las llamadas internas a comandos de Docker sigan siendo funcionales:
* Ubicación: [Dockerfile](file:///c:/Users/F/Documents/iweb/control-panel/Dockerfile)

#### 5.5.2. Archivo docker-compose.yml
El compose expone el panel en el puerto **3027** del host y monta el socket de Docker de la VPS para que el panel pueda leer el rendimiento y estado de los otros contenedores activos de la máquina:
* Ubicación: [docker-compose.yml](file:///c:/Users/F/Documents/iweb/control-panel/docker-compose.yml)

#### 5.5.3. Lanzar el panel con Docker Compose:
1. Asegúrate de tener configuradas tus credenciales en el apartado `environment` de tu archivo `docker-compose.yml` o mediante un archivo `.env` en producción.
2. Inicia el contenedor en segundo plano:
   ```bash
   docker compose up -d --build
   ```

---

### 5.6. Configuración de Nginx como Proxy Inverso

Independientemente de si elegiste PM2 o Docker, la aplicación estará escuchando en el puerto **3027** del host. Configuraremos Nginx para redirigir el tráfico desde `operations.iwebtecnology.com`:

1. Crea un nuevo archivo de configuración para el sitio en Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/operations.iwebtecnology.com
   ```
2. Pega la siguiente configuración (proxy inverso apuntando al puerto **3027** con soporte para WebSockets):
   ```nginx
   server {
       listen 80;
       server_name operations.iwebtecnology.com;

       location / {
           proxy_pass http://127.0.0.1:3027;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
3. Habilita el sitio creando un enlace simbólico y recarga Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/operations.iwebtecnology.com /etc/nginx/sites-enabled/
   sudo nginx -t # Verifica que no haya errores de sintaxis
   sudo systemctl restart nginx
   ```

---

### 5.7. Configuración de SSL (HTTPS) con Let's Encrypt

Para habilitar HTTPS y cifrar las comunicaciones con el dominio `operations.iwebtecnology.com`:

```bash
sudo certbot --nginx -d operations.iwebtecnology.com
```
*Sigue las instrucciones en pantalla de Certbot (se recomienda seleccionar la opción de redirigir todo el tráfico HTTP a HTTPS de forma automática).*

Una vez completado, el Panel de Control estará accesible de manera segura en `https://operations.iwebtecnology.com`.
