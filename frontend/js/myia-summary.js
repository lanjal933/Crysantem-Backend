// Función para normalizar slug
function normalizeSlug(slug) {
  if (!slug) return slug;
  
  return slug
    .toLowerCase() // Convertir a minúsculas
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/[._]/g, '-') // Puntos y guiones bajos a guiones
    .replace(/[^a-z0-9-]/g, '') // Eliminar caracteres no válidos
    .replace(/-+/g, '-') // Múltiples guiones a uno solo
    .replace(/^-|-$/g, ''); // Eliminar guiones al inicio y final
}

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar si estamos configurando una página ya pagada
  const isConfiguringUnpaidPage = localStorage.getItem('isConfiguringUnpaidPage') === 'true';
  let editingAppId = localStorage.getItem('editingAppId');
  
  if (isConfiguringUnpaidPage && editingAppId) {
    // Cambiar botón a "Desplegar"
    const createBtn = document.getElementById('createBtn');
    if (createBtn) {
      createBtn.textContent = '⚡ Desplegar';
      createBtn.classList.add('btn-deploy');
    }
  }

  // Verificar si viene del OAuth callback con token y plan
  const urlParams = new URLSearchParams(window.location.search);
  const oauthToken = urlParams.get('token');
  const oauthPlan = urlParams.get('plan');
  const googleConnected = urlParams.get('google_connected');
  
  if (oauthToken) {
    console.log('=== TOKEN RECIBIDO DESDE OAUTH ===');
    console.log('Token:', oauthToken);
    console.log('Plan:', oauthPlan);
    console.log('Google Connected:', googleConnected);
    
    // Guardar token en localStorage
    localStorage.setItem('token', oauthToken);
    
    // Decodificar JWT para obtener userId
    try {
      const tokenParts = oauthToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        localStorage.setItem('userId', payload.userId || payload.id);
        console.log('UserId extraído del token:', payload.userId || payload.id);
      }
    } catch (e) {
      console.error('Error decodificando token:', e);
    }
    
    // Guardar el plan si viene del OAuth
    if (oauthPlan) {
      localStorage.setItem('selectedPlan', oauthPlan);
      console.log('Plan guardado:', oauthPlan);
    }
    
    // Marcar Google como conectado
    if (googleConnected === 'true') {
      const paymentConfig = JSON.parse(localStorage.getItem('paymentConfig') || '{}');
      paymentConfig.googleConnected = true;
      paymentConfig.googleEmail = 'Autenticado con Google';
      paymentConfig.paymentCompleted = true;
      localStorage.setItem('paymentConfig', JSON.stringify(paymentConfig));
      console.log('Google conectado marcado en paymentConfig');
    }
    
    // Limpiar URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  let config = JSON.parse(localStorage.getItem('builderConfig') || '{}');
  const promptConfig = JSON.parse(localStorage.getItem('promptConfig') || '{}');
  const integrationsConfig = JSON.parse(localStorage.getItem('integrationsConfig') || '{}');
  const paymentConfig = JSON.parse(localStorage.getItem('paymentConfig') || '{}');
  
  const viewingAppId = localStorage.getItem('viewingAppId');
  editingAppId = localStorage.getItem('editingAppId');
  const appId = viewingAppId || editingAppId;

  console.log('=== DEBUG RESUMEN ===');
  console.log('builderConfig desde localStorage:', config);
  console.log('promptConfig:', promptConfig);
  console.log('integrationsConfig:', integrationsConfig);
  console.log('paymentConfig:', paymentConfig);
  console.log('viewingAppId:', viewingAppId);
  console.log('editingAppId:', editingAppId);
  console.log('appId:', appId);
  console.log('Config keys:', Object.keys(config));

  // Si estamos viendo o editando una app existente, cargar configuración desde el backend
  if (appId) {
    try {
      const response = await fetch(`https://crysantem-backend.onrender.com/api/myia/config-by-id/${appId}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Convertir snake_case de la base de datos a camelCase
        // builderConfig tiene PRIORIDAD sobre el backend (valores nuevos sobre valores viejos)
        config = {
          id: result.data.id,
          businessName: builderConfig.businessName || result.data.business_name || '',
          slug: builderConfig.slug || result.data.slug,
          botName: builderConfig.botName || result.data.bot_name || 'Asistente',
          headerSubtitle: builderConfig.headerSubtitle || result.data.header_subtitle || '',
          botAvatar: builderConfig.botAvatar || result.data.bot_avatar || '',
          chatTheme: builderConfig.chatTheme || result.data.chat_theme || 'dark',
          messageBubbleColor: builderConfig.messageBubbleColor || result.data.message_bubble_color || '#00ff88',
          userBubbleColor: builderConfig.userBubbleColor || result.data.user_bubble_color || '#333333',
          backgroundType: builderConfig.backgroundType || result.data.background_type || 'solid',
          backgroundColor: builderConfig.backgroundColor || result.data.background_color || '#0d0d0d',
          backgroundGradient: builderConfig.backgroundGradient || result.data.background_gradient || null,
          backgroundImage: builderConfig.backgroundImage || result.data.background_image || null,
          welcomeMessage: promptConfig.welcomeMessage || result.data.welcome_message || 'Hola, ¿en qué puedo ayudarte?',
          systemPrompt: promptConfig.systemPrompt || result.data.system_prompt || '',
          aiModel: result.data.ai_model || 'gemini-flash',
          plan: selectedPlan || result.data.plan || 'responde',
          is_active: result.data.is_active,
          integrations_config: integrationsConfig || result.data.integrations_config
        };
        console.log('Configuración cargada (builderConfig tiene prioridad):', config);
      } else {
        console.error('Error al cargar configuración:', result.error);
        // Si es 404, limpiar localStorage y usar builderConfig
        if (response.status === 404) {
          console.log('Configuración no encontrada (404), limpiando localStorage y usando builderConfig');
          localStorage.removeItem('editingAppId');
          localStorage.removeItem('viewingAppId');
          editingAppId = null;
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  } else {
    // Fusionar configuraciones de todas las secciones
    config = {
      ...config,
      welcomeMessage: promptConfig.welcomeMessage || 'Hola, ¿en qué puedo ayudarte?',
      systemPrompt: promptConfig.systemPrompt || '',
      businessName: promptConfig.businessName || config.businessName || '',
      integrations_config: integrationsConfig, // Usar integrations_config para el backend
      payment_plan: paymentConfig.plan || config.plan,
      payment_method: paymentConfig.paymentMethod,
      google_connected: paymentConfig.googleConnected || false
    };
    
    // Guardar la configuración fusionada
    localStorage.setItem('builderConfig', JSON.stringify(config));
    console.log('Configuración fusionada:', config);
    console.log('integrations_config:', config.integrations_config);
    console.log('integrations_config.raw:', JSON.stringify(config.integrations_config));
  }

  // Cargar datos en el resumen
  console.log('Intentando cargar datos en el DOM...');

  const businessNameEl = document.getElementById('summaryBusinessName');
  const slugEl = document.getElementById('summarySlug');
  const urlEl = document.getElementById('summaryUrl');

  console.log('Elementos DOM encontrados:', {
    businessName: !!businessNameEl,
    slug: !!slugEl,
    url: !!urlEl
  });

  if (businessNameEl) {
    businessNameEl.textContent = config.businessName || '-';
    console.log('businessName establecido:', config.businessName);
  }
  if (slugEl) {
    slugEl.textContent = config.slug || '-';
    console.log('slug establecido:', config.slug);
  }
  if (urlEl) {
    urlEl.textContent = `crysantem.tech/${config.slug || '-'}`;
  }

  // Nuevos campos de chat
  const botNameEl = document.getElementById('summaryBotName');
  const headerSubtitleEl = document.getElementById('summaryHeaderSubtitle');
  const botAvatarEl = document.getElementById('summaryBotAvatar');
  const chatThemeEl = document.getElementById('summaryChatTheme');
  const messageBubbleColorEl = document.getElementById('summaryMessageBubbleColor');
  const userBubbleColorEl = document.getElementById('summaryUserBubbleColor');
  
  if (botNameEl) botNameEl.textContent = config.botName || 'Asistente';
  if (headerSubtitleEl) headerSubtitleEl.textContent = config.headerSubtitle || '-';
  if (botAvatarEl) botAvatarEl.textContent = config.botAvatar ? 'Configurado' : 'Por defecto';
  if (chatThemeEl) chatThemeEl.textContent = config.chatTheme === 'dark' ? 'Oscuro' : 'Claro';
  if (messageBubbleColorEl) messageBubbleColorEl.textContent = config.messageBubbleColor || '#00ff88';
  if (userBubbleColorEl) userBubbleColorEl.textContent = config.userBubbleColor || '#333333';

  // Fondo
  const backgroundTypeEl = document.getElementById('summaryBackgroundType');
  const backgroundValueEl = document.getElementById('summaryBackgroundValue');
  
  if (backgroundTypeEl) {
    const typeNames = { solid: 'Color Sólido', gradient: 'Degradado', image: 'Imagen' };
    backgroundTypeEl.textContent = typeNames[config.background_type] || 'Color Sólido';
  }
  
  if (backgroundValueEl) {
    if (config.background_type === 'solid') {
      backgroundValueEl.textContent = config.background_color || '#0d0d0d';
    } else if (config.background_type === 'gradient') {
      backgroundValueEl.textContent = config.background_gradient || '#0d0d0d → #1a1a1a';
    } else if (config.background_type === 'image') {
      backgroundValueEl.textContent = config.background_image ? 'Configurado' : 'No configurado';
    } else {
      backgroundValueEl.textContent = '-';
    }
  }

  const welcomeEl = document.getElementById('summaryWelcome');
  if (welcomeEl) welcomeEl.textContent = config.welcomeMessage || '-';
  
  const promptEl = document.getElementById('summaryPrompt');
  if (promptEl) promptEl.textContent = config.systemPrompt || '-';
  document.getElementById('summaryPrompt').textContent = config.systemPrompt || '-';

  // Mostrar integraciones
  if (config.integrations_config) {
    const integrationsSummary = document.getElementById('integrationsSummary');
    const integrationsList = [];
    
    if (config.integrations_config.sheets && config.integrations_config.sheets.dbId) {
      integrationsList.push('[OK] Google Sheets configurado');
    }
    if (config.integrations_config.images && config.integrations_config.images.uploaded.length > 0) {
      integrationsList.push(`[OK] ${config.integrations_config.images.uploaded.length} imágenes cargadas`);
    }
    if (config.integrations_config.gmail && config.integrations_config.gmail.sender) {
      integrationsList.push('[OK] Gmail configurado');
    }
    if (config.integrations_config.calendar && config.integrations_config.calendar.id) {
      integrationsList.push('[OK] Google Calendar configurado');
    }
    if (config.integrations_config.functions && config.integrations_config.functions.prompt) {
      integrationsList.push('[OK] Funciones de la IA configuradas');
    }
    
    if (integrationsList.length > 0) {
      integrationsSummary.innerHTML = integrationsList.map(item =>
        `<div style="padding: 4px 0; color: var(--text-main);">${item}</div>`
      ).join('');
    } else {
      integrationsSummary.innerHTML = '<p style="color: var(--text-muted);">Sin integraciones configuradas</p>';
    }
  }

  console.log('Datos cargados en el DOM');

  // Verificar valores después de cargar
  setTimeout(() => {
    console.log('=== VERIFICACIÓN POST-CARGA ===');
    const summaryBusinessName = document.getElementById('summaryBusinessName');
    const summarySlug = document.getElementById('summarySlug');
    const summaryBackground = document.getElementById('summaryBackground');
    
    console.log('summaryBusinessName.textContent:', summaryBusinessName ? summaryBusinessName.textContent : 'NULL');
    console.log('summarySlug.textContent:', summarySlug ? summarySlug.textContent : 'NULL');
    console.log('summaryBackground.textContent:', summaryBackground ? summaryBackground.textContent : 'NULL');
  }, 100);

  // Verificar si es coworker (para omitir OAuth)
  const isCoworker = localStorage.getItem('coworkerSkipOAuth') === 'true';
  console.log('¿Es coworker?', isCoworker);

  // Validar que los campos obligatorios estén cargados
  const requiredFields = {
    businessName: config.businessName,
    slug: config.slug,
    welcomeMessage: config.welcomeMessage,
    systemPrompt: config.systemPrompt
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => !value || value === '' || value === '-')
    .map(([key]) => key);

  if (missingFields.length > 0) {
    console.error('Campos faltantes:', missingFields);
    const createBtn = document.getElementById('createBtn');
    if (createBtn) {
      createBtn.disabled = true;
      createBtn.textContent = 'Faltan datos obligatorios';
      createBtn.style.background = '#ff4444';
    }

    // Mostrar mensaje de error
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      background: rgba(255, 68, 68, 0.2);
      border: 1px solid #ff4444;
      color: #ff4444;
      padding: 16px;
      border-radius: 8px;
      margin-top: 20px;
      text-align: center;
    `;
    errorDiv.innerHTML = `
      <strong>⚠️ Faltan datos obligatorios:</strong><br>
      ${missingFields.join(', ')}<br>
      <small>Por favor completa estos campos en el constructor antes de crear la página.</small>
    `;
    document.querySelector('.summary-footer').appendChild(errorDiv);
  } else {
    console.log('✓ Todos los campos obligatorios están completos');
  }

  // Si es coworker, marcar google_connected como true automáticamente
  if (isCoworker) {
    config.google_connected = true;
    config.payment_method = 'Coworker Free';
    config.payment_plan = 'responde';
    console.log('Coworker: OAuth omitido, google_connected marcado como true');
  }

  // MutationObserver para detectar cambios en los elementos
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        console.log('⚠️ Cambio detectado en:', mutation.target.id || mutation.target.className);
        console.log('Nuevo valor:', mutation.target.textContent);
      }
    });
  });

  const elementsToWatch = [
    'summaryBusinessName',
    'summarySlug',
    'summaryBackground'
  ];

  elementsToWatch.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      observer.observe(el, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }
  });

  // Event listeners para botones
  const backBtn = document.getElementById('backBtn');
  const createBtn = document.getElementById('createBtn');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (viewingAppId) {
        localStorage.removeItem('viewingAppId');
        window.location.href = 'myia-home.html';
      } else if (editingAppId) {
        localStorage.removeItem('editingAppId');
        window.location.href = 'myia-home.html';
      } else {
        window.location.href = 'myia-builder.html';
      }
    });
  }

  if (createBtn) {
    // Si estamos viendo una app existente, ocultar el botón de crear
    if (viewingAppId) {
      createBtn.style.display = 'none';
    } else {
      createBtn.addEventListener('click', createPage);
    }
  }
});

async function createPage() {
  const config = JSON.parse(localStorage.getItem('builderConfig') || '{}');
  const userId = localStorage.getItem('userId');
  editingAppId = localStorage.getItem('editingAppId');
  const paymentConfig = JSON.parse(localStorage.getItem('paymentConfig') || '{}');
  
  // Usar paymentPlan de paymentConfig, luego config.plan, luego localStorage.selectedPlan, luego 'responde'
  const plan = paymentConfig.paymentPlan || config.plan || localStorage.getItem('selectedPlan') || 'responde';
  const isConfiguringUnpaidPage = localStorage.getItem('isConfiguringUnpaidPage') === 'true';
  
  console.log('=== PLAN EN CREATEPAGE ===');
  console.log('paymentConfig.paymentPlan:', paymentConfig.paymentPlan);
  console.log('config.plan:', config.plan);
  console.log('selectedPlan desde localStorage:', localStorage.getItem('selectedPlan'));
  console.log('plan final usado:', plan);

  // Si estamos en modo trial, marcar como pagado automáticamente
  console.log('Payment config:', paymentConfig);
  
  if (paymentConfig.paymentMethod === 'trial') {
    console.log('=== MODO PRUEBA DETECTADO ===');
    config.payment_status = 'paid';
    config.payment_method = 'trial';
    config.payment_plan = paymentConfig.paymentPlan || config.plan || 'intelligence';
    config.is_active = true;
    console.log('Configurado como pagado:', config.payment_status);
  }
  
  // Limpiar selectedPlan de localStorage para evitar errores
  localStorage.removeItem('selectedPlan');

  // Convertir config a snake_case antes de usarlo
  const configSnakeCase = {
    business_name: config.businessName,
    slug: config.slug,
    bot_name: config.botName,
    header_subtitle: config.headerSubtitle,
    bot_avatar: config.botAvatar,
    chat_theme: config.chatTheme,
    message_bubble_color: config.messageBubbleColor,
    user_bubble_color: config.userBubbleColor,
    background_type: config.backgroundType,
    background_color: config.backgroundColor,
    background_gradient: config.backgroundGradient,
    background_image: config.backgroundImage,
    welcome_message: config.welcomeMessage,
    system_prompt: config.systemPrompt,
    ai_model: config.aiModel,
    plan: plan,
    is_active: true,
    integrations_config: config.integrations_config,
    super_prompt: config.super_prompt || null,
    // Pagos
    payment_plan: config.payment_plan || paymentConfig.paymentPlan || null,
    payment_method: config.payment_method || paymentConfig.paymentMethod || null,
    payment_status: config.payment_status || paymentConfig.paymentStatus || null
  };

  // Si estamos configurando una página ya pagada, solo guardar y redirigir a myia-home
  if (isConfiguringUnpaidPage && editingAppId) {
    try {
      addLog('Guardando configuración de página pagada...', 'info');
      
      const payload = {
        userId,
        config: {
          ...configSnakeCase,
          id: editingAppId,
          is_active: true
        }
      };

      const response = await fetch('https://crysantem-backend.onrender.com/api/myia/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        addLog('Página desplegada exitosamente', 'success');
        
        // Limpiar flags
        localStorage.removeItem('isConfiguringUnpaidPage');
        localStorage.removeItem('editingAppId');
        
        alert('Página desplegada exitosamente');
        window.location.href = 'myia-home.html';
      } else {
        addLog('Error al desplegar: ' + result.error, 'error');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deploying:', error);
      addLog('Error al desplegar: ' + error.message, 'error');
      alert('Error al desplegar: ' + error.message);
    }
    return;
  }

  // Generar super prompt según el plan
  const promptConfig = JSON.parse(localStorage.getItem('promptConfig') || '{}');
  const integrationsConfig = JSON.parse(localStorage.getItem('integrationsConfig') || '{}');
  
  let superPrompt = `# SUPER PROMPT - CRYSANTEM MYIA

## PROMPT BASE DEL USUARIO
${promptConfig.systemPrompt || 'Eres un asistente virtual amable y profesional.'}

## PLAN ACTIVO: ${plan.toUpperCase()}
`;

  // Agregar secciones según el plan
  if (plan === 'asiste' || plan === 'automatiza' || plan === 'intelligence') {
    // Sheets (todos los planes 02+)
    superPrompt += `
## INSTRUCCIONES PARA USAR SHEETS

### Base de Datos de Usuarios
- Sheet ID: ${integrationsConfig.sheets?.dbId || 'No configurado'}
- URL GET: ${integrationsConfig.sheets?.url || 'No configurado'}
`;
    
    // Sheets personalizados (planes 03+)
    if (plan === 'automatiza' || plan === 'intelligence') {
      if (integrationsConfig.sheets?.customSheets && integrationsConfig.sheets.customSheets.length > 0) {
        superPrompt += `
### Sheets Personalizados
`;
        integrationsConfig.sheets.customSheets.forEach((sheet, index) => {
          superPrompt += `
#### Sheet ${index + 1}: ${sheet.title || 'Sin título'}
- Sheet ID: ${sheet.id || 'No configurado'}
- URL GET: ${sheet.urlGet || 'No configurado'}
- URL POST: ${sheet.urlPost || 'No configurado'}
- Tipo de interacción: ${sheet.type || 'manual'}
- Prompt específico:
${sheet.prompt || 'Sin prompt específico'}
`;
        });
      }
    }
  }

  // Imágenes (planes 03+)
  if (plan === 'automatiza' || plan === 'intelligence') {
    if (integrationsConfig.images?.uploaded && integrationsConfig.images.uploaded.length > 0) {
      superPrompt += `
## INSTRUCCIONES PARA USAR IMÁGENES DEL USUARIO

Las siguientes imágenes están disponibles para mostrar en las respuestas:
`;
      integrationsConfig.images.uploaded.forEach((img, index) => {
        superPrompt += `
### Imagen ${index + 1}: ${img.name}
- Descripción: ${img.description || 'Sin descripción'}
- Uso: Usa esta imagen cuando el contexto sea relevante con "${img.description || img.name}"
`;
      });
    }
  }

  // Calendar (planes 03+)
  if (plan === 'automatiza' || plan === 'intelligence') {
    if (integrationsConfig.calendar?.schedules) {
      superPrompt += `
## HORARIOS DISPONIBLES

- Zona horaria: ${integrationsConfig.calendar.timezone || 'UTC'}
- Duración de citas: ${integrationsConfig.calendar.duration || 30} minutos

### Disponibilidad por día:
`;
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      
      days.forEach((day, index) => {
        const schedule = integrationsConfig.calendar.schedules[day];
        if (schedule && schedule.enabled) {
          superPrompt += `- ${dayNames[index]}: ${schedule.start} - ${schedule.end}\n`;
        } else {
          superPrompt += `- ${dayNames[index]}: No disponible\n`;
        }
      });
    }
  }

  // Gmail (solo plan 04)
  if (plan === 'intelligence') {
    if (integrationsConfig.gmail) {
      superPrompt += `
## CONFIGURACIÓN DE GMAIL

- Email de envío: ${integrationsConfig.gmail.sender || 'No configurado'}
- Reply-to: ${integrationsConfig.gmail.replyTo || 'No configurado'}
- Asunto: ${integrationsConfig.gmail.subject || 'No configurado'}
- Tipo de envío: ${integrationsConfig.gmail.sendType || 'immediate'}
- IA genera asunto: ${integrationsConfig.gmail.aiSubject ? 'Sí' : 'No'}
- IA genera cuerpo: ${integrationsConfig.gmail.aiBody ? 'Sí' : 'No'}
- IA genera adjuntos: ${integrationsConfig.gmail.aiAttachments ? 'Sí' : 'No'}
`;
    }
  }

  // Funciones de la IA (todos los planes)
  if (integrationsConfig.functions?.prompt) {
    superPrompt += `
## FUNCIONES DE LA IA

${integrationsConfig.functions.prompt}
`;
  }

  // Reglas generales según el plan
  superPrompt += `
## REGLAS GENERALES
`;
  
  if (plan === 'asiste') {
    superPrompt += `
1. Antes de usar Sheets, verifica las instrucciones específicas configuradas.
2. Drive está disponible para acceso a archivos según las indicaciones.
3. Usa el Sheet de base de datos para registrar información de usuarios cuando sea necesario.
`;
  } else if (plan === 'automatiza') {
    superPrompt += `
1. Antes de usar cualquier Sheet, verifica las instrucciones específicas de cada uno.
2. Cuando uses imágenes, asegúrate de que sean relevantes para el contexto de la conversación.
3. Para agendar citas, verifica los horarios disponibles antes de proponer horarios.
4. Usa los prompts específicos de cada sheet personalizado cuando interactúes con ellos.
5. Drive está disponible para acceso a archivos según las indicaciones.
`;
  } else if (plan === 'intelligence') {
    superPrompt += `
1. Antes de usar cualquier Sheet, verifica las instrucciones específicas de cada uno.
2. Cuando uses imágenes, asegúrate de que sean relevantes para el contexto de la conversación.
3. Para agendar citas, verifica los horarios disponibles antes de proponer horarios.
4. Usa los prompts específicos de cada sheet personalizado cuando interactúes con ellos.
5. Si necesitas información del usuario, extrae explícitamente las variables mencionados en los prompts específicos.
6. Gmail está configurado para envío de correos según las opciones habilitadas.
`;
  }

  // Guardar el super prompt en la configuración
  config.superPrompt = superPrompt;
  console.log('Super prompt generado para plan:', plan);
  console.log('Super prompt generado:', superPrompt);
  console.log('config.superPrompt asignado:', config.superPrompt);

  // Validación de campos obligatorios (formato de chat)
  const requiredFields = {
    businessName: config.businessName,
    slug: config.slug,
    botName: config.botName,
    welcomeMessage: config.welcomeMessage,
    systemPrompt: config.systemPrompt
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => !value || value === '' || value === '-')
    .map(([key]) => key);

  if (missingFields.length > 0) {
    alert(`Faltan datos obligatorios para crear la página:\n\n${missingFields.join(', ')}\n\nPor favor completa estos campos en el constructor.`);
    window.location.href = 'myia-dashboard.html';
    return;
  }

  if (!userId) {
    alert('Error: No hay usuario autenticado');
    return;
  }

  // Convertir camelCase a snake_case para el backend
  console.log('=== ANTES DE CONVERTIR A SNAKE_CASE ===');
  console.log('config completo:', config);
  console.log('config.superPrompt:', config.superPrompt);
  console.log('config.integrations_config:', config.integrations_config);
  console.log('config.payment_plan:', config.payment_plan);
  console.log('config.payment_method:', config.payment_method);
  console.log('config.google_connected:', config.google_connected);

  // Actualizar configSnakeCase con valores completos
  configSnakeCase.logo_url = config.logoUrl;
  configSnakeCase.logo_size = config.logoSize;
  configSnakeCase.glow_color = config.glowColor;
  configSnakeCase.super_prompt = config.superPrompt;
  configSnakeCase.payment_plan = config.payment_plan;
  configSnakeCase.payment_method = config.payment_method;
  configSnakeCase.google_connected = config.google_connected;

  console.log('Config en camelCase:', config);
  console.log('Config en snake_case:', configSnakeCase);
  console.log('integrations_config en snake_case:', configSnakeCase.integrations_config);

  // Mostrar pantalla de carga
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.classList.add('active');

  function addLog(message, type = 'info') {
    const loadingLog = document.getElementById('loadingLog');
    if (!loadingLog) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    loadingLog.appendChild(entry);
    loadingLog.scrollTop = loadingLog.scrollHeight;
    console.log(`[${type.toUpperCase()}]`, message);
  }

  try {
    addLog('Iniciando creación de página...', 'info');

    // Normalizar slug si existe
    if (configSnakeCase.slug) {
      // Agregar prefijo del plan al slug (usar la variable 'plan' ya calculada)
      const normalizedSlug = normalizeSlug(configSnakeCase.slug);
      configSnakeCase.slug = `${plan}-${normalizedSlug}`;
      configSnakeCase.plan = plan; // Asegurar que el plan esté establecido
      configSnakeCase.payment_plan = plan; // También establecer payment_plan
      addLog(`Slug normalizado con prefijo: ${configSnakeCase.slug}`, 'info');
      addLog(`Plan establecido: ${plan}`, 'info');
    } else {
      // Si no hay slug, asegurar que el plan esté establecido
      configSnakeCase.plan = plan;
      configSnakeCase.payment_plan = plan;
      addLog(`Plan establecido (sin slug): ${plan}`, 'info');
    }

    // Paso 1: Guardar configuración en Supabase
    addLog('Guardando configuración en base de datos...', 'info');
    const payload = {
      userId,
      config: {
        ...configSnakeCase,
        id: editingAppId || config.id || undefined,
        is_active: true
      }
    };

    const response = await fetch('https://crysantem-backend.onrender.com/api/myia/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    console.log('=== RESPUESTA DEL BACKEND ===');
    console.log('Respuesta completa:', result);
    console.log('Success:', result.success);
    console.log('Data:', result.data);
    console.log('DEBUG:', result.debug);
    if (result.data) {
      console.log('integrations_config guardado:', result.data.integrations_config);
      console.log('payment_plan guardado:', result.data.payment_plan);
      console.log('payment_method guardado:', result.data.payment_method);
      console.log('google_connected guardado:', result.data.google_connected);
    }

    if (!result.success) {
      addLog('Error al guardar configuración: ' + result.error, 'error');
      throw new Error(result.error);
    }

    addLog('Configuración guardada exitosamente', 'success');
    addLog(`ID de página: ${result.data?.id || 'N/A'}`, 'info');

    // Paso 2: Webhook de n8n deshabilitado temporalmente (endpoint no existe)
    addLog('Webhook de n8n deshabilitado temporalmente', 'info');

    // Paso 3: Generación de HTML deshabilitada temporalmente (endpoint no existe)
    addLog('Generación de HTML deshabilitada temporalmente', 'info');

    // Paso 4: Finalizar
    addLog('Proceso completado exitosamente', 'success');
    addLog('Redirigiendo a dashboard...', 'info');

    const action = editingAppId ? 'actualizada' : 'creada';
    alert(`Página ${action} exitosamente`);

    // Limpiar todo localStorage para iniciar nuevo flujo
    localStorage.removeItem('builderConfig');
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('planConfig');
    localStorage.removeItem('editingAppId');
    localStorage.removeItem('promptConfig');
    localStorage.removeItem('integrationsConfig');
    localStorage.removeItem('paymentConfig');
    localStorage.removeItem('isConfiguringUnpaidPage');

    setTimeout(() => {
      window.location.href = 'myia-home.html';
    }, 1000);

  } catch (error) {
    console.error('Error creating page:', error);
    addLog('Error fatal: ' + error.message, 'error');
    alert('Error al crear página: ' + error.message);
    loadingOverlay.classList.remove('active');
  }
}

function getDesignName(design) {
  const designs = {
    'centered': 'Centrado',
    'split': 'Dividido',
    'full': 'Chat Completo'
  };
  return designs[design] || 'Centrado';
}
