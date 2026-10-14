-- ============================================
-- MIGRACIÓN: Agregar columnas para Sheets y Gmail
-- ============================================
-- Propósito: Separar URLs de sheets y gmail como columnas individuales
-- para facilitar la conexión con nodos específicos de n8n

-- Columnas a agregar:
-- 1. sheets_database_url: URL API de la base de datos de usuarios
-- 2. sheets_custom_1_url: URL API del custom sheet 1 (Plan 03)
-- 3. sheets_custom_2_url: URL API del custom sheet 2 (Plan 04)
-- 4. gmail_sender_email: Email de envío de Gmail (Plan 04)

-- ============================================
-- AGREGAR COLUMNAS A myia_page_config
-- ============================================

-- 1. URL de la base de datos de usuarios
ALTER TABLE myia_page_config 
ADD COLUMN IF NOT EXISTS sheets_database_url TEXT;

-- 2. URL del custom sheet 1 (Plan 03)
ALTER TABLE myia_page_config 
ADD COLUMN IF NOT EXISTS sheets_custom_1_url TEXT;

-- 3. URL del custom sheet 2 (Plan 04)
ALTER TABLE myia_page_config 
ADD COLUMN IF NOT EXISTS sheets_custom_2_url TEXT;

-- 4. Email de envío de Gmail (Plan 04)
ALTER TABLE myia_page_config 
ADD COLUMN IF NOT EXISTS gmail_sender_email TEXT;

-- ============================================
-- AGREGAR COMENTARIOS A LAS COLUMNAS
-- ============================================

COMMENT ON COLUMN myia_page_config.sheets_database_url IS 'URL API de Google Sheets para la base de datos de usuarios (usada en n8n)';
COMMENT ON COLUMN myia_page_config.sheets_custom_1_url IS 'URL API del custom sheet 1 (Plan 03, usado en n8n)';
COMMENT ON COLUMN myia_page_config.sheets_custom_2_url IS 'URL API del custom sheet 2 (Plan 04, usado en n8n)';
COMMENT ON COLUMN myia_page_config.gmail_sender_email IS 'Email de envío de Gmail (Plan 04, usado en n8n)';

-- ============================================
-- AGREGAR ÍNDICES PARA BÚSQUEDAS RÁPIDAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_myia_page_config_sheets_database_url ON myia_page_config(sheets_database_url);
CREATE INDEX IF NOT EXISTS idx_myia_page_config_gmail_sender_email ON myia_page_config(gmail_sender_email);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Mostrar la estructura actual de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'myia_page_config' 
  AND column_name IN ('sheets_database_url', 'sheets_custom_1_url', 'sheets_custom_2_url', 'gmail_sender_email')
ORDER BY ordinal_position;
