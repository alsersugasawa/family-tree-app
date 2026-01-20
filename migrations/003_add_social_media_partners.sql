-- Migration: Add social_media and previous_partners fields
-- Created: 2026-01-19
-- Description: Adds social media links and previous partners information

-- Add social_media column (JSON)
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS social_media JSONB;

-- Add previous_partners column (Text)
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS previous_partners TEXT;
