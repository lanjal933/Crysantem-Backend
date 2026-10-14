// Usar configuración centralizada desde config.js
// Fallback directo a backend en Render si config.js no carga correctamente
const API_URL = window.API_CONFIG?.backendUrl || 'https://crysantem-backend.onrender.com';

// Exportar API_CONFIG para que otros archivos puedan usarlo
window.API_URL = API_URL;

// Debug: Verificar qué URL se está usando
console.log('API_URL configurada:', API_URL);
console.log('window.API_CONFIG:', window.API_CONFIG);

let currentUser = null;
let authToken = localStorage.getItem('authToken');

function updateAuthUI() {
  const authBtn = document.getElementById('authBtn');
  const authDropdown = document.getElementById('authDropdown');
  const userEmail = localStorage.getItem('userEmail');

  if (authBtn) {
    if (authToken) {
      authBtn.textContent = userEmail || 'Account';
    } else {
      authBtn.textContent = 'Account';
    }
  }

  if (authDropdown) {
    if (authToken) {
      authDropdown.style.display = 'block';
    } else {
      authDropdown.style.display = 'none';
    }
  }
}

async function fetchConfig() {
  try {
    const response = await fetch(`${API_URL}/api/config`);
    const config = await response.json();
    return config;
  } catch (error) {
    console.error('Error fetching config:', error);
    return null;
  }
}

async function register(name, email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      currentUser = data.user;
      updateAuthUI();
      closeModal('authModal');
      showNotification('Registro exitoso', 'success');
      
      // Redirigir a la página de procedencia
      const redirectUrl = localStorage.getItem('authRedirectUrl');
      if (redirectUrl) {
        localStorage.removeItem('authRedirectUrl');
        window.location.href = redirectUrl;
      }
      
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Error de conexión' };
  }
}

async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      currentUser = data.user;
      updateAuthUI();
      closeModal('authModal');
      showNotification('Login exitoso', 'success');
      
      // Redirigir a la página de procedencia
      const redirectUrl = localStorage.getItem('authRedirectUrl');
      if (redirectUrl) {
        localStorage.removeItem('authRedirectUrl');
        window.location.href = redirectUrl;
      }
      
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Error de conexión' };
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  updateAuthUI();
  showNotification('Sesión cerrada', 'success');
  if (window.location.pathname === '/dashboard') {
    window.location.href = '/';
  }
}

async function loginWithGoogle() {
  try {
    const redirectUrl = localStorage.getItem('authRedirectUrl') || window.location.href;
    const response = await fetch(`${API_URL}/api/auth/google?redirectUrl=${encodeURIComponent(redirectUrl)}`);
    const data = await response.json();
    if (data.authUrl) {
      window.location.href = data.authUrl;
    }
  } catch (error) {
    showNotification('Error al conectar con Google', 'error');
  }
}

async function requestEmailCode(email) {
  try {
    const response = await fetch(`${API_URL}/api/auth/email/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      showNotification('Código enviado a tu email', 'success');
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Error de conexión' };
  }
}

async function verifyEmailCode(email, code) {
  try {
    const response = await fetch(`${API_URL}/api/auth/email/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      currentUser = data.user;
      updateAuthUI();
      closeModal('authModal');
      showNotification('Login exitoso', 'success');
      
      // Redirigir a la página de procedencia
      const redirectUrl = localStorage.getItem('authRedirectUrl');
      if (redirectUrl) {
        localStorage.removeItem('authRedirectUrl');
        window.location.href = redirectUrl;
      }
      
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Error de conexión' };
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    console.error(`Modal con id "${modalId}" no encontrado`);
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = '';
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff4444' : '#4a4a4a'};
    color: ${type === 'success' ? '#000' : '#fff'};
    border-radius: 8px;
    z-index: 3000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

function initNavbar() {
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarLinks = document.querySelector('.navbar-links');
  const authBtn = document.getElementById('authBtn');
  const authDropdown = document.getElementById('authDropdown');
  const navbar = document.querySelector('.navbar');

  if (navbarToggle) {
    navbarToggle.addEventListener('click', () => {
      navbarLinks.classList.toggle('active');
    });
  }

  updateAuthUI();

  authBtn?.addEventListener('click', () => {
    if (authToken) {
      authDropdown.classList.toggle('active');
    } else {
      openModal('authModal');
      showLoginForm();
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', logout);

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      closeModal(e.target.closest('.modal').id);
    });
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!authBtn?.contains(e.target) && !authDropdown?.contains(e.target)) {
      authDropdown?.classList.remove('active');
    }
  });

  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }
}

function showLoginForm() {
  // Guardar la URL actual para redirección después del login
  localStorage.setItem('authRedirectUrl', window.location.href);
  
  const modalTitle = document.querySelector('.modal-title');
  const authForm = document.getElementById('authForm');

  modalTitle.textContent = 'Inicio de Sesión';
  authForm.innerHTML = `
    <div class="auth-tabs">
      <button class="auth-tab active" data-tab="google">Google OAuth</button>
      <button class="auth-tab" data-tab="email">Email + Código</button>
      <button class="auth-tab" data-tab="register">Registro</button>
    </div>
    
    <div class="auth-tab-content" id="googleTab">
      <button type="button" class="btn btn-primary btn-full" id="googleLoginBtn" style="margin-bottom: var(--spacing-md);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuar con Google
      </button>
      <p style="text-align: center; color: var(--text-secondary); font-size: 0.85rem; margin: var(--spacing-md) 0;">
        Al continuar con Google, aceptas nuestros términos y condiciones.
      </p>
    </div>
    
    <div class="auth-tab-content" id="emailTab" style="display: none;">
      <div class="form-group">
        <label for="emailCode">Email</label>
        <input type="email" id="emailCode" name="emailCode">
        <div class="form-error" id="emailCodeError"></div>
      </div>
      <button type="button" class="btn btn-primary btn-full" id="requestCodeBtn">Enviar Código</button>
      <div class="form-group" id="codeInputGroup" style="display: none; margin-top: 15px;">
        <label for="verificationCode">Código de verificación</label>
        <input type="text" id="verificationCode" name="verificationCode" placeholder="6 dígitos" maxlength="6">
        <div class="form-error" id="verificationCodeError"></div>
      </div>
      <button type="button" class="btn btn-primary btn-full" id="verifyCodeBtn" style="display: none; margin-top: 10px;">Verificar Código</button>
    </div>

    <div class="auth-tab-content" id="registerTab" style="display: none;">
      <div class="form-group">
        <label for="registerName">Nombre</label>
        <input type="text" id="registerName" name="registerName">
        <div class="form-error" id="registerNameError"></div>
      </div>
      <div class="form-group">
        <label for="registerEmail">Email</label>
        <input type="email" id="registerEmail" name="registerEmail">
        <div class="form-error" id="registerEmailError"></div>
      </div>
      <div class="form-group">
        <label for="registerPassword">Contraseña</label>
        <input type="password" id="registerPassword" name="registerPassword">
        <div class="form-error" id="registerPasswordError"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Registrarse</button>
    </div>
  `;

  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById('googleTab').style.display = tabName === 'google' ? 'block' : 'none';
      document.getElementById('emailTab').style.display = tabName === 'email' ? 'block' : 'none';
      document.getElementById('registerTab').style.display = tabName === 'register' ? 'block' : 'none';
    });
  });

  // Google OAuth
  document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google`);
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        showNotification('Error al obtener URL de autenticación', 'error');
      }
    } catch (error) {
      console.error('Error en Google OAuth:', error);
      showNotification('Error al conectar con Google', 'error');
    }
  });

  // Email + código
  document.getElementById('requestCodeBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('emailCode').value;
    const result = await requestEmailCode(email);
    if (result.success) {
      document.getElementById('codeInputGroup').style.display = 'block';
      document.getElementById('verifyCodeBtn').style.display = 'block';
      document.getElementById('requestCodeBtn').style.display = 'none';
    } else {
      showNotification(result.error, 'error');
    }
  });

  document.getElementById('verifyCodeBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('emailCode').value;
    const code = document.getElementById('verificationCode').value;
    const result = await verifyEmailCode(email, code);
    if (!result.success) {
      showNotification(result.error, 'error');
    }
  });

  // Registro
  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar que estemos en la pestaña de registro
    const registerTab = document.getElementById('registerTab');
    if (registerTab.style.display === 'none') {
      return; // No procesar si no estamos en la pestaña de registro
    }

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    // Validación básica
    if (!name || !email || !password) {
      showNotification('Todos los campos son requeridos', 'error');
      return;
    }

    if (password.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    const result = await register(name, email, password);
    if (!result.success) {
      showNotification(result.error, 'error');
    }
  });
}

function initPortfolioIndicator() {
  const portfolioScroll = document.getElementById('portfolioScroll');
  const indicator = document.querySelector('.portfolio-indicator');

  if (!portfolioScroll || !indicator) return;

  portfolioScroll.addEventListener('scroll', () => {
    const scrollLeft = portfolioScroll.scrollLeft;
    const itemWidth = portfolioScroll.querySelector('.portfolio-item').offsetWidth;
    const gap = 32;
    const currentIndex = Math.round(scrollLeft / (itemWidth + gap));
    const total = portfolioScroll.querySelectorAll('.portfolio-item').length;

    indicator.textContent = `0${currentIndex + 1} / 0${total}`;
  });
}

function initDynamicText() {
  const dynamicText = document.querySelector('.dynamic-text');
  if (!dynamicText) {
    console.log('Dynamic text element not found');
    return;
  }

  const texts = [
    'no necesita descanso.',
    'nunca se detiene.',
    'siempre está disponible.',
    'trabaja 24/7.',
    'automatiza tareas.',
    'responde clientes.',
  ];

  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let isPaused = false;

  function typeText() {
    const currentText = texts[textIndex];

    if (isPaused) {
      setTimeout(() => {
        isPaused = false;
        typeText();
      }, 2000);
      return;
    }

    if (isDeleting) {
      dynamicText.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
    } else {
      dynamicText.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
    }

    let typeSpeed = isDeleting ? 50 : 80;

    if (!isDeleting && charIndex === currentText.length) {
      typeSpeed = 2000;
      isPaused = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      typeSpeed = 500;
    }

    setTimeout(typeText, typeSpeed);
  }

  typeText();
  console.log('Dynamic text initialized');
}

function initCardGlow() {
  const cards = document.querySelectorAll('.plan-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      item.classList.toggle('active');
    });
  });
}

function initDemoChat() {
  const demoInput = document.getElementById('demoInput');
  const demoSendBtn = document.getElementById('demoSendBtn');
  const demoMessages = document.getElementById('demoMessages');

  if (!demoInput || !demoSendBtn || !demoMessages) return;

  async function sendMessage() {
    const message = demoInput.value.trim();
    if (!message) return;

    demoSendBtn.disabled = true;
    demoInput.value = '';

    addMessage(message, 'user');

    try {
      const response = await fetch(`${API_URL}/api/ai/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId: currentUser?.id || 'anonymous' }),
      });

      const data = await response.json();

      if (response.ok) {
        addMessage(data.response, 'ai');
      } else {
        addMessage('Lo siento, hubo un error. Intenta nuevamente.', 'ai');
      }
    } catch (error) {
      addMessage('No pudimos conectar con el servicio. Intenta nuevamente.', 'ai');
    } finally {
      demoSendBtn.disabled = false;
    }
  }

  function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `demo-message ${type}`;
    
    if (type === 'ai') {
      console.log('Texto original de IA:', text);
      const rendered = markdownRenderer.render(text);
      console.log('Texto renderizado:', rendered);
      // Renderizar markdown para mensajes de IA
      messageDiv.innerHTML = rendered;
    } else {
      // Texto plano para mensajes de usuario
      messageDiv.textContent = text;
    }
    
    demoMessages.appendChild(messageDiv);
    demoMessages.scrollTop = demoMessages.scrollHeight;
  }

  demoSendBtn.addEventListener('click', sendMessage);
  demoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  addMessage('¡Hola! Soy Crysantem V1.4. ¿En qué puedo ayudarte?', 'ai');
  
  // Inicializar gráficos pendientes
  const initCharts = () => {
    if (!window.pendingCharts || window.pendingCharts.length === 0) return;
    
    console.log('Procesando gráficos pendientes:', window.pendingCharts.length);
    console.log('Chart disponible en window.Chart:', !!window.Chart);
    console.log('Chart disponible en window.chartjs:', !!window.chartjs);
    
    // Listar todos los IDs de canvas en el DOM
    const allCanvases = document.querySelectorAll('canvas');
    console.log('Canvas elements en DOM:', allCanvases.length);
    allCanvases.forEach(canvas => {
      console.log('Canvas ID:', canvas.id);
    });
    
    // Esperar a que Chart.js esté disponible
    const checkChartJS = () => {
      const ChartLib = window.Chart || window.chartjs;
      if (!ChartLib) {
        console.log('Chart.js aún no está disponible, reintentando en 100ms...');
        setTimeout(checkChartJS, 100);
        return;
      }
      
      console.log('Chart.js está disponible, inicializando gráficos...');
      
      window.pendingCharts.forEach(chartConfig => {
        const canvas = document.getElementById(chartConfig.id);
        console.log('Buscando canvas con ID:', chartConfig.id, 'Encontrado:', !!canvas);
        
        if (canvas) {
          // Determinar si el gráfico necesita scales (pie/doughnut no necesitan)
          const needsScales = !['pie', 'doughnut'].includes(chartConfig.type);
          
          const options = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                labels: {
                  color: '#ffffff'
                }
              }
            }
          };
          
          if (needsScales) {
            options.scales = {
              x: {
                ticks: { color: '#ffffff' },
                grid: { color: 'rgba(255,255,255,0.1)' }
              },
              y: {
                ticks: { color: '#ffffff' },
                grid: { color: 'rgba(255,255,255,0.1)' }
              }
            };
          }
          
          try {
            new ChartLib(canvas, {
              type: chartConfig.type,
              data: chartConfig.data,
              options: options
            });
            console.log('Gráfico inicializado correctamente:', chartConfig.id);
          } catch (e) {
            console.error('Error al inicializar gráfico:', e);
          }
        } else {
          console.error('No se encontró canvas con ID:', chartConfig.id);
        }
      });
      
      // Limpiar gráficos pendientes
      window.pendingCharts = [];
    };
    
    checkChartJS();
  };
  
  // Observer para inicializar gráficos cuando se agregan nuevos mensajes
  const messageObserver = new MutationObserver(() => {
    // Mayor delay para asegurar que el DOM se actualizó completamente
    setTimeout(initCharts, 300);
  });
  
  messageObserver.observe(demoMessages, { childList: true });
}

function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('fade-in-up');
    observer.observe(section);
  });

  document.querySelectorAll('.plan-card').forEach((card, index) => {
    card.classList.add('scale-in');
    card.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(card);
  });

  document.querySelectorAll('.compra-card').forEach((card, index) => {
    card.classList.add('scale-in');
    card.style.transitionDelay = `${index * 0.15}s`;
    observer.observe(card);
  });

  document.querySelectorAll('.nosotros-card').forEach((card, index) => {
    card.classList.add('fade-in-up');
    card.style.transitionDelay = `${index * 0.15}s`;
    observer.observe(card);
  });

  document.querySelectorAll('.faq-item').forEach((item, index) => {
    item.classList.add('fade-in-up');
    item.style.transitionDelay = `${index * 0.08}s`;
    observer.observe(item);
  });

  document.querySelectorAll('.portfolio-item').forEach((item, index) => {
    item.classList.add('fade-in-left');
    item.style.transitionDelay = `${index * 0.2}s`;
    observer.observe(item);
  });

  document.querySelectorAll('.section-title').forEach(title => {
    title.classList.add('fade-in');
    observer.observe(title);
  });

  document.querySelectorAll('.section-subtitle').forEach(subtitle => {
    subtitle.classList.add('fade-in');
    observer.observe(subtitle);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFAQ();
  initDemoChat();
  initScrollAnimations();
  initPortfolioIndicator();
  initCardGlow();
  initDynamicText();

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    authToken = token;
    localStorage.setItem('authToken', authToken);
    window.history.replaceState({}, document.title, window.location.pathname);
    updateAuthUI();
    showNotification('Login exitoso con Google', 'success');
  }
});
