-- V4: Add Pro user support and paid events functionality
-- Using IF NOT EXISTS to be idempotent (safe to run on existing databases)

-- Add is_pro column to users table (for Pro account users who can create paid events)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT false;

-- Add paid event columns to sport_events table
ALTER TABLE sport_events ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE sport_events ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION;

-- Index for filtering paid events
CREATE INDEX IF NOT EXISTS idx_sport_events_is_paid ON sport_events(is_paid);

-- Index for filtering Pro users
CREATE INDEX IF NOT EXISTS idx_users_is_pro ON users(is_pro);
