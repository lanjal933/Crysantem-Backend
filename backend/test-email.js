require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa');

    const mailOptions = {
      from: `"Crysantem" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_USER,
      subject: 'Prueba de envío de email',
      html: '<h2>¡Funciona!</h2><p>El sistema de email está configurado correctamente.</p>',
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email de prueba enviado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEmail();
