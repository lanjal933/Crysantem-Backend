// Límites de sheets personalizados por plan
const CUSTOM_SHEETS_LIMITS = {
  responde: 0,
  asiste: 0,
  automatiza: 1,
  intelligence: 2
};

// Límites de imágenes por plan
const IMAGES_LIMITS = {
  responde: 0,
  asiste: 0,
  automatiza: 10,
  intelligence: 15
};

// Configuración de integraciones por plan
const PLAN_INTEGRATIONS = {
  responde: [],
  asiste: ['sheets'],
  automatiza: ['sheets', 'images', 'calendar'],
  intelligence: ['sheets', 'images', 'calendar', 'gmail']
};

// Planes que tienen base de datos de usuarios
const HAS_USER_DATABASE = ['asiste', 'automatiza', 'intelligence'];

// Configuración de integraciones
let integrationsConfig = {
  sheets: {
    dbId: '',
    url: '',
    writeUsers: true,
    customSheets: [] // Array de sheets personalizados
  },
  images: {
    uploaded: []
  },
  gmail: {
    sender: '',
    replyTo: '',
    subject: '',
    template: '',
    sendType: 'immediate',
    aiSubject: true,
    aiBody: true,
    aiAttachments: false
  },
  calendar: {
    id: '',
    duration: 30,
    timezone: 'UTC',
    schedules: {
      Mon: { enabled: true, start: '09:00', end: '18:00' },
      Tue: { enabled: true, start: '09:00', end: '18:00' },
      Wed: { enabled: true, start: '09:00', end: '18:00' },
      Thu: { enabled: true, start: '09:00', end: '18:00' },
      Fri: { enabled: true, start: '09:00', end: '18:00' },
      Sat: { enabled: false, start: '09:00', end: '14:00' },
      Sun: { enabled: false, start: '09:00', end: '14:00' }
    }
  },
  functions: {
    prompt: ''
  }
};

// Cargar configuración desde localStorage
function loadConfig() {
  const savedConfig = localStorage.getItem('integrationsConfig');
  if (savedConfig) {
    integrationsConfig = JSON.parse(savedConfig);
    loadFormValues();
  }

  // Cargar plan seleccionado
  const planConfig = localStorage.getItem('selectedPlan');
  if (planConfig) {
    updateUIForPlan(planConfig);
  } else {
    // Intentar desde builderConfig
    const builderConfig = localStorage.getItem('builderConfig');
    if (builderConfig) {
      const config = JSON.parse(builderConfig);
      updateUIForPlan(config.plan);
    }
  }
}

// Guardar configuración en localStorage
function saveConfig() {
  console.log('=== GUARDANDO CONFIGURACIÓN DE INTEGRACIONES ===');
  
  // Sheets (visible para plan 02+)
  if (document.getElementById('sheetsDbId')) {
    integrationsConfig.sheets.dbId = document.getElementById('sheetsDbId')?.value || '';
    integrationsConfig.sheets.url = document.getElementById('sheetsUrl')?.value || '';
    integrationsConfig.sheets.writeUsers = document.getElementById('sheetsWriteUsers')?.checked || false;
    
    // Custom sheets (solo plan 03+ y 04+)
    if (document.getElementById('customSheetsList')) {
      const customSheets = [];
      document.querySelectorAll('.custom-sheet-card').forEach(card => {
        customSheets.push({
          title: card.querySelector('.custom-sheet-title')?.value || '',
          id: card.querySelector('.custom-sheet-id')?.value || '',
          urlGet: card.querySelector('.custom-sheet-url-get')?.value || '',
          urlPost: card.querySelector('.custom-sheet-url-post')?.value || '',
          type: card.querySelector('.custom-sheet-type')?.value || 'manual',
          prompt: card.querySelector('.custom-sheet-prompt')?.value || ''
        });
      });
      integrationsConfig.sheets.customSheets = customSheets;
    }
    console.log('Sheets:', integrationsConfig.sheets);
  }
  
  // Gmail (solo si existe)
  if (document.getElementById('gmailSender')) {
    integrationsConfig.gmail.sender = document.getElementById('gmailSender').value;
    integrationsConfig.gmail.replyTo = document.getElementById('gmailReplyTo').value;
    integrationsConfig.gmail.subject = document.getElementById('gmailSubject').value;
    integrationsConfig.gmail.template = document.getElementById('gmailTemplate').value;
    integrationsConfig.gmail.sendType = document.getElementById('gmailSendType').value;
    integrationsConfig.gmail.aiSubject = document.getElementById('gmailAiSubject').checked;
    integrationsConfig.gmail.aiBody = document.getElementById('gmailAiBody').checked;
    integrationsConfig.gmail.aiAttachments = document.getElementById('gmailAiAttachments').checked;
    console.log('Gmail:', integrationsConfig.gmail);
  }
  
  // Calendar (solo si existe)
  if (document.getElementById('calendarId')) {
    integrationsConfig.calendar.id = document.getElementById('calendarId').value;
    integrationsConfig.calendar.duration = parseInt(document.getElementById('calendarDuration').value);
    integrationsConfig.calendar.timezone = document.getElementById('calendarTimezone').value;
    
    // Obtener horarios por día
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    integrationsConfig.calendar.schedules = {};
    
    days.forEach(day => {
      const enabled = document.getElementById(`day${day}Enabled`)?.checked || false;
      const start = document.getElementById(`day${day}Start`)?.value || '09:00';
      const end = document.getElementById(`day${day}End`)?.value || '18:00';
      integrationsConfig.calendar.schedules[day] = { enabled, start, end };
    });
    console.log('Calendar:', integrationsConfig.calendar);
  }
  
  // Funciones de la IA (siempre visible)
  if (document.getElementById('functionsPrompt')) {
    integrationsConfig.functions.prompt = document.getElementById('functionsPrompt').value;
    console.log('Functions:', integrationsConfig.functions);
  }
  
  console.log('Configuración completa:', integrationsConfig);
  localStorage.setItem('integrationsConfig', JSON.stringify(integrationsConfig));
  console.log('Guardado en localStorage');
}

// Cargar valores en el formulario
function loadFormValues() {
  // Sheets (visible para plan 02+)
  if (document.getElementById('sheetsDbId')) {
    document.getElementById('sheetsDbId').value = integrationsConfig.sheets.dbId || '';
    document.getElementById('sheetsUrl').value = integrationsConfig.sheets.url || '';
    
    // Custom sheets
    if (document.getElementById('customSheetsList')) {
      // Limpiar lista existente
      document.getElementById('customSheetsList').innerHTML = '';
      
      // Cargar sheets personalizados
      if (integrationsConfig.sheets.customSheets && integrationsConfig.sheets.customSheets.length > 0) {
        integrationsConfig.sheets.customSheets.forEach(sheet => {
          addCustomSheetCard(sheet);
        });
      }
    }
  }
  
  // Gmail (solo plan 04)
  if (document.getElementById('gmailSender')) {
    document.getElementById('gmailSender').value = integrationsConfig.gmail.sender || '';
    document.getElementById('gmailReplyTo').value = integrationsConfig.gmail.replyTo || '';
    document.getElementById('gmailSubject').value = integrationsConfig.gmail.subject || '';
    document.getElementById('gmailTemplate').value = integrationsConfig.gmail.template || '';
    document.getElementById('gmailSendType').value = integrationsConfig.gmail.sendType || 'immediate';
    document.getElementById('gmailAiSubject').checked = integrationsConfig.gmail.aiSubject !== false;
    document.getElementById('gmailAiBody').checked = integrationsConfig.gmail.aiBody !== false;
    document.getElementById('gmailAiAttachments').checked = integrationsConfig.gmail.aiAttachments || false;
  }
  
  // Calendar (solo plan 03+)
  if (document.getElementById('calendarId')) {
    document.getElementById('calendarId').value = integrationsConfig.calendar.id || '';
    document.getElementById('calendarDuration').value = integrationsConfig.calendar.duration || 30;
    document.getElementById('calendarTimezone').value = integrationsConfig.calendar.timezone || 'America/Bogota';
    
    // Cargar horarios por día
    renderDayScheduleConfig();
  }
  
  // Cargar imágenes
  renderUploadedImages();
  
  // Cargar funciones de la IA
  if (document.getElementById('functionsPrompt')) {
    document.getElementById('functionsPrompt').value = integrationsConfig.functions?.prompt || '';
  }
}

// Actualizar UI según el plan
function updateUIForPlan(plan) {
  const availableIntegrations = PLAN_INTEGRATIONS[plan] || [];
  
  // Actualizar badge del plan
  const planNames = {
    responde: '01 - Responde',
    asiste: '02 - Asiste',
    automatiza: '03 - Automatiza',
    intelligence: '04 - Crysantem Intelligence'
  };
  document.getElementById('planBadge').textContent = planNames[plan] || plan;
  
  // Mostrar/ocultar tarjetas según el plan
  const cards = {
    sheets: document.getElementById('sheetsCard'),
    images: document.getElementById('imagesCard'),
    gmail: document.getElementById('gmailCard'),
    calendar: document.getElementById('calendarCard')
  };
  
  Object.keys(cards).forEach(key => {
    if (availableIntegrations.includes(key)) {
      cards[key].classList.remove('hidden');
      cards[key].classList.remove('disabled');
    } else {
      cards[key].classList.add('hidden');
    }
  });
  
// Mostrar/ocultar sección de custom sheets según el plan (03+ y 04+)
  const customSheetsSection = document.getElementById('customSheetsSection');
  if (customSheetsSection) {
    if (plan === 'automatiza' || plan === 'intelligence') {
      customSheetsSection.style.display = 'block';
      
      // Actualizar límite según el plan
      const limit = CUSTOM_SHEETS_LIMITS[plan] || 0;
      document.getElementById('customSheetsLimit').textContent = limit;
      updateCustomSheetsCount();
    } else {
      customSheetsSection.style.display = 'none';
    }
  }
  
  // Actualizar límite de imágenes según el plan
  const imagesLimit = IMAGES_LIMITS[plan] || 0;
  const imagesLimitEl = document.getElementById('imagesLimit');
  if (imagesLimitEl) {
    imagesLimitEl.textContent = imagesLimit;
    updateImagesCount();
  }
  
  // Guardar el plan en localStorage
  localStorage.setItem('selectedPlan', plan);
}

// Actualizar estado de configuración
function updateConfigStatus(integration, configured) {
  const statusDot = document.getElementById(`${integration}Status`);
  const statusText = document.getElementById(`${integration}StatusText`);
  
  if (configured) {
    statusDot.classList.add('configured');
    statusDot.classList.remove('partial');
    statusText.textContent = 'Configurado';
  } else {
    statusDot.classList.remove('configured');
    statusDot.classList.add('partial');
    statusText.textContent = 'Parcialmente configurado';
  }
}

// Actualizar contador de imágenes
function updateImagesCount() {
  const count = integrationsConfig.images.uploaded?.length || 0;
  const plan = localStorage.getItem('selectedPlan');
  const limit = IMAGES_LIMITS[plan] || 0;
  const remaining = limit - count;
  
  const countEl = document.getElementById('imagesCount');
  const remainingEl = document.getElementById('imagesRemaining');
  
  if (countEl) countEl.textContent = count;
  if (remainingEl) remainingEl.textContent = `Restantes: ${remaining}`;
}

// Manejar subida de imágenes
function handleImageUpload(event) {
  const files = event.target.files;
  const plan = localStorage.getItem('selectedPlan');
  const limit = IMAGES_LIMITS[plan] || 0;
  const currentCount = integrationsConfig.images.uploaded?.length || 0;
  
  for (let i = 0; i < files.length; i++) {
    // Verificar límite
    if (currentCount + i >= limit) {
      alert(`Has alcanzado el límite de ${limit} imagen(es) para el plan ${plan}.`);
      break;
    }
    
    const file = files[i];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      integrationsConfig.images.uploaded.push({
        name: file.name,
        data: e.target.result,
        description: ''
      });
      renderUploadedImages();
      updateImagesCount();
      saveConfig();
    };
    
    reader.readAsDataURL(file);
  }
}

// Renderizar imágenes cargadas
function renderUploadedImages() {
  const container = document.getElementById('uploadedImages');
  
  if (integrationsConfig.images.uploaded.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No hay imágenes cargadas</p>';
    return;
  }
  
  container.innerHTML = '';
  
  integrationsConfig.images.uploaded.forEach((img, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 120px; display: flex; flex-direction: column; gap: 8px;';
    
    const imgWrapper = document.createElement('div');
    imgWrapper.style.cssText = 'position: relative; width: 100%; height: 100px;';
    
    const imgEl = document.createElement('img');
    imgEl.src = img.data;
    imgEl.alt = img.name;
    imgEl.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);';
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.style.cssText = 'position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; background: #ff4444; border: none; border-radius: 50%; color: white; cursor: pointer; font-size: 12px;';
    removeBtn.addEventListener('click', () => removeImage(index));
    
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'form-input';
    descInput.placeholder = 'Descripción para IA...';
    descInput.value = img.description || '';
    descInput.style.cssText = 'font-size: 0.75rem; padding: 6px;';
    descInput.addEventListener('change', (e) => updateImageDescription(index, e.target.value));
    
    imgWrapper.appendChild(imgEl);
    imgWrapper.appendChild(removeBtn);
    wrapper.appendChild(imgWrapper);
    wrapper.appendChild(descInput);
    container.appendChild(wrapper);
  });
  
  updateConfigStatus('images', true);
}

// Actualizar descripción de imagen
function updateImageDescription(index, description) {
  integrationsConfig.images.uploaded[index].description = description;
  saveConfig();
}

// Eliminar imagen
function removeImage(index) {
  integrationsConfig.images.uploaded.splice(index, 1);
  renderUploadedImages();
  updateImagesCount();
  saveConfig();
}

// Generar super prompt para el plan 04
function generateSuperPrompt(config) {
  const plan = localStorage.getItem('selectedPlan');
  
  if (plan !== 'intelligence') {
    return null; // Solo plan 04 tiene super prompt
  }
  
  const promptConfig = JSON.parse(localStorage.getItem('promptConfig') || '{}');
  const integrationsConfig = config.integrations_config || {};
  
  let superPrompt = `# SUPER PROMPT - CRYSANTEM INTELLIGENCE

## PROMPT BASE DEL USUARIO
${promptConfig.systemPrompt || 'Eres un asistente virtual amable y profesional.'}

## INSTRUCCIONES PARA USAR SHEETS

### Base de Datos de Usuarios
- Sheet ID: ${integrationsConfig.sheets?.dbId || 'No configurado'}
- URL GET: ${integrationsConfig.sheets?.url || 'No configurado'}
- Indicaciones: ${integrationsConfig.sheets?.instructions || 'No configurado'}
`;

  // Agregar sheets personalizados
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

  // Agregar imágenes
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

  // Agregar horarios de calendar
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

  superPrompt += `
## REGLAS GENERALES
1. Antes de usar cualquier Sheet, verifica las instrucciones específicas de cada uno.
2. Cuando uses imágenes, asegúrate de que sean relevantes para el contexto de la conversación.
3. Para agendar citas, verifica los horarios disponibles antes de proponer horarios.
4. Usa los prompts específicos de cada sheet personalizado cuando interactúes con ellos.
5. Si necesitas información del usuario, extrae explícitamente las variables mencionadas en los prompts específicos.
`;

  return superPrompt;
}

// Renderizar configuración de horarios por día
function renderDayScheduleConfig() {
  const container = document.getElementById('dayScheduleConfig');
  if (!container) return;
  
  // Inicializar schedules si no existe
  if (!integrationsConfig.calendar.schedules) {
    integrationsConfig.calendar.schedules = {
      Mon: { enabled: true, start: '09:00', end: '18:00' },
      Tue: { enabled: true, start: '09:00', end: '18:00' },
      Wed: { enabled: true, start: '09:00', end: '18:00' },
      Thu: { enabled: true, start: '09:00', end: '18:00' },
      Fri: { enabled: true, start: '09:00', end: '18:00' },
      Sat: { enabled: false, start: '09:00', end: '14:00' },
      Sun: { enabled: false, start: '09:00', end: '14:00' }
    };
  }
  
  const dayNames = {
    Mon: 'Lunes',
    Tue: 'Martes',
    Wed: 'Miércoles',
    Thu: 'Jueves',
    Fri: 'Viernes',
    Sat: 'Sábado',
    Sun: 'Domingo'
  };
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  container.innerHTML = days.map(day => {
    const schedule = integrationsConfig.calendar.schedules[day] || { enabled: false, start: '09:00', end: '18:00' };
    
    return `
      <div class="day-schedule-row ${!schedule.enabled ? 'disabled' : ''}" id="row${day}">
        <span class="day-name">${dayNames[day]}</span>
        <input type="time" class="day-time-input" id="day${day}Start" value="${schedule.start}" ${!schedule.enabled ? 'disabled' : ''}>
        <input type="time" class="day-time-input" id="day${day}End" value="${schedule.end}" ${!schedule.enabled ? 'disabled' : ''}>
        <input type="checkbox" id="day${day}Enabled" ${schedule.enabled ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--green-main);">
      </div>
    `;
  }).join('');
  
  // Agregar event listeners
  days.forEach(day => {
    const enabledCheckbox = document.getElementById(`day${day}Enabled`);
    const startInput = document.getElementById(`day${day}Start`);
    const endInput = document.getElementById(`day${day}End`);
    
    if (enabledCheckbox && startInput && endInput) {
      enabledCheckbox.addEventListener('change', () => {
        const enabled = enabledCheckbox.checked;
        startInput.disabled = !enabled;
        endInput.disabled = !enabled;
        document.getElementById(`row${day}`).classList.toggle('disabled', !enabled);
        saveConfig();
      });
      
      startInput.addEventListener('change', saveConfig);
      endInput.addEventListener('change', saveConfig);
    }
  });
}

// Eliminar imagen
function removeImage(index) {
  integrationsConfig.images.uploaded.splice(index, 1);
  renderUploadedImages();
  saveConfig();
}

// Descargar plantilla de Google Sheets
function downloadSheetsTemplate() {
  // Descargar el archivo Excel de plantilla
  const link = document.createElement('a');
  link.href = 'base_datos_users.xlsx';
  link.download = 'base_datos_users.xlsx';
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert('Plantilla descargada. Abre el archivo Excel y sigue las instrucciones para crear tu Google Sheet.');
}

// Validar configuración antes de continuar
function validateConfig() {
  const plan = localStorage.getItem('selectedPlan');
  const availableIntegrations = PLAN_INTEGRATIONS[plan] || [];

  // Validar integraciones requeridas según el plan
  if (availableIntegrations.includes('sheets')) {
    const dbId = document.getElementById('sheetsDbId').value.trim();
    if (!dbId) {
      alert('Por favor configura el Sheet ID de la base de datos de usuarios');
      return false;
    }
  }

  if (availableIntegrations.includes('calendar')) {
    const calendarId = document.getElementById('calendarId').value.trim();
    if (!calendarId) {
      alert('Por favor configura el Calendar ID');
      return false;
    }
  }
  
  if (availableIntegrations.includes('gmail')) {
    const sender = document.getElementById('gmailSender').value.trim();
    if (!sender) {
      alert('Por favor configura el Gmail de envío');
      return false;
    }
  }
  
  return true;
}

// Actualizar contador de sheets personalizados
function updateCustomSheetsCount() {
  const count = document.querySelectorAll('.custom-sheet-card').length;
  const plan = localStorage.getItem('selectedPlan');
  const limit = CUSTOM_SHEETS_LIMITS[plan] || 0;
  const remaining = limit - count;
  
  document.getElementById('customSheetsCount').textContent = count;
  document.getElementById('customSheetsRemaining').textContent = `Restantes: ${remaining}`;
  
  // Deshabilitar botón si alcanzó el límite
  const addBtn = document.getElementById('addCustomSheetBtn');
  if (addBtn) {
    addBtn.disabled = remaining <= 0;
    if (remaining <= 0) {
      addBtn.textContent = 'Límite alcanzado';
      addBtn.style.opacity = '0.5';
    } else {
      addBtn.textContent = '+ Añadir Sheet Personalizado';
      addBtn.style.opacity = '1';
    }
  }
}

// Agregar una tarjeta de sheet personalizado
function addCustomSheetCard(sheetData = null) {
  const plan = localStorage.getItem('selectedPlan');
  const limit = CUSTOM_SHEETS_LIMITS[plan] || 0;
  const currentCount = document.querySelectorAll('.custom-sheet-card').length;
  
  // Verificar límite
  if (currentCount >= limit) {
    alert(`Has alcanzado el límite de ${limit} sheet(s) personalizado(s) para el plan ${plan}.`);
    return;
  }
  
  const template = document.getElementById('customSheetTemplate');
  const clone = template.content.cloneNode(true);
  const card = clone.querySelector('.custom-sheet-card');
  
  const customSheetsList = document.getElementById('customSheetsList');
  customSheetsList.appendChild(card);
  
  // Si hay datos previos, cargarlos
  if (sheetData) {
    card.querySelector('.custom-sheet-title').value = sheetData.title || '';
    card.querySelector('.custom-sheet-id').value = sheetData.id || '';
    card.querySelector('.custom-sheet-url-get').value = sheetData.urlGet || '';
    card.querySelector('.custom-sheet-url-post').value = sheetData.urlPost || '';
    card.querySelector('.custom-sheet-type').value = sheetData.type || 'manual';
    card.querySelector('.custom-sheet-prompt').value = sheetData.prompt || '';
  }
  
  // Event listeners para los inputs
  const sheetIdInput = card.querySelector('.custom-sheet-id');
  sheetIdInput.addEventListener('input', () => {
    const sheetId = sheetIdInput.value.trim();
    card.querySelector('.custom-sheet-url-get').value = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : '';
    card.querySelector('.custom-sheet-url-post').value = sheetId ? `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Hoja 1!A:B:append?valueInputOption=USER_ENTERED` : '';
    saveConfig();
  });
  
  card.querySelector('.custom-sheet-title').addEventListener('input', saveConfig);
  card.querySelector('.custom-sheet-type').addEventListener('change', saveConfig);
  card.querySelector('.custom-sheet-prompt').addEventListener('input', saveConfig);
  
  // Botón de eliminar
  card.querySelector('.delete-sheet-btn').addEventListener('click', () => {
    card.remove();
    updateCustomSheetsCount();
    saveConfig();
  });
  
  // Actualizar contador
  updateCustomSheetsCount();
}

// Inicializar event listeners
function initEventListeners() {
  // Event listeners para inputs de Sheets (si existe)
  const sheetsDbId = document.getElementById('sheetsDbId');
  if (sheetsDbId) {
    sheetsDbId.addEventListener('input', () => {
      updateConfigStatus('sheets', sheetsDbId.value.trim() !== '');
      // Generar URL automáticamente
      const sheetId = sheetsDbId.value.trim();
      const urlField = document.getElementById('sheetsUrl');
      if (urlField && sheetId) {
        urlField.value = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
      }
      saveConfig();
    });
    
    // Botón para agregar sheets personalizados
    const addCustomSheetBtn = document.getElementById('addCustomSheetBtn');
    if (addCustomSheetBtn) {
      addCustomSheetBtn.addEventListener('click', () => {
        addCustomSheetCard();
        saveConfig();
      });
    }
  }
  
  // Event listeners para subida de imágenes (si existe)
  const imageUpload = document.getElementById('imageUpload');
  const imageInput = document.getElementById('imageInput');
  
  if (imageUpload && imageInput) {
    imageUpload.addEventListener('click', () => imageInput.click());
    imageUpload.addEventListener('dragover', (e) => {
      e.preventDefault();
      imageUpload.style.borderColor = 'var(--green-main)';
    });
    imageUpload.addEventListener('dragleave', () => {
      imageUpload.style.borderColor = 'var(--border)';
    });
    imageUpload.addEventListener('drop', (e) => {
      e.preventDefault();
      imageUpload.style.borderColor = 'var(--border)';
      imageInput.files = e.dataTransfer.files;
      handleImageUpload({ target: imageInput });
    });
    imageInput.addEventListener('change', handleImageUpload);
  }
  
  // Event listeners para Gmail (si existe)
  const gmailSender = document.getElementById('gmailSender');
  if (gmailSender) {
    gmailSender.addEventListener('input', () => {
      updateConfigStatus('gmail', gmailSender.value.trim() !== '');
      saveConfig();
    });
    document.getElementById('gmailReplyTo').addEventListener('input', saveConfig);
    document.getElementById('gmailSubject').addEventListener('input', saveConfig);
    document.getElementById('gmailTemplate').addEventListener('input', saveConfig);
    document.getElementById('gmailSendType').addEventListener('change', saveConfig);
    document.getElementById('gmailAiSubject').addEventListener('change', saveConfig);
    document.getElementById('gmailAiBody').addEventListener('change', saveConfig);
    document.getElementById('gmailAiAttachments').addEventListener('change', saveConfig);
  }
  
  // Event listeners para Calendar (si existe)
  const calendarId = document.getElementById('calendarId');
  if (calendarId) {
    calendarId.addEventListener('input', () => {
      updateConfigStatus('calendar', calendarId.value.trim() !== '');
      saveConfig();
    });
    document.getElementById('calendarDuration').addEventListener('change', saveConfig);
    document.getElementById('calendarTimezone').addEventListener('change', saveConfig);
  }
  
  // Event listeners para Funciones de la IA (siempre existe)
  const functionsPrompt = document.getElementById('functionsPrompt');
  if (functionsPrompt) {
    functionsPrompt.addEventListener('input', () => {
      updateConfigStatus('functions', functionsPrompt.value.trim() !== '');
      saveConfig();
    });
  }
  
  // Botón de descarga de plantilla
  const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
  if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener('click', downloadSheetsTemplate);
  }
  
  // Botones de navegación
  document.getElementById('backBtn').addEventListener('click', () => {
    saveConfig();
    window.location.href = 'myia-prompt.html';
  });
  
  document.getElementById('continueBtn').addEventListener('click', () => {
    if (validateConfig()) {
      saveConfig();
      // Nuevo flujo: después de integraciones, ir a OAuth (myia-oauth.html)
      window.location.href = 'myia-oauth.html';
    }
  });
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si es coworker con plan 01 (saltar integraciones)
  const isCoworker = localStorage.getItem('coworkerSkipOAuth') === 'true';
  const selectedPlan = localStorage.getItem('selectedPlan');

  if (isCoworker && selectedPlan === 'responde') {
    console.log('Coworker con plan 01 - saltando integraciones');
    // Guardar configuración vacía de integraciones
    const emptyIntegrations = {
      sheets: { dbId: '', url: '', writeUsers: false, customSheets: [] },
      images: { uploaded: [] },
      gmail: { sender: '', replyTo: '', subject: '', template: '', sendType: 'immediate', aiSubject: true, aiBody: true, aiAttachments: false },
      calendar: { id: '', duration: 30, timezone: 'UTC', schedules: {} },
      functions: { prompt: '' }
    };
    localStorage.setItem('integrationsConfig', JSON.stringify(emptyIntegrations));
    // Redirigir a payment (que luego redirigirá a summary)
    window.location.href = 'myia-payment.html';
    return;
  }

  loadConfig();
  initEventListeners();
});
