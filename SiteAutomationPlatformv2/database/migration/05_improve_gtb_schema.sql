-- =====================================================
-- GTB Schema Improvement Migration
-- =====================================================
-- Purpose: Fix redundancy and add proper devis isolation
-- Date: 2025-10-16
-- Impact: BREAKING - Requires DAL code update
-- =====================================================

-- =====================================================
-- PHASE 1: ADD NEW STRUCTURES
-- =====================================================

-- 1.1: Add devis_name to gtb_module_references (if not exists)
ALTER TABLE gtb_module_references
ADD COLUMN IF NOT EXISTS devis_name VARCHAR(100) DEFAULT 'Devis Principal' AFTER site_name;

-- 1.2: Create gtb_sensors table (centralized sensor storage)
CREATE TABLE IF NOT EXISTS gtb_sensors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(100) NOT NULL,
  devis_name VARCHAR(100) NOT NULL DEFAULT 'Devis Principal',

  -- Temperature sensors
  sondes_count INT DEFAULT 0,
  sondes_refs TEXT,  -- JSON array: ["pi33", "pi33", "pi33"]

  -- Presence sensors
  sondes_presentes_count INT DEFAULT 0,
  sondes_presentes_refs TEXT,  -- JSON array: ["wt101", "wt101"]

  -- Gas meter
  gaz_compteur BOOLEAN DEFAULT FALSE,
  gaz_compteur_ref VARCHAR(100),

  -- Cabinets/Izit
  izit_count INT DEFAULT 0,
  izit_types TEXT,  -- JSON array: ["coffret gtb(asp/do12/routeur/ug65)", "isma"]

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_sensors (site_name, devis_name),
  FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE,
  INDEX idx_sensors_site_devis (site_name, devis_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHASE 2: MIGRATE EXISTING DATA
-- =====================================================

-- 2.1: Populate gtb_sensors from gtb_modules
-- Extract sensor data (currently duplicated in every module row)
INSERT INTO gtb_sensors (
  site_name, devis_name,
  sondes_count, sondes_refs,
  sondes_presentes_count, sondes_presentes_refs,
  gaz_compteur, gaz_compteur_ref,
  izit_count
)
SELECT DISTINCT
  site_name,
  devis_name,
  COALESCE(sondes, 0) as sondes_count,
  CASE
    WHEN ref_sondes IS NOT NULL AND ref_sondes != ''
    THEN JSON_ARRAY(ref_sondes)
    ELSE JSON_ARRAY()
  END as sondes_refs,
  COALESCE(sondes_presentes, 0) as sondes_presentes_count,
  CASE
    WHEN ref_sondes_presentes IS NOT NULL AND ref_sondes_presentes != ''
    THEN JSON_ARRAY(ref_sondes_presentes)
    ELSE JSON_ARRAY()
  END as sondes_presentes_refs,
  COALESCE(gaz_compteur, 0) as gaz_compteur,
  ref_gaz_compteur,
  COALESCE(izit, 0) as izit_count
FROM gtb_modules
WHERE site_name IS NOT NULL
GROUP BY site_name, devis_name
ON DUPLICATE KEY UPDATE
  sondes_count = VALUES(sondes_count),
  sondes_presentes_count = VALUES(sondes_presentes_count),
  gaz_compteur = VALUES(gaz_compteur),
  izit_count = VALUES(izit_count);

-- 2.2: Update gtb_module_references to link with devis
-- Match references to their corresponding devis
UPDATE gtb_module_references gmr
JOIN (
  SELECT DISTINCT site_name, module_type, devis_name
  FROM gtb_modules
) gm ON gmr.site_name = gm.site_name AND gmr.module_type = gm.module_type
SET gmr.devis_name = gm.devis_name
WHERE gmr.devis_name = 'Devis Principal';

-- =====================================================
-- PHASE 3: UPDATE CONSTRAINTS
-- =====================================================

-- 3.1: Drop old unique constraint on gtb_module_references
ALTER TABLE gtb_module_references
DROP INDEX IF EXISTS unique_ref;

-- 3.2: Add new devis-aware unique constraint
ALTER TABLE gtb_module_references
ADD UNIQUE KEY unique_ref_devis (site_name, devis_name, module_type, ref_index);

-- =====================================================
-- PHASE 4: CLEANUP (OPTIONAL - Run after DAL update)
-- =====================================================
-- ⚠️ WARNING: Only run this after updating gtbConfigDAL.js
-- ⚠️ These columns will be removed from gtb_modules

-- UNCOMMENT WHEN READY:
/*
ALTER TABLE gtb_modules
DROP COLUMN refs,
DROP COLUMN sondes,
DROP COLUMN sondes_presentes,
DROP COLUMN gaz_compteur,
DROP COLUMN izit,
DROP COLUMN ref_sondes,
DROP COLUMN ref_sondes_presentes,
DROP COLUMN ref_gaz_compteur;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check sensor migration
SELECT
  'gtb_sensors' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT site_name) as unique_sites,
  COUNT(DISTINCT CONCAT(site_name, '::', devis_name)) as unique_site_devis
FROM gtb_sensors;

-- Check reference devis linkage
SELECT
  'gtb_module_references' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT devis_name) as unique_devis,
  COUNT(DISTINCT CONCAT(site_name, '::', devis_name)) as unique_site_devis
FROM gtb_module_references;

-- Check for orphaned references (references without matching modules)
SELECT gmr.*
FROM gtb_module_references gmr
LEFT JOIN gtb_modules gm
  ON gmr.site_name = gm.site_name
  AND gmr.devis_name = gm.devis_name
  AND gmr.module_type = gm.module_type
WHERE gm.id IS NULL;

-- =====================================================
-- ROLLBACK SCRIPT (In case of issues)
-- =====================================================

/*
-- Restore original state:

-- Drop gtb_sensors table
DROP TABLE IF EXISTS gtb_sensors;

-- Reset devis_name in gtb_module_references
UPDATE gtb_module_references
SET devis_name = 'Devis Principal';

-- Restore old unique constraint
ALTER TABLE gtb_module_references
DROP INDEX IF EXISTS unique_ref_devis;

ALTER TABLE gtb_module_references
ADD UNIQUE KEY unique_ref (site_name, module_type, ref_index);
*/
