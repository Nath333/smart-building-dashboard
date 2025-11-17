-- =====================================================
-- FIX GTB_MODULES UNIQUE CONSTRAINT
-- =====================================================
-- Issue: UNIQUE constraint on (site_name, module_type) prevents
--        multiple devis from having their own GTB configurations
-- Solution: Add devis_name to the UNIQUE constraint
-- Date: 2025-10-17
-- =====================================================

USE avancement;

-- Step 1: Ensure devis_name column exists (in case migration 07 wasn't run)
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement' AND TABLE_NAME = 'gtb_modules' AND COLUMN_NAME = 'devis_name';

SET @sql_add_col = IF(@col_exists = 0,
  'ALTER TABLE gtb_modules ADD COLUMN devis_name VARCHAR(255) DEFAULT "Devis Principal" COMMENT "Links GTB module to specific devis"',
  'SELECT "Column devis_name already exists in gtb_modules"');
PREPARE stmt FROM @sql_add_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Drop the old constraint if it exists
SET @index_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'avancement'
    AND TABLE_NAME = 'gtb_modules'
    AND INDEX_NAME = 'unique_site_module'
);

SET @sql_drop_old = IF(@index_exists > 0,
  'ALTER TABLE gtb_modules DROP INDEX unique_site_module',
  'SELECT "Old constraint unique_site_module does not exist"');
PREPARE stmt FROM @sql_drop_old;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add new constraint that includes devis_name (if not exists)
SET @new_index_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'avancement'
    AND TABLE_NAME = 'gtb_modules'
    AND INDEX_NAME = 'unique_site_module_devis'
);

SET @sql_add_new = IF(@new_index_exists = 0,
  'ALTER TABLE gtb_modules ADD UNIQUE KEY unique_site_module_devis (site_name, module_type, devis_name)',
  'SELECT "New constraint unique_site_module_devis already exists"');
PREPARE stmt FROM @sql_add_new;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT
  'gtb_modules constraint fixed' AS status,
  COUNT(*) AS total_records
FROM gtb_modules;

-- Show current indexes
SHOW INDEX FROM gtb_modules;

SELECT '✅ Migration complete! You can now save GTB configs for multiple devis per site.' AS message;
