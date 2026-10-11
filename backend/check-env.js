require('dotenv').config();
const config = require('./config/config');

console.log('=== Configuración cargada ===');
console.log('EMAIL_HOST:', config.email.host);
console.log('EMAIL_PORT:', config.email.port);
console.log('EMAIL_SECURE:', config.email.secure);
console.log('EMAIL_USER:', config.email.user);
console.log('EMAIL_PASS:', config.email.pass ? '***CONFIGURADO***' : 'NO CONFIGURADO');
console.log('EMAIL_FROM:', config.email.from);
console.log('============================');
