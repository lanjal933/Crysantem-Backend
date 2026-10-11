# Mejoras al Builder MyIA - v1.5.2

## A. Potenciación del Chatbot como Elemento Central

### 1. Floating / Embedded Toggle ✅
**Implementado**: Selector de modo de visualización del chat
- **Embedded (Hero Embedded)**: El chat es el cuerpo principal de la página de aterrizaje
- **Floating (Widget Flotante)**: Burbuja en la esquina inferior derecha

**Campo**: `chatMode` en builderConfig
**Valores**: `'embedded'` (default) o `'floating'`

### 2. Campos de Contexto y Quick Prompts ✅
**Implementado**: Módulo para definir la "Personalidad del Agente" y preguntas frecuentes

**Nuevos campos**:
- `agentName`: Nombre personalizado del agente (default: "Asistente Virtual")
- `agentAvatar`: URL del avatar del agente
- `quickPrompts[]`: Array de 4 preguntas frecuentes que aparecen como botones sobre el chat
  - Quick Prompt 1-4 son configurables por el usuario
  - Se muestran como botones clickables en el preview
  - Permiten que el visitante arranque sin lienzo en blanco

### 3. Captura de Leads Directa en el Chat ✅
**Implementado**: Selector de qué datos solicitar al visitante

**Campo**: `leadCapture`
**Valores**:
- `none`: No solicitar datos (default)
- `name`: Solo nombre
- `email`: Solo email
- `phone`: Solo teléfono
- `name_email`: Nombre y email
- `all`: Nombre, email y teléfono

**Nota**: El frontend solicitará estos datos mediante formulario inline en la conversación (la lógica de captura se implementará en el backend del chat)

---

## B. Módulo de Personalización Visual Mínimo pero Efectivo

### 1. Theming Rápido - Simplificado ✅
**Antes**: 10+ fuentes y muchas opciones
**Ahora**: Solo 6 fuentes sans-serif modernas
- Inter (Recomendado)
- Roboto
- Open Sans
- Lato
- Montserrat
- Poppins

**Color primario/marca**: Ya existía (`chatBoxColor`)
- Afecta botones, globos de chat y acentos
- Presets de colores rápidos (Verde, Indigo, Rosa, Naranja, Cian, Violeta)

### 2. Avatar y Nombre del Agente IA ✅
**Nuevos campos**:
- `agentName`: Nombre del agente
- `agentAvatar`: URL del avatar

**Visualización**: Se muestra en el header del chat con avatar + nombre

### 3. Selector de Tipografía Limpia ✅
**Simplificado**: Solo 6 fuentes sans-serif modernas (eliminadas serifas y decorativas)

### 4. Vista Previa Interactiva en Vivo ✅
**Mejorado**: El preview ahora muestra:
- Nombre del agente personalizado
- Avatar del agente
- Quick prompts como botones interactivos
- Hover effects en los botones de quick prompts

**Nota**: El preview sigue siendo en iframe separado, pero actualiza en tiempo real mientras se configura

---

## Archivos Modificados

### Frontend
- `frontend/myia-builder.html` - Agregados nuevos campos de configuración
- `frontend/js/myia-builder.js` - Actualizada lógica para manejar nuevos campos
  - chatMode, agentName, agentAvatar, quickPrompts, leadCapture
  - Simplificadas fuentes a 6 opciones
  - Preview actualizado con nuevos elementos

### Backend
- `backend/routes/myia.js` - Actualizado endpoint /config para guardar nuevos campos
  - chat_mode, agent_name, agent_avatar, quick_prompts, lead_capture

### Migraciones
- `backend/migrate_builder_improvements.sql` - Nuevo script de migración
  - Agrega columnas: chat_mode, agent_name, agent_avatar, quick_prompts, lead_capture
  - Crea índice para chat_mode
  - Agrega constraints CHECK

---

## Flujo de Usuario Mejorado

### Antes:
1. Seleccionar plan
2. Configurar diseño visual (muchas opciones)
3. Configurar prompt
4. Configurar integraciones
5. Pagar

### Ahora:
1. Seleccionar plan
2. Configurar diseño visual (simplificado + modo de chat + agente personalizado + quick prompts + captura de leads)
3. Configurar prompt
4. Configurar integraciones
5. Pagar

**Tiempo estimado**: Reducido de ~20 min a ~10 min gracias a simplificación y quick prompts

---

## Próximos Pasos

1. ✅ Ejecutar `migrate_builder_improvements.sql` en Supabase
2. ⚠️ Implementar lógica de captura de leads en el backend del chat (formulario inline)
3. ⚠️ Implementar modo floating (widget flotante) en el preview y en el chat generado
4. ⚠️ Conectar quick prompts con el sistema de chat para que envíen el mensaje automáticamente al hacer clic

---

## Estado de Implementación

- ✅ Campos de configuración agregados en frontend
- ✅ Preview actualizado con nuevos elementos
- ✅ Backend actualizado para guardar nuevos campos
- ✅ Script de migración creado
- ⚠️ Lógica de captura de leads en chat (pendiente)
- ⚠️ Modo floating/widget (pendiente)
- ⚠️ Quick prompts interactivos en chat real (pendiente)
