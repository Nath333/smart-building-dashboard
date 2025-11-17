-- =====================================================
-- Enhanced GTB Module Configuration Schema
-- =====================================================
-- Purpose: Replace form_sql flat structure with normalized GTB tables
-- Date: 2025-10-15
-- Migration: Enhances existing gtb_modules and gtb_module_references tables
-- =====================================================

USE avancement2;

-- =====================================================
-- STEP 1: Enhance gtb_modules table
-- =====================================================

-- Add missing fields to gtb_modules (check each separately for MySQL compatibility)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA='avancement2' AND TABLE_NAME='gtb_modules' AND COLUMN_NAME='ref_sondes') = 0,
  'ALTER TABLE gtb_modules ADD COLUMN ref_sondes TEXT COMMENT ''Comma-separated temperature sensor references''',
  'SELECT ''Column ref_sondes already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA='avancement2' AND TABLE_NAME='gtb_modules' AND COLUMN_NAME='ref_sondes_presentes') = 0,
  'ALTER TABLE gtb_modules ADD COLUMN ref_sondes_presentes TEXT COMMENT ''Comma-separated presence sensor references''',
  'SELECT ''Column ref_sondes_presentes already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA='avancement2' AND TABLE_NAME='gtb_modules' AND COLUMN_NAME='ref_gaz_compteur') = 0,
  'ALTER TABLE gtb_modules ADD COLUMN ref_gaz_compteur VARCHAR(255) COMMENT ''Gas counter reference''',
  'SELECT ''Column ref_gaz_compteur already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA='avancement2' AND TABLE_NAME='gtb_modules' AND COLUMN_NAME='module_category') = 0,
  'ALTER TABLE gtb_modules ADD COLUMN module_category VARCHAR(50) COMMENT ''Category: sensor, module, accessory''',
  'SELECT ''Column module_category already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA='avancement2' AND TABLE_NAME='gtb_modules' AND COLUMN_NAME='display_order') = 0,
  'ALTER TABLE gtb_modules ADD COLUMN display_order INT DEFAULT 0 COMMENT ''Display order in UI''',
  'SELECT ''Column display_order already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes (check if they exist first)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA='avancement2' AND TABLE_NAME='gtb_modules' AND INDEX_NAME='idx_gtb_site_module') = 0,
  'CREATE INDEX idx_gtb_site_module ON gtb_modules(site_name, module_type)',
  'SELECT ''Index idx_gtb_site_module already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA='avancement2' AND TABLE_NAME='gtb_modules' AND INDEX_NAME='idx_gtb_category') = 0,
  'CREATE INDEX idx_gtb_category ON gtb_modules(module_category)',
  'SELECT ''Index idx_gtb_category already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- STEP 2: Create gtb_module_types lookup table
-- =====================================================

CREATE TABLE IF NOT EXISTS gtb_module_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_type VARCHAR(100) NOT NULL UNIQUE,
  module_category ENUM('sensor', 'module', 'accessory', 'system') NOT NULL,
  display_name_fr VARCHAR(255) NOT NULL,
  display_name_en VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (module_category),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Lookup table for GTB module types and categories';

-- =====================================================
-- STEP 3: Populate gtb_module_types with standard modules
-- =====================================================

INSERT INTO gtb_module_types (module_type, module_category, display_name_fr, display_name_en, display_order) VALUES
-- Sensors (Category: sensor)
('sondes', 'sensor', 'Sondes Température', 'Temperature Sensors', 10),
('sondesPresentes', 'sensor', 'Sondes de Présence', 'Presence Sensors', 20),

-- System Accessories (Category: accessory)
('gazCompteur', 'accessory', 'Compteur Gaz', 'Gas Counter', 30),
('Izit', 'system', 'Coffret Izit', 'Izit Cabinet', 40),

-- Climate Control Modules (Category: module)
('aeroeau', 'module', 'Aérotherme Eau', 'Water Heater', 100),
('aerogaz', 'module', 'Aérotherme Gaz', 'Gas Heater', 110),
('clim_ir', 'module', 'Clim IR', 'IR Climate Control', 120),
('clim_filaire_simple', 'module', 'Clim Filaire Simple', 'Simple Wired Climate', 130),
('clim_filaire_groupe', 'module', 'Clim Filaire Groupe', 'Group Wired Climate', 140),
('rooftop', 'module', 'Rooftop', 'Rooftop Unit', 150),

-- Monitoring Modules (Category: module)
('Comptage_Froid', 'module', 'Comptage Froid', 'Cold Metering', 200),
('Comptage_Eclairage', 'module', 'Comptage Éclairage', 'Lighting Metering', 210),
('eclairage', 'module', 'Éclairage', 'Lighting Control', 220)

ON DUPLICATE KEY UPDATE
  display_name_fr = VALUES(display_name_fr),
  display_order = VALUES(display_order),
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- STEP 4: Create view for easy querying
-- =====================================================

CREATE OR REPLACE VIEW v_gtb_modules_detailed AS
SELECT
  gm.id,
  gm.site_name,
  gm.module_type,
  gmt.module_category,
  gmt.display_name_fr,
  gm.quantity,
  gm.refs,
  gm.ref_sondes,
  gm.ref_sondes_presentes,
  gm.ref_gaz_compteur,
  gm.sondes,
  gm.sondes_presentes,
  gm.gaz_compteur,
  gm.izit,
  gm.created_at,
  gm.updated_at
FROM gtb_modules gm
LEFT JOIN gtb_module_types gmt ON gm.module_type = gmt.module_type
ORDER BY gmt.display_order, gm.site_name;

-- =====================================================
-- STEP 5: Update gtb_module_references with better structure
-- =====================================================

ALTER TABLE gtb_module_references
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add composite unique key to prevent duplicates
ALTER TABLE gtb_module_references
  DROP INDEX IF EXISTS unique_site_module_ref,
  ADD UNIQUE INDEX unique_site_module_ref (site_name, module_type, ref_index);

-- =====================================================
-- STEP 6: Create stored procedures for common operations
-- =====================================================

DELIMITER //

-- Procedure: Get all GTB configuration for a site
CREATE PROCEDURE IF NOT EXISTS sp_get_gtb_config(IN p_site_name VARCHAR(100))
BEGIN
  -- Get modules
  SELECT
    module_type,
    quantity,
    refs,
    sondes,
    sondes_presentes,
    gaz_compteur,
    izit,
    ref_sondes,
    ref_sondes_presentes,
    ref_gaz_compteur
  FROM gtb_modules
  WHERE site_name = p_site_name;

  -- Get references
  SELECT
    module_type,
    ref_index,
    ref_value
  FROM gtb_module_references
  WHERE site_name = p_site_name
  ORDER BY module_type, ref_index;
END//

-- Procedure: Save GTB module with references
CREATE PROCEDURE IF NOT EXISTS sp_save_gtb_module(
  IN p_site_name VARCHAR(100),
  IN p_module_type VARCHAR(100),
  IN p_quantity INT,
  IN p_refs TEXT,
  IN p_sondes INT,
  IN p_sondes_presentes INT,
  IN p_gaz_compteur INT,
  IN p_izit INT,
  IN p_ref_sondes TEXT,
  IN p_ref_sondes_presentes TEXT,
  IN p_ref_gaz_compteur VARCHAR(255)
)
BEGIN
  INSERT INTO gtb_modules (
    site_name, module_type, quantity, refs,
    sondes, sondes_presentes, gaz_compteur, izit,
    ref_sondes, ref_sondes_presentes, ref_gaz_compteur
  ) VALUES (
    p_site_name, p_module_type, p_quantity, p_refs,
    p_sondes, p_sondes_presentes, p_gaz_compteur, p_izit,
    p_ref_sondes, p_ref_sondes_presentes, p_ref_gaz_compteur
  )
  ON DUPLICATE KEY UPDATE
    quantity = VALUES(quantity),
    refs = VALUES(refs),
    sondes = VALUES(sondes),
    sondes_presentes = VALUES(sondes_presentes),
    gaz_compteur = VALUES(gaz_compteur),
    izit = VALUES(izit),
    ref_sondes = VALUES(ref_sondes),
    ref_sondes_presentes = VALUES(ref_sondes_presentes),
    ref_gaz_compteur = VALUES(ref_gaz_compteur),
    updated_at = CURRENT_TIMESTAMP;
END//

-- Procedure: Delete all GTB config for a site
CREATE PROCEDURE IF NOT EXISTS sp_delete_gtb_config(IN p_site_name VARCHAR(100))
BEGIN
  DELETE FROM gtb_module_references WHERE site_name = p_site_name;
  DELETE FROM gtb_modules WHERE site_name = p_site_name;
END//

DELIMITER ;

-- =====================================================
-- STEP 7: Create audit/history table (optional)
-- =====================================================

CREATE TABLE IF NOT EXISTS gtb_modules_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  site_name VARCHAR(100) NOT NULL,
  module_type VARCHAR(100) NOT NULL,
  old_quantity INT,
  new_quantity INT,
  old_refs TEXT,
  new_refs TEXT,
  changed_by VARCHAR(100),
  INDEX idx_site_history (site_name),
  INDEX idx_operation_time (operation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Audit trail for GTB configuration changes';

-- =====================================================
-- STEP 8: Verification queries
-- =====================================================

-- Check table structures
SELECT 'gtb_modules columns' AS info;
DESCRIBE gtb_modules;

SELECT 'gtb_module_types count' AS info;
SELECT COUNT(*) AS module_types_count FROM gtb_module_types;

SELECT 'Sample module types' AS info;
SELECT module_type, display_name_fr, module_category FROM gtb_module_types ORDER BY display_order LIMIT 5;

-- =====================================================
-- Migration Complete
-- =====================================================
-- Next steps:
-- 1. Run this script: mysql -uroot -padmin avancement2 < 05_enhanced_gtb_schema.sql
-- 2. Test with: CALL sp_get_gtb_config('test_site');
-- 3. Update backend DAL to use these tables
-- 4. Update Page 5 API endpoints
-- =====================================================
