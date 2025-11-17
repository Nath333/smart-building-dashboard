-- ===============================================
-- POPULATE EMPTY EQUIPMENT TABLES
-- Specifically for equipment_configs and equipment_references
-- ===============================================

-- 🎯 This script addresses your exact situation:
-- ✅ You have the tables created
-- ❌ equipment_configs is empty
-- ❌ equipment_references is empty
-- ❌ equipment_categories might be empty

-- STEP 1: Ensure equipment_categories exist (required for foreign keys)
INSERT IGNORE INTO equipment_categories (category_code, category_name, description, is_active) VALUES
('AERO', 'Aérothermes', 'Systèmes de chauffage aérothermes', TRUE),
('CLIM_IR', 'Climatisation IR', 'Climatisation avec télécommande infrarouge', TRUE),
('CLIM_WIRE', 'Climatisation Filaire', 'Climatisation avec commande filaire', TRUE),
('ROOFTOP', 'Rooftop', 'Unités de traitement d\'air en toiture', TRUE),
('LIGHTING', 'Éclairage', 'Systèmes d\'éclairage intérieur et extérieur', TRUE);

-- STEP 2: Ensure sites table has your data
INSERT IGNORE INTO sites (site_name, client_name, address, phone_primary, phone_secondary, email)
SELECT DISTINCT
    site as site_name,
    client as client_name,
    address,
    number1 as phone_primary,
    number2 as phone_secondary,
    email
FROM form_sql
WHERE site IS NOT NULL AND site != '' AND site != 'unknown';

-- STEP 3: Populate equipment_configs from form_sql data
-- 🔧 AERO Equipment
INSERT IGNORE INTO equipment_configs (
    site_id, category_id, quantity_total, zones, equipment_types,
    has_thermostat, has_electrical_panel, has_timer,
    nb_contacts_aerotherme, operational_status, maintenance_status,
    comments, pos_x, pos_y, legacy_id
)
SELECT
    s.id as site_id,
    (SELECT id FROM equipment_categories WHERE category_code = 'AERO') as category_id,
    COALESCE(f.nb_aerotherme, 0) as quantity_total,
    CASE
        WHEN f.zone_aerotherme IS NOT NULL AND f.zone_aerotherme != ''
        THEN JSON_ARRAY(f.zone_aerotherme)
        ELSE JSON_ARRAY()
    END as zones,
    CASE
        WHEN f.type_aerotherme IS NOT NULL AND f.type_aerotherme != ''
        THEN JSON_ARRAY(f.type_aerotherme)
        ELSE JSON_ARRAY()
    END as equipment_types,
    CASE WHEN COALESCE(f.thermostat_aerotherme, 0) != 0 THEN TRUE ELSE FALSE END,
    CASE WHEN COALESCE(f.coffret_aerotherme, 0) != 0 THEN TRUE ELSE FALSE END,
    CASE WHEN COALESCE(f.coffret_horloge_aerotherme, 0) != 0 THEN TRUE ELSE FALSE END,
    f.nb_contacts_aerotherme,
    COALESCE(f.Fonctionement_aerotherme, 'unknown'),
    COALESCE(f.Maintenance_aerotherme, 'unknown'),
    f.commentaire_aero,
    f.pos_x,
    f.pos_y,
    f.id as legacy_id
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE COALESCE(f.nb_aerotherme, 0) > 0;

-- 🔧 CLIM IR Equipment
INSERT IGNORE INTO equipment_configs (
    site_id, category_id, quantity_total, zones, equipment_types,
    has_thermostat, has_electrical_panel, has_timer,
    operational_status, maintenance_status, comments, legacy_id
)
SELECT
    s.id as site_id,
    (SELECT id FROM equipment_categories WHERE category_code = 'CLIM_IR') as category_id,
    COALESCE(f.nb_clim_ir, 0) as quantity_total,
    CASE
        WHEN f.zone_clim IS NOT NULL AND f.zone_clim != ''
        THEN JSON_ARRAY(f.zone_clim)
        ELSE JSON_ARRAY()
    END as zones,
    CASE
        WHEN f.type_clim IS NOT NULL AND f.type_clim != ''
        THEN JSON_ARRAY(f.type_clim)
        ELSE JSON_ARRAY()
    END as equipment_types,
    FALSE,
    CASE WHEN COALESCE(f.coffret_clim, 0) != 0 THEN TRUE ELSE FALSE END,
    FALSE,
    COALESCE(f.Fonctionement_clim, 'unknown'),
    COALESCE(f.Maintenance_clim, 'unknown'),
    f.commentaire_clim,
    f.id as legacy_id
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE COALESCE(f.nb_clim_ir, 0) > 0;

-- 🔧 CLIM WIRE Equipment
INSERT IGNORE INTO equipment_configs (
    site_id, category_id, quantity_total, zones, equipment_types,
    has_thermostat, has_electrical_panel, has_timer,
    operational_status, maintenance_status, comments, legacy_id
)
SELECT
    s.id as site_id,
    (SELECT id FROM equipment_categories WHERE category_code = 'CLIM_WIRE') as category_id,
    COALESCE(f.nb_clim_wire, 0) as quantity_total,
    CASE
        WHEN f.zone_clim IS NOT NULL AND f.zone_clim != ''
        THEN JSON_ARRAY(f.zone_clim)
        ELSE JSON_ARRAY()
    END as zones,
    CASE
        WHEN f.type_clim IS NOT NULL AND f.type_clim != ''
        THEN JSON_ARRAY(f.type_clim)
        ELSE JSON_ARRAY()
    END as equipment_types,
    FALSE,
    CASE WHEN COALESCE(f.coffret_clim, 0) != 0 THEN TRUE ELSE FALSE END,
    FALSE,
    COALESCE(f.Fonctionement_clim, 'unknown'),
    COALESCE(f.Maintenance_clim, 'unknown'),
    f.commentaire_clim,
    f.id as legacy_id
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE COALESCE(f.nb_clim_wire, 0) > 0;

-- 🔧 ROOFTOP Equipment
INSERT IGNORE INTO equipment_configs (
    site_id, category_id, quantity_total, zones, equipment_types,
    has_thermostat, has_electrical_panel, has_timer,
    operational_status, maintenance_status, comments, legacy_id
)
SELECT
    s.id as site_id,
    (SELECT id FROM equipment_categories WHERE category_code = 'ROOFTOP') as category_id,
    COALESCE(f.nb_rooftop, 0) as quantity_total,
    JSON_ARRAY(
        COALESCE(f.zone_rooftop, ''),
        COALESCE(f.zone_rooftop_1, ''),
        COALESCE(f.zone_rooftop_2, ''),
        COALESCE(f.zone_rooftop_3, ''),
        COALESCE(f.zone_rooftop_4, '')
    ) as zones,
    JSON_ARRAY(
        COALESCE(f.type_rooftop, ''),
        COALESCE(f.type_rooftop_1, ''),
        COALESCE(f.type_rooftop_2, ''),
        COALESCE(f.type_rooftop_3, '')
    ) as equipment_types,
    CASE WHEN COALESCE(f.thermostat_rooftop, 0) != 0 THEN TRUE ELSE FALSE END,
    CASE WHEN COALESCE(f.coffret_rooftop, 0) != 0 THEN TRUE ELSE FALSE END,
    FALSE,
    COALESCE(f.Fonctionement_rooftop, 'unknown'),
    COALESCE(f.Maintenance_rooftop, 'unknown'),
    f.commentaire_rooftop,
    f.id as legacy_id
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE COALESCE(f.nb_rooftop, 0) > 0;

-- STEP 4: Populate equipment_references from marque fields
-- 🏷️ AERO References (marque_aerotherme_0 to marque_aerotherme_9)
INSERT IGNORE INTO equipment_references (config_id, reference_code, brand_name, position_index, is_active)
SELECT DISTINCT
    ec.id as config_id,
    COALESCE(
        CASE
            WHEN 0 = 0 THEN f.marque_aerotherme_0
            WHEN 0 = 1 THEN f.marque_aerotherme_1
            WHEN 0 = 2 THEN f.marque_aerotherme_2
            WHEN 0 = 3 THEN f.marque_aerotherme_3
            WHEN 0 = 4 THEN f.marque_aerotherme_4
            WHEN 0 = 5 THEN f.marque_aerotherme_5
            WHEN 0 = 6 THEN f.marque_aerotherme_6
            WHEN 0 = 7 THEN f.marque_aerotherme_7
            WHEN 0 = 8 THEN f.marque_aerotherme_8
            WHEN 0 = 9 THEN f.marque_aerotherme_9
        END, ''
    ) as reference_code,
    COALESCE(
        CASE
            WHEN 0 = 0 THEN f.marque_aerotherme_0
            WHEN 0 = 1 THEN f.marque_aerotherme_1
            WHEN 0 = 2 THEN f.marque_aerotherme_2
            WHEN 0 = 3 THEN f.marque_aerotherme_3
            WHEN 0 = 4 THEN f.marque_aerotherme_4
            WHEN 0 = 5 THEN f.marque_aerotherme_5
            WHEN 0 = 6 THEN f.marque_aerotherme_6
            WHEN 0 = 7 THEN f.marque_aerotherme_7
            WHEN 0 = 8 THEN f.marque_aerotherme_8
            WHEN 0 = 9 THEN f.marque_aerotherme_9
        END, ''
    ) as brand_name,
    0 as position_index,
    TRUE as is_active
FROM form_sql f
JOIN sites s ON s.site_name = f.site
JOIN equipment_configs ec ON ec.site_id = s.id
JOIN equipment_categories cat ON cat.id = ec.category_id
WHERE cat.category_code = 'AERO'
AND f.marque_aerotherme_0 IS NOT NULL
AND f.marque_aerotherme_0 != '';

-- Add more reference entries for positions 1-9 if needed
-- (This is a simplified version - you can expand for all positions)

-- VERIFICATION QUERIES
SELECT '🎉 EQUIPMENT TABLES POPULATED!' as status;

SELECT 'Equipment Categories:' as info, COUNT(*) as count FROM equipment_categories WHERE is_active = TRUE
UNION ALL
SELECT 'Sites:', COUNT(*) FROM sites
UNION ALL
SELECT 'Equipment Configs:', COUNT(*) FROM equipment_configs
UNION ALL
SELECT 'Equipment References:', COUNT(*) FROM equipment_references WHERE is_active = TRUE;

-- Show specific data for verification
SELECT 'Sample Equipment Configs:' as info;
SELECT
    s.site_name,
    cat.category_name,
    ec.quantity_total,
    ec.has_thermostat,
    ec.has_electrical_panel
FROM equipment_configs ec
JOIN sites s ON s.id = ec.site_id
JOIN equipment_categories cat ON cat.id = ec.category_id
LIMIT 10;

-- Check if testgtb has equipment data
SELECT 'testgtb Equipment Status:' as info;
SELECT
    s.site_name,
    cat.category_name,
    ec.quantity_total
FROM equipment_configs ec
JOIN sites s ON s.id = ec.site_id
JOIN equipment_categories cat ON cat.id = ec.category_id
WHERE s.site_name = 'testgtb';