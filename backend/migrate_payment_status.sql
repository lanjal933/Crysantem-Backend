-- Migración para agregar columnas de estado de pago y suscripciones
-- Ejecutar esto en Supabase SQL Editor

-- Agregar columnas para tracking de pagos de Mercado Pago
ALTER TABLE myia_page_config
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_myia_page_config_payment_status ON myia_page_config(payment_status);
CREATE INDEX IF NOT EXISTS idx_myia_page_config_subscription_id ON myia_page_config(subscription_id);

-- Comentario sobre las nuevas columnas
COMMENT ON COLUMN myia_page_config.payment_status IS 'Estado del pago (pending, paid, failed, cancelled)';
COMMENT ON COLUMN myia_page_config.payment_id IS 'ID de la transacción de Mercado Pago';
COMMENT ON COLUMN myia_page_config.payment_date IS 'Fecha en que se completó el pago';
COMMENT ON COLUMN myia_page_config.subscription_id IS 'ID de la suscripción de Mercado Pago (preapproval)';
COMMENT ON COLUMN myia_page_config.subscription_status IS 'Estado de la suscripción (pending, authorized, paused, cancelled)';
