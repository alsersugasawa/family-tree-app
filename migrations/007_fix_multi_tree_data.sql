-- Migration 007: Fix Multi-Tree Data Issues
-- This migration fixes NULL timestamps and orphaned members from the multi-tree migration

-- Fix NULL created_at and updated_at for any trees that don't have them
UPDATE family_trees
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

-- For each user, assign orphaned members (tree_id = NULL) to their default tree
-- If no default tree exists, use the first tree
UPDATE family_members fm
SET tree_id = (
    SELECT COALESCE(
        (SELECT id FROM family_trees WHERE user_id = fm.user_id AND is_default = TRUE LIMIT 1),
        (SELECT id FROM family_trees WHERE user_id = fm.user_id ORDER BY id LIMIT 1)
    )
)
WHERE fm.tree_id IS NULL
AND EXISTS (SELECT 1 FROM family_trees WHERE user_id = fm.user_id);

-- Delete any empty trees (trees with no members) that are not the default tree
-- This cleans up duplicate trees that may have been created by errors
DELETE FROM family_trees ft
WHERE NOT EXISTS (
    SELECT 1 FROM family_members WHERE tree_id = ft.id
)
AND ft.is_default = FALSE;

-- Verify: Show summary of trees per user
SELECT
    u.username,
    ft.id as tree_id,
    ft.name as tree_name,
    ft.is_default,
    COUNT(fm.id) as member_count,
    ft.created_at
FROM users u
LEFT JOIN family_trees ft ON u.id = ft.user_id
LEFT JOIN family_members fm ON ft.id = fm.tree_id
GROUP BY u.username, ft.id, ft.name, ft.is_default, ft.created_at
ORDER BY u.username, ft.id;
