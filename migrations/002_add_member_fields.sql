-- Migration: Add additional fields to family_members
-- Created: 2026-01-19
-- Description: Adds middle_name, nickname, location, and country fields

-- Add middle_name column
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);

-- Add nickname column
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);

-- Add location column (current residence)
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Add country column
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS country VARCHAR(100);
