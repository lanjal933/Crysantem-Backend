# Crysantem Backend

Backend Node.js/Express para Crysantem - Sistema de Agentes de IA y Gestión de Páginas MyIA.

## 📋 Requisitos

- Node.js v18 o superior
- npm
- Supabase (base de datos)
- Google Cloud Console (para OAuth)

## 🚀 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <repository-url>
   cd Crysantem.v1.4/backend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales reales
   ```

## ⚙️ Variables de Entorno

Copiar el archivo `.env.example` a `.env` y configurar las siguientes variables:

### Servidor
```bash
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
SERVE_FRONTEND=true
```

### Google OAuth
```bash
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Email (Brevo/Sendinblue)
```bash
BREVO_API_KEY=tu-brevo-api-key
EMAIL_FROM=noreply@crysantem.tech
EMAIL_FROM_NAME=Crysantem
```

### Supabase
```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
SUPABASE_ANON_KEY=tu-anon-key
```

### Seguridad
```bash
API_TOKEN=token-seguro-32-caracteres
N8N_WEBHOOK_SECRET=secreto-webhook-n8n
JWT_SECRET=secreto-jwt-muy-seguro
```

### CORS
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://crysantem.tech
```

### N8N
```bash
N8N_WEBHOOK_URL=https://tu-n8n-webhook-url
```

## 🗄️ Configuración de Base de Datos

Ejecutar los siguientes scripts SQL en Supabase SQL Editor:

1. **Tablas principales:**
   - `backend/create_tables.sql`

2. **MyIA:**
   - `backend/MYIA_DATABASE_SCHEMA.md` (según instrucciones)

3. **COWORKERS:**
   - `backend/migrate_coworkers.sql`

4. **Dashboards:**
   - `backend/migrate_page_stats.sql`

## 🏃 Ejecutar en Desarrollo

```bash
npm start
```

El servidor estará disponible en: http://localhost:3000

## 🚀 Despliegue en Producción

### Opción 1: VPS con PM2

1. **Configurar variables de producción:**
   ```bash
   NODE_ENV=production
   PORT=3000
   APP_URL=https://crysantem.tech
   SERVE_FRONTEND=false  # El frontend se sirve separadamente
   ```

2. **Instalar PM2:**
   ```bash
   npm install -g pm2
   ```

3. **Iniciar con PM2:**
   ```bash
   pm2 start server.js --name "crysantem-backend"
   pm2 save
   pm2 startup
   ```

### Opción 2: Docker

```bash
# Construir imagen
docker build -t crysantem-backend .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env crysantem-backend
```

### Opción 3: GitHub Actions

El proyecto incluye un workflow de GitHub Actions en `.github/workflows/deploy.yml`.

**Secrets requeridos en GitHub:**
- `SSH_PRIVATE_KEY`: Clave SSH para conectar al servidor
- `REMOTE_HOST`: IP o dominio del servidor
- `REMOTE_USER`: Usuario SSH

## 📡 Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/auth/google` - Google OAuth URL
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/profile` - Perfil (requiere token)

### MyIA
- `POST /api/myia/config` - Guardar configuración
- `GET /api/myia/config/:slug` - Obtener configuración
- `GET /api/myia/config-by-id/:id` - Obtener por ID
- `GET /api/myia/user-apps/:userId` - Apps del usuario
- `DELETE /api/myia/delete/:id` - Eliminar app
- `GET /api/myia/render/:slug` - Renderizar página
- `POST /api/myia/chat-message` - Mensaje de chat
- `GET /api/myia/check-coworker/:email` - Verificar coworker
- `GET /api/myia/stats/:pageId` - Estadísticas de página
- `POST /api/myia/log-message` - Registrar mensaje

### Agente IA
- `POST /api/ai/message` - Enviar mensaje a la IA

### Configuración
- `GET /api/config` - Configuración pública

## 🔒 Seguridad

- Rate limiting en endpoints sensibles
- Tokens JWT para autenticación
- Helmet para headers de seguridad
- CORS configurado
- Variables de entorno para secretos
- No exponer secrets en el código

## 🧪 Testing

```bash
# Ejecutar tests (si están configurados)
npm test
```

## 📝 Scripts Disponibles

```bash
npm start        # Iniciar servidor
npm run dev      # Iniciar con nodemon (desarrollo)
npm test         # Ejecutar tests
npm run build    # Construir (si aplica)
```

## 🐛 Troubleshooting

### El servidor no inicia
- Verificar que todas las variables de entorno estén configuradas
- Verificar que el puerto 3000 esté disponible
- Revisar logs: `pm2 logs crysantem-backend`

### Error de conexión a Supabase
- Verificar SUPABASE_URL y keys
- Verificar que las tablas existan
- Revisar permisos en Supabase

### Google OAuth falla
- Verificar redirect URI en Google Cloud Console
- Verificar que coincide con GOOGLE_REDIRECT_URI
- Verificar que el dominio esté autorizado

## 📞 Soporte

Para soporte técnico, contactar a:
- Email: consultas@crysantem.tech
- Web: https://crysantem.tech

---

**Desarrollado para Crysantem** 🤖
