-- Migration: Add commande_contacteur_exterieur field for exterior lighting horloge/crépusculaire
-- Date: 2025-10-21
-- Description: Adds commande_contacteur_exterieur column for exterior lighting control

-- NOTE: Change 'site_automation_db' to your actual database name if different
USE site_automation_db;

-- Add commande_contacteur_exterieur column
ALTER TABLE equipment_lighting
ADD COLUMN commande_contacteur_exterieur VARCHAR(50) NULL
COMMENT 'Exterior lighting horloge control: oui, oui_avec_crepusculaire, non';

-- Verify column was added
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'equipment_lighting'
  AND COLUMN_NAME = 'commande_contacteur_exterieur';

SELECT '✅ Migration completed: commande_contacteur_exterieur field added successfully' AS status;
