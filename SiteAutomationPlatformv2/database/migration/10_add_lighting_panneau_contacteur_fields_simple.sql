-- Migration: Add new lighting fields for panneau and contacteur management
-- Date: 2025-10-21
-- Description: Adds ref_ecl_panneau, nb_contacteurs, and ref_disjoncteur_contacteur columns
-- SIMPLE VERSION (no IF NOT EXISTS check)

-- NOTE: Change 'site_automation_db' to your actual database name if different
USE site_automation_db;

-- Add ref_ecl_panneau column (stores pipe-separated references for light points)
ALTER TABLE equipment_lighting
ADD COLUMN ref_ecl_panneau TEXT NULL
COMMENT 'Pipe-separated references for interior light points (e.g., REF1 | REF2 | REF3)';

-- Add nb_contacteurs column (number of contactors)
ALTER TABLE equipment_lighting
ADD COLUMN nb_contacteurs INT NULL DEFAULT 0
COMMENT 'Number of contactors for interior lighting';

-- Add ref_disjoncteur_contacteur column (stores complex contactor/circuit breaker structure)
ALTER TABLE equipment_lighting
ADD COLUMN ref_disjoncteur_contacteur TEXT NULL
COMMENT 'Complex structure: contactorType:nbDisjoncteurs:disjType ref | disjType ref || nextContactor';

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
