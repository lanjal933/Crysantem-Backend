-- Agregar columnas para URLs GET de Sheets en myia_page_config
-- Estas URLs permiten a n8n leer datos de los Sheets sin necesidad de configurarlas manualmente

ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS sheets_database_url_get TEXT,
ADD COLUMN IF NOT EXISTS sheets_database_url_post TEXT,
ADD COLUMN IF NOT EXISTS sheets_custom_1_url_get TEXT,
ADD COLUMN IF NOT EXISTS sheets_custom_1_url_post TEXT,
ADD COLUMN IF NOT EXISTS sheets_custom_2_url_get TEXT,
ADD COLUMN IF NOT EXISTS sheets_custom_2_url_post TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN myia_page_config.sheets_database_url_get IS 'URL GET para leer base de datos de Sheets (n8n variable)';
COMMENT ON COLUMN myia_page_config.sheets_database_url_post IS 'URL POST para escribir en base de datos de Sheets (n8n variable)';
COMMENT ON COLUMN myia_page_config.sheets_custom_1_url_get IS 'URL GET para leer Sheet personalizado 1 (n8n variable)';
COMMENT ON COLUMN myia_page_config.sheets_custom_1_url_post IS 'URL POST para escribir en Sheet personalizado 1 (n8n variable)';
COMMENT ON COLUMN myia_page_config.sheets_custom_2_url_get IS 'URL GET para leer Sheet personalizado 2 (n8n variable)';
COMMENT ON COLUMN myia_page_config.sheets_custom_2_url_post IS 'URL POST para escribir en Sheet personalizado 2 (n8n variable)';
