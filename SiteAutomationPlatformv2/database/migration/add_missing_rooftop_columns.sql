-- Add missing columns to equipment_rooftop table
-- Date: 2025-10-14
-- Issue: Columns type_rooftop_1/2/3 and zone_rooftop_1/2/3/4 missing from table

USE avancement2;

-- Check if columns exist before adding them
SET @dbname = 'avancement2';
SET @tablename = 'equipment_rooftop';

-- Add type_rooftop_1 if it doesn't exist
SET @col_exists = (SELECT COUNT(*)
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = @tablename
AND COLUMN_NAME = 'type_rooftop_1');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE equipment_rooftop ADD COLUMN type_rooftop_1 VARCHAR(255) AFTER type_rooftop',
  'SELECT "Column type_rooftop_1 already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add type_rooftop_2 if it doesn't exist
SET @col_exists = (SELECT COUNT(*)
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = @tablename
AND COLUMN_NAME = 'type_rooftop_2');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE equipment_rooftop ADD COLUMN type_rooftop_2 VARCHAR(255) AFTER type_rooftop_1',
  'SELECT "Column type_rooftop_2 already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add type_rooftop_3 if it doesn't exist
SET @col_exists = (SELECT COUNT(*)
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = @tablename
AND COLUMN_NAME = 'type_rooftop_3');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE equipment_rooftop ADD COLUMN type_rooftop_3 VARCHAR(255) AFTER type_rooftop_2',
  'SELECT "Column type_rooftop_3 already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add zone_rooftop_1 if it doesn't exist
SET @col_exists = (SELECT COUNT(*)
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = @tablename
AND COLUMN_NAME = 'zone_rooftop_1');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE equipment_rooftop ADD COLUMN zone_rooftop_1 VARCHAR(255) AFTER type_rooftop_3',
  'SELECT "Column zone_rooftop_1 already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add zone_rooftop_2 if it doesn't exist
SET @col_exists = (SELECT COUNT(*)
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = @tablename
AND COLUMN_NAME = 'zone_rooftop_2');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE equipment_rooftop ADD COLUMN zone_rooftop_2 VARCHAR(255) AFTER zone_rooftop_1',
  'SELECT "Column zone_rooftop_2 already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add zone_rooftop_3 if it doesn't exist
SET @col_exists = (SELECT COUNT(*)
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = @tablename
AND COLUMN_NAME = 'zone_rooftop_3');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE equipment_rooftop ADD COLUMN zone_rooftop_3 VARCHAR(255) AFTER zone_rooftop_2',
  'SELECT "Column zone_rooftop_3 already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add zone_rooftop_4 if it doesn't exist
SET @col_exists = (SELECT COUNT(*)
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = @tablename
AND COLUMN_NAME = 'zone_rooftop_4');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE equipment_rooftop ADD COLUMN zone_rooftop_4 VARCHAR(255) AFTER zone_rooftop_3',
  'SELECT "Column zone_rooftop_4 already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ Migration complete - All missing columns added to equipment_rooftop' AS status;
