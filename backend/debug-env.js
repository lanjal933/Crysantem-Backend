require('dotenv').config();

console.log('=== Configuración de Email ===');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'NO CONFIGURADO');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'NO CONFIGURADO');
console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE || 'NO CONFIGURADO');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NO CONFIGURADO');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***CONFIGURADO***' : 'NO CONFIGURADO');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NO CONFIGURADO');
console.log('============================');
