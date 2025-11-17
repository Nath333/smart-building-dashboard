/**
 * Migration: Add Zone Support to Equipment Tables
 *
 * Purpose: Enable multiple zone-based equipment entries per site
 * Date: 2025-10-14
 *
 * Changes:
 * 1. Add 'zone' column to all equipment tables
 * 2. Update primary keys to (site_name, zone)
 * 3. Migrate existing single-zone data to default zone
 */

-- ========================================
-- AEROTHERME ZONE SUPPORT
-- ========================================

-- Step 1: Add zone column (nullable for migration)
ALTER TABLE equipment_aerotherme
ADD COLUMN zone VARCHAR(50) NULL AFTER site_name;

-- Step 2: Set default zone for existing data
UPDATE equipment_aerotherme
SET zone = 'surface_de_vente'
WHERE zone IS NULL;

-- Step 3: Make zone NOT NULL and drop old primary key
ALTER TABLE equipment_aerotherme
MODIFY COLUMN zone VARCHAR(50) NOT NULL,
DROP PRIMARY KEY,
ADD PRIMARY KEY (site_name, zone);

-- ========================================
-- ROOFTOP ZONE SUPPORT
-- ========================================

ALTER TABLE equipment_rooftop
ADD COLUMN zone VARCHAR(50) NULL AFTER site_name;

UPDATE equipment_rooftop
SET zone = 'surface_de_vente'
WHERE zone IS NULL;

ALTER TABLE equipment_rooftop
MODIFY COLUMN zone VARCHAR(50) NOT NULL,
DROP PRIMARY KEY,
ADD PRIMARY KEY (site_name, zone);

-- ========================================
-- CLIMATE ZONE SUPPORT
-- ========================================

ALTER TABLE equipment_climate
ADD COLUMN zone VARCHAR(50) NULL AFTER site_name;

UPDATE equipment_climate
SET zone = 'surface_de_vente'
WHERE zone IS NULL;

ALTER TABLE equipment_climate
MODIFY COLUMN zone VARCHAR(50) NOT NULL,
DROP PRIMARY KEY,
ADD PRIMARY KEY (site_name, zone);

-- ========================================
-- LIGHTING ZONE SUPPORT
-- ========================================

ALTER TABLE equipment_lighting
ADD COLUMN zone VARCHAR(50) NULL AFTER site_name;

UPDATE equipment_lighting
SET zone = 'surface_de_vente'
WHERE zone IS NULL;

ALTER TABLE equipment_lighting
MODIFY COLUMN zone VARCHAR(50) NOT NULL,
DROP PRIMARY KEY,
ADD PRIMARY KEY (site_name, zone);

-- ========================================
-- UPDATE BRAND/REFERENCE TABLES
-- ========================================

-- Aerotherme brands now need zone support
ALTER TABLE aerotherme_brands
ADD COLUMN zone VARCHAR(50) NULL AFTER site_name;

UPDATE aerotherme_brands
SET zone = 'surface_de_vente'
WHERE zone IS NULL;

ALTER TABLE aerotherme_brands
MODIFY COLUMN zone VARCHAR(50) NOT NULL;

-- Drop old primary key and create new composite key
ALTER TABLE aerotherme_brands
DROP PRIMARY KEY,
ADD PRIMARY KEY (site_name, zone, brand_index);

-- Rooftop brands
ALTER TABLE rooftop_brands
ADD COLUMN zone VARCHAR(50) NULL AFTER site_name;

UPDATE rooftop_brands
SET zone = 'surface_de_vente'
WHERE zone IS NULL;

ALTER TABLE rooftop_brands
MODIFY COLUMN zone VARCHAR(50) NOT NULL,
DROP PRIMARY KEY,
ADD PRIMARY KEY (site_name, zone, brand_index);

-- Climate references
ALTER TABLE climate_references
ADD COLUMN zone VARCHAR(50) NULL AFTER site_name;

UPDATE climate_references
SET zone = 'surface_de_vente'
WHERE zone IS NULL;

ALTER TABLE climate_references
MODIFY COLUMN zone VARCHAR(50) NOT NULL,
DROP PRIMARY KEY,
ADD PRIMARY KEY (site_name, zone, ref_type, ref_index);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check that all tables now have zone column
SELECT
  'equipment_aerotherme' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT zone) as unique_zones
FROM equipment_aerotherme
UNION ALL
SELECT
  'equipment_rooftop',
  COUNT(*),
  COUNT(DISTINCT zone)
FROM equipment_rooftop
UNION ALL
SELECT
  'equipment_climate',
  COUNT(*),
  COUNT(DISTINCT zone)
FROM equipment_climate
UNION ALL
SELECT
  'equipment_lighting',
  COUNT(*),
  COUNT(DISTINCT zone)
FROM equipment_lighting;
