# Resumen de Correcciones - Endpoint /api/myia/get-google-tokens

## 📋 Problemas Identificados

### Problema 1: Backend respondía HTML en lugar de JSON
- **Causa:** Cuando recibía un `userId` vacío o inválido, el endpoint podía lanzar una excepción no controlada
- **Consecuencia:** n8n recibía HTML en lugar de JSON, causando errores al intentar leer `.access_token`

### Problema 2: Expresión incorrecta en n8n
- **Causa:** La expresión `{{ $('agente-workspace').first().json.userId }}` podría no funcionar según la configuración del webhook
- **Consecuencia:** El nodo `Get Google Token` enviaba `userId` vacío al backend

---

## ✅ Soluciones Implementadas

### 1. Mejoras en el Backend (`backend/routes/myia.js`)

#### Validación mejorada de userId:
```javascript
if (!userId || userId === '' || userId === null || userId === undefined) {
  console.error('N8N Token Request: userId inválido o vacío');
  return res.status(400).json({
    success: false,
    error: 'userId es requerido y no puede estar vacío',
    code: 'INVALID_USER_ID'
  });
}
```

#### Manejo de errores de Supabase:
```javascript
if (tokensError) {
  console.error('Error al obtener tokens de Google:', tokensError);
  if (tokensError.code === 'PGRST116') {
    // No se encontró registro
    return res.status(404).json({
      success: false,
      error: 'Tokens de Google no encontrados para este usuario',
      code: 'TOKENS_NOT_FOUND',
      details: 'El usuario no ha conectado Google OAuth'
    });
  }
  // Otro error de Supabase
  return res.status(500).json({
    success: false,
    error: 'Error al consultar la base de datos',
    code: 'DATABASE_ERROR',
    details: tokensError.message
  });
}
```

#### Manejo de errores generales:
```javascript
catch (error) {
  console.error('Error en get-google-tokens:', error);
  // Asegurar que siempre retornamos JSON, nunca HTML
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor al obtener tokens',
    code: 'INTERNAL_ERROR',
    details: error.message
  });
}
```

### 2. Documentación actualizada (`N8N_INTEGRATION_GUIDE.md`)

#### Expresión para userId con verificación de estructura:

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

---

## 🎯 Respuestas JSON del Endpoint

### Caso de éxito (200 OK):
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

### Caso: userId inválido (400 Bad Request):
```json
{
  "success": false,
  "error": "userId es requerido y no puede estar vacío",
  "code": "INVALID_USER_ID"
}
```

### Caso: Tokens no encontrados (404 Not Found):
```json
{
  "success": false,
  "error": "Tokens de Google no encontrados para este usuario",
  "code": "TOKENS_NOT_FOUND",
  "details": "El usuario no ha conectado Google OAuth"
}
```

### Caso: Error de base de datos (500 Internal Server Error):
```json
{
  "success": false,
  "error": "Error al consultar la base de datos",
  "code": "DATABASE_ERROR",
  "details": "..."
}
```

### Caso: Error interno (500 Internal Server Error):
```json
{
  "success": false,
  "error": "Error interno del servidor al obtener tokens",
  "code": "INTERNAL_ERROR",
  "details": "..."
}
```

---

## 🔧 Configuración del Nodo en n8n

### Nodo "Get Google Token" (HTTP Request):

**Method:** POST
**URL:** `https://crysantem.tech/api/myia/get-google-tokens`
**Authentication:** None
**Content Type:** JSON
**Body:**
```json
{
  "userId": "{{ $('agente-workspace').first().json.userId }}"
}
```

*(O `.json.body.userId` según la configuración de tu webhook)*

### Nodos posteriores (Calendar, Gmail, Sheets):

**Header Authorization:**
```
Authorization: Bearer {{ $('Get Google Token').first().json.data.access_token }}
```

---

## ✅ Checklist de Verificación

### Backend:
- [x] Validación mejorada de userId (no acepta vacío, null, undefined)
- [x] Manejo de errores de Supabase con códigos específicos
- [x] Siempre retorna JSON (nunca HTML)
- [x] Logs detallados para debugging
- [x] Servidor reiniciado con cambios

### n8n:
- [ ] Verificar la estructura del JSON en el nodo webhook
- [ ] Usar la expresión correcta para userId (`.json.userId` o `.json.body.userId`)
- [ ] Configurar header Authorization en todos los nodos de Google
- [ ] Probar el workflow en modo test
- [ ] Verificar que el endpoint retorne JSON válido

---

## 🧪 Pruebas de Validación

### Test 1: userId vacío
**Request:**
```json
{
  "userId": ""
}
```
**Expected Response:**
```json
{
  "success": false,
  "error": "userId es requerido y no puede estar vacío",
  "code": "INVALID_USER_ID"
}
```

### Test 2: userId no existe
**Request:**
```json
{
  "userId": "00000000-0000-0000-0000-000000000000"
}
```
**Expected Response:**
```json
{
  "success": false,
  "error": "Tokens de Google no encontrados para este usuario",
  "code": "TOKENS_NOT_FOUND"
}
```

### Test 3: userId válido
**Request:**
```json
{
  "userId": "uuid-valido-de-usuario"
}
```
**Expected Response:**
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

---

## 📝 Logs del Backend

Cuando el endpoint recibe una solicitud, verás logs como:

```
=== N8N REQUEST: GET GOOGLE TOKENS ===
User ID: uuid-del-usuario
```

Si hay error:
```
N8N Token Request: userId inválido o vacío
Error al obtener tokens de Google: { ... }
```

Si el token se refresca:
```
Token expirado o cerca de expirar, refrescando...
Token refrescado exitosamente
Tokens enviados a n8n para user: uuid-del-usuario
```

---

## 🎯 Conclusión

El endpoint ahora:
- ✅ Siempre retorna JSON (nunca HTML)
- ✅ Valida userId de forma estricta
- ✅ Maneja errores de Supabase con códigos específicos
- ✅ Proporciona mensajes de error claros para debugging
- ✅ Refresca tokens automáticamente cuando es necesario

n8n ahora recibirá respuestas JSON predecibles en todos los casos, facilitando el manejo de errores y la depuración.
