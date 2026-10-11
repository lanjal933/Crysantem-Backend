# Despliegue en Railway - Crysantem Backend

## Resumen
Migración de DonWeb VPS a Railway para simplificar el despliegue y mantenimiento.

## Prerequisitos
- Cuenta en Railway (https://railway.app)
- Repositorio en GitHub con el backend
- Variables de entorno listas

## Plan Recomendado
**Plan Hobby ($5/mes)**
- 512MB RAM ✅ Suficiente
- 0.5 vCPU ✅ Suficiente
- 1GB Disco ✅ Suficiente
- Ideal para APIs REST con Supabase

## Pasos de Despliegue

### 1. Preparar Repositorio en GitHub

```bash
# Desde la carpeta backend
cd C:\Users\Usuario\Desktop\Crysantem.v1.4\backend

# Inicializar git (si no existe)
git init

# Agregar archivos
git add .
git commit -m "Backend listo para Railway"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/TU_USUARIO/crysantem-backend.git
git branch -M main
git push -u origin main
```

### 2. Crear Proyecto en Railway

1. Ir a https://railway.app
2. Click en "New Project"
3. Seleccionar "Deploy from GitHub repo"
4. Elegir el repositorio `crysantem-backend`
5. Railway detectará automáticamente Node.js
6. Click en "Deploy"

### 3. Configurar Variables de Entorno

En Railway:
1. Ir al proyecto
2. Click en "Variables"
3. Agregar las siguientes variables:

```env
PORT=3000
NODE_ENV=production
APP_URL=https://crysantem-backend.railway.app
SERVE_FRONTEND=false

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://crysantem-backend.railway.app/api/auth/google/callback

SUPABASE_URL=https://pazpomltsuerftqgkvmq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-real
SUPABASE_ANON_KEY=tu-anon-key-real

BREVO_API_KEY=tu-brevo-api-key-real
EMAIL_FROM=noreply@crysantem.tech
EMAIL_FROM_NAME=Crysantem

API_TOKEN=crysantem-prod-api-token-2024-secure-key-x9k2m4p6
N8N_WEBHOOK_SECRET=crysantem-webhook-secret-2024-secure-v8n3r5t7
JWT_SECRET=tu-jwt-secret-seguro-min-32-caracteres

ALLOWED_ORIGINS=https://crysantem.tech,https://www.crysantem.tech

N8N_WEBHOOK_URL=https://n8n-n8n.f6ppdc.easypanel.host/webhook/agente-workflow
```

**IMPORTANTE:** Reemplazar los valores marcados con "real" con tus claves reales.

### 4. Actualizar Google OAuth

En Google Cloud Console:
1. Ir a Google Cloud Console > APIs & Services > Credentials
2. Editar el OAuth 2.0 Client ID
3. Agregar redirect URI:
   ```
   https://crysantem-backend.railway.app/api/auth/google/callback
   ```
4. Guardar cambios

### 5. Actualizar Frontend

En `frontend/js/config.js`:
```javascript
const API_URL = 'https://crysantem-backend.railway.app';
```

### 6. Verificar Despliegue

En Railway:
1. Ir a "Deployments"
2. Esperar a que el deployment esté "Active"
3. Click en "Open URL" para ver la URL
4. Probar:
   ```
   https://crysantem-backend.railway.app/api/config
   ```

### 7. Redirigir Dominio (Opcional)

Si quieres usar `api.crysantem.tech`:

**Opción A: Railway Custom Domain**
1. En Railway > Settings > Domains
2. Agregar `api.crysantem.tech`
3. Configurar DNS en tu proveedor:
   ```
   CNAME api.crysantem.tech -> railway.app
   ```

**Opción B: Cloudflare Tunnel (si usas Cloudflare)**
- Configurar tunnel a la URL de Railway

## Comandos Útiles

### Ver logs en Railway
```bash
railway logs
```

### Verificar deployment
```bash
railway status
```

### Acceder a la terminal del servidor
```bash
railway shell
```

## Ventajas vs DonWeb

✅ **Ventajas Railway:**
- Despliegue automático desde GitHub
- Variables de entorno fácilmente configurables
- SSL automático
- Logs centralizados
- Escalabilidad simple
- Sin configuración de Nginx/PM2
- Backups automáticos

❌ **Desventajas Railway:**
- Costo mensual ($5/mes) vs VPS barato
- Menos control sobre infraestructura

## Troubleshooting

### Error: Cannot find module
- Verificar que `package.json` está en la raíz del repo
- Verificar que `node_modules` está en `.gitignore`

### Error: Database connection
- Verificar variables `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- Verificar que Supabase está corriendo

### Error: CORS
- Verificar `ALLOWED_ORIGINS` en Railway variables
- Verificar que el dominio del frontend está incluido

### Error: Google OAuth
- Verificar que `GOOGLE_REDIRECT_URI` coincida con la URL de Railway
- Verificar que la URI está configurada en Google Cloud Console

## Costos Estimados

- **Plan Hobby:** $5/mes
- **Bandwidth:** $0.10/GB (gratis hasta 1GB)
- **Storage:** $0.25/GB (gratis hasta 1GB)

Para un backend de chat con Supabase, el costo estimado mensual es ~$5-10.

## Seguridad

- ✅ Variables de entorno cifradas
- ✅ SSL automático
- ✅ Health checks automáticos
- ✅ Logs centralizados
- ✅ Auto-restart en fallos

## Migración desde DonWeb

1. Desplegar en Railway (instrucciones arriba)
2. Cambiar `API_URL` en frontend
3. Actualizar Google OAuth redirect URI
4. Verificar endpoints
5. Cancelar DonWeb VPS (después de verificar)
