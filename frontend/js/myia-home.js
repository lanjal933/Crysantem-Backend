// Cargar apps del usuario
async function loadUserApps() {
  try {
    // Verificar si hay token en URL (después de OAuth)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const planFromUrl = urlParams.get('plan');
    
    if (tokenFromUrl) {
      localStorage.setItem('authToken', tokenFromUrl);
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Si viene con un plan de OAuth, guardarlo y redirigir al constructor
    if (planFromUrl) {
      localStorage.setItem('selectedPlan', planFromUrl);
      const planConfig = {
        responde: { aiModel: 'gemini-flash', characterLimit: 50000 },
        asiste: { aiModel: 'gemini-flash', characterLimit: 100000 },
        automatiza: { aiModel: 'gemini-pro', characterLimit: 500000 },
        intelligence: { aiModel: 'gemini-pro', characterLimit: 2000000 }
      };
      localStorage.setItem('planConfig', JSON.stringify(planConfig[planFromUrl]));
      window.location.href = 'myia-builder.html';
      return;
    }

    // Verificar autenticación
    const token = localStorage.getItem('authToken');
    if (!token) {
      showAuthRequired();
      return;
    }

    // Obtener userId del token
    const responseProfile = await fetch('https://crysantem-backend.onrender.com/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const profileResult = await responseProfile.json();
    if (!profileResult.user) {
      showAuthRequired();
      return;
    }

    const userId = profileResult.user.id;
    localStorage.setItem('userId', userId);

    const response = await fetch(`https://crysantem-backend.onrender.com/api/myia/user-apps/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      renderAppsList(result.data);
    } else {
      showEmptyState();
    }
  } catch (error) {
    console.error('Error loading apps:', error);
    showEmptyState();
  }
}

function showAuthRequired() {
  document.getElementById('appsGrid').innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h3 class="empty-state-title">Inicia sesión para ver tus apps</h3>
      <p class="empty-state-text">Necesitas estar autenticado con Google para gestionar tus páginas.</p>
      <button class="btn-create" id="authBackBtn">Ir al inicio</button>
    </div>
  `;
  
  document.getElementById('authBackBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

function renderAppsList(apps) {
  const grid = document.getElementById('appsGrid');
  
  grid.innerHTML = apps.map(app => `
    <div class="app-card">
      <div class="app-card-header">
        <div>
          <h3 class="app-card-title">${app.business_name || 'Sin nombre'}</h3>
          <div class="app-card-slug">crysantem.tech/${app.slug}</div>
        </div>
        <span class="app-card-status ${app.is_active ? 'active' : 'inactive'}">
          ${app.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      
      <div class="app-card-plan">Plan: ${getPlanName(app.plan)}</div>
      
      <div class="app-card-ai">
        <span class="app-card-ai-badge">${getModelName(app.ai_model)}</span>
        <span>${formatCharacters(app.character_usage || 0)} / ${formatCharacters(app.character_limit || 50000)} caracteres</span>
      </div>
      
      <div class="app-card-actions">
        <button class="btn-view" data-slug="${app.slug}" data-action="view">Ver Página</button>
        <button class="btn-technical" data-app-id="${app.id}" data-action="technical">Panel</button>
        <button class="btn-edit" data-app-id="${app.id}" data-action="edit">Editar</button>
        <button class="btn-delete" data-app-id="${app.id}" data-action="delete">Eliminar</button>
      </div>
    </div>
  `).join('');

  // Agregar event listeners a los botones
  grid.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => editApp(btn.dataset.appId));
  });

  grid.querySelectorAll('[data-action="view"]').forEach(btn => {
    btn.addEventListener('click', () => viewApp(btn.dataset.slug));
  });

  grid.querySelectorAll('[data-action="technical"]').forEach(btn => {
    btn.addEventListener('click', () => viewTechnicalSummary(btn.dataset.appId));
  });

  grid.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteApp(btn.dataset.appId));
  });
}

function showEmptyState() {
  document.getElementById('appsGrid').innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h3 class="empty-state-title">Aún no tienes apps creadas</h3>
      <p class="empty-state-text">Crea tu primera página con agente de IA en minutos.</p>
      <button class="btn-create" id="emptyCreateBtn">+ Crear mi primera app</button>
    </div>
  `;
  
  document.getElementById('emptyCreateBtn').addEventListener('click', startCreationFlow);
}

function getPlanName(plan) {
  const plans = {
    'responde': 'Responde',
    'asiste': 'Asiste',
    'automatiza': 'Automatiza',
    'intelligence': 'Crysantem Intelligence'
  };
  return plans[plan] || 'Responde';
}

function getModelName(model) {
  const models = {
    'gemini-flash': 'Gemini Flash',
    'gemini-pro': 'Gemini Pro'
  };
  return models[model] || 'Gemini Flash';
}

function formatCharacters(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function startCreationFlow() {
  window.location.href = 'myia-plans.html';
}

function editApp(appId) {
  localStorage.setItem('editingAppId', appId);
  window.location.href = 'myia-builder.html';
}

function viewApp(slug) {
  window.open(`/api/myia/render/${slug}`, '_blank');
}

function viewTechnicalSummary(appId) {
  localStorage.setItem('viewingAppId', appId);
  window.location.href = 'myia-dashboard-page.html';
}

async function deleteApp(appId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta página? Esta acción no se puede deshacer y eliminará todos los datos de la base de datos.')) {
    return;
  }

  try {
    const response = await fetch(`https://crysantem-backend.onrender.com/api/myia/delete/${appId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    const result = await response.json();

    if (result.success) {
      alert('Página eliminada exitosamente');
      loadUserApps(); // Recargar la lista
    } else {
      alert('Error al eliminar página: ' + result.error);
    }
  } catch (error) {
    console.error('Error deleting app:', error);
    alert('Error al eliminar página');
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  loadUserApps();

  const backBtn = document.getElementById('backBtn');
  const createBtn = document.getElementById('createBtn');
  
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
  
  if (createBtn) {
    createBtn.addEventListener('click', startCreationFlow);
  }
});
