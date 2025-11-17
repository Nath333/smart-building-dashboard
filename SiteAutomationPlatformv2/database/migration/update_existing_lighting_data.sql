-- Update existing lighting data to populate new columns
-- This will update row ID 108 with the correct values

-- First, check the current data
SELECT * FROM equipment_lighting
WHERE site_name = 'Bricomarché Chatillon-en-Michaille'
AND zone_eclairage = 'surface_de_vente';

-- Update the row with proper values
UPDATE equipment_lighting
SET
  panneau_eclairage = 'oui_sdv_seulement',
  nb_points_lumineux_interieur = 1,
  nb_contacteurs_tetra_interieur = 1,
  nb_contacteurs_mono_interieur = 1,
  nb_contacteurs_biphase_interieur = 1,
  commande_contacteur_interieur = 'oui',
  nb_points_lumineux_exterieur = 1,
  nb_contacteurs_tetra_exterieur = 1,
  nb_contacteurs_mono_exterieur = 1,
  nb_contacteurs_biphase_exterieur = 1,
  commande_horloge_crepusculaire = 'horloge'
WHERE site_name = 'Bricomarché Chatillon-en-Michaille'
  AND zone_eclairage = 'surface_de_vente';

-- Verify the update
SELECT * FROM equipment_lighting
WHERE site_name = 'Bricomarché Chatillon-en-Michaille'
AND zone_eclairage = 'surface_de_vente';
