# Notas de Seguridad - MyIA

## Cambios Implementados para Seguridad

### 1. Proxy de Chat Message (Backend Only)

**Problema:**
- Los webhooks de n8n estaban expuestos en el frontend
- La URL del webhook se mostraba en la consola del navegador
- CSP bloqueaba conexiones externas
- Cualquiera podía inspeccionar el código y obtener los webhooks

**Solución:**
- Creado endpoint `/api/myia/chat-message` en `backend/routes/myia.js`
- El frontend ahora se conecta al proxy del backend
- El backend obtiene la configuración del webhook desde variables de entorno
- Los webhooks nunca se exponen al frontend

**Fljo seguro:**
```
Frontend → /api/myia/chat-message → Backend → n8n Webhook
```

### 2. Content Security Policy (CSP)

**Problema:**
- CSP bloqueaba conexiones a n8n
- Error: "connect-src" directive violated

**Solución:**
- Agregado CSP header en el HTML generado
- Solo permite conexiones a:
  - `'self'` (mismo dominio)
  - `https://cdn.jsdelivr.net` (para marked.js)
  - `https://fonts.googleapis.com` (para fuentes)
- Bloquea todas las conexiones externas desconocidas

**CSP configurado:**
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://cdn.jsdelivr.net;">
```

### 3. Validación de Slug Único

**Problema:**
- No se validaba si el slug ya existía
- Posibles colisiones de URLs

**Solución:**
- Validación en `/api/myia/config` antes de guardar
- Verifica si el slug existe y si pertenece al mismo usuario
- Retorna error 400 si el slug ya está en uso

### 4. Error Handling Mejorado

**Problema:**
- `throw error` en renderizado podía crash el servidor

**Solución:**
- Cambiado a `return res.status(404)` manejado
- Todos los endpoints tienen try/catch apropiados
- Errores se loguean pero no exponen información sensible

## Variables de Entorno (Backend)

Los webhooks deben configurarse en `backend/.env`:

```env
WEBHOOK_RESPONDE=https://n8n.crysantem.tech/webhook/responde
WEBHOOK_ASISTE=https://n8n.crysantem.tech/webhook/asiste
WEBHOOK_AUTOMATIZA=https://n8n.crysantem.tech/webhook/automatiza
WEBHOOK_INTELLIGENCE=https://n8n.crysantem.tech/webhook/intelligence
```

**IMPORTANTE:**
- Nunca incluir webhooks en código frontend
- Nunca loguear webhooks en consola del navegador
- Usar siempre proxy del backend para conexiones externas

## Endpoints Seguros

### Público (sin autenticación)
- `GET /api/myia/render/:slug` - Renderizar página pública

### Requieren Autenticación (JWT)
- `POST /api/myia/config` - Guardar/actualizar configuración
- `GET /api/myia/user-apps/:userId` - Obtener apps del usuario
- `GET /api/myia/config-by-id/:id` - Obtener config por ID
- `DELETE /api/myia/delete/:id` - Eliminar página
- `POST /api/myia/chat-message` - Proxy de mensajes de chat

## Recomendaciones Adicionales

### Para Producción

1. **HTTPS obligatorio**
   - Usar certificados SSL/TLS
   - Forzar redirección HTTP → HTTPS

2. **Rate Limiting**
   - Implementar rate limiting en `/api/myia/chat-message`
   - Prevenir abuso del webhook

3. **Monitoreo**
   - Log de intentos fallidos
   - Alertas por uso anormal de webhooks

4. **Validación de Input**
   - Sanitizar todos los inputs del chat
   - Prevenir XSS en respuestas de IA

5. **Pagos**
   - Implementar pasarela de pago real (Stripe/PayPal)
   - Verificar pago antes de activar página
   - No permitir usar planes de pago sin verificación

### Actual

- No hay sistema de pagos implementado
- Cualquiera puede crear páginas con cualquier plan
- Esto es aceptable para pruebas/development
- NO aceptar para producción sin sistema de pagos
