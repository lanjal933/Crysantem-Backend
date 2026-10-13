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

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Images (ya procesadas con prefijo markdown:, pero procesamos las normales)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image">');

    // Line breaks (DESPUÉS de procesar todo lo demás)
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
