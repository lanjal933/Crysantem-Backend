// Editor especial para páginas ya pagadas
let currentPageId = null;
let pageConfig = null;

// Cargar configuración de la página
async function loadPageConfig() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    currentPageId = urlParams.get('pageId') || localStorage.getItem('editingAppId');

    if (!currentPageId) {
      showError('No se especificó ninguna página para editar');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      showError('No estás autenticado');
      return;
    }

    const response = await fetch(`https://crysantem-backend.onrender.com/api/myia/config-by-id/${currentPageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success && result.data) {
      pageConfig = result.data;
      
      // Verificar que la página esté pagada
      if (pageConfig.payment_status !== 'paid') {
        showError('Esta página no está pagada. Debes completar el pago antes de editar.');
        return;
      }

      renderEditor();
    } else {
      showError('Error al cargar la configuración: ' + (result.error || 'Desconocido'));
    }
  } catch (error) {
    console.error('Error loading page config:', error);
    showError('Error al cargar la configuración');
  }
}

function renderEditor() {
  const editorContent = document.getElementById('editorContent');
  
  editorContent.innerHTML = `
    <div class="editor-grid">
      <!-- Sección: Prompt -->
      <div class="editor-section">
        <h2 class="editor-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Configuración del Prompt
        </h2>
        
        <div class="form-group">
          <label class="form-label">Mensaje de Bienvenida</label>
          <textarea 
            class="form-textarea" 
            id="welcomeMessage"
            placeholder="Ej: ¡Hola! Bienvenido a mi negocio. ¿En qué puedo ayudarte hoy?"
            maxlength="200"
          >${pageConfig.welcome_message || ''}</textarea>
          <div class="form-helper">Máximo 200 caracteres</div>
        </div>

        <div class="form-group">
          <label class="form-label">System Prompt</label>
          <textarea 
            class="form-textarea" 
            id="systemPrompt"
            placeholder="Define cómo se comporta el agente de IA"
            maxlength="4000"
          >${pageConfig.system_prompt || ''}</textarea>
          <div class="form-helper">Máximo 4000 caracteres</div>
        </div>

        <div class="form-group">
          <label class="form-label">Super Prompt (Instrucciones avanzadas)</label>
          <textarea 
            class="form-textarea" 
            id="superPrompt"
            placeholder="Instrucciones adicionales para el comportamiento del agente"
          >${pageConfig.super_prompt || ''}</textarea>
        </div>
      </div>

      <!-- Sección: OAuth IDs -->
      <div class="editor-section">
        <h2 class="editor-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Credenciales OAuth
        </h2>

        <div class="oauth-credentials">
          <div class="oauth-credentials-title">⚠️ Solo para uso personal</div>
          <div class="oauth-credentials-text">
            Estas credenciales se usan para conectar con tus servicios de Google (Sheets, Calendar, Gmail). 
            No se comparten con terceros.
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Google Sheets ID</label>
          <input 
            type="text" 
            class="form-input" 
            id="googleSheetsId"
            placeholder="Ej: 1ABC123..."
            value="${pageConfig.integrations_config?.google_sheets?.sheet_id || ''}"
          />
          <div class="form-helper">ID de la hoja de cálculo de Google Sheets</div>
        </div>

        <div class="form-group">
          <label class="form-label">Google Drive Folder ID</label>
          <input 
            type="text" 
            class="form-input" 
            id="googleDriveFolderId"
            placeholder="Ej: 1ABC123..."
            value="${pageConfig.integrations_config?.google_drive?.folder_id || ''}"
          />
          <div class="form-helper">ID de la carpeta de Google Drive</div>
        </div>

        <div class="form-group">
          <label class="form-label">Google Calendar ID</label>
          <input 
            type="text" 
            class="form-input" 
            id="googleCalendarId"
            placeholder="Ej: primary o calendar ID específico"
            value="${pageConfig.integrations_config?.google_calendar?.calendar_id || ''}"
          />
          <div class="form-helper">ID del calendario de Google (usa 'primary' para el principal)</div>
        </div>

        <div class="form-group">
          <label class="form-label">Gmail Email de Envío</label>
          <input 
            type="email" 
            class="form-input" 
            id="gmailEmail"
            placeholder="Ej: tu@gmail.com"
            value="${pageConfig.integrations_config?.gmail?.email || ''}"
          />
          <div class="form-helper">Email desde el cual se enviarán los correos</div>
        </div>
      </div>

      <!-- Sección: Estética -->
      <div class="editor-section">
        <h2 class="editor-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          Estética del Panel
        </h2>

        <div class="form-group">
          <label class="form-label">Nombre del Negocio</label>
          <input 
            type="text" 
            class="form-input" 
            id="businessName"
            placeholder="Ej: Mi Negocio"
            value="${pageConfig.business_name || ''}"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Color de Fondo</label>
          <input 
            type="color" 
            class="form-input" 
            id="backgroundColor"
            value="${pageConfig.background_color || '#0a0a0a'}"
            style="height: 50px;"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Color del Chat</label>
          <input 
            type="color" 
            class="form-input" 
            id="chatBoxColor"
            value="${pageConfig.chat_box_color || '#00ff88'}"
            style="height: 50px;"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Fuente</label>
          <select class="form-select" id="fontFamily">
            <option value="Inter" ${pageConfig.font_family === 'Inter' ? 'selected' : ''}>Inter</option>
            <option value="Space Grotesk" ${pageConfig.font_family === 'Space Grotesk' ? 'selected' : ''}>Space Grotesk</option>
            <option value="Arial" ${pageConfig.font_family === 'Arial' ? 'selected' : ''}>Arial</option>
            <option value="Roboto" ${pageConfig.font_family === 'Roboto' ? 'selected' : ''}>Roboto</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">URL del Logo</label>
          <input 
            type="url" 
            class="form-input" 
            id="logoUrl"
            placeholder="Ej: https://ejemplo.com/logo.png"
            value="${pageConfig.logo_url || ''}"
          />
        </div>
      </div>

      <!-- Sección: Integraciones -->
      <div class="editor-section">
        <h2 class="editor-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          Integraciones Activas
        </h2>

        <div class="form-group">
          <label class="form-label">Indicaciones para IA (Sheets)</label>
          <textarea 
            class="form-textarea" 
            id="sheetsInstructions"
            placeholder="Cómo debe usar la IA la hoja de cálculo"
          >${pageConfig.integrations_config?.google_sheets?.instructions || ''}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Indicaciones para IA (Drive)</label>
          <textarea 
            class="form-textarea" 
            id="driveInstructions"
            placeholder="Cómo debe usar la IA la carpeta de Drive"
          >${pageConfig.integrations_config?.google_drive?.instructions || ''}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Indicaciones para IA (Calendar)</label>
          <textarea 
            class="form-textarea" 
            id="calendarInstructions"
            placeholder="Cómo debe usar la IA el calendario"
          >${pageConfig.integrations_config?.google_calendar?.instructions || ''}</textarea>
        </div>
      </div>
    </div>

    <div class="editor-actions">
      <button class="btn-cancel" id="cancelBtn">Cancelar</button>
      <button class="btn-save" id="saveBtn">Guardar Cambios</button>
    </div>
  `;

  // Agregar event listeners
  document.getElementById('saveBtn').addEventListener('click', saveChanges);
  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.location.href = 'myia-home.html';
  });
}

async function saveChanges() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('No estás autenticado');
      return;
    }

    const integrationsConfig = pageConfig.integrations_config || {};

    const updateData = {
      welcome_message: document.getElementById('welcomeMessage').value,
      system_prompt: document.getElementById('systemPrompt').value,
      super_prompt: document.getElementById('superPrompt').value,
      business_name: document.getElementById('businessName').value,
      background_color: document.getElementById('backgroundColor').value,
      chat_box_color: document.getElementById('chatBoxColor').value,
      font_family: document.getElementById('fontFamily').value,
      logo_url: document.getElementById('logoUrl').value,
      integrations_config: {
        ...integrationsConfig,
        google_sheets: {
          ...integrationsConfig.google_sheets,
          sheet_id: document.getElementById('googleSheetsId').value,
          instructions: document.getElementById('sheetsInstructions').value
        },
        google_drive: {
          ...integrationsConfig.google_drive,
          folder_id: document.getElementById('googleDriveFolderId').value,
          instructions: document.getElementById('driveInstructions').value
        },
        google_calendar: {
          ...integrationsConfig.google_calendar,
          calendar_id: document.getElementById('googleCalendarId').value,
          instructions: document.getElementById('calendarInstructions').value
        },
        gmail: {
          ...integrationsConfig.gmail,
          email: document.getElementById('gmailEmail').value
        }
      }
    };

    const response = await fetch(`https://crysantem-backend.onrender.com/api/myia/edit-page/${currentPageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (result.success) {
      alert('Cambios guardados exitosamente');
      window.location.href = 'myia-home.html';
    } else {
      alert('Error al guardar cambios: ' + (result.error || 'Desconocido'));
    }
  } catch (error) {
    console.error('Error saving changes:', error);
    alert('Error al guardar cambios');
  }
}

function showError(message) {
  const editorContent = document.getElementById('editorContent');
  editorContent.innerHTML = `
    <div class="error-state">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4"/>
        <path d="M12 16h.01"/>
      </svg>
      <h3 class="empty-state-title">Error</h3>
      <p class="empty-state-text">${message}</p>
      <button class="btn-create" id="errorBackBtn">Volver al Dashboard</button>
    </div>
  `;
  
  document.getElementById('errorBackBtn').addEventListener('click', () => {
    window.location.href = 'myia-home.html';
  });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  loadPageConfig();

  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'myia-home.html';
    });
  }
});
