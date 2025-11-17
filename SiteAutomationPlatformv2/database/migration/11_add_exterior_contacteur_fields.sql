-- Migration: Add exterior contacteur fields for lighting
-- Date: 2025-10-21
-- Description: Adds nb_contacteurs_ext and ref_disjoncteur_contacteur_ext columns for exterior lighting

-- NOTE: Change 'site_automation_db' to your actual database name if different
USE site_automation_db;

-- Add nb_contacteurs_ext column (number of exterior contactors)
ALTER TABLE equipment_lighting
ADD COLUMN nb_contacteurs_ext INT NULL DEFAULT 0
COMMENT 'Number of contactors for exterior lighting';

-- Add ref_disjoncteur_contacteur_ext column (stores complex contactor/circuit breaker structure for exterior)
ALTER TABLE equipment_lighting
ADD COLUMN ref_disjoncteur_contacteur_ext TEXT NULL
COMMENT 'Complex structure for exterior: contactorType:nbDisjoncteurs:disjType ref | disjType ref || nextContactor';

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
  AND COLUMN_NAME IN ('nb_contacteurs_ext', 'ref_disjoncteur_contacteur_ext')
ORDER BY ORDINAL_POSITION;

SELECT '✅ Migration completed: Exterior contacteur fields added successfully' AS status;
