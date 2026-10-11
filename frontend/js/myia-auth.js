// Módulo de autenticación para páginas MyIA
// Comparte authToken con la landing principal a través de localStorage

// Usar configuración centralizada desde config.js
// Fallback directo a backend en Render si config.js no carga correctamente
const API_URL = window.API_CONFIG?.backendUrl || 'https://crysantem-backend.onrender.com';

console.log('myia-auth API_URL:', API_URL);

let currentUser = null;
let authToken = localStorage.getItem('authToken');

function updateAuthUI() {
  const authBtn = document.getElementById('authBtn');
  const authDropdown = document.getElementById('authDropdown');

  if (authBtn && authDropdown) {
    if (authToken) {
      authBtn.textContent = 'Account';
      authDropdown.style.display = 'block';
    } else {
      authBtn.textContent = 'Account';
      authDropdown.style.display = 'none';
    }
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
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Error de conexión' };
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
  updateAuthUI();
  showNotification('Sesión cerrada', 'success');
}

async function loginWithGoogle() {
  try {
    const response = await fetch(`${API_URL}/api/auth/google`);
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
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
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

function showLoginForm() {
  const modalTitle = document.querySelector('.modal-title');
  const authForm = document.getElementById('authForm');

  if (!modalTitle || !authForm) return;

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
        <input type="text" id="registerName" name="registerName" required>
        <div class="form-error" id="registerNameError"></div>
      </div>
      <div class="form-group">
        <label for="registerEmail">Email</label>
        <input type="email" id="registerEmail" name="registerEmail" required>
        <div class="form-error" id="registerEmailError"></div>
      </div>
      <div class="form-group">
        <label for="registerPassword">Contraseña</label>
        <input type="password" id="registerPassword" name="registerPassword" required>
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
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const result = await register(name, email, password);
    if (!result.success) {
      showNotification(result.error, 'error');
    }
  });
}

function initAuth() {
  updateAuthUI();

  const authBtn = document.getElementById('authBtn');
  const authDropdown = document.getElementById('authDropdown');

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
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
