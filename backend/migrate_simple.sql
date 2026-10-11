-- MIGRACIÓN SIMPLE Y DIRECTA
-- Ejecutar esto en el SQL Editor de Supabase

-- Columnas requeridas para MyIA
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'basic';
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini-flash';
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS character_limit INTEGER DEFAULT 50000;
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS character_usage INTEGER DEFAULT 0;
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS chat_position TEXT DEFAULT 'right';
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS border_radius TEXT DEFAULT 'rounded';
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS header_theme TEXT DEFAULT 'dark';
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS page_design TEXT DEFAULT 'centered';
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS background_gradient TEXT;
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS glow_color TEXT DEFAULT '#00ff8c';
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS title_font TEXT;
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS chat_box_design TEXT DEFAULT 'modern';
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS show_footer BOOLEAN DEFAULT true;
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS split_image TEXT;
ALTER TABLE myia_page_config ADD COLUMN IF NOT EXISTS split_text TEXT;

-- Actualizar cache
ANALYZE myia_page_config;
