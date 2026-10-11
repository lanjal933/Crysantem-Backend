document.addEventListener('DOMContentLoaded', async () => {
  const pageId = localStorage.getItem('viewingPageId');
  const userId = localStorage.getItem('userId');

  if (!pageId) {
    window.location.href = 'myia-home.html';
    return;
  }

  console.log('Cargando dashboard para página:', pageId);

  // Cargar configuración de la página
  try {
    const response = await fetch(`${API_CONFIG.backendUrl}/api/myia/config-by-id/${pageId}`);
    const result = await response.json();

    if (result.success && result.data) {
      const pageConfig = result.data;

      // Actualizar UI con información de la página
      document.getElementById('pageTitle').textContent = pageConfig.business_name || 'Dashboard';
      document.getElementById('pageSlug').textContent = `crysantem.tech/${pageConfig.slug}`;
      document.getElementById('businessName').textContent = pageConfig.business_name || '-';
      document.getElementById('planName').textContent = pageConfig.plan || '-';
      document.getElementById('aiModel').textContent = pageConfig.ai_model === 'gemini-pro' ? 'Gemini Pro' : 'Gemini Flash';
      document.getElementById('isActive').textContent = pageConfig.is_active ? 'Activo' : 'Inactivo';
      document.getElementById('isActive').style.color = pageConfig.is_active ? '#00ff8c' : '#ff4444';

      if (pageConfig.created_at) {
        const date = new Date(pageConfig.created_at);
        document.getElementById('createdAt').textContent = date.toLocaleDateString('es-ES');
      }

      // Configurar botones
      const pageUrl = `https://crysantem-backend.onrender.com/api/myia/render/${pageConfig.slug}`;
      document.getElementById('viewPageBtn').href = pageUrl;
      document.getElementById('viewPageAction').href = pageUrl;
      document.getElementById('editPageBtn').href = `myia-builder.html?pageId=${pageId}`;
      document.getElementById('editPageAction').href = `myia-builder.html?pageId=${pageId}`;

      // Copiar link
      document.getElementById('copyLinkAction').addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(pageUrl);
        alert('Link copiado al portapapeles');
      });

      // Descargar logs (placeholder)
      document.getElementById('downloadLogsAction').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Función de descarga de logs próximamente disponible');
      });
    } else {
      console.error('Error al cargar configuración:', result.error);
      document.getElementById('loadingMessage').innerHTML = `
        <div class="error">Error al cargar información de la página</div>
      `;
      return;
    }
  } catch (error) {
    console.error('Error fetching page config:', error);
    document.getElementById('loadingMessage').innerHTML = `
      <div class="error">Error de conexión al cargar la página</div>
    `;
    return;
  }

  // Cargar estadísticas
  try {
    const statsResponse = await fetch(`${API_CONFIG.backendUrl}/api/myia/stats/${pageId}`);
    const statsResult = await statsResponse.json();

    if (statsResult.success) {
      const stats = statsResult.data;

      // Ocultar loading y mostrar contenido
      document.getElementById('loadingMessage').style.display = 'none';
      document.getElementById('dashboardContent').style.display = 'block';

      // Actualizar métricas
      document.getElementById('totalMessages').textContent = stats.total_messages.toLocaleString();
      document.getElementById('uniqueUsers').textContent = stats.unique_users.toLocaleString();
      document.getElementById('totalTokens').textContent = stats.total_tokens_used.toLocaleString();
      document.getElementById('avgResponseTime').textContent = `${stats.avg_response_time.toFixed(2)}s`;

      // Renderizar gráficos
      renderCharts(stats.daily_stats);
    } else {
      document.getElementById('loadingMessage').innerHTML = `
        <div class="error">Error al cargar estadísticas</div>
      `;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Mostrar dashboard con valores 0 si no hay estadísticas
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
    document.getElementById('totalMessages').textContent = '0';
    document.getElementById('uniqueUsers').textContent = '0';
    document.getElementById('totalTokens').textContent = '0';
    document.getElementById('avgResponseTime').textContent = '0s';
  }

  // Cargar límite de mensajes
  try {
    const limitResponse = await fetch(`${API_CONFIG.backendUrl}/api/myia/message-limit/${pageId}`);
    const limitResult = await limitResponse.json();

    if (limitResult.success) {
      const limitData = limitResult.data;

      // Actualizar métrica de mensajes usados
      document.getElementById('totalTokens').textContent = `${limitData.used.toLocaleString()} / ${limitData.limit === 0 ? '∞' : limitData.limit.toLocaleString()}`;

      // Mostrar advertencia si está cerca del límite
      if (limitData.limit > 0 && limitData.percentage >= 80) {
        const warningText = limitData.percentage >= 100
          ? '⚠️ Has alcanzado tu límite mensual'
          : `⚠️ Has usado el ${limitData.percentage}% de tu límite mensual`;
        document.getElementById('messageLimitWarning').textContent = warningText;
        document.getElementById('messageLimitWarning').style.display = 'block';
      }
    }
  } catch (error) {
    console.error('Error fetching message limit:', error);
  }

  // Navbar toggle
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarLinks = document.querySelector('.navbar-links');

  if (navbarToggle) {
    navbarToggle.addEventListener('click', () => {
      navbarLinks.classList.toggle('active');
    });
  }

  // Auth dropdown
  const authBtn = document.getElementById('authBtn');
  const authDropdown = document.getElementById('authDropdown');
  const logoutBtn = document.getElementById('logoutBtn');

  if (authBtn) {
    authBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      authDropdown.classList.toggle('active');
    });
  }

  document.addEventListener('click', () => {
    authDropdown.classList.remove('active');
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('authToken');
      window.location.href = 'index.html';
    });
  }
});

function renderCharts(dailyStats) {
  if (!dailyStats || dailyStats.length === 0) {
    console.log('No hay datos de estadísticas para mostrar gráficos');
    return;
  }

  const labels = dailyStats.map(s => {
    const date = new Date(s.date);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  });

  const messagesData = dailyStats.map(s => s.messages);
  const usersData = dailyStats.map(s => s.users);

  // Gráfico de mensajes
  const messagesCtx = document.getElementById('messagesChart');
  if (messagesCtx) {
    new Chart(messagesCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Mensajes',
          data: messagesData,
          borderColor: '#00ff8c',
          backgroundColor: 'rgba(0, 255, 140, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
  }

  // Gráfico de usuarios
  const usersCtx = document.getElementById('usersChart');
  if (usersCtx) {
    new Chart(usersCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Usuarios',
          data: usersData,
          backgroundColor: 'rgba(72, 202, 228, 0.5)',
          borderColor: '#48cae4',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
  }
}
