# MyIA - Guía de Configuración

## Pasos para Configurar MyIA

### 1. Ejecutar SQL en Supabase

Ve a: https://supabase.com/dashboard/project/pazpomltsuerftqgvmq/sql/new

Copia y ejecuta el contenido de: `backend/create_user_tables.sql`

Esto creará:
- Tabla `myia_users` - Para usuarios y refresh tokens
- Tabla `myia_page_config` - Para configuración de páginas IA

### 2. Verificar Tablas

Ve a: https://supabase.com/dashboard/project/pazpomltsuerftqgvmq/database/tables

Deberías ver:
- `myia_users`
- `myia_page_config`

### 3. Iniciar el Servidor

```bash
cd backend
npm start
```

El servidor estará en: http://localhost:3000

### 4. Usar MyIA

1. Ve a: http://localhost:3000
2. En la navbar, haz clic en "MyIA"
3. Verás la nueva sección con el botón "Comenzar"
4. Haz clic en "Comenzar" para ir al dashboard

### 5. Características del Dashboard

**Sección "Mis Apps":**
- Lista de todas las apps creadas por el usuario
- Botón "+ Nueva App" para crear una nueva
- Cada app muestra:
  - Nombre del negocio
  - Slug (URL)
  - Estado (Activa/Inactiva)
  - Botón "Editar" - carga la configuración en el formulario
  - Botón "Ver página" - abre la página en nueva pestaña

**Panel de Configuración (con scroll independiente):**
- El panel izquierdo tiene scroll vertical independiente
- Puedes configurar todo cómodamente mientras el preview se mantiene fijo

**Información del Negocio:**
- Nombre (máximo 50 caracteres)
- Slug (máximo 40 caracteres)

**Logo:**
- Subir archivo local (PNG/JPG) - se convierte a base64 automáticamente
- O pegar URL del logo
- Tamaño ajustable (50px - 200px)

**Fondo:**
- Liso (color sólido)
- Degradado (dos colores)
- Luminoso (efecto glow)
- Selector de color

**Tipografía:**
- 10 fuentes seleccionables:
  - Inter
  - Playfair Display
  - Roboto
  - Open Sans
  - Lato
  - Montserrat
  - Poppins
  - Raleway
  - Source Sans Pro
  - Merriweather
- Fuente diferente para título (opcional)

**Caja de Chat:**
- 5 diseños:
  - Moderno
  - Clásico
  - Minimal
  - Neón
  - Glass
- Color de acento personalizable

**Diseño de Página:**
- 5 layouts predefinidos:
  - Diseño 1: Centrado
  - Diseño 2: Izquierda
  - Diseño 3: Derecha
  - Diseño 4: Grid
  - Diseño 5: Full

**Agente IA:**
- Mensaje de bienvenida (máximo 200 caracteres)
- Instrucciones del sistema (máximo 1000 caracteres)

### 6. Funcionalidades Implementadas

✅ **Límites de texto en inputs:**
- business_name: maxlength="50"
- slug: maxlength="40"
- welcome_message: maxlength="200"
- system_prompt: maxlength="1000"

✅ **Scroll independiente en panel de configuración:**
- max-height: 85vh
- overflow-y: auto

✅ **Subida de logo local:**
- Input type="file" accept="image/png, image/jpeg"
- FileReader convierte a base64
- Preview se actualiza en tiempo real

✅ **Persistencia completa en Supabase:**
- Todos los campos se guardan en `myia_page_config`
- system_prompt, welcome_message, colores, fuentes, etc.
- Guardado y actualización funcionan correctamente

✅ **Sección "Mis Apps":**
- Lista todas las apps del usuario
- Botón "Editar" carga configuración
- Botón "Ver página" abre la app
- Botón "+ Nueva App" resetea el formulario

### 7. API Endpoints

```
POST /api/myia/config - Guardar/actualizar configuración
GET  /api/myia/config/:userId - Obtener configuración del usuario
GET  /api/myia/user-apps/:userId - Obtener todas las apps del usuario
GET  /api/myia/config-by-id/:id - Obtener configuración por ID
GET  /api/myia/page/:slug - Obtener página pública
POST /api/myia/token - Guardar refresh token
```

### 8. Próximos Pasos

Para completar MyIA:

1. **Autenticación en el dashboard:**
   - El usuario debe estar logueado antes de usar el dashboard
   - El userId se guarda en localStorage

2. **Generar páginas HTML reales:**
   - Crear endpoint que genere el HTML
   - Guardar archivos o servir dinámicamente

3. **Conectar con n8n:**
   - El template ya tiene el código para conectar
   - Solo falta configurar el webhook URL

4. **Hacer públicas las páginas:**
   - Implementar ruta `/myia/:slug`
   - Servir las páginas configuradas

## Troubleshooting

**Error: "relation does not exist"**
- El SQL no se ejecutó correctamente
- Ejecuta `backend/create_user_tables.sql` nuevamente

**Error: "Por favor inicia sesión primero"**
- Necesitas implementar el flujo de autenticación
- El userId debe estar en localStorage

**El preview no funciona**
- Verifica que el servidor esté corriendo
- Revisa la consola del navegador para errores

**No se ve la sección "Mis Apps"**
- Asegúrate de que el userId esté en localStorage
- Verifica que el endpoint `/api/myia/user-apps/:userId` funcione

## Notas

- El backend Express sirve el frontend automáticamente
- Las configuraciones se guardan en Supabase
- El preview se genera en tiempo real en el navegador
- No hay dependencias complejas, solo HTML/CSS/JS vanilla
- El panel de configuración tiene scroll independiente para mejor UX
