-- Add zone_eclairage column to equipment_lighting table
-- Migration: 09_add_zone_eclairage.sql
-- Date: 2025-01-16
-- Description: Adds zone support to equipment_lighting table (was missing)

-- Add zone_eclairage column
ALTER TABLE equipment_lighting
ADD COLUMN IF NOT EXISTS zone_eclairage VARCHAR(100) DEFAULT NULL COMMENT 'Zone de l\'équipement éclairage' AFTER site_name;

-- Update existing rows to have a default zone (if any exist without zone)
UPDATE equipment_lighting
SET zone_eclairage = 'surface_de_vente'
WHERE zone_eclairage IS NULL;

-- Verify the change
SELECT 'Migration 09 completed - zone_eclairage added to equipment_lighting' AS status;

-- Show updated table structure
SHOW COLUMNS FROM equipment_lighting;
