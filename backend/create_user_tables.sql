-- ============================================
-- TABLA DE USUARIOS PARA MYIA
-- Simple y directo
-- ============================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS myia_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  refresh_token TEXT, -- Token de refresh de Supabase
  google_id TEXT, -- ID de Google OAuth
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_myia_users_email ON myia_users(email);

-- ============================================
-- TABLA DE CONFIGURACIÓN DE PÁGINA IA
-- Almacena la configuración visual de cada usuario
-- ============================================

CREATE TABLE IF NOT EXISTS myia_page_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES myia_users(id) ON DELETE CASCADE,
  business_name TEXT,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  logo_size INTEGER DEFAULT 100,
  background_type TEXT DEFAULT 'solid', -- solid, gradient, glow
  background_color TEXT DEFAULT '#050505',
  background_gradient TEXT,
  font_family TEXT DEFAULT 'Inter',
  title_font TEXT,
  chat_box_design TEXT DEFAULT 'modern', -- modern, classic, minimal, neon, glass
  chat_box_color TEXT DEFAULT '#00ff8c',
  chat_position TEXT DEFAULT 'right', -- right, left
  border_radius TEXT DEFAULT 'rounded', -- rounded, sharp, pill
  header_theme TEXT DEFAULT 'dark', -- dark, light
  page_design TEXT DEFAULT 'design1', -- design1, design2, design3, design4, design5
  welcome_message TEXT DEFAULT 'Hola, ¿en qué puedo ayudarte?',
  system_prompt TEXT,
  ai_model TEXT DEFAULT 'gemini-flash', -- gemini-flash, gemini-pro
  character_limit INTEGER DEFAULT 50000,
  character_usage INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'basic', -- basic, professional, business, enterprise
  social_links JSONB DEFAULT '{}'::jsonb, -- {facebook, instagram, linkedin, twitter}
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_myia_page_config_user_id ON myia_page_config(user_id);
CREATE INDEX IF NOT EXISTS idx_myia_page_config_slug ON myia_page_config(slug);
CREATE INDEX IF NOT EXISTS idx_myia_page_config_is_active ON myia_page_config(is_active);
CREATE INDEX IF NOT EXISTS idx_myia_page_config_plan ON myia_page_config(plan);

-- ============================================
-- FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_myia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_myia_users_updated_at ON myia_users;
CREATE TRIGGER update_myia_users_updated_at
  BEFORE UPDATE ON myia_users
  FOR EACH ROW
  EXECUTE FUNCTION update_myia_updated_at();

DROP TRIGGER IF EXISTS update_myia_page_config_updated_at ON myia_page_config;
CREATE TRIGGER update_myia_page_config_updated_at
  BEFORE UPDATE ON myia_page_config
  FOR EACH ROW
  EXECUTE FUNCTION update_myia_updated_at();
