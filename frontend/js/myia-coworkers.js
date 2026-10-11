// === Crysantem COWORKERS ===
// Lógica para la sección especial de coworkers

document.addEventListener('DOMContentLoaded', async () => {
  const userEmailSpan = document.getElementById('userEmail');
  const createPageBtn = document.getElementById('createCoworkerPage');
  const authBtn = document.getElementById('authBtn');
  const authDropdown = document.getElementById('authDropdown');
  const logoutBtn = document.getElementById('logoutBtn');

  // Verificar autenticación
  const userId = localStorage.getItem('userId');
  const userEmail = localStorage.getItem('userEmail');

  if (!userId || !userEmail) {
    // No autenticado - redirigir a login
    window.location.href = 'index.html';
    return;
  }

  // Mostrar email del usuario
  userEmailSpan.textContent = userEmail;

  // Verificar si es coworker
  try {
    const response = await fetch(`${API_CONFIG.backendUrl}/api/myia/check-coworker/${encodeURIComponent(userEmail)}`);
    const data = await response.json();

    if (!data.success || !data.is_coworker) {
      // No es coworker - redirigir a index.html
      alert('No tienes acceso a esta sección. Contacta al administrador.');
      window.location.href = 'index.html';
      return;
    }

    console.log('Coworker verificado:', data.coworker);
  } catch (error) {
    console.error('Error verificando coworker:', error);
    alert('Error al verificar acceso. Intenta nuevamente.');
    window.location.href = 'index.html';
    return;
  }

  // Botón crear página - iniciar flujo con plan 01 y marca de coworker
  createPageBtn.addEventListener('click', () => {
    // Guardar que es coworker y usar plan 01
    localStorage.setItem('isCoworker', 'true');
    localStorage.setItem('selectedPlan', 'responde');
    localStorage.setItem('coworkerSkipOAuth', 'true');

    // Redirigir al flujo normal de MyIA
    window.location.href = 'myia-builder.html';
  });

  // Toggle auth dropdown
  authBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    authDropdown.classList.toggle('active');
  });

  // Cerrar dropdown al hacer clic fuera
  document.addEventListener('click', () => {
    authDropdown.classList.remove('active');
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isCoworker');
    localStorage.removeItem('coworkerSkipOAuth');
    window.location.href = 'index.html';
  });

  // Toggle mobile menu
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarLinks = document.querySelector('.navbar-links');

  if (navbarToggle) {
    navbarToggle.addEventListener('click', () => {
      navbarLinks.classList.toggle('active');
    });
  }
});
