#!/bin/bash

# === CRYSANTEM BACKEND DEPLOYMENT SCRIPT ===
# Uso: ./deploy.sh [environment]
# Ejemplo: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
BACKUP_DIR="/var/backups/crysantem"
DEPLOY_DIR="/var/www/crysantem-backend"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Iniciando despliegue de Crysantem Backend [$ENVIRONMENT]"
echo "Timestamp: $TIMESTAMP"

# 1. Crear backup del código actual
if [ -d "$DEPLOY_DIR" ]; then
    echo "📦 Creando backup..."
    mkdir -p "$BACKUP_DIR"
    tar -czf "$BACKUP_DIR/crysantem-backend_$TIMESTAMP.tar.gz" -C "$DEPLOY_DIR" .
    echo "✅ Backup creado: $BACKUP_DIR/crysantem-backend_$TIMESTAMP.tar.gz"
fi

# 2. Instalar dependencias
echo "📦 Instalando dependencias..."
cd "$DEPLOY_DIR"
npm ci --production

# 3. Verificar archivo .env
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo "❌ ERROR: Archivo .env.$ENVIRONMENT no encontrado"
    exit 1
fi

# Copiar .env correspondiente
cp ".env.$ENVIRONMENT" .env
echo "✅ Archivo .env configurado"

# 4. Verificar configuración
echo "🔍 Verificando configuración..."
node -e "require('./config/config'); console.log('✅ Configuración válida')"

# 5. Reiniciar PM2
echo "🔄 Reiniciando aplicación con PM2..."
if pm2 list | grep -q "crysantem-backend"; then
    pm2 restart crysantem-backend
else
    pm2 start ecosystem.config.js --env $ENVIRONMENT
fi

# 6. Verificar estado
echo "📊 Estado de la aplicación:"
pm2 status crysantem-backend

# 7. Verificar logs recientes
echo "📋 Logs recientes:"
pm2 logs crysantem-backend --lines 20 --nostream

echo "✅ Despliegue completado exitosamente!"
