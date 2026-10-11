# Esquema de Base de Datos - Supabase

Este documento explica todas las tablas de Supabase en el proyecto Crysantem MyIA. Este contexto es para que una IA pueda entender la estructura completa de la base de datos.

## Tablas Principales

### 1. `users`

**Propósito:** Almacena información de usuarios registrados en el sistema principal de Crysantem.

**Columnas:**
- `id` (UUID, Primary Key): Identificador único del usuario
- `name` (TEXT): Nombre completo del usuario
- `email` (TEXT, Unique): Email del usuario (usado para login)
- `password_hash` (TEXT): Hash de la contraseña (bcrypt)
- `auth_provider` (TEXT): Proveedor de autenticación ('email' o 'google')
- `email_verified` (BOOLEAN): Indica si el email está verificado
- `avatar_url` (TEXT): URL del avatar del usuario
- `created_at` (TIMESTAMP): Fecha de creación del registro
- `updated_at` (TIMESTAMP): Fecha de última actualización

**Relaciones:**
- Uno a muchos con `myia_page_config` (a través de `user_id`)
- Uno a uno con `myia_users` (mismo `id`)
- Uno a muchos con `user_google_tokens` (a través de `user_id`)

---

### 2. `myia_users`

**Propósito:** Tabla específica para usuarios de MyIA. Extiende la información de usuarios principales con datos específicos de MyIA.

**Columnas:**
- `id` (UUID, Primary Key): ID del usuario (mismo que `users.id`)
- `email` (TEXT): Email del usuario
- `google_id` (TEXT): ID de Google OAuth (si autenticó con Google)
- `refresh_token` (TEXT): Token de refresco de Google OAuth para offline access
- `scopes` (ARRAY/TEXT): Permisos OAuth otorgados por el usuario
  - Ejemplo: `['email', 'profile', 'https://www.googleapis.com/auth/calendar']`
- `selected_plan` (TEXT): Plan seleccionado por el usuario
  - Valores: 'responde', 'asiste', 'automatiza', 'intelligence'
- `created_at` (TIMESTAMP): Fecha de creación
- `updated_at` (TIMESTAMP): Fecha de última actualización

**Relaciones:**
- Uno a uno con `users` (mismo `id`)
- Uno a muchos con `myia_page_config` (a través de `id` como `user_id`)

**Notas:**
- Esta tabla se crea automáticamente cuando un usuario se registra o autentica con Google OAuth
- El `refresh_token` es crítico para mantener acceso offline a Google APIs
- Los `scopes` determinan qué APIs de Google puede usar el usuario según su plan

---

### 3. `myia_page_config`

**Propósito:** Almacena la configuración completa de cada página de agente IA creada por los usuarios.

**Columnas:**
- `id` (UUID, Primary Key): Identificador único de la página
- `user_id` (UUID, Foreign Key): ID del usuario dueño de la página (referencia a `users.id`)
- `business_name` (TEXT): Nombre del negocio/página
- `slug` (TEXT, Unique): URL personalizada de la página
  - Ejemplo: "mi-negocio" → URL: crysantem.tech/mi-negocio
  - Debe ser único en toda la base de datos
- `logo_url` (TEXT): URL del logo del negocio
- `logo_size` (INTEGER): Tamaño del logo en pixeles (default: 100)
- `background_type` (TEXT): Tipo de fondo
  - Valores: 'solid', 'gradient', 'glow'
- `background_color` (TEXT): Color hexadecimal del fondo
  - Ejemplo: '#050505'
- `background_gradient` (TEXT): Color secundario para gradientes
  - Ejemplo: '#00ff8c'
- `glow_color` (TEXT): Color del efecto glow
  - Ejemplo: '#00ff8c'
- `font_family` (TEXT): Fuente principal
  - Ejemplo: 'Inter', 'Roboto', 'Open Sans'
- `title_font` (TEXT): Fuente para títulos (si es diferente a la principal)
- `chat_box_design` (TEXT): Diseño del chat
  - Valores: 'modern', 'classic', 'minimal', 'neon', 'glass'
- `chat_position` (TEXT): Posición del chat
  - Valores: 'left', 'right', 'center'
- `border_radius` (TEXT): Radio de bordes
  - Valores: 'sharp', 'rounded', 'pill'
- `chat_box_color` (TEXT): Color del chat
  - Ejemplo: '#00ff8c'
- `header_theme` (TEXT): Tema del header
  - Valores: 'dark', 'light'
- `page_design` (TEXT): Diseño de la página
  - Valores: 'centered', 'split', 'full'
- `show_footer` (BOOLEAN): Si mostrar el footer
- `split_image` (TEXT): URL de imagen para diseño split
- `split_text` (TEXT): Texto descriptivo para diseño split
- `welcome_message` (TEXT): Mensaje de bienvenida del chat
  - Ejemplo: "Hola, ¿en qué puedo ayudarte?"
- `system_prompt` (TEXT): Prompt del sistema para n8n
  - Este prompt define la personalidad y comportamiento del agente IA
  - Se envía al webhook de n8n con cada mensaje
- `ai_model` (TEXT): Modelo de IA a usar
  - Valores: 'gemini-flash', 'gemini-pro'
- `character_limit` (INTEGER): Límite de caracteres por mes
  - Valores: 50000, 100000, 500000, 2000000
- `plan` (TEXT): Plan suscrito
  - Valores: 'responde', 'asiste', 'automatiza', 'intelligence'
- `social_links` (JSONB): Links de redes sociales
  - Ejemplo: `{"facebook": "url", "instagram": "url", "linkedin": "url", "twitter": "url"}`
- `is_active` (BOOLEAN): Si la página está activa y accesible públicamente
- `created_at` (TIMESTAMP): Fecha de creación
- `updated_at` (TIMESTAMP): Fecha de última actualización

**Relaciones:**
- Muchos a uno con `users` (a través de `user_id`)
- Muchos a uno con `myia_users` (a través de `user_id` como `id`)

**Notas:**
- El `slug` debe ser único para evitar conflictos de URLs
- El `system_prompt` es crítico para el comportamiento del agente IA
- El `plan` determina qué webhook de n8n se usa y qué límites aplica
- `is_active` permite desactivar páginas sin eliminarlas

---

### 4. `user_google_tokens`

**Propósito:** Almacena tokens de OAuth de Google para mantener sesiones activas y acceso offline.

**Columnas:**
- `user_id` (UUID, Foreign Key): ID del usuario (referencia a `users.id`)
- `access_token` (TEXT): Token de acceso actual de Google
  - Usado para hacer requests a Google APIs
  - Expira en ~1 hora
- `refresh_token` (TEXT): Token de refresco de Google
  - Usado para obtener nuevos access tokens
  - No expira (a menos que sea revocado)
- `email` (TEXT): Email asociado a la cuenta de Google
- `email_verified` (BOOLEAN): Si el email está verificado por Google
- `verified_at` (TIMESTAMP): Fecha de verificación del email
- `expires_at` (TIMESTAMP): Fecha de expiración del access_token
- `created_at` (TIMESTAMP): Fecha de creación del registro
- `updated_at` (TIMESTAMP): Fecha de última actualización

**Relaciones:**
- Muchos a uno con `users` (a través de `user_id`)

**Notas:**
- Esta tabla se actualiza cada vez que el usuario se autentica con Google
- El `refresh_token` solo se obtiene si el usuario autoriza con `access_type=offline` y `prompt=consent`
- Los tokens deben ser rotados antes de expirar (usando `refresh_token`)

---

### 5. `user_token_limits`

**Propósito:** Controla el uso de tokens/characters de IA por usuario y mes.

**Columnas:**
- `email` (TEXT, Primary Key): Email del usuario
- `monthly_limit` (INTEGER): Límite mensual de caracteres
  - Responde: 50,000
  - Asiste: 100,000
  - Automatiza: 500,000
  - Intelligence: 2,000,000
- `tokens_used` (INTEGER): Caracteres usados en el mes actual
- `current_month` (INTEGER): Mes actual (1-12)
- `current_year` (INTEGER): Año actual
- `is_blocked` (BOOLEAN): Si el usuario está bloqueado por exceder límite
- `created_at` (TIMESTAMP): Fecha de creación
- `updated_at` (TIMESTAMP): Fecha de última actualización

**Relaciones:**
- Relación lógica con `users` (a través de `email`)

**Notas:**
- Esta tabla se resetea cada mes
- Cuando `tokens_used` >= `monthly_limit`, se puede bloquear al usuario
- El sistema debe verificar `is_blocked` antes de procesar mensajes

---

## Flujo de Datos entre Tablas

### Registro de Usuario con Email:
1. Se crea registro en `users`
2. Se crea registro en `myia_users` (con scopes básicos)
3. Se crea registro en `user_token_limits` (con límite default)

### Registro/Autenticación con Google OAuth:
1. Se crea o actualiza registro en `users`
2. Se crea o actualiza registro en `myia_users` (con google_id y refresh_token)
3. Se crea o actualiza registro en `user_google_tokens` (con access_token y refresh_token)
4. Si es primera vez, se crea registro en `user_token_limits`

### Creación de Página MyIA:
1. Usuario configura página en el builder
2. Se crea registro en `myia_page_config` con toda la configuración
3. El `user_id` referencia al usuario dueño
4. El `plan` determina el webhook a usar y límites

### Procesamiento de Mensaje de Chat:
1. Usuario envía mensaje en su página
2. Backend busca config en `myia_page_config` por slug
3. Backend verifica límites en `user_token_limits`
4. Backend envía mensaje al webhook de n8n según el `plan`
5. Backend actualiza `tokens_used` en `user_token_limits`

---

## Reglas de Negocio

### Slug Único
- El `slug` en `myia_page_config` debe ser único
- No puede haber dos páginas con el mismo slug
- Se valida antes de insertar o actualizar

### Planes y Límites
| Plan | Límite Caracteres | Webhook | Scopes |
|------|-------------------|---------|--------|
| responde | 50,000 | /webhook/responde | email, profile |
| asiste | 100,000 | /webhook/asiste | email, profile, Drive |
| automatiza | 500,000 | /webhook/automatiza | email, profile, Calendar |
| intelligence | 2,000,000 | /webhook/intelligence | email, profile, Calendar, Drive, Gmail |

### Estado de Página
- `is_active = true`: Página accesible públicamente
- `is_active = false`: Página no se renderiza (404)
- Para eliminar: se debe borrar el registro completamente

### Tokens de Google
- Solo se obtiene `refresh_token` si el usuario autoriza con `access_type=offline`
- Si no hay `refresh_token`, no se puede acceder a Google APIs offline
- El `refresh_token` se guarda tanto en `myia_users` como en `user_google_tokens`

---

## Consultas Comunes

### Obtener todas las páginas de un usuario:
```sql
SELECT * FROM myia_page_config
WHERE user_id = 'user-uuid'
AND is_active = true
ORDER BY created_at DESC;
```

### Obtener configuración de una página por slug:
```sql
SELECT * FROM myia_page_config
WHERE slug = 'mi-slug'
AND is_active = true;
```

### Verificar límites de usuario:
```sql
SELECT * FROM user_token_limits
WHERE email = 'user@email.com'
AND current_month = EXTRACT(MONTH FROM CURRENT_DATE)
AND current_year = EXTRACT(YEAR FROM CURRENT_DATE);
```

### Obtener refresh_token de Google de un usuario:
```sql
SELECT refresh_token FROM myia_users
WHERE id = 'user-uuid';
```

---

## Índices Recomendados

```sql
-- Para búsquedas rápidas por slug
CREATE INDEX idx_myia_page_config_slug ON myia_page_config(slug);

-- Para obtener páginas de usuario
CREATE INDEX idx_myia_page_config_user_id ON myia_page_config(user_id);

-- Para páginas activas
CREATE INDEX idx_myia_page_config_is_active ON myia_page_config(is_active);

-- Para tokens de usuario
CREATE INDEX idx_user_google_tokens_user_id ON user_google_tokens(user_id);

-- Para límites de tokens por mes
CREATE INDEX idx_user_token_limits_email_month ON user_token_limits(email, current_month, current_year);
```

---

## Seguridad

### Datos Sensibles
- `password_hash` en `users`: Hash bcrypt (no reversibles)
- `refresh_token` en `myia_users` y `user_google_tokens`: Tokens OAuth (tratar como secretos)
- `access_token` en `user_google_tokens`: Tokens temporales (expiran)

### Permisos
- Solo el usuario dueño (`user_id`) puede modificar sus páginas
- Las páginas públicas solo requieren conocer el `slug`
- Los tokens de Google solo deben ser accesibles por el usuario dueño

### Políticas RLS (Row Level Security)
- Recomendado habilitar RLS en Supabase
- `myia_page_config`: Solo lectura para público, RW para dueño
- `myia_users`: Solo RW para usuario dueño
- `user_google_tokens`: Solo RW para usuario dueño
