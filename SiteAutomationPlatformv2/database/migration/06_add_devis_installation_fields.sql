-- Migration: Add devis name and installation quantities for GTB plans
-- Date: 2025-10-15
-- Purpose: Track quote/project name and equipment installation quantities per GTB plan

-- Add devis name and installation quantities to image_sql table
-- This allows each GTB plan image to have its own devis and installation data

-- Check and add devis_name column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'devis_name';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE image_sql ADD COLUMN devis_name VARCHAR(255) DEFAULT NULL COMMENT "Quote/Project name for this plan"', 'SELECT "Column devis_name already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add install_qty_aero column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'install_qty_aero';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE image_sql ADD COLUMN install_qty_aero INT DEFAULT 0 COMMENT "Aerotherme units to install"', 'SELECT "Column install_qty_aero already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add install_qty_clim_ir column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'install_qty_clim_ir';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE image_sql ADD COLUMN install_qty_clim_ir INT DEFAULT 0 COMMENT "Clim IR units to install"', 'SELECT "Column install_qty_clim_ir already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add install_qty_clim_wire column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'install_qty_clim_wire';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE image_sql ADD COLUMN install_qty_clim_wire INT DEFAULT 0 COMMENT "Clim filaire units to install"', 'SELECT "Column install_qty_clim_wire already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add install_qty_rooftop column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'install_qty_rooftop';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE image_sql ADD COLUMN install_qty_rooftop INT DEFAULT 0 COMMENT "Rooftop units to install"', 'SELECT "Column install_qty_rooftop already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add install_qty_eclairage column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'install_qty_eclairage';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE image_sql ADD COLUMN install_qty_eclairage INT DEFAULT 0 COMMENT "Eclairage units to install"', 'SELECT "Column install_qty_eclairage already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add last_modified column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2' AND TABLE_NAME = 'image_sql' AND COLUMN_NAME = 'last_modified';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE image_sql ADD COLUMN last_modified DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "Last modification timestamp"', 'SELECT "Column last_modified already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify additions
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'image_sql'
AND COLUMN_NAME IN ('devis_name', 'last_modified', 'install_qty_aero', 'install_qty_clim_ir', 'install_qty_clim_wire', 'install_qty_rooftop', 'install_qty_eclairage')
ORDER BY ORDINAL_POSITION;
