-- ============================================
-- MIGRACIÓN: Agregar columnas para Sheets y Gmail
-- ============================================
-- Propósito: Separar URLs de sheets y gmail como columnas individuales
-- para facilitar la conexión con nodos específicos de n8n

-- Columnas a agregar:
-- 1. sheets_database_url_get: URL GET para leer base de datos de usuarios
-- 2. sheets_database_url_post: URL POST para escribir en base de datos de usuarios
-- 3. sheets_custom_1_url_get: URL GET para leer custom sheet 1 (Plan 03)
-- 4. sheets_custom_1_url_post: URL POST para escribir en custom sheet 1 (Plan 03)
-- 5. sheets_custom_2_url_get: URL GET para leer custom sheet 2 (Plan 04)
-- 6. sheets_custom_2_url_post: URL POST para escribir en custom sheet 2 (Plan 04)
-- 7. gmail_sender_email: Email de envío de Gmail (Plan 04)

-- ============================================
-- AGREGAR COLUMNAS A myia_page_config
-- ============================================

-- URLs GET y POST de la base de datos de usuarios
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS sheets_database_url_get TEXT;
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS sheets_database_url_post TEXT;

-- URLs GET y POST del custom sheet 1 (Plan 03)
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS sheets_custom_1_url_get TEXT;
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS sheets_custom_1_url_post TEXT;

-- URLs GET y POST del custom sheet 2 (Plan 04)
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS sheets_custom_2_url_get TEXT;
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS sheets_custom_2_url_post TEXT;

-- Email de envío de Gmail (Plan 04)
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS gmail_sender_email TEXT;

-- ============================================
-- AGREGAR COMENTARIOS A LAS COLUMNAS
-- ============================================

COMMENT ON COLUMN myia_page_config.sheets_database_url_get IS 'URL GET para leer base de datos de Sheets (n8n variable)';
COMMENT ON COLUMN myia_page_config.sheets_database_url_post IS 'URL POST para escribir en base de datos de Sheets (n8n variable)';
COMMENT ON COLUMN myia_page_config.sheets_custom_1_url_get IS 'URL GET para leer Sheet personalizado 1 (n8n variable)';
COMMENT ON COLUMN myia_page_config.sheets_custom_1_url_post IS 'URL POST para escribir en Sheet personalizado 1 (n8n variable)';
COMMENT ON COLUMN myia_page_config.sheets_custom_2_url_get IS 'URL GET para leer Sheet personalizado 2 (n8n variable)';
COMMENT ON COLUMN myia_page_config.sheets_custom_2_url_post IS 'URL POST para escribir en Sheet personalizado 2 (n8n variable)';
COMMENT ON COLUMN myia_page_config.gmail_sender_email IS 'Email de envío de Gmail (Plan 04, usado en n8n)';

-- ============================================
-- AGREGAR ÍNDICES PARA BÚSQUEDAS RÁPIDAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_myia_page_config_sheets_database_url_get ON myia_page_config(sheets_database_url_get);
CREATE INDEX IF NOT EXISTS idx_myia_page_config_gmail_sender_email ON myia_page_config(gmail_sender_email);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Mostrar la estructura actual de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'myia_page_config'
  AND column_name IN (
    'sheets_database_url_get', 'sheets_database_url_post',
    'sheets_custom_1_url_get', 'sheets_custom_1_url_post',
    'sheets_custom_2_url_get', 'sheets_custom_2_url_post',
    'gmail_sender_email'
  )
ORDER BY ordinal_position;
