-- ============================================
-- TABLA DE USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  auth_provider TEXT DEFAULT 'email',
  email_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- TABLA DE TOKENS DE GOOGLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_google_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  email TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por user_id
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_user_id ON user_google_tokens(user_id);

-- ============================================
-- TABLA DE LÍMITES DE TOKENS
-- ============================================
CREATE TABLE IF NOT EXISTS user_token_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  monthly_limit INTEGER DEFAULT 50000,
  tokens_used INTEGER DEFAULT 0,
  current_month INTEGER NOT NULL,
  current_year INTEGER NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_at TIMESTAMP WITH TIME ZONE,
  unblocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_user_token_limits_email ON user_token_limits(email);

-- Índice compuesto para verificaciones de bloqueo por mes/año
CREATE INDEX IF NOT EXISTS idx_user_token_limits_month_year ON user_token_limits(current_month, current_year);

-- ============================================
-- FUNCIONES DE TRIGGER PARA updated_at
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabla
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_google_tokens_updated_at ON user_google_tokens;
CREATE TRIGGER update_user_google_tokens_updated_at
  BEFORE UPDATE ON user_google_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_token_limits_updated_at ON user_token_limits;
CREATE TRIGGER update_user_token_limits_updated_at
  BEFORE UPDATE ON user_token_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTARIOS DE LAS TABLAS
-- ============================================
COMMENT ON TABLE users IS 'Tabla principal de usuarios del sistema';
COMMENT ON TABLE user_google_tokens IS 'Tokens de autenticación OAuth de Google';
COMMENT ON TABLE user_token_limits IS 'Límites de uso de tokens por usuario';

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_token_limits ENABLE ROW LEVEL SECURITY;

-- Políticas para users (permitir lectura/escritura para el servicio)
CREATE POLICY "Users service access" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para user_google_tokens
CREATE POLICY "Google tokens service access" ON user_google_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para user_token_limits
CREATE POLICY "Token limits service access" ON user_token_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);
