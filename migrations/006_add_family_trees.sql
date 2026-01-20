-- Migration 006: Add Family Trees and Sharing Support
-- Add support for multiple family trees per user and tree sharing

-- Create family_trees table
CREATE TABLE IF NOT EXISTS family_trees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tree_shares table
CREATE TABLE IF NOT EXISTS tree_shares (
    id SERIAL PRIMARY KEY,
    tree_id INTEGER NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
    shared_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'view',
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add tree_id column to family_members table
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS tree_id INTEGER REFERENCES family_trees(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_trees_user_id ON family_trees(user_id);
CREATE INDEX IF NOT EXISTS idx_family_trees_is_default ON family_trees(is_default);
CREATE INDEX IF NOT EXISTS idx_tree_shares_tree_id ON tree_shares(tree_id);
CREATE INDEX IF NOT EXISTS idx_tree_shares_shared_with ON tree_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_tree_id ON family_members(tree_id);

-- Add comments
COMMENT ON TABLE family_trees IS 'Stores multiple family trees per user';
COMMENT ON TABLE tree_shares IS 'Manages sharing of family trees between users';
COMMENT ON COLUMN family_members.tree_id IS 'Links family member to a specific family tree';
COMMENT ON COLUMN tree_shares.permission_level IS 'Permission level: view or edit';
COMMENT ON COLUMN tree_shares.is_accepted IS 'Whether the share invitation has been accepted';

-- Create a default tree for existing users with family members
INSERT INTO family_trees (user_id, name, description, is_default, is_active)
SELECT DISTINCT user_id, 'My Family Tree', 'Default family tree', TRUE, TRUE
FROM family_members
WHERE user_id NOT IN (SELECT user_id FROM family_trees)
ON CONFLICT DO NOTHING;

-- Link existing family members to their user's default tree
UPDATE family_members fm
SET tree_id = (
    SELECT ft.id
    FROM family_trees ft
    WHERE ft.user_id = fm.user_id AND ft.is_default = TRUE
    LIMIT 1
)
WHERE fm.tree_id IS NULL;
