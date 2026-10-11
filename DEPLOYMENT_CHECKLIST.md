# Checklist de Despliegue - Crysantem v1.5

## ✅ Backend (Render) - Listo para Desplegar

### Archivos Verificados
- ✅ `package.json` - Scripts correctos (`start: node server.js`)
- ✅ `package.json` - Engines especificados (`node >= 18.0.0`)
- ✅ `server.js` - CSP corregido (permite https://crysantem-backend.onrender.com)
- ✅ `.env.example` - Variables de entorno documentadas

### Configuración en Render

**Variables de Entorno Necesarias:**
```
PORT=3000
NODE_ENV=production
APP_URL=https://crysantem-backend.onrender.com
SERVE_FRONTEND=false  # IMPORTANTE: false en producción (frontend en Hostinger)

# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=https://crysantem-backend.onrender.com/api/auth/google/callback

# Email (Brevo)
BREVO_API_KEY=tu_api_key
EMAIL_FROM=noreply@crysantem.tech
EMAIL_FROM_NAME=Crysantem

# Supabase
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SUPABASE_ANON_KEY=tu_anon_key

# Seguridad
API_TOKEN=tu_api_token
N8N_WEBHOOK_SECRET=tu_n8n_secret
JWT_SECRET=tu_jwt_secret

# CORS
ALLOWED_ORIGINS=https://crysantem.tech,https://www.crysantem.tech

# N8N
N8N_WEBHOOK_URL=tu_n8n_webhook_url

# Mercado Pago
MP_ACCESS_TOKEN=tu_mp_access_token
MP_PUBLIC_KEY=tu_mp_public_key
MP_WEBHOOK_SECRET=tu_mp_webhook_secret

# Tapfiliate
TAPFILIATE_API_KEY=tu_tapfiliate_api_key

# Webhooks MyIA
WEBHOOK_RESPONDE=tu_webhook_url
WEBHOOK_ASISTE=tu_webhook_url
WEBHOOK_AUTOMATIZA=tu_webhook_url
WEBHOOK_INTELLIGENCE=tu_webhook_url
```

**Comandos en Render:**
- Build Command: `npm install`
- Start Command: `node server.js`

---

## ✅ Frontend (Hostinger) - Listo para Desplegar

### Archivos Verificados
- ✅ `frontend/js/config.js` - Apunta a `https://crysantem-backend.onrender.com`
- ✅ Duplicaciones de `config.js` eliminadas (7 archivos)
- ✅ Sintaxis corregida en `myia-home.js`

### Pasos en Hostinger

1. **Subir archivos:**
   - Copiar TODO el contenido de `frontend/` a `public_html/` en Hostinger

2. **Verificar estructura:**
   ```
   public_html/
   ├── index.html
   ├── css/
   ├── js/
   │   ├── config.js
   │   ├── main.js
   │   └── ...
   ├── images/
   └── myia-*.html
   ```

3. **Configuración adicional (opcional):**
   - Si necesitas cambiar la URL del backend en el futuro, editar `js/config.js`

---

## ⚠️ Supabase - Migraciones Pendientes

**IMPORTANTE:** Ejecutar estos scripts SQL en el SQL Editor de Supabase:

1. **migrate_saas_pricing.sql** - Modelo SaaS y suscripciones
2. **migrate_tokens_to_messages.sql** - Tokens → Mensajes
3. **migrate_message_counter.sql** - Contador de mensajes mensuales

**No se carga código en Supabase**, solo se ejecutan migraciones SQL.

---

## ⚠️ Configuración Pendiente

### 1. Webhook de Mercado Pago
Una vez desplegado en Render, configurar el webhook:
- URL: `https://crysantem-backend.onrender.com/api/myia/mercadopago-webhook`
- Secret: El que definas en `MP_WEBHOOK_SECRET`

### 2. Google OAuth Redirect URI
Actualizar en Google Cloud Console:
- Agregar: `https://crysantem-backend.onrender.com/api/auth/google/callback`

### 3. Tapfiliate (si usas afiliados)
- Configurar URL de webhook para comisiones

---

## 📋 Resumen de Cambios Realizados

### Correcciones Aplicadas (v1.5.1)

1. **CSP corregido** - Agregado `https://crysantem-backend.onrender.com` a connectSrc
2. **Duplicaciones eliminadas** - `config.js` ya no se carga 2 veces
3. **Syntax error corregido** - `myia-home.js` (try sin catch)
4. **Builder corregido**:
   - Header tema/color funcionan
   - Consumo muestra mensajes (no caracteres)
   - Posición de chat eliminada
   - Chat clásico legible
5. **Templates predefinidos implementados**
6. **Pagos anuales corregidos** - Ahora cobra mensual con descuento (MRR)

---

## 🚀 Orden de Despliegue Recomendado

1. **Ejecutar migraciones en Supabase** (primero)
2. **Desplegar backend en Render**
3. **Configurar variables de entorno en Render**
4. **Desplegar frontend en Hostinger**
5. **Configurar webhooks y OAuth redirect URIs**
6. **Probar flujo completo end-to-end**

---

## 🔧 Comandos Útiles

```bash
# Instalar dependencias (Render lo hace automáticamente)
cd backend
npm install

# Iniciar servidor local para pruebas
cd backend
node server.js

# Verificar migraciones SQL antes de ejecutar
# Abrir cada archivo .sql en Supabase SQL Editor
```

---

## ✅ Estado Actual

- **Backend**: ✅ Listo para desplegar a Render
- **Frontend**: ✅ Listo para desplegar a Hostinger
- **Supabase**: ⚠️ Migraciones pendientes de ejecutar
- **Webhooks**: ⚠️ Configuración pendiente (necesita URL de Render)

**El código está listo para desplegar. Solo falta:**
1. Ejecutar migraciones SQL en Supabase
2. Desplegar y configurar variables de entorno
3. Configurar webhooks con la URL de producción
