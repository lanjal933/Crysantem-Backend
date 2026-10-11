# Crysantem - Agentes y Chatbots de Inteligencia Artificial

Sitio web oficial de Crysantem, empresa especializada en soluciones de Inteligencia Artificial.

## 🏗️ Arquitectura del Proyecto

```
Crysantem.v1.4/
├── backend/                 # Backend Node.js/Express
│   ├── config/             # Configuración
│   ├── controllers/        # Controladores
│   ├── middleware/         # Middleware (auth, rate limiting)
│   ├── routes/             # Rutas API
│   ├── server.js           # Servidor principal
│   ├── package.json        # Dependencias
│   ├── .env                # Variables de entorno (desarrollo)
│   ├── .env.example        # Ejemplo de variables
│   ├── create_tables.sql   # Script SQL para crear tabla users
│   └── create_token_limits.sql  # Script para triggers (opcional)
│
├── frontend/               # Frontend estático
│   ├── css/                # Estilos con efectos visuales
│   ├── js/                 # JavaScript
│   ├── images/             # Imágenes
│   ├── videos/             # Videos del portfolio
│   ├── index.html          # Página principal
│   └── dashboard.html      # Dashboard de usuario
│
├── INSTRUCCIONES_SUPABASE.md  # Guía para configurar Supabase
├── README.md               # Esta documentación
└── .gitignore              # Archivos ignorados por Git
```

## 🚀 Cómo Ejecutar

### Requisitos Previos

- Node.js (v18 o superior)
- npm

### Configuración Inicial

1. **Configurar Supabase:**
   - Ve a: https://pazpomltsuerftqgkvmq.supabase.co
   - Navega a **SQL Editor**
   - Ejecuta el contenido de `backend/create_tables.sql`

   **Importante:** Las tablas `user_google_tokens` y `user_token_limits` ya existen en tu Supabase. El script solo creará la tabla `users`.

   Para más detalles, revisa: `INSTRUCCIONES_SUPABASE.md`

2. **Instalar dependencias del backend:**
   ```bash
   cd backend
   npm install
   ```

3. **Configurar variables de entorno:**
   - El archivo `.env` ya está configurado para desarrollo
   - Para producción, crea `.env.production` basado en `.env.example`

### Ejecutar en Desarrollo

```bash
cd backend
npm start
```

El servidor estará disponible en: http://localhost:3000

### Ejecutar en Producción

#### Opción 1: Render.com (Recomendado)

1. **Configurar render.yaml:**
   - El archivo `render.yaml` ya está configurado
   - Sube el código a GitHub

2. **Crear Web Service en Render:**
   - Ve a https://dashboard.render.com
   - Crea un nuevo Web Service
   - Conecta tu repositorio de GitHub
   - Render detectará automáticamente el `render.yaml`
   - Agrega las variables de entorno manualmente (las marcadas con `sync: false`)

3. **Variables de entorno necesarias:**
   ```
   APP_URL=https://tu-app-name.onrender.com
   GOOGLE_CLIENT_ID=tu-google-client-id
   GOOGLE_CLIENT_SECRET=tu-google-client-secret
   GOOGLE_REDIRECT_URI=https://tu-app-name.onrender.com/api/auth/google/callback
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   SUPABASE_ANON_KEY=tu-anon-key
   BREVO_API_KEY=tu-brevo-api-key
   API_TOKEN=tu-token-seguro
   N8N_WEBHOOK_SECRET=tu-secreto-webhook
   JWT_SECRET=tu-secreto-jwt
   ALLOWED_ORIGINS=https://tu-app-name.onrender.com,https://crysantem.tech
   N8N_WEBHOOK_URL=https://tu-n8n-webhook-url
   ```

4. **Configurar Google OAuth:**
   - Agrega la URL de Render como redirect URI en Google Cloud Console
   - Ejemplo: `https://tu-app-name.onrender.com/api/auth/google/callback`

#### Opción 2: VPS con PM2

1. **Configurar variables de producción:**
   ```bash
   cp backend/.env.example backend/.env.production
   # Editar .env.production con valores reales
   ```

2. **Actualizar frontend config:**
   - Editar `frontend/js/config.js`
   - Cambiar `BACKEND_API_URL` a la URL de producción

3. **Subir a producción:**
   - Frontend: Subir carpeta `frontend/` a Hostinger (public_html/)
   - Backend: Subir carpeta `backend/` a VPS/servidor
   - Configurar PM2: `pm2 start server.js --name "crysantem-backend"`

## 🔐 Seguridad

- Las credenciales están en variables de entorno del backend
- No se exponen secretos en el frontend
- Implementado rate limiting en endpoints sensibles
- Tokens JWT para autenticación
- Hashing de contraseñas con bcrypt
- Headers de seguridad con Helmet

## 📡 Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login con email/password
- `GET /api/auth/google` - Obtener URL de Google OAuth
- `GET /api/auth/google/callback` - Callback de Google OAuth
- `GET /api/auth/profile` - Obtener perfil de usuario (requiere token)

### Agente IA
- `POST /api/ai/message` - Enviar mensaje al agente (rate limited)

### Configuración
- `GET /api/config` - Obtener configuración pública (Supabase keys, Google Client ID)

## 🎨 Características del Frontend

### Diseño Visual
- **Tema oscuro** con fondo #050505 y superficies #101010
- **Verde Crysantem** (#00ff8c) como color de acento principal
- **Efectos visuales premium:**
  - Gradientes verdes radiales
  - Luces ambientales difusas
  - Glows en hover
  - Mouse-following glow en tarjetas
  - Scroll reveal animations
  - Transiciones suaves

### Secciones
- **Navbar discreta** con dropdown de autenticación
- **Hero impactante** con imagen de fondo y efectos de luz
- **Demo IA** con chat moderno y estilizado
- **Planes** con tarjetas numeradas (01-04) y badge "MÁS ELEGIDO"
- **Portfolio** con scroll horizontal e indicador 01/03
- **FAQ** con acordeón interactivo
- **Contacto** con WhatsApp, Email y opción de agendar sesión

### Funcionalidades
- **Responsive** para desktop, tablet y mobile
- **Sistema de autenticación** (email/password + Google OAuth)
- **Dashboard de usuario** con información de perfil
- **Conexión real** con agente IA via n8n webhook

## 🔧 Variables de Entorno

### Backend (.env)

```bash
# Server
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
SERVE_FRONTEND=true

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Supabase
SUPABASE_URL=https://pazpomltsuerftqgkvmq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
SUPABASE_ANON_KEY=tu-anon-key

# Seguridad
API_TOKEN=crysantem-api-token-2024-secure
N8N_WEBHOOK_SECRET=crysantem-n8n-webhook-secret-2024
JWT_SECRET=crysantem-jwt-secret-key-2024-very-secure

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# N8N
N8N_WEBHOOK_URL=https://n8n-n8n.f6ppdc.easypanel.host/webhook/agente-workspace
```

## 📝 Notas Importantes

1. **Supabase:** Las tablas `user_google_tokens` y `user_token_limits` ya existen en tu base de datos. Solo necesitas ejecutar `backend/create_tables.sql` para crear la tabla `users`.

2. **Google OAuth:** Para producción, configura los redirect URIs en Google Cloud Console:
   - `https://crysantem.tech/api/auth/google/callback`
   - `https://www.crysantem.tech/api/auth/google/callback`

3. **n8n Webhook:** El endpoint de IA está conectado al webhook de n8n proporcionado.

4. **Verificación de email:** La verificación de antigüedad del email no está implementada con una API específica, ya que no existe una fuente fiable para verificar la fecha de creación de correos genéricos. El sistema está preparado para incorporar esta funcionalidad en el futuro mediante un servicio confiable.

5. **Identidad Visual:** El diseño sigue la identidad de Crysantem basada en la web antigua (https://crysantem.tech/), con:
   - Fondo predominantemente oscuro
   - Verde como acento principal
   - Efectos visuales modernos (glows, gradientes, luces)
   - Navbar discreta que no compite con el contenido principal
   - Feeling tecnológico pero accesible

## 🧪 Testing

Antes de desplegar, verificar:

- [ ] Backend inicia correctamente
- [ ] Frontend carga sin errores
- [ ] Registro de usuarios funciona
- [ ] Login con email/password funciona
- [ ] Login con Google OAuth funciona
- [ ] Demo de IA responde mensajes
- [ ] Navbar responsive funciona
- [ ] Videos del portfolio cargan
- [ ] FAQ acordeón funciona
- [ ] Dashboard de usuario carga datos
- [ ] Rate limiting funciona en endpoints sensibles
- [ ] Efectos visuales (glows, hover) funcionan correctamente

## 📞 Contacto

- Teléfono: +1 323 709 3568
- Email: consultas@crysantem.tech
- Web: https://crysantem.tech

---

**Desarrollado para Crysantem** 🤖
