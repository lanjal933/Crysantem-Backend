// Configuración del prompt
let promptConfig = {
  welcomeMessage: '',
  systemPrompt: ''
};

// Cargar configuración desde localStorage
function loadConfig() {
  const savedConfig = localStorage.getItem('promptConfig');
  if (savedConfig) {
    promptConfig = JSON.parse(savedConfig);
    document.getElementById('welcomeMessage').value = promptConfig.welcomeMessage || '';
    document.getElementById('systemPrompt').value = promptConfig.systemPrompt || '';
    updateCharacterCounts();
  } else {
    // Intentar cargar desde builderConfig si existe
    const builderConfig = localStorage.getItem('builderConfig');
    if (builderConfig) {
      const config = JSON.parse(builderConfig);
      promptConfig.welcomeMessage = config.welcomeMessage || 'Hola, ¿en qué puedo ayudarte?';
      promptConfig.systemPrompt = config.systemPrompt || '';
      
      document.getElementById('welcomeMessage').value = promptConfig.welcomeMessage;
      document.getElementById('systemPrompt').value = promptConfig.systemPrompt;
      updateCharacterCounts();
    }
  }
}

// Guardar configuración en localStorage
function saveConfig() {
  promptConfig.welcomeMessage = document.getElementById('welcomeMessage').value;
  promptConfig.systemPrompt = document.getElementById('systemPrompt').value;
  promptConfig.businessName = document.getElementById('businessNameInput').value;
  
  localStorage.setItem('promptConfig', JSON.stringify(promptConfig));
  
  // También actualizar builderConfig para mantener consistencia
  const builderConfig = localStorage.getItem('builderConfig');
  if (builderConfig) {
    const config = JSON.parse(builderConfig);
    config.welcomeMessage = promptConfig.welcomeMessage;
    config.systemPrompt = promptConfig.systemPrompt;
    config.businessName = promptConfig.businessName;
    localStorage.setItem('builderConfig', JSON.stringify(config));
  }
}

// Actualizar contadores de caracteres
function updateCharacterCounts() {
  const welcome = document.getElementById('welcomeMessage');
  const prompt = document.getElementById('systemPrompt');
  const welcomeCount = document.getElementById('welcomeCount');
  const promptCount = document.getElementById('promptCount');
  
  // Welcome message (max 200)
  const welcomeLength = welcome.value.length;
  welcomeCount.textContent = `${welcomeLength}/200 caracteres`;
  welcomeCount.className = 'character-count';
  if (welcomeLength > 180) {
    welcomeCount.classList.add('warning');
  }
  if (welcomeLength >= 200) {
    welcomeCount.classList.add('error');
  }
  
  // System prompt (max 4000)
  const promptLength = prompt.value.length;
  promptCount.textContent = `${promptLength}/4000 caracteres`;
  promptCount.className = 'character-count';
  if (promptLength > 3500) {
    promptCount.classList.add('warning');
  }
  if (promptLength >= 4000) {
    promptCount.classList.add('error');
  }
}

// Reemplazar placeholder [NOMBRE DEL NEGOCIO] con el nombre real
function replaceBusinessName() {
  const businessName = document.getElementById('businessNameInput').value;
  const systemPrompt = document.getElementById('systemPrompt');
  
  if (businessName) {
    systemPrompt.value = systemPrompt.value.replace(/\[NOMBRE DEL NEGOCIO\]/g, businessName);
    saveConfig();
  }
}

// Cargar ejemplo de prompt
function loadExample(exampleType) {
  const businessName = document.getElementById('businessNameInput').value || '[NOMBRE DEL NEGOCIO]';
  const systemPrompt = document.getElementById('systemPrompt');
  
  const examples = {
    basic: `Eres un asistente virtual amable y profesional de ${businessName}. Ayuda a los clientes con información sobre productos, horarios y servicios. Sé conciso y directo en tus respuestas.`,
    sales: `Eres un consultor de ventas experto de ${businessName}. Tu objetivo es ayudar a los clientes a encontrar el producto perfecto para sus necesidades. Pregunta sobre sus preferencias, presupuesto y caso de uso para hacer recomendaciones personalizadas.`,
    support: `Eres un especialista en soporte técnico de ${businessName}. Ayuda a los usuarios a resolver problemas técnicos paso a paso. Si no puedes resolver un problema, explica claramente qué información adicional necesitas o sugiere contactar a un especialista humano.`
  };
  
  if (examples[exampleType]) {
    systemPrompt.value = examples[exampleType];
    updateCharacterCounts();
    saveConfig();
  }
}

// Validar configuración antes de continuar
function validateConfig() {
  const welcome = document.getElementById('welcomeMessage').value.trim();
  const prompt = document.getElementById('systemPrompt').value.trim();
  
  if (!welcome) {
    alert('Por favor ingresa un mensaje de bienvenida');
    return false;
  }
  
  if (!prompt) {
    alert('Por favor ingresa las instrucciones del agente (system prompt)');
    return false;
  }
  
  if (welcome.length > 200) {
    alert('El mensaje de bienvenida no puede exceder 200 caracteres');
    return false;
  }
  
  if (prompt.length > 4000) {
    alert('El system prompt no puede exceder 4000 caracteres');
    return false;
  }
  
  return true;
}

// Inicializar event listeners
function initEventListeners() {
  const welcomeInput = document.getElementById('welcomeMessage');
  const promptInput = document.getElementById('systemPrompt');
  const businessInput = document.getElementById('businessNameInput');
  const backBtn = document.getElementById('backBtn');
  const continueBtn = document.getElementById('continueBtn');
  
  // Event listeners para inputs
  welcomeInput.addEventListener('input', () => {
    updateCharacterCounts();
    saveConfig();
  });
  
  promptInput.addEventListener('input', () => {
    updateCharacterCounts();
    saveConfig();
  });
  
  businessInput.addEventListener('input', () => {
    saveConfig();
  });
  
  businessInput.addEventListener('blur', () => {
    replaceBusinessName();
  });
  
  // Event listeners para ejemplos
  document.querySelectorAll('.prompt-example').forEach(example => {
    example.addEventListener('click', () => {
      const exampleType = example.dataset.example;
      loadExample(exampleType);
    });
  });
  
  // Botón volver
  backBtn.addEventListener('click', () => {
    saveConfig();
    window.location.href = 'myia-dashboard.html';
  });
  
  // Botón continuar
  continueBtn.addEventListener('click', () => {
    if (validateConfig()) {
      saveConfig();

      // Verificar si es coworker para saltar integraciones y payment
      const isCoworker = localStorage.getItem('coworkerSkipOAuth') === 'true';
      console.log('=== VERIFICANDO TIPO DE USUARIO ===');
      console.log('coworkerSkipOAuth:', localStorage.getItem('coworkerSkipOAuth'));
      console.log('isCoworker:', isCoworker);

      if (isCoworker) {
        console.log('🟢 COWORKER detectado - saltando integraciones y payment, yendo al resumen');

        // Guardar configuración de integraciones vacía
        const integrationsConfig = {
          sheets: { dbId: '', url: '', writeUsers: false, customSheets: [] },
          images: { uploaded: [] },
          gmail: { sender: '', replyTo: '', subject: '', template: '', sendType: 'immediate', aiSubject: true, aiBody: true, aiAttachments: false },
          calendar: { id: '', duration: 30, timezone: 'UTC', schedules: {} },
          functions: { prompt: '' }
        };
        localStorage.setItem('integrationsConfig', JSON.stringify(integrationsConfig));

        // Guardar configuración de payment como completada
        const paymentConfig = {
          plan: 'responde',
          paymentMethod: 'Coworker Free',
          googleConnected: true,
          googleEmail: 'Coworker (No OAuth)',
          paymentCompleted: true
        };
        localStorage.setItem('paymentConfig', JSON.stringify(paymentConfig));

        // Redirigir directo al resumen
        window.location.href = 'myia-summary.html';
      } else {
        console.log('🔵 USUARIO NORMAL detectado - flujo completo: integraciones → payment → resumen');
        // Flujo normal: ir a integraciones
        window.location.href = 'myia-integrations.html';
      }
    }
  });
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  initEventListeners();
});
