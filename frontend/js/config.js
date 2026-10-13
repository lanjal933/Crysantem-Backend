// === PRODUCTION CONFIGURATION ===
// URL del backend en Render
if (!window.BACKEND_API_URL) {
  window.BACKEND_API_URL = 'https://crysantem-backend.onrender.com';
}

// Para desarrollo local, descomentar la siguiente línea:
// window.BACKEND_API_URL = window.location.origin;

if (!window.API_CONFIG) {
  window.API_CONFIG = {
    backendUrl: window.BACKEND_API_URL,
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
}
