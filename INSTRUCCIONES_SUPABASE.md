# Instrucciones para Configurar Supabase

## 📋 Pasos Obligatorios

El proyecto ya tiene configuradas las tablas `user_google_tokens` y `user_token_limits` en Supabase. Solo necesitas crear la tabla `users`.

### 1. Acceder al SQL Editor

1. Ve a: https://pazpomltsuerftqgkvmq.supabase.co
2. Inicia sesión con tu cuenta
3. Navega a: **SQL Editor** (en el menú lateral izquierdo)

### 2. Ejecutar el Script de Users

1. Abre el archivo: `backend/create_tables.sql`
2. Copia todo el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **Run** (o presiona Ctrl+Enter)

Este script creará:
- Tabla `users` (usuarios)
- Índices para optimización
- Triggers para actualización automática de timestamps

**Nota:** Las tablas `user_google_tokens` y `user_token_limits` ya existen según el esquema proporcionado. No es necesario recrearlas.

### 3. Verificar la Creación de Tablas

Después de ejecutar el script, verifica en el **Table Editor** que las siguientes tablas existan:

- ✅ `users` (nueva)
- ✅ `user_google_tokens` (ya existe)
- ✅ `user_token_limits` (ya existe)

## 🔐 Configuración de Google OAuth en Supabase

### Opcional pero Recomendado

Si deseas usar Supabase Auth además del backend:

1. Ve a **Authentication** → **Providers**
2. Habilita **Google**
3. Configura:
   - Google Client ID: `your-google-client-id`
   - Google Client Secret: `your-google-client-secret`
   - Redirect URI: `https://crysantem.tech/auth/callback`

**Nota:** La aplicación actual usa OAuth implementado en el backend, no Supabase Auth. Esta configuración es opcional para uso futuro.

## ⚠️ Solución de Problemas

### Error: "relation already exists"

Si al ejecutar el script aparece este error, significa que las tablas ya existen. Puedes:

1. Ignorar el error y continuar, o
2. Eliminar las tablas existentes y volver a ejecutar el script

### Error: "function already exists"

Similar al anterior, las funciones/triggers ya existen. Es seguro continuar.

### Error: "permission denied"

Verifica que estás usando la **Service Role Key** en el backend (configurado en `.env`).

## 🚀 Una Vez Configurado

1. Ejecuta el backend:
   ```bash
   cd backend
   npm start
   ```

2. Accede a: http://localhost:3000

3. Prueba el registro de un usuario para verificar que todo funciona correctamente.

---

**¿Necesitas ayuda?** Revisa el README.md principal o contacta a: consultas@crysantem.tech
