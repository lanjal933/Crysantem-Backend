-- ============================================
-- VALIDACIÓN: Verificar estructura de columnas para Sheets y Gmail
-- ============================================
-- Propósito: Validar que las columnas necesarias para n8n existan en myia_page_config
-- Este script NO modifica datos, solo reporta el estado actual

-- ============================================
-- VERIFICACIÓN DE COLUMNAS
-- ============================================

-- Mostrar la estructura actual de las columnas críticas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'myia_page_config'
  AND column_name IN (
    'sheets_database_url_get', 
    'sheets_database_url_post',
    'sheets_custom_1_url_get', 
    'sheets_custom_1_url_post',
    'sheets_custom_2_url_get', 
    'sheets_custom_2_url_post',
    'gmail_sender_email'
  )
ORDER BY ordinal_position;

-- ============================================
-- VERIFICACIÓN DE ÍNDICES
-- ============================================

-- Mostrar índices existentes para estas columnas
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'myia_page_config'
  AND indexname LIKE '%sheets%' OR indexname LIKE '%gmail%';

-- ============================================
-- VERIFICACIÓN DE DATOS
-- ============================================

-- Contar páginas con Sheets configurados
SELECT 
  COUNT(*) AS total_pages,
  COUNT(sheets_database_url_get) AS pages_with_sheets_db,
  COUNT(sheets_custom_1_url_get) AS pages_with_custom_1,
  COUNT(sheets_custom_2_url_get) AS pages_with_custom_2,
  COUNT(gmail_sender_email) AS pages_with_gmail
FROM myia_page_config;

-- Mostrar páginas con datos faltantes (para debugging)
SELECT 
  id,
  business_name,
  slug,
  plan,
  CASE 
    WHEN sheets_database_url_get IS NULL THEN 'FALTA sheets_database_url_get'
    WHEN sheets_database_url_post IS NULL THEN 'FALTA sheets_database_url_post'
    WHEN gmail_sender_email IS NULL AND plan = 'intelligence' THEN 'FALTA gmail_sender_email (Plan Intelligence)'
    ELSE 'OK'
  END AS status
FROM myia_page_config
WHERE 
  sheets_database_url_get IS NULL OR
  sheets_database_url_post IS NULL OR
  (gmail_sender_email IS NULL AND plan = 'intelligence')
ORDER BY created_at DESC;

-- ============================================
-- COMENTARIOS DE COLUMNAS
-- ============================================

-- Mostrar comentarios existentes
SELECT 
  col.column_name,
  pgd.description
FROM information_schema.columns col
LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = (
  SELECT oid FROM pg_class WHERE relname = 'myia_page_config'
) AND pgd.objsubid = col.ordinal_position
WHERE col.table_name = 'myia_page_config'
  AND col.column_name IN (
    'sheets_database_url_get',
    'sheets_database_url_post',
    'sheets_custom_1_url_get',
    'sheets_custom_1_url_post',
    'sheets_custom_2_url_get',
    'sheets_custom_2_url_post',
    'gmail_sender_email'
  );

-- ============================================
-- REPORT DE ESTADO
-- ============================================

-- Resumen final
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'myia_page_config'
    AND column_name IN (
      'sheets_database_url_get', 
      'sheets_database_url_post',
      'sheets_custom_1_url_get', 
      'sheets_custom_1_url_post',
      'sheets_custom_2_url_get', 
      'sheets_custom_2_url_post',
      'gmail_sender_email'
    );
  
  IF column_count = 7 THEN
    RAISE NOTICE '✅ Todas las columnas requeridas existen (7/7)';
  ELSE
    RAISE NOTICE '❌ Faltan columnas: Existen % de 7 requeridas', column_count;
  END IF;
END $$;
