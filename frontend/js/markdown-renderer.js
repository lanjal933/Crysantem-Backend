/**
 * Markdown Renderer Extendido para Crysantem
 * Sistema de renderizado de markdown con componentes personalizados
 */

class MarkdownRenderer {
  constructor() {
    this.chartCounter = 0;
  }

  /**
   * Renderiza markdown completo con componentes personalizados
   */
  render(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // 1. Procesar componentes personalizados en orden específico
    html = this.processPlanComponents(html);
    html = this.processChartComponents(html);
    html = this.processNewChartComponents(html);
    html = this.processColorBoxes(html);
    html = this.processButtons(html);
    html = this.processLinks(html);
    html = this.processInfoComponents(html);
    html = this.processWhatsAppComponents(html);

    // 2. Procesar imágenes con prefijo markdown:
    html = this.processMarkdownImages(html);

    // 3. Procesar markdown estándar (SIN escapar HTML ya generado)
    html = this.processStandardMarkdown(html);

    return html;
  }

  /**
   * Procesa componentes [PLAN]...[/PLAN]
   */
  processPlanComponents(text) {
    const planRegex = /\[PLAN\s+name="([^"]+)"\s+price="([^"]+)"(?:\s+highlight=(true|false))?\]([\s\S]*?)\[\/PLAN\]/g;
    
    return text.replace(planRegex, (match, name, price, highlight, features) => {
      const isHighlighted = highlight === 'true';
      const featureList = this.parseFeatureList(features);
      
      return `
        <div class="plan-card ${isHighlighted ? 'plan-highlight' : ''}">
          <div class="plan-header">
            <h3 class="plan-name">${name}</h3>
            <div class="plan-price">${price}</div>
          </div>
          <ul class="plan-features">
            ${featureList.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
      `;
    });
  }

  /**
   * Procesa componentes [CHART]...[/CHART]
   */
  processChartComponents(text) {
    const chartRegex = /\[CHART\s+type="(\w+)"(?:\s+id="([^"]+)")?\]([\s\S]*?)\[\/CHART\]/g;

    return text.replace(chartRegex, (match, type, customId, jsonData) => {
      // Sanitizar el ID: eliminar espacios y caracteres especiales
      const sanitizedId = customId ? customId.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') : `chart-${this.chartCounter++}`;
      const chartId = sanitizedId;

      console.log('Procesando componente CHART:', { type, customId, chartId });

      try {
        const data = JSON.parse(jsonData.trim());
        console.log('Datos del gráfico parseados:', data);

        // Guardar datos del gráfico para inicializar después
        if (!window.pendingCharts) {
          window.pendingCharts = [];
        }
        window.pendingCharts.push({
          id: chartId,
          type: type,
          data: data
        });

        console.log('Gráfico agregado a pendingCharts. Total:', window.pendingCharts.length);

        return `
          <div class="chart-container">
            <canvas id="${chartId}"></canvas>
          </div>
        `;
      } catch (e) {
        console.error('Error parsing chart data:', e);
        return `<div class="error-box">Error al procesar el gráfico: datos inválidos</div>`;
      }
    });
  }

  /**
   * Procesa componentes de gráficos con nueva sintaxis :::
   * Formato flexible:
   * :::grafico-line :::titulo Título :::datos {"A": 10, "B": 20} :::color azul :::etiqueta Eje X :::
   */
  processNewChartComponents(text) {
    // Regex más flexible: permite formato en una sola línea o múltiples líneas
    const chartRegex = /:::grafico-(\w+)\s*((?::::[a-z]+\s+[^\n]+)(?:\s*:::[a-z]+\s+[^\n]+)*)\s*:::/g;

    return text.replace(chartRegex, (match, chartType, paramsBlock) => {
      const chartId = `chart-${this.chartCounter++}`;

      // Parsear parámetros (manejar tanto saltos de línea como espacios)
      const params = {};
      const paramLines = paramsBlock.trim().split(/\s*:::/).filter(line => line.trim());

      for (const line of paramLines) {
        const match = line.match(/^([a-z]+)\s+(.+)$/);
        if (match) {
          const key = match[1];
          const value = match[2].trim();

          if (key === 'datos') {
            try {
              params.data = JSON.parse(value);
            } catch (e) {
              console.error('Error parsing datos:', e);
              params.data = {};
            }
          } else if (key === 'etiqueta') {
            if (!params.labels) params.labels = [];
            params.labels.push(value);
          } else {
            params[key] = value;
          }
        }
      }

      console.log('Procesando gráfico nuevo:', { chartType, params });

      // Mapear tipo de gráfico
      const typeMap = {
        'line': 'line',
        'bar': 'bar',
        'pie': 'pie',
        'doughnut': 'doughnut',
        'area': 'line'
      };

      const chartJsType = typeMap[chartType] || 'line';

      // Mapear colores
      const colorMap = {
        'morado': { border: '#9b59b6', bg: 'rgba(155, 89, 182, 0.2)' },
        'verde': { border: '#2ecc71', bg: 'rgba(46, 204, 113, 0.2)' },
        'azul': { border: '#3498db', bg: 'rgba(52, 152, 219, 0.2)' },
        'rojo': { border: '#e74c3c', bg: 'rgba(231, 76, 60, 0.2)' },
        'naranja': { border: '#f39c12', bg: 'rgba(243, 156, 18, 0.2)' },
        'amarillo': { border: '#f1c40f', bg: 'rgba(241, 196, 15, 0.2)' },
        'cyan': { border: '#00bcd4', bg: 'rgba(0, 188, 212, 0.2)' },
        'rosa': { border: '#e91e63', bg: 'rgba(233, 30, 99, 0.2)' },
        'gris': { border: '#95a5a6', bg: 'rgba(149, 165, 166, 0.2)' }
      };

      const colors = colorMap[params.color] || colorMap['morado'];

      // Construir datos para Chart.js
      const labels = Object.keys(params.data || {});
      const values = Object.values(params.data || {});

      const chartData = {
        labels: labels,
        datasets: [{
          label: params.titulo || 'Gráfico',
          data: values,
          borderColor: colors.border,
          backgroundColor: colors.bg,
          borderWidth: 2,
          fill: chartJsType === 'line',
          tension: 0.4
        }]
      };

      const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: !!params.titulo,
            text: params.titulo || '',
            color: '#fff'
          },
          legend: {
            labels: {
              color: '#fff'
            }
          }
        },
        scales: chartJsType === 'line' || chartJsType === 'bar' ? {
          x: {
            display: true,
            title: {
              display: !!params.labels?.[0],
              text: params.labels?.[0] || '',
              color: '#fff'
            },
            ticks: {
              color: '#fff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            display: true,
            title: {
              display: !!params.labels?.[1],
              text: params.labels?.[1] || '',
              color: '#fff'
            },
            ticks: {
              color: '#fff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        } : {}
      };

      // Guardar datos del gráfico para inicializar después
      if (!window.pendingCharts) {
        window.pendingCharts = [];
      }
      window.pendingCharts.push({
        id: chartId,
        type: chartJsType,
        data: chartData,
        options: chartOptions
      });

      return `
        <div class="chart-container" style="margin: 20px 0;">
          <canvas id="${chartId}"></canvas>
        </div>
      `;
    });
  }

  /**
   * Procesa cajas de colores (ej: :::caja-morado)
   * Formato flexible: :::caja-[color] contenido ::: (con o sin saltos de línea)
   */
  processColorBoxes(text) {
    // Regex más flexible: acepta contenido en múltiples líneas o en una sola línea
    const boxRegex = /:::caja-(\w+)\s+([\s\S]*?)\s*:::/g;

    const colorMap = {
      'morado': { bg: 'rgba(155, 89, 182, 0.2)', border: '#9b59b6' },
      'verde': { bg: 'rgba(46, 204, 113, 0.2)', border: '#2ecc71' },
      'azul': { bg: 'rgba(52, 152, 219, 0.2)', border: '#3498db' },
      'rojo': { bg: 'rgba(231, 76, 60, 0.2)', border: '#e74c3c' },
      'naranja': { bg: 'rgba(243, 156, 18, 0.2)', border: '#f39c12' },
      'amarillo': { bg: 'rgba(241, 196, 15, 0.2)', border: '#f1c40f' },
      'gris': { bg: 'rgba(149, 165, 166, 0.2)', border: '#95a5a6' }
    };

    return text.replace(boxRegex, (match, color, content) => {
      const colors = colorMap[color] || colorMap['azul'];
      // Limpiar espacios excesivos pero mantener estructura
      const cleanedContent = content.trim().replace(/\n\s*\n/g, '\n');
      return `
        <div class="color-box" style="
          background: ${colors.bg};
          border-left: 4px solid ${colors.border};
          padding: 16px;
          margin: 12px 0;
          border-radius: 4px;
        ">
          ${cleanedContent}
        </div>
      `;
    });
  }

  /**
   * Procesa botones (ej: :::boton Texto URL/Action)
   * Soporta: web, wa.me, mailto, tel
   */
  processButtons(text) {
    const buttonRegex = /:::boton\s+([^\s]+)\s+(https?:\/\/[^\s]+|wa\.me\/[^\s]+|mailto:[^\s]+|tel:[^\s]+)/g;

    return text.replace(buttonRegex, (match, text, action) => {
      let href = action;
      let bgColor = '#00ff88';
      let textColor = '#000';

      // Detectar tipo de acción y ajustar estilo
      if (action.startsWith('wa.me') || action.startsWith('https://wa.me')) {
        bgColor = '#25D366';
        textColor = '#fff';
        if (!action.startsWith('https://')) {
          href = `https://${action}`;
        }
      } else if (action.startsWith('mailto:')) {
        bgColor = '#3498db';
        textColor = '#fff';
      } else if (action.startsWith('tel:')) {
        bgColor = '#2ecc71';
        textColor = '#fff';
      } else if (action.startsWith('http')) {
        bgColor = '#00ff88';
        textColor = '#000';
      }

      return `
        <a href="${href}" target="_blank" class="action-button" style="
          display: inline-block;
          background: ${bgColor};
          color: ${textColor};
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin: 8px 4px;
          font-weight: 600;
        ">
          ${text}
        </a>
      `;
    });
  }

  /**
   * Procesa enlaces (ej: :::enlace Texto https://url.com)
   */
  processLinks(text) {
    const linkRegex = /:::enlace\s+([^\s]+)\s+(https?:[^\s]+)/g;

    return text.replace(linkRegex, (match, text, url) => {
      return `
        <a href="${url}" target="_blank" class="action-link" style="
          display: inline-block;
          background: rgba(255, 255, 255, 0.1);
          color: #00ff88;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin: 8px 4px;
          border: 1px solid #00ff88;
        ">
          ${text}
        </a>
      `;
    });
  }

  /**
   * Procesa componentes [INFO]...[/INFO]
   */
  processInfoComponents(text) {
    const infoRegex = /\[INFO\s+type="(\w+)"\]([\s\S]*?)\[\/INFO\]/g;
    
    const icons = {
      info: 'INFO',
      success: 'OK',
      warning: 'WARN',
      error: 'ERR',
      tip: 'TIP'
    };

    return text.replace(infoRegex, (match, type, content) => {
      const icon = icons[type] || 'INFO';
      return `
        <div class="info-box info-${type}">
          <span class="info-icon">${icon}</span>
          <span class="info-content">${content.trim()}</span>
        </div>
      `;
    });
  }

  /**
   * Procesa componentes [WHATSAPP phone="..." message="..."/]
   */
  processWhatsAppComponents(text) {
    const whatsappRegex = /\[WHATSAPP\s+phone="([^"]+)"(?:\s+message="([^"]*)")?\/\]/g;
    
    return text.replace(whatsappRegex, (match, phone, message) => {
      const encodedMessage = message ? encodeURIComponent(message) : '';
      const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`;
      
      return `
        <a href="${whatsappUrl}" target="_blank" class="whatsapp-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Contactar por WhatsApp
        </a>
      `;
    });
  }

  /**
   * Procesa imágenes con prefijo markdown:
   */
  processMarkdownImages(text) {
    const imageRegex = /!\[([^\]]*)\]\(markdown:([^\)]+)\)/g;
    
    return text.replace(imageRegex, (match, alt, filename) => {
      // Usar ruta absoluta para que funcione desde cualquier URL
      return `![${alt}](/IMG/imagenes_markdown/${filename})`;
    });
  }

  /**
   * Procesa markdown estándar usando una implementación básica
   */
  processStandardMarkdown(text) {
    let html = text;

    // NO escapar HTML aquí - los componentes ya generan HTML seguro
    // Solo procesar markdown estándar

    // Unordered lists (ANTES de line breaks)
    html = this.processLists(html);

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Images (ya procesadas con prefijo markdown:, pero procesamos las normales)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image">');

    // Line breaks (DESPUÉS de procesar todo lo demás)
    // Reducir múltiples saltos de línea a un solo br
    html = html.replace(/\n\s*\n\s*\n/g, '<br><br>');
    html = html.replace(/\n\s*\n/g, '<br>');
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  /**
   * Procesa listas anidadas
   */
  processLists(text) {
    const lines = text.split('\n');
    let result = [];
    let inList = false;
    let listStack = [];

    for (let line of lines) {
      const match = line.match(/^(\s*)-\s+(.*)$/);
      
      if (match) {
        const indent = match[1].length;
        const content = match[2];

        if (!inList) {
          inList = true;
          result.push('<ul>');
          listStack = [0];
        }

        // Manejar anidación
        while (listStack.length > 0 && indent <= listStack[listStack.length - 1]) {
          result.push('</ul>');
          listStack.pop();
        }

        if (indent > (listStack.length > 0 ? listStack[listStack.length - 1] : 0)) {
          result.push('<ul>');
          listStack.push(indent);
        }

        result.push(`<li>${content}</li>`);
      } else {
        while (listStack.length > 0) {
          result.push('</ul>');
          listStack.pop();
        }
        inList = false;
        result.push(line);
      }
    }

    // Cerrar listas abiertas
    while (listStack.length > 0) {
      result.push('</ul>');
      listStack.pop();
    }

    return result.join('\n');
  }

  /**
   * Parsea lista de características del componente PLAN
   */
  parseFeatureList(text) {
    const lines = text.trim().split('\n');
    return lines
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Escapa HTML para seguridad
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// Instancia global del renderer
const markdownRenderer = new MarkdownRenderer();
