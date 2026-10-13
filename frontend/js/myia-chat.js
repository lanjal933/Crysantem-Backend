// Archivo compartido para todos los planes
// Carga configuración desde Supabase según el slug de la URL

async function loadChat() {
  // Obtener slug de la URL (última parte del path)
  const path = window.location.pathname;
  const slug = path.split('/').pop();
  
  console.log('Slug:', slug);
  
  if (!slug) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const response = await fetch(`https://crysantem-backend.onrender.com/api/myia/config-by-slug/${slug}`);
    const result = await response.json();

    if (result.success && result.data) {
      const config = result.data;
      
      // Ocultar loading
      document.getElementById('loading').style.display = 'none';
      document.getElementById('chat-container').style.display = 'flex';
      
      // Aplicar configuración
      document.title = config.business_name || 'MyIA Chat';
      
      // Nombre del bot
      document.getElementById('chatBotName').textContent = config.bot_name || 'Asistente';
      
      // Subtítulo
      document.getElementById('chatSubtitle').textContent = config.header_subtitle || '';
      
      // Avatar
      const avatarContainer = document.getElementById('chatAvatar');
      if (config.bot_avatar) {
        avatarContainer.innerHTML = `<img src="${config.bot_avatar}" alt="Bot">`;
      } else {
        avatarContainer.innerHTML = '🤖';
      }
      
      // Fondo
      const chatContainer = document.getElementById('chat-container');
      if (config.background_type === 'solid') {
        chatContainer.style.background = config.background_color || '#0d0d0d';
      } else if (config.background_type === 'gradient') {
        const colors = (config.background_gradient || '#0d0d0d,#1a1a1a').split(',');
        chatContainer.style.background = `linear-gradient(to top, ${colors[0]}, ${colors[1]})`;
      } else if (config.background_type === 'image' && config.background_image) {
        chatContainer.style.background = `url(${config.background_image}) center/cover`;
      }
      
      // Tema
      if (config.chat_theme === 'light') {
        document.getElementById('chat-container').classList.add('theme-light');
      }
      
      // Colores de burbujas
      const botMessages = document.querySelectorAll('.message-bot');
      const userMessages = document.querySelectorAll('.message-user');
      
      botMessages.forEach(msg => {
        msg.style.background = config.message_bubble_color || '#00ff88';
        msg.style.color = getContrastColor(config.message_bubble_color || '#00ff88');
      });
      
      userMessages.forEach(msg => {
        msg.style.background = config.user_bubble_color || '#333333';
        msg.style.color = getContrastColor(config.user_bubble_color || '#333333');
      });
      
      // Mensaje de bienvenida
      if (config.welcome_message) {
        document.getElementById('welcomeMessage').textContent = config.welcome_message;
      }
      
      // Configurar envío de mensajes
      setupMessageSending(config);
    } else {
      document.getElementById('loading').innerHTML = '<p>Chat no encontrado</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('loading').innerHTML = '<p>Error al cargar el chat</p>';
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
