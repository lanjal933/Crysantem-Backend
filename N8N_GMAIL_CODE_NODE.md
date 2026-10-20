# Configuración del Nodo Code de n8n para Gmail (Base64URL Seguro)

## 📋 Resumen

Este documento describe la configuración exacta del nodo Code en n8n para generar correos electrónicos en formato MIME y codificarlos en Base64URL para la API de Gmail.

---

## 1. Problema con el Método Actual

### ❌ Errores Comunes

1. **Uso de `\n` en lugar de `\r\n`**: Gmail requiere terminadores de línea estilo Windows (`\r\n`)
2. **Base64 sin conversión a Base64URL**: La API de Gmail espera Base64URL, no Base64 estándar
3. **Campos vacíos sin validación**: Causa errores tipo `undefined` o `null`
4. **Codificación UTF-8 incorrecta**: Caracteres especiales se corrompen

---

## 2. Código JavaScript para el Nodo Code

### 2.1. Código Completo (Copiar y Pegar)

```javascript
// ============================================
// FUNCIÓN 1: Convertir a Base64URL
// ============================================
function toBase64Url(str) {
  return str
    .replace(/\+/g, '-')    // Reemplazar + por -
    .replace(/\//g, '_')    // Reemplazar / por _
    .replace(/=+$/, '');    // Eliminar padding = al final
}

// ============================================
// FUNCIÓN 2: Crear Email en Formato MIME
// ============================================
function createEmailMime(from, to, subject, body) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',                      // Línea vacía obligatoria entre headers y body
    body
  ];
  
  // CRÍTICO: Usar \r\n (CRLF) no \n (LF)
  return lines.join('\r\n');
}

// ============================================
// FUNCIÓN 3: Validar Campos
// ============================================
function validateFields(from, to, subject, body) {
  const errors = [];
  
  if (!from || from.trim() === '') {
    errors.push('from (email remitente)');
  }
  if (!to || to.trim() === '') {
    errors.push('to (email destinatario)');
  }
  if (!subject || subject.trim() === '') {
    errors.push('subject (asunto)');
  }
  if (!body || body.trim() === '') {
    errors.push('body (cuerpo del correo)');
  }
  
  return errors;
}

// ============================================
// OBTENER VARIABLES DEL WORKFLOW
// ============================================

// Opción A: Desde el nodo Webhook inicial
const webhookData = $('Webhook').first().json;
const from = webhookData.gmail_sender_email || $('Gmail Config').first().json.from;
const to = $('Recipient Email').first().json.email || 'cliente@ejemplo.com';
const subject = $('Subject').first().json.subject || 'Asunto del correo';
const body = $('Body').first().json.body || 'Cuerpo del correo';

// Opción B: Desde un nodo anterior (descomentar si prefieres esta opción)
// const from = $json.gmail_sender_email;
// const to = $json.recipient_email;
// const subject = $json.subject;
// const body = $json.body;

// ============================================
// VALIDAR CAMPOS
// ============================================

const validationErrors = validateFields(from, to, subject, body);

if (validationErrors.length > 0) {
  throw new Error(`Faltan campos requeridos: ${validationErrors.join(', ')}`);
}

// ============================================
// CREAR EMAIL EN FORMATO MIME
// ============================================

const emailMime = createEmailMime(from, to, subject, body);

// ============================================
// CODIFICAR EN BASE64
// ============================================

// Usar Buffer para soporte UTF-8 correcto
const base64 = Buffer.from(emailMime, 'utf-8').toString('base64');

// ============================================
// CONVERTIR A BASE64URL
// ============================================

const base64Url = toBase64Url(base64);

// ============================================
// RETORNAR RESULTADO
// ============================================

return {
  json: {
    base64_email: base64Url,
    from: from,
    to: to,
    subject: subject,
    body: body,
    email_mime: emailMime  // Opcional: para debugging
  }
};
```

---

## 3. Configuración del Nodo en n8n

### 3.1. Configuración Básica

**Tipo de nodo:** Code (JavaScript)

**Modo:** Run Once for All Items

**Language:** JavaScript

### 3.2. Campos de Entrada

El nodo espera que los siguientes campos estén disponibles desde nodos anteriores:

| Campo | Fuente | Descripción |
|-------|--------|-------------|
| `from` | Webhook / Gmail Config | Email del remitente (dinámico por página) |
| `to` | Recipient Email | Email del destinatario |
| `subject` | Subject | Asunto del correo |
| `body` | Body | Cuerpo del correo |

### 3.3. Campos de Salida

El nodo retorna:

```json
{
  "base64_email": "ya29.a0AfH6SMB...",
  "from": "usuario@gmail.com",
  "to": "cliente@ejemplo.com",
  "subject": "Asunto del correo",
  "body": "Cuerpo del correo",
  "email_mime": "From: usuario@gmail.com\r\nTo: cliente@ejemplo.com..."
}
```

---

## 4. Conexión con Nodos Posteriores

### 4.1. Nodo HTTP Request para Gmail

**Configuración:**

- **Method:** POST
- **URL:** `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
- **Authentication:** Generic Credential Type → Header Auth
- **Header Name:** `Authorization`
- **Header Value:** `Bearer {{ $json.access_token }}`
- **Content Type:** `application/json`
- **Body:**
```json
{
  "raw": "{{ $json.base64_email }}"
}
```

**Nota:** El `access_token` debe obtenerse del endpoint `/api/myia/get-google-tokens` (ver `N8N_INTEGRATION_GUIDE.md` sección 3).

---

## 5. Ejemplo de Flujo Completo

```
1. Webhook (recibe slug, chatInput, userId, gmail_sender_email)
   ↓
2. HTTP Request → /api/myia/get-google-tokens (obtiene access_token)
   ↓
3. Code Node (Gmail) → Genera base64_email
   ↓
4. HTTP Request → Gmail API (envía correo)
```

---

## 6. Manejo de Errores

### 6.1. Validación de Campos

El código incluye validación de campos obligatorios. Si falta alguno, lanzará un error:

```
Error: Faltan campos requeridos: from, to, subject
```

### 6.2. Configuración del Nodo para Manejar Errores

**En el nodo Code:**
- Continue On Fail: `false` (para detener el flujo si hay error)

**En el nodo HTTP Request posterior:**
- Continue On Fail: `true`
- Output Field: `error`

**Nodo IF después del HTTP Request:**
```
{{ $json.error ? true : false }}
```

**Rama TRUE (Error):**
- Log del error
- Retornar mensaje de error al usuario

**Rama FALSE (Éxito):**
- Continuar flujo normal

---

## 7. Casos de Uso Avanzados

### 7.1. Email con HTML

Para enviar emails con HTML en lugar de texto plano:

```javascript
function createEmailMimeHtml(from, to, subject, htmlBody) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    htmlBody
  ];
  
  return lines.join('\r\n');
}

// Usar en lugar de createEmailMime
const emailMime = createEmailMimeHtml(from, to, subject, body);
```

### 7.2. Email con Adjuntos

Para enviar emails con adjuntos (multipart/mixed):

```javascript
function createEmailMimeWithAttachment(from, to, subject, body, attachmentData, attachmentName) {
  const boundary = 'boundary_' + Math.random().toString(36).substr(2);
  
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    'MIME-Version: 1.0',
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
    '',
    `--${boundary}`,
    `Content-Type: application/octet-stream; name="${attachmentName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${attachmentName}"`,
    '',
    attachmentData,
    '',
    `--${boundary}--`
  ];
  
  return lines.join('\r\n');
}
```

### 7.3. Email con CC y BCC

```javascript
function createEmailMimeWithCcBcc(from, to, cc, bcc, subject, body) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : '',
    bcc ? `Bcc: ${bcc}` : '',
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body
  ];
  
  // Filtrar líneas vacías antes de unir
  return lines.filter(line => line !== '').join('\r\n');
}
```

---

## 8. Debugging

### 8.1. Verificar el Email MIME

El código retorna `email_mime` en el resultado. Puedes verlo en el output del nodo para verificar el formato:

```
From: usuario@gmail.com
To: cliente@ejemplo.com
Subject: Asunto del correo
Content-Type: text/plain; charset=utf-8
MIME-Version: 1.0

Cuerpo del correo
```

### 8.2. Verificar Base64URL

El `base64_email` debería tener el formato:
- Sin `+` (reemplazado por `-`)
- Sin `/` (reemplazado por `_`)
- Sin `=` al final (padding eliminado)

Ejemplo: `ya29.a0AfH6SMB...` (sin `+`, `/`, o `=`)

---

## 9. Troubleshooting

### Error: "Invalid value for ByteString"

**Causa:** Base64 mal formado o no convertido a Base64URL

**Solución:** 
- Verificar que la función `toBase64Url` se esté ejecutando
- Verificar que no haya caracteres `+`, `/`, o `=` en el resultado

### Error: "Malformed MIME message"

**Causa:** Formato MIME incorrecto (probablemente usando `\n` en lugar de `\r\n`)

**Solución:**
- Verificar que `createEmailMime` use `\r\n` para unir líneas
- Verificar que haya una línea vacía entre headers y body

### Error: "Faltan campos requeridos"

**Causa:** Campos vacíos o undefined

**Solución:**
- Verificar que los nodos anteriores estén retornando los campos correctos
- Verificar que las expresiones de n8n sean correctas

### Error: "400 Bad Request" de Gmail API

**Causa:** Payload mal formado

**Solución:**
- Verificar que el nodo HTTP Request envíe:
  ```json
  {
    "raw": "{{ $json.base64_email }}"
  }
  ```
- Verificar que el Content-Type sea `application/json`

---

## 10. Checklist de Implementación

- [ ] Copiar el código JavaScript al nodo Code
- [ ] Configurar nodos anteriores para proveer `from`, `to`, `subject`, `body`
- [ ] Configurar nodo HTTP Request posterior para Gmail API
- [ ] Configurar Header Auth con `Bearer {{ $json.access_token }}`
- [ ] Probar con un email simple
- [ ] Verificar el output del nodo Code para validar formato MIME
- [ ] Probar con caracteres especiales (ñ, tildes, emojis)
- [ ] Configurar manejo de errores
- [ ] Probar con múltiples usuarios (multitenencia)

---

## 11. Referencias

- [Gmail API Documentation - Send](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/send)
- [RFC 5322 - Internet Message Format](https://tools.ietf.org/html/rfc5322)
- [RFC 4648 - Base64 Encoding](https://tools.ietf.org/html/rfc4648#section-5)

---

## Conclusión

Este código garantiza que los emails se generen en el formato correcto para la API de Gmail, evitando errores comunes de codificación y formato. Usa validaciones estrictas para asegurar que todos los campos requeridos estén presentes antes de proceder.
