-- Migración para el nuevo modelo de precios SaaS MRR (V1.5)
-- Ejecutar en Supabase SQL Editor

-- Nuevas columnas en myia_page_config para el modelo SaaS
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS messages_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_months INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Crear índice para búsquedas por subscription_id
CREATE INDEX IF NOT EXISTS idx_myia_page_config_subscription_id ON myia_page_config(subscription_id);

-- Crear índice para búsquedas por is_active
CREATE INDEX IF NOT EXISTS idx_myia_page_config_is_active ON myia_page_config(is_active);

-- Comentario sobre las nuevas columnas
COMMENT ON COLUMN myia_page_config.billing_type IS 'Tipo de facturación: monthly o annual';
COMMENT ON COLUMN myia_page_config.messages_limit IS 'Límite de mensajes al mes según el plan';
COMMENT ON COLUMN myia_page_config.minimum_months IS 'Permanencia mínima requerida en meses';
COMMENT ON COLUMN myia_page_config.subscription_id IS 'ID de suscripción de Mercado Pago';
COMMENT ON COLUMN myia_page_config.subscription_status IS 'Estado de la suscripción: authorized, pending_payment, paused, cancelled';
COMMENT ON COLUMN myia_page_config.is_active IS 'Estado del bot: true=activo, false=suspendido por falta de pago';
