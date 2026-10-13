-- Migración para convertir el builder de formato web a formato de chat literal
-- Ejecutar esto en Supabase SQL Editor

-- Paso 1: Eliminar columnas viejas de diseño web
ALTER TABLE myia_page_config
DROP COLUMN IF EXISTS page_design,
DROP COLUMN IF EXISTS background_type,
DROP COLUMN IF EXISTS background_color,
DROP COLUMN IF EXISTS background_gradient,
DROP COLUMN IF EXISTS glow_color,
DROP COLUMN IF EXISTS font_family,
DROP COLUMN IF EXISTS title_font,
DROP COLUMN IF EXISTS chat_box_design,
DROP COLUMN IF EXISTS chat_position,
DROP COLUMN IF EXISTS border_radius,
DROP COLUMN IF EXISTS chat_box_color,
DROP COLUMN IF EXISTS header_theme,
DROP COLUMN IF EXISTS header_color,
DROP COLUMN IF EXISTS header_title_size,
DROP COLUMN IF EXISTS show_footer,
DROP COLUMN IF EXISTS split_image,
DROP COLUMN IF EXISTS split_text,
DROP COLUMN IF EXISTS logo_url,
DROP COLUMN IF EXISTS logo_size,
DROP COLUMN IF EXISTS social_links;

-- Paso 2: Agregar columnas nuevas para formato de chat
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS bot_name TEXT DEFAULT 'Asistente',
ADD COLUMN IF NOT EXISTS bot_avatar TEXT,
ADD COLUMN IF NOT EXISTS header_subtitle TEXT,
ADD COLUMN IF NOT EXISTS chat_theme TEXT DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS message_bubble_color TEXT DEFAULT '#00ff88',
ADD COLUMN IF NOT EXISTS user_bubble_color TEXT DEFAULT '#333333',
ADD COLUMN IF NOT EXISTS background_type TEXT DEFAULT 'solid',
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#0d0d0d',
ADD COLUMN IF NOT EXISTS background_gradient TEXT,
ADD COLUMN IF NOT EXISTS background_image TEXT;

-- Paso 3: Actualizar business_name para que sea el nombre del chat (opcional)
-- Si business_name es null, usar el valor de bot_name por defecto
UPDATE myia_page_config
SET business_name = COALESCE(business_name, bot_name, 'Mi Chat')
WHERE business_name IS NULL OR business_name = '';

-- Paso 4: Comentarios de las nuevas columnas
COMMENT ON COLUMN myia_page_config.bot_name IS 'Nombre del bot que aparece en el chat';
COMMENT ON COLUMN myia_page_config.bot_avatar IS 'URL de la foto del bot';
COMMENT ON COLUMN myia_page_config.header_subtitle IS 'Nombre de la empresa o subtítulo del header';
COMMENT ON COLUMN myia_page_config.chat_theme IS 'Tema del chat: light o dark';
COMMENT ON COLUMN myia_page_config.message_bubble_color IS 'Color de los mensajes del bot';
COMMENT ON COLUMN myia_page_config.user_bubble_color IS 'Color de los mensajes del usuario';
