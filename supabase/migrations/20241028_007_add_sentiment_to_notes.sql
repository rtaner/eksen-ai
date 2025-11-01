-- Add sentiment column to notes table
ALTER TABLE notes 
ADD COLUMN sentiment TEXT 
CHECK (sentiment IN ('positive', 'negative', 'neutral')) 
DEFAULT 'neutral';

-- Add index for faster filtering
CREATE INDEX idx_notes_sentiment ON notes(sentiment);

-- Update existing notes to have neutral sentiment
UPDATE notes SET sentiment = 'neutral' WHERE sentiment IS NULL;
