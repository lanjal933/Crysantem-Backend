const axios = require('axios');
const config = require('../config/config');

async function sendVerificationCode(email, code) {
  // Siempre mostrar el código en consola como respaldo
  console.log('=== CÓDIGO DE VERIFICACIÓN ===');
  console.log(`Email: ${email}`);
  console.log(`Código: ${code}`);
  console.log('==============================');

  // Verificar si hay API key de Brevo configurada
  if (!config.email.apiKey) {
    console.warn('No hay API key de Brevo configurada. Solo se mostrará el código en consola.');
    return { success: true };
  }

  try {
    console.log('Intentando enviar email a:', email);
    console.log('Usando sender:', config.email.from);

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: config.email.fromName,
          email: config.email.from,
        },
        to: [
          {
            email: email,
          },
        ],
        subject: 'Tu código de verificación - Crysantem',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00ff88;">Bienvenido a Crysantem</h2>
            <p>Usa el siguiente código para iniciar sesión:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${code}</span>
            </div>
            <p>Este código expirará en 10 minutos.</p>
            <p style="color: #666; font-size: 14px;">Si no solicitaste este código, puedes ignorar este email.</p>
          </div>
        `,
      },
      {
        headers: {
          'api-key': config.email.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Respuesta de Brevo:', response.data);
    console.log('Email enviado exitosamente a:', email);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar email:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    // Aún retornar success si el email falla, porque el código está en consola
    return { success: true };
  }
}

module.exports = { sendVerificationCode };
