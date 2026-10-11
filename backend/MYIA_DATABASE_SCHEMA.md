# Esquema de Base de Datos - MyIA

## Resumen de Arquitectura

MyIA es una plataforma unificada que combina:
- **SaaS de gestión** (panel de administración)
- **Landing pages orientadas al cliente final** (chatbots desplegados)

Ambas partes comparten la misma base de datos en Supabase y fluyen mediante n8n.

## Tablas Principales

### 1. `myia_users`
**Propósito**: Metadatos de usuario específicos para MyIA (scopes, plan seleccionado)

**Columnas**:
- `id` (UUID, PK) - Referencia a `users.id`
- `email` (TEXT) - Email del usuario
- `google_id` (TEXT) - ID de Google (opcional)
- `scopes` (TEXT[]) - Scopes de OAuth según el plan
- `selected_plan` (TEXT) - Plan seleccionado (responde, asiste, automatiza, intelligence)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**NOTA CRÍTICA**: `refresh_token` NO se almacena aquí. Se maneja en `user_google_tokens`.

### 2. `myia_page_config`
**Propósito**: Configuración de diseño y comportamiento de cada landing page

**Columnas**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → `users.id`)
- `business_name` (TEXT)
- `slug` (TEXT, UNIQUE) - URL personalizada (ej: "mi-negocio")
- `logo_url` (TEXT)
- `logo_size` (INTEGER)
- `background_type` (TEXT) - 'solid', 'gradient', 'glow'
- `background_color` (TEXT)
- `background_gradient` (TEXT)
- `glow_color` (TEXT)
- `font_family` (TEXT)
- `title_font` (TEXT)
- `chat_box_design` (TEXT) - 'classic', 'minimal', 'neon', 'glass'
- `chat_position` (TEXT) - 'left', 'right', 'center'
- `border_radius` (TEXT) - 'sharp', 'rounded', 'pill'
- `chat_box_color` (TEXT)
- `header_theme` (TEXT) - 'dark', 'light'
- `page_design` (TEXT) - 'design1', 'design2', etc.
- `show_footer` (BOOLEAN)
- `split_image` (TEXT)
- `split_text` (TEXT)
- `welcome_message` (TEXT)
- `system_prompt` (TEXT) - Prompt del agente IA
- `ai_model` (TEXT) - 'gemini-flash', 'gemini-pro'
- `character_limit` (INTEGER)
- `character_usage` (INTEGER)
- `plan` (TEXT) - Plan asociado a la página
- `social_links` (JSONB) - Links de redes sociales
- `integrations_config` (JSONB) - Configuración de integraciones (Sheets, Drive, Gmail, Calendar)
- `payment_plan` (TEXT) - Plan de pago seleccionado
- `payment_method` (TEXT) - Método de pago utilizado
- `google_connected` (BOOLEAN) - Indica si el usuario tiene OAuth de Google conectado
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 3. `user_google_tokens`
**Propósito**: Tokens de OAuth de Google (fuente única de verdad para refresh_token)

**Columnas**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → `users.id`)
- `access_token` (TEXT)
- `refresh_token` (TEXT) - **Fuente única de verdad**
- `email` (TEXT)
- `email_verified` (BOOLEAN)
- `verified_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 4. `users`
**Propósito**: Tabla base de usuarios (compartida con Crysantem)

**Columnas**:
- `id` (UUID, PK)
- `name` (TEXT)
- `email` (TEXT, UNIQUE)
- `password_hash` (TEXT)
- `auth_provider` (TEXT) - 'email', 'google'
- `email_verified` (BOOLEAN)
- `avatar_url` (TEXT)
- `created_at` (TIMESTAMP)

### 5. `user_message_limits`
**Propósito**: Límites de uso de mensajes por usuario

**Columnas**:
- `id` (UUID, PK)
- `email` (TEXT)
- `monthly_message_limit` (INTEGER)
- `messages_used` (INTEGER)
- `current_month` (INTEGER)
- `current_year` (INTEGER)
- `is_blocked` (BOOLEAN)

## Relaciones y Flujo de Datos

### Flujo de Autenticación

1. **Google OAuth**:
   - Usuario autentica con Google
   - `refresh_token` se guarda en `user_google_tokens`
   - Scopes según el plan se guardan en `myia_users.scopes`
   - Usuario se crea/actualiza en `users`

2. **Registro/Login por Email**:
   - Usuario se crea en `users`
   - Entrada en `myia_users` con scopes básicos
   - No hay tokens de Google

### Flujo de Chatbot

1. **Cliente envía mensaje**:
   - Frontend envía a `/api/myia/chat-message`
   - Payload: `{ message, pageId, userId, plan }`

2. **Backend procesa**:
   - Obtiene config de `myia_page_config` por `pageId`
   - Determina webhook según `plan` (desde variables de entorno)
   - Envía a n8n con `{ slug, chatInput }`

3. **n8n procesa**:
   - Lee `system_prompt` de `myia_page_config` usando el `slug`
   - Ejecuta acciones de Google (Calendar, Gmail, Sheets)
   - Usa `refresh_token` de `user_google_tokens` para renovar access tokens
   - Retorna respuesta al backend

## Reglas de Negocio

### Scopes por Plan

- **responde**: `['email', 'profile']`
- **asiste**: `['email', 'profile', 'https://www.googleapis.com/auth/spreadsheets']`
- **automatiza**: `['email', 'profile', 'https://www.googleapis.com/auth/calendar']`
- **intelligence**: `['email', 'profile', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/gmail.send']`

### Límites de Caracteres por Plan

- **responde**: 50,000 caracteres
- **asiste**: 100,000 caracteres
- **automatiza**: 500,000 caracteres
- **intelligence**: 2,000,000 caracteres

## Variables de Entorno Requeridas

```env
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Webhooks de n8n por plan
WEBHOOK_RESPONDE=
WEBHOOK_ASISTE=
WEBHOOK_AUTOMATIZA=
WEBHOOK_INTELLIGENCE=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# App
APP_URL=
```

## Puntos Críticos de Mantenimiento

### ✅ CORREGIDO
- Eliminados webhooks hardcodeados en `backend/routes/myia.js`
- Eliminada respuesta simulada hardcodeada
- Eliminado webhook de prueba temporal
- Unificada fuente de verdad para `refresh_token` (solo en `user_google_tokens`)

### ⚠️ ATENCIÓN
- Asegurar que las variables de entorno de webhooks estén configuradas
- Verificar que n8n use el `slug` para obtener el `system_prompt` correcto
- Validar que las acciones de Google usen el calendario activo del usuario logueado

## Índices de Base de Datos

- `idx_myia_page_config_plan` en `myia_page_config(plan)`
- `idx_myia_page_config_is_active` en `myia_page_config(is_active)`
- `idx_myia_page_config_integrations` en `myia_page_config(integrations_config)` (GIN index)
- `idx_myia_page_config_payment_plan` en `myia_page_config(payment_plan)`
- `idx_myia_page_config_google_connected` en `myia_page_config(google_connected)`
- Índice único en `myia_page_config(slug)`

## Nuevo Flujo de Configuración (V1.4)

El flujo de configuración de MyIA se ha reorganizado para separar mejor las responsabilidades:

### Plantilla de Google Sheets

El sistema proporciona una plantilla predefinida para la base de datos de clientes que incluye:

**Hoja 1: Base de Datos de Clientes**
- ID Cliente
- Nombre
- Email
- Teléfono
- Fecha Registro
- Último Contacto
- Estado
- Notas

**Hoja 2: Citas**
- ID Cita
- ID Cliente
- Fecha
- Hora
- Tipo Cita
- Estado
- Notas

**Hoja 3: Historial de Conversaciones**
- ID Mensaje
- ID Cliente
- Fecha
- Tipo (Usuario/IA)
- Mensaje
- Contexto

El usuario puede descargar esta plantilla como CSV, crear un Google Sheet basado en ella, y luego usar el Sheet ID en la configuración.

### Descripciones de Imágenes

Cada imagen cargada puede tener una descripción breve que la IA usará para:
- Identificar cuándo mostrar la imagen
- Contextualizar la imagen en la respuesta
- Combinar múltiples imágenes coherentemente

Las descripciones se guardan en `integrations_config.images.uploaded[].description`.

### Gmail con Campos Dinámicos de IA

La configuración de Gmail permite que la IA rellene campos dinámicos usando n8n:

**Opciones disponibles:**
- `aiSubject`: La IA genera el asunto según el contexto de la conversación
- `aiBody`: La IA rellena las variables {nombre}, {producto}, {fecha}, etc. en el cuerpo del correo
- `aiAttachments`: La IA decide cuándo adjuntar archivos basándose en el contexto

El workflow de n8n debe usar el nodo "Function" o "Code" para procesar las variables y generar el contenido dinámico antes de enviar el correo.

### Zona Horaria UTC

La zona horaria por defecto es UTC (Tiempo Universal Coordinado) para:
- Consistencia global entre diferentes regiones
- Simplificación de cálculos de citas
- Facilitar conversión a zonas horarias locales del usuario

El workflow de n8n debe convertir las horas UTC a la zona horaria local del cliente antes de mostrarlas o agendarlas.

### Detección de Conflictos en Google Calendar

La IA puede detectar automáticamente si hay conflictos de horarios cuando el usuario solicita una cita. El sistema:

1. **Consulta el calendario de Google** antes de confirmar una cita
2. **Verifica los horarios configurados** por día (cada día puede tener horarios independientes)
3. **Compara con eventos existentes** en el calendario
4. **Sugiere alternativas** si hay conflictos

### Estructura de Horarios por Día

Los horarios se guardan en `integrations_config.calendar.schedules` con el siguiente formato:

```json
{
  "schedules": {
    "Mon": { "enabled": true, "start": "09:00", "end": "18:00" },
    "Tue": { "enabled": true, "start": "09:00", "end": "18:00" },
    "Wed": { "enabled": true, "start": "09:00", "end": "18:00" },
    "Thu": { "enabled": true, "start": "09:00", "end": "18:00" },
    "Fri": { "enabled": true, "start": "09:00", "end": "18:00" },
    "Sat": { "enabled": false, "start": "09:00", "end": "14:00" },
    "Sun": { "enabled": false, "start": "09:00", "end": "14:00" }
  }
}
```

El workflow de n8n debe:
1. Leer esta configuración desde Supabase usando el slug
2. Convertir los horarios al formato de Google Calendar API
3. Verificar disponibilidad antes de crear eventos
4. Responder al usuario con sugerencias si hay conflictos

### Pasos del Flujo

1. **Selección de Plan** (`myia-plans.html`)
   - Usuario selecciona el plan (responde, asiste, automatiza, intelligence)
   - Se guarda en `localStorage.selectedPlan`

2. **Diseño Web** (`myia-dashboard.html`)
   - Configuración visual: logo, colores, tipografía, diseño de página
   - **NO incluye prompt del agente** (se movió a paso separado)
   - Se guarda en `localStorage.builderConfig`

3. **Configuración de Prompt** (`myia-prompt.html`)
   - Mensaje de bienvenida
   - System prompt (instrucciones del agente)
   - Se guarda en `localStorage.promptConfig`

4. **Integraciones según Plan** (`myia-integrations.html`)
   - Google Sheets (plan 02+)
   - Google Drive (plan 02+)
   - Imágenes markdown (plan 02+)
   - Gmail (plan 04)
   - Google Calendar (plan 03+)
   - Se guarda en `localStorage.integrationsConfig`

5. **Pago y OAuth** (`myia-payment.html`)
   - Método de pago
   - Conexión con Google OAuth
   - Refresh token se guarda en `user_google_tokens`
   - Se guarda en `localStorage.paymentConfig`

6. **Resumen y Creación** (`myia-summary.html`)
   - Fusiona todas las configuraciones
   - Muestra resumen completo
   - Guarda todo en `myia_page_config` en Supabase

### Cambios en Base de Datos

Nuevas columnas en `myia_page_config`:
- `integrations_config` (JSONB): Almacena configuración de Sheets, Drive, Gmail, Calendar
- `payment_plan` (TEXT): Plan de pago seleccionado
- `payment_method` (TEXT): Método de pago utilizado
- `google_connected` (BOOLEAN): Estado de conexión OAuth

### Migración Requerida

Ejecutar `backend/migrate_new_columns.sql` en Supabase SQL Editor para agregar las nuevas columnas.
