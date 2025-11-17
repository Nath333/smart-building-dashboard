-- =====================================================
-- GTB Schema - FINAL OPTIMIZATION (JSON-Based)
-- =====================================================
-- Purpose: Ultimate clean schema using JSON for references
-- Fixes: Izit cabinet mapping, eliminates all redundancy
-- Date: 2025-10-16
-- Impact: BREAKING - Complete redesign
-- =====================================================

-- =====================================================
-- BACKUP EXISTING DATA
-- =====================================================

-- Create backup tables
CREATE TABLE IF NOT EXISTS gtb_modules_backup_20251016 AS SELECT * FROM gtb_modules;
CREATE TABLE IF NOT EXISTS gtb_module_references_backup_20251016 AS SELECT * FROM gtb_module_references;

-- =====================================================
-- DROP OLD STRUCTURES
-- =====================================================

DROP TABLE IF EXISTS gtb_module_references;
DROP TABLE IF EXISTS gtb_modules;
DROP TABLE IF EXISTS gtb_sensors;

-- =====================================================
-- CREATE NEW OPTIMIZED SCHEMA
-- =====================================================

-- 1️⃣ GTB Modules (with JSON references)
CREATE TABLE gtb_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(100) NOT NULL,
  devis_name VARCHAR(100) NOT NULL DEFAULT 'Devis Principal',
  module_type VARCHAR(100) NOT NULL COMMENT 'Module type: clim_ir, aeroeau, rooftop, etc.',
  quantity INT NOT NULL DEFAULT 0 COMMENT 'Number of modules',
  references JSON COMMENT 'Array of references: ["aidoo pro", "aidoo pro", ...]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_module (site_name, devis_name, module_type),
  FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE,
  INDEX idx_site_devis (site_name, devis_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GTB module configuration with JSON references';

-- 2️⃣ GTB Sensors (with JSON references and Izit mapping)
CREATE TABLE gtb_sensors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(100) NOT NULL,
  devis_name VARCHAR(100) NOT NULL DEFAULT 'Devis Principal',

  -- Temperature sensors
  sondes_count INT DEFAULT 0 COMMENT 'Number of temperature sensors',
  sondes_refs JSON COMMENT 'Array of sensor references: ["pi33", "pi33", ...]',

  -- Presence sensors
  sondes_presentes_count INT DEFAULT 0 COMMENT 'Number of presence sensors',
  sondes_presentes_refs JSON COMMENT 'Array of presence sensor references: ["wt101", ...]',

  -- Gas meter
  gaz_compteur BOOLEAN DEFAULT FALSE COMMENT 'Gas meter added: true/false',
  gaz_compteur_ref VARCHAR(100) COMMENT 'Gas meter reference (single value)',

  -- Izit cabinets (JSON object preserves type-to-ref mapping)
  izit_cabinets JSON COMMENT 'Object mapping cabinet types to refs: {"coffret gtb(...)": "234543FRR", "isma": "55"}',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_sensors (site_name, devis_name),
  FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE,
  INDEX idx_site_devis (site_name, devis_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GTB sensors and special configurations with JSON data';

-- =====================================================
-- MIGRATE DATA FROM BACKUP
-- =====================================================

-- Migrate modules with refs as JSON arrays
INSERT INTO gtb_modules (site_name, devis_name, module_type, quantity, references)
SELECT
  site_name,
  devis_name,
  module_type,
  quantity,
  -- Convert comma-separated refs to JSON array
  CASE
    WHEN refs IS NOT NULL AND refs != ''
    THEN JSON_ARRAY(refs)  -- Temporary: stores as single item, will need manual fix
    ELSE JSON_ARRAY()
  END as references
FROM gtb_modules_backup_20251016
WHERE devis_name IS NOT NULL
ON DUPLICATE KEY UPDATE
  quantity = VALUES(quantity),
  references = VALUES(references);

-- Migrate sensors (extract from first module row per site+devis)
INSERT INTO gtb_sensors (
  site_name,
  devis_name,
  sondes_count,
  sondes_refs,
  sondes_presentes_count,
  sondes_presentes_refs,
  gaz_compteur,
  gaz_compteur_ref,
  izit_cabinets
)
SELECT DISTINCT
  site_name,
  devis_name,
  COALESCE(sondes, 0),
  CASE
    WHEN ref_sondes IS NOT NULL AND ref_sondes != ''
    THEN JSON_ARRAY(ref_sondes)
    ELSE JSON_ARRAY()
  END,
  COALESCE(sondes_presentes, 0),
  CASE
    WHEN ref_sondes_presentes IS NOT NULL AND ref_sondes_presentes != ''
    THEN JSON_ARRAY(ref_sondes_presentes)
    ELSE JSON_ARRAY()
  END,
  COALESCE(gaz_compteur, 0),
  ref_gaz_compteur,
  JSON_OBJECT()  -- Empty object for now, needs manual migration
FROM gtb_modules_backup_20251016
WHERE site_name IS NOT NULL
GROUP BY site_name, devis_name
ON DUPLICATE KEY UPDATE
  sondes_count = VALUES(sondes_count),
  sondes_presentes_count = VALUES(sondes_presentes_count),
  gaz_compteur = VALUES(gaz_compteur);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check modules migration
SELECT
  'gtb_modules' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT site_name) as unique_sites,
  COUNT(DISTINCT CONCAT(site_name, '::', devis_name)) as unique_configs
FROM gtb_modules;

-- Check sensors migration
SELECT
  'gtb_sensors' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT site_name) as unique_sites,
  COUNT(DISTINCT CONCAT(site_name, '::', devis_name)) as unique_configs
FROM gtb_sensors;

-- Sample module data
SELECT site_name, devis_name, module_type, quantity,
       JSON_LENGTH(references) as ref_count,
       JSON_EXTRACT(references, '$[0]') as first_ref
FROM gtb_modules
LIMIT 5;

-- Sample sensor data
SELECT site_name, devis_name,
       sondes_count, JSON_LENGTH(sondes_refs) as sondes_ref_count,
       sondes_presentes_count, JSON_LENGTH(sondes_presentes_refs) as presentes_ref_count,
       gaz_compteur, gaz_compteur_ref,
       izit_cabinets
FROM gtb_sensors
LIMIT 5;

-- =====================================================
-- EXAMPLE: How to query JSON data
-- =====================================================

-- Get all modules for a site+devis
SELECT module_type, quantity, references
FROM gtb_modules
WHERE site_name = 'Site ABC' AND devis_name = 'Devis Principal';

-- Get first reference for a module
SELECT
  module_type,
  JSON_UNQUOTE(JSON_EXTRACT(references, '$[0]')) as first_ref
FROM gtb_modules
WHERE site_name = 'Site ABC';

-- Get all Izit cabinet types for a site
SELECT
  site_name,
  JSON_KEYS(izit_cabinets) as cabinet_types,
  izit_cabinets
FROM gtb_sensors
WHERE izit_cabinets IS NOT NULL AND JSON_LENGTH(izit_cabinets) > 0;

-- =====================================================
-- ROLLBACK SCRIPT
-- =====================================================

/*
-- Restore from backup:

DROP TABLE IF EXISTS gtb_modules;
DROP TABLE IF EXISTS gtb_sensors;

CREATE TABLE gtb_modules AS SELECT * FROM gtb_modules_backup_20251016;
CREATE TABLE gtb_module_references AS SELECT * FROM gtb_module_references_backup_20251016;

-- Recreate indexes
ALTER TABLE gtb_modules ADD PRIMARY KEY (id);
ALTER TABLE gtb_modules ADD UNIQUE KEY unique_module (site_name, devis_name, module_type);
*/

-- =====================================================
-- CLEANUP (Run after verification)
-- =====================================================

/*
-- Remove backup tables after confirming migration success:
DROP TABLE IF EXISTS gtb_modules_backup_20251016;
DROP TABLE IF EXISTS gtb_module_references_backup_20251016;
*/
