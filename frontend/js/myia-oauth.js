// Configuración de planes y scopes
const PLAN_PRICES = {
  responde: {
    name: '01 - Responde',
    implementation: '$0',
    monthly: '$0',
    aiModel: 'Gemini Flash',
    tokenLimit: '10,000/mes',
    scopes: ['email', 'profile']
  },
  asiste: {
    name: '02 - Asiste',
    implementation: '$99',
    monthly: '$49/mes',
    aiModel: 'Gemini Flash',
    tokenLimit: '50,000/mes',
    scopes: ['email', 'profile', 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly']
  },
  automatiza: {
    name: '03 - Automatiza',
    implementation: '$199',
    monthly: '$99/mes',
    aiModel: 'Gemini Pro',
    tokenLimit: '100,000/mes',
    scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar']
  },
  intelligence: {
    name: '04 - Crysantem Intelligence',
    implementation: '$399',
    monthly: '$199/mes',
    aiModel: 'Gemini Pro',
    tokenLimit: '∞',
    scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/gmail.send']
  }
};

// Nombres de scopes para mostrar
const SCOPE_NAMES = {
  'email': 'Email (identificación)',
  'profile': 'Perfil de Google',
  'https://www.googleapis.com/auth/spreadsheets': 'Google Sheets (lectura/escritura)',
  'https://www.googleapis.com/auth/drive.readonly': 'Google Drive (solo lectura)',
  'https://www.googleapis.com/auth/calendar': 'Google Calendar',
  'https://www.googleapis.com/auth/gmail.send': 'Gmail (envío de correos)'
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('=== CARGANDO PÁGINA DE OAUTH ===');
  
  // Obtener el plan seleccionado
  const plan = localStorage.getItem('selectedPlan');
  
  if (!plan) {
    console.error('No hay plan seleccionado');
    alert('Error: No hay plan seleccionado. Por favor regresa a la selección de planes.');
    window.location.href = 'myia-plans.html';
    return;
  }
  
  console.log('Plan seleccionado:', plan);
  
  // Mostrar scopes según el plan
  const planInfo = PLAN_PRICES[plan];
  const scopesList = document.getElementById('scopesItems');
  
  if (planInfo && planInfo.scopes) {
    scopesList.innerHTML = planInfo.scopes.map(scope => {
      const scopeName = SCOPE_NAMES[scope] || scope;
      return `<li>${scopeName}</li>`;
    }).join('');
  }
  
  // Event listener para el botón de Google OAuth
  document.getElementById('googleAuthBtn').addEventListener('click', initiateGoogleOAuth);
});

// Iniciar flujo de OAuth de Google
function initiateGoogleOAuth() {
  const plan = localStorage.getItem('selectedPlan');
  
  if (!plan) {
    alert('Error: No hay plan seleccionado. Por favor regresa a la selección de planes.');
    window.location.href = 'myia-plans.html';
    return;
  }
  
  const scopes = PLAN_PRICES[plan].scopes;
  
  console.log('Iniciando OAuth con plan:', plan);
  console.log('Scopes solicitados:', scopes);
  
  // Construir URL de OAuth con state opcional para mantener el plan
  const state = plan; // Usamos el plan como state para mantener contexto
  const oauthUrl = `https://crysantem-backend.onrender.com/api/auth/google?scopes=${encodeURIComponent(scopes.join(' '))}&state=${encodeURIComponent(state)}`;

  console.log('URL OAuth completa:', oauthUrl);

  // Hacer la petición al backend
  fetch(oauthUrl)
    .then(response => response.json())
    .then(data => {
      console.log('Respuesta del backend:', data);
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        console.error('Error: No se recibió authUrl del backend', data);
        alert('Error al generar URL de OAuth. Revisa la consola para más detalles.');
      }
    })
    .catch(error => {
      console.error('Error al llamar al backend:', error);
      alert('Error de conexión con el servidor.');
    });
}
