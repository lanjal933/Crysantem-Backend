-- Migración para agregar contador de mensajes mensuales a myia_page_config
-- Ejecutar en Supabase SQL Editor

-- Nuevas columnas para el contador de mensajes
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS messages_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
ADD COLUMN IF NOT EXISTS current_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
ADD COLUMN IF NOT EXISTS last_message_count_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Comentarios
COMMENT ON COLUMN myia_page_config.messages_used_this_month IS 'Cantidad de mensajes enviados en el mes actual';
COMMENT ON COLUMN myia_page_config.current_month IS 'Mes actual del contador (1-12)';
COMMENT ON COLUMN myia_page_config.current_year IS 'Año actual del contador';
COMMENT ON COLUMN myia_page_config.last_message_count_reset IS 'Fecha del último reset del contador';

-- Índice para búsquedas por página y estado activo
CREATE INDEX IF NOT EXISTS idx_myia_page_config_active ON myia_page_config(is_active) WHERE is_active = true;
