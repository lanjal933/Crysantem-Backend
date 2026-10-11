-- Migración para mejoras del builder MyIA
-- Agrega soporte para modo de chat, agente personalizado, quick prompts y captura de leads
-- Cambia border_radius de texto a número (píxeles)

-- Paso 1: Agregar nuevas columnas primero
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS chat_mode TEXT DEFAULT 'embedded' CHECK (chat_mode IN ('embedded', 'floating')),
ADD COLUMN IF NOT EXISTS agent_name TEXT DEFAULT 'Asistente Virtual',
ADD COLUMN IF NOT EXISTS agent_avatar TEXT,
ADD COLUMN IF NOT EXISTS quick_prompts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lead_capture TEXT DEFAULT 'none' CHECK (lead_capture IN ('none', 'name', 'email', 'phone', 'name_email', 'all'));

-- Paso 2: Actualizar datos existentes de border_radius
UPDATE myia_page_config 
SET border_radius = CASE 
  WHEN border_radius = 'sharp' THEN 0::integer
  WHEN border_radius = 'pill' THEN 24::integer
  WHEN border_radius = 'rounded' THEN 12::integer
  ELSE 12::integer
END
WHERE border_radius IN ('sharp', 'pill', 'rounded');

-- Paso 3: Cambiar tipo de columna a INTEGER
ALTER TABLE myia_page_config
ALTER COLUMN border_radius TYPE INTEGER USING border_radius::integer,
ALTER COLUMN border_radius SET DEFAULT 12;

-- Comentario sobre las nuevas columnas
COMMENT ON COLUMN myia_page_config.chat_mode IS 'Modo de visualización del chat: embedded (chat como cuerpo principal) o floating (widget flotante)';
COMMENT ON COLUMN myia_page_config.agent_name IS 'Nombre personalizado del agente de IA';
COMMENT ON COLUMN myia_page_config.agent_avatar IS 'URL del avatar del agente de IA';
COMMENT ON COLUMN myia_page_config.quick_prompts IS 'Array de preguntas frecuentes que aparecen como botones sobre el chat';
COMMENT ON COLUMN myia_page_config.lead_capture IS 'Qué datos del visitante solicitar: none, name, email, phone, name_email, all';
COMMENT ON COLUMN myia_page_config.border_radius IS 'Radio de bordes en píxeles (0-24)';

-- Crear índice para optimizar búsquedas por chat_mode
CREATE INDEX IF NOT EXISTS idx_myia_page_config_chat_mode ON myia_page_config(chat_mode);

-- Actualizar timestamp
UPDATE myia_page_config SET updated_at = NOW() WHERE chat_mode IS NULL;
