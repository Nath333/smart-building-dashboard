-- Add zone_rooftop column to rooftop_brands table
-- Date: 2025-10-14
-- Purpose: Track which zone each rooftop brand belongs to

USE avancement2;

-- Add zone_rooftop column if it doesn't exist
ALTER TABLE rooftop_brands
ADD COLUMN IF NOT EXISTS zone_rooftop VARCHAR(255) AFTER site_name;

-- Update the unique constraint to include zone
ALTER TABLE rooftop_brands
DROP INDEX IF EXISTS unique_site_brand;

ALTER TABLE rooftop_brands
ADD UNIQUE KEY unique_site_zone_brand (site_name, zone_rooftop, brand_index);

SELECT '✅ Migration complete - zone_rooftop column added to rooftop_brands' AS status;
