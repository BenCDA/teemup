-- Add unique constraint for private conversations
-- This prevents duplicate private conversations between the same two users

-- Create a function to generate a canonical participant key for private conversations
-- The key is created by sorting the two participant UUIDs to ensure consistency
CREATE OR REPLACE FUNCTION get_private_conversation_key(conv_id UUID)
RETURNS TEXT AS $$
DECLARE
    participant_key TEXT;
BEGIN
    SELECT string_agg(user_id::text, ',' ORDER BY user_id)
    INTO participant_key
    FROM conversation_participants
    WHERE conversation_id = conv_id;
    RETURN participant_key;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a computed column to store the participant key for private conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS private_participant_key TEXT;

-- Populate the key for existing private conversations
UPDATE conversations c
SET private_participant_key = (
    SELECT string_agg(cp.user_id::text, ',' ORDER BY cp.user_id)
    FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
)
WHERE c.type = 'PRIVATE';

-- Create a unique partial index for private conversations
-- This ensures no duplicate private conversations between the same two users
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_private_conversation
ON conversations (private_participant_key)
WHERE type = 'PRIVATE' AND private_participant_key IS NOT NULL;

-- Create a trigger to automatically set the participant key when participants are added
CREATE OR REPLACE FUNCTION update_private_conversation_key()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the conversation's participant key if it's a private conversation
    UPDATE conversations c
    SET private_participant_key = (
        SELECT string_agg(cp.user_id::text, ',' ORDER BY cp.user_id)
        FROM conversation_participants cp
        WHERE cp.conversation_id = c.id
    )
    WHERE c.id = NEW.conversation_id
    AND c.type = 'PRIVATE';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_private_conversation_key ON conversation_participants;

CREATE TRIGGER trg_update_private_conversation_key
AFTER INSERT ON conversation_participants
FOR EACH ROW
EXECUTE FUNCTION update_private_conversation_key();
