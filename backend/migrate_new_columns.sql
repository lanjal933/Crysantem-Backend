-- Migración para agregar nuevas columnas a myia_page_config
-- Ejecutar esto en Supabase SQL Editor

-- Agregar columnas para integraciones, pago y autenticación
ALTER TABLE myia_page_config 
ADD COLUMN IF NOT EXISTS integrations_config JSONB,
ADD COLUMN IF NOT EXISTS payment_plan TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS google_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS super_prompt TEXT;

-- Crear índice para integraciones_config si no existe
CREATE INDEX IF NOT EXISTS idx_myia_page_config_integrations ON myia_page_config USING GIN (integrations_config);

-- Crear índice para payment_plan si no existe
CREATE INDEX IF NOT EXISTS idx_myia_page_config_payment_plan ON myia_page_config(payment_plan);

-- Crear índice para google_connected si no existe
CREATE INDEX IF NOT EXISTS idx_myia_page_config_google_connected ON myia_page_config(google_connected);

-- Comentario sobre las nuevas columnas
COMMENT ON COLUMN myia_page_config.integrations_config IS 'Configuración de integraciones (Sheets, Drive, Gmail, Calendar) según el plan';
COMMENT ON COLUMN myia_page_config.payment_plan IS 'Plan de pago seleccionado (responde, asiste, automatiza, intelligence)';
COMMENT ON COLUMN myia_page_config.payment_method IS 'Método de pago utilizado (card, transfer, paypal)';
COMMENT ON COLUMN myia_page_config.google_connected IS 'Indica si el usuario tiene OAuth de Google conectado';
COMMENT ON COLUMN myia_page_config.super_prompt IS 'Super prompt generado automáticamente que integra todas las configuraciones según el plan (02, 03 o 04)';
