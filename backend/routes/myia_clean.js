const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Guardar configuración de página
router.post('/config', async (req, res) => {
  try {
    const { userId, config } = req.body;

    // Asegurar que el usuario exista en myia_users
    const { data: myiaUser } = await supabase
      .from('myia_users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!myiaUser) {
      const { data: mainUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (mainUser) {
        await supabase.from('myia_users').insert({
          id: userId,
          email: mainUser.email,
          scopes: ['email', 'profile']
        });
        console.log('Usuario creado en myia_users:', userId);
      } else {
        return res.status(400).json({ success: false, error: 'Usuario no encontrado' });
      }
    }

    // Verificar si ya existe configuración con el mismo slug
    if (config.slug) {
      const { data: existingSlug } = await supabase
        .from('myia_page_config')
        .select('id')
        .eq('slug', config.slug)
        .single();

      if (existingSlug && existingSlug.id !== config.id) {
        return res.status(400).json({ success: false, error: 'El slug ya está en uso' });
      }
    }

    // Verificar si ya existe configuración para este usuario
    const { data: existing } = await supabase
      .from('myia_page_config')
      .select('*')
      .eq('user_id', userId)
      .eq('id', config.id || '')
      .single();

    let result;

    // Intento 1: Con todas las columnas
    const fullUpdateData = {
      business_name: config.business_name,
      slug: config.slug,
      logo_url: config.logo_url,
      logo_size: config.logo_size,
      background_type: config.background_type,
      background_color: config.background_color,
      background_gradient: config.background_gradient,
      glow_color: config.glow_color,
      font_family: config.font_family,
      title_font: config.title_font,
      chat_box_design: config.chat_box_design,
      chat_position: config.chat_position,
      border_radius: config.border_radius,
      chat_box_color: config.chat_box_color,
      header_theme: config.header_theme,
      page_design: config.page_design,
      show_footer: config.show_footer,
      split_image: config.split_image,
      split_text: config.split_text,
      welcome_message: config.welcome_message,
      system_prompt: config.system_prompt,
      ai_model: config.ai_model,
      character_limit: config.character_limit,
      plan: config.plan,
      social_links: config.social_links,
      is_active: config.is_active
    };

    // Intento 2: Solo columnas básicas
    const basicUpdateData = {
      business_name: config.business_name,
      slug: config.slug,
      logo_url: config.logo_url,
      logo_size: config.logo_size,
      background_type: config.background_type,
      background_color: config.background_color,
      font_family: config.font_family,
      chat_position: config.chat_position,
      border_radius: config.border_radius,
      chat_box_color: config.chat_box_color,
      header_theme: config.header_theme,
      welcome_message: config.welcome_message,
      system_prompt: config.system_prompt,
      ai_model: config.ai_model,
      character_limit: config.character_limit,
      plan: config.plan,
      social_links: config.social_links,
      is_active: config.is_active
    };

    try {
      if (existing && config.id) {
        const { data, error } = await supabase
          .from('myia_page_config')
          .update(fullUpdateData)
          .eq('id', config.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('myia_page_config')
          .insert({
            user_id: userId,
            ...fullUpdateData
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }
    } catch (error) {
      console.log('Intento con columnas completas falló, intentando con columnas básicas:', error.message);

      if (existing && config.id) {
        const { data, error } = await supabase
          .from('myia_page_config')
          .update(basicUpdateData)
          .eq('id', config.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('myia_page_config')
          .insert({
            user_id: userId,
            ...basicUpdateData
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener todas las apps de un usuario
router.get('/user-apps/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('myia_page_config')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting user apps:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener configuración por ID
router.get('/config-by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('myia_page_config')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting config by id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Servir página HTML por slug (pública)
router.get('/render/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Renderizando página con slug:', slug);

    const { data, error } = await supabase
      .from('myia_page_config')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error al buscar página:', error);
      throw error;
    }

    if (!data) {
      console.log('Página no encontrada para slug:', slug);
      return res.status(404).send('Página no encontrada o no está activa');
    }

    console.log('Configuración encontrada:', {
      business_name: data.business_name,
      slug: data.slug,
      is_active: data.is_active
    });

    const html = generatePageHTML(data);
    res.send(html);
  } catch (error) {
    console.error('Error rendering page:', error);
    res.status(500).send('Error al renderizar la página: ' + error.message);
  }
});

function generatePageHTML(config) {
  const titleFont = config.title_font || config.font_family;
  const socialLinks = config.social_links || {};
  const socialLinksHTML = Object.entries(socialLinks).map(([network, url]) => {
    if (!url) return '';
    const icons = { facebook: 'FB', instagram: 'IG', linkedin: 'LI', twitter: 'TW' };
    return `<a href="${url}" target="_blank" style="color: white; text-decoration: none; margin: 0 10px; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 20px; font-size: 0.85rem;">${icons[network] || network}</a>`;
  }).join('');

  const pageDesign = config.page_design || 'centered';
  const isFullChat = pageDesign === 'full';

  const getBackground = () => {
    if (config.background_type === 'gradient' && config.background_gradient) {
      return `linear-gradient(135deg, ${config.background_color} 0%, ${config.background_gradient} 100%)`;
    }
    if (config.background_type === 'glow' && config.glow_color) {
      return `radial-gradient(ellipse at top right, ${config.glow_color}33 0%, transparent 50%), ${config.background_color}`;
    }
    return config.background_color || '#050505';
  };

  const getBorderRadius = () => {
    if (config.border_radius === 'sharp') return '0px';
    if (config.border_radius === 'pill') return '24px';
    return '12px';
  };

  const getChatStyle = () => {
    if (config.chat_box_design === 'classic') return `background: rgba(245, 245, 245, 0.95); color: #1a1a1a; border: 2px solid ${config.chat_box_color};`;
    if (config.chat_box_design === 'minimal') return `background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3);`;
    if (config.chat_box_design === 'neon') return `background: ${config.chat_box_color}30; color: white; border: 1px solid ${config.chat_box_color}50; box-shadow: 0 0 15px ${config.chat_box_color}40;`;
    if (config.chat_box_design === 'glass') return `background: rgba(255,255,255,0.1); color: white; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);`;
    return `background: ${config.chat_box_color}20; color: white;`;
  };

  const pageLayout = {
    split: `
      .container { min-height: 100vh; display: flex; flex-direction: column; padding: 40px; }
      .header { width: 100%; margin: 0 0 30px 0; border-radius: 0; background: ${config.header_theme === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)'}; }
      .main-content { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; flex: 1; }
      .content-section { display: flex; flex-direction: column; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 12px; padding: 40px; gap: 20px; }
      .split-image { width: 100%; height: 200px; background-size: cover; background-position: center; border-radius: 8px; background-color: rgba(255,255,255,0.05); }
      .split-text { font-size: 1.1rem; line-height: 1.6; opacity: 0.9; }
      .chat-section { display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 12px; padding: 40px; }
      .chat-wrapper { width: 100%; max-width: 500px; }
      .footer { margin-top: 30px; }
    `,
    full: `
      .container { min-height: 100vh; display: flex; flex-direction: column; position: relative; }
      .header { position: absolute; top: 0; left: 0; right: 0; z-index: 10; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); margin: 0; border-radius: 0; }
      .content { display: none; }
      .chat-section { flex: 1; display: flex; align-items: center; justify-content: center; padding: 200px 40px 40px; }
      .chat-wrapper { width: 100%; max-width: 800px; height: calc(100vh - 260px); }
      .chat { height: 100%; }
      .chat-messages { max-height: calc(100% - 140px); }
      .footer { margin-top: 0; }
    `,
    centered: `
      .container { min-height: 100vh; display: flex; flex-direction: column; padding: 40px; }
      .header { width: 100%; margin: 0 0 40px 0; border-radius: 0; background: ${config.header_theme === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)'}; }
      .content { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
      .chat-section { padding: 40px; background: rgba(0,0,0,0.1); }
      .chat-wrapper { max-width: 600px; margin: 0 auto; width: 100%; }
      .footer { margin-top: 0; }
    `
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.business_name || 'Agente IA'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: ${getBackground()}; font-family: ${config.font_family || 'Inter'}; color: white; min-height: 100vh; }
    ${pageLayout[pageDesign] || pageLayout.centered}
    .header { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 12px; }
    .logo { width: ${config.logo_size || 100}px; height: ${config.logo_size || 100}px; object-fit: contain; border-radius: 8px; }
    h1 { font-family: ${titleFont}; font-size: 2.5rem; font-weight: 700; }
    .chat { background: rgba(0,0,0,0.8); border-radius: ${getBorderRadius()}; overflow: hidden; ${getChatStyle()} box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
    .chat-header { padding: 20px; font-weight: 600; font-size: 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 12px; }
    .chat-status { width: 10px; height: 10px; background: #00ff8c; border-radius: 50%; }
    .chat-messages { padding: 20px; max-height: 400px; overflow-y: auto; min-height: 300px; }
    .chat-bubble { padding: 14px 18px; border-radius: ${getBorderRadius()}; margin-bottom: 16px; max-width: 85%; line-height: 1.5; }
    .chat-bubble.ai { background: ${config.chat_box_color}40; margin-right: auto; }
    .chat-bubble.user { background: rgba(255,255,255,0.1); margin-left: auto; }
    .chat-input { padding: 16px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 12px; }
    .chat-input input { flex: 1; padding: 12px 16px; background: rgba(255,255,255,0.1); border: none; border-radius: 20px; color: white; font-size: 0.95rem; }
    .chat-input input::placeholder { color: rgba(255,255,255,0.5); }
    .chat-input button { padding: 12px 20px; background: ${config.chat_box_color}; border: none; border-radius: 20px; color: black; font-weight: 600; cursor: pointer; }
    .chat-input button:hover { opacity: 0.9; }
    .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 0.85rem; color: rgba(255,255,255,0.5); border-top: 1px solid rgba(255,255,255,0.1); }
    .social-links { margin-top: 16px; display: flex; justify-content: center; gap: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${config.logo_url ? `<img src="${config.logo_url}" class="logo">` : ''}
      <h1>${config.business_name || 'Mi Negocio'}</h1>
    </div>

    ${pageDesign === 'split' ? `
    <div class="main-content">
      <div class="content-section">
        ${config.split_image ? `<div class="split-image" style="background-image: url('${config.split_image}');"></div>` : '<div class="split-image"></div>'}
        ${config.split_text ? `<div class="split-text">${config.split_text}</div>` : ''}
      </div>
      <div class="chat-section">
        <div class="chat-wrapper">
          <div class="chat">
            <div class="chat-header"><div class="chat-status"></div><span>Asistente Virtual</span></div>
            <div class="chat-messages"><div class="chat-bubble ai">${config.welcome_message || 'Hola, ¿en qué puedo ayudarte?'}</div></div>
            <div class="chat-input"><input type="text" placeholder="Escribe tu mensaje..." disabled><button disabled>Enviar</button></div>
          </div>
        </div>
      </div>
    </div>
    ` : `
    <div class="chat-section">
      <div class="chat-wrapper">
        <div class="chat">
          <div class="chat-header"><div class="chat-status"></div><span>Asistente Virtual</span></div>
          <div class="chat-messages"><div class="chat-bubble ai">${config.welcome_message || 'Hola, ¿en qué puedo ayudarte?'}</div></div>
          <div class="chat-input"><input type="text" placeholder="Escribe tu mensaje..." ${isFullChat ? '' : 'disabled'}><button ${isFullChat ? '' : 'disabled'}>Enviar</button></div>
        </div>
      </div>
    </div>
    `}

    ${config.show_footer !== false ? `
    <div class="footer">
      Powered by Crysantem Intelligence
      ${socialLinksHTML ? `<div class="social-links">${socialLinksHTML}</div>` : ''}
    </div>
    ` : ''}
  </div>

  <script>
    const chatInput = document.querySelector('.chat-input input');
    const chatButton = document.querySelector('.chat-input button');
    const chatMessages = document.querySelector('.chat-messages');

    if (chatInput && chatButton && !chatInput.disabled) {
      chatButton.addEventListener('click', sendMessage);
      chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

      async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        addMessage(message, 'user');
        chatInput.value = '';
        addMessage('Funcionalidad de chat pendiente de integración con n8n', 'ai');
      }

      function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-bubble';
        messageDiv.classList.add(type);
        messageDiv.innerHTML = type === 'ai' ? marked.parse(text) : text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  </script>
</body>
</html>`;
}

module.exports = router;
