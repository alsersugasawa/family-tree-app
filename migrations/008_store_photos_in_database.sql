-- Migration 008: Store Profile Pictures in Database
-- This migration adds a column to store profile pictures as base64-encoded data in the database
-- instead of storing them in the file system.

-- Add profile_picture_data column to family_members table
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS profile_picture_data TEXT;

-- Add profile_picture_mime_type column to store the image type
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS profile_picture_mime_type VARCHAR(50);

-- Note: We're keeping photo_url column for backward compatibility
-- It can be deprecated in a future version after migration is complete
-- For now, we'll use profile_picture_data as the primary storage
