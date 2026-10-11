#!/bin/bash

# Script para preparar el proyecto para despliegue
# Uso: ./prepare-deploy.sh

echo "=== Preparando Crysantem V1.4 para despliegue ==="

# 1. Limpiar archivos temporales
echo "Limpiando archivos temporales..."
rm -f backend/debug-env.js
rm -f backend/test-email.js
rm -f backend/check-env.js

# 2. Crear archivo .env de ejemplo si no existe
if [ ! -f "backend/.env.example" ]; then
    echo "Copiando .env.example..."
    cp backend/env.production.example backend/.env.example
fi

# 3. Crear archivo de configuración de PM2
echo "Creando archivo ecosystem.config.js para PM2..."
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'crysantem',
    script: './backend/server.js',
    cwd: '/ruta/a/tu/proyecto',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# 4. Crear archivo de información de despliegue
echo "Creando archivo de información..."
cat > DEPLOYMENT_INFO.txt <<EOF
=== INFORMACIÓN DE DESPLIEGUE ===
Fecha: $(date)
Versión: 1.4

Pasos completados:
- Archivos temporales eliminados
- Ecosystem PM2 creado
- Gitignore configurado

Próximos pasos:
1. Configurar backend/.env con credenciales de producción
2. Ejecutar migraciones en Supabase
3. Subir archivos al servidor
4. Instalar dependencias: npm install --production
5. Iniciar con PM2: pm2 start ecosystem.config.js
6. Configurar Nginx/Apache
7. Configurar SSL

Ver DEPLOYMENT.md para instrucciones detalladas.
EOF

echo "=== Preparación completada ==="
echo "Revisa el archivo DEPLOYMENT.md para instrucciones de despliegue"
