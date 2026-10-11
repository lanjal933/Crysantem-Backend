-- ============================================
-- MIGRACIÓN PARA TABLAS MYIA EXISTENTES
-- Agrega columnas faltantes a tablas existentes
-- ============================================

-- Agregar columnas faltantes a myia_page_config
DO $$
BEGIN
  -- Verificar y agregar columnas si no existen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'plan'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN plan TEXT DEFAULT 'basic';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'social_links'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'ai_model'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN ai_model TEXT DEFAULT 'gemini-flash';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'character_limit'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN character_limit INTEGER DEFAULT 50000;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'character_usage'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN character_usage INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'chat_position'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN chat_position TEXT DEFAULT 'right';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'border_radius'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN border_radius TEXT DEFAULT 'rounded';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'header_theme'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN header_theme TEXT DEFAULT 'dark';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'page_design'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN page_design TEXT DEFAULT 'design1';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'background_gradient'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN background_gradient TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'glow_color'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN glow_color TEXT DEFAULT '#00ff8c';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'title_font'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN title_font TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'chat_box_design'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN chat_box_design TEXT DEFAULT 'modern';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'show_footer'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN show_footer BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN is_active BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'split_image'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN split_image TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'split_text'
  ) THEN
    ALTER TABLE myia_page_config ADD COLUMN split_text TEXT;
  END IF;

  -- Crear índices si no existen
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_myia_page_config_plan'
  ) THEN
    CREATE INDEX idx_myia_page_config_plan ON myia_page_config(plan);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_myia_page_config_is_active'
  ) THEN
    CREATE INDEX idx_myia_page_config_is_active ON myia_page_config(is_active);
  END IF;

END $$;

-- Agregar columna scopes a myia_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_users' AND column_name = 'scopes'
  ) THEN
    ALTER TABLE myia_users ADD COLUMN scopes TEXT[] DEFAULT ARRAY['email', 'profile'];
  END IF;
END $$;

-- Verificar estructura final
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'myia_page_config'
ORDER BY ordinal_position;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'myia_users'
ORDER BY ordinal_position;

-- Forzar actualización de estadísticas y cache
ANALYZE myia_page_config;
ANALYZE myia_users;

-- Limpiar cache de planificación
DISCARD PLANS;

-- Verificar que glow_color existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'myia_page_config' AND column_name = 'glow_color'
  ) THEN
    RAISE NOTICE 'Columna glow_color existe correctamente';
  ELSE
    RAISE NOTICE 'Columna glow_color NO existe - algo salió mal';
  END IF;
END $$;
