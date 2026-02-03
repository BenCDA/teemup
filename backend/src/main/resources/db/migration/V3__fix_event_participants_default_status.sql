-- Fix default status for event_participants table
-- Change default from CONFIRMED to PENDING for private events workflow

-- Update the default value for new participants
ALTER TABLE event_participants
ALTER COLUMN status SET DEFAULT 'PENDING';

-- Note: Existing CONFIRMED participants remain as-is
-- Only new participants for private events will start as PENDING
