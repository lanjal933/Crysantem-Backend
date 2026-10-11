const crypto = require('crypto');
const config = require('../config/config');

/**
 * Middleware para validar webhooks con HMAC-SHA256
 * Protege contra:
 * - Peticiones falsificadas
 * - Replay attacks (timestamp)
 * - Modificación del payload
 */
const validateWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const payload = JSON.stringify(req.body);

  // Verificar que existan los headers necesarios
  if (!signature || !timestamp) {
    console.warn('Webhook rechazado: Faltan headers de autenticación');
    return res.status(401).json({
      error: 'Faltan headers de autenticación (x-webhook-signature, x-webhook-timestamp)'
    });
  }

  // Verificar que la petición no sea vieja (replay attack protection)
  const now = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp);

  if (isNaN(requestTime)) {
    console.warn('Webhook rechazado: Timestamp inválido');
    return res.status(401).json({ error: 'Timestamp inválido' });
  }

  // Rechazar peticiones mayores a 5 minutos (300 segundos)
  if (now - requestTime > 300) {
    console.warn('Webhook rechazado: Petición expirada (replay attack protection)');
    return res.status(401).json({ error: 'Petición expirada' });
  }

  // Calcular HMAC-SHA256 esperado
  // Formato: HMAC(timestamp + payload)
  const expectedSignature = crypto
    .createHmac('sha256', config.security.n8nWebhookSecret)
    .update(timestamp + payload)
    .digest('hex');

  // Verificar firma
  if (signature !== expectedSignature) {
    console.warn('Webhook rechazado: Firma inválida');
    console.warn('Expected:', expectedSignature);
    console.warn('Received:', signature);
    return res.status(401).json({ error: 'Firma inválida' });
  }

  // Firma válida, continuar
  console.log('Webhook validado exitosamente');
  next();
};

/**
 * Middleware simplificado para webhooks que solo usan header en texto plano
 * (para compatibilidad con sistemas que no pueden enviar HMAC)
 * Este es menos seguro pero mejor que nada
 */
const validateWebhookSimple = (req, res, next) => {
  const secret = req.headers['x-webhook-secret'];

  if (!secret) {
    console.warn('Webhook rechazado: Falta header x-webhook-secret');
    return res.status(401).json({ error: 'Falta header de autenticación' });
  }

  if (secret !== config.security.n8nWebhookSecret) {
    console.warn('Webhook rechazado: Secreto inválido');
    return res.status(401).json({ error: 'Secreto inválido' });
  }

  console.log('Webhook validado (modo simple)');
  next();
};

module.exports = {
  validateWebhookSignature,
  validateWebhookSimple
};
