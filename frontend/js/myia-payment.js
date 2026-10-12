// Configuración de pago y autenticación
let paymentConfig = {
  plan: '',
  paymentMethod: 'card',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  cardName: '',
  googleConnected: false,
  googleEmail: '',
  refreshToken: ''
};

// Precios de planes - NUEVO MODELO SaaS MRR
const PLAN_PRICES = {
  responde: {
    name: '01 - Responde',
    monthly: '$49.000',
    annual: '$40.833 / mes (anual)',
    annualTotal: '$490.000',
    aiModel: 'Gemini Flash',
    messagesLimit: 'Hasta 1.000 mensajes al mes',
    minimumMonths: '3 meses',
    scopes: ['email', 'profile']
  },
  asiste: {
    name: '02 - Asiste',
    monthly: '$79.000',
    annual: '$65.833 / mes (anual)',
    annualTotal: '$790.000',
    aiModel: 'Gemini Flash',
    messagesLimit: 'Hasta 2.500 mensajes al mes',
    minimumMonths: '3 meses',
    scopes: ['email', 'profile', 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly']
  },
  automatiza: {
    name: '03 - Automatiza',
    monthly: '$125.000',
    annual: '$104.167 / mes (anual)',
    annualTotal: '$1.250.000',
    aiModel: 'Gemini Pro',
    messagesLimit: 'Hasta 5.000 mensajes al mes',
    minimumMonths: '6 meses',
    scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar']
  },
  intelligence: {
    name: '04 - Enterprise',
    monthly: 'Custom',
    annual: 'Custom',
    annualTotal: 'Custom',
    aiModel: 'Gemini Pro',
    messagesLimit: 'Ajustados a medida',
    minimumMonths: '12 meses',
    scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/gmail.send']
  }
};

// Cargar configuración desde localStorage
function loadConfig() {
  const savedConfig = localStorage.getItem('paymentConfig');
  if (savedConfig) {
    paymentConfig = JSON.parse(savedConfig);
  }

  // Verificar si viene del callback de OAuth con token
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  const planFromUrl = urlParams.get('plan');
  
  if (tokenFromUrl) {
    // Guardar el token en localStorage
    localStorage.setItem('token', tokenFromUrl);
    console.log('Token recibido del callback de OAuth:', tokenFromUrl);
    
    // Marcar que Google está conectado (si viene del callback, significa que se autenticó con éxito)
    paymentConfig.googleConnected = true;
    
    // Obtener el email y userId del token (decodificar el JWT)
    try {
      const tokenPayload = JSON.parse(atob(tokenFromUrl.split('.')[1]));
      paymentConfig.googleEmail = tokenPayload.email || 'google_user@gmail.com';
      localStorage.setItem('userId', tokenPayload.id || tokenPayload.userId || tokenPayload.sub);
      console.log('Email del token:', paymentConfig.googleEmail);
      console.log('UserId del token:', localStorage.getItem('userId'));
    } catch (e) {
      console.error('Error al decodificar token:', e);
      paymentConfig.googleEmail = 'google_user@gmail.com';
    }
    
    // Guardar en localStorage
    localStorage.setItem('paymentConfig', JSON.stringify(paymentConfig));
    
    // Limpiar la URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  if (planFromUrl) {
    // Actualizar el plan desde la URL (del callback de OAuth)
    localStorage.setItem('selectedPlan', planFromUrl);
    paymentConfig.plan = planFromUrl;
    console.log('Plan recibido del callback de OAuth:', planFromUrl);
  }

  // Cargar plan seleccionado (SIEMPRE desde localStorage.selectedPlan como fuente de verdad)
  const plan = localStorage.getItem('selectedPlan') || paymentConfig.plan;
  
  if (plan) {
    paymentConfig.plan = plan; // Asegurar que el plan esté en paymentConfig
    updatePlanSummary(plan);
  } else {
    // Si no hay plan en localStorage, intentar desde otras fuentes
    const builderConfig = localStorage.getItem('builderConfig');
    if (builderConfig) {
      const config = JSON.parse(builderConfig);
      paymentConfig.plan = config.plan;
      updatePlanSummary(config.plan);
    } else {
      // Si no hay plan en ningún lado, redirigir a selección de planes
      console.error('No hay plan seleccionado. Redirigiendo a myia-plans.html');
      window.location.href = 'myia-plans.html';
      return;
    }
  }

  loadFormValues();

  // Verificar si ya está conectado a Google
  checkGoogleConnection();
}

// Guardar configuración en localStorage
function saveConfig() {
  paymentConfig.paymentMethod = document.getElementById('paymentMethod').value;
  paymentConfig.cardNumber = document.getElementById('cardNumber').value;
  paymentConfig.cardExpiry = document.getElementById('cardExpiry').value;
  paymentConfig.cardCvc = document.getElementById('cardCvc').value;
  paymentConfig.cardName = document.getElementById('cardName').value;
  
  localStorage.setItem('paymentConfig', JSON.stringify(paymentConfig));
}

// Cargar valores en el formulario
function loadFormValues() {
  document.getElementById('paymentMethod').value = paymentConfig.paymentMethod || 'card';
  document.getElementById('cardNumber').value = paymentConfig.cardNumber || '';
  document.getElementById('cardExpiry').value = paymentConfig.cardExpiry || '';
  document.getElementById('cardCvc').value = paymentConfig.cardCvc || '';
  document.getElementById('cardName').value = paymentConfig.cardName || '';
  
  if (paymentConfig.googleConnected) {
    document.getElementById('googleEmail').value = paymentConfig.googleEmail;
    document.getElementById('refreshToken').value = paymentConfig.refreshToken;
    updateOAuthStatus(true);
  }
}

// Actualizar resumen del plan
function updatePlanSummary(plan) {
  paymentConfig.plan = plan;
  const planInfo = PLAN_PRICES[plan];
  const billingType = localStorage.getItem('billingType') || 'monthly';

  if (planInfo) {
    document.getElementById('planName').textContent = planInfo.name;

    // Mostrar precio según tipo de facturación
    if (billingType === 'annual') {
      document.getElementById('implementationPrice').textContent = planInfo.annual;
      document.getElementById('monthlyPrice').textContent = planInfo.annualTotal + ' (cobrado anualmente)';
    } else {
      document.getElementById('implementationPrice').textContent = planInfo.monthly + ' / mes';
      document.getElementById('monthlyPrice').textContent = 'Facturación mensual';
    }

    document.getElementById('aiModel').textContent = planInfo.aiModel;
    document.getElementById('tokenLimit').textContent = planInfo.messagesLimit;

    // Mostrar scopes requeridos
    const scopesContainer = document.getElementById('requiredScopes');
    scopesContainer.innerHTML = planInfo.scopes.map(scope => {
      const scopeNames = {
        'email': 'Email',
        'profile': 'Perfil',
        'https://www.googleapis.com/auth/spreadsheets': 'Google Sheets (lectura/escritura)',
        'https://www.googleapis.com/auth/drive.readonly': 'Google Drive (solo lectura)',
        'https://www.googleapis.com/auth/calendar': 'Google Calendar',
        'https://www.googleapis.com/auth/gmail.readonly': 'Gmail (solo lectura)'
      };
      return `<p>[OK] ${scopeNames[scope] || scope}</p>`;
    }).join('');
  }

  localStorage.setItem('selectedPlan', plan);
}

// Actualizar estado de OAuth
function updateOAuthStatus(connected) {
  const statusDiv = document.getElementById('oauthStatus');
  const statusText = document.getElementById('oauthStatusText');
  const authBtn = document.getElementById('googleAuthBtn');
  
  if (connected) {
    statusDiv.classList.add('connected');
    statusText.textContent = 'Conectado como ' + paymentConfig.googleEmail;
    authBtn.classList.add('connected');
    authBtn.innerHTML = '[OK] Conectado';
    authBtn.disabled = true;
  } else {
    statusDiv.classList.remove('connected');
    statusText.textContent = 'No conectado';
    authBtn.classList.remove('connected');
    authBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Conectar con Google
    `;
    authBtn.disabled = false;
  }
  
  updateCompleteButton();
}

// Verificar conexión con Google
function checkGoogleConnection() {
  const userId = localStorage.getItem('userId');
  
  if (userId) {
    // Aquí deberías hacer una llamada al backend para verificar si el usuario tiene tokens de Google
    // Por ahora, simulamos
    fetch(`https://crysantem-backend.onrender.com/api/auth/google-tokens/${userId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.data) {
          paymentConfig.googleConnected = true;
          paymentConfig.googleEmail = data.data.email;
          paymentConfig.refreshToken = data.data.refresh_token;
          loadFormValues();
        }
      })
      .catch(error => {
        console.log('No hay conexión Google previa');
      });
  }
}

// Iniciar flujo de OAuth de Google
function initiateGoogleOAuth() {
  // Obtener el plan desde localStorage (es la fuente de verdad)
  const plan = localStorage.getItem('selectedPlan') || paymentConfig.plan;
  
  if (!plan) {
    alert('Error: No hay plan seleccionado. Por favor regresa a la selección de planes.');
    window.location.href = 'myia-plans.html';
    return;
  }
  
  const scopes = PLAN_PRICES[plan].scopes;
  
  console.log('Iniciando OAuth con plan:', plan);
  console.log('Scopes solicitados:', scopes);
  console.log('Scopes URL:', encodeURIComponent(scopes.join(' ')));
  
  // Construir URL de OAuth con state opcional para mantener el plan
  const state = plan; // Usamos el plan como state para mantener contexto
  const oauthUrl = `/api/auth/google?scopes=${encodeURIComponent(scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  
  console.log('URL OAuth completa:', oauthUrl);
  
  // Hacer la petición al backend y ver la respuesta
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

// Procesar pago (simulado)
function processPayment() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  loadingOverlay.classList.add('active');
  loadingText.textContent = 'Procesando pago...';
  
  // Simular proceso de pago
  setTimeout(() => {
    loadingText.textContent = 'Pago completado. Preparando autenticación...';
    
    setTimeout(() => {
      loadingOverlay.classList.remove('active');
      
      // Guardar que el pago fue completado (simulado)
      paymentConfig.paymentCompleted = true;
      localStorage.setItem('paymentConfig', JSON.stringify(paymentConfig));
      
      // Iniciar OAuth de Google directamente
      initiateGoogleOAuth();
    }, 500);
  }, 1000);
}

// Validar configuración antes de completar
function validateConfig() {
  // Ya no requerimos Google antes de completar, ya que OAuth es parte del flujo de pago
  if (!paymentConfig.googleConnected && !paymentConfig.paymentCompleted) {
    alert('Por favor completa el pago primero para conectar Google');
    return false;
  }
  
  if (!paymentConfig.googleConnected) {
    alert('Por favor conecta tu cuenta de Google');
    return false;
  }
  
  return true;
}

// Actualizar botón de completar
function updateCompleteButton() {
  const completeBtn = document.getElementById('completeBtn');
  // Requiere tanto pago completado como Google conectado
  completeBtn.disabled = !paymentConfig.paymentCompleted || !paymentConfig.googleConnected;
}

// Formatear número de tarjeta
function formatCardNumber(value) {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = matches && matches[0] || '';
  const parts = [];
  
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  
  if (parts.length) {
    return parts.join(' ');
  } else {
    return v;
  }
}

// Formatear fecha de expiración
function formatExpiry(value) {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  
  if (v.length >= 2) {
    return v.substring(0, 2) + '/' + v.substring(2, 4);
  }
  
  return v;
}

// Inicializar event listeners
function initEventListeners() {
  // Event listener para método de pago
  document.getElementById('paymentMethod').addEventListener('change', (e) => {
    const method = e.target.value;
    const cardDetails = document.getElementById('cardDetails');
    const cardDetailsExtra = document.getElementById('cardDetailsExtra');
    
    if (method === 'card') {
      cardDetails.style.display = 'block';
      cardDetailsExtra.style.display = 'grid';
    } else {
      cardDetails.style.display = 'none';
      cardDetailsExtra.style.display = 'none';
    }
    
    saveConfig();
  });
  
  // Event listeners para tarjeta
  document.getElementById('cardNumber').addEventListener('input', (e) => {
    e.target.value = formatCardNumber(e.target.value);
    saveConfig();
  });
  
  document.getElementById('cardExpiry').addEventListener('input', (e) => {
    e.target.value = formatExpiry(e.target.value);
    saveConfig();
  });
  
  document.getElementById('cardCvc').addEventListener('input', saveConfig);
  document.getElementById('cardName').addEventListener('input', saveConfig);
  
  // Event listener para Google OAuth
  document.getElementById('googleAuthBtn').addEventListener('click', initiateGoogleOAuth);
  
  // Event listener para pago
  document.getElementById('payBtn').addEventListener('click', () => {
    // Validar datos de pago antes de procesar
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (paymentMethod === 'card') {
      const cardNumber = document.getElementById('cardNumber').value.trim();
      const cardExpiry = document.getElementById('cardExpiry').value.trim();
      const cardCvc = document.getElementById('cardCvc').value.trim();
      const cardName = document.getElementById('cardName').value.trim();
      
      if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
        alert('Por favor completa todos los datos de la tarjeta');
        return;
      }
    }
    
    processPayment();
  });
  
  // Event listener para completar
  document.getElementById('completeBtn').addEventListener('click', () => {
    console.log('=== BOTÓN COMPLETAR CLICKEADO ===');
    console.log('paymentConfig:', paymentConfig);
    console.log('googleConnected:', paymentConfig.googleConnected);
    console.log('paymentCompleted:', paymentConfig.paymentCompleted);
    
    if (validateConfig()) {
      console.log('Validación exitosa, guardando y redirigiendo a myia-summary.html');
      saveConfig();
      window.location.href = 'myia-summary.html';
    } else {
      console.log('Validación falló');
    }
  });
  
  // Botón volver
  document.getElementById('backBtn').addEventListener('click', () => {
    saveConfig();
    window.location.href = 'myia-integrations.html';
  });
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== DOMContentLoaded myia-payment.html ===');

  // PRIMERO: Verificar si es coworker (saltar OAuth)
  const isCoworker = localStorage.getItem('coworkerSkipOAuth') === 'true';
  console.log('¿Es coworker?', isCoworker);

  if (isCoworker) {
    console.log('Coworker detectado - omitiendo OAuth y redirigiendo a resumen');
    // Configurar automáticamente como completado
    paymentConfig.plan = 'responde';
    paymentConfig.paymentMethod = 'Coworker Free';
    paymentConfig.googleConnected = true;
    paymentConfig.googleEmail = 'Coworker (No OAuth)';
    paymentConfig.paymentCompleted = true;
    localStorage.setItem('paymentConfig', JSON.stringify(paymentConfig));
    // Redirigir directamente al resumen
    window.location.href = 'myia-summary.html';
    return;
  }

  // LUEGO: Verificar si viene de un callback de Google OAuth
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const plan = urlParams.get('plan');
  const googleConnected = urlParams.get('google_connected');

  console.log('URL params:', { token, plan, googleConnected });

  if (token) {
    console.log('=== TOKEN RECIBIDO DESDE OAUTH ===');
    console.log('Token:', token);
    console.log('Plan:', plan);
    console.log('Google Connected:', googleConnected);

    // Guardar token en localStorage
    localStorage.setItem('token', token);
    
    // Decodificar JWT para obtener userId
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        localStorage.setItem('userId', payload.userId || payload.id);
        console.log('UserId extraído del token:', payload.userId || payload.id);
      }
    } catch (e) {
      console.error('Error decodificando token:', e);
    }
    
    // Guardar el plan si viene del OAuth (ANTES de loadConfig)
    if (plan) {
      localStorage.setItem('selectedPlan', plan);
      paymentConfig.plan = plan;
      console.log('Plan guardado ANTES de loadConfig:', plan);
    }
    
    // Limpiar URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // LUEGO: Cargar configuración
  loadConfig();
  initEventListeners();
  
  // FINALMENTE: Procesar estado de Google conectado
  if (token && googleConnected === 'true') {
    paymentConfig.googleConnected = true;
    paymentConfig.googleEmail = 'Autenticado con Google';
    paymentConfig.paymentCompleted = true; // Marcar pago como completado
    
    // Habilitar botón de completar
    const completeBtn = document.getElementById('completeBtn');
    if (completeBtn) {
      completeBtn.disabled = false;
      console.log('Botón de completar habilitado');
    }
    
    loadFormValues();
    saveConfig();
    
    console.log('Google conectado, habilitando botón de completar');
  }
});
