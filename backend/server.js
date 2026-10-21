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
// Middleware para asegurar que /api/* nunca responda HTML
app.use('/api', (req, res, next) => {
  // Forzar Content-Type JSON para todas las respuestas de /api/*
  const originalJson = res.json;
  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json');
    return originalJson.call(this, data);
  };
  next();
});

// Aplicar rate limiter solo a rutas API
app.use('/api', generalLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/config', require('./routes/config'));
app.use('/api/myia', require('./routes/myia'));

// Servir archivos estáticos después de las rutas API
if (config.serveFrontend) {
  // Servir archivos HTML específicos directamente
  app.get('*.html', (req, res) => {
    const filePath = path.join(__dirname, '../frontend', req.path);
    if (require('fs').existsSync(filePath)) {
      console.log('Sirviendo archivo HTML:', req.path);
      return res.sendFile(filePath);
    }
    console.log('Archivo HTML no encontrado, sirviendo index.html:', req.path);
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });

  // Servir otros archivos estáticos
  app.use(express.static(path.join(__dirname, '../frontend')));
}

// Ruta catch-all para SPA (después de las rutas API)
// CRÍTICO: Solo aceptar GET para no interferir con POST /api/*
if (config.serveFrontend) {
  app.get('*', (req, res) => {
    // NO servir archivos HTML aquí (ya se manejan arriba)
    // Solo servir index.html para rutas que no son archivos
    if (!req.path.endsWith('.html') && !req.path.includes('.')) {
      res.sendFile(path.join(__dirname, '../frontend/index.html'));
    } else {
      // Para archivos que no son HTML (como imágenes, CSS, JS)
      const filePath = path.join(__dirname, '../frontend', req.path);
      if (require('fs').existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
  });

  // Middleware para rechazar POST que lleguen al catch-all y retornar JSON
  app.use('*', (req, res, next) => {
    if (req.method === 'POST') {
      console.error('POST request reached catch-all - returning JSON error:', req.path);
      return res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
      });
    }
    next();
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
