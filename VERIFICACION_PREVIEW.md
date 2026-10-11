# Verificación de Opciones de Personalización - MyIA Builder v2

## Resumen de Opciones y Estado de Funcionamiento

### 1. MARCA (brand)
- [ ] Nombre del negocio (business_name) - Input de texto
- [ ] Logo URL (logo.url) - Input de texto
- [ ] Tamaño del logo (logo.size: small/medium/large) - Botones
- [ ] Posición del logo (logo.position: left/center/right) - Botones
- [ ] Color primario (brand.colors.primary) - Color picker
- [ ] Color secundario (brand.colors.secondary) - Color picker
- [ ] Color de contraste (brand.colors.contrast) - Color picker

### 2. COMPOSICIÓN (layout)
- [ ] Estructura (structure: centered/editorial/split/immersive/minimal/information-first) - Cards
- [ ] Ancho de contenido (width: compact/normal/wide/full) - Slider
- [ ] Densidad (density: airy/normal/compact) - Slider
- [ ] Alineación (alignment: left/center/right/auto) - Botones

### 3. TIPOGRAFÍA (typography)
- [ ] Fuente del cuerpo (body.family: Inter/Roboto/Playfair/Lato/Montserrat) - Cards
- [ ] Fuente de títulos (headings.family: same/body) - Botones
- [ ] Tamaño de títulos (headings.size: compact/normal/large) - Slider
- [ ] Peso de títulos (headings.weight: 300-800) - Slider
- [ ] Letter spacing (body.letterSpacing: tight/normal/spaced) - Slider
- [ ] Casing (headings.casing: normal/title-case/uppercase) - Botones

### 4. COLORES (colors)
- [ ] Tipo de fondo (background.type: solid/gradient) - Botones
- [ ] Color de fondo primario (background.primary) - Color picker
- [ ] Color de fondo secundario (background.secondary) - Color picker
- [ ] Dirección del gradiente (background.direction: horizontal/vertical/diagonal/radial) - Botones
- [ ] Intensidad del gradiente (background.intensity: subtle/normal/intense) - Botones
- [ ] Overlay (background.overlay: none/light/medium/dark) - Botones
- [ ] Color de texto primario (text.primary) - Color picker
- [ ] Color de texto secundario (text.secondary) - Color picker
- [ ] Color de texto apagado (text.muted) - Color picker

### 5. ESTILO (style)
- [ ] Forma de bordes (borders.shape: square/slightly-rounded/rounded/soft/circular) - Botones
- [ ] Intensidad de bordes (borders.intensity: none/subtle/normal/intense) - Botones
- [ ] Intensidad de sombras (shadows.intensity: none/subtle/normal/intense) - Botones
- [ ] Profundidad (depth: flat/subtle/medium/deep) - Botones

### 6. BOTONES (buttons)
- [ ] Forma (shape: square/rounded/pill/circular) - Botones
- [ ] Tamaño (size: small/normal/large) - Botones
- [ ] Estilo (style: solid/outline/ghost/text) - Botones
- [ ] Borde (border: none/thin/medium/thick) - Botones
- [ ] Efecto hover (hover: none/lift/scale/color-change) - Botones

### 7. HERO (hero)
- [ ] Layout/Distribución (layout: text-centered/text+image/image-text/full-image) - Botones
- [ ] Altura (height: screen/compact/normal/tall) - Botones
- [ ] Posición del contenido (contentPosition: left/center/right) - Botones
- [ ] URL de imagen (image.url) - Input de texto
- [ ] Posición de imagen (image.position: left/center/right) - Botones
- [ ] Overlay (overlay: none/light/medium/dark) - Botones

### 8. IMÁGENES (images)
- [ ] Forma (shape: square/rounded/circular) - Botones
- [ ] Object-fit (fit: cover/contain/fill) - Botones
- [ ] Borde (border: none/thin/medium/thick) - Botones
- [ ] Sombra (shadow: none/subtle/normal/intense) - Botones
- [ ] Filtro/Tratamiento (filter: normal/grayscale/blur/brightness/contrast) - Botones

### 9. CHATBOT (chatbot)
- [ ] Forma (appearance.shape: square/rounded/soft/circular) - Botones
- [ ] Posición (appearance.position: left/right/center) - Botones
- [ ] Tamaño (appearance.size: small/normal/large) - Botones
- [ ] Estilo de ventana (appearance.window: solid/blur/transparent) - Botones
- [ ] Estilo de cabecera (header.style: simple/minimal/detailed) - Botones
- [ ] Tipo de avatar (avatar.type: initial/image/icon) - Botones
- [ ] Color del chatbot (color) - Color picker
- [ ] Forma de burbuja (messages.bubbleShape: square/rounded/soft) - Botones
- [ ] Separación de mensajes (messages.spacing: tight/normal/spaced) - Botones
- [ ] Mostrar timestamp (messages.showTimestamp) - Checkbox

### 10. FOOTER (footer)
- [ ] Mostrar footer (show) - Checkbox
- [ ] Estilo (style: minimal/detailed/columns) - Botones
- [ ] Mostrar logo (showLogo) - Checkbox
- [ ] Mostrar social (showSocial) - Checkbox
- [ ] Texto personalizado (customText) - Input de texto
- [ ] Powered by (poweredBy) - Checkbox

### 11. SOCIAL (social)
- [ ] Mostrar iconos (showIcons) - Checkbox
- [ ] Estilo (style: icons/text/both) - Botones
- [ ] Facebook URL (networks.facebook) - Input
- [ ] Instagram URL (networks.instagram) - Input
- [ ] LinkedIn URL (networks.linkedin) - Input
- [ ] Twitter URL (networks.twitter) - Input
- [ ] TikTok URL (networks.tiktok) - Input
- [ ] YouTube URL (networks.youtube) - Input
- [ ] WhatsApp URL (networks.whatsapp) - Input

### 12. DETALLES (details)
- [ ] Divisores (dividers: none/subtle/strong) - Botones
- [ ] Indicadores (indicators: none/bullets/numbering) - Botones
- [ ] Hover global (hoverGlobal: none/subtle/strong) - Botones
- [ ] Transiciones (transitions: slow/normal/fast) - Botones

### 13. ANIMACIONES (animations)
- [ ] Estilo (style: none/subtle/dynamic) - Botones
- [ ] Aparición (appearance: fade/slide/lift) - Botones
- [ ] Hover (hover: none/slide/lift/shift) - Botones

### 14. PRESETS
- [ ] Editorial
- [ ] Studio
- [ ] Corporate
- [ ] Minimal
- [ ] Bold
- [ ] Elegant
- [ ] Creative
- [ ] Custom

---

## Proceso de Verificación

Para cada opción:
1. Cambiar el valor en el Builder
2. Verificar si el preview cambia visualmente
3. Marcar como [✓] si funciona, [✗] si no funciona
4. Agregar notas si el cambio es sutil o incorrecto

## Prioridad Alta - Deben funcionar obligatoriamente:
- Background tipo gradient + dirección
- Colores de fondo (primario/secundario)
- Bordes (forma e intensidad)
- Sombras
- Botones (forma, tamaño, estilo)
- Tipografía (fuente, tamaño, peso)
- Chatbot (color, forma)
- Animaciones
