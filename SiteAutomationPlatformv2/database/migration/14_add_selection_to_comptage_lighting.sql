-- Migration: Add selection field to equipment_comptage_lighting table
-- Date: 2025-10-21
-- Description: Add selection_comptage field to store contacteur/disjoncteur selection

USE avancement2;

-- Check if column already exists before adding
SET @dbname = 'avancement2';
SET @tablename = 'equipment_comptage_lighting';
SET @columnname = 'selection_comptage';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column selection_comptage already exists.'' AS msg',
  'ALTER TABLE equipment_comptage_lighting ADD COLUMN selection_comptage VARCHAR(255) NULL COMMENT ''Selected contacteur or disjoncteur ID for this comptage (e.g., interior_contacteur_1, exterior_contacteur_2_disjoncteur_1)'' AFTER site_name'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify column was added
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2'
  AND TABLE_NAME = 'equipment_comptage_lighting'
  AND COLUMN_NAME = 'selection_comptage';

SELECT '✅ Migration completed: selection_comptage field added to equipment_comptage_lighting' AS status;
