-- Comprehensive diagnosis of lighting table issue

-- 1. Show exact column names and order
SELECT
    ORDINAL_POSITION as pos,
    COLUMN_NAME as name,
    COLUMN_TYPE as type
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'equipment_lighting'
ORDER BY ORDINAL_POSITION;

-- 2. Show the actual data with explicit column names
SELECT
    id,
    site_name,
    zone_eclairage,
    panneau_eclairage,
    nb_points_lumineux_interieur,
    nb_contacteurs_tetra_interieur,
    nb_contacteurs_mono_interieur,
    nb_contacteurs_biphase_interieur,
    commande_contacteur_interieur,
    nb_points_lumineux_exterieur,
    nb_contacteurs_tetra_exterieur,
    nb_contacteurs_mono_exterieur,
    nb_contacteurs_biphase_exterieur,
    commande_horloge_crepusculaire,
    commentaire_eclairage,
    etat_vetuste_eclairage,
    localisation_eclairage
FROM equipment_lighting
WHERE site_name = 'Bricomarché Chatillon-en-Michaille'
  AND zone_eclairage = 'surface_de_vente';

-- 3. Count how many fields have actual values (not NULL)
SELECT
    id,
    CASE WHEN panneau_eclairage IS NOT NULL THEN 'YES' ELSE 'NULL' END as panneau_eclairage,
    CASE WHEN nb_points_lumineux_interieur IS NOT NULL THEN 'YES' ELSE 'NULL' END as nb_points_lumineux_interieur,
    CASE WHEN nb_contacteurs_tetra_interieur IS NOT NULL THEN 'YES' ELSE 'NULL' END as nb_contacteurs_tetra_interieur,
    CASE WHEN nb_contacteurs_mono_interieur IS NOT NULL THEN 'YES' ELSE 'NULL' END as nb_contacteurs_mono_interieur,
    CASE WHEN nb_contacteurs_biphase_interieur IS NOT NULL THEN 'YES' ELSE 'NULL' END as nb_contacteurs_biphase_interieur,
    CASE WHEN commande_contacteur_interieur IS NOT NULL THEN 'YES' ELSE 'NULL' END as commande_contacteur_interieur,
    CASE WHEN nb_points_lumineux_exterieur IS NOT NULL THEN 'YES' ELSE 'NULL' END as nb_points_lumineux_exterieur,
    CASE WHEN nb_contacteurs_tetra_exterieur IS NOT NULL THEN 'YES' ELSE 'NULL' END as nb_contacteurs_tetra_exterieur,
    CASE WHEN nb_contacteurs_mono_exterieur IS NOT NULL THEN 'YES' ELSE 'NULL' END as nb_contacteurs_mono_exterieur,
    CASE WHEN nb_contacteurs_biphase_exterieur IS NOT NULL THEN 'YES' ELSE 'NULL' END as nb_contacteurs_biphase_exterieur,
    CASE WHEN commande_horloge_crepusculaire IS NOT NULL THEN 'YES' ELSE 'NULL' END as commande_horloge_crepusculaire
FROM equipment_lighting
WHERE site_name = 'Bricomarché Chatillon-en-Michaille'
  AND zone_eclairage = 'surface_de_vente';
