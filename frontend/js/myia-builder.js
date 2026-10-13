// Configuración del builder para formato de chat
let chatConfig = {
  businessName: '',
  slug: '',
  botName: 'Asistente',
  headerSubtitle: '',
  botAvatar: '',
  chatTheme: 'dark',
  messageBubbleColor: '#00ff88',
  userBubbleColor: '#333333',
  backgroundType: 'solid', // solid, gradient, image
  backgroundColor: '#0d0d0d',
  backgroundGradient: '#0d0d0d,#1a1a1a',
  backgroundImage: ''
};

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
  await loadSavedConfig();
  initEventListeners();
  updatePreview();
  
  // Asegurar que el plan seleccionado esté en builderConfig
  const selectedPlan = localStorage.getItem('selectedPlan');
  if (selectedPlan) {
    console.log('Plan establecido:', selectedPlan);
  }
});

function loadSavedConfig() {
  const savedConfig = localStorage.getItem('builderConfig');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      chatConfig = { ...chatConfig, ...parsed };
      
      // Cargar valores en el formulario
      document.getElementById('businessName').value = chatConfig.businessName || '';
      document.getElementById('slug').value = chatConfig.slug || '';
      document.getElementById('botName').value = chatConfig.botName || 'Asistente';
      document.getElementById('headerSubtitle').value = chatConfig.headerSubtitle || '';
      document.getElementById('botAvatar').value = chatConfig.botAvatar || '';
      document.getElementById('chatTheme').value = chatConfig.chatTheme || 'dark';
      document.getElementById('messageBubbleColor').value = chatConfig.messageBubbleColor || '#00ff88';
      document.getElementById('messageBubbleColorValue').value = chatConfig.messageBubbleColor || '#00ff88';
      document.getElementById('userBubbleColor').value = chatConfig.userBubbleColor || '#333333';
      document.getElementById('userBubbleColorValue').value = chatConfig.userBubbleColor || '#333333';
      
      // Actualizar avatar si existe
      if (chatConfig.botAvatar) {
        document.getElementById('previewAvatar').innerHTML = `<img src="${chatConfig.botAvatar}" alt="Bot">`;
      }
    } catch (error) {
      console.error('Error al cargar configuración guardada:', error);
    }
  }
}

function initEventListeners() {
  // Botones del header
  const cancelBtn = document.getElementById('cancelBtn');
  const summaryBtn = document.getElementById('summaryBtn');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      localStorage.removeItem('editingAppId');
      window.location.href = 'myia-home.html';
    });
  }

  if (summaryBtn) {
    summaryBtn.addEventListener('click', goToSummary);
  }

  // Guardar estado en localStorage al cambiar cualquier valor
  ['businessName', 'slug', 'botName', 'headerSubtitle', 'botAvatar'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      chatConfig[id] = e.target.value;
      saveAndUpdatePreview();
    });
  });

  // Tema del chat
  document.getElementById('chatTheme').addEventListener('change', (e) => {
    chatConfig.chatTheme = e.target.value;
    saveAndUpdatePreview();
  });

  // Colores
  ['messageBubbleColor', 'userBubbleColor'].forEach(id => {
    const colorInput = document.getElementById(id);
    const valueInput = document.getElementById(id + 'Value');
    
    colorInput.addEventListener('input', (e) => {
      const key = id === 'messageBubbleColor' ? 'messageBubbleColor' : 'userBubbleColor';
      chatConfig[key] = e.target.value;
      valueInput.value = e.target.value;
      saveAndUpdatePreview();
    });
    
    valueInput.addEventListener('input', (e) => {
      const key = id === 'messageBubbleColor' ? 'messageBubbleColor' : 'userBubbleColor';
      chatConfig[key] = e.target.value;
      colorInput.value = e.target.value;
      saveAndUpdatePreview();
    });
  });

  // Avatar file
  document.getElementById('botAvatarFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        chatConfig.botAvatar = event.target.result;
        document.getElementById('botAvatar').value = event.target.result;
        saveAndUpdatePreview();
      };
      reader.readAsDataURL(file);
    }
  });

  // Background type
  document.getElementById('backgroundType').addEventListener('change', (e) => {
    chatConfig.backgroundType = e.target.value;
    
    // Mostrar/ocultar grupos según el tipo
    document.getElementById('solidColorGroup').style.display = e.target.value === 'solid' ? 'block' : 'none';
    document.getElementById('gradientGroup').style.display = e.target.value === 'gradient' ? 'block' : 'none';
    document.getElementById('imageGroup').style.display = e.target.value === 'image' ? 'block' : 'none';
    
    saveAndUpdatePreview();
  });

  // Background color (solid)
  ['backgroundColor', 'gradientStart', 'gradientEnd'].forEach(id => {
    const colorInput = document.getElementById(id);
    const valueInput = document.getElementById(id + 'Value');
    
    if (colorInput && valueInput) {
      colorInput.addEventListener('input', (e) => {
        const key = id === 'backgroundColor' ? 'backgroundColor' : 
                    id === 'gradientStart' ? 'backgroundGradient' : null;
        if (key === 'backgroundColor') {
          chatConfig.backgroundColor = e.target.value;
          valueInput.value = e.target.value;
        } else if (id === 'gradientStart') {
          const end = document.getElementById('gradientEnd').value;
          chatConfig.backgroundGradient = `${e.target.value},${end}`;
        } else if (id === 'gradientEnd') {
          const start = document.getElementById('gradientStart').value;
          chatConfig.backgroundGradient = `${start},${e.target.value}`;
        }
        saveAndUpdatePreview();
      });
      
      valueInput.addEventListener('input', (e) => {
        const key = id === 'backgroundColor' ? 'backgroundColor' : 
                    id === 'gradientStart' ? 'backgroundGradient' : null;
        if (key === 'backgroundColor') {
          chatConfig.backgroundColor = e.target.value;
          colorInput.value = e.target.value;
        } else if (id === 'gradientStart') {
          const end = document.getElementById('gradientEndValue').value;
          chatConfig.backgroundGradient = `${e.target.value},${end}`;
        } else if (id === 'gradientEnd') {
          const start = document.getElementById('gradientStartValue').value;
          chatConfig.backgroundGradient = `${start},${e.target.value}`;
        }
        saveAndUpdatePreview();
      });
    }
  });

  // Background image
  document.getElementById('backgroundImage').addEventListener('input', (e) => {
    chatConfig.backgroundImage = e.target.value;
    saveAndUpdatePreview();
  });

  document.getElementById('backgroundImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        chatConfig.backgroundImage = event.target.result;
        document.getElementById('backgroundImage').value = event.target.result;
        saveAndUpdatePreview();
      };
      reader.readAsDataURL(file);
    }
  });
}

function saveAndUpdatePreview() {
  localStorage.setItem('builderConfig', JSON.stringify(chatConfig));
  updatePreview();
}

function updatePreview() {
  // Actualizar nombre del chat
  document.getElementById('previewBotName').textContent = chatConfig.botName || 'Asistente';
  
  // Actualizar subtítulo
  document.getElementById('previewSubtitle').textContent = chatConfig.headerSubtitle || 'Mi Empresa';
  
  // Actualizar avatar
  const avatarContainer = document.getElementById('previewAvatar');
  if (chatConfig.botAvatar) {
    avatarContainer.innerHTML = `<img src="${chatConfig.botAvatar}" alt="Bot">`;
  } else {
    avatarContainer.innerHTML = '🤖';
  }
  
  // Actualizar colores
  const chatPreview = document.getElementById('chatPreview');
  const botMessages = document.querySelectorAll('.message-bot');
  const userMessages = document.querySelectorAll('.message-user');
  
  // Actualizar colores de burbujas
  botMessages.forEach(msg => {
    msg.style.background = chatConfig.messageBubbleColor || '#00ff88';
    msg.style.color = getContrastColor(chatConfig.messageBubbleColor || '#00ff88');
  });
  
  userMessages.forEach(msg => {
    msg.style.background = chatConfig.userBubbleColor || '#333333';
    msg.style.color = getContrastColor(chatConfig.userBubbleColor || '#333333');
  });
  
  // Actualizar tema
  if (chatConfig.chatTheme === 'light') {
    // Aplicar fondo según tipo
    if (chatConfig.backgroundType === 'solid') {
      chatPreview.style.background = chatConfig.backgroundColor || '#f5f5f5';
    } else if (chatConfig.backgroundType === 'gradient') {
      const colors = (chatConfig.backgroundGradient || '#f5f5f5,#e0e0e0').split(',');
      chatPreview.style.background = `linear-gradient(to top, ${colors[0]}, ${colors[1]})`;
    } else if (chatConfig.backgroundType === 'image' && chatConfig.backgroundImage) {
      chatPreview.style.background = `url(${chatConfig.backgroundImage}) center/cover`;
    } else {
      chatPreview.style.background = '#f5f5f5';
    }
    
    document.querySelector('.chat-header').style.background = '#fff';
    document.querySelector('.chat-header').style.borderColor = '#ddd';
    document.querySelector('.chat-header-name').style.color = '#000';
    document.querySelector('.chat-header-subtitle').style.color = '#666';
    document.querySelector('.chat-input').style.background = '#fff';
    document.querySelector('.chat-input').style.borderColor = '#ddd';
    document.querySelector('.chat-input input').style.background = '#f5f5f5';
    document.querySelector('.chat-input input').style.borderColor = '#ddd';
    document.querySelector('.chat-input input').style.color = '#000';
  } else {
    // Aplicar fondo según tipo (tema oscuro)
    if (chatConfig.backgroundType === 'solid') {
      chatPreview.style.background = chatConfig.backgroundColor || '#0d0d0d';
    } else if (chatConfig.backgroundType === 'gradient') {
      const colors = (chatConfig.backgroundGradient || '#0d0d0d,#1a1a1a').split(',');
      chatPreview.style.background = `linear-gradient(to top, ${colors[0]}, ${colors[1]})`;
    } else if (chatConfig.backgroundType === 'image' && chatConfig.backgroundImage) {
      chatPreview.style.background = `url(${chatConfig.backgroundImage}) center/cover`;
    } else {
      chatPreview.style.background = '#0d0d0d';
    }
    
    document.querySelector('.chat-header').style.background = '#1a1a1a';
    document.querySelector('.chat-header').style.borderColor = '#333';
    document.querySelector('.chat-header-name').style.color = '#fff';
    document.querySelector('.chat-header-subtitle').style.color = '#888';
    document.querySelector('.chat-input').style.background = '#1a1a1a';
    document.querySelector('.chat-input').style.borderColor = '#333';
    document.querySelector('.chat-input input').style.background = '#0d0d0d';
    document.querySelector('.chat-input input').style.borderColor = '#333';
    document.querySelector('.chat-input input').style.color = '#fff';
  }
}

function getContrastColor(hexColor) {
  // Convertir hex a RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calcular luminancia
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retornar negro o blanco según luminancia
  return luminance > 0.5 ? '#000' : '#fff';
}

function goToSummary() {
  // Guardar configuración
  localStorage.setItem('builderConfig', JSON.stringify(chatConfig));
  
  // Si estamos editando, mantener el editingAppId
  if (!chatConfig.id) {
    localStorage.removeItem('editingAppId');
  }
  
  // Redirigir a configuración de prompt
  window.location.href = 'myia-prompt.html';
}
