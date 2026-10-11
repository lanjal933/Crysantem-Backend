# Arquitectura de MyIA - Backend

## Resumen

MyIA es un sistema de creación de páginas con agentes de IA que permite a los usuarios crear páginas personalizadas con chatbots integrados. El sistema consiste en:

1. **Frontend**: Constructor visual de páginas
2. **Backend**: API REST + Servidor de renderizado
3. **Base de Datos**: Supabase (PostgreSQL)
4. **Integración**: n8n para procesamiento de IA (webhooks)

## Flujo del Sistema

### 1. Creación de Página

```
Usuario → myia-plans.html → myia-builder.js → myia-summary.js → Backend API → Supabase
```

**Pasos:**
1. Usuario selecciona un plan (responde, asiste, automatiza, intelligence)
2. Usuario configura la página en el builder visual
3. Usuario revisa el resumen técnico
4. Al crear, se envía la configuración al backend en snake_case
5. Backend guarda en `myia_page_config` en Supabase
6. Backend invoca webhook de n8n según el plan
7. Backend genera HTML de la página

### 2. Renderizado de Página

```
Usuario → /api/myia/render/:slug → Backend → Supabase → Generar HTML → Respuesta HTML
```

**Pasos:**
1. Usuario accede a `crysantem.tech/{slug}`
2. Backend busca configuración en Supabase por slug
3. Backend genera HTML dinámico con la configuración
4. HTML incluye:
   - Estilos personalizados según configuración
   - Funcionalidad de chat conectada a webhook de n8n
   - Diseño responsive

### 3. Chat en Tiempo Real

```
Usuario → Input mensaje → Fetch a webhook n8n → n8n procesa → Respuesta → Mostrar en chat
```

**Webhooks por plan (PRODUCTION):**
- `responde`: https://n8n-n8n.f6ppdc.easypanel.host/webhook/43f55ce7-5167-436b-83c6-6b7888f1a24d
- `asiste`: https://n8n-n8n.f6ppdc.easypanel.host/webhook/b3b7d439-87ca-4be8-a0cd-aae9578aea8e
- `automatiza`: https://n8n-n8n.f6ppdc.easypanel.host/webhook/03d59107-4e07-4677-af74-ba98ead56518
- `intelligence`: https://n8n-n8n.f6ppdc.easypanel.host/webhook/bd0ee850-a7a8-469c-a05d-93e389938b38

## Base de Datos (Supabase)

### Tablas

#### `myia_page_config`
Configuración de cada página creada.

**Columnas principales:**
- `id`: UUID único
- `user_id`: ID del usuario dueño
- `business_name`: Nombre del negocio
- `slug`: URL personalizada (ej: "kashippp")
- `logo_url`: URL del logo
- `background_type`: solid, gradient, glow
- `background_color`: Color hexadecimal
- `welcome_message`: Mensaje de bienvenida del chat
- `system_prompt`: Prompt del sistema para n8n
- `ai_model`: gemini-flash o gemini-pro
- `plan`: responde, asiste, automatiza, intelligence
- `is_active`: Booleano para activar/desactivar página

#### `myia_users`
Información de usuarios de MyIA.

**Columnas:**
- `id`: UUID (mismo que users table)
- `email`: Email del usuario
- `google_id`: ID de Google OAuth
- `refresh_token`: Token de refresco de Google
- `scopes`: Permisos OAuth
- `selected_plan`: Plan seleccionado

#### `user_google_tokens`
Tokens de OAuth de Google.

**Columnas:**
- `user_id`: ID del usuario
- `access_token`: Token de acceso actual
- `refresh_token`: Token de refresco
- `email`: Email asociado
- `expires_at`: Fecha de expiración

## API Endpoints

### MyIA

#### POST `/api/myia/config`
Guarda o actualiza configuración de página.

**Request:**
```json
{
  "userId": "uuid",
  "config": {
    "business_name": "Mi Negocio",
    "slug": "mi-negocio",
    "welcome_message": "Hola...",
    "system_prompt": "Eres un asistente...",
    // ... más campos
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* configuración guardada */ }
}
```

#### GET `/api/myia/user-apps/:userId`
Obtiene todas las páginas de un usuario.

#### GET `/api/myia/config-by-id/:id`
Obtiene configuración de una página específica por ID.

#### GET `/api/myia/render/:slug`
Renderiza HTML de una página pública por slug.

#### DELETE `/api/myia/delete/:id`
Elimina una página completamente de la base de datos.

#### POST `/api/myia/webhook/test`
Webhook de prueba para pruebas de integración.

## Integración con n8n

### Configuración de Webhooks

Los webhooks se configuran en variables de entorno en `.env`:

```env
WEBHOOK_RESPONDE=https://n8n.crysantem.tech/webhook/responde
WEBHOOK_ASISTE=https://n8n.crysantem.tech/webhook/asiste
WEBHOOK_AUTOMATIZA=https://n8n.crysantem.tech/webhook/automatiza
WEBHOOK_INTELLIGENCE=https://n8n.crysantem.tech/webhook/intelligence
```

### Payload enviado a n8n

Cuando un usuario envía un mensaje en el chat:

```json
{
  "message": "¿Cuál es tu horario?",
  "pageId": "uuid-de-pagina",
  "userId": "uuid-de-usuario",
  "config": {
    "businessName": "Mi Negocio",
    "slug": "mi-negocio",
    "systemPrompt": "Eres un asistente...",
    "plan": "responde"
  }
}
```

### Respuesta esperada de n8n

```json
{
  "response": "Nuestro horario es de 9am a 6pm..."
}
```

## Backend Sólido

### Estructura

```
backend/
├── routes/
│   ├── myia.js          # Rutas de MyIA
│   ├── auth.js          # Autenticación
│   └── ai.js            # API de IA principal
├── controllers/
│   ├── authController.js # Lógica de auth
│   └── aiController.js  # Lógica de IA
├── config/
│   ├── config.js        # Configuración general
│   └── supabase.js      # Cliente Supabase
└── server.js            # Servidor Express
```

### Características del Backend

1. **API REST**: Endpoints bien estructurados
2. **Base de Datos**: Supabase (PostgreSQL) como DB principal
3. **Autenticación**: Google OAuth + JWT
4. **Renderizado Dinámico**: HTML generado en tiempo real
5. **Rate Limiting**: Protección contra abuso
6. **Error Handling**: Manejo robusto de errores
7. **Logging**: Logs detallados para debugging

### Seguridad

- **Autenticación**: JWT tokens para proteger endpoints privados
- **Validación**: Validación de inputs en todos los endpoints
- **Rate Limiting**: Límites de requests por IP
- **CORS**: Configuración de orígenes permitidos
- **Environment Variables**: Secrets en .env (no en código)

### Escalabilidad

- **Sin estado**: El backend no mantiene estado entre requests
- **DB Conexión Pool**: Supabase maneja el pool de conexiones
- **Cache**: Posibilidad de agregar Redis para cache de configs frecuentes
- **Horizontal Scaling**: Puede escalarse horizontalmente con multiple instancias

## Webhooks por Plan

### Responde ($75/mes)
- Webhook: `/webhook/responde`
- Modelo: Gemini Flash
- Límite: 50,000 caracteres
- Scopes: email, profile

### Asiste ($150/mes)
- Webhook: `/webhook/asiste`
- Modelo: Gemini Flash
- Límite: 100,000 caracteres
- Scopes: email, profile, Drive readonly

### Automatiza ($250/mes)
- Webhook: `/webhook/automatiza`
- Modelo: Gemini Pro
- Límite: 500,000 caracteres
- Scopes: email, profile, Calendar

### Intelligence ($450/mes)
- Webhook: `/webhook/intelligence`
- Modelo: Gemini Pro
- Límite: 2,000,000 caracteres
- Scopes: email, profile, Calendar, Drive readonly, Gmail readonly

## Configuración de Webhooks Reales

Para configurar webhooks reales en n8n:

1. Crear workflows en n8n para cada plan
2. Configurar webhooks POST en n8n
3. Actualizar variables de entorno en backend/.env
4. Reiniciar el servidor backend

El sistema está preparado para funcionar con webhooks reales de n8n, donde cada plan tiene su propio workflow con diferentes capacidades (Google Calendar, Drive, Gmail, etc.).
