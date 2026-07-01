-- db/migrations/001_initial.sql
-- Initial schema for MercadoLibre OAuth integration

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ml_apps: registered MercadoLibre developer applications
-- ============================================================
CREATE TABLE IF NOT EXISTS ml_apps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  client_id    TEXT NOT NULL UNIQUE,
  client_secret TEXT NOT NULL,
  redirect_uri      TEXT NOT NULL,
  notifications_url TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ml_tokens: OAuth tokens per (app, ML user) pair
-- ============================================================
CREATE TABLE IF NOT EXISTS ml_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        UUID NOT NULL REFERENCES ml_apps(id) ON DELETE CASCADE,
  ml_user_id    TEXT NOT NULL,
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type    TEXT NOT NULL DEFAULT 'bearer',
  expires_in    INTEGER NOT NULL,           -- seconds until expiry
  expires_at    TIMESTAMPTZ NOT NULL,       -- absolute expiry timestamp
  scope         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One token record per (app, ML user) pair
  CONSTRAINT ml_tokens_app_user_unique UNIQUE (app_id, ml_user_id)
);

-- Index for quickly fetching tokens by app
CREATE INDEX IF NOT EXISTS ml_tokens_app_id_idx ON ml_tokens(app_id);

-- Index for checking expiry status
CREATE INDEX IF NOT EXISTS ml_tokens_expires_at_idx ON ml_tokens(expires_at);

-- ============================================================
-- updated_at auto-update trigger (optional, for convenience)
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_ml_apps ON ml_apps;
CREATE TRIGGER set_updated_at_ml_apps
  BEFORE UPDATE ON ml_apps
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_ml_tokens ON ml_tokens;
CREATE TRIGGER set_updated_at_ml_tokens
  BEFORE UPDATE ON ml_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
