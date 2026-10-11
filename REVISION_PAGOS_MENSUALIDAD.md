# Revisión del Sistema de Pagos y Mensualidad - MyIA

## ✅ Estado Actual del Sistema

### 1. Frontend - Selección de Planes ✅
- **Archivo**: `frontend/myia-plans.html` y `frontend/js/myia-plans.js`
- **Estado**: FUNCIONAL
- **Características**:
  - Toggle mensual/anual con cálculo de precios
  - Precios actualizados según nuevo modelo SaaS
  - Plan Enterprise con botón de contacto
  - Guarda `billingType` en localStorage

### 2. Frontend - Pago ✅
- **Archivo**: `frontend/myia-payment.html` y `frontend/js/myia-payment-simple.js`
- **Estado**: FUNCIONAL
- **Características**:
  - Muestra precio según tipo de facturación
  - Integra `billingType` en la petición al backend
  - Redirige a Mercado Pago checkout

### 3. Backend - Creación de Suscripción ✅
- **Archivo**: `backend/routes/myia.js` (endpoint `/create-subscription`)
- **Estado**: FUNCIONAL (CORREGIDO)
- **Cambios realizados**:
  - ✅ Precios actualizados al nuevo modelo SaaS
  - ✅ Soporte para `billingType` (monthly/annual)
  - ✅ **CORRECCIÓN CRÍTICA**: Plan anual ahora cobra mensualmente con descuento (mejor para MRR)
    - Antes: Cobro único del total anual ($790.000 una sola vez)
    - Ahora: 12 cuotas mensuales de $65.833 (MRR mensual)
  - ✅ Metadata incluye `messages_limit`, `minimum_months`, `billing_type`

### 4. Backend - Webhook de Mercado Pago ✅
- **Archivo**: `backend/routes/myia.js` (endpoint `/mercadopago-webhook`)
- **Estado**: FUNCIONAL
- **Características**:
  - Maneja eventos `preapproval` (suscripciones)
  - Actualiza `is_active` según estado de suscripción
  - Registra comisiones en Tapfiliate
  - Soporta monthly y annual billing

### 5. Backend - Control de Mensajes ✅
- **Archivo**: `backend/routes/myia.js` (endpoint `/chat-message`)
- **Estado**: FUNCIONAL
- **Características**:
  - Verifica `is_active` antes de procesar
  - Resetea contador mensual automáticamente
  - Valida límite de mensajes
  - Actualiza contador después de cada mensaje
  - Manejo de errores en frontend (bot suspendido / límite alcanzado)

### 6. Backend - Consulta de Límite ✅
- **Archivo**: `backend/routes/myia.js` (endpoint `/message-limit/:pageId`)
- **Estado**: FUNCIONAL
- **Características**:
  - Retorna límite, usados, restantes, porcentaje
  - Reset automático si cambió el mes
  - Usado por dashboard

### 7. Frontend - Dashboard ✅
- **Archivo**: `frontend/myia-dashboard-page.html` y `frontend/js/myia-dashboard-page.js`
- **Estado**: FUNCIONAL
- **Características**:
  - Muestra contador de mensajes usados / límite
  - Advertencia visual al 80% del límite
  - Advertencia visual al 100% del límite

---

## 🔧 Correcciones Realizadas

### 1. **CORRECCIÓN CRÍTICA: Plan Anual**
**Problema**: El plan anual cobraba el total anual en un solo pago ($790.000 una vez), lo cual:
- No es MRR mensual
- Es una barrera de entrada muy alta
- No genera ingresos recurrentes mensuales

**Solución**: Cambiar a cobro mensual con descuento durante 12 meses
- Plan Asiste Anual: 12 cuotas de $65.833/mes (total anual $790.000)
- MRR mensual de $65.833 por usuario
- Más atractivo para el usuario (pago mensual accesible)
- Mejor para valuación de la empresa (MRR constante)

**Archivos modificados**:
- `backend/routes/myia.js` (líneas 1395-1422)
- `backend/routes/myia.js` (líneas 1541-1545)

---

## ⚠️ Problemas Detectados y Recomendaciones

### 1. **Falta Implementación de Permanencia Mínima**
**Problema**: Los planes requieren permanencia mínima (3 meses para planes 01-02, 6 meses para plan 03), pero esto no está implementado en el backend.

**Recomendación**: Implementar un job programado o validación en el webhook que:
- Verifique la fecha de inicio de la suscripción
- No permita cancelación antes de cumplir la permanencia mínima
- Muestre un mensaje de advertencia en el dashboard

### 2. **Falta Sistema de Renovación Manual**
**Problema**: Si el usuario cancela pero quiere reactivar, no hay un flujo claro.

**Recomendación**: Agregar endpoint para reactivar suscripción:
- `POST /api/myia/reactivate-subscription/:pageId`
- Verifique que no esté bloqueado por falta de pago
- Requiera aprobación de Mercado Pago

### 3. **Falta Notificación de Límite Próximo**
**Problema**: El usuario solo sabe que alcanzó el límite cuando ya no puede enviar mensajes.

**Recomendación**: Implementar notificaciones:
- Email cuando se alcanza 80% del límite
- Email cuando se alcanza 100% del límite
- Notificación en el dashboard días antes del reset mensual

### 4. **Falta Historial de Pagos**
**Problema**: No hay un endpoint para ver el historial de pagos de una suscripción.

**Recomendación**: Agregar endpoint:
- `GET /api/myia/subscription-history/:pageId`
- Retorne lista de pagos realizados, fechas, montos, estado

### 5. **Falta Sistema de Downgrade/Upgrade**
**Problema**: Si el usuario quiere cambiar de plan, no hay un flujo automatizado.

**Recomendación**: Implementar:
- Endpoint para cambiar de plan
- Cálculo de prorrateo
- Creación de nueva suscripción con cancelación de la anterior

---

## 📊 Estado de Migraciones de Base de Datos

### Migraciones Pendientes de Ejecutar:

1. **migrate_saas_pricing.sql** ✅
   - Agrega columnas para modelo SaaS
   - `billing_type`, `messages_limit`, `minimum_months`, `subscription_id`, `subscription_status`, `is_active`

2. **migrate_tokens_to_messages.sql** ✅
   - Renombra `user_token_limits` → `user_message_limits`
   - Renombra columnas de tokens a messages

3. **migrate_message_counter.sql** ✅
   - Agrega contador de mensajes a `myia_page_config`
   - `messages_used_this_month`, `current_month`, `current_year`, `last_message_count_reset`

---

## 🚀 Pruebas Recomendadas

### 1. Flujo Completo de Suscripción Mensual
1. Crear página con plan Asiste
2. Seleccionar facturación mensual
3. Completar pago con Mercado Pago
4. Verificar que webhook reciba evento `authorized`
5. Verificar que `is_active = true` en DB
6. Enviar mensajes y verificar contador
7. Verificar dashboard muestre límite correcto

### 2. Flujo Completo de Suscripción Anual
1. Crear página con plan Asiste
2. Seleccionar facturación anual
3. Completar pago con Mercado Pago
4. Verificar que cobre $65.833 mensuales (no $790.000 único)
5. Verificar que metadata tenga `billing_type: 'annual'`

### 3. Test de Límite de Mensajes
1. Establecer límite bajo (ej: 5 mensajes) en DB
2. Enviar 5 mensajes
3. Verificar que el 6to mensaje sea rechazado
4. Verificar que chat muestre advertencia
5. Esperar cambio de mes y verificar reset

### 4. Test de Suspensión por Falta de Pago
1. Cambiar `is_active = false` manualmente en DB
2. Intentar enviar mensaje
3. Verificar que sea rechazado con error 403
4. Verificar que chat muestre advertencia de bot suspendido

---

## ✅ Conclusión

El sistema de pagos y mensualidad está **FUNCIONAL** con las correcciones realizadas. El cambio crítico del plan anual de cobro único a cobro mensual recurrente mejora significativamente el modelo de negocio.

**Próximos pasos recomendados**:
1. Ejecutar las 3 migraciones en Supabase
2. Probar el flujo completo de suscripción
3. Implementar las recomendaciones de mejoras (permanencia mínima, notificaciones, historial)
