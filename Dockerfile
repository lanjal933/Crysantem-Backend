FROM node:18-alpine

WORKDIR /app

# Copiar archivos de package desde backend
COPY backend/package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar código fuente desde backend
COPY backend/ ./

# Exponer puerto
EXPOSE 3000

# Iniciar servidor
CMD ["node", "server.js"]
