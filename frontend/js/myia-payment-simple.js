// Configuración de planes - NUEVO MODELO SaaS MRR
const PLAN_PRICES = {
  responde: {
    name: '01 - Responde',
    monthly: '$49.000/mes',
    annual: '$40.833/mes (anual)',
    annualTotal: '$490.000',
    aiModel: 'Gemini Flash',
    messagesLimit: '1.000 mensajes/mes'
  },
  asiste: {
    name: '02 - Asiste',
    monthly: '$79.000/mes',
    annual: '$65.833/mes (anual)',
    annualTotal: '$790.000',
    aiModel: 'Gemini Flash',
    messagesLimit: '2.500 mensajes/mes'
  },
  automatiza: {
    name: '03 - Automatiza',
    monthly: '$125.000/mes',
    annual: '$104.167/mes (anual)',
    annualTotal: '$1.250.000',
    aiModel: 'Gemini Pro',
    messagesLimit: '5.000 mensajes/mes'
  },
  intelligence: {
    name: '04 - Enterprise',
    monthly: 'Custom',
    annual: 'Custom',
    annualTotal: 'Custom',
    aiModel: 'Gemini Pro',
    messagesLimit: 'Ajustados a medida'
  }
};

// Función para obtener el click_id de Tapfiliate
function getTapfiliateClickId() {
  try {
    // Intentar obtener el click_id de la función de Tapfiliate
    if (typeof tap !== 'undefined' && tap.getClickId) {
      const clickId = tap.getClickId();
      console.log('Click ID de Tapfiliate:', clickId);
      return clickId;
    }

    // Intentar buscar en cookies (método alternativo)
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'tap_click_id' || name === 'tapfiliate_click_id') {
        console.log('Click ID encontrado en cookies:', value);
        return value;
      }
    }

    console.log('No se encontró click_id de Tapfiliate');
    return null;
  } catch (error) {
    console.error('Error al obtener click_id de Tapfiliate:', error);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('=== CARGANDO PÁGINA DE PAGO ===');

  // Obtener el plan seleccionado
  const plan = localStorage.getItem('selectedPlan');

  if (!plan) {
    console.error('No hay plan seleccionado');
    alert('Error: No hay plan seleccionado. Por favor regresa a la selección de planes.');
    window.location.href = 'myia-plans.html';
    return;
  }

  console.log('Plan seleccionado:', plan);

  // Mostrar información del plan
  const planInfo = PLAN_PRICES[plan];
  const billingType = localStorage.getItem('billingType') || 'monthly';

  if (planInfo) {
    document.getElementById('planName').textContent = planInfo.name;

    // Mostrar precio según tipo de facturación
    if (billingType === 'annual') {
      document.getElementById('implementationPrice').textContent = planInfo.annual;
      document.getElementById('monthlyPrice').textContent = planInfo.annualTotal + ' (cobrado anualmente)';
    } else {
      document.getElementById('implementationPrice').textContent = planInfo.monthly;
      document.getElementById('monthlyPrice').textContent = 'Facturación mensual';
    }

    document.getElementById('aiModel').textContent = planInfo.aiModel;
    document.getElementById('tokenLimit').textContent = planInfo.messagesLimit;
  }

  // Event listener para el botón de Mercado Pago
  document.getElementById('mercadopagoBtn').addEventListener('click', async () => {
    console.log('Botón de pago clickeado');

    // Solicitar email del pagador (requerido para suscripciones)
    const payerEmail = prompt('Por favor, ingresa tu email para la suscripción de Mercado Pago:');

    if (!payerEmail || !payerEmail.includes('@')) {
      alert('Email inválido. Por favor ingresa un email válido.');
      return;
    }

    const btn = document.getElementById('mercadopagoBtn');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
      // Obtener el click_id de Tapfiliate
      const clickId = getTapfiliateClickId();

      // Obtener userId de localStorage
      const userId = localStorage.getItem('userId') || localStorage.getItem('token') ? 'user' : null;

      // Obtener configuración temporal del builder
      const builderConfig = JSON.parse(localStorage.getItem('builderConfig') || '{}');
      const pageId = builderConfig.tempPageId || null;

      // Obtener tipo de facturación
      const billingType = localStorage.getItem('billingType') || 'monthly';

      console.log('Datos para crear suscripción:', {
        plan,
        pageId,
        userId,
        payerEmail,
        clickId,
        billingType
      });

      // Crear suscripción en el backend
      const API_URL = window.API_CONFIG?.backendUrl || 'https://api.crysantem.tech';
      const response = await fetch(`${API_URL}/api/myia/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan,
          pageId,
          userId,
          payerEmail,
          clickId,
          billingType
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('Suscripción creada exitosamente');
        console.log('Init Point:', result.initPoint);

        // Redirigir a Mercado Pago
        window.location.href = result.initPoint;
      } else {
        console.error('Error al crear suscripción:', result.error);
        alert('Error al crear suscripción: ' + result.error);
        btn.disabled = false;
        btn.textContent = 'Pagar con Mercado Pago desde la App';
      }
    } catch (error) {
      console.error('Error al procesar pago:', error);
      alert('Error al procesar el pago. Por favor intenta nuevamente.');
      btn.disabled = false;
      btn.textContent = 'Pagar con Mercado Pago desde la App';
    }
  });
});
