-- Update equipment_lighting table for new format
-- Run this SQL script in your MySQL database

-- Step 1: Add new interior lighting columns
ALTER TABLE equipment_lighting
ADD COLUMN nb_points_lumineux_interieur INT DEFAULT NULL AFTER zone_eclairage,
ADD COLUMN nb_contacteurs_tetra_interieur INT DEFAULT NULL AFTER nb_points_lumineux_interieur,
ADD COLUMN nb_contacteurs_mono_interieur INT DEFAULT NULL AFTER nb_contacteurs_tetra_interieur,
ADD COLUMN nb_contacteurs_biphase_interieur INT DEFAULT NULL AFTER nb_contacteurs_mono_interieur,
ADD COLUMN commande_contacteur_interieur VARCHAR(50) DEFAULT NULL AFTER nb_contacteurs_biphase_interieur,

-- Step 2: Add new exterior lighting columns
ADD COLUMN nb_points_lumineux_exterieur INT DEFAULT NULL AFTER commande_contacteur_interieur,
ADD COLUMN nb_contacteurs_tetra_exterieur INT DEFAULT NULL AFTER nb_points_lumineux_exterieur,
ADD COLUMN nb_contacteurs_mono_exterieur INT DEFAULT NULL AFTER nb_contacteurs_tetra_exterieur,
ADD COLUMN nb_contacteurs_biphase_exterieur INT DEFAULT NULL AFTER nb_contacteurs_mono_exterieur,
ADD COLUMN commande_horloge_crepusculaire VARCHAR(50) DEFAULT NULL AFTER nb_contacteurs_biphase_exterieur,

-- Step 3: Drop old columns (LAST to avoid breaking existing data)
DROP COLUMN IF EXISTS eclairage_interieur,
DROP COLUMN IF EXISTS eclairage_contacteur,
DROP COLUMN IF EXISTS eclairage_exterieur,
DROP COLUMN IF EXISTS eclairage_horloge;

-- Verify the changes
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'equipment_lighting'
ORDER BY ORDINAL_POSITION;
