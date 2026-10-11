/**
 * Sistema de Migración de Configuración MyIA
 *
 * Este archivo contiene la lógica para migrar configuraciones antiguas a la nueva estructura
 * de MyIA Builder 2.0, asegurando compatibilidad con sitios existentes.
 */

/**
 * Presets visuales predefinidos
 */
const PRESETS = {
  editorial: {
    layout: { structure: 'editorial', width: 'normal', density: 'airy', alignment: 'left' },
    typography: {
      body: { family: 'Playfair Display', size: 'normal', weight: 400, letterSpacing: 'normal' },
      headings: { family: 'Playfair Display', size: 'large', weight: 600, casing: 'title-case' }
    },
    style: {
      borders: { shape: 'square', intensity: 'defined' },
      shadows: { intensity: 'none' },
      depth: 'flat'
    },
    buttons: { shape: 'square', size: 'normal', style: 'outline', border: 'visible', hover: 'color-change' },
    navigation: { position: 'top', background: 'transparent', separator: 'line', alignment: 'left' }
  },
  studio: {
    layout: { structure: 'immersive', width: 'wide', density: 'normal', alignment: 'auto' },
    typography: {
      body: { family: 'Inter', size: 'normal', weight: 400, letterSpacing: 'normal' },
      headings: { family: 'Inter', size: 'large', weight: 700, casing: 'normal' }
    },
    style: {
      borders: { shape: 'soft', intensity: 'subtle' },
      shadows: { intensity: 'medium' },
      depth: 'medium'
    },
    buttons: { shape: 'rounded', size: 'large', style: 'solid', border: 'none', hover: 'lift' },
    navigation: { position: 'integrated', background: 'semi-transparent', separator: 'none', alignment: 'center' }
  },
  corporate: {
    layout: { structure: 'minimal', width: 'normal', density: 'compact', alignment: 'left' },
    typography: {
      body: { family: 'Roboto', size: 'normal', weight: 400, letterSpacing: 'normal' },
      headings: { family: 'Roboto', size: 'normal', weight: 500, casing: 'normal' }
    },
    style: {
      borders: { shape: 'soft', intensity: 'subtle' },
      shadows: { intensity: 'subtle' },
      depth: 'subtle'
    },
    buttons: { shape: 'soft', size: 'normal', style: 'solid', border: 'none', hover: 'color-change' },
    navigation: { position: 'top', background: 'solid', separator: 'shadow', alignment: 'left' }
  },
  minimal: {
    layout: { structure: 'centered', width: 'compact', density: 'airy', alignment: 'center' },
    typography: {
      body: { family: 'Inter', size: 'normal', weight: 400, letterSpacing: 'normal' },
      headings: { family: 'Inter', size: 'large', weight: 600, casing: 'normal' }
    },
    style: {
      borders: { shape: 'square', intensity: 'none' },
      shadows: { intensity: 'none' },
      depth: 'flat'
    },
    buttons: { shape: 'square', size: 'normal', style: 'text', border: 'none', hover: 'underline' },
    navigation: { position: 'top', background: 'transparent', separator: 'none', alignment: 'center' }
  },
  bold: {
    layout: { structure: 'split', width: 'wide', density: 'normal', alignment: 'auto' },
    typography: {
      body: { family: 'Inter', size: 'large', weight: 500, letterSpacing: 'normal' },
      headings: { family: 'Inter', size: 'large', weight: 800, casing: 'uppercase' }
    },
    style: {
      borders: { shape: 'rounded', intensity: 'strong' },
      shadows: { intensity: 'medium' },
      depth: 'deep'
    },
    buttons: { shape: 'rounded', size: 'large', style: 'solid', border: 'none', hover: 'invert' },
    navigation: { position: 'top', background: 'solid', separator: 'line', alignment: 'center' }
  },
  elegant: {
    layout: { structure: 'editorial', width: 'normal', density: 'airy', alignment: 'left' },
    typography: {
      body: { family: 'Inter', size: 'normal', weight: 400, letterSpacing: 'normal' },
      headings: { family: 'Playfair Display', size: 'large', weight: 600, casing: 'title-case' }
    },
    style: {
      borders: { shape: 'soft', intensity: 'subtle' },
      shadows: { intensity: 'subtle' },
      depth: 'subtle'
    },
    buttons: { shape: 'soft', size: 'normal', style: 'outline', border: 'visible', hover: 'color-change' },
    navigation: { position: 'top', background: 'transparent', separator: 'line', alignment: 'left' }
  },
  creative: {
    layout: { structure: 'immersive', width: 'wide', density: 'normal', alignment: 'auto' },
    typography: {
      body: { family: 'Montserrat', size: 'normal', weight: 400, letterSpacing: 'normal' },
      headings: { family: 'Montserrat', size: 'large', weight: 700, casing: 'uppercase' }
    },
    style: {
      borders: { shape: 'rounded', intensity: 'defined' },
      shadows: { intensity: 'medium' },
      depth: 'medium'
    },
    buttons: { shape: 'pill', size: 'normal', style: 'solid', border: 'none', hover: 'lift' },
    navigation: { position: 'floating', background: 'semi-transparent', separator: 'none', alignment: 'center' }
  }
};

/**
 * Valores por defecto para la nueva estructura
 */
const DEFAULT_CONFIG = {
  brand: {
    name: '',
    slug: '',
    logo: {
      url: '',
      size: 'medium',
      position: 'left',
      style: 'auto',
      favicon: ''
    },
    colors: {
      primary: '#00ff88',
      secondary: '#00cc6a',
      contrast: '#ffffff'
    }
  },
  layout: {
    structure: 'centered',
    width: 'normal',
    density: 'normal',
    alignment: 'center'
  },
  typography: {
    body: {
      family: 'Inter',
      size: 'normal',
      weight: 400,
      letterSpacing: 'normal'
    },
    headings: {
      family: 'Inter',
      size: 'normal',
      weight: 700,
      casing: 'normal'
    }
  },
  colors: {
    background: {
      type: 'solid',
      primary: '#050505',
      secondary: '#00ff8c',
      direction: 'diagonal',
      intensity: 'normal',
      image: '',
      overlay: 'none'
    },
    text: {
      primary: '#ffffff',
      secondary: '#b8c4c0',
      muted: '#7a8580'
    }
  },
  style: {
    borders: {
      shape: 'rounded',
      intensity: 'subtle',
      radius: { small: 4, medium: 8, large: 12 }
    },
    shadows: {
      intensity: 'medium',
      color: 'rgba(0,0,0,0.3)'
    },
    depth: 'medium'
  },
  buttons: {
    shape: 'rounded',
    size: 'normal',
    style: 'solid',
    border: 'none',
    hover: 'color-change'
  },
  navigation: {
    position: 'top',
    background: 'semi-transparent',
    separator: 'none',
    alignment: 'left',
    logo: { size: 'normal' },
    mobile: { style: 'hamburger' }
  },
  hero: {
    layout: 'text-centered',
    height: 'screen',
    contentPosition: 'center',
    image: { show: false, position: 'right', url: '' },
    overlay: 'none'
  },
  images: {
    shape: 'rectangular',
    radius: 8,
    fit: 'cover',
    border: 'none',
    shadow: 'subtle',
    filter: 'normal'
  },
  chatbot: {
    appearance: {
      shape: 'rounded',
      position: 'right',
      size: 'normal',
      window: 'solid'
    },
    header: { style: 'simple' },
    avatar: { type: 'initial', url: '' },
    color: '#00ff8c',
    floatingButton: {
      shape: 'circle',
      position: 'bottom-right',
      size: 'normal'
    },
    messages: {
      bubbleShape: 'rounded',
      spacing: 'normal',
      userStyle: 'solid',
      agentStyle: 'solid',
      showTimestamp: false
    }
  },
  footer: {
    show: true,
    style: 'minimal',
    showLogo: false,
    showSocial: true,
    customText: '',
    poweredBy: true
  },
  social: {
    networks: {
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
      tiktok: '',
      youtube: '',
      whatsapp: ''
    },
    showIcons: true,
    style: 'icons'
  },
  details: {
    dividers: 'none',
    indicators: 'none',
    hoverGlobal: 'subtle',
    transitions: 'smooth'
  },
  animations: {
    style: 'subtle',
    appearance: 'fade',
    hover: 'color'
  },
  advanced: {},
  preset: 'custom',
  mode: 'basic',

  // Campos de IA (mantienen nombres antiguos para compatibilidad)
  welcome_message: 'Hola, ¿en qué puedo ayudarte?',
  system_prompt: 'Eres un asistente virtual amable y profesional.',
  ai_model: 'gemini-flash',
  character_limit: 50000,
  plan: 'responde',
  is_active: false,
  split_image: '',
  split_text: ''
};

/**
 * Migrar configuración antigua a nueva estructura
 * @param {Object} oldConfig - Configuración en formato antiguo
 * @returns {Object} Configuración en formato nuevo
 */
function migrateOldConfig(oldConfig) {
  if (!oldConfig) return { ...DEFAULT_CONFIG };

  // Si ya tiene design_config, retornarlo directamente
  if (oldConfig.design_config && Object.keys(oldConfig.design_config).length > 0) {
    return oldConfig.design_config;
  }

  const migrated = { ...DEFAULT_CONFIG };

  // Identidad de marca
  migrated.brand.name = oldConfig.business_name || '';
  migrated.brand.slug = oldConfig.slug || '';
  migrated.brand.logo.url = oldConfig.logo_url || '';
  migrated.brand.logo.size = getLogoSize(oldConfig.logo_size);
  migrated.brand.colors.primary = oldConfig.chat_box_color || '#00ff8c';
  migrated.brand.colors.secondary = oldConfig.background_gradient || '#00cc6a';

  // Composición
  migrated.layout.structure = getLayoutStructure(oldConfig.page_design);
  migrated.layout.alignment = oldConfig.page_design === 'split' ? 'auto' : 'center';

  // Tipografía
  migrated.typography.body.family = oldConfig.font_family || 'Inter';
  migrated.typography.headings.family = oldConfig.title_font || oldConfig.font_family || 'Inter';

  // Colores
  migrated.colors.background.type = oldConfig.background_type || 'solid';
  migrated.colors.background.primary = oldConfig.background_color || '#050505';
  migrated.colors.background.secondary = oldConfig.background_gradient || '#00ff8c';

  // Estilo
  migrated.style.borders.shape = getBorderShape(oldConfig.border_radius);
  migrated.style.borders.radius.small = oldConfig.border_radius === 'sharp' ? 0 : 4;
  migrated.style.borders.radius.medium = oldConfig.border_radius === 'sharp' ? 0 : 8;
  migrated.style.borders.radius.large = oldConfig.border_radius === 'sharp' ? 0 : 12;

  // Chatbot
  migrated.chatbot.appearance.position = oldConfig.chat_position || 'right';
  migrated.chatbot.color = oldConfig.chat_box_color || '#00ff8c';

  // Navegación
  migrated.navigation.background = oldConfig.header_theme === 'light' ? 'solid' : 'semi-transparent';

  // Footer
  migrated.footer.show = oldConfig.show_footer !== false;

  // Redes sociales
  migrated.social.networks = oldConfig.social_links || {};

  // Campos de IA (mantener compatibilidad)
  migrated.welcome_message = oldConfig.welcome_message || 'Hola, ¿en qué puedo ayudarte?';
  migrated.system_prompt = oldConfig.system_prompt || 'Eres un asistente virtual amable y profesional.';
  migrated.ai_model = oldConfig.ai_model || 'gemini-flash';
  migrated.character_limit = oldConfig.character_limit || 50000;
  migrated.plan = oldConfig.plan || 'responde';
  migrated.is_active = oldConfig.is_active || false;
  migrated.split_image = oldConfig.split_image || '';
  migrated.split_text = oldConfig.split_text || '';

  return migrated;
}

/**
 * Mapear tamaño de logo antiguo a nuevo
 */
function getLogoSize(size) {
  if (!size) return 'medium';
  if (size <= 80) return 'small';
  if (size >= 120) return 'large';
  return 'medium';
}

/**
 * Mapear page_design antiguo a structure nuevo
 */
function getLayoutStructure(pageDesign) {
  if (!pageDesign) return 'centered';
  if (pageDesign === 'split') return 'split';
  if (pageDesign === 'full') return 'immersive';
  return 'centered';
}

/**
 * Mapear border_radius antiguo a shape nuevo
 */
function getBorderShape(borderRadius) {
  if (!borderRadius) return 'rounded';
  if (borderRadius === 'sharp') return 'square';
  if (borderRadius === 'pill') return 'soft';
  return 'rounded';
}

/**
 * Aplicar preset a configuración
 * @param {Object} config - Configuración actual
 * @param {string} presetName - Nombre del preset
 * @returns {Object} Configuración con preset aplicado
 */
function applyPreset(config, presetName) {
  if (!PRESETS[presetName]) return config;

  const preset = PRESETS[presetName];
  const newConfig = { ...config };

  // Sobrescribir propiedades del preset
  Object.keys(preset).forEach(key => {
    newConfig[key] = { ...preset[key] };
  });

  newConfig.preset = presetName;

  return newConfig;
}

/**
 * Convertir configuración nueva a formato para guardar en backend
 * @param {Object} newConfig - Configuración en formato nuevo
 * @returns {Object} Configuración compatible con backend
 */
function convertToBackendFormat(newConfig) {
  // Mantener compatibilidad con columnas antiguas
  const backendFormat = {
    business_name: newConfig.brand.name,
    slug: newConfig.brand.slug,
    logo_url: newConfig.brand.logo.url,
    logo_size: getLogoSizePx(newConfig.brand.logo.size),
    background_type: newConfig.colors.background.type,
    background_color: newConfig.colors.background.primary,
    background_gradient: newConfig.colors.background.secondary,
    glow_color: newConfig.colors.background.secondary,
    font_family: newConfig.typography.body.family,
    title_font: newConfig.typography.headings.family === newConfig.typography.body.family ? '' : newConfig.typography.headings.family,
    chat_box_design: 'modern', // Se mapeará desde los nuevos controles
    chat_position: newConfig.chatbot.appearance.position,
    border_radius: getBorderRadiusValue(newConfig.style.borders.shape),
    chat_box_color: newConfig.chatbot.color,
    header_theme: newConfig.navigation.background === 'solid' ? 'light' : 'dark',
    page_design: getPageDesignValue(newConfig.layout.structure),
    show_footer: newConfig.footer.show,
    split_image: newConfig.split_image,
    split_text: newConfig.split_text,
    welcome_message: newConfig.welcome_message,
    system_prompt: newConfig.system_prompt,
    ai_model: newConfig.ai_model,
    character_limit: newConfig.character_limit,
    plan: newConfig.plan,
    social_links: newConfig.social.networks,
    is_active: newConfig.is_active,
    // Nueva columna JSONB
    design_config: newConfig
  };

  return backendFormat;
}

/**
 * Convertir tamaño de logo a px
 */
function getLogoSizePx(size) {
  const sizes = { small: 60, medium: 100, large: 140 };
  return sizes[size] || 100;
}

/**
 * Convertir shape a border_radius
 */
function getBorderRadiusValue(shape) {
  const values = { square: 'sharp', soft: 'pill', rounded: 'rounded' };
  return values[shape] || 'rounded';
}

/**
 * Convertir structure a page_design
 */
function getPageDesignValue(structure) {
  const values = {
    centered: 'centered',
    editorial: 'centered',
    split: 'split',
    immersive: 'full',
    minimal: 'centered',
    'info-first': 'centered'
  };
  return values[structure] || 'centered';
}

/**
 * Obtener configuración por defecto
 */
function getDefaultConfig() {
  return { ...DEFAULT_CONFIG };
}

/**
 * Obtener preset por nombre
 */
function getPreset(presetName) {
  return PRESETS[presetName] || null;
}

/**
 * Obtener lista de presets
 */
function getPresetList() {
  return Object.keys(PRESETS).map(name => ({
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    config: PRESETS[name]
  }));
}

// Exportar funciones
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    migrateOldConfig,
    applyPreset,
    convertToBackendFormat,
    getDefaultConfig,
    getPreset,
    getPresetList,
    PRESETS,
    DEFAULT_CONFIG
  };
}
