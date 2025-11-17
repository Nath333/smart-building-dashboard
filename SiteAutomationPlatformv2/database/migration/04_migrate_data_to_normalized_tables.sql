-- =====================================================
-- Data Migration Script
-- Migrates data from form_sql to normalized tables
-- Uses existing sites table with site_name column
-- =====================================================

-- 1. Ensure sites table has all sites from form_sql
INSERT INTO sites (site_name, client_name, address, phone_primary, phone_secondary, email, created_at)
SELECT DISTINCT
    site,
    client,
    address,
    number1,
    number2,
    email,
    submitted_at
FROM form_sql
WHERE site IS NOT NULL AND site != ''
ON DUPLICATE KEY UPDATE
    client_name = VALUES(client_name),
    address = VALUES(address),
    phone_primary = VALUES(phone_primary),
    phone_secondary = VALUES(phone_secondary),
    email = VALUES(email);

-- 2. Migrate Aerotherme Equipment Data
INSERT INTO equipment_aerotherme (
    site_name, zone_aerotherme, nb_aerotherme, thermostat_aerotherme,
    nb_contacts_aerotherme, coffret_aerotherme, coffret_horloge_aerotherme,
    type_aerotherme, fonctionement_aerotherme, maintenance_aerotherme,
    commentaire_aero, td_aerotherme
)
SELECT
    site,
    zone_aerotherme,
    nb_aerotherme,
    thermostat_aerotherme,
    nb_contacts_aerotherme,
    coffret_aerotherme,
    coffret_horloge_aerotherme,
    type_aerotherme,
    Fonctionement_aerotherme,
    Maintenance_aerotherme,
    commentaire_aero,
    td_aerotherme
FROM form_sql
WHERE site IS NOT NULL AND site != ''
ON DUPLICATE KEY UPDATE
    zone_aerotherme = VALUES(zone_aerotherme),
    nb_aerotherme = VALUES(nb_aerotherme),
    thermostat_aerotherme = VALUES(thermostat_aerotherme);

-- 3. Migrate Aerotherme Brands (marque_aerotherme_0 to marque_aerotherme_9)
INSERT INTO aerotherme_brands (site_name, brand_index, brand_name)
SELECT site, 0, marque_aerotherme_0 FROM form_sql WHERE site IS NOT NULL AND marque_aerotherme_0 IS NOT NULL AND marque_aerotherme_0 != ''
UNION ALL
SELECT site, 1, marque_aerotherme_1 FROM form_sql WHERE site IS NOT NULL AND marque_aerotherme_1 IS NOT NULL AND marque_aerotherme_1 != ''
UNION ALL
SELECT site, 2, marque_aerotherme_2 FROM form_sql WHERE site IS NOT NULL AND marque_aerotherme_2 IS NOT NULL AND marque_aerotherme_2 != ''
UNION ALL
SELECT site, 3, marque_aerotherme_3 FROM form_sql WHERE site IS NOT NULL AND marque_aerotherme_3 IS NOT NULL AND marque_aerotherme_3 != ''
UNION ALL
SELECT site, 4, marque_aerotherme_4 FROM form_sql WHERE site IS NOT NULL AND marque_aerotherme_4 IS NOT NULL AND marque_aerotherme_4 != ''
UNION ALL
SELECT site, 5, marque_aerotherme_5 FROM form_sql WHERE site IS NOT NULL AND marque_aerotherme_5 IS NOT NULL AND marque_aerotherme_5 != ''
UNION ALL
SELECT site, 6, marque_aerotherme_6 FROM form_sql WHERE site IS NOT NULL AND marque_aerotherme_6 IS NOT NULL AND marque_aerotherme_6 != ''
UNION ALL
SELECT site, 7, marque_aerotherme_7 FROM form_sql WHERE site IS NOT NULL AND marque_aerotherme_7 IS NOT NULL AND marque_aerotherme_7 != ''
UNION ALL
SELECT site, 8, marque_aerotherme_8 FROM form_sql WHERE site IS NOT NULL AND marque_aerotherme_8 IS NOT NULL AND marque_aerotherme_8 != ''
UNION ALL
SELECT site, 9, marque_aerotherme_9 FROM form_sql WHERE site IS NOT NULL AND marque_aerotherme_9 IS NOT NULL AND marque_aerotherme_9 != ''
ON DUPLICATE KEY UPDATE brand_name = VALUES(brand_name);

-- 4. Migrate Rooftop Equipment Data
INSERT INTO equipment_rooftop (
    site_name, zone_rooftop, zone_rooftop_1, zone_rooftop_2, zone_rooftop_3, zone_rooftop_4,
    nb_rooftop, thermostat_rooftop, telecomande_modbus_rooftop, coffret_rooftop,
    type_rooftop, type_rooftop_1, type_rooftop_2, type_rooftop_3,
    fonctionement_rooftop, maintenance_rooftop, commentaire_rooftop
)
SELECT
    site,
    zone_rooftop,
    zone_rooftop_1,
    zone_rooftop_2,
    zone_rooftop_3,
    zone_rooftop_4,
    nb_rooftop,
    thermostat_rooftop,
    telecomande_modbus_rooftop,
    coffret_rooftop,
    type_rooftop,
    type_rooftop_1,
    type_rooftop_2,
    type_rooftop_3,
    Fonctionement_rooftop,
    Maintenance_rooftop,
    commentaire_rooftop
FROM form_sql
WHERE site IS NOT NULL AND site != ''
ON DUPLICATE KEY UPDATE
    nb_rooftop = VALUES(nb_rooftop),
    zone_rooftop = VALUES(zone_rooftop);

-- 5. Migrate Rooftop Brands
INSERT INTO rooftop_brands (site_name, brand_index, brand_name)
SELECT site, 0, marque_rooftop_0 FROM form_sql WHERE site IS NOT NULL AND marque_rooftop_0 IS NOT NULL AND marque_rooftop_0 != ''
UNION ALL
SELECT site, 1, marque_rooftop_1 FROM form_sql WHERE site IS NOT NULL AND marque_rooftop_1 IS NOT NULL AND marque_rooftop_1 != ''
UNION ALL
SELECT site, 2, marque_rooftop_2 FROM form_sql WHERE site IS NOT NULL AND marque_rooftop_2 IS NOT NULL AND marque_rooftop_2 != ''
UNION ALL
SELECT site, 3, marque_rooftop_3 FROM form_sql WHERE site IS NOT NULL AND marque_rooftop_3 IS NOT NULL AND marque_rooftop_3 != ''
UNION ALL
SELECT site, 4, marque_rooftop_4 FROM form_sql WHERE site IS NOT NULL AND marque_rooftop_4 IS NOT NULL AND marque_rooftop_4 != ''
UNION ALL
SELECT site, 5, marque_rooftop_5 FROM form_sql WHERE site IS NOT NULL AND marque_rooftop_5 IS NOT NULL AND marque_rooftop_5 != ''
UNION ALL
SELECT site, 6, marque_rooftop_6 FROM form_sql WHERE site IS NOT NULL AND marque_rooftop_6 IS NOT NULL AND marque_rooftop_6 != ''
UNION ALL
SELECT site, 7, marque_rooftop_7 FROM form_sql WHERE site IS NOT NULL AND marque_rooftop_7 IS NOT NULL AND marque_rooftop_7 != ''
UNION ALL
SELECT site, 8, marque_rooftop_8 FROM form_sql WHERE site IS NOT NULL AND marque_rooftop_8 IS NOT NULL AND marque_rooftop_8 != ''
UNION ALL
SELECT site, 9, marque_rooftop_9 FROM form_sql WHERE site IS NOT NULL AND marque_rooftop_9 IS NOT NULL AND marque_rooftop_9 != ''
ON DUPLICATE KEY UPDATE brand_name = VALUES(brand_name);

-- 6. Migrate Climate Control Equipment Data
INSERT INTO equipment_climate (
    site_name, zone_clim, nb_clim_ir, nb_clim_wire, coffret_clim,
    type_clim, fonctionement_clim, maintenance_clim,
    nb_telecommande_clim_smartwire, nb_telecommande_clim_wire,
    commentaire_clim, td_clim
)
SELECT
    site,
    zone_clim,
    nb_clim_ir,
    nb_clim_wire,
    coffret_clim,
    type_clim,
    Fonctionement_clim,
    Maintenance_clim,
    nb_telecommande_clim_smartwire,
    nb_telecommande_clim_wire,
    commentaire_clim,
    td_clim
FROM form_sql
WHERE site IS NOT NULL AND site != ''
ON DUPLICATE KEY UPDATE
    nb_clim_ir = VALUES(nb_clim_ir),
    nb_clim_wire = VALUES(nb_clim_wire);

-- 7. Migrate Climate IR References
INSERT INTO climate_references (site_name, ref_type, ref_index, ref_value)
SELECT site, 'clim_ir', 0, clim_ir_ref_0 FROM form_sql WHERE site IS NOT NULL AND clim_ir_ref_0 IS NOT NULL AND clim_ir_ref_0 != ''
UNION ALL
SELECT site, 'clim_ir', 1, clim_ir_ref_1 FROM form_sql WHERE site IS NOT NULL AND clim_ir_ref_1 IS NOT NULL AND clim_ir_ref_1 != ''
UNION ALL
SELECT site, 'clim_ir', 2, clim_ir_ref_2 FROM form_sql WHERE site IS NOT NULL AND clim_ir_ref_2 IS NOT NULL AND clim_ir_ref_2 != ''
UNION ALL
SELECT site, 'clim_ir', 3, clim_ir_ref_3 FROM form_sql WHERE site IS NOT NULL AND clim_ir_ref_3 IS NOT NULL AND clim_ir_ref_3 != ''
UNION ALL
SELECT site, 'clim_ir', 4, clim_ir_ref_4 FROM form_sql WHERE site IS NOT NULL AND clim_ir_ref_4 IS NOT NULL AND clim_ir_ref_4 != ''
UNION ALL
SELECT site, 'clim_ir', 5, clim_ir_ref_5 FROM form_sql WHERE site IS NOT NULL AND clim_ir_ref_5 IS NOT NULL AND clim_ir_ref_5 != ''
UNION ALL
SELECT site, 'clim_ir', 6, clim_ir_ref_6 FROM form_sql WHERE site IS NOT NULL AND clim_ir_ref_6 IS NOT NULL AND clim_ir_ref_6 != ''
UNION ALL
SELECT site, 'clim_ir', 7, clim_ir_ref_7 FROM form_sql WHERE site IS NOT NULL AND clim_ir_ref_7 IS NOT NULL AND clim_ir_ref_7 != ''
UNION ALL
SELECT site, 'clim_ir', 8, clim_ir_ref_8 FROM form_sql WHERE site IS NOT NULL AND clim_ir_ref_8 IS NOT NULL AND clim_ir_ref_8 != ''
UNION ALL
SELECT site, 'clim_ir', 9, clim_ir_ref_9 FROM form_sql WHERE site IS NOT NULL AND clim_ir_ref_9 IS NOT NULL AND clim_ir_ref_9 != ''
ON DUPLICATE KEY UPDATE ref_value = VALUES(ref_value);

-- 8. Migrate Climate Wire References
INSERT INTO climate_references (site_name, ref_type, ref_index, ref_value)
SELECT site, 'clim_wire', 0, clim_wire_ref_0 FROM form_sql WHERE site IS NOT NULL AND clim_wire_ref_0 IS NOT NULL AND clim_wire_ref_0 != ''
UNION ALL
SELECT site, 'clim_wire', 1, clim_wire_ref_1 FROM form_sql WHERE site IS NOT NULL AND clim_wire_ref_1 IS NOT NULL AND clim_wire_ref_1 != ''
UNION ALL
SELECT site, 'clim_wire', 2, clim_wire_ref_2 FROM form_sql WHERE site IS NOT NULL AND clim_wire_ref_2 IS NOT NULL AND clim_wire_ref_2 != ''
UNION ALL
SELECT site, 'clim_wire', 3, clim_wire_ref_3 FROM form_sql WHERE site IS NOT NULL AND clim_wire_ref_3 IS NOT NULL AND clim_wire_ref_3 != ''
UNION ALL
SELECT site, 'clim_wire', 4, clim_wire_ref_4 FROM form_sql WHERE site IS NOT NULL AND clim_wire_ref_4 IS NOT NULL AND clim_wire_ref_4 != ''
UNION ALL
SELECT site, 'clim_wire', 5, clim_wire_ref_5 FROM form_sql WHERE site IS NOT NULL AND clim_wire_ref_5 IS NOT NULL AND clim_wire_ref_5 != ''
UNION ALL
SELECT site, 'clim_wire', 6, clim_wire_ref_6 FROM form_sql WHERE site IS NOT NULL AND clim_wire_ref_6 IS NOT NULL AND clim_wire_ref_6 != ''
UNION ALL
SELECT site, 'clim_wire', 7, clim_wire_ref_7 FROM form_sql WHERE site IS NOT NULL AND clim_wire_ref_7 IS NOT NULL AND clim_wire_ref_7 != ''
UNION ALL
SELECT site, 'clim_wire', 8, clim_wire_ref_8 FROM form_sql WHERE site IS NOT NULL AND clim_wire_ref_8 IS NOT NULL AND clim_wire_ref_8 != ''
UNION ALL
SELECT site, 'clim_wire', 9, clim_wire_ref_9 FROM form_sql WHERE site IS NOT NULL AND clim_wire_ref_9 IS NOT NULL AND clim_wire_ref_9 != ''
ON DUPLICATE KEY UPDATE ref_value = VALUES(ref_value);

-- 9. Migrate Lighting Equipment Data
INSERT INTO equipment_lighting (
    site_name, eclairage_interieur, eclairage_contacteur,
    eclairage_exterieur, eclairage_horloge, commentaire_eclairage
)
SELECT
    site,
    Eclairage_interieur,
    Eclairage_contacteur,
    Eclairage_exterieur,
    Eclairage_horloge,
    commentaire_eclairage
FROM form_sql
WHERE site IS NOT NULL AND site != ''
ON DUPLICATE KEY UPDATE
    eclairage_interieur = VALUES(eclairage_interieur),
    eclairage_contacteur = VALUES(eclairage_contacteur);

-- 10. Migrate GTB Modules (Page 5 data)
-- aeroeau
INSERT INTO gtb_modules (site_name, module_type, quantity, refs)
SELECT site, 'aeroeau', aeroeau, ref_aeroeau FROM form_sql WHERE site IS NOT NULL AND aeroeau > 0
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), refs = VALUES(refs);

-- aerogaz
INSERT INTO gtb_modules (site_name, module_type, quantity, refs)
SELECT site, 'aerogaz', aerogaz, ref_aerogaz FROM form_sql WHERE site IS NOT NULL AND aerogaz > 0
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), refs = VALUES(refs);

-- clim_ir
INSERT INTO gtb_modules (site_name, module_type, quantity, refs)
SELECT site, 'clim_ir', `clim ir`, ref_clim_ir FROM form_sql WHERE site IS NOT NULL AND `clim ir` > 0
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), refs = VALUES(refs);

-- clim_filaire_simple
INSERT INTO gtb_modules (site_name, module_type, quantity, refs)
SELECT site, 'clim_filaire_simple', `clim filaire simple`, clim_filaire_simple FROM form_sql WHERE site IS NOT NULL AND `clim filaire simple` > 0
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), refs = VALUES(refs);

-- clim_filaire_groupe
INSERT INTO gtb_modules (site_name, module_type, quantity, refs)
SELECT site, 'clim_filaire_groupe', `clim filaire groupe`, ref_clim_filaire_groupe FROM form_sql WHERE site IS NOT NULL AND `clim filaire groupe` > 0
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), refs = VALUES(refs);

-- rooftop
INSERT INTO gtb_modules (site_name, module_type, quantity, refs)
SELECT site, 'rooftop', rooftop, ref_rooftop FROM form_sql WHERE site IS NOT NULL AND rooftop > 0
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), refs = VALUES(refs);

-- comptage_froid
INSERT INTO gtb_modules (site_name, module_type, quantity, refs)
SELECT site, 'comptage_froid', `Comptage Froid`, ref_Comptage_Froid FROM form_sql WHERE site IS NOT NULL AND `Comptage Froid` > 0
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), refs = VALUES(refs);

-- comptage_eclairage
INSERT INTO gtb_modules (site_name, module_type, quantity, refs)
SELECT site, 'comptage_eclairage', Comptage_Eclairage, ref_Comptage_Eclairage FROM form_sql WHERE site IS NOT NULL AND Comptage_Eclairage > 0
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), refs = VALUES(refs);

-- eclairage
INSERT INTO gtb_modules (site_name, module_type, quantity, refs)
SELECT site, 'eclairage', eclairage, ref_eclairage FROM form_sql WHERE site IS NOT NULL AND eclairage > 0
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), refs = VALUES(refs);

-- 11. Migrate Visual Positions (if pos_x and pos_y exist in form_sql)
INSERT INTO visual_positions (site_name, page_type, element_id, pos_x, pos_y)
SELECT
    site,
    'vt_plan',
    'main_element',
    pos_x,
    pos_y
FROM form_sql
WHERE site IS NOT NULL AND pos_x IS NOT NULL AND pos_y IS NOT NULL
ON DUPLICATE KEY UPDATE
    pos_x = VALUES(pos_x),
    pos_y = VALUES(pos_y);

-- =====================================================
-- Data Migration Complete
-- Run verification queries next
-- =====================================================
