require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  serveFrontend: process.env.SERVE_FRONTEND === 'true',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },

  email: {
    apiKey: process.env.BREVO_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@crysantem.tech',
    fromName: process.env.EMAIL_FROM_NAME || 'Crysantem',
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },

  security: {
    apiToken: process.env.API_TOKEN,
    n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET,
    jwtSecret: process.env.JWT_SECRET,
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL,
  },
};
