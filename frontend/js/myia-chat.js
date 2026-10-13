// Archivo compartido para todos los planes
// Carga configuración desde Supabase según el slug de la URL

async function loadChat() {
  // Obtener slug de la URL (última parte del path)
  const path = window.location.pathname;
  const slug = path.split('/').pop();
  
  console.log('=== LOAD CHAT DEBUG ===');
  console.log('Path completo:', path);
  console.log('Slug extraído:', slug);
  
  if (!slug || slug === 'myia-responde.html' || slug === 'myia-asiste.html' || slug === 'myia-automatiza.html' || slug === 'myia-intelligence.html') {
    console.log('Slug inválido o es nombre de archivo');
    document.getElementById('loading').innerHTML = '<p>URL inválida</p>';
    return;
  }

  try {
    console.log('Haciendo fetch a:', `https://crysantem-backend.onrender.com/api/myia/config-by-slug/${slug}`);
    const response = await fetch(`https://crysantem-backend.onrender.com/api/myia/config-by-slug/${slug}`);
    const result = await response.json();
    
    console.log('Respuesta del backend:', result);

    if (result.success && result.data) {
      const config = result.data;
      console.log('Configuración cargada:', config);
      
      // Ocultar loading
      document.getElementById('loading').style.display = 'none';
      document.getElementById('chat-container').style.display = 'flex';
      
      // Aplicar configuración
      document.title = config.business_name || 'MyIA Chat';
      console.log('Business name:', config.business_name);
      
      // Nombre del bot (usar business_name como fallback si bot_name es default)
      const botName = config.bot_name === 'Asistente' && config.business_name 
        ? config.business_name 
        : (config.bot_name || 'Asistente');
      document.getElementById('chatBotName').textContent = botName;
      console.log('Bot name:', botName);
      
      // Subtítulo (usar business_name como fallback si está vacío)
      const subtitle = config.header_subtitle || config.business_name || '';
      document.getElementById('chatSubtitle').textContent = subtitle;
      console.log('Subtitle:', subtitle);
      
      // Avatar
      const avatarContainer = document.getElementById('chatAvatar');
      if (config.bot_avatar) {
        avatarContainer.innerHTML = `<img src="${config.bot_avatar}" alt="Bot" onerror="this.parentElement.innerHTML='🤖'">`;
        console.log('Avatar URL:', config.bot_avatar);
      } else {
        avatarContainer.innerHTML = '🤖';
        console.log('Usando emoji por defecto');
      }
      
      // Fondo
      const chatContainer = document.getElementById('chat-container');
      if (config.background_type === 'solid') {
        chatContainer.style.background = config.background_color || '#0d0d0d';
        console.log('Fondo sólido:', config.background_color);
      } else if (config.background_type === 'gradient') {
        const colors = (config.background_gradient || '#0d0d0d,#1a1a1a').split(',');
        chatContainer.style.background = `linear-gradient(to top, ${colors[0]}, ${colors[1]})`;
        console.log('Fondo gradiente:', config.background_gradient);
      } else if (config.background_type === 'image' && config.background_image) {
        chatContainer.style.background = `url(${config.background_image}) center/cover`;
        console.log('Fondo imagen:', config.background_image);
      } else {
        console.log('Fondo por defecto (no configurado)');
      }
      
      // Tema
      if (config.chat_theme === 'light') {
        document.getElementById('chat-container').classList.add('theme-light');
        console.log('Tema claro');
      } else {
        console.log('Tema oscuro (por defecto)');
      }
      
      // Colores de burbujas
      const botBubbleColor = config.message_bubble_color || '#00ff88';
      const userBubbleColor = config.user_bubble_color || '#333333';
      console.log('Color burbuja bot:', botBubbleColor);
      console.log('Color burbuja usuario:', userBubbleColor);
      
      const botMessages = document.querySelectorAll('.message-bot');
      const userMessages = document.querySelectorAll('.message-user');
      
      botMessages.forEach(msg => {
        msg.style.background = botBubbleColor;
        msg.style.color = getContrastColor(botBubbleColor);
      });
      
      userMessages.forEach(msg => {
        msg.style.background = userBubbleColor;
        msg.style.color = getContrastColor(userBubbleColor);
      });
      
      // Mensaje de bienvenida
      if (config.welcome_message) {
        document.getElementById('welcomeMessage').textContent = config.welcome_message;
        console.log('Mensaje de bienvenida:', config.welcome_message);
      } else {
        console.log('Sin mensaje de bienvenida');
      }
      
      // Configurar envío de mensajes
      setupMessageSending(config);
    } else {
      console.log('Error: No se encontró configuración');
      console.log('Success:', result.success);
      console.log('Data:', result.data);
      document.getElementById('loading').innerHTML = '<p>Chat no encontrado. Verifica que el slug sea correcto.</p>';
    }
  } catch (error) {
    console.error('Error al cargar el chat:', error);
    document.getElementById('loading').innerHTML = '<p>Error al cargar el chat: ' + error.message + '</p>';
  }
}

function setupMessageSending(config) {
  const input = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const messagesContainer = document.getElementById('chatMessages');
  
  function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    
    // Agregar mensaje del usuario
    const userMessage = document.createElement('div');
    userMessage.className = 'message message-user';
    userMessage.textContent = message;
    userMessage.style.background = config.user_bubble_color || '#333333';
    userMessage.style.color = getContrastColor(config.user_bubble_color || '#333333');
    messagesContainer.appendChild(userMessage);
    
    // Limpiar input
    input.value = '';
    
    // Scroll al final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Enviar al backend (a implementar)
    sendToBackend(message, config);
  }
  
  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
}

async function sendToBackend(message, config) {
  const messagesContainer = document.getElementById('chatMessages');
  const sendButton = document.getElementById('sendButton');
  
  // Mostrar indicador de "escribiendo"
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'typing-indicator';
  typingIndicator.innerHTML = '<span></span><span></span><span></span>';
  typingIndicator.style.background = config.message_bubble_color || '#00ff88';
  messagesContainer.appendChild(typingIndicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Deshabilitar botón de enviar
  sendButton.disabled = true;
  
  try {
    const response = await fetch('https://crysantem-backend.onrender.com/api/myia/chat-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pageId: config.id,
        message: message,
        plan: config.plan
      })
    });
    
    const result = await response.json();
    
    // Remover indicador de "escribiendo"
    typingIndicator.remove();
    
    if (result.success && result.response) {
      // Agregar respuesta del bot con markdown
      const botMessage = document.createElement('div');
      botMessage.className = 'message message-bot';
      
      // Renderizar markdown si el renderer está disponible
      if (typeof markdownRenderer !== 'undefined') {
        botMessage.innerHTML = markdownRenderer.render(result.response);
      } else {
        botMessage.textContent = result.response;
      }
      
      botMessage.style.background = config.message_bubble_color || '#00ff88';
      botMessage.style.color = getContrastColor(config.message_bubble_color || '#00ff88');
      
      messagesContainer.appendChild(botMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Inicializar gráficos pendientes si Chart.js está disponible
      if (typeof Chart !== 'undefined' && window.pendingCharts && window.pendingCharts.length > 0) {
        window.pendingCharts.forEach(chartData => {
          const canvas = document.getElementById(chartData.id);
          if (canvas) {
            new Chart(canvas, {
              type: chartData.type,
              data: chartData.data
            });
          }
        });
        window.pendingCharts = [];
      }
    }
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    typingIndicator.remove();
  } finally {
    // Rehabilitar botón de enviar
    sendButton.disabled = false;
  }
}

function getContrastColor(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000' : '#fff';
}

loadChat();
