const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');
const { aiMessageValidation } = require('../middleware/validator');

const sendMessage = async (req, res) => {
  try {
    const { message, userId } = req.body;

    // Validación ya manejada por middleware aiMessageValidation

    const webhookUrl = config.n8n.webhookUrl;

    // Generar timestamp y firma HMAC para el webhook
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      message: message.trim(),
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
    });

    const signature = crypto
      .createHmac('sha256', config.security.n8nWebhookSecret)
      .update(timestamp + payload)
      .digest('hex');

    const response = await axios.post(
      webhookUrl,
      {
        message: message.trim(),
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': timestamp.toString(),
        },
        timeout: 30000,
      }
    );

    res.json({
      success: true,
      response: response.data.output || response.data.message || response.data,
    });
  } catch (error) {
    console.error('Error al enviar mensaje a n8n:', error.message);

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'El servicio tardó demasiado en responder' });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Error en el servicio de IA',
        details: error.response.data,
      });
    }

    res.status(500).json({ error: 'No pudimos conectar con el servicio. Intenta nuevamente.' });
  }
};

module.exports = { sendMessage };
