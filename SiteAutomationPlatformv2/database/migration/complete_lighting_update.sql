-- Complete lighting table update
-- Run this SQL script to add ALL missing columns

-- Step 1: Add panneau_eclairage field (NEW)
ALTER TABLE equipment_lighting
ADD COLUMN panneau_eclairage VARCHAR(50) DEFAULT NULL AFTER zone_eclairage;

-- Step 2: Add interior lighting columns (if missing)
ALTER TABLE equipment_lighting
ADD COLUMN nb_points_lumineux_interieur INT DEFAULT NULL AFTER panneau_eclairage,
ADD COLUMN nb_contacteurs_tetra_interieur INT DEFAULT NULL AFTER nb_points_lumineux_interieur,
ADD COLUMN nb_contacteurs_mono_interieur INT DEFAULT NULL AFTER nb_contacteurs_tetra_interieur,
ADD COLUMN nb_contacteurs_biphase_interieur INT DEFAULT NULL AFTER nb_contacteurs_mono_interieur,
ADD COLUMN commande_contacteur_interieur VARCHAR(50) DEFAULT NULL AFTER nb_contacteurs_biphase_interieur;

-- Step 3: Verify all columns exist
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'equipment_lighting'
ORDER BY ORDINAL_POSITION;

-- Expected columns in order:
-- 1. id
-- 2. site_name
-- 3. zone_eclairage
-- 4. panneau_eclairage (NEW)
-- 5. nb_points_lumineux_interieur (NEW)
-- 6. nb_contacteurs_tetra_interieur (NEW)
-- 7. nb_contacteurs_mono_interieur (NEW)
-- 8. nb_contacteurs_biphase_interieur (NEW)
-- 9. commande_contacteur_interieur (NEW)
-- 10. nb_points_lumineux_exterieur
-- 11. nb_contacteurs_tetra_exterieur
-- 12. nb_contacteurs_mono_exterieur
-- 13. nb_contacteurs_biphase_exterieur
-- 14. commande_horloge_crepusculaire
-- 15. commentaire_eclairage
-- 16. etat_vetuste_eclairage
-- 17. localisation_eclairage
-- 18. created_at
-- 19. updated_at
