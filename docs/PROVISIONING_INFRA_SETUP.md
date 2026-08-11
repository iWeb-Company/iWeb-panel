# Guía de Configuración de Infraestructura: Subdominios Wildcard, Nginx y SSL

Esta guía contiene la configuración exacta requerida en **Hostinger** y en la **VPS de Donweb (Ubuntu)** para que cualquier nuevo subdominio (ej: `ruta86.tranett.com`, `turismonorte.tranett.com`) funcione automáticamente sin requerir creación manual.

---

## 1. Configuración de DNS Wildcard en Hostinger

Ingresa al panel de control de **Hostinger** > **Dominios** > Selecciona `tranett.com` > **Editor de Zona DNS**.

Crea/edita los siguientes dos registros tipo `A`:

| Tipo | Nombre (Host) | Contenido (Apunta a) | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `*` | `<IP_PUBLICA_VPS_DONWEB>` | 300 / Automático |
| **A** | `@` | `<IP_PUBLICA_VPS_DONWEB>` | 300 / Automático |

> [!NOTE]
> El registro `*` (Wildcard) hace que cualquier solicitud hacia `*.tranett.com` (cualquier prefijo) sea dirigida instantáneamente a la IP de la VPS de Donweb.

---

## 2. Configuración de Nginx Maestro en la VPS de Donweb

En la VPS de Donweb, crea o edita el archivo de virtual host para `tranett.com`:

```bash
sudo nano /etc/nginx/sites-available/tranett.com
```

Pega la siguiente configuración optimizada:

```nginx
# ==============================================================================
# Redirección HTTP a HTTPS para todos los subdominios y dominio raíz
# ==============================================================================
server {
    listen 80;
    listen [::]:80;
    server_name tranett.com *.tranett.com;

    # Permitir validación ACME para renovación de certificados
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# ==============================================================================
# Servidor Principal HTTPS: Frontend Next.js + Backend FastAPI + Archivos Estáticos
# ==============================================================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tranett.com *.tranett.com;

    # Certificado SSL Wildcard (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tranett.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tranett.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Tamaño máximo de subida para fotos de hoteles, logos y flyers (50 MB)
    client_max_body_size 50M;

    # --------------------------------------------------------------------------
    # 1. Archivos Estáticos y Assets de Tenants servidos directo por Nginx
    # --------------------------------------------------------------------------
    location /MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Tranett/data/ {
        alias /home/iweb/saas/data/travelnett/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }

    # --------------------------------------------------------------------------
    # 2. Proxy hacia Backend FastAPI (Docker puerto interno 8012)
    # --------------------------------------------------------------------------
    location /MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Tranett/api/ {
        proxy_pass http://127.0.0.1:8012;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Timeouts para subida de imágenes y queries pesadas
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # --------------------------------------------------------------------------
    # 3. Proxy hacia Frontend Next.js (Docker puerto interno 3012)
    # --------------------------------------------------------------------------
    location / {
        proxy_pass http://127.0.0.1:3012;
        proxy_http_version 1.1;

        # Soporte para WebSockets y Fast Refresh
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Cabeceras requeridas para que Next.js detecte el subdominio en middleware
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_cache_bypass $http_upgrade;
    }
}
```

Habilita el sitio y recarga Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/tranett.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. Emisión del Certificado SSL Wildcard con Certbot (DNS-01)

Para proteger `*.tranett.com` con SSL gratuito de Let's Encrypt, se requiere un desafío DNS-01:

```bash
sudo certbot certonly --manual \
  --preferred-challenges=dns \
  --server https://acme-v02.api.letsencrypt.org/directory \
  -d "tranett.com" -d "*.tranett.com"
```

1. Certbot te pedirá crear un registro tipo `TXT` en Hostinger llamado `_acme-challenge.tranett.com` con un valor específico.
2. Añádelo en el editor DNS de Hostinger.
3. Espera 1 minuto y presiona Enter en la terminal.
4. Certbot generará `/etc/letsencrypt/live/tranett.com/fullchain.pem` y `privkey.pem`.

---

## 4. Verificación del Flujo Completo

1. **Prueba de Subdominio en Navegador**:
   - Ingresa a `https://ruta86.tranett.com/login`.
   - Next.js detecta el subdominio `ruta86`, carga los logos desde el almacenamiento y permite el login directo.
2. **Prueba desde Panel de Operaciones**:
   - Crea un nuevo cliente en el panel con nombre "Viajes Patagonia" -> genera subdominio `viajespatagonia.tranett.com`.
   - Al terminar, se muestra el modal con el enlace listo y credenciales.
