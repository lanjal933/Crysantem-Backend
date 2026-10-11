# Guía de Despliegue - Crysantem v1.5.2

## 📋 Checklist Pre-Despliegue

### 1. Supabase (PRIMERO - Obligatorio)
Ejecutar estos 4 scripts SQL en el SQL Editor de Supabase:

**Orden de ejecución:**
1. `backend/migrate_saas_pricing.sql`
2. `backend/migrate_tokens_to_messages.sql`
3. `backend/migrate_message_counter.sql`
4. `backend/migrate_builder_improvements.sql`

**Cómo ejecutar:**
- Entra a Supabase → SQL Editor
- Copia el contenido de cada archivo
- Pégalo y haz clic en "Run"
- Espera a que termine cada uno antes de ejecutar el siguiente

---

### 2. Backend en Render

**Paso 1: Crear cuenta en Render**
- Entra en https://render.com
- Regístrate o inicia sesión

**Paso 2: Crear nuevo Web Service**
- Dashboard → New → Web Service
- Conecta tu repositorio de Git (GitHub, GitLab, etc.)
- **Name**: `crysantem-backend`
- **Region**: Singapore (o la más cercana a tus usuarios)
- **Branch**: `main`

**Paso 3: Configurar el servicio**
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

**Paso 4: Variables de Entorno (Environment Variables)**
Copia y pega estas variables:

```
PORT=3000
NODE_ENV=production
APP_URL=https://crysantem-backend.onrender.com
SERVE_FRONTEND=false

# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=https://crysantem-backend.onrender.com/api/auth/google/callback

# Email (Brevo)
BREVO_API_KEY=tu_api_key_aqui
EMAIL_FROM=noreply@crysantem.tech
EMAIL_FROM_NAME=Crysantem

# Supabase
SUPABASE_URL=tu_supabase_url_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
SUPABASE_ANON_KEY=tu_anon_key_aqui

# Seguridad
API_TOKEN=tu_api_token_aleatorio_seguro
N8N_WEBHOOK_SECRET=tu_n8n_secret_aleatorio_seguro
JWT_SECRET=tu_jwt_secret_aleatorio_seguro

# CORS
ALLOWED_ORIGINS=https://crysantem.tech,https://www.crysantem.tech

# N8N
N8N_WEBHOOK_URL=https://n8n-n8n.f6ppdc.easypanel.host/webhook/agente-workflow
N8N_WEBHOOK_SECRET=tu_n8n_secret_aleatorio_seguro

# Webhooks MyIA por plan
WEBHOOK_RESPONDE=https://n8n-n8n.f6ppdc.easypanel.host/webhook/43f55ce7-5167-436b-83c6-6b7888f1a24d
WEBHOOK_ASISTE=https://n8n-n8n.f6ppdc.easypanel.host/webhook/b3b7d439-87ca-4be8-a0cd-aae9578aea8e
WEBHOOK_AUTOMATIZA=https://n8n-n8n.f6ppdc.easypanel.host/webhook/03d59107-4e07-4677-af74-ba98ead56518
WEBHOOK_INTELLIGENCE=https://n8n-n8n.f6ppdc.easypanel.host/webhook/bd0ee850-a7a8-469c-a05d-93e389938b38

# Mercado Pago
MP_ACCESS_TOKEN=tu_mp_access_token_aqui
MP_PUBLIC_KEY=tu_mp_public_key_aqui
MP_WEBHOOK_SECRET=30356cbfc08a95370d395b2913bf78285c69a370290565de0ee6f4bbd7260cc1

# Tapfiliate
TAPFILIATE_API_KEY=tu_tapfiliate_api_key_aqui

# Webhooks MyIA
WEBHOOK_RESPONDE=tu_webhook_responde_url_aqui
WEBHOOK_ASISTE=tu_webhook_asiste_url_aqui
WEBHOOK_AUTOMATIZA=tu_webhook_automatiza_url_aqui
WEBHOOK_INTELLIGENCE=tu_webhook_intelligence_url_aqui
```

**Paso 5: Desplegar**
- Haz clic en "Create Web Service"
- Espera a que termine el build
- Copia la URL del backend (ej: `https://crysantem-backend.onrender.com`)

---

### 3. Frontend en Hostinger

**Paso 1: Acceder a Hostinger**
- Entra en tu panel de Hostinger
- Ve a "Archivos" o "File Manager"

**Paso 2: Subir archivos**
- Ve a `public_html/`
- Borra todo el contenido actual (si hay algo)
- Sube TODO el contenido de la carpeta `frontend/`:
  - `index.html`
  - `css/` (toda la carpeta)
  - `js/` (toda la carpeta)
  - `images/` (toda la carpeta)
  - Todos los archivos `myia-*.html`

**Paso 3: Verificar `js/config.js`**
- Asegúrate que apunte a: `https://crysantem-backend.onrender.com`
- Si usaste localhost durante desarrollo, cámbialo

---

### 4. Configurar Webhooks (POST-Despliegue)

**Paso 1: Mercado Pago**
- Entra en Mercado Pago → Aplicaciones → Tu aplicación
- Webhooks → Configurar webhook
- **URL**: `https://crysantem-backend.onrender.com/api/myia/mercadopago-webhook`
- **Secret**: `30356cbfc08a95370d395b2913bf78285c69a370290565de0ee6f4bbd7260cc1`

**Paso 2: Google OAuth**
- Entra en Google Cloud Console → tu proyecto
- APIs & Services → Credentials → OAuth 2.0 Client ID
- Authorized redirect URIs
- Agregar: `https://crysantem-backend.onrender.com/api/auth/google/callback`

**Paso 3: N8N Webhook**
- Pásame el webhook de n8n cuando lo tengas
- Configurar para que se dispare cuando se crea una nueva página MyIA

---

## � Verificación Post-Despliegue

### Verificar Backend
1. Abre `https://crysantem-backend.onrender.com/api/config`
2. Debe retornar JSON con configuración

### Verificar Frontend
1. Abre `https://crysantem.tech` (o tu dominio)
2. Navega a MyIA → Comenzar
3. Verifica que cargue correctamente

### Verificar Flujo Completo
1. Crear una nueva página MyIA
2. Configurar builder
3. Seleccionar plan
4. Verificar que todo funcione

---

## � Listo para Desplegar

**Estado actual:**
- ✅ Código listo
- ✅ Migraciones SQL creadas
- ✅ Variables de entorno documentadas
- ⚠️ Esperando tus credenciales para variables de entorno
- ⚠️ Esperando webhook de n8n

**Pásame:**
1. El webhook de n8n cuando lo tengas
2. Confirma si ejecutaste las migraciones en Supabase
3. Las credenciales para las variables de entorno (pueden compartirlas en privado si prefieres)
