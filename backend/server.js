require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/config');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// Trust proxy específico para Render (1 nivel de proxy)
app.set('trust proxy', 1);

// Log variables de entorno al inicio
console.log('=== VARIABLES DE ENTORTE ===');
console.log('MP_ACCESS_TOKEN configurado:', !!process.env.MP_ACCESS_TOKEN);
console.log('MP_ACCESS_TOKEN length:', process.env.MP_ACCESS_TOKEN?.length || 0);
console.log('SUPABASE_URL configurado:', !!process.env.SUPABASE_URL);
console.log('GOOGLE_CLIENT_ID configurado:', !!process.env.GOOGLE_CLIENT_ID);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('APP_URL:', process.env.APP_URL);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000", "https://crysantem-backend.onrender.com", "https://accounts.google.com", "https://oauth2.googleapis.com", "https://www.googleapis.com", "https://api.crysantem.tech"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      mediaSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CRÍTICO: Rutas API primero (antes de servir frontend estático)
// Aplicar rate limiter solo a rutas API
app.use('/api', generalLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/config', require('./routes/config'));
app.use('/api/myia', require('./routes/myia'));

// Endpoint dedicado para n8n fuera de /api para evitar conflictos con SPA catch-all
// Ruta: /internal/n8n/get-google-tokens
// No está bajo /api, así que el SPA catch-all no lo intercepta
const myiaRouter = require('./routes/myia');
const getGoogleTokensHandler = myiaRouter.stack.find(layer => layer.route?.path === '/get-google-tokens' && layer.route?.methods.post);
if (getGoogleTokensHandler) {
  app.post('/internal/n8n/get-google-tokens', generalLimiter, getGoogleTokensHandler.handle);
  console.log('✅ Endpoint dedicado para n8n registrado: /internal/n8n/get-google-tokens');
}

// Servir archivos estáticos en ruta específica /frontend en lugar de catch-all global
// Esto evita que el catch-all intercepte rutas API
if (config.serveFrontend) {
  // Servir archivos estáticos bajo /frontend
  app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

  // SPA catch-all solo para /frontend (no intercepta /api ni /internal)
  app.get('/frontend/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });

  // Redirigir raíz a /frontend
  app.get('/', (req, res) => {
    res.redirect('/frontend/');
  });
}

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Ambiente: ${config.nodeEnv}`);
  if (config.serveFrontend) {
    console.log(`Frontend servido desde: ${path.join(__dirname, '../frontend')}`);
  }
});
