// Configuración del builder
let builderConfig = {
  businessName: '',
  slug: '',
  logoUrl: '',
  logoSize: 100,
  backgroundType: 'solid',
  backgroundColor: '#050505',
  backgroundGradient: '#00ff8c',
  glowColor: '#00ff8c',
  fontFamily: 'Inter',
  titleFont: '',
  chatMode: 'embedded', // 'embedded' o 'floating'
  chatBoxDesign: 'modern',
  chatPosition: 'right', // Fijo a derecha
  borderRadius: 12, // Ahora es número de píxeles
  chatBoxColor: '#00ff8c',
  headerTheme: 'dark',
  headerColor: 'rgba(0,0,0,0.3)',
  headerTitleSize: '2rem',
  pageDesign: 'centered',
  showFooter: true,
  splitImage: '',
  splitText: '',
  socialLinks: {},
  plan: 'responde',
  aiModel: 'gemini-flash',
  messagesLimit: 1000, // Límite de mensajes según plan
  // Nuevos campos
  agentName: 'Asistente Virtual',
  agentAvatar: '',
  quickPrompts: [],
  leadCapture: 'none',
  // Opciones específicas de layout
  centeredWidth: '800',
  centeredSpacing: 'normal'
};

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
  loadTemplateConfig();
  loadPlanConfig();
  await loadSavedConfig();
  initEventListeners();
  updatePreview();
  
  // Verificar si estamos configurando una página ya pagada
  const isConfiguringUnpaidPage = localStorage.getItem('isConfiguringUnpaidPage') === 'true';
  const summaryBtn = document.getElementById('summaryBtn');
  
  if (isConfiguringUnpaidPage) {
    summaryBtn.textContent = '⚡ Desplegar';
    summaryBtn.classList.add('btn-deploy');
  }
});

function loadTemplateConfig() {
  const templateConfig = localStorage.getItem('templateConfig');
  if (templateConfig) {
    try {
      const template = JSON.parse(templateConfig);
      
      // Aplicar configuración del template
      if (template.systemPrompt) {
        // Se aplicará en myia-prompt.html
        localStorage.setItem('templateSystemPrompt', template.systemPrompt);
      }
      if (template.welcomeMessage) {
        localStorage.setItem('templateWelcomeMessage', template.welcomeMessage);
      }
      if (template.integrations) {
        localStorage.setItem('templateIntegrations', JSON.stringify(template.integrations));
      }
      if (template.builderConfig) {
        Object.assign(builderConfig, template.builderConfig);
      }
      
      console.log('Template cargado:', template.name);
    } catch (e) {
      console.error('Error loading template config:', e);
    }
  }
}

async function loadSavedConfig() {
  const saved = localStorage.getItem('builderConfig');
  const editingAppId = localStorage.getItem('editingAppId');

  // Si estamos editando una app existente, cargar configuración desde el backend
  if (editingAppId) {
    try {
      const response = await fetch(`https://crysantem-backend.onrender.com/api/myia/config-by-id/${editingAppId}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Convertir snake_case de la base de datos a camelCase
        const backendConfig = {
          id: result.data.id,
          businessName: result.data.business_name,
          slug: result.data.slug,
          logoUrl: result.data.logo_url,
          logoSize: result.data.logo_size,
          backgroundType: result.data.background_type,
          backgroundColor: result.data.background_color,
          backgroundGradient: result.data.background_gradient,
          glowColor: result.data.glow_color,
          fontFamily: result.data.font_family,
          titleFont: result.data.title_font,
          chatMode: result.data.chat_mode || 'embedded',
          chatBoxDesign: result.data.chat_box_design,
          borderRadius: result.data.border_radius,
          chatBoxColor: result.data.chat_box_color,
          headerTheme: result.data.header_theme,
          pageDesign: result.data.page_design,
          showFooter: result.data.show_footer,
          splitImage: result.data.split_image,
          splitText: result.data.split_text,
          aiModel: result.data.ai_model,
          messagesLimit: result.data.messages_limit || 1000,
          plan: result.data.plan,
          socialLinks: result.data.social_links,
          is_active: result.data.is_active,
          agentName: result.data.agent_name || 'Asistente Virtual',
          agentAvatar: result.data.agent_avatar || '',
          quickPrompts: result.data.quick_prompts || [],
          leadCapture: result.data.lead_capture || 'none'
        };
        Object.assign(builderConfig, backendConfig);
        console.log('Configuración cargada desde backend para edición:', builderConfig);
      } else {
        console.error('Error al cargar configuración para edición:', result.error);
      }
    } catch (error) {
      console.error('Error fetching config for editing:', error);
    }
  } else if (saved) {
    // Si no estamos editando, usar configuración guardada en localStorage
    try {
      const savedConfig = JSON.parse(saved);
      Object.assign(builderConfig, savedConfig);
    } catch (e) {
      console.error('Error loading saved config:', e);
    }
  }

  // Restaurar valores en el DOM con verificaciones
  const setElementValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  const setElementText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const setElementChecked = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.checked = value;
  };

  setElementValue('businessName', builderConfig.businessName || '');
  setElementValue('slug', builderConfig.slug || '');
  setElementValue('logoUrl', builderConfig.logoUrl || '');
  setElementValue('logoSize', builderConfig.logoSize || 100);
  setElementText('logoSizeValue', `${builderConfig.logoSize || 100}px`);
  setElementValue('backgroundType', builderConfig.backgroundType || 'solid');
  setElementValue('backgroundColor', builderConfig.backgroundColor || '#050505');
  setElementValue('backgroundColorText', builderConfig.backgroundColor || '#050505');
  setElementValue('gradientColor', builderConfig.backgroundGradient || '#00ff8c');
  setElementValue('gradientColorText', builderConfig.backgroundGradient || '#00ff8c');
  setElementValue('glowColor', builderConfig.glowColor || '#00ff8c');
  setElementValue('glowColorText', builderConfig.glowColor || '#00ff8c');
  setElementValue('fontFamily', builderConfig.fontFamily || 'Inter');
  setElementValue('titleFont', builderConfig.titleFont || '');
  setElementValue('chatBoxDesign', builderConfig.chatBoxDesign || 'modern');
  setElementValue('chatBoxColor', builderConfig.chatBoxColor || '#00ff8c');
  setElementValue('chatBoxColorText', builderConfig.chatBoxColor || '#00ff8c');
  setElementValue('borderRadius', builderConfig.borderRadius || 12);
  setElementText('borderRadiusValue', `${builderConfig.borderRadius || 12}px`);

  // Nuevos campos
  setElementValue('chatMode', builderConfig.chatMode || 'embedded');
  setElementValue('agentName', builderConfig.agentName || 'Asistente Virtual');
  setElementValue('agentAvatar', builderConfig.agentAvatar || '');
  setElementValue('leadCapture', builderConfig.leadCapture || 'none');

  // Restaurar quick prompts
  if (builderConfig.quickPrompts && builderConfig.quickPrompts.length > 0) {
    setElementValue('quickPrompt1', builderConfig.quickPrompts[0] || '');
    setElementValue('quickPrompt2', builderConfig.quickPrompts[1] || '');
    setElementValue('quickPrompt3', builderConfig.quickPrompts[2] || '');
    setElementValue('quickPrompt4', builderConfig.quickPrompts[3] || '');
  }

  setElementValue('headerTheme', builderConfig.headerTheme || 'dark');
  setElementValue('headerColor', builderConfig.headerColor || 'rgba(0,0,0,0.3)');
  setElementValue('headerTitleSize', builderConfig.headerTitleSize || '2rem');
  setElementChecked('showFooter', builderConfig.showFooter !== false);

  // Restaurar diseño seleccionado
  document.querySelectorAll('.design-card').forEach(c => c.classList.remove('selected'));
  const selectedDesign = document.querySelector(`.design-card[data-design="${builderConfig.pageDesign}"]`);
  if (selectedDesign) selectedDesign.classList.add('selected');

  // Mostrar/ocultar grupos
  document.getElementById('gradientGroup').style.display = builderConfig.backgroundType === 'gradient' ? 'block' : 'none';
  document.getElementById('glowGroup').style.display = builderConfig.backgroundType === 'glow' ? 'block' : 'none';

  // Restaurar opciones específicas de layout
  document.getElementById('centeredWidth').value = builderConfig.centeredWidth || '800';
  document.getElementById('centeredSpacing').value = builderConfig.centeredSpacing || 'normal';

  // Mostrar opciones según el layout seleccionado
  updateLayoutOptions(builderConfig.pageDesign);

  // Restaurar social links
  if (builderConfig.socialLinks) {
    document.getElementById('facebookUrl').value = builderConfig.socialLinks.facebook || '';
    document.getElementById('instagramUrl').value = builderConfig.socialLinks.instagram || '';
    document.getElementById('linkedinUrl').value = builderConfig.socialLinks.linkedin || '';
    document.getElementById('twitterUrl').value = builderConfig.socialLinks.twitter || '';
  }
}

function loadPlanConfig() {
  const planConfig = JSON.parse(localStorage.getItem('planConfig') || '{}');
  if (planConfig.aiModel) {
    builderConfig.aiModel = planConfig.aiModel;
    builderConfig.messagesLimit = planConfig.messagesLimit || 1000;
    builderConfig.plan = localStorage.getItem('selectedPlan') || 'basic';

    updateMessagesDisplay();
  }
}

function updatePreview() {
  previewFrame.srcdoc = generatePreviewHTML();
}

function saveAndUpdatePreview() {
  localStorage.setItem('builderConfig', JSON.stringify(builderConfig));
  updatePreview();
}

function initEventListeners() {
  // Botones del header
  const cancelBtn = document.getElementById('cancelBtn');
  const summaryBtn = document.getElementById('summaryBtn');
  const clearCacheBtn = document.getElementById('clearCacheBtn');
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      // Si estamos editando, limpiar el editingAppId al cancelar
      localStorage.removeItem('editingAppId');
      window.location.href = 'myia-home.html';
    });
  }
  
  if (summaryBtn) {
    summaryBtn.addEventListener('click', () => {
      const isConfiguringUnpaidPage = localStorage.getItem('isConfiguringUnpaidPage') === 'true';
      
      if (isConfiguringUnpaidPage) {
        // Nuevo flujo: guardar y desplegar, redirigir a myia-home
        saveAndDeploy();
      } else {
        // Flujo normal: ir a prompt
        goToSummary();
      }
    });
  }
  
  // Botón de limpiar cache
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
      document.getElementById('clearCacheModal').style.display = 'flex';
    });
  }
  
  // Botones del modal de limpiar cache
  const cancelClearCacheBtn = document.getElementById('cancelClearCacheBtn');
  const confirmClearCacheBtn = document.getElementById('confirmClearCacheBtn');
  
  if (cancelClearCacheBtn) {
    cancelClearCacheBtn.addEventListener('click', () => {
      document.getElementById('clearCacheModal').style.display = 'none';
    });
  }
  
  if (confirmClearCacheBtn) {
    confirmClearCacheBtn.addEventListener('click', clearCache);
  }

  // Guardar estado en localStorage al cambiar cualquier valor
  ['businessName', 'slug', 'logoUrl'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      builderConfig[id] = e.target.value;
      saveAndUpdatePreview();
    });
  });

  // Logo file
  document.getElementById('logoFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        builderConfig.logoUrl = event.target.result;
        document.getElementById('logoUrl').value = event.target.result;
        saveAndUpdatePreview();
      };
      reader.readAsDataURL(file);
    }
  });

  // Ranges y selects
  document.getElementById('logoSize').addEventListener('input', (e) => {
    builderConfig.logoSize = parseInt(e.target.value);
    document.getElementById('logoSizeValue').textContent = `${builderConfig.logoSize}px`;
    saveAndUpdatePreview();
  });

  // Border radius como range
  const borderRadiusEl = document.getElementById('borderRadius');
  const borderRadiusValueEl = document.getElementById('borderRadiusValue');
  if (borderRadiusEl && borderRadiusValueEl) {
    borderRadiusEl.addEventListener('input', (e) => {
      builderConfig.borderRadius = parseInt(e.target.value);
      borderRadiusValueEl.textContent = `${e.target.value}px`;
      saveAndUpdatePreview();
    });
  }

  ['backgroundType', 'fontFamily', 'chatMode', 'chatBoxDesign', 'headerTheme', 'headerTitleSize', 'leadCapture'].forEach(id => {
    document.getElementById(id).addEventListener('change', (e) => {
      builderConfig[id] = e.target.value;

      // Mostrar/ocultar grupos según el tipo de fondo
      if (id === 'backgroundType') {
        document.getElementById('gradientGroup').style.display =
          e.target.value === 'gradient' ? 'block' : 'none';
        document.getElementById('glowGroup').style.display =
          e.target.value === 'glow' ? 'block' : 'none';
      }

      saveAndUpdatePreview();
    });
  });

  // Colors con sincronización de texto
  document.getElementById('backgroundColor').addEventListener('input', (e) => {
    builderConfig.backgroundColor = e.target.value;
    document.getElementById('backgroundColorText').value = e.target.value;
    saveAndUpdatePreview();
  });
  
  document.getElementById('backgroundColorText').addEventListener('input', (e) => {
    builderConfig.backgroundColor = e.target.value;
    document.getElementById('backgroundColor').value = e.target.value;
    saveAndUpdatePreview();
  });

  document.getElementById('gradientColor').addEventListener('input', (e) => {
    builderConfig.backgroundGradient = e.target.value;
    document.getElementById('gradientColorText').value = e.target.value;
    saveAndUpdatePreview();
  });
  
  document.getElementById('gradientColorText').addEventListener('input', (e) => {
    builderConfig.backgroundGradient = e.target.value;
    document.getElementById('gradientColor').value = e.target.value;
    saveAndUpdatePreview();
  });

  document.getElementById('glowColor').addEventListener('input', (e) => {
    builderConfig.glowColor = e.target.value;
    document.getElementById('glowColorText').value = e.target.value;
    saveAndUpdatePreview();
  });
  
  document.getElementById('glowColorText').addEventListener('input', (e) => {
    builderConfig.glowColor = e.target.value;
    document.getElementById('glowColor').value = e.target.value;
    saveAndUpdatePreview();
  });

  document.getElementById('chatBoxColor').addEventListener('input', (e) => {
    builderConfig.chatBoxColor = e.target.value;
    document.getElementById('chatBoxColorText').value = e.target.value;
    saveAndUpdatePreview();
  });
  
  document.getElementById('chatBoxColorText').addEventListener('input', (e) => {
    builderConfig.chatBoxColor = e.target.value;
    document.getElementById('chatBoxColor').value = e.target.value;
    saveAndUpdatePreview();
  });

  // Nuevos campos
  document.getElementById('agentName').addEventListener('input', (e) => {
    builderConfig.agentName = e.target.value;
    saveAndUpdatePreview();
  });

  document.getElementById('agentAvatar').addEventListener('input', (e) => {
    builderConfig.agentAvatar = e.target.value;
    saveAndUpdatePreview();
  });

  // Header theme y color
  const headerThemeEl = document.getElementById('headerTheme');
  if (headerThemeEl) {
    headerThemeEl.addEventListener('change', (e) => {
      builderConfig.headerTheme = e.target.value;
      saveAndUpdatePreview();
    });
  }

  const headerColorEl = document.getElementById('headerColor');
  if (headerColorEl) {
    headerColorEl.addEventListener('change', (e) => {
      builderConfig.headerColor = e.target.value;
      saveAndUpdatePreview();
    });
  }

  // Quick prompts
  ['quickPrompt1', 'quickPrompt2', 'quickPrompt3', 'quickPrompt4'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      const index = parseInt(id.replace('quickPrompt', '')) - 1;
      builderConfig.quickPrompts[index] = e.target.value;
      saveAndUpdatePreview();
    });
  });

  // Presets de color
  document.querySelectorAll('.color-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      builderConfig.chatBoxColor = color;
      document.getElementById('chatBoxColor').value = color;
      document.getElementById('chatBoxColorText').value = color;
      saveAndUpdatePreview();
    });
  });

  // Diseño de página
  document.querySelectorAll('.design-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.design-card').forEach(c => {
        c.classList.remove('selected');
        c.style.borderColor = 'rgba(255,255,255,0.1)';
        c.style.color = 'rgba(255,255,255,0.7)';
      });
      card.classList.add('selected');
      card.style.borderColor = '#00ff8c';
      card.style.color = '#fff';
      builderConfig.pageDesign = card.dataset.design;
      updateLayoutOptions(card.dataset.design);
      saveAndUpdatePreview();
    });
  });

  // Footer checkbox
  document.getElementById('showFooter').addEventListener('change', (e) => {
    builderConfig.showFooter = e.target.checked;
    saveAndUpdatePreview();
  });

  // Social links
  ['facebookUrl', 'instagramUrl', 'linkedinUrl', 'twitterUrl'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      const network = id.replace('Url', '');
      builderConfig.socialLinks[network] = e.target.value;
      saveAndUpdatePreview();
    });
  });

  // Opciones específicas de layout
  ['centeredWidth', 'centeredSpacing'].forEach(id => {
    document.getElementById(id).addEventListener('change', (e) => {
      builderConfig[id] = e.target.value;
      saveAndUpdatePreview();
    });
  });
}

function updateMessagesDisplay() {
  const percentage = 0; // Se actualizará con uso real
  document.getElementById('characterBar').style.width = `${percentage}%`;
  document.getElementById('characterText').textContent =
    `0 / ${builderConfig.messagesLimit.toLocaleString()} mensajes al mes`;
}

function updateLayoutOptions(design) {
  // Solo mostramos opciones para centered
  document.getElementById('centeredOptions').style.display = 'block';
}

function updatePreview() {
  const html = generatePreviewHTML();
  const doc = document.getElementById('previewFrame').contentDocument;
  doc.open();
  doc.write(html);
  doc.close();
}

function generatePreviewHTML() {
  const getBackground = () => {
    switch (builderConfig.backgroundType) {
      case 'gradient':
        return `linear-gradient(135deg, ${builderConfig.backgroundColor} 0%, ${builderConfig.backgroundGradient} 100%)`;
      case 'glow':
        // Estilo Crysantem: múltiples radial-gradients
        return `radial-gradient(ellipse at top right, ${builderConfig.glowColor}33 0%, transparent 50%),
                radial-gradient(ellipse at bottom left, rgba(157, 78, 221, 0.12) 0%, transparent 50%),
                radial-gradient(ellipse at center, rgba(72, 202, 228, 0.08) 0%, transparent 50%),
                ${builderConfig.backgroundColor}`;
      default:
        return builderConfig.backgroundColor;
    }
  };

  const getBorderRadius = () => {
    switch (builderConfig.borderRadius) {
      case 'sharp': return '0px';
      case 'pill': return '24px';
      default: return '12px';
    }
  };

  const getChatStyle = () => {
    switch (builderConfig.chatBoxDesign) {
      case 'classic':
        // Blanco más suave, no tan blanco puro
        return `background: rgba(245, 245, 245, 0.95); color: #1a1a1a; border: 2px solid ${builderConfig.chatBoxColor};`;
      case 'minimal':
        return `background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3);`;
      case 'neon':
        // Neon más suave, menos "colorinche"
        return `background: ${builderConfig.chatBoxColor}30; color: white; border: 1px solid ${builderConfig.chatBoxColor}50; box-shadow: 0 0 15px ${builderConfig.chatBoxColor}40;`;
      case 'glass':
        return `background: rgba(255,255,255,0.1); color: white; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);`;
      default:
        return `background: ${builderConfig.chatBoxColor}20; color: white;`;
    }
  };

  const getPageLayout = () => {
    const centeredWidth = builderConfig.centeredWidth || '800';
    const centeredSpacing = builderConfig.centeredSpacing || 'normal';
    const spacingMap = { compact: '20px', normal: '40px', relaxed: '60px' };
    return `
      .container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        padding: ${spacingMap[centeredSpacing]};
      }
      .header {
        width: 100%;
        max-width: ${centeredWidth}px;
        margin: 0 auto ${spacingMap[centeredSpacing]};
        border-radius: 0;
        background: ${builderConfig.headerColor};
      }
      .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        max-width: ${centeredWidth}px;
        margin: 0 auto;
      }
      .chat-section {
        padding: ${spacingMap[centeredSpacing]};
        background: rgba(0,0,0,0.1);
        border-radius: 12px;
        width: 100%;
      }
      .chat-wrapper { max-width: 600px; margin: 0 auto; width: 100%; }
      .footer { margin-top: 0; }
    `;
  };

  const titleFont = builderConfig.titleFont || builderConfig.fontFamily;

  const socialLinksHTML = Object.entries(builderConfig.socialLinks || {}).map(([network, url]) => {
    if (!url) return '';
    const icons = {
      facebook: 'FB',
      instagram: 'IG',
      linkedin: 'LI',
      twitter: 'TW'
    };
    return `<a href="${url}" target="_blank" style="color: white; text-decoration: none; margin: 0 10px; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 20px; font-size: 0.85rem;">${icons[network] || network}</a>`;
  }).join('');

  // Header style function
  const getHeaderStyle = () => {
    const isLight = builderConfig.headerTheme === 'light';
    const textColor = isLight ? '#1a1a1a' : 'white';
    return `color: ${textColor};`;
  };

  // Quick prompts HTML
  const quickPromptsHTML = (builderConfig.quickPrompts || [])
    .filter(p => p && p.trim())
    .map(prompt => `
      <button class="quick-prompt-btn" style="
        padding: 10px 16px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 20px;
        color: white;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s;
        margin: 0 6px 6px 0;
      ">${prompt}</button>
    `).join('');

  // Agent avatar HTML
  const agentAvatarHTML = builderConfig.agentAvatar 
    ? `<img src="${builderConfig.agentAvatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`
    : `<div style="width: 40px; height: 40px; border-radius: 50%; background: ${builderConfig.chatBoxColor}; display: flex; align-items: center; justify-content: center; font-weight: 600;">IA</div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;500;600;700&family=Lato:wght@400;500;700&family=Montserrat:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: ${getBackground()};
      font-family: ${builderConfig.fontFamily};
      color: white;
      min-height: 100vh;
    }
    ${getPageLayout()}
    .header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: ${builderConfig.headerColor};
      border-radius: 12px;
      ${getHeaderStyle()}
    }
    .logo {
      width: ${builderConfig.logoSize}px;
      height: ${builderConfig.logoSize}px;
      object-fit: contain;
      border-radius: 8px;
    }
    h1 {
      font-family: ${titleFont};
      font-size: ${builderConfig.headerTitleSize};
      font-weight: 700;
      ${getHeaderStyle()}
    }
    .chat-wrapper {
      width: 100%;
      ${builderConfig.chatMode === 'floating' ? `
        position: fixed;
        bottom: 20px;
        right: 20px;
        max-width: 350px;
        z-index: 1000;
      ` : ''}
    }
    .chat {
      background: rgba(0,0,0,0.8);
      border-radius: ${getBorderRadius()};
      ${builderConfig.chatMode === 'floating' ? `
        max-height: 500px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      ` : ''}
      overflow: hidden;
      ${getChatStyle()}
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    .chat-header {
      padding: 20px;
      font-weight: 600;
      font-size: 1.1rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chat-status {
      width: 10px;
      height: 10px;
      background: #00ff8c;
      border-radius: 50%;
    }
    .quick-prompts {
      padding: 16px 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .quick-prompt-btn:hover {
      background: ${builderConfig.chatBoxColor}40;
      border-color: ${builderConfig.chatBoxColor};
    }
    .chat-messages {
      padding: 20px;
      max-height: 400px;
      overflow-y: auto;
      min-height: 300px;
    }
    .chat-bubble {
      padding: 14px 18px;
      border-radius: ${getBorderRadius()};
      margin-bottom: 16px;
      max-width: 85%;
      line-height: 1.5;
    }
    .chat-bubble.ai {
      background: ${builderConfig.chatBoxColor}40;
      margin-right: auto;
    }
    .chat-bubble.user {
      background: rgba(255,255,255,0.1);
      margin-left: auto;
    }
    .chat-bubble { 
      padding: 14px 18px; 
      border-radius: ${getBorderRadius()}; 
      margin-bottom: 16px;
      max-width: 85%;
      line-height: 1.5;
    }
    .chat-bubble.ai { 
      background: ${builderConfig.chatBoxColor}40; 
      margin-right: auto;
    }
    .chat-bubble.user { 
      background: rgba(255,255,255,0.1); 
      margin-left: auto;
    }
    .chat-input {
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      gap: 12px;
    }
    .chat-input input {
      flex: 1;
      padding: 12px 16px;
      background: rgba(255,255,255,0.1);
      border: none;
      border-radius: 20px;
      color: white;
      font-size: 0.95rem;
    }
    .chat-input input::placeholder {
      color: rgba(255,255,255,0.5);
    }
    .chat-input button {
      padding: 12px 20px;
      background: ${builderConfig.chatBoxColor};
      border: none;
      border-radius: 20px;
      color: black;
      font-weight: 600;
      cursor: pointer;
    }
    .footer {
      margin-top: 20px;
      padding: 20px;
      text-align: center;
      font-size: 0.85rem;
      color: rgba(255,255,255,0.5);
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .social-links {
      margin-top: 16px;
      display: flex;
      justify-content: center;
      gap: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${builderConfig.logoUrl ? `<img src="${builderConfig.logoUrl}" class="logo">` : ''}
      <h1>${builderConfig.businessName || 'Mi Negocio'}</h1>
    </div>
    
    <div class="content">
      <p style="opacity: 0.8; line-height: 1.6; font-size: 1.1rem;">
        ${builderConfig.businessName ? `` : ''}
      </p>
    </div>

    <div class="chat-section">
      <div class="chat-wrapper">
        <div class="chat">
          <div class="chat-header">
            <div class="chat-status"></div>
            ${agentAvatarHTML}
            <span>${builderConfig.agentName || 'Asistente Virtual'}</span>
          </div>
          ${quickPromptsHTML ? `<div class="quick-prompts">${quickPromptsHTML}</div>` : ''}
          <div class="chat-messages">
            <div class="chat-bubble ai">Hola, ¿en qué puedo ayudarte?</div>
          </div>
          <div class="chat-input">
            <input type="text" placeholder="Escribe tu mensaje...">
            <button>Enviar</button>
          </div>
        </div>
      </div>
    </div>

    ${builderConfig.showFooter ? `
    <div class="footer">
      Powered by Crysantem Intelligence
      ${socialLinksHTML ? `<div class="social-links">${socialLinksHTML}</div>` : ''}
    </div>
    ` : ''}
  </div>
</body>
</html>`;
}

function goToSummary() {
  // Guardar configuración (sin prompt, eso va en myia-prompt.html)
  console.log('=== GUARDANDO CONFIGURACIÓN DEL BUILDER ===');
  console.log('builderConfig:', builderConfig);
  localStorage.setItem('builderConfig', JSON.stringify(builderConfig));

  // Verificar que se guardó
  const saved = localStorage.getItem('builderConfig');
  console.log('builderConfig guardado en localStorage:', saved);

  // Si estamos editando, mantener el editingAppId para que el resumen sepa que es edición
  // Pero si estamos creando nuevo, asegurarnos de que no haya editingAppId
  if (!builderConfig.id) {
    localStorage.removeItem('editingAppId');
  }

  // Redirigir a configuración de prompt (Siguiente paso)
  // Todos (incluyendo coworkers) pasan por prompt, pero coworkers saltan integraciones y payment
  window.location.href = 'myia-prompt.html';
}

async function saveAndDeploy() {
  try {
    const editingAppId = localStorage.getItem('editingAppId');
    
    if (!editingAppId) {
      alert('Error: No se encontró el ID de la página');
      return;
    }

    // Guardar configuración
    localStorage.setItem('builderConfig', JSON.stringify(builderConfig));
    
    // Limpiar flags
    localStorage.removeItem('isConfiguringUnpaidPage');
    localStorage.removeItem('editingAppId');
    
    alert('Configuración guardada. Ahora completa el prompt, integraciones y despliega desde el resumen.');
    window.location.href = 'myia-prompt.html';
  } catch (error) {
    console.error('Error deploying:', error);
    alert('Error al guardar configuración');
  }
}

// Limpiar cache de MyIA
function clearCache() {
  console.log('=== LIMPIANDO CACHE DE MYIA ===');
  
  // Limpiar todos los items de localStorage relacionados con MyIA
  const itemsToRemove = [
    'builderConfig',
    'promptConfig',
    'integrationsConfig',
    'paymentConfig',
    'selectedPlan',
    'token',
    'userId',
    'editingAppId',
    'viewingAppId'
  ];
  
  itemsToRemove.forEach(item => {
    localStorage.removeItem(item);
    console.log(`Removido: ${item}`);
  });
  
  // Ocultar modal
  document.getElementById('clearCacheModal').style.display = 'none';
  
  // Redirigir al dashboard de páginas
  window.location.href = 'myia-home.html';
}
