-- Migration: Rollback image_sql changes and add proper devis linking
-- Date: 2025-10-15
-- Purpose: Remove duplicate columns from image_sql and add devis_name to gtb_modules

-- Step 1: Remove columns that should not be in image_sql (safe to fail if not exists)

-- Drop install_qty_aero
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'install_qty_aero';
SET @sql = IF(@col_exists > 0, 'ALTER TABLE image_sql DROP COLUMN install_qty_aero', 'SELECT "Column install_qty_aero does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop install_qty_clim_ir
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'install_qty_clim_ir';
SET @sql = IF(@col_exists > 0, 'ALTER TABLE image_sql DROP COLUMN install_qty_clim_ir', 'SELECT "Column install_qty_clim_ir does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop install_qty_clim_wire
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'install_qty_clim_wire';
SET @sql = IF(@col_exists > 0, 'ALTER TABLE image_sql DROP COLUMN install_qty_clim_wire', 'SELECT "Column install_qty_clim_wire does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop install_qty_rooftop
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'install_qty_rooftop';
SET @sql = IF(@col_exists > 0, 'ALTER TABLE image_sql DROP COLUMN install_qty_rooftop', 'SELECT "Column install_qty_rooftop does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop install_qty_eclairage
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'install_qty_eclairage';
SET @sql = IF(@col_exists > 0, 'ALTER TABLE image_sql DROP COLUMN install_qty_eclairage', 'SELECT "Column install_qty_eclairage does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop last_modified
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'last_modified';
SET @sql = IF(@col_exists > 0, 'ALTER TABLE image_sql DROP COLUMN last_modified', 'SELECT "Column last_modified does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Keep devis_name as FK link (plan image belongs to a devis)
-- Already exists from previous migration, no action needed

-- Step 3: Add devis_name to gtb_modules table for proper linking
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'gtb_modules' AND COLUMN_NAME = 'devis_name';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE gtb_modules ADD COLUMN devis_name VARCHAR(255) DEFAULT "Devis Principal" COMMENT "Links GTB module to specific devis"',
  'SELECT "Column devis_name already exists in gtb_modules"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add index for better query performance
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'gtb_modules' AND INDEX_NAME = 'idx_site_devis';
SET @sql = IF(@index_exists = 0,
  'CREATE INDEX idx_site_devis ON gtb_modules(site_name, devis_name)',
  'SELECT "Index idx_site_devis already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify changes
SELECT '=== image_sql columns after cleanup ===' as status;
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'image_sql'
AND COLUMN_NAME IN ('devis_name', 'install_qty_aero', 'install_qty_clim_ir')
ORDER BY ORDINAL_POSITION;

SELECT '=== gtb_modules structure ===' as status;
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'gtb_modules'
AND COLUMN_NAME IN ('site_name', 'devis_name', 'module_type', 'quantity')
ORDER BY ORDINAL_POSITION;
