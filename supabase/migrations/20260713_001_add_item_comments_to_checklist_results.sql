-- Add item_comments column to checklist_results table
ALTER TABLE checklist_results ADD COLUMN IF NOT EXISTS item_comments JSONB DEFAULT '{}'::jsonb;
COMMENT ON COLUMN checklist_results.item_comments IS 'Optional comments for each item in the checklist mapping itemId to comment string';
