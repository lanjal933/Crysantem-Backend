// === PRODUCTION CONFIGURATION ===
// URL del backend en Render
const BACKEND_API_URL = 'https://crysantem-backend.onrender.com';

// Para desarrollo local, descomentar la siguiente línea:
// const BACKEND_API_URL = window.location.origin;

const API_CONFIG = {
  backendUrl: BACKEND_API_URL,
  endpoints: {
    auth: {
      register: '/api/auth/register',
      login: '/api/auth/login',
      google: '/api/auth/google',
      profile: '/api/auth/profile',
    },
    ai: {
      message: '/api/ai/message',
    },
    config: '/api/config',
  },
};
