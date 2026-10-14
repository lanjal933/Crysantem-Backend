let selectedPlan = null;
let billingType = 'monthly'; // 'monthly' or 'annual'

const planConfig = {
  responde: {
    aiModel: 'gemini-flash',
    monthlyPrice: 49000,
    annualPrice: 40833,
    annualTotal: 490000,
    messagesLimit: 1000,
    minimumMonths: 3,
    scopes: ['email', 'profile']
  },
  asiste: {
    aiModel: 'gemini-flash',
    monthlyPrice: 79000,
    annualPrice: 65833,
    annualTotal: 790000,
    messagesLimit: 2500,
    minimumMonths: 3,
    scopes: ['email', 'profile', 'https://www.googleapis.com/auth/spreadsheets']
  },
  automatiza: {
    aiModel: 'gemini-pro',
    monthlyPrice: 125000,
    annualPrice: 104167,
    annualTotal: 1250000,
    messagesLimit: 5000,
    minimumMonths: 6,
    scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar']
  },
  intelligence: {
    aiModel: 'gemini-pro',
    monthlyPrice: 0, // Custom
    annualPrice: 0, // Custom
    annualTotal: 0, // Custom
    messagesLimit: 0, // Custom
    minimumMonths: 12,
    scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/gmail.send']
  }
};

function selectPlan(plan) {
  // Los planes normales pueden seleccionarse, Enterprise (plan 05) no
  if (!plan || plan === 'enterprise') {
    return;
  }

  selectedPlan = plan;

  // Actualizar UI
  document.querySelectorAll('.plan-card').forEach(card => {
    card.classList.remove('selected');
  });
  const selectedCard = document.querySelector(`[data-plan="${plan}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

  // Habilitar botón continuar
  document.getElementById('continueBtn').disabled = false;
}

function toggleBilling() {
  const toggle = document.getElementById('billingToggle');
  const labels = document.querySelectorAll('.billing-toggle-label');
  const annualTotals = document.querySelectorAll('.plan-annual-total');

  billingType = billingType === 'monthly' ? 'annual' : 'monthly';

  // Actualizar toggle visual
  toggle.classList.toggle('active');

  // Actualizar labels
  labels.forEach(label => {
    label.classList.toggle('active', label.dataset.billing === billingType);
  });

  // Actualizar precios en las tarjetas
  document.querySelectorAll('.plan-card').forEach(card => {
    const plan = card.dataset.plan;
    const priceElement = card.querySelector('.plan-price');
    const annualTotalElement = card.querySelector('.plan-annual-total');

    // Skip Enterprise (plan 05) que es custom
    if (plan === 'enterprise') return;

    const config = planConfig[plan];
    if (!config) return;

    if (billingType === 'annual') {
      const annualPrice = config.annualPrice;
      priceElement.innerHTML = `$${annualPrice.toLocaleString('es-AR')} <span>/mes</span>`;
      if (annualTotalElement) {
        annualTotalElement.style.display = 'block';
        annualTotalElement.textContent = `Cobrado anualmente: $${config.annualTotal.toLocaleString('es-AR')} ARS`;
      }
    } else {
      const monthlyPrice = config.monthlyPrice;
      priceElement.innerHTML = `$${monthlyPrice.toLocaleString('es-AR')} <span>/mes</span>`;
      if (annualTotalElement) {
        annualTotalElement.style.display = 'none';
      }
    }
  });
}

async function continueToDesign() {
  if (!selectedPlan) return;

  // Guardar plan seleccionado y tipo de facturación
  localStorage.setItem('selectedPlan', selectedPlan);
  localStorage.setItem('billingType', billingType);
  localStorage.setItem('planConfig', JSON.stringify(planConfig[selectedPlan]));

  // Limpiar flag de coworker (flujo normal)
  localStorage.removeItem('coworkerSkipOAuth');
  localStorage.removeItem('isCoworker');

  console.log('Flujo con pago al inicio iniciado');
  console.log('Plan seleccionado:', selectedPlan);
  console.log('Tipo de facturación:', billingType);

  // Redirigir al pago inmediatamente (myia-payment.html)
  window.location.href = 'myia-payment.html';
}

// ========================================================================
// MODO PRUEBA (TEMPORAL) - ELIMINAR ESTE BLOQUE COMPLETO CUANDO TERMINE
// ========================================================================
async function trialMode() {
  console.log('=== FUNCIÓN TRIAL MODE INICIADA ===');
  
  // Usar intelligence por defecto (o el plan seleccionado)
  const plan = selectedPlan || 'intelligence';
  console.log('Plan a usar:', plan);
  console.log('selectedPlan:', selectedPlan);
  
  // Guardar plan seleccionado (mensual por defecto)
  localStorage.setItem('selectedPlan', plan);
  localStorage.setItem('billingType', 'monthly');
  localStorage.setItem('planConfig', JSON.stringify(planConfig[plan]));
  console.log('localStorage.setItem executed for plan:', plan);
  
  // Marcar como pago completado (simulado)
  localStorage.setItem('paymentCompleted', 'true');
  localStorage.setItem('paymentConfig', JSON.stringify({
    paymentCompleted: true,
    paymentMethod: 'trial',
    paymentPlan: plan
  }));
  console.log('paymentConfig guardado:', JSON.stringify({
    paymentCompleted: true,
    paymentMethod: 'trial',
    paymentPlan: plan
  }));
  
  // Limpiar flags
  localStorage.removeItem('coworkerSkipOAuth');
  localStorage.removeItem('isCoworker');
  
  console.log('=== MODO PRUEBA CONFIGURADO ===');
  console.log('Plan:', plan);
  console.log('Pago: Simulado (trial)');
  console.log('Redirigiendo a builder...');
  
  // Redirigir directamente al builder
  window.location.href = 'myia-builder.html';
}

// Hacer la función global para que funcione con onclick
window.trialMode = trialMode;
// ========================================================================
// FIN MODO PRUEBA (TEMPORAL)
// ========================================================================

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Agregar listeners a las tarjetas de planes
  document.querySelectorAll('.plan-card').forEach(card => {
    card.addEventListener('click', () => {
      selectPlan(card.dataset.plan);
    });
  });

  // Listener para el toggle de facturación
  const billingToggle = document.getElementById('billingToggle');
  if (billingToggle) {
    billingToggle.addEventListener('click', toggleBilling);
  }

  // Listener para labels de facturación
  document.querySelectorAll('.billing-toggle-label').forEach(label => {
    label.addEventListener('click', () => {
      if (label.dataset.billing !== billingType) {
        toggleBilling();
      }
    });
  });

  // Listener para el botón continuar
  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', continueToDesign);
  }

  // Listener para el botón prueba (trial)
  const trialBtn = document.getElementById('trialBtn');
  if (trialBtn) {
    trialBtn.addEventListener('click', () => {
      console.log('=== BOTÓN PRUEBA CLICKEADO ===');
      trialMode();
    });
    console.log('Botón prueba encontrado y listener agregado');
  } else {
    console.error('Botón prueba NO encontrado');
  }

  // Listener para el botón volver
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'myia-home.html';
    });
  }
});
