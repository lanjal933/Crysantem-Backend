-- Tabla para estadísticas de páginas MyIA
-- Rastrea métricas de uso, interacciones y rendimiento

CREATE TABLE IF NOT EXISTS myia_page_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES myia_page_config(id) ON DELETE CASCADE,
  total_messages INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  avg_response_time DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stats_date DATE DEFAULT CURRENT_DATE
);

-- Tabla para rastrear mensajes individuales
CREATE TABLE IF NOT EXISTS myia_message_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES myia_page_config(id) ON DELETE CASCADE,
  user_id TEXT,
  message_type TEXT CHECK (message_type IN ('user', 'ai')),
  message_text TEXT,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para rastrear sesiones de usuarios
CREATE TABLE IF NOT EXISTS myia_user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES myia_page_config(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  first_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  user_agent TEXT,
  referrer TEXT
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_page_stats_page_id ON myia_page_stats(page_id);
CREATE INDEX IF NOT EXISTS idx_page_stats_date ON myia_page_stats(stats_date);
CREATE INDEX IF NOT EXISTS idx_message_logs_page_id ON myia_message_logs(page_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON myia_message_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_page_id ON myia_user_sessions(page_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON myia_user_sessions(session_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_page_stats_updated_at
  BEFORE UPDATE ON myia_page_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
