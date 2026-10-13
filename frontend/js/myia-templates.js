let selectedTemplate = null;

// Configuración de templates predefinidos
const TEMPLATES = {
  custom: {
    name: 'Personalizado',
    icon: '🎨',
    plan: null, // No fuerza plan
    systemPrompt: '',
    welcomeMessage: '',
    integrations: {
      calendar: false,
      sheets: false,
      gmail: false
    },
    builderConfig: {}
  },
  restaurant: {
    name: 'Restaurante',
    icon: '🍽️',
    plan: 'automatiza',
    systemPrompt: `Eres un asistente virtual para [NOMBRE DEL RESTAURANTE]. Tu objetivo es ayudar a los clientes con:

1. **Reservas**: Ayuda a reservar mesas verificando disponibilidad
2. **Menú**: Proporciona información del menú, precios y disponibilidad
3. **Horarios**: Informa sobre horarios de apertura y cierre
4. **Ubicación**: Proporciona dirección y cómo llegar

Siempre sé amable, profesional y eficiente. Para reservas, necesitas saber:
- Fecha y hora deseada
- Cantidad de personas
- Nombre del cliente
- Teléfono de contacto

Si no puedes reservar en el horario solicitado, sugiere alternativas cercanas.`,
    welcomeMessage: '¡Hola! 👋 Bienvenido a [NOMBRE RESTAURANTE]. ¿En qué puedo ayudarte hoy? Puedo reservar una mesa, mostrarte nuestro menú o responder tus preguntas.',
    integrations: {
      calendar: true,
      sheets: true,

      gmail: false
    },
    builderConfig: {
      chatBoxDesign: 'modern',
      chatBoxColor: '#ff6b35',
      backgroundColor: '#1a1a2e',
      backgroundGradient: '#ff6b35'
    }
  },
  gym: {
    name: 'Gimnasio',
    icon: '💪',
    plan: 'asiste',
    systemPrompt: `Eres un asistente virtual para [NOMBRE DEL GIMNASIO]. Tu objetivo es ayudar a los miembros con:

1. **Horarios de clases**: Informa sobre horarios de cada clase
2. **Inscripciones**: Ayuda a inscribirse en clases
3. **Membresías**: Proporciona información sobre planes y precios
4. **Ubicación**: Informa sobre dirección y estacionamiento

Siempre sé motivador y energético. Para inscripciones, necesitas:
- Nombre del cliente
- Clase deseada
- Horario preferido
- Contacto

Promueve la actividad física y el bienestar.`,
    welcomeMessage: '¡Hola! 💪 Bienvenido a [NOMBRE GIMNASIO]. ¿Qué tipo de entrenamiento estás buscando hoy? Puedo ayudarte con horarios, inscripciones o información sobre nuestras membresías.',
    integrations: {
      calendar: true,
      sheets: false,

      gmail: false
    },
    builderConfig: {
      chatBoxDesign: 'neon',
      chatBoxColor: '#00ff88',
      backgroundColor: '#0a0a0a',
      glowColor: '#00ff88'
    }
  },
  medical: {
    name: 'Consultorio Médico',
    icon: '🏥',
    plan: 'automatiza',
    systemPrompt: `Eres un asistente virtual para [NOMBRE DEL CONSULTORIO]. Tu objetivo es ayudar a los pacientes con:

1. **Turnos**: Ayuda a agendar turnos verificando disponibilidad
2. **Horarios**: Informa sobre horarios de atención del profesional
3. **Especialidad**: Proporciona información sobre especialidades del médico
4. **Ubicación**: Informa sobre dirección y cómo llegar

Siempre sé empático, profesional y claro. Para turnos, necesitas:
- Nombre del paciente
- Motivo de consulta
- Profesional deseado
- Horario preferido
- Teléfono de contacto

Prioriza la salud y el bienestar del paciente.`,
    welcomeMessage: '¡Hola! 🏥 Bienvenido a [NOMBRE CONSULTORIO]. ¿En qué puedo ayudarte hoy? Puedo agendar un turno, informarte sobre horarios o responder tus preguntas sobre nuestros profesionales.',
    integrations: {
      calendar: true,
      sheets: true,

      gmail: true
    },
    builderConfig: {
      chatBoxDesign: 'glass',
      chatBoxColor: '#4facfe',
      backgroundColor: '#1a1a2e',
      backgroundGradient: '#4facfe'
    }
  },
  ecommerce: {
    name: 'E-commerce',
    icon: '🛒',
    plan: 'asiste',
    systemPrompt: `Eres un asistente virtual para [NOMBRE DE LA TIENDA]. Tu objetivo es ayudar a los clientes con:

1. **Productos**: Proporciona información sobre productos, precios y stock
2. **Pedidos**: Ayuda a realizar pedidos y verifica disponibilidad
3. **Envíos**: Informa sobre opciones de envío y tiempos
4. **Promociones**: Destaca ofertas y descuentos vigentes

Siempre seas servicial y claro. Para pedidos, necesitas:
- Lista de productos deseados
- Dirección de envío
- Método de pago preferido
- Contacto

Haz recomendaciones personalizadas basadas en lo que el cliente busca.`,
    welcomeMessage: '¡Hola! 🛒 Bienvenido a [NOMBRE TIENDA]. ¿Qué estás buscando hoy? Puedo ayudarte a encontrar productos, verificar stock o realizar tu pedido.',
    integrations: {
      calendar: false,
      sheets: true,

      gmail: false
    },
    builderConfig: {
      chatBoxDesign: 'modern',
      chatBoxColor: '#ff9800',
      backgroundColor: '#1a1a1a'
    }
  },
  agency: {
    name: 'Inmobiliaria',
    icon: '🏠',
    plan: 'asiste',
    systemPrompt: `Eres un asistente virtual para [NOMBRE DE LA INMOBILIARIA]. Tu objetivo es ayudar a los clientes con:

1. **Propiedades**: Proporciona información sobre propiedades disponibles
2. **Visitas**: Ayuda a agendar visitas a propiedades
3. **Ubicación**: Informa sobre ubicaciones y zonas
4. **Precios**: Proporciona rangos de precios y condiciones

Siempre seas profesional y detallado. Para visitas, necesitas:
- Propiedad de interés
- Fecha y hora deseada
- Datos de contacto
- Cantidad de personas

Ayuda a encontrar la propiedad ideal para cada cliente.`,
    welcomeMessage: '¡Hola! 🏠 Bienvenido a [NOMBRE INMOBILIARIA]. ¿Qué tipo de propiedad estás buscando? Puedo ayudarte a encontrar opciones, agendar visitas o responder tus preguntas.',
    integrations: {
      calendar: true,
      sheets: true,

      gmail: false
    },
    builderConfig: {
      chatBoxDesign: 'minimal',
      chatBoxColor: '#00bcd4',
      backgroundColor: '#0a0a0a'
    }
  }
};

function selectTemplate(templateKey) {
  selectedTemplate = templateKey;
  
  // Actualizar UI
  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.remove('selected');
  });
  document.querySelector(`[data-template="${templateKey}"]`).classList.add('selected');
  
  // Habilitar botón continuar
  document.getElementById('continueBtn').disabled = false;
}

async function continueToPlans() {
  if (!selectedTemplate) return;

  const template = TEMPLATES[selectedTemplate];
  
  // Guardar template seleccionado
  localStorage.setItem('selectedTemplate', selectedTemplate);
  localStorage.setItem('templateConfig', JSON.stringify(template));

  // Si el template fuerza un plan, preseleccionarlo
  if (template.plan) {
    localStorage.setItem('selectedPlan', template.plan);
    localStorage.setItem('planConfig', JSON.stringify({
      aiModel: template.plan === 'automatiza' ? 'gemini-pro' : 'gemini-flash',
      messagesLimit: template.plan === 'automatiza' ? 5000 : template.plan === 'asiste' ? 2500 : 1000,
      minimumMonths: template.plan === 'automatiza' ? 6 : 3
    }));
  }

  // Redirigir al builder
  window.location.href = 'myia-builder.html';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Agregar listeners a las tarjetas de templates
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      selectTemplate(card.dataset.template);
    });
  });

  // Listener para el botón continuar
  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', continueToPlans);
  }

  // Listener para el botón volver
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
});
