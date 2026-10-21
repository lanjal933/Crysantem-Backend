-- ============================================
-- MIGRACIÓN: Agregar columna expires_at a user_google_tokens
-- ============================================
-- Propósito: Agregar columna expires_at para trackear expiración de access_tokens

-- ============================================
-- AGREGAR COLUMNA expires_at
-- ============================================

ALTER TABLE user_google_tokens
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- AGREGAR COMENTARIO
-- ============================================

COMMENT ON COLUMN user_google_tokens.expires_at IS 'Fecha de expiración del access_token (usualmente 1 hora desde la generación)';

-- ============================================
-- ACTUALIZAR REGISTROS EXISTENTES
-- ============================================
-- Para registros existentes, establecer expires_at a 1 hora desde ahora
UPDATE user_google_tokens
SET expires_at = NOW() + INTERVAL '1 hour'
WHERE expires_at IS NULL;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Mostrar la estructura actual de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_google_tokens'
ORDER BY ordinal_position;

-- Contar registros con expires_at
SELECT
  COUNT(*) as total_registros,
  COUNT(expires_at) as registros_con_expires_at,
  COUNT(*) - COUNT(expires_at) as registros_sin_expires_at
FROM user_google_tokens;
