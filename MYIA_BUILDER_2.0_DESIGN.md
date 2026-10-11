# MyIA Builder 2.0 - Diseño de Arquitectura

## Resumen Ejecutivo

Transformar MyIA de un "generador de webs con estilos genéricos" a un "sistema de dirección visual" que permita a los usuarios crear identidades visuales propias sin escribir código.

---

## Nueva Estructura de Configuración

### Principio de Diseño
Organizar la configuración en categorías lógicas que reflejen cómo un dueño de negocio piensa sobre su sitio, no cómo un desarrollador piensa sobre CSS.

### Estructura Propuesta

```javascript
const designConfig = {
  // Identidad de marca
  brand: {
    name: string,
    slug: string,
    logo: {
      url: string,
      size: 'small' | 'medium' | 'large', // 60px | 100px | 140px
      position: 'left' | 'center' | 'right',
      style: 'symbol' | 'symbol+name' | 'name' | 'auto',
      favicon: string
    },
    colors: {
      primary: string, // Color picker hex
      secondary: string,
      contrast: string
    }
  },

  // Composición de página
  layout: {
    structure: 'centered' | 'editorial' | 'split' | 'immersive' | 'minimal' | 'info-first',
    width: 'compact' | 'normal' | 'wide' | 'full', // 900px | 1100px | 1300px | 1500px
    density: 'airy' | 'normal' | 'compact',
    alignment: 'left' | 'center' | 'right' | 'auto'
  },

  // Tipografía
  typography: {
    body: {
      family: string, // Inter, Playfair Display, etc.
      size: 'small' | 'normal' | 'large', // 14px | 16px | 18px
      weight: 300 | 400 | 500 | 600 | 700 | 800,
      letterSpacing: 'tight' | 'normal' | 'spaced'
    },
    headings: {
      family: string, // 'same' | nombre específico
      size: 'compact' | 'normal' | 'large', // base scale
      weight: 300 | 400 | 500 | 600 | 700 | 800,
      casing: 'normal' | 'title-case' | 'uppercase'
    }
  },

  // Colores
  colors: {
    background: {
      type: 'solid' | 'gradient' | 'radial' | 'image' | 'image-overlay' | 'texture' | 'image-gradient',
      primary: string,
      secondary: string, // solo si es gradient/radial
      direction: 'horizontal' | 'vertical' | 'diagonal', // dirección del gradient
      intensity: 'subtle' | 'normal' | 'intense', // intensidad del gradient
      image: string, // URL si es image
      overlay: 'none' | 'dark' | 'medium' | 'light' // si es image
    },
    text: {
      primary: string,
      secondary: string,
      muted: string
    }
  },

  // Estilo visual (bordes, sombras, profundidad)
  style: {
    borders: {
      shape: 'square' | 'slightly-rounded' | 'rounded' | 'soft',
      intensity: 'none' | 'subtle' | 'defined' | 'strong',
      radius: {
        small: number, // px - modo avanzado
        medium: number,
        large: number
      }
    },
    shadows: {
      intensity: 'none' | 'subtle' | 'medium' | 'deep',
      color: string // color de sombra - modo avanzado
    },
    depth: 'flat' | 'subtle' | 'medium' | 'deep' // control compuesto
  },

  // Botones
  buttons: {
    shape: 'square' | 'soft' | 'rounded' | 'pill',
    size: 'compact' | 'normal' | 'large',
    style: 'solid' | 'outline' | 'ghost' | 'text' | 'contrast',
    border: 'none' | 'subtle' | 'visible',
    hover: 'color-change' | 'lift' | 'invert' | 'underline' | 'shift'
  },

  // Navegación
  navigation: {
    position: 'top' | 'side' | 'integrated' | 'floating',
    background: 'transparent' | 'solid' | 'semi-transparent',
    separator: 'none' | 'line' | 'shadow' | 'contrast',
    alignment: 'left' | 'center' | 'right',
    logo: {
      size: 'small' | 'normal' | 'large'
    },
    mobile: {
      style: 'hamburger' | 'dropdown' | 'side-drawer'
    }
  },

  // Hero específico
  hero: {
    layout: 'text-centered' | 'text-left' | 'text-right' | 'text+image' | 'text+chat' | 'split-composition',
    height: 'compact' | 'screen' | 'immersive', // 60vh | 100vh | 120vh
    contentPosition: 'top' | 'center' | 'bottom',
    image: {
      show: boolean,
      position: 'right' | 'left' | 'background' | 'overlay',
      url: string
    },
    overlay: 'none' | 'dark' | 'medium' | 'light'
  },

  // Imágenes
  images: {
    shape: 'square' | 'rectangular' | 'panoramic' | 'circle' | 'organic',
    radius: number, // px - modo avanzado
    fit: 'cover' | 'contain' | 'original',
    border: 'none' | 'subtle' | 'defined',
    shadow: 'none' | 'subtle' | 'deep',
    filter: 'normal' | 'grayscale' | 'contrast' | 'dark' | 'warm' | 'cool'
  },

  // Chatbot
  chatbot: {
    appearance: {
      shape: 'square' | 'soft' | 'rounded',
      position: 'right' | 'left',
      size: 'compact' | 'normal' | 'large',
      window: 'solid' | 'transparent' | 'semi-transparent'
    },
    header: {
      style: 'simple' | 'with-logo' | 'with-avatar' | 'complete'
    },
    avatar: {
      type: 'logo' | 'custom' | 'initial' | 'none',
      url: string // si es custom
    },
    color: string, // Color principal del chat
    floatingButton: {
      shape: 'circle' | 'square' | 'rounded' | 'custom',
      position: 'bottom-right' | 'bottom-left',
      size: 'small' | 'normal' | 'large'
    },
    messages: {
      bubbleShape: 'square' | 'soft' | 'rounded',
      spacing: 'compact' | 'normal' | 'airy',
      userStyle: 'solid' | 'outline' | 'transparent',
      agentStyle: 'solid' | 'outline' | 'transparent',
      showTimestamp: boolean
    }
  },

  // Footer
  footer: {
    show: boolean,
    style: 'minimal' | 'complete' | 'split',
    showLogo: boolean,
    showSocial: boolean,
    customText: string,
    poweredBy: boolean // según reglas del plan
  },

  // Redes sociales
  social: {
    networks: {
      facebook: string,
      instagram: string,
      linkedin: string,
      twitter: string,
      tiktok: string,
      youtube: string,
      whatsapp: string
    },
    showIcons: boolean,
    style: 'icons' | 'text' | 'icon+text'
  },

  // Microdetalles
  details: {
    dividers: 'none' | 'line' | 'subtle-line' | 'decorative',
    indicators: 'none' | 'dots' | 'lines' | 'numbering',
    hoverGlobal: 'none' | 'subtle' | 'dynamic',
    transitions: 'fast' | 'smooth' | 'slow'
  },

  // Animaciones
  animations: {
    style: 'none' | 'subtle' | 'dynamic',
    appearance: 'instant' | 'fade' | 'slide' | 'scale',
    hover: 'none' | 'color' | 'lift' | 'shift'
  },

  // Configuración avanzada (modo avanzado)
  advanced: {
    contentWidth: number, // px exacto
    borderRadius: number, // px exacto
    shadowOpacity: number, // 0-1
    shadowBlur: number, // px
    shadowSpread: number, // px
    headingSize: number, // px exacto
    heroHeight: number, // px exacto
    backgroundPosition: string, // 'center center', etc.
    spacing: {
      section: number, // px
      element: number, // px
      compact: number, // px
    }
  },

  // Preset seleccionado
  preset: 'editorial' | 'studio' | 'corporate' | 'minimal' | 'bold' | 'elegant' | 'creative' | 'custom',

  // Modo
  mode: 'basic' | 'advanced'
}
```

---

## Presets Visuales

### Editorial
```javascript
{
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
}
```

### Studio
```javascript
{
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
}
```

### Corporate
```javascript
{
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
}
```

### Minimal
```javascript
{
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
}
```

### Bold
```javascript
{
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
}
```

### Elegant
```javascript
{
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
}
```

### Creative
```javascript
{
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
```

---

## Compatibilidad con Configuraciones Existentes

### Mapeo de configuración antigua → nueva

```javascript
function migrateOldConfig(oldConfig) {
  return {
    brand: {
      name: oldConfig.business_name,
      slug: oldConfig.slug,
      logo: {
        url: oldConfig.logo_url,
        size: oldConfig.logo_size <= 80 ? 'small' : oldConfig.logo_size >= 120 ? 'large' : 'medium',
        position: 'left',
        style: 'auto',
        favicon: null
      },
      colors: {
        primary: oldConfig.chat_box_color || '#00ff8c',
        secondary: oldConfig.background_gradient || '#00cc6a',
        contrast: '#ffffff'
      }
    },
    layout: {
      structure: oldConfig.page_design === 'split' ? 'split' : oldConfig.page_design === 'full' ? 'immersive' : 'centered',
      width: 'normal',
      density: 'normal',
      alignment: 'center'
    },
    typography: {
      body: {
        family: oldConfig.font_family || 'Inter',
        size: 'normal',
        weight: 400,
        letterSpacing: 'normal'
      },
      headings: {
        family: oldConfig.title_font || oldConfig.font_family || 'Inter',
        size: 'normal',
        weight: 700,
        casing: 'normal'
      }
    },
    colors: {
      background: {
        type: oldConfig.background_type || 'solid',
        primary: oldConfig.background_color || '#050505',
        secondary: oldConfig.background_gradient || '#00ff8c',
        direction: 'diagonal',
        intensity: 'normal',
        image: null,
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
        shape: oldConfig.border_radius === 'sharp' ? 'square' : oldConfig.border_radius === 'pill' ? 'soft' : 'rounded',
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
      background: oldConfig.header_theme === 'light' ? 'solid' : 'semi-transparent',
      separator: 'none',
      alignment: 'left',
      logo: { size: 'normal' },
      mobile: { style: 'hamburger' }
    },
    hero: {
      layout: 'text-centered',
      height: 'screen',
      contentPosition: 'center',
      image: { show: false, position: 'right', url: null },
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
        position: oldConfig.chat_position || 'right',
        size: 'normal',
        window: 'solid'
      },
      header: { style: 'simple' },
      avatar: { type: 'initial', url: null },
      color: oldConfig.chat_box_color || '#00ff8c',
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
      show: oldConfig.show_footer !== false,
      style: 'minimal',
      showLogo: false,
      showSocial: true,
      customText: null,
      poweredBy: true
    },
    social: {
      networks: oldConfig.social_links || {},
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

    // Mantener campos de IA
    welcome_message: oldConfig.welcome_message,
    system_prompt: oldConfig.system_prompt,
    ai_model: oldConfig.ai_model,
    character_limit: oldConfig.character_limit,
    plan: oldConfig.plan,
    is_active: oldConfig.is_active,
    split_image: oldConfig.split_image,
    split_text: oldConfig.split_text
  };
}
```

---

## Implementación de la UI del Builder

### Estructura de Secciones

El Builder tendrá las siguientes secciones organizadas:

1. **Presets** - Selección rápida de estilo (cards visuales)
2. **Marca** - Logo, nombre, colores de marca
3. **Composición** - Layout, ancho, densidad, alineación
4. **Tipografía** - Fuentes con preview, tamaños, pesos
5. **Colores** - Fondo, texto, gradientes con controles visuales
6. **Estilo** - Bordes, sombras, profundidad
7. **Botones** - Forma, tamaño, estilo, hover
8. **Navegación** - Posición, fondo, alineación
9. **Hero** - Layout específico, altura, imagen
10. **Imágenes** - Forma, tratamiento, bordes
11. **Chatbot** - Apariencia, avatar, mensajes
12. **Footer** - Estilo, contenido, redes
13. **Detalles** - Divisores, indicadores, efectos
14. **Animaciones** - Estilo, aparición, hover
15. **Avanzado** - (solo en modo avanzado) valores exactos

### Configuración Progresiva

Solo mostrar opciones relevantes según selección:

Ejemplo:
- Si `background.type === 'solid'` → no mostrar `secondary`, `direction`, `intensity`
- Si `background.type === 'gradient'` → mostrar `secondary`, `direction`, `intensity`
- Si `background.type === 'image'` → mostrar `image`, `overlay`

### Controles Visuales

#### Color
- Color picker nativo + hex input
- Presets de colores comunes
- Preview en tiempo real

#### Fuente
- Renderizar cada opción con su propio nombre en esa fuente
- Ejemplo: "Inter" en Inter, "Playfair Display" en Playfair Display

#### Bordes
- Miniaturas visuales de: square, slightly-rounded, rounded, soft
- Preview del radio en tiempo real

#### Layout
- Miniaturas de composición: centered, editorial, split, immersive, etc.
- Preview del ancho en tiempo real

#### Botones
- Ejemplos reales de botones renderizados
- Preview de hover

#### Chatbot
- Miniatura real del chatbot con configuración actual

### Modo Básico / Avanzado

Toggle en el header del Builder:

**Básico**: Controles semánticos (small/medium/large, subtle/medium/deep)
**Avanzado**: Valores exactos (px, %, hex)

### Preview en Tiempo Real

- Actualización instantánea al cambiar cualquier valor
- Debounce para sliders (200ms)
- Preview responsive (desktop/tablet/mobile toggle)

---

## Actualización del Backend

### Nuevas columnas en Supabase

Se agregarán columnas JSONB para almacenar la nueva estructura:

```sql
ALTER TABLE myia_page_config
ADD COLUMN design_config JSONB DEFAULT '{}';
```

### API Changes

- `/api/myia/config` - Guardar configuración (acepta both old and new format)
- `/api/myia/config-by-id/:id` - Obtener configuración (retorna migrated format)
- `/api/myia/render/:slug` - Renderizar página (usa migrated format)

### Renderizado HTML

La función `generatePageHTML` será reescrita para usar la nueva estructura `designConfig`.

---

## Orden de Implementación

1. ✅ Auditoría del código actual
2. ✅ Diseñar nueva estructura de configuración
3. Implementar migración de configuraciones existentes
4. Crear nueva UI del Builder (HTML/CSS)
5. Implementar lógica del Builder (JS)
6. Implementar presets visuales
7. Implementar preview en tiempo real
8. Implementar modo básico/avanzado
9. Implementar configuración progresiva
10. Actualizar backend para aceptar nueva estructura
11. Actualizar renderizado HTML
12. Validar con 4 sitios de prueba
13. Verificar responsive
14. Testing final

---

## Criterio de Éxito

El usuario debe poder crear dos sitios con la misma funcionalidad pero identidades visuales completamente diferentes:

**Sitio A (Editorial):**
- Serif para títulos
- Alineación izquierda
- Bordes definidos
- Mucho whitespace
- Botones outline
- Chat minimal

**Sitio B (Bold):**
- Sans serif
- Alto contraste
- Layout asimétrico
- Botones sólidos
- Chat grande

Ambos deben funcionar con el mismo sistema y sentirse realmente diferentes.
