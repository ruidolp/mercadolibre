-- db/migrations/003_nullable_refresh_token.sql
-- ML no siempre retorna refresh_token (requiere offline_access en el Dev Center)
ALTER TABLE ml_tokens
  ALTER COLUMN refresh_token DROP NOT NULL;
