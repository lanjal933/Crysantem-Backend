# Sistema de Pagos Mercado Pago + Afiliados Tapfiliate

## Resumen

Este documento describe la implementación completa del sistema de **suscripciones mensuales** con Mercado Pago y el sistema de afiliados con Tapfiliate en Crysantem V1.4.

## Credenciales de Prueba (Sandbox)

```bash
MP_ACCESS_TOKEN=APP_USR-79101106596746-100716-e9fc1cd9c593bfb45ad7b4c0187e9b6a-3748150604
MP_PUBLIC_KEY=APP_USR-b3d4a2bf-6595-47b7-9926-07649bb6ae0f
```

## Configuración de Variables de Entorno

Agregar al archivo `.env` del backend:

```bash
# === MERCADO PAGO ===
MP_ACCESS_TOKEN=tu-access-token-de-produccion
MP_PUBLIC_KEY=tu-public-key
MP_WEBHOOK_SECRET=tu-secreto-para-validar-webhooks

# === TAPFILIATE (Sistema de Afiliados) ===
TAPFILIATE_API_KEY=tu-api-key-de-tapfiliate
```

## Configuración del Webhook de Mercado Pago

### Paso 1: Configurar el Webhook URL en Mercado Pago

1. Inicia sesión en [Mercado Pago Developers](https://developers.mercadopago.com/)
2. Ve a tu aplicación/sandbox
3. Configura el webhook URL:

**Para Producción:**
```
https://crysantem.tech/api/myia/mercadopago-webhook
```

**Para Desarrollo (localhost):**
```
Usa ngrok o similar para crear un tunnel público
Ejemplo: https://tu-ngrok-url.ngrok-free.app/api/myia/mercadopago-webhook
```

### Paso 2: Configurar los eventos a recibir

Selecciona los siguientes eventos:
- `preapproval` - Eventos de suscripción (created, updated, cancelled)
- `payment` - Eventos de pago (opcional, para pagos únicos)

### Paso 3: Verificar la configuración

Después de configurar el webhook, Mercado Pago enviará un ping de verificación. El endpoint ya está preparado para responder con status 200.

## Flujo del Sistema (Suscripciones)

### 1. Captura del Click ID (Tapfiliate)

**Frontend (index.html):**
- El script de Tapfiliate se carga automáticamente
- Cuando un usuario ingresa mediante un enlace de afiliado, Tapfiliate guarda el `click_id` en cookies
- El `click_id` se puede recuperar con `tap.getClickId()` o leyendo las cookies

**Implementación en myia-payment-simple.js:**
```javascript
function getTapfiliateClickId() {
  try {
    if (typeof tap !== 'undefined' && tap.getClickId) {
      return tap.getClickId();
    }
    // Método alternativo: buscar en cookies
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'tap_click_id' || name === 'tapfiliate_click_id') {
        return value;
      }
    }
    return null;
  } catch (error) {
    console.error('Error al obtener click_id:', error);
    return null;
  }
}
```

### 2. Creación de Suscripción

**Endpoint:** `POST /api/myia/create-subscription`

**Body:**
```json
{
  "plan": "responde",
  "pageId": "uuid-de-la-pagina",
  "userId": "usuario-id",
  "payerEmail": "email@usuario.com",
  "clickId": "click-id-de-tapfiliate"
}
```

**El click_id se guarda en:**
- `metadata.clickId` - Para que Mercado Pago lo mantenga asociado
- `metadata.is_subscription: true` - Para identificar que es suscripción

**La suscripción incluye:**
- Cobro mensual recurrente configurado
- Fecha de inicio (hoy)
- Fecha de fin (1 año por defecto)
- Click ID para tracking de afiliados

### 3. Procesamiento del Webhook

**Endpoint:** `POST /api/myia/mercadopago-webhook`

**El webhook maneja dos tipos de eventos:**

#### Eventos de Suscripción (`topic: preapproval`)
1. Valida que el evento sea `preapproval`
2. Obtiene el preapproval ID del resource
3. Consulta los detalles de la suscripción a Mercado Pago
4. Valida que el estado sea `authorized`
5. Extrae el `click_id` de los metadatos
6. Actualiza el estado de suscripción en Supabase
7. Registra la comisión en Tapfiliate (solo cuando action: created)

#### Eventos de Pago (`topic: payment`)
1. Valida que el evento sea `payment`
2. Obtiene el payment ID del resource
3. Consulta los detalles del pago a Mercado Pago
4. Valida que el estado sea `approved`
5. Extrae el `click_id` de los metadatos
6. Actualiza el estado de pago en Supabase
7. Registra la comisión en Tapfiliate (solo si NO es suscripción)

**Registro de comisión en Tapfiliate:**
```javascript
const tapfiliateResponse = await axios.post(
  'https://api.tapfiliate.com/1.6/commissions/',
  {
    click_id: clickId,
    external_id: subscription.id.toString(),
    amount: subscription.auto_recurring?.transaction_amount || 0,
    currency: subscription.auto_recurring?.currency_id || 'ARS'
  },
  {
    headers: {
      'X-Api-Key': process.env.TAPFILIATE_API_KEY,
      'Content-Type': 'application/json'
    }
  }
);
```

## Endpoints del Backend

### 1. Crear Suscripción (Principal)
```
POST /api/myia/create-subscription
```

**Respuesta:**
```json
{
  "success": true,
  "subscriptionId": "preapproval-id",
  "initPoint": "https://mercadopago.com/checkout",
  "sandboxInitPoint": "https://sandbox.mercadopago.com/checkout"
}
```

### 2. Crear Preferencia de Pago (Fallback - Sin suscripción)
```
POST /api/myia/create-payment-preference
```

Este endpoint se mantiene como fallback para pagos únicos sin suscripción.

### 3. Webhook de Mercado Pago
```
POST /api/myia/mercadopago-webhook
```

**Body (enviado por Mercado Pago - Suscripción):**
```json
{
  "topic": "preapproval",
  "resource": "https://api.mercadopago.com/preapproval/PREAPPROVAL_ID",
  "action": "created"
}
```

**Body (enviado por Mercado Pago - Pago):**
```json
{
  "topic": "payment",
  "resource": "https://api.mercadopago.com/v1/payments/PAYMENT_ID"
}
```

### 4. Verificar Estado de Pago
```
GET /api/myia/payment-status/:pageId
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "payment_status": "paid",
    "payment_id": "MP_PAYMENT_ID",
    "payment_date": "2024-01-01T00:00:00Z",
    "subscription_id": "PREAPPROVAL_ID",
    "subscription_status": "authorized",
    "payment_plan": "responde",
    "payment_method": "mercadopago"
  }
}
```

## Páginas de Respuesta de Pago

### myia-payment-success.html
- Se muestra cuando el pago es exitoso
- Redirige a `myia-summary.html` para continuar la configuración

### myia-payment-failure.html
- Se muestra cuando el pago falla
- Permite reintentar el pago

### myia-payment-pending.html
- Se muestra cuando el pago está pendiente
- Permite verificar el estado

## Migración de Base de Datos

Ejecutar `backend/migrate_payment_status.sql` en Supabase SQL Editor:

```sql
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT;
```

## Precios de Planes (en ARS)

| Plan | Implementación | Mensual |
|------|----------------|---------|
| Responde | $112.000 | $22.500 |
| Asiste | $225.000 | $22.500 |
| Automatiza | $375.000 | $32.000 |
| Intelligence | $600.000 | $32.000 |

**Nota:** Actualmente el sistema configura suscripciones mensuales. El cobro de implementación (pago único) puede agregarse como un item adicional en la preferencia inicial.

## Formulario de Solicitud de Afiliados

El formulario está integrado en la sección de contacto de `index.html`:

**URL del formulario:** https://form.jotform.com/262756017815057

**Texto promocional:**
> "Volvete afiliado a Crysantem y llevate altas comisiones del 30% por cada venta que lleves a cabo"

## Testing

### Testing en Sandbox

1. Usa las credenciales de sandbox proporcionadas
2. Crea una suscripción en el frontend
3. Completa el pago en la sandbox de Mercado Pago
4. Verifica que el webhook reciba la notificación de `preapproval`
5. Verifica que la comisión se registre en Tapfiliate

### Testing en Producción

1. Cambia las credenciales a producción
2. Actualiza el webhook URL al de producción
3. Realiza un pago de prueba real con tarjeta de crédito
4. Verifica el proceso completo

## Notas Importantes

1. **Click ID Tracking:** El click_id es CRUCIAL para el sistema de afiliados. Sin él, no se pueden registrar comisiones.

2. **Webhook URL:** Debe ser un URL público accesible desde Mercado Pago. No funcionará con localhost sin ngrok.

3. **Seguridad:** Las credenciales de Mercado Pago y Tapfiliate deben mantenerse en el backend, nunca en el frontend.

4. **Email Requerido:** Para crear suscripciones, Mercado Pago requiere el email del pagador. El sistema solicita este email en el frontend.

5. **Logging:** El sistema tiene logs extensivos en el backend para debugging. Revisa los logs si hay problemas.

6. **Fallback:** Si el click_id no está disponible, la suscripción aún se procesa pero no se registra comisión.

7. **Comisión Única:** La comisión de afiliado se registra una sola vez cuando la suscripción se autoriza (action: created).

## Troubleshooting

### El webhook no recibe notificaciones
- Verifica que el webhook URL sea correcto y accesible
- Verifica que Mercado Pago pueda alcanzar tu servidor (no esté bloqueado por firewall)
- Revisa los logs del backend

### Las comisiones no se registran en Tapfiliate
- Verifica que `TAPFILIATE_API_KEY` esté configurado
- Verifica que el click_id esté presente en los metadatos de la suscripción
- Revisa la API de Tapfiliate para ver si hay errores

### El click_id no se captura
- Verifica que el script de Tapfiliate esté cargado
- Verifica que el usuario ingresó mediante un enlace de afiliado
- Revisa las cookies del navegador

### Error al crear suscripción (email requerido)
- Verifica que el email del pagador se esté solicitando en el frontend
- El email es OBLIGATORIO para suscripciones de Mercado Pago

## Archivos Modificados/Creados

### Backend
- `backend/package.json` - Agregada dependencia `mercadopago`
- `backend/routes/myia.js` - Agregados endpoints de suscripciones y webhook mejorado
- `backend/.env.example` - Agregadas variables de entorno
- `backend/migrate_payment_status.sql` - Migración de base de datos con columnas de suscripción

### Frontend
- `frontend/index.html` - Agregado script de Tapfiliate y sección de afiliados
- `frontend/js/myia-payment-simple.js` - Actualizado para crear suscripciones (solicita email)
- `frontend/myia-payment.html` - Actualizado texto de ayuda
- `frontend/myia-payment-success.html` - Página de éxito
- `frontend/myia-payment-failure.html` - Página de fallo
- `frontend/myia-payment-pending.html` - Página de pendiente

## Próximos Pasos

1. Configurar el webhook URL en Mercado Pago (cuando tengas el URL de producción)
2. Obtener la API Key de Tapfiliate
3. Actualizar el Account ID de Tapfiliate en el script de tracking (`YOUR_TAPFILIATE_ACCOUNT_ID`)
4. Probar el flujo completo en sandbox
5. Implementar en producción

## Diferencias con la versión anterior (Preferencias vs Suscripciones)

| Característica | Preferencias (Anterior) | Suscripciones (Actual) |
|---------------|------------------------|------------------------|
| Tipo de cobro | Pago único | Cobro mensual recurrente |
| Endpoint | `create-payment-preference` | `create-subscription` |
| Email requerido | No | Sí (obligatorio) |
| Click ID en | metadata | metadata |
| Webhook topic | `payment` | `preapproval` + `payment` |
| Comisión registrada | En cada pago | Una vez al autorizar suscripción |
| Flexibilidad | Menos flexible | Más flexible (configuración dinámica) |
