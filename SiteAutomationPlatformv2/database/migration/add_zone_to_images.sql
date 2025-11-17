-- Migration: Add zone support to image_sql table
-- This allows images to be associated with specific zone-based equipment cards
-- Example: "Clim::bureau" or "Aero::surface_de_vente"

-- Add zone_name column to image_sql
ALTER TABLE image_sql
ADD COLUMN zone_name VARCHAR(100) DEFAULT NULL
COMMENT 'Zone identifier for equipment images (e.g., surface_de_vente, bureau)'
AFTER type;

-- Add index for faster lookups by site, type, and zone
CREATE INDEX idx_site_type_zone ON image_sql(site, type, zone_name);

-- Update existing records to have NULL zone (backward compatible)
-- Existing images without zones will work with legacy format

-- Migration complete
SELECT 'Zone support added to image_sql table' AS status;
