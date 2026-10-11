# Configuración para Producción en Hostinger

## 🚀 Pasos para Configurar OAuth en Producción

### 1. Configurar Google Cloud Console

1. **Ir a Google Cloud Console:**
   - https://console.cloud.google.com/
   - Selecciona tu proyecto

2. **Configurar OAuth 2.0:**
   - Ve a "APIs & Services" → "Credentials"
   - Edita el OAuth 2.0 Client ID existente
   - Añade los siguientes "Authorized redirect URIs":
     ```
     https://crysantem.tech/auth/callback
     https://www.crysantem.tech/auth/callback
     https://crysantem.tech/api/auth/google/callback
     https://www.crysantem.tech/api/auth/google/callback
     ```
   - Guarda los cambios

### 2. Configurar Supabase

1. **Actualizar Site URL en Supabase:**
   - Ve a tu proyecto en Supabase
   - Settings → General → Site URL
   - Cambia a: `https://crysantem.tech`

2. **Configurar Authentication:**
   - Authentication → Providers → Google
   - Asegúrate de que esté habilitado
   - Configura el redirect URI: `https://crysantem.tech/auth/callback`

3. **⚠️ IMPORTANTE: Ejecutar script SQL actualizado:**
   - Ve al SQL Editor en Supabase
   - Ejecuta el contenido de `backend/create_token_limits.sql`
   - Este script actualiza el trigger para usar `user_google_tokens` en lugar de `user_tokens`

### 3. Actualizar Backend (.env.production)

```bash
# Copiar .env.production.example a .env.production
# cp .env.production.example .env.production

# Luego editar con los valores reales:
# === SERVER CONFIGURATION ===
PORT=3000
NODE_ENV=production
APP_URL=https://crysantem.tech

# === GOOGLE OAUTH CONFIGURATION ===
GOOGLE_CLIENT_ID="tu-client-id-real"
GOOGLE_CLIENT_SECRET="tu-client-secret-real"
GOOGLE_REDIRECT_URI="https://crysantem.tech/api/auth/google/callback"

# === SUPABASE CONFIGURATION ===
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-real"
SUPABASE_ANON_KEY="tu-anon-key-real"

# === SECURITY TOKENS ===
API_TOKEN="genera-token-seguro-32-caracteres"
N8N_WEBHOOK_SECRET="genera-secret-seguro-32-caracteres"

# === CORS CONFIGURATION ===
ALLOWED_ORIGINS="https://crysantem.tech,https://www.crysantem.tech"
```

### 4. Actualizar Frontend

1. **Editar config.js:**
   - Abre `frontend/js/config.js`
   - Cambia `BACKEND_API_URL` a la URL de producción:
   ```javascript
   const BACKEND_API_URL = 'https://crysantem.tech';
   ```

### 5. Subir Frontend a Hostinger

1. **Comprimir carpeta frontend:**
   ```bash
   # Desde la raíz del proyecto
   cd frontend
   # Comprimir todos los archivos
   ```

2. **Subir a Hostinger:**
   - File Manager → public_html/
   - Subir todos los archivos de frontend/
   - Asegúrate de que index.html esté en la raíz

### 6. Subir Backend a VPS/Servidor

1. **Comprimir carpeta backend:**
   ```bash
   cd backend
   npm install --production
   ```

2. **Subir al servidor:**
   - Subir archivos al servidor
   - Configurar .env.production con las variables de producción
   - Iniciar con PM2:
     ```bash
     pm2 start server.js --name "crysantem-backend"
     pm2 save
     pm2 startup
     ```

### 7. Verificar Configuración

1. **Verificar que el backend esté accesible:**
   - `https://crysantem.tech/api/config`
   - Debería devolver la configuración con supabaseUrl, supabaseAnonKey y googleClientId

2. **Probar OAuth:**
   - Navega a `https://crysantem.tech`
   - Intenta iniciar sesión con Google
   - Debería funcionar correctamente

## 🔧 Variables de Entorno Requeridas

```bash
# Backend (.env.production)
PORT=3000
NODE_ENV=production
APP_URL=https://crysantem.tech
SERVE_FRONTEND=true

# Google OAuth
GOOGLE_CLIENT_ID="tu-client-id"
GOOGLE_CLIENT_SECRET="tu-client-secret"
GOOGLE_REDIRECT_URI="https://crysantem.tech/api/auth/google/callback"

# Supabase
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"
SUPABASE_ANON_KEY="tu-anon-key"

# Seguridad
API_TOKEN="tu-api-token-seguro"
N8N_WEBHOOK_SECRET="tu-webhook-secret-seguro"

# CORS
ALLOWED_ORIGINS="https://crysantem.tech,https://www.crysantem.tech"
```

## 📋 Checklist Antes de Desplegar

- [ ] Configurar redirect URIs en Google Cloud Console
- [ ] Actualizar Site URL en Supabase
- [ ] ⚠️ Ejecutar script SQL create_token_limits.sql en Supabase
- [ ] Configurar .env.production con dominio real
- [ ] Actualizar frontend/js/config.js con URL de backend
- [ ] Instalar dependencias de producción en backend
- [ ] Subir frontend a Hostinger
- [ ] Subir backend a servidor
- [ ] Configurar PM2 para backend
- [ ] Probar OAuth en producción
- [ ] Verificar que el chatbot funcione
- [ ] Verificar que la sección de contacto funcione

## 🐛 Solución de Problemas Comunes

### OAuth no funciona en producción

1. **Verificar redirect URIs:**
   - Google Cloud Console debe tener tu dominio
   - Supabase debe tener tu dominio en Site URL

2. **Verificar HTTPS:**
   - Google OAuth requiere HTTPS en producción
   - Configurar SSL en Hostinger

3. **Verificar CORS:**
   - Backend debe permitir tu dominio en CORS
   - Revisar `ALLOWED_ORIGINS` en .env

4. **Verificar trigger SQL:**
   - Asegúrate de haber ejecutado el script create_token_limits.sql
   - El trigger debe estar en la tabla user_google_tokens

### Chatbot no funciona

1. **Verificar backend:**
   - Backend debe estar ejecutándose
   - API debe ser accesible

2. **Verificar configuración:**
   - `/api/config` debe funcionar
   - Supabase keys deben ser correctas
   - Frontend config.js debe tener la URL correcta

### Error con tokens OAuth

1. **Verificar tabla correcta:**
   - El código ahora usa user_google_tokens (no user_tokens)
   - Asegúrate de que el trigger SQL esté actualizado

2. **Verificar datos:**
   - Los tokens se guardan en user_google_tokens
   - El trigger crea automáticamente límites en user_token_limits

## 📞 Soporte

Si tienes problemas durante el despliegue, revisa:
- Logs del backend (PM2 logs)
- Logs del navegador (console)
- Configuración de Google Cloud Console
- Configuración de Supabase
- ⚠️ Verificar que el script SQL se ejecutó correctamente