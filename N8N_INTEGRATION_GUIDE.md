# Guía de Integración n8n - Configuración Dinámica Multitenente

## 📋 Resumen de Cambios

Este documento describe cómo configurar los workflows de n8n para operar de forma 100% dinámica usando identificadores únicos por cliente (slug/site_id), eliminando todos los valores hardcodeados.

---

## 1. Payload Enviado por el Backend al Webhook de n8n

El endpoint `/api/myia/chat-message` ahora envía un payload completo con todas las configuraciones dinámicas:

```json
{
  "slug": "mi-negocio",
  "chatInput": "¿Cuál es tu horario?",
  "userId": "uuid-del-usuario",
  "sheets": {
    "database_url_get": "https://sheets.googleapis.com/v4/spreadsheets/ID/values/Hoja 1?valueRenderOption=FORMATTED_VALUE",
    "database_url_post": "https://sheets.googleapis.com/v4/spreadsheets/ID/values/Hoja 1:append?valueInputOption=USER_ENTERED",
    "custom_1_url_get": "https://sheets.googleapis.com/v4/spreadsheets/ID/Custom1?valueRenderOption=FORMATTED_VALUE",
    "custom_1_url_post": "https://sheets.googleapis.com/v4/spreadsheets/ID/Custom1:append?valueInputOption=USER_ENTERED",
    "custom_2_url_get": "https://sheets.googleapis.com/v4/spreadsheets/ID/Custom2?valueRenderOption=FORMATTED_VALUE",
    "custom_2_url_post": "https://sheets.googleapis.com/v4/spreadsheets/ID/Custom2:append?valueInputOption=USER_ENTERED"
  },
  "gmail_sender_email": "usuario@gmail.com",
  "plan": "asiste"
}
```

---

## 2. Mapeo de Variables en n8n

### 2.1. Nodo Webhook (Entrada)

**Configuración:**
- Método: POST
- Path: `/webhook/{slug}` (donde `{slug}` es el identificador único del plan)

**Variables disponibles en el nodo:**
```
{{ $json.slug }}                    // Identificador único de la página
{{ $json.chatInput }}               // Mensaje del usuario
{{ $json.userId }}                  // ID del usuario (para obtener tokens OAuth)
{{ $json.plan }}                    // Plan del usuario (responde, asiste, automatiza, intelligence)
```

### 2.2. Nodos HTTP Request para Google Sheets

#### Para LEER datos de la base de datos (GET):

**Configuración del nodo HTTP Request:**
- Method: GET
- URL: `{{ $json.sheets.database_url_get }}`
- Authentication: Generic Credential Type → Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer {{ $json.access_token }}`

**NOTA:** El `access_token` debe obtenerse llamando al endpoint `/api/myia/get-google-tokens` (ver sección 3).

#### Para ESCRIBIR datos en la base de datos (POST):

**Configuración del nodo HTTP Request:**
- Method: POST
- URL: `{{ $json.sheets.database_url_post }}`
- Authentication: Generic Credential Type → Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer {{ $json.access_token }}`
- Content Type: JSON
- Body:
```json
{
  "values": [
    ["Valor1", "Valor2", "Valor3"]
  ]
}
```

#### Para Custom Sheets (Plan 03+):

**Custom Sheet 1 - GET:**
- URL: `{{ $json.sheets.custom_1_url_get }}`
- Authentication: Header Auth con `Bearer {{ $json.access_token }}`

**Custom Sheet 1 - POST:**
- URL: `{{ $json.sheets.custom_1_url_post }}`
- Authentication: Header Auth con `Bearer {{ $json.access_token }}`

**Custom Sheet 2 - GET:**
- URL: `{{ $json.sheets.custom_2_url_get }}`
- Authentication: Header Auth con `Bearer {{ $json.access_token }}`

**Custom Sheet 2 - POST:**
- URL: `{{ $json.sheets.custom_2_url_post }}`
- Authentication: Header Auth con `Bearer {{ $json.access_token }}`

### 2.3. Nodos HTTP Request para Gmail

**Configuración del nodo HTTP Request:**
- Method: POST
- URL: `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
- Authentication: Generic Credential Type → Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer {{ $json.access_token }}`
- Content Type: `application/json` (NO usar multipart, usar raw)
- Body:
```json
{
  "raw": "{{ $json.base64_email }}"
}
```

**Sender Email Dinámico:**
```
{{ $json.gmail_sender_email }}
```

---

## 3. Endpoint para Obtener Tokens OAuth Frescos

El backend ahora tiene un endpoint protegido para que n8n obtenga tokens OAuth frescos por usuario:

### 3.1. Llamada al Endpoint desde n8n

**Configuración del nodo HTTP Request:**
- Method: POST
- URL: `https://crysantem.tech/api/myia/get-google-tokens`
- Content Type: JSON
- Body:
```json
{
  "userId": "{{ $('agente-workspace').first().json.userId }}"
}
```

**IMPORTANTE - Verificar la estructura del payload:**

El backend envía el payload directamente como JSON:
```json
{
  "slug": "mi-negocio",
  "chatInput": "Hola",
  "userId": "uuid-del-usuario",
  "system_prompt": "...",
  "business_name": "...",
  "sheets": { ... },
  "gmail_sender_email": "...",
  "plan": "asiste"
}
```

Sin embargo, dependiendo de la configuración del nodo Webhook en n8n, el payload puede estar anidado:

**Caso A: Webhook en modo "JSON" (default):**
```
{{ $('agente-workspace').first().json.userId }}
```

**Caso B: Webhook en modo "Raw Body" (anidado en body):**
```
{{ $('agente-workspace').first().json.body.userId }}
```

**Cómo verificar cuál usar:**
1. Ejecuta el workflow en modo test
2. Haz clic en el nodo "agente-workspace" (Webhook)
3. Mira el JSON output
4. Si `userId` está en la raíz del JSON → usa `.json.userId`
5. Si `userId` está dentro de un campo `body` → usa `.json.body.userId`

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "access_token": "ya29.a0AfH6SMB...",
    "email": "usuario@gmail.com",
    "expires_at": "2026-10-19T15:30:00.000Z"
  }
}
```

### 3.2. Flujo en n8n para Tokens OAuth

1. **Nodo Webhook** recibe el mensaje con `userId`
2. **Nodo HTTP Request** llama a `/api/myia/get-google-tokens` con el `userId`
3. **Nodo Function/Code** extrae el `access_token` de la respuesta
4. **Nodos HTTP Request** de Google usan el `access_token` en la cabecera `Authorization: Bearer`

**Expresión para extraer el token:**
```
{{ $json.data.access_token }}
```

---

## 4. Consulta a Supabase para Obtener System Prompt

### 4.1. Nodo Supabase en n8n

**Configuración:**
- Operation: Select
- Table: `myia_page_config`
- Filter: `slug` = `{{ $json.slug }}`

**Campos a seleccionar:**
- `system_prompt`
- `business_name`
- `plan`
- `integrations_config` (si necesitas configuraciones adicionales)

**Expresión para usar el system prompt:**
```
{{ $json[0].system_prompt }}
```

---

## 5. Configuración del Nodo Code para Gmail (Base64URL)

### 5.1. Formato MIME Estricto

**Código JavaScript para el nodo Code:**

```javascript
// Función para codificar email en Base64URL seguro
function toBase64Url(str) {
  return str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Función para crear el email en formato MIME
function createEmailMime(from, to, subject, body) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body
  ];
  
  return lines.join('\r\n');
}

// Variables del workflow (proviene de nodos anteriores)
const from = $json.gmail_sender_email || $('Webhook').first().json.gmail_sender_email;
const to = $json.recipient_email || 'cliente@ejemplo.com';
const subject = $json.subject || 'Asunto del correo';
const body = $json.body || 'Cuerpo del correo';

// Validar que no haya campos vacíos críticos
if (!from || !to || !subject) {
  throw new Error('Faltan campos requeridos: from, to, subject');
}

// Crear email en formato MIME
const emailMime = createEmailMime(from, to, subject, body);

// Codificar en Base64
const base64 = Buffer.from(emailMime, 'utf-8').toString('base64');

// Convertir a Base64URL
const base64Url = toBase64Url(base64);

// Retornar para el siguiente nodo
return {
  json: {
    base64_email: base64Url,
    from: from,
    to: to,
    subject: subject,
    body: body
  }
};
```

### 5.2. Validaciones de Seguridad

El código anterior incluye:
- ✅ Validación de campos vacíos
- ✅ Formato MIME estricto con `\r\n` (no `\n` simple)
- ✅ Conversión a Base64URL (reemplaza `+` por `-`, `/` por `_`, elimina `=`)
- ✅ Manejo de caracteres UTF-8

---

## 6. Blindaje de Nodos HTTP Request

### 6.1. Configuración de Headers Dinámicos

**Para todos los nodos HTTP Request a Google APIs:**

**Authentication:**
- Type: Generic Credential Type
- Credential Type: Header Auth
- Property Name: `Authorization`
- Property Value: `Bearer {{ $json.access_token }}`

**Headers adicionales:**
```
Content-Type: application/json
```

### 6.2. Manejo de Errores

**Configuración del nodo:**
- Continue On Fail: `true`
- Output Field: `error`

**Nodo IF para manejar errores:**
```
{{ $json.error ? true : false }}
```

**Rama TRUE (Error):**
- Log del error
- Retornar mensaje de error al usuario

**Rama FALSE (Éxito):**
- Continuar flujo normal

---

## 7. Estructura de Consultas en Supabase

### 7.1. Tabla `myia_page_config`

**Columnas críticas para n8n:**

```sql
-- Columnas ya existentes (no requieren migración)
id                 UUID PRIMARY KEY
user_id            UUID REFERENCES users(id)
slug               TEXT UNIQUE
system_prompt      TEXT
plan               TEXT
integrations_config JSONB

-- Columnas agregadas por migrate_add_sheet_gmail_columns.sql
sheets_database_url_get      TEXT
sheets_database_url_post     TEXT
sheets_custom_1_url_get      TEXT
sheets_custom_1_url_post     TEXT
sheets_custom_2_url_get      TEXT
sheets_custom_2_url_post     TEXT
gmail_sender_email           TEXT
```

### 7.2. Tabla `user_google_tokens`

**Columnas para OAuth:**

```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
access_token    TEXT
refresh_token   TEXT
email           TEXT
expires_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 7.3. Consulta para Obtener Configuración Completa

```sql
SELECT 
  id,
  user_id,
  slug,
  system_prompt,
  plan,
  sheets_database_url_get,
  sheets_database_url_post,
  sheets_custom_1_url_get,
  sheets_custom_1_url_post,
  sheets_custom_2_url_get,
  sheets_custom_2_url_post,
  gmail_sender_email,
  integrations_config
FROM myia_page_config
WHERE slug = '{{ slug }}';
```

---

## 8. Resumen de Expresiones de n8n

### Variables del Webhook:
```
{{ $json.slug }}                    // Identificador único
{{ $json.chatInput }}               // Mensaje del usuario
{{ $json.userId }}                  // ID del usuario
{{ $json.plan }}                    // Plan
{{ $json.sheets.database_url_get }} // URL GET base de datos
{{ $json.sheets.database_url_post }} // URL POST base de datos
{{ $json.sheets.custom_1_url_get }} // URL GET custom 1
{{ $json.sheets.custom_1_url_post }} // URL POST custom 1
{{ $json.sheets.custom_2_url_get }} // URL GET custom 2
{{ $json.sheets.custom_2_url_post }} // URL POST custom 2
{{ $json.gmail_sender_email }}      // Email sender Gmail
```

### Variables del Endpoint de Tokens:
```
{{ $json.data.access_token }}       // Token de acceso fresco
{{ $json.data.email }}              // Email del usuario
{{ $json.data.expires_at }}         // Fecha de expiración
```

### Variables de Supabase:
```
{{ $json[0].system_prompt }}         // System prompt del bot
{{ $json[0].business_name }}        // Nombre del negocio
{{ $json[0].plan }}                 // Plan
```

---

## 9. Checklist de Implementación

### Backend (Node.js/Express):
- [x] Modificar `/api/myia/chat-message` para enviar payload completo
- [x] Crear endpoint `/api/myia/get-google-tokens`
- [x] Agregar columnas de Sheets URLs y Gmail email al SELECT
- [ ] Verificar que las columnas existan en Supabase (ejecutar migración si no)

### n8n Workflows:
- [ ] Actualizar nodo Webhook para recibir nuevo payload
- [ ] Agregar nodo HTTP Request para llamar a `/api/myia/get-google-tokens`
- [ ] Reemplazar URLs hardcodeadas por expresiones dinámicas
- [ ] Configurar nodos HTTP Request con Header Auth dinámico
- [ ] Actualizar nodo Code de Gmail con el código de Base64URL seguro
- [ ] Agregar manejo de errores en nodos HTTP Request
- [ ] Probar con múltiples usuarios para validar multitenencia

### Supabase:
- [ ] Ejecutar `backend/migrate_add_sheet_gmail_columns.sql` si no se ha ejecutado
- [ ] Verificar que las columnas existan en `myia_page_config`
- [ ] Verificar que `user_google_tokens` tenga datos

---

## 10. Troubleshooting

### Error: "Tokens de Google no encontrados para este usuario"
- **Causa:** El usuario no ha conectado Google OAuth
- **Solución:** Verificar que el usuario haya pasado por el flujo de OAuth

### Error: "URL undefined en nodo HTTP Request"
- **Causa:** Las columnas de Sheets URLs están vacías en Supabase
- **Solución:** Verificar que el usuario haya configurado Sheets en el builder

### Error: "Invalid value for ByteString"
- **Causa:** Base64URL mal formado en Gmail
- **Solución:** Usar el código de nodo Code proporcionado en sección 5.1

### Error: "401 Unauthorized" en Google APIs
- **Causa:** Token expirado o inválido
- **Solución:** El endpoint `/api/myia/get-google-tokens` debería refrescarlo automáticamente

---

## 11. Variables de Entorno Requeridas

Asegúrate de que estas variables estén configuradas en el backend:

```env
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Webhooks de n8n por plan
WEBHOOK_RESPONDE=
WEBHOOK_ASISTE=
WEBHOOK_AUTOMATIZA=
WEBHOOK_INTELLIGENCE=

# Seguridad
N8N_WEBHOOK_SECRET=
```

---

## 12. Pruebas de Validación

### Test 1: Multitenencia de Sheets
1. Crear 2 páginas con diferentes Sheet IDs
2. Enviar mensaje a cada página
3. Verificar que cada una escribe en su Sheet correcto

### Test 2: Tokens OAuth por Usuario
1. Crear 2 usuarios con diferentes cuentas de Google
2. Enviar mensaje como cada usuario
3. Verificar que cada uno usa su propio token

### Test 3: Gmail Dinámico
1. Configurar diferentes emails sender por página
2. Enviar correos desde cada página
3. Verificar que cada correo sale del email correcto

---

## Conclusión

Con esta configuración, tu sistema n8n operará de forma 100% dinámica, eliminando todos los valores hardcodeados y permitiendo true multitenencia. Cada cliente tendrá sus propias configuraciones, URLs y tokens OAuth.
