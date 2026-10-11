# MyIA - Flujo Completo de Onboarding

## Nuevo Flujo Implementado

### 1. Vista Principal: Mis Apps
**Archivo:** `myia-home.html`

Al ingresar al dashboard, el usuario ve:
- **Listado de Apps:** Tarjetas con Nombre, Slug, Estado, Plan, Modelo de IA, consumo de caracteres
- **Botón "Crear Nueva Página":** Inicia el flujo de creación
- **Acciones por App:**
  - **Editar:** Carga la configuración en el constructor
  - **Ver:** Abre la landing pública
  - **Resumen Técnico:** Muestra el resumen técnico de la app

### 2. Selección de Plan
**Archivo:** `myia-plans.html`

4 planes disponibles:
- **Básico ($75):** Gemini Flash, 50,000 caracteres/mes
- **Profesional ($150):** Gemini Flash, 100,000 caracteres/mes
- **Business ($300):** Gemini Pro, 500,000 caracteres/mes
- **Enterprise ($500):** Gemini Pro, 2,000,000 caracteres/mes

Cada plan muestra:
- Modelo de IA asignado
- Características incluidas
- Límite de caracteres

### 3. Autenticación OAuth (Simulada)
**Archivo:** `myia-oauth.html`

Simula autenticación con Google:
- Muestra permisos/scopes según el plan
- Genera userId simulado
- Registra usuario en backend
- Redirige al constructor

### 4. Constructor Visual Mejorado
**Archivo:** `myia-builder.html`

Opciones de personalización:
- **Negocio:** Nombre, Slug, Logo (upload + URL + tamaño)
- **Fondo:** Tipo (liso, degradado, luminoso) + color
- **Tipografía:** 10 fuentes seleccionables
- **Chat:** Posición (derecha/izquierda), Bordes (redondeados/rectos/píldora), Color
- **Header:** Tema (oscuro/claro)
- **Redes Sociales:** Facebook, Instagram, LinkedIn
- **Agente IA:** Mensaje de bienvenida, Instrucciones (system_prompt)
- **Consumo:** Barra visual de caracteres usados vs límite

### 5. Resumen Técnico Pre-Creación
**Archivo:** `myia-summary.html`

Pantalla intermedia que muestra:
- **Datos del Negocio:** Nombre, Slug, URL final
- **Diseño Visual:** Colores, fuentes, estilos
- **Configuración del Agente:** Modelo, Plan, Límite, Welcome message
- **System Prompt:** El prompt exacto que se guardará en Supabase
- **Botón "¡Crear Página!":** Guarda definitivamente en Supabase

## Campos Nuevos en SQL

```sql
-- Tabla myia_page_config con nuevos campos:
chat_position TEXT DEFAULT 'right'
border_radius TEXT DEFAULT 'rounded'
header_theme TEXT DEFAULT 'dark'
ai_model TEXT DEFAULT 'gemini-flash'
character_limit INTEGER DEFAULT 50000
character_usage INTEGER DEFAULT 0
plan TEXT DEFAULT 'basic'
social_links JSONB DEFAULT '{}'::jsonb
google_id TEXT (en myia_users)
```

## API Endpoints

```
POST /api/myia/oauth-register - Registrar usuario OAuth
POST /api/myia/config - Guardar/actualizar configuración (con nuevos campos)
GET  /api/myia/user-apps/:userId - Obtener todas las apps del usuario
GET  /api/myia/config-by-id/:id - Obtener configuración por ID
GET  /api/myia/page/:slug - Obtener página pública
```

## Flujo Completo

1. Usuario entra a MyIA → `myia-home.html`
2. Hace clic en "Crear Nueva Página" → `myia-plans.html`
3. Selecciona plan → Se guarda en localStorage
4. Continúa a OAuth → `myia-oauth.html`
5. Simula autenticación → Genera userId
6. Redirige a constructor → `myia-builder.html`
7. Configura todos los aspectos visuales y de IA
8. Va a resumen → `myia-summary.html`
9. Revisa el resumen técnico
10. Hace clic en "¡Crear Página!" → Guarda en Supabase
11. Redirige a home → `myia-home.html`

## Archivos Creados

- `myia-home.html` + `js/myia-home.js` - Vista principal de apps
- `myia-plans.html` + `js/myia-plans.js` - Selección de planes
- `myia-oauth.html` + `js/myia-oauth.js` - Autenticación simulada
- `myia-builder.html` + `js/myia-builder.js` - Constructor visual mejorado
- `myia-summary.html` + `js/myia-summary.js` - Resumen técnico

## Pasos para Ejecutar

1. **Ejecutar SQL actualizado en Supabase:**
   - Ve a: https://supabase.com/dashboard/project/pazpomltsuerftqgvmq/sql/new
   - Ejecuta: `backend/create_user_tables.sql` (versión actualizada)

2. **Iniciar servidor:**
   ```bash
   cd backend
   npm start
   ```

3. **Probar el flujo:**
   - Ve a: http://localhost:3000
   - Haz clic en "MyIA" → "Comenzar"
   - Selecciona un plan
   - Simula OAuth
   - Configura el constructor
   - Revisa el resumen
   - Crea la página

## Mejoras Implementadas

✅ Vista principal "Mis Apps" con gestión
✅ Flujo de creación con 4 planes
✅ Autenticación OAuth simulada con scopes
✅ Constructor visual mejorado (posiciones, bordes, header, redes)
✅ Selector de IA (Gemini Flash/Pro)
✅ Traducción tokens → caracteres
✅ Pantalla de resumen técnico pre-creación
✅ Botón "¡Crear Página!" que guarda en Supabase
✅ SQL actualizado con nuevos campos
✅ Backend actualizado con nuevo endpoint OAuth
