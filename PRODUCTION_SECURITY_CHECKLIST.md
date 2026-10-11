# 🛡️ CHECKLIST DE SEGURIDAD PARA PRODUCCIÓN - CRYSANTEM V1.4

## 🔴 ACCIONES CRÍTICAS (ANTES DEL DESPLIEGUE)

### 1. Credenciales y Secretos
- [ ] **REVOCAR** credenciales comprometidas en `.env`:
  - [ ] Google Client Secret actual (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)
  - [ ] Brevo API Key actual (xkeysib-504eaa62e105f8cbb3cc02b7e0ef54384c378d54d595bce3c226e2b407470ffd)
- [ ] **GENERAR** nuevas credenciales para producción:
  - [ ] Google OAuth: Crear nuevas credenciales en Google Cloud Console
  - [ ] Brevo: Generar nueva API key en dashboard
  - [ ] JWT Secret: Usar `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - [ ] API Token: Generar token seguro de 32+ caracteres
  - [ ] N8N Webhook Secret: Generar secreto seguro de 32+ caracteres
- [ ] **CONFIGURAR** variables de entorno en servidor:
  - [ ] Crear archivo `.env.production` en servidor (NUNCA subir .env)
  - [ ] Verificar que todas las variables estén configuradas
  - [ ] Set `NODE_ENV=production`
  - [ ] Set `SERVE_FRONTEND=false` (frontend en Hostinger separado)

### 2. Base de Datos (Supabase)
- [ ] **VERIFICAR** configuración de Supabase:
  - [ ] Service Role Key solo usado en backend (NUNCA en frontend)
  - [ ] Anon Key usado en frontend
  - [ ] Row Level Security (RLS) activado en todas las tablas
  - [ ] Políticas RLS configuradas correctamente
- [ ] **ROTAR** claves de Supabase si las actuales están expuestas
- [ ] **VERIFICAR** que no haya datos de prueba en producción

### 3. CORS y Dominios
- [ ] **CONFIGURAR** ALLOWED_ORIGINS en `.env.production`:
  - [ ] Solo dominios de producción: `https://crysantem.tech,https://www.crysantem.tech`
  - [ ] Eliminar localhost y dominios de desarrollo
- [ ] **VERIFICAR** configuración CORS en server.js
- [ ] **TESTEAR** que CORS bloquee peticiones de otros dominios

## 🟡 CONFIGURACIÓN DE SERVIDOR (DONWEB)

### 4. SSL/TLS
- [ ] **CONFIGURAR** certificado SSL/TLS en servidor:
  - [ ] Usar Let's Encrypt (gratuito) o certificado comercial
  - [ ] Forzar redirección HTTP → HTTPS
  - [ ] Configurar protocolos TLSv1.2 y TLSv1.3
  - [ ] Deshabilitar protocolos inseguros (TLSv1.0, TLSv1.1)
- [ ] **VERIFICAR** certificado con: https://www.ssllabs.com/ssltest/

### 5. Firewall y Puertos
- [ ] **CONFIGURAR** firewall (UFW/iptables):
  - [ ] Permitir puerto 22 (SSH) solo desde IPs de confianza
  - [ ] Permitir puerto 80 (HTTP)
  - [ ] Permitir puerto 443 (HTTPS)
  - [ ] Bloquear puerto 3000 (solo acceso local vía Nginx)
  - [ ] Bloquear todos los demás puertos
- [ ] **DESHABILITAR** acceso root directo SSH
- [ ] **CONFIGURAR** autenticación por llaves SSH (no password)

### 6. Gestión de Procesos (PM2)
- [ ] **INSTALAR** PM2 globalmente
- [ ] **CONFIGURAR** ecosystem.config.js
- [ ] **INICIAR** aplicación con PM2
- [ ] **CONFIGURAR** PM2 para iniciar en boot
- [ ] **MONITOREAR** logs: `pm2 logs`
- [ ] **CONFIGURAR** rotación de logs (pm2-logrotate)

### 7. Nginx (si aplica)
- [ ] **CONFIGURAR** proxy reverso con Nginx
- [ ] **CONFIGURAR** archivo nginx.conf (ver archivo provisto)
- [ ] **HABILITAR** compresión gzip
- [ ] **CONFIGURAR** rate limiting en Nginx
- [ ] **CONFIGURAR** headers de seguridad en Nginx
- [ ] **TESTEAR** configuración: `nginx -t`

## 🟢 CONFIGURACIÓN DE APLICACIÓN

### 8. Rate Limiting
- [ ] **REDUCIR** límites de rate limiting para producción:
  - [ ] General: 50 req/15min (desde 100)
  - [ ] Auth: 20 req/15min (desde 100)
  - [ ] AI: 10 req/min (mantener)
  - [ ] Email code: 10 req/15min (desde 20)
- [ ] **TESTEAR** rate limiting con herramientas como Postman

### 9. Validación de Inputs
- [ ] **IMPLEMENTAR** sanitización de inputs (joi o express-validator)
- [ ] **VALIDAR** todos los inputs en controladores
- [ ] **ESCAPAR** outputs para prevenir XSS
- [ ] **USAR** consultas parametrizadas (Supabase ya lo hace)

### 10. Webhooks
- [ ] **IMPLEMENTAR** validación HMAC-SHA256 para webhooks
- [ ] **CONFIGURAR** n8n para enviar firmas HMAC
- [ ] **VERIFICAR** timestamp para prevenir replay attacks
- [ ] **TESTEAR** webhooks con firmas inválidas

### 11. Headers de Seguridad
- [ ] **VERIFICAR** Helmet middleware en server.js
- [ ] **CONFIGURAR** CSP (Content Security Policy)
- [ ] **CONFIGURAR** HSTS (HTTP Strict Transport Security)
- [ ] **CONFIGURAR** X-Frame-Options
- [ ] **CONFIGURAR** X-Content-Type-Options
- [ ] **TESTEAR** headers con: https://securityheaders.com/

### 12. Logging y Monitoreo
- [ ] **CONFIGURAR** nivel de logs (no debug en producción)
- [ ] **VERIFICAR** que no se logueen datos sensibles (passwords, tokens)
- [ ] **CONFIGURAR** rotación de logs
- [ ] **IMPLEMENTAR** sistema de alertas (error rate, uptime)
- [ ] **MONITOREAR** recursos (CPU, memoria, disco)

## 🔵 MONITOREO POST-DESPLIEGUE

### 13. Verificación Inicial
- [ ] **TESTEAR** funcionalidad de registro/login
- [ ] **TESTEAR** Google OAuth
- [ ] **TESTEAR** envío de emails
- [ ] **TESTEAR** endpoints de API
- [ ] **TESTEAR** webhooks n8n
- [ ] **VERIFICAR** que no haya errores en logs

### 14. Monitoreo Continuo
- [ ] **CONFIGURAR** monitoreo de uptime (UptimeRobot, Pingdom)
- [ ] **MONITOREAR** error rate (Sentry, LogRocket)
- [ ] **MONITOREAR** rendimiento (New Relic, Datadog)
- [ ] **REVISAR** logs de acceso y error regularmente
- [ ] **MONITOREAR** uso de recursos en servidor

### 15. Backups
- [ ] **CONFIGURAR** backups automáticos de base de datos (Supabase ya lo hace)
- [ ] **CONFIGURAR** backups de código en servidor
- [ ] **TESTEAR** proceso de restauración de backups
- [ ] **DOCUMENTAR** procedimiento de disaster recovery

## 📋 DOCUMENTACIÓN

### 16. Documentación Operativa
- [ ] **DOCUMENTAR** procedimiento de despliegue
- [ ] **DOCUMENTAR** procedimiento de rollback
- [ ] **DOCUMENTAR** credenciales (en gestor de contraseñas, NO en código)
- [ ] **DOCUMENTAR** puntos de contacto de emergencia
- [ ] **DOCUMENTAR** estructura de archivos y configuración

### 17. Seguridad de Código
- [ ] **REVISAR** código en busca de vulnerabilities (npm audit)
- [ ] **ACTUALIZAR** dependencias a versiones seguras
- [ ] **ELIMINAR** archivos de debugging antes de despliegue
- [ ] **VERIFICAR** que no haya console.log en producción
- [ ] **MINIMIZAR** archivos JS/CSS si aplica

## 🚨 CONTINGENCIA

### 18. Plan de Respuesta a Incidentes
- [ ] **DOCUMENTAR** procedimiento en caso de breach
- [ ] **PREPARAR** equipo de respuesta
- [ ] **CONFIGURAR** canales de comunicación de emergencia
- [ ] **TESTEAR** procedimiento de shutdown rápido
- [ ] **PREPARAR** comunicado público si es necesario

---

## 📊 PUNTUACIÓN DE SEGURIDAD

Completa este checklist antes del despliegue. Una puntuación del 100% es recomendada.

- [ ] **Total completado: ____ / 60**

## 📞 CONTACTOS DE EMERGENCIA

- DevOps Lead: _______________
- Backend Developer: _______________
- Security Consultant: _______________
- Hosting Provider (DonWeb): _______________

---

**Última actualización:** $(date)
**Estado:** Pendiente de revisión
