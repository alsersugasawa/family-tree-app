-- Migration: Add tree_views table
-- Created: 2026-01-19
-- Description: Adds support for multiple saved tree views per user

CREATE TABLE IF NOT EXISTS tree_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    node_positions JSONB,
    filter_settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_tree_views_user_id ON tree_views(user_id);
CREATE INDEX idx_tree_views_is_default ON tree_views(is_default);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tree_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tree_views_updated_at
BEFORE UPDATE ON tree_views
FOR EACH ROW
EXECUTE FUNCTION update_tree_views_updated_at();
