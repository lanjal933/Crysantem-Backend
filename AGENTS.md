# Crysantem - Guía para Desarrolladores

## Sistema MyIA - Nuevo Modelo de Precios SaaS MRR (V1.5)

### Resumen del Cambio Estratégico

**Transformación completa a modelo SaaS puro de Ingreso Mensual Recurrente (MRR):**

- **Eliminados costos de implementación individuales**: Ya no se cobran setup fees por separado
- **Modelo de suscripción pura**: Todos los planes ahora son suscripciones mensuales o anuales
- **Add-ons integrados**: Las características premium (Texto Bonito, Gráficos Pro) ahora son nativas en los planes superiores
- **Facturación flexible**: Toggle para alternar entre facturación mensual y anual (con 2 meses de descuento en anual)
- **Mercado Pago Pre-approvals**: Integración con API de suscripciones de Mercado Pago para cobros recurrentes automáticos

### Nueva Estructura de Planes

#### 01. Plan Responde
- **Precio Mensual**: $49.000 ARS / mes
- **Precio Anual**: $40.833 ARS / mes (cobrado anualmente: $490.000 ARS)
- **Mensajes**: Hasta 1.000 mensajes al mes
- **Canales**: Web, Telegram o Discord
- **Permanencia mínima**: 3 meses

#### 02. Plan Asiste (Recomendado)
- **Precio Mensual**: $79.000 ARS / mes
- **Precio Anual**: $65.833 ARS / mes (cobrado anualmente: $790.000 ARS)
- **Mensajes**: Hasta 2.500 mensajes al mes
- **Conexión clave**: Google Drive
- **Add-on Integrado**: "Texto Bonito" (Markdown enriquecido, cajas coloridas, links estéticos y botones directos a WhatsApp/Gmail)
- **Permanencia mínima**: 3 meses

#### 03. Plan Automatiza
- **Precio Mensual**: $125.000 ARS / mes
- **Precio Anual**: $104.167 ARS / mes (cobrado anualmente: $1.250.000 ARS)
- **Mensajes**: Hasta 5.000 mensajes al mes
- **Conexión clave**: Google Calendar
- **Add-ons Integrados**: "Texto Bonito" + "Gráficos Pro" (Gráficos dinámicos generados por la IA)
- **Permanencia mínima**: 6 meses

#### 04. Plan Enterprise (Antiguo Crysantem Intelligence)
- **Precio**: Custom / Personalizado
- **Mensajes**: Ajustados a medida
- **Conexión clave**: Gmail, Google Drive y Google Calendar
- **Add-ons Integrados**: Todas las herramientas y add-ons avanzados nativos
- **Flujo**: Botón con redirección a WhatsApp/Agendar Sesión

### Cambios en Terminología

- **"Tokens" → "Mensajes al mes"**: Se eliminó la palabra "tokens" de toda la web y se reemplazó por "mensajes al mes"
- **"Implementación" → Eliminado**: Ya no se muestra costo de implementación
- **"Costo mensual" → "Precio"**: Simplificación de etiquetas de precio

### Migración de Base de Datos: Tokens → Mensajes

Para completar la transición de "tokens" a "mensajes", ejecutar `backend/migrate_tokens_to_messages.sql` en Supabase SQL Editor.

El script de migración:
- Renombra la tabla `user_token_limits` a `user_message_limits`
- Renombra columnas: `monthly_limit` → `monthly_message_limit`, `tokens_used` → `messages_used`
- Actualiza comentarios, índices, triggers y políticas RLS
- Mantiene toda la funcionalidad intacta con la nueva nomenclatura

### Sistema de Control de Mensajes Mensuales

#### Funcionalidades Implementadas

**1. Contador de Mensajes por Página**
- Cada página MyIA tiene un contador de mensajes mensuales
- El contador se resetea automáticamente al inicio de cada mes
- Se rastrea en `myia_page_config` con las columnas:
  - `messages_used_this_month`: Mensajes enviados en el mes actual
  - `current_month`: Mes actual del contador (1-12)
  - `current_year`: Año actual del contador
  - `last_message_count_reset`: Fecha del último reset

**2. Validación de Límites**
- El endpoint `/api/myia/chat-message` verifica el límite antes de procesar mensajes
- Si se excede el límite, devuelve error 429 con código `MESSAGE_LIMIT_REACHED`
- El chat frontend se deshabilita automáticamente cuando se alcanza el límite

**3. Verificación de Estado Activo**
- El webhook de Mercado Pago actualiza `is_active` según el estado de suscripción
- Si `is_active = false`, el bot se suspende y no procesa mensajes
- Devuelve error 403 con código `BOT_SUSPENDED`

**4. Endpoint de Consulta de Límite**
- `GET /api/myia/message-limit/:pageId` retorna el estado actual del límite
- Incluye: límite total, mensajes usados, mensajes restantes, porcentaje usado
- El dashboard muestra esta información con advertencias cuando se acerca al límite (80%+)

#### Migración de Base de Datos

Ejecutar `backend/migrate_message_counter.sql` en Supabase SQL Editor para agregar las columnas del contador de mensajes a `myia_page_config`.

#### Frontend Updates

**Dashboard (`myia-dashboard-page.html`):**
- Muestra contador de mensajes usados / límite total
- Advertencia cuando se alcanza 80% del límite
- Advertencia cuando se alcanza 100% del límite

**Chat HTML generado:**
- Mensajes de error amigables cuando el bot está suspendido
- Mensajes de error cuando se alcanza el límite
- El input se deshabilita automáticamente en estos casos

### Integración con Mercado Pago

#### API de Pre-approvals (Suscripciones)

El backend ahora utiliza la API de Pre-approvals de Mercado Pago para crear suscripciones recurrentes:

**Endpoint**: `POST /api/myia/create-subscription`

**Parámetros**:
- `plan`: ID del plan (responde, asiste, automatiza, intelligence)
- `pageId`: ID de la página (opcional)
- `userId`: ID del usuario
- `clickId`: Click ID de Tapfiliate (para comisiones de afiliados)
- `payerEmail`: Email del pagador (requerido para suscripciones)
- `billingType`: 'monthly' o 'annual'

**Lógica de precios**:
- **Mensual**: `frequency: 1`, `frequency_type: 'months'`, `transaction_amount: precio_mensual`
- **Anual**: `frequency: 1`, `frequency_type: 'months'`, `transaction_amount: precio_anual_total` (cobro único de 12 meses con descuento)

#### Webhook de Mercado Pago

**Endpoint**: `POST /api/myia/mercadopago-webhook`

**Eventos manejados**:
- `preapproval`: Eventos de suscripción (authorized, pending_payment, paused, cancelled)
- `payment`: Eventos de pago único (fallback)

**Actualización de estado**:
- `subscription_status = 'authorized'` → `payment_status = 'paid'`, `is_active = true`
- `subscription_status = 'pending_payment'` → `payment_status = 'unpaid'`, `is_active = false` (bot suspendido)
- `subscription_status = 'cancelled'` → `payment_status = 'cancelled'`, `is_active = false`

**Nuevas columnas en `myia_page_config`**:
- `billing_type`: 'monthly' o 'annual'
- `messages_limit`: Límite de mensajes según plan
- `minimum_months`: Permanencia mínima requerida
- `subscription_id`: ID de suscripción de Mercado Pago
- `subscription_status`: Estado de la suscripción
- `is_active`: Estado del bot (true/false)

### Migración de Base de Datos

Ejecutar `backend/migrate_saas_pricing.sql` en Supabase SQL Editor para agregar las nuevas columnas necesarias para el modelo SaaS.

El script de migración agrega:
- Columnas para manejar el tipo de facturación y límites de mensajes
- Columnas para rastrear el estado de suscripciones de Mercado Pago
- Índices para optimizar búsquedas por subscription_id y is_active

### Frontend UI/UX

#### Toggle de Facturación Mensual/Anual

Implementado en `myia-plans.html`:
- Switch toggle para alternar entre facturación mensual y anual
- Badge "Ahorrá 2 meses" en la opción anual
- Cálculo automático de precios con descuento
- Visualización del total anual cuando está en modo anual

#### Eliminación de Add-ons Independientes

Ya no existe una sección separada de "Compras Adicionales" (Add-ons):
- Las características ahora están integradas directamente en los planes
- Plan 02 incluye Texto Bonito
- Plan 03 incluye Texto Bonito + Gráficos Pro
- Plan 04 incluye todo de forma nativa

### Archivos Modificados para el Nuevo Modelo

**Frontend**:
- `frontend/myia-plans.html` - Nueva estructura de planes, toggle mensual/anual
- `frontend/js/myia-plans.js` - Nueva lógica de precios y toggle
- `frontend/myia-payment.html` - Eliminado "Costo de implementación", cambiado a "Precio"
- `frontend/js/myia-payment.js` - Nuevos precios actualizados
- `frontend/js/myia-payment-simple.js` - Nuevos precios y lógica de billingType

**Backend**:
- `backend/routes/myia.js` - Actualizados precios, lógica de suscripciones con billingType, webhook mejorado

---

## Sistema MyIA - Nuevo Flujo de Configuración (V1.4)

### Resumen de Cambios

El flujo de configuración de MyIA se ha reorganizado completamente para separar mejor las responsabilidades y mejorar la experiencia del usuario:

**Antes (V1.3):**
- Diseño web + Prompt en una sola página
- Planes y OAuth mezclados
- Sin configuración específica de integraciones

**Ahora (V1.4):**
- Diseño web separado de Prompt
- Flujo paso a paso claro: Plan → Diseño → Prompt → Integraciones → Pago/OAuth
- Configuración detallada de integraciones según el plan
- Pago y OAuth al final del flujo

### Nuevo Flujo de Configuración

#### 1. Selección de Plan (`myia-plans.html`)
- Usuario selecciona plan (responde, asiste, automatiza, intelligence)
- Guarda en `localStorage.selectedPlan`
- Redirige a diseño web (`myia-builder.html`)

#### 2. Diseño Web (`myia-builder.html`)
- Configuración visual: logo, colores, tipografía, diseño de página
- **IMPORTANTE**: Ya NO incluye configuración de prompt (sección "Agente IA" eliminada)
- Guarda en `localStorage.builderConfig`
- Botón "Siguiente →" redirige a `myia-prompt.html`

#### 3. Configuración de Prompt (`myia-prompt.html`)
- Mensaje de bienvenida (max 200 caracteres)
- System prompt (max 4000 caracteres)
- Ejemplos de prompts predefinidos
- Tips para crear buenos prompts
- Guarda en `localStorage.promptConfig`
- Botón "Siguiente →" redirige a `myia-integrations.html`

#### 4. Integraciones según Plan (`myia-integrations.html`)
Muestra configuraciones según el plan seleccionado:

**Todos los planes:**
- Google Sheets: Sheet ID de base de datos, sheets adicionales, permisos
  - **NUEVO**: Campo de indicaciones para la IA (cómo usar el Sheet)
  - **NUEVO**: URL del Sheet (generada automáticamente, para que la IA pueda copiarla)
  - Botón para descargar plantilla predefinida con 3 hojas (Clientes, Citas, Historial)
  - **NUEVO**: Plan 03+ y 04+: Sheet personalizable con título, descripción detallada, ID y URL

**Plan 02 (Asiste):**
- Google Drive: Folder ID, carpetas adicionales
  - **NUEVO**: Campo de indicaciones para la IA (cómo usar la carpeta)
  - **NUEVO**: URL de la carpeta (generada automáticamente, para que la IA pueda copiarla)
- Imágenes Markdown: Subida de imágenes con descripciones para la IA
  - Cada imagen puede tener una descripción breve que la IA usa para contextualizar

**Plan 03 (Automatiza):**
- Todo lo del plan 02
- Google Calendar: Calendar ID, duración citas, horarios individuales por día, zona horaria
- La IA detecta automáticamente conflictos con eventos existentes y sugiere alternativas

**Plan 04 (Intelligence):**
- Todo lo del plan 03
- Gmail: Email de envío, plantilla, tipo de envío

Guarda en `localStorage.integrationsConfig`

#### 5. Pago y OAuth (`myia-payment.html`)
- Resumen del plan seleccionado
- Método de pago (tarjeta, transferencia, PayPal)
- Conexión con Google OAuth
- Refresh token se guarda en `user_google_tokens` (Supabase)
- **NUEVO**: Después de OAuth, redirige directamente a `myia-summary.html` (se eliminó el paso intermedio)
- Guarda en `localStorage.paymentConfig`

#### 6. Resumen y Creación (`myia-summary.html`)
- Fusiona todas las configuraciones (builderConfig + promptConfig + integrationsConfig + paymentConfig)
- Muestra resumen completo con todas las secciones
- Valida campos obligatorios
- Guarda todo en `myia_page_config` en Supabase
- Llama webhook de n8n para activar automatizaciones

### Archivos Nuevos Creados

- `frontend/myia-prompt.html` - Página de configuración de prompt
- `frontend/js/myia-prompt.js` - Lógica de configuración de prompt
- `frontend/myia-integrations.html` - Página de integraciones
- `frontend/js/myia-integrations.js` - Lógica de integraciones
- `frontend/myia-payment.html` - Página de pago y OAuth
- `frontend/js/myia-payment.js` - Lógica de pago y OAuth
- `backend/migrate_new_columns.sql` - Migración de base de datos

### Archivos Modificados

- `frontend/myia-builder.html` - Eliminada sección de "Agente IA" (prompt), cambiado botón "Ver Resumen" por "Siguiente"
- `frontend/js/myia-builder.js` - Eliminada lógica de prompt, redirección a myia-prompt.html en lugar de myia-summary.html
- `frontend/myia-integrations.html` - Agregados campos de indicaciones y URLs para Sheets y Drive, sección de Sheet personalizable
- `frontend/js/myia-integrations.js` - Actualizado para manejar nuevos campos de indicaciones, URLs y custom sheet
- `frontend/js/myia-plans.js` - Cambiado redirección a myia-builder.html en lugar de myia-dashboard.html
- `frontend/js/myia-payment.js` - OAuth redirige directamente a myia-summary.html
- `frontend/js/myia-summary.js` - Actualizado para fusionar todas las configuraciones
- `backend/routes/myia.js` - Corregido el UPDATE de integraciones para que se ejecute siempre (movido fuera del try/catch)
- `backend/MYIA_DATABASE_SCHEMA.md` - Documentación del nuevo flujo

### Cambios en Base de Datos

Nuevas columnas en `myia_page_config`:
```sql
ALTER TABLE myia_page_config 
ADD COLUMN integrations_config JSONB,
ADD COLUMN payment_plan TEXT,
ADD COLUMN payment_method TEXT,
ADD COLUMN google_connected BOOLEAN DEFAULT false;
```

Ejecutar `backend/migrate_new_columns.sql` en Supabase SQL Editor.

### Comandos Útiles

```bash
# Ejecutar migración de base de datos
# Copiar contenido de backend/migrate_new_columns.sql y ejecutar en Supabase SQL Editor

# Iniciar servidor
cd backend
node server.js
```

### Notas Importantes

1. **Flujo obligatorio**: El usuario debe pasar por todos los pasos en orden
2. **Validación**: Cada paso valida sus campos antes de permitir continuar
3. **LocalStorage**: Cada configuración se guarda en localStorage y se fusiona al final
4. **Backward compatibility**: Las apps existentes pueden seguir editándose con el viejo builder
5. **OAuth**: El refresh token se sigue guardando en `user_google_tokens` (fuente única de verdad)

## Sistema de Dashboards para Páginas MyIA

Cada página creada con MyIA tiene su propio dashboard con estadísticas, métricas y acciones rápidas.

### Funcionalidades del Dashboard

#### Métricas Principales
- **Mensajes Totales**: Cantidad de mensajes intercambiados en la página
- **Usuarios Únicos**: Número de diferentes usuarios que interactuaron
- **Tokens Usados**: Total de tokens de IA consumidos
- **Tiempo de Respuesta Promedio**: Promedio de tiempo de respuesta en segundos

#### Gráficos Interactivos
- **Gráfico de Mensajes por Día**: Línea temporal de mensajes
- **Gráfico de Usuarios por Día**: Barras de usuarios únicos diarios

#### Acciones Rápidas
- **Ver Página**: Abre la página en nueva pestaña
- **Editar Configuración**: Vuelve al builder para modificar la página
- **Copiar Link**: Copia el URL de la página al portapapeles
- **Descargar Logs**: Exporta logs de interacciones (próximamente)

#### Información de la Página
- Nombre del negocio
- Plan activo
- Modelo de IA
- Estado (Activo/Inactivo)
- Fecha de creación

### Base de Datos

Nuevas tablas creadas en `backend/migrate_page_stats.sql`:

1. **`myia_page_stats`**: Estadísticas agregadas por día
   - Total de mensajes
   - Usuarios únicos
   - Tokens usados
   - Tiempo de respuesta promedio

2. **`myia_message_logs`**: Log individual de cada mensaje
   - Tipo (user/ai)
   - Texto del mensaje
   - Tokens usados
   - Tiempo de respuesta

3. **`myia_user_sessions`**: Sesiones de usuarios
   - Session ID único
   - Cantidad de mensajes
   - Primer y último mensaje
   - User agent y referrer

### Endpoints Backend

**GET** `/api/myia/stats/:pageId`
- Retorna estadísticas de una página específica
- Incluye métricas totales y datos diarios para gráficos

**POST** `/api/myia/log-message`
- Registra un mensaje para estadísticas
- Actualiza sesiones de usuarios
- Actualiza estadísticas diarias

### Archivos del Sistema

- **frontend/myia-dashboard-page.html**: Página del dashboard individual
- **frontend/js/myia-dashboard-page.js**: Lógica del dashboard
- **backend/migrate_page_stats.sql**: Migración de base de datos
- **backend/routes/myia.js**: Endpoints de estadísticas (líneas 410-587)

### Integración en el Listado

**Archivo**: `frontend/js/myia-home.js` (líneas 106-187)

Los botones en el listado de páginas ahora son:
1. **Ver Página** - Abre la página en nueva pestaña
2. **Panel** - Abre el dashboard de estadísticas
3. **Editar** - Modifica la configuración
4. **Eliminar** - Borra la página

### Flujo de Uso

1. El usuario crea una página con MyIA
2. Se crea automáticamente un registro en `myia_page_stats`
3. Cada mensaje se registra en `myia_message_logs`
4. Las sesiones se rastrean en `myia_user_sessions`
5. El usuario puede ver las estadísticas en el dashboard

### Ejecutar Migración

Ejecutar `backend/migrate_page_stats.sql` en Supabase SQL Editor para crear las tablas necesarias.

## Correcciones al Builder (V1.5.1)

### Problemas Corregidos

1. **Header: Tema y color de fondo ahora funcionan**
   - Agregada función `getHeaderStyle()` que aplica colores según `header_theme`
   - Header light mode ahora muestra texto oscuro legible
   - Header dark mode mantiene texto blanco

2. **Consumo: Cambiado de caracteres a mensajes**
   - Eliminada referencia a `characterLimit` del builder
   - Ahora muestra "Límite de mensajes mensuales"
   - Etiqueta actualizada para mostrar: "0 / 1,000 mensajes al mes"

3. **Posición de chat eliminada**
   - Removida opción de selección de posición (izquierda/derecha)
   - Chat ahora siempre está fijo a la derecha
   - Simplifica la UI y reduce confusión

4. **Diseño caja Clásico: Texto ahora legible**
   - Agregada función `getInputStyle()` para el input del chat
   - Agregada función `getPlaceholderStyle()` para placeholder
   - En modo clásico: input oscuro con texto negro legible
   - Placeholder oscuro en modo clásico para mejor visibilidad

### Archivos Modificados

- `frontend/myia-builder.html` - Eliminada posición de chat, cambiado "caracteres" por "mensajes"
- `frontend/js/myia-builder.js` - Eliminado characterLimit, agregado messagesLimit, eliminado chatPosition
- `backend/routes/myia.js` - Agregadas funciones de estilo para header e input según diseño

---

## Sistema de Templates Predefinidos (V1.5.1)

### Nueva Funcionalidad

Implementado sistema de templates predefinidos para reducir el tiempo de implementación de 20 min a 5 min.

### Templates Disponibles

1. **Personalizado** - Crear desde cero
2. **Restaurante** - Reservas, menú, horarios (Plan Automatiza)
3. **Gimnasio** - Clases, horarios, membresías (Plan Asiste)
4. **Consultorio Médico** - Turnos, disponibilidad, recordatorios (Plan Automatiza)
5. **E-commerce** - Productos, stock, pedidos (Plan Asiste)
6. **Inmobiliaria** - Propiedades, visitas, contactos (Plan Asiste)

### Archivos Nuevos

- `frontend/myia-templates.html` - Página de selección de templates
- `frontend/js/myia-templates.js` - Lógica de templates y configuración predefinida

### Flujo con Templates

1. Usuario accede a `myia-templates.html` (nuevo punto de entrada)
2. Selecciona template o "Personalizado"
3. Template pre-configura:
   - System prompt optimizado
   - Mensaje de bienvenida
   - Integraciones sugeridas
   - Colores y diseño recomendados
   - Plan recomendado (si aplica)
4. Redirige a `myia-builder.html` con configuración precargada
5. Usuario puede personalizar más si lo desea

### Archivos Modificados para Integración

- `frontend/js/myia-builder.js` - Agregada función `loadTemplateConfig()` para aplicar configuración del template

---

## Sistema Crysantem COWORKERS

Sección especial para crear páginas MyIA gratuitas sin OAuth, disponible solo para emails autorizados manualmente.

### Propósito

Permite a los trabajadores de Crysantem crear páginas de demostración usando el plan Responde (01) sin necesidad de conectar su cuenta de Google. Ideal para mostrar demos a clientes potenciales.

### Flujo de COWORKERS

1. **Verificación de Acceso** (`myia-coworkers.html`)
   - Verifica si el email del usuario está en la tabla `myia_coworkers`
   - Si no está autorizado, redirige a `index.html`
   - Si está autorizado, muestra la interfaz de COWORKERS

2. **Creación de Página**
   - Al hacer clic en "Crear Nueva Página", se marca `isCoworker = true` en localStorage
   - Se selecciona automáticamente el plan `responde` (01)
   - Se marca `coworkerSkipOAuth = true` para omitir el paso de OAuth

3. **Flujo Simplificado**
   - **Builder**: Normal (`myia-builder.html`)
   - **Prompt**: Normal (`myia-prompt.html`)
   - **Integraciones**: **OMITIDO** - Se guarda configuración vacía automáticamente
   - **Payment**: **OMITIDO** - Se redirige directamente a summary
   - **Summary**: Normal, pero con `google_connected = true` y `payment_method = 'Coworker Free'`

### Tabla de Base de Datos

```sql
CREATE TABLE myia_coworkers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'admin'
);
```

Ejecutar `backend/migrate_coworkers.sql` en Supabase SQL Editor.

### Endpoint Backend

**GET** `/api/myia/check-coworker/:email`
- Verifica si un email está autorizado como coworker
- Retorna `{ success: true, is_coworker: boolean, coworker: object | null }`

### Archivos Nuevos

- `frontend/myia-coworkers.html` - Página principal de COWORKERS
- `frontend/js/myia-coworkers.js` - Lógica de verificación y acceso
- `backend/migrate_coworkers.sql` - Migración de base de datos

### Archivos Modificados

- `frontend/index.html` - Agregado link "COWORKERS" (oculto por defecto, visible solo para coworkers)
- `frontend/js/main-new.js` - Función `checkCoworkerAccess()` para mostrar/ocultar link
- `frontend/js/myia-integrations.js` - Omite paso de integraciones si es coworker con plan 01
- `frontend/js/myia-payment.js` - Omite paso de OAuth si es coworker
- `frontend/js/myia-summary.js` - Marca `google_connected = true` automáticamente para coworkers
- `backend/routes/myia.js` - Agregado endpoint `/check-coworker/:email`
- `frontend/css/style.css` - Estilos para página de COWORKERS

### Agregar Coworkers Manualmente

Para agregar un nuevo coworker, ejecutar en Supabase SQL Editor:

```sql
INSERT INTO myia_coworkers (email, name, is_active)
VALUES ('nuevo@email.com', 'Nombre del Trabajador', true);
```

### Flags de LocalStorage

- `isCoworker`: Indica si el usuario es coworker autorizado
- `coworkerSkipOAuth`: Indica si se debe omitir el paso de OAuth
- `selectedPlan`: Se establece en 'responde' automáticamente para coworkers

### Notas Importantes

1. **Solo plan 01**: Los coworkers solo pueden crear páginas con el plan Responde (01)
2. **Sin integraciones**: Las páginas de coworkers no tienen Sheets, Drive, Calendar o Gmail
3. **Sin OAuth**: No se requiere conexión con Google, pero `google_connected` se marca como true
4. **Pago gratuito**: `payment_method` se establece como 'Coworker Free'
5. **Link oculto**: El link "COWORKERS" en el navbar solo es visible para emails autorizados
6. **Carga manual**: Los emails se agregan manualmente a la tabla por el administrador

## Sistema de Markdown Mejorado

Crysantem V1.4 incluye un sistema de markdown extendido que permite a la IA generar respuestas ricas con componentes personalizados.

### Componentes Disponibles

#### 1. Tarjetas de Planes `[PLAN]`
```markdown
[PLAN name="Nombre del Plan" price="$99/mes" highlight=true]
- Característica 1
- Característica 2
[/PLAN]
```

#### 2. Gráficos Interactivos `[CHART]`
```markdown
[CHART type="bar" id="ventas2024"]
{
  "labels": ["Enero", "Febrero", "Marzo"],
  "datasets": [{
    "label": "Ventas",
    "data": [120, 190, 300],
    "backgroundColor": "rgba(0, 255, 136, 0.5)",
    "borderColor": "#00ff88"
  }]
}
[/CHART]
```

#### 3. Cajas de Información `[INFO]`
```markdown
[INFO type="info"]
Contenido del mensaje
[/INFO]
```
Tipos: `info`, `success`, `warning`, `error`, `tip`

#### 4. Botón de WhatsApp `[WHATSAPP]`
```markdown
[WHATSAPP phone="+13237093568" message="Mensaje opcional"/]
```

#### 5. Imágenes con Prefijo `markdown:`
```markdown
![Descripción](markdown:nombre_imagen.jpg)
```
Las imágenes se buscan en `frontend/IMG/imagenes_markdown/`

### Archivos del Sistema

- **frontend/js/markdown-renderer.js**: Procesador de markdown extendido
- **frontend/css/style.css**: Estilos para componentes (líneas 1472-1724)
- **frontend/IMG/imagenes_markdown/**: Carpeta de imágenes accesibles vía markdown:
- **frontend/index.html**: Incluye Chart.js CDN (línea 14)

### Integración en el Código

El sistema se integra en `frontend/js/main.js` en la función `addMessage()`:
```javascript
if (type === 'ai') {
  messageDiv.innerHTML = markdownRenderer.render(text);
} else {
  messageDiv.textContent = text;
}
```

### Tecnologías

- **Chart.js 4.4.0**: Para gráficos interactivos
- **Sistema de parseo personalizado**: Para componentes `[COMPONENT]...[/COMPONENT]`
- **Markdown estándar**: Procesado con implementación propia

### Regla Crítica

**NUNCA generar HTML directo** en las respuestas de la IA. Siempre usar sintaxis markdown estándar + componentes personalizados. El HTML directo se mostrará como texto en lugar de renderizarse.

### Documentación de Referencia

- `IA_PROMPT_MARKDOWN.md`: Documentación completa del sistema para la IA
- `frontend/js/markdown-renderer.js`: Implementación del renderer
- `frontend/css/style.css`: Estilos de componentes (líneas 1472+)

## Estructura del Proyecto

```
Crysantem.v1.4/
├── frontend/
│   ├── IMG/
│   │   └── imagenes_markdown/    # Imágenes para markdown
│   ├── css/
│   │   └── style.css             # Estilos + componentes markdown
│   ├── js/
│   │   ├── main.js               # Lógica principal + integración markdown
│   │   ├── config.js             # Configuración API
│   │   └── markdown-renderer.js  # Sistema de markdown extendido
│   ├── index.html                # Página principal
│   └── dashboard.html            # Dashboard
└── backend/
    ├── controllers/
    │   └── aiController.js       # Controlador de mensajes IA
    └── config/
        └── config.js             # Configuración backend
```

## Comandos Útiles

### Iniciar el servidor
```bash
cd backend
node server.js
```

### Verificar archivos de markdown
```bash
ls frontend/IMG/imagenes_markdown/
```

## Notas de Implementación

- Los gráficos se renderizan automáticamente cuando se agregan mensajes de IA
- Los scripts de Chart.js se ejecutan automáticamente via MutationObserver
- El sistema es responsive y se adapta a diferentes tamaños de pantalla
- Todos los componentes tienen estilos personalizados en el tema verde de Crysantem

## Sistema de Pagos Mercado Pago + Afiliados Tapfiliate

Sistema completo de **suscripciones mensuales** integrado con Mercado Pago y sistema de afiliados con Tapfiliate.

### Flujo de Pagos (Suscripciones)

1. **Captura de Click ID (Tapfiliate)**
   - El script de Tapfiliate se carga en `index.html`
   - Cuando un usuario ingresa vía enlace de afiliado, se captura el `click_id`
   - El `click_id` se adjunta a la suscripción de Mercado Pago

2. **Creación de Suscripción**
   - Endpoint: `POST /api/myia/create-subscription`
   - Solicita email del pagador (requerido por Mercado Pago)
   - El click_id se guarda en `metadata.clickId` de la suscripción
   - El usuario es redirigido a Mercado Pago para activar la suscripción

3. **Webhook de Mercado Pago**
   - Endpoint: `POST /api/myia/mercadopago-webhook`
   - Recibe notificaciones de suscripción (`preapproval`) y pago (`payment`)
   - Valida que la suscripción sea autorizada
   - Registra la comisión en Tapfiliate si hay un click_id (una sola vez)

### Variables de Entorno

```bash
# === MERCADO PAGO ===
MP_ACCESS_TOKEN=tu-access-token-de-produccion
MP_PUBLIC_KEY=tu-public-key
MP_WEBHOOK_SECRET=tu-secreto-para-validar-webhooks

# === TAPFILIATE (Sistema de Afiliados) ===
TAPFILIATE_API_KEY=tu-api-key-de-tapfiliate
```

### Webhook URL

Configurar en Mercado Pago Developers:
- **Producción:** `https://crysantem.tech/api/myia/mercadopago-webhook`
- **Desarrollo:** Usar ngrok para tunnel público

**Eventos a configurar:**
- `preapproval` - Para suscripciones
- `payment` - Para pagos únicos (opcional)

### Páginas de Respuesta de Pago

- `myia-payment-success.html` - Pago exitoso, redirige a configuración
- `myia-payment-failure.html` - Pago fallido, permite reintentar
- `myia-payment-pending.html` - Pago pendiente, permite verificar estado

### Migración de Base de Datos

Ejecutar `backend/migrate_payment_status.sql`:

```sql
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT;
```

### Formulario de Afiliados

Integrado en la sección de contacto de `index.html`:
- **URL:** https://form.jotform.com/262756017815057
- **Comisión:** 30% por cada venta referida

### Archivos del Sistema

- `backend/routes/myia.js` - Endpoints de Mercado Pago (create-subscription, create-payment-preference, mercadopago-webhook, payment-status)
- `backend/migrate_payment_status.sql` - Migración de base de datos con columnas de suscripción
- `frontend/index.html` - Script de Tapfiliate + sección de afiliados
- `frontend/js/myia-payment-simple.js` - Lógica de creación de suscripciones + captura de click_id + solicitud de email
- `frontend/myia-payment-success.html` - Página de éxito
- `frontend/myia-payment-failure.html` - Página de fallo
- `frontend/myia-payment-pending.html` - Página de pendiente

### Documentación Completa

Ver `MERCADO_PAGO_AFFILIATES.md` para documentación detallada del sistema.
