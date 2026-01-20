-- Migration 005: Add thumbnail to tree_views
-- Add thumbnail field to store base64 encoded image snapshot

ALTER TABLE tree_views ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Add comment
COMMENT ON COLUMN tree_views.thumbnail IS 'Base64 encoded PNG thumbnail of the tree view';
