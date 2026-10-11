-- Migración para renombrar "tokens" a "mensajes" en la base de datos
-- Ejecutar en Supabase SQL Editor

-- Renombrar tabla user_token_limits a user_message_limits
ALTER TABLE user_token_limits RENAME TO user_message_limits;

-- Renombrar columnas
ALTER TABLE user_message_limits RENAME COLUMN monthly_limit TO monthly_message_limit;
ALTER TABLE user_message_limits RENAME COLUMN tokens_used TO messages_used;

-- Actualizar comentarios
COMMENT ON TABLE user_message_limits IS 'Límites de uso de mensajes por usuario';
COMMENT ON COLUMN user_message_limits.monthly_message_limit IS 'Límite mensual de mensajes';
COMMENT ON COLUMN user_message_limits.messages_used IS 'Mensajes usados en el mes actual';

-- Actualizar índices (los índices se renombran automáticamente al renombrar la tabla, pero actualizamos los comentarios)
DROP INDEX IF EXISTS idx_user_token_limits_email;
DROP INDEX IF EXISTS idx_user_token_limits_month_year;
CREATE INDEX IF NOT EXISTS idx_user_message_limits_email ON user_message_limits(email);
CREATE INDEX IF NOT EXISTS idx_user_message_limits_month_year ON user_message_limits(current_month, current_year);

-- Actualizar triggers
DROP TRIGGER IF EXISTS update_user_token_limits_updated_at ON user_message_limits;
CREATE TRIGGER update_user_message_limits_updated_at
  BEFORE UPDATE ON user_message_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Actualizar políticas RLS
DROP POLICY IF EXISTS "Token limits service access" ON user_message_limits;
CREATE POLICY "Message limits service access" ON user_message_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);
