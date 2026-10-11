# Crysantem Frontend

Frontend estático para Crysantem - Sitio web y sistema MyIA.

## 📋 Configuración Actual

El frontend está configurado para conectarse al backend en Render:

**Backend URL**: `https://crysantem-backend.onrender.com`

## 🚀 Despliegue en Producción

### Opción 1: Hostinger (cPanel)

1. **Subir archivos:**
   - Comprimir la carpeta `frontend/` en un ZIP
   - Subir a `public_html/` en File Manager de Hostinger
   - Extraer el ZIP

2. **Configurar .htaccess:**
   - El archivo `.htaccess` ya está incluido
   - Controla cache, HTTPS, CORS y compresión

3. **Verificar conexión:**
   - Abre el sitio web
   - Abre la consola del navegador (F12)
   - Debería ver requests a `https://crysantem-backend.onrender.com/api/...`

### Opción 2: Vercel

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Desplegar:**
   ```bash
   cd frontend
   vercel
   ```

3. **Configurar dominio personalizado** en el dashboard de Vercel

### Opción 3: Netlify

1. **Subir archivos:**
   - Arrastra la carpeta `frontend/` a Netlify

2. **Configurar _redirects:**
   ```text
   /* /index.html 200
   ```

3. **Configurar _headers:**
   ```text
   /*
     X-Frame-Options: DENY
     X-Content-Type-Options: nosniff
     Referrer-Policy: strict-origin-when-cross-origin
   ```

## 🔧 Configuración Local

Para desarrollo local, cambia la URL del backend en `js/config.js`:

```javascript
// Descomentar para desarrollo local
const BACKEND_API_URL = window.location.origin;

// Comentar para producción
// const BACKEND_API_URL = 'https://crysantem-backend.onrender.com';
```

## 📦 Control de Cache

### Versión de Cache

Los archivos tienen versiones en el query string para invalidar cache:

```html
<link rel="stylesheet" href="css/style.css?v=4.0">
<script src="js/config.js?v=4.0"></script>
```

**Versión actual**: 4.0

Para actualizar cache después de cambios:
1. Incrementar el número de versión en todos los archivos
2. Subir los archivos actualizados

### .htaccess (Hostinger)

El archivo `.htaccess` controla:
- ✅ **No cache** para HTML, JS, CSS (cambios instantáneos)
- ✅ **Cache agresivo** para imágenes y videos (1 año)
- ✅ **Compresión GZIP** para HTML, CSS, JS
- ✅ **HTTPS redirect** automático
- ✅ **CORS headers** para el backend

## 🔐 Configuración de CORS

El backend en Render debe permitir tu dominio frontend.

**Variables de entorno en Render:**
```
ALLOWED_ORIGINS=https://tu-dominio.com,https://crysantem-backend.onrender.com
```

## 📝 Estructura de Archivos

```
frontend/
├── css/
│   └── style.css          # Estilos principales
├── js/
│   ├── config.js          # Configuración API (v4.0)
│   ├── main.js            # Lógica principal
│   ├── main-new.js        # Nueva lógica
│   └── myia-*.js          # Sistema MyIA
├── images/                # Imágenes del sitio
├── videos/                # Videos del portfolio
├── IMG/
│   └── imagenes_markdown/ # Imágenes para markdown
├── index.html            # Página principal
├── myia-*.html           # Páginas del sistema MyIA
└── .htaccess             # Configuración de servidor
```

## 🧪 Testing Local

1. **Iniciar servidor local:**
   ```bash
   cd backend
   node server.js
   ```

2. **Abrir frontend:**
   - Cambiar `config.js` a modo local
   - Abrir `http://localhost:3000` en navegador

3. **Verificar:**
   - Login funciona
   - Google OAuth funciona
   - MyIA funciona
   - Dashboard carga

## 🐛 Troubleshooting

### Frontend no conecta al backend

**Solución:**
1. Verificar `js/config.js` tiene la URL correcta
2. Verificar CORS en backend está configurado
3. Verificar backend está corriendo
4. Revisar console del navegador para errores

### Cache antiguo persiste

**Solución:**
1. Incrementar versión de cache (v4.0 → v4.1)
2. Limpiar cache del navegador (Ctrl+Shift+R)
3. Verificar .htaccess está configurado

### CORS errors

**Solución:**
1. Agregar dominio frontend a `ALLOWED_ORIGINS` en Render
2. Verificar backend tiene headers CORS correctos
3. Verificar protocolo coincide (HTTP vs HTTPS)

## 📞 Soporte

Para soporte técnico:
- Email: consultas@crysantem.tech
- Web: https://crysantem.tech

---

**Desarrollado para Crysantem** 🤖
