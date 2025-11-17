-- Migration: Add new lighting fields for panneau and contacteur management
-- Date: 2025-10-21
-- Description: Adds ref_ecl_panneau, nb_contacteurs, and ref_disjoncteur_contacteur columns

USE site_automation_db;

-- Check if columns already exist before adding
SET @dbname = DATABASE();
SET @tablename = 'equipment_lighting';

-- Add ref_ecl_panneau column (stores pipe-separated references for light points)
SET @columnname = 'ref_ecl_panneau';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column ref_ecl_panneau already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN ref_ecl_panneau TEXT NULL COMMENT ''Pipe-separated references for interior light points (e.g., REF1 | REF2 | REF3)'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add nb_contacteurs column (number of contactors)
SET @columnname = 'nb_contacteurs';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column nb_contacteurs already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN nb_contacteurs INT NULL DEFAULT 0 COMMENT ''Number of contactors for interior lighting'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add ref_disjoncteur_contacteur column (stores complex contactor/circuit breaker structure)
SET @columnname = 'ref_disjoncteur_contacteur';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column ref_disjoncteur_contacteur already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN ref_disjoncteur_contacteur TEXT NULL COMMENT ''Complex structure: contactorType:nbDisjoncteurs:disjType ref | disjType ref || nextContactor (e.g., tetra:3:mono ref1|tetra ref2|tetra ref3 || mono:2:mono ref4|mono ref5)'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify columns were added
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'equipment_lighting'
  AND COLUMN_NAME IN ('ref_ecl_panneau', 'nb_contacteurs', 'ref_disjoncteur_contacteur')
ORDER BY ORDINAL_POSITION;

SELECT '✅ Migration completed: New lighting fields added successfully' AS status;
