-- Tabla para gestionar emails permitidos en Crysantem COWORKERS
-- Crysantem COWORKERS permite crear páginas gratis con plan 01 sin OAuth

CREATE TABLE IF NOT EXISTS myia_coworkers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'admin'
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_coworkers_email ON myia_coworkers(email);
CREATE INDEX IF NOT EXISTS idx_coworkers_active ON myia_coworkers(is_active);

-- Política de seguridad (opcional, si se usa RLS)
-- ALTER TABLE myia_coworkers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Solo admins pueden ver coworkers" ON myia_coworkers
--   FOR SELECT USING (auth.role() = 'authenticated');

-- ===== AGREGA TU EMAIL AQUÍ =====
-- Reemplaza 'tu@email.com' con tu email real
INSERT INTO myia_coworkers (email, name, is_active)
VALUES ('tu@email.com', 'Tu Nombre', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;
