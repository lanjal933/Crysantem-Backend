# Requisitos de Hosting - Crysantem V1.4

## Requisitos Mínimos

### Backend (Node.js)
- **Node.js**: v18.0.0 o superior
- **NPM**: v9.0.0 o superior
- **RAM**: Mínimo 512MB (recomendado 1GB)
- **CPU**: 1 núcleo (recomendado 2 núcleos)
- **Almacenamiento**: Mínimo 1GB (para node_modules)

### Frontend
- **Almacenamiento**: ~50MB (archivos estáticos)
- **Ancho de banda**: Depende del tráfico, mínimo 10GB/mes

### Servicios Externos (requeridos)
- **Supabase**: Base de datos PostgreSQL gratuita hasta 500MB
- **Servicio de Email**: SendGrid/Mailgun/Brevo (planes gratuitos disponibles)
- **Google Cloud Console**: Para OAuth (gratuito)

---

## Opciones de Hosting

### 1. DonWeb

#### Hosting Compartido con Node.js
- **Costo**: ~$5-10 USD/mes
- **Requisitos**: Verificar que el plan soporte Node.js
- **Ventajas**: Fácil configuración, soporte incluido
- **Desventajas**: Recursos limitados, menos control

#### VPS (Virtual Private Server)
- **Costo**: ~$10-20 USD/mes
- **Requisitos**: Ubuntu 20.04+ o Debian 11+
- **Ventajas**: Control total, escalable
- **Desventajas**: Requiere configuración manual

### 2. Hostinger

#### Hosting Compartido con Node.js
- **Costo**: ~$3-5 USD/mes (plan Premium)
- **Requisitos**: Plan que incluya Node.js
- **Ventajas**: Panel de control intuitivo, buen soporte
- **Desventajas**: Recursos compartidos

#### VPS Cloud
- **Costo**: ~$5-15 USD/mes
- **Requisitos**: Linux (Ubuntu/Debian/CentOS)
- **Ventajas**: Escalable, buen rendimiento
- **Desventajas**: Configuración técnica

### 3. Alternativas

#### Render.com
- **Costo**: Gratuito (hasta ciertos límites), $7/mes para starter
- **Ventajas**: Despliegue automático desde GitHub, fácil de usar
- **Desventajas**: Tiempo de inicio en tier gratuito

#### Railway.app
- **Costo**: Gratuito (con límites), $5/mes para starter
- **Ventajas**: Soporte nativo de Node.js, integración con Supabase
- **Desventajas**: Límites de uso en plan gratuito

#### DigitalOcean
- **Costo**: $4-6 USD/mes (Droplet básico)
- **Ventajas**: Muy estable, documentación excelente
- **Desventajas**: Configuración manual

---

## Configuración de Servidor

### Requisitos de Software (VPS)

#### Sistema Operativo
- Ubuntu 20.04 LTS o superior (recomendado)
- Debian 11 o superior
- CentOS 8 o superior

#### Software instalado
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginx (servidor web)
sudo apt-get install nginx

# PM2 (gestor de procesos)
sudo npm install -g pm2

# Git (para despliegue)
sudo apt-get install git
```

#### Firewall
```bash
# UFW (Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

---

## Costos Estimados Mensuales

### Opción Económica (Hosting Compartido)
- Hosting con Node.js: $5-10 USD
- Supabase: Gratuito
- Email (Brevo): Gratuito (hasta 300 emails/día)
- **Total**: $5-10 USD/mes

### Opción Recomendada (VPS)
- VPS (1GB RAM, 1 CPU): $5-10 USD
- Dominio: $10-15 USD/año
- SSL: Gratuito (Let's Encrypt)
- Supabase: Gratuito
- Email (Brevo): Gratuito
- **Total**: $5-10 USD/mes + dominio anual

### Opción Premium (VPS Mejorado)
- VPS (2GB RAM, 2 CPU): $15-25 USD
- Dominio: $10-15 USD/año
- Email (SendGrid/Mailgun): $10-20 USD/mes
- **Total**: $25-45 USD/mes

---

## Checklist de Pre-Despliegue

### Dominio
- [ ] Dominio comprado y configurado
- [ ] DNS apuntando al servidor

### Servidor
- [ ] Servidor contratado
- [ ] Node.js instalado (v18+)
- [ ] Nginx configurado
- [ ] SSL certificado instalado
- [ ] Firewall configurado

### Servicios Externos
- [ ] Cuenta de Supabase creada
- [ ] Tablas de base de datos creadas
- [ ] Servicio de email configurado
- [ ] Google OAuth configurado

### Seguridad
- [ ] Contraseñas seguras generadas
- [ ] Variables de entorno configuradas
- [ ] CORS configurado correctamente
- [ ] Rate limiters activos

---

## Recomendaciones

### Para Comenzar (Pequeño tráfico)
- Hosting compartido con Node.js en Hostinger o DonWeb
- Plan gratuito de Brevo para emails
- Supabase gratuito

### Para Crecimiento (Tráfico medio)
- VPS en DigitalOcean o Hostinger Cloud
- Plan gratuito de Brevo (actualizar si necesario)
- Supabase Pro (si excede límites gratuitos)

### Para Producción (Alto tráfico)
- VPS con más recursos (2GB+ RAM)
- Servicio de email pago (SendGrid/Mailgun)
- CDN para archivos estáticos (Cloudflare)
- Balanceador de carga si es necesario

---

## Soporte y Documentación

- Documentación de despliegue: `DEPLOYMENT.md`
- Guía de configuración: `AGENTS.md`
- Ejemplo de variables: `backend/env.production.example`
- Script de preparación: `prepare-deploy.sh`
