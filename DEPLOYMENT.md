# Guía de Despliegue - Crysantem V1.4

## Requisitos de Hosting

### Backend (Node.js)
- **Node.js**: v18 o superior
- **NPM**: v9 o superior
- **Base de datos**: Supabase (externa)
- **Servicio de email**: SendGrid, Mailgun o Brevo

### Frontend
- Servidor web estático (Nginx, Apache, o hosting compartido)
- HTTPS/SSL certificado

---

## Despliegue en DonWeb

### Paso 1: Subir archivos al servidor

1. **Comprimir el proyecto** (excluyendo `node_modules`):
   ```bash
   # En tu máquina local
   tar -czf crysantem.tar.gz --exclude=node_modules --exclude=.env backend/ frontend/
   ```

2. **Subir via FTP o SFTP** al servidor de DonWeb:
   - Extraer el contenido en `/public_html/` o la carpeta designada
   - La estructura debe ser:
     ```
     /public_html/
       ├── backend/
       │   ├── server.js
       │   ├── package.json
       │   ├── config/
       │   ├── controllers/
       │   ├── routes/
       │   ├── services/
       │   ├── middleware/
       │   └── migrations/
       └── frontend/
           ├── index.html
           ├── css/
           ├── js/
           └── IMG/
     ```

### Paso 2: Configurar variables de entorno

1. **Crear archivo `.env`** en la carpeta `backend/`:
   ```bash
   cd /public_html/backend
   cp env.production.example .env
   nano .env
   ```

2. **Editar las variables** con tus credenciales de producción:
   - `APP_URL`: Tu dominio (ej: `https://crysantem.tech`)
   - `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`: Del Google Cloud Console
   - `EMAIL_*`: Credenciales de tu servicio de email
   - `SUPABASE_*`: Tus credenciales de Supabase
   - `JWT_SECRET`: Genera uno seguro (mínimo 32 caracteres)
   - `ALLOWED_ORIGINS`: Tu dominio

### Paso 3: Instalar dependencias

```bash
cd /public_html/backend
npm install --production
```

### Paso 4: Ejecutar migraciones de base de datos

1. Ve al panel de Supabase
2. Ejecuta el SQL del archivo `backend/migrations/create_email_verification_codes.sql`

### Paso 5: Configurar PM2 para mantener el servidor corriendo

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar la aplicación
pm2 start server.js --name crysantem

# Configurar para que inicie automáticamente
pm2 startup
pm2 save
```

### Paso 6: Configurar Nginx (si usas VPS)

Crea un archivo de configuración en `/etc/nginx/sites-available/crysantem`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar y reiniciar Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/crysantem /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Paso 7: Configurar SSL con Let's Encrypt

```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

---

## Despliegue en Hostinger

### Opción A: Hosting Compartido (Node.js)

1. **Subir archivos** via FTP al directorio principal
2. **Configurar variables de entorno** en el panel de Hostinger:
   - Ve a "Hosting Manager" → "Advanced" → "Environment Variables"
   - Agrega todas las variables del archivo `env.production.example`
3. **Instalar dependencias**:
   - En el panel de Hostinger, busca "Node.js" en el "File Manager"
   - Ejecuta `npm install --production` en la carpeta backend
4. **Configurar la aplicación Node.js**:
   - En el panel, ve a "Node.js" → "Create New App"
   - Document root: `/backend`
   - Application mode: `Production`
   - Application URL: Tu dominio
   - Application startup file: `server.js`
5. **Ejecutar migraciones** en Supabase

### Opción B: VPS en Hostinger

Sigue los mismos pasos que para DonWeb (instalación manual).

---

## Configuración de Google OAuth en Producción

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Ve a tu proyecto → "APIs & Services" → "Credentials"
3. Edita el OAuth 2.0 Client ID
4. Agrega tu dominio de producción en:
   - **Authorized JavaScript origins**: `https://tu-dominio.com`
   - **Authorized redirect URIs**: `https://tu-dominio.com/api/auth/google/callback`
5. Guarda los cambios

---

## Configuración de Email en Producción

### Recomendación: Usar Brevo (Sendinblue)

1. Regístrate en [Brevo](https://www.brevo.com/)
2. Ve a "SMTP & API" → "SMTP Settings"
3. Obtén las credenciales SMTP
4. Configura en tu `.env`:
   ```env
   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=tu-email@brevo.com
   EMAIL_PASS=tu-smtp-key
   EMAIL_FROM=noreply@crysantem.tech
   ```

### Alternativas: SendGrid o Mailgun

Ambos tienen planes gratuitos y son similares de configurar.

---

## Verificación Post-Despliegue

1. **Verificar que el servidor corra**:
   ```bash
   pm2 status  # o revisa logs en el panel del hosting
   ```

2. **Probar la aplicación**:
   - Visita tu dominio
   - Prueba el login con Google
   - Prueba el chat demo
   - Verifica que las páginas carguen correctamente

3. **Revisar logs**:
   ```bash
   pm2 logs crysantem
   ```

---

## Troubleshooting

### El servidor no inicia
- Verifica que Node.js esté instalado: `node --version`
- Revisa las variables de entorno en `.env`
- Revisa los logs: `pm2 logs crysantem`

### Error de CORS
- Verifica que tu dominio esté en `ALLOWED_ORIGINS`
- Revisa la configuración de CORS en `backend/config/config.js`

### Google OAuth no funciona
- Verifica que el redirect URI coincida exactamente
- Revisa que el dominio esté agregado en Google Cloud Console

### Emails no se envían
- Verifica las credenciales SMTP
- Revisa los logs del servidor
- Verifica que el servicio de email esté activo

---

## Seguridad en Producción

1. **Nunca subir** el archivo `.env` al repositorio
2. **Usar HTTPS** siempre
3. **Actualizar dependencias** regularmente: `npm update`
4. **Monitorear** los logs regularmente
5. **Hacer backups** de la base de datos en Supabase
6. **Usar tokens seguros** (mínimo 32 caracteres aleatorios)

---

## Actualizaciones Futuras

Para actualizar la aplicación:

1. Hacer backup del código actual
2. Subir los nuevos archivos
3. Ejecutar `npm install --production`
4. Reiniciar PM2: `pm2 restart crysantem`
5. Ejecutar nuevas migraciones de base de datos si existen
