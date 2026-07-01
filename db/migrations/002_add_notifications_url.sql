-- db/migrations/002_add_notifications_url.sql
-- Agrega notifications_url a ml_apps para el webhook de ML

ALTER TABLE ml_apps
  ADD COLUMN IF NOT EXISTS notifications_url TEXT;
