-- Migración: Tabla de aceptaciones de términos y condiciones
-- Fecha: 12 de octubre de 2026
-- Descripción: Crea tabla para rastrear aceptaciones de términos y condiciones por usuario

-- Crear tabla de aceptaciones de términos
CREATE TABLE IF NOT EXISTS terms_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    terms_version TEXT NOT NULL DEFAULT '2026-10-12',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user_id ON terms_acceptances(user_id);

-- Crear índice para búsquedas rápidas por versión de términos
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_version ON terms_acceptances(terms_version);

-- Crear índice para búsquedas de aceptaciones recientes
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_accepted_at ON terms_acceptances(accepted_at DESC);

-- Crear índice único para evitar aceptaciones duplicadas del mismo usuario para la misma versión
CREATE UNIQUE INDEX IF NOT EXISTS idx_terms_acceptances_user_version ON terms_acceptances(user_id, terms_version);

-- Agregar comentarios
COMMENT ON TABLE terms_acceptances IS 'Registra las aceptaciones de términos y condiciones por usuario';
COMMENT ON COLUMN terms_acceptances.id IS 'ID único de la aceptación';
COMMENT ON COLUMN terms_acceptances.user_id IS 'ID del usuario que aceptó los términos';
COMMENT ON COLUMN terms_acceptances.accepted_at IS 'Fecha y hora de aceptación';
COMMENT ON COLUMN terms_acceptances.terms_version IS 'Versión de los términos aceptados (formato YYYY-MM-DD)';
COMMENT ON COLUMN terms_acceptances.ip_address IS 'Dirección IP desde la que se aceptó los términos';
COMMENT ON COLUMN terms_acceptances.user_agent IS 'User agent del navegador';
COMMENT ON COLUMN terms_acceptances.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN terms_acceptances.updated_at IS 'Fecha de última actualización del registro';

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_terms_acceptances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_terms_acceptances_updated_at ON terms_acceptances;
CREATE TRIGGER trigger_update_terms_acceptances_updated_at
    BEFORE UPDATE ON terms_acceptances
    FOR EACH ROW
    EXECUTE FUNCTION update_terms_acceptances_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE terms_acceptances ENABLE ROW LEVEL SECURITY;

-- Eliminar policies si existen (para evitar errores al reejecutar)
DROP POLICY IF EXISTS "Users can view own terms acceptances" ON terms_acceptances;
DROP POLICY IF EXISTS "Users can insert own terms acceptances" ON terms_acceptances;
DROP POLICY IF EXISTS "Users can update own terms acceptances" ON terms_acceptances;
DROP POLICY IF EXISTS "Services can read terms acceptances" ON terms_acceptances;

-- Política: Los usuarios pueden ver sus propias aceptaciones
CREATE POLICY "Users can view own terms acceptances"
    ON terms_acceptances FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias aceptaciones
CREATE POLICY "Users can insert own terms acceptances"
    ON terms_acceptances FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias aceptaciones
CREATE POLICY "Users can update own terms acceptances"
    ON terms_acceptances FOR UPDATE
    USING (auth.uid() = user_id);

-- Política: Servicios pueden leer aceptaciones (para validación)
CREATE POLICY "Services can read terms acceptances"
    ON terms_acceptances FOR SELECT
    USING (true);

-- Nota: La tabla terms_acceptances está lista para ser usada
-- Para validar si un usuario aceptó los términos, usar:
-- SELECT * FROM terms_acceptances WHERE user_id = $1 AND terms_version = '2026-10-12' LIMIT 1;
