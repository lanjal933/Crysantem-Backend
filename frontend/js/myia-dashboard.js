// Configuración inicial
let config = {
  id: null, // ID de la configuración actual
  businessName: '',
  slug: '',
  logoUrl: '',
  logoSize: 100,
  backgroundType: 'solid',
  backgroundColor: '#050505',
  gradientColor: '#00ff8c',
  fontFamily: 'Inter',
  titleFont: '',
  chatBoxDesign: 'modern',
  chatBoxColor: '#00ff8c',
  pageDesign: 'design1',
  isActive: false
};

let currentUserId = null;

// Elementos del DOM
const elements = {
  businessName: document.getElementById('businessName'),
  slug: document.getElementById('slug'),
  logoFile: document.getElementById('logoFile'),
  logoUrl: document.getElementById('logoUrl'),
  logoSize: document.getElementById('logoSize'),
  logoSizeValue: document.getElementById('logoSizeValue'),
  appsList: document.getElementById('appsList'),
  backgroundType: document.getElementById('backgroundType'),
  backgroundColor: document.getElementById('backgroundColor'),
  backgroundColorText: document.getElementById('backgroundColorText'),
  gradientGroup: document.getElementById('gradientGroup'),
  gradientColor: document.getElementById('gradientColor'),
  gradientColorText: document.getElementById('gradientColorText'),
  fontFamily: document.getElementById('fontFamily'),
  titleFont: document.getElementById('titleFont'),
  chatBoxDesign: document.getElementById('chatBoxDesign'),
  chatBoxColor: document.getElementById('chatBoxColor'),
  chatBoxColorText: document.getElementById('chatBoxColorText'),
  isActive: document.getElementById('isActive'),
  previewFrame: document.getElementById('previewFrame'),
  publicUrl: document.getElementById('publicUrl')
};

// Inicializar event listeners
function initEventListeners() {
  // Inputs de texto
  elements.businessName.addEventListener('input', (e) => {
    config.businessName = e.target.value;
    updatePreview();
  });

  elements.slug.addEventListener('input', (e) => {
    config.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    elements.publicUrl.textContent = `/myia/${config.slug}`;
    updatePreview();
  });

  elements.logoFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        config.logoUrl = event.target.result;
        elements.logoUrl.value = event.target.result;
        updatePreview();
      };
      reader.readAsDataURL(file);
    }
  });

  elements.logoUrl.addEventListener('input', (e) => {
    config.logoUrl = e.target.value;
    updatePreview();
  });

  elements.logoSize.addEventListener('input', (e) => {
    config.logoSize = parseInt(e.target.value);
    elements.logoSizeValue.textContent = `${config.logoSize}px`;
    updatePreview();
  });

  // Background
  elements.backgroundType.addEventListener('change', (e) => {
    config.backgroundType = e.target.value;
    elements.gradientGroup.style.display = config.backgroundType === 'gradient' ? 'block' : 'none';
    updatePreview();
  });

  elements.backgroundColor.addEventListener('input', (e) => {
    config.backgroundColor = e.target.value;
    elements.backgroundColorText.value = e.target.value;
    updatePreview();
  });

  elements.backgroundColorText.addEventListener('input', (e) => {
    config.backgroundColor = e.target.value;
    elements.backgroundColor.value = e.target.value;
    updatePreview();
  });

  elements.gradientColor.addEventListener('input', (e) => {
    config.gradientColor = e.target.value;
    elements.gradientColorText.value = e.target.value;
    updatePreview();
  });

  elements.gradientColorText.addEventListener('input', (e) => {
    config.gradientColor = e.target.value;
    elements.gradientColor.value = e.target.value;
    updatePreview();
  });

  // Tipografía
  elements.fontFamily.addEventListener('change', (e) => {
    config.fontFamily = e.target.value;
    updatePreview();
  });

  elements.titleFont.addEventListener('change', (e) => {
    config.titleFont = e.target.value;
    updatePreview();
  });

  // Chat box
  elements.chatBoxDesign.addEventListener('change', (e) => {
    config.chatBoxDesign = e.target.value;
    updatePreview();
  });

  elements.chatBoxColor.addEventListener('input', (e) => {
    config.chatBoxColor = e.target.value;
    elements.chatBoxColorText.value = e.target.value;
    updatePreview();
  });

  elements.chatBoxColorText.addEventListener('input', (e) => {
    config.chatBoxColor = e.target.value;
    elements.chatBoxColor.value = e.target.value;
    updatePreview();
  });

  // Diseño de página
  document.querySelectorAll('.design-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.design-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      config.pageDesign = card.dataset.design;
      updatePreview();
    });
  });

  elements.isActive.addEventListener('change', (e) => {
    config.isActive = e.target.checked;
  });
}

// Generar HTML de la página personalizada
function generatePageHTML() {
  const backgroundStyle = getBackgroundStyle();
  const fontFamilyStyle = config.titleFont ? 
    `font-family: ${config.titleFont};` : 
    `font-family: ${config.fontFamily};`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.businessName || 'Mi Agente IA'}</title>
  <link href="https://fonts.googleapis.com/css2?family=${config.fontFamily.replace(' ', '+')}:wght@400;500;600;700&display=swap" rel="stylesheet">
  ${config.titleFont ? `<link href="https://fonts.googleapis.com/css2?family=${config.titleFont.replace(' ', '+')}:wght@400;500;600;700&display=swap" rel="stylesheet">` : ''}
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      ${backgroundStyle}
      font-family: ${config.fontFamily}, sans-serif;
      min-height: 100vh;
      color: white;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 40px;
    }
    .logo {
      width: ${config.logoSize}px;
      height: ${config.logoSize}px;
      object-fit: contain;
    }
    .title {
      font-size: 2.5rem;
      font-weight: 700;
      ${fontFamilyStyle}
    }
    .chat-container {
      max-width: 600px;
      margin: 0 auto;
    }
    .chat-box {
      ${getChatBoxStyle()}
      border-radius: 16px;
      padding: 24px;
    }
    .chat-message {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    .chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${config.chatBoxColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: black;
      flex-shrink: 0;
    }
    .chat-bubble {
      background: rgba(255, 255, 255, 0.1);
      padding: 16px;
      border-radius: 12px;
      max-width: 400px;
    }
    .chat-input {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
    .chat-input input {
      flex: 1;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(0, 0, 0, 0.3);
      color: white;
    }
    .chat-input button {
      padding: 12px 24px;
      background: ${config.chatBoxColor};
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .footer {
      text-align: center;
      margin-top: 60px;
      padding: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.5);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${config.logoUrl ? `<img src="${config.logoUrl}" alt="Logo" class="logo">` : ''}
      <h1 class="title">${config.businessName || 'Mi Negocio'}</h1>
    </div>
    
    <div class="chat-container">
      <div class="chat-box">
        <div class="chat-message">
          <div class="chat-avatar">AI</div>
          <div class="chat-bubble">${config.welcomeMessage}</div>
        </div>
        <div class="chat-input">
          <input type="text" placeholder="Escribe tu mensaje...">
          <button>Enviar</button>
        </div>
      </div>
    </div>

    <div class="footer">
      Powered by Crysantem Intelligence
    </div>
  </div>
</body>
</html>
  `;
}

function getBackgroundStyle() {
  switch (config.backgroundType) {
    case 'solid':
      return `background: ${config.backgroundColor};`;
    case 'gradient':
      return `background: linear-gradient(135deg, ${config.backgroundColor}, ${config.gradientColor});`;
    case 'glow':
      return `
        background: ${config.backgroundColor};
        position: relative;
      `;
    default:
      return `background: ${config.backgroundColor};`;
  }
}

function getChatBoxStyle() {
  const styles = {
    modern: `background: rgba(16, 16, 16, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);`,
    classic: `background: #1a1a1a; border: 2px solid ${config.chatBoxColor};`,
    minimal: `background: transparent; border: none;`,
    neon: `background: rgba(0, 0, 0, 0.9); border: 2px solid ${config.chatBoxColor}; box-shadow: 0 0 20px ${config.chatBoxColor};`,
    glass: `background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);`
  };
  return styles[config.chatBoxDesign] || styles.modern;
}

function updatePreview() {
  const html = generatePageHTML();
  const doc = elements.previewFrame.contentDocument || elements.previewFrame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}

function openPreview() {
  const html = generatePageHTML();
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

async function saveConfig() {
  try {
    // Guardar configuración de diseño en localStorage
    localStorage.setItem('builderConfig', JSON.stringify(config));
    alert('Diseño guardado. Continúa con la configuración del prompt.');
  } catch (error) {
    console.error('Error saving config:', error);
    alert('Error al guardar configuración');
  }
}

async function loadUserApps() {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const response = await fetch(`https://crysantem-backend.onrender.com/api/myia/user-apps/${userId}`);
    const result = await response.json();

    if (result.success) {
      renderAppsList(result.data);
    } else {
      elements.appsList.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5);">No tienes apps creadas aún.</p>';
    }
  } catch (error) {
    console.error('Error loading apps:', error);
    elements.appsList.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5);">Error al cargar apps.</p>';
  }
}

function renderAppsList(apps) {
  if (!apps || apps.length === 0) {
    elements.appsList.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5);">No tienes apps creadas aún. Crea tu primera app.</p>';
    return;
  }

  elements.appsList.innerHTML = apps.map(app => `
    <div class="app-card">
      <div class="app-card-title">${app.business_name || 'Sin nombre'}</div>
      <div class="app-card-slug">/${app.slug}</div>
      <span class="app-card-status ${app.is_active ? 'active' : 'inactive'}">
        ${app.is_active ? 'Activo' : 'Inactivo'}
      </span>
      <div class="app-card-actions">
        <button class="btn-edit" data-app-id="${app.id}" data-action="edit">Editar</button>
        <button class="btn-view" data-slug="${app.slug}" data-action="view">Ver página</button>
      </div>
    </div>
  `).join('');

  // Agregar event listeners a los botones
  elements.appsList.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => editApp(btn.dataset.appId));
  });

  elements.appsList.querySelectorAll('[data-action="view"]').forEach(btn => {
    btn.addEventListener('click', () => viewApp(btn.dataset.slug));
  });
}

function createNewApp() {
  // Resetear configuración
  config = {
    id: null,
    businessName: '',
    slug: '',
    logoUrl: '',
    logoSize: 100,
    backgroundType: 'solid',
    backgroundColor: '#050505',
    gradientColor: '#00ff8c',
    fontFamily: 'Inter',
    titleFont: '',
    chatBoxDesign: 'modern',
    chatBoxColor: '#00ff8c',
    pageDesign: 'design1',
    isActive: false
  };

  // Resetear todos los inputs
  elements.businessName.value = '';
  elements.slug.value = '';
  elements.logoUrl.value = '';
  elements.logoSize.value = 100;
  elements.logoSizeValue.textContent = '100px';
  elements.backgroundType.value = 'solid';
  elements.backgroundColor.value = '#050505';
  elements.backgroundColorText.value = '#050505';
  elements.gradientColor.value = '#00ff8c';
  elements.gradientColorText.value = '#00ff8c';
  elements.fontFamily.value = 'Inter';
  elements.titleFont.value = '';
  elements.chatBoxDesign.value = 'modern';
  elements.chatBoxColor.value = '#00ff8c';
  elements.chatBoxColorText.value = '#00ff8c';
  elements.isActive.checked = false;

  // Resetear selección de diseño
  document.querySelectorAll('.design-card').forEach(c => c.classList.remove('selected'));
  document.querySelector('.design-card[data-design="design1"]').classList.add('selected');

  elements.publicUrl.textContent = '/myia/[tu-slug]';

  updatePreview();
}

async function editApp(appId) {
  try {
    const response = await fetch(`https://crysantem-backend.onrender.com/api/myia/config-by-id/${appId}`);
    const result = await response.json();

    if (result.success) {
      const appConfig = result.data;

      // Guardar el ID en localStorage para que el builder pueda usarlo
      localStorage.setItem('editingAppId', appId);

      // Cargar configuración en el formato del builder
      const builderConfig = {
        id: appConfig.id,
        businessName: appConfig.business_name || '',
        slug: appConfig.slug || '',
        logoUrl: appConfig.logo_url || '',
        logoSize: appConfig.logo_size || 100,
        backgroundType: appConfig.background_type || 'solid',
        backgroundColor: appConfig.background_color || '#050505',
        backgroundGradient: appConfig.background_gradient || '#00ff8c',
        glowColor: appConfig.glow_color || '#00ff8c',
        fontFamily: appConfig.font_family || 'Inter',
        titleFont: appConfig.title_font || '',
        chatBoxDesign: appConfig.chat_box_design || 'modern',
        chatBoxColor: appConfig.chat_box_color || '#00ff8c',
        chatPosition: appConfig.chat_position || 'right',
        borderRadius: appConfig.border_radius || 'rounded',
        headerTheme: appConfig.header_theme || 'dark',
        pageDesign: appConfig.page_design || 'centered',
        showFooter: appConfig.show_footer !== false,
        splitImage: appConfig.split_image || '',
        splitText: appConfig.split_text || '',
        aiModel: appConfig.ai_model || 'gemini-flash',
        characterLimit: appConfig.character_limit || 50000,
        plan: appConfig.plan || 'basic',
        socialLinks: appConfig.social_links || {},
        isActive: appConfig.is_active || false
      };

      // Guardar en localStorage para que el builder lo cargue
      localStorage.setItem('builderConfig', JSON.stringify(builderConfig));

      // Redirigir al builder
      window.location.href = 'myia-builder-v2-simple.html';
    } else {
      alert('Error al cargar la app: ' + result.error);
    }
  } catch (error) {
    console.error('Error loading app:', error);
    alert('Error al cargar la app');
  }
}

function viewApp(slug) {
  window.open(`/api/myia/render/${slug}`, '_blank');
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  updatePreview();
  loadUserApps(); // Cargar apps del usuario al iniciar

  // Event listeners para botones principales
  const backBtn = document.getElementById('backBtn');
  const saveBtn = document.getElementById('saveBtn');
  const continueBtn = document.getElementById('continueBtn');
  const newAppBtn = document.getElementById('newAppBtn');
  const openPreviewBtn = document.getElementById('openPreviewBtn');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', saveConfig);
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      saveConfig();
      window.location.href = 'myia-prompt.html';
    });
  }

  if (newAppBtn) {
    newAppBtn.addEventListener('click', createNewApp);
  }

  if (openPreviewBtn) {
    openPreviewBtn.addEventListener('click', openPreview);
  }
});
