-- ===============================================
-- COMPLETE SETUP FOR EMPTY NORMALIZED TABLES
-- This handles your situation where you have the tables but they're empty
-- ===============================================

-- 🚨 IMPORTANT: This assumes you have the tables but they're empty
-- If tables don't exist, run ADD_MISSING_FIELDS_ONLY.sql first

-- 1️⃣ POPULATE EQUIPMENT CATEGORIES (Required for equipment_configs)
INSERT INTO equipment_categories (category_code, category_name, description, is_active) VALUES
('AERO', 'Aérothermes', 'Systèmes de chauffage aérothermes', TRUE),
('CLIM_IR', 'Climatisation IR', 'Climatisation avec télécommande infrarouge', TRUE),
('CLIM_WIRE', 'Climatisation Filaire', 'Climatisation avec commande filaire', TRUE),
('ROOFTOP', 'Rooftop', 'Unités de traitement d\'air en toiture', TRUE),
('LIGHTING', 'Éclairage', 'Systèmes d\'éclairage intérieur et extérieur', TRUE)
ON DUPLICATE KEY UPDATE
    category_name = VALUES(category_name),
    description = VALUES(description),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;

-- 2️⃣ SYNC SITES from form_sql to sites (if not already done)
INSERT INTO sites (site_name, client_name, address, phone_primary, phone_secondary, email)
SELECT DISTINCT
    site as site_name,
    client as client_name,
    address,
    number1 as phone_primary,
    number2 as phone_secondary,
    email
FROM form_sql
WHERE site IS NOT NULL AND site != '' AND site != 'unknown'
ON DUPLICATE KEY UPDATE
    client_name = VALUES(client_name),
    address = VALUES(address),
    phone_primary = VALUES(phone_primary),
    phone_secondary = VALUES(phone_secondary),
    email = VALUES(email),
    updated_at = CURRENT_TIMESTAMP;

-- 3️⃣ SYNC EQUIPMENT CONFIGS for AERO (only if data exists)
INSERT INTO equipment_configs (
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
WHERE (COALESCE(f.nb_aerotherme, 0) > 0 OR (f.zone_aerotherme IS NOT NULL AND f.zone_aerotherme != ''))
AND (SELECT id FROM equipment_categories WHERE category_code = 'AERO') IS NOT NULL
ON DUPLICATE KEY UPDATE
    quantity_total = VALUES(quantity_total),
    zones = VALUES(zones),
    equipment_types = VALUES(equipment_types),
    has_thermostat = VALUES(has_thermostat),
    has_electrical_panel = VALUES(has_electrical_panel),
    has_timer = VALUES(has_timer),
    nb_contacts_aerotherme = VALUES(nb_contacts_aerotherme),
    operational_status = VALUES(operational_status),
    maintenance_status = VALUES(maintenance_status),
    comments = VALUES(comments),
    pos_x = VALUES(pos_x),
    pos_y = VALUES(pos_y),
    legacy_id = VALUES(legacy_id),
    updated_at = CURRENT_TIMESTAMP;

-- 4️⃣ SYNC EQUIPMENT CONFIGS for CLIM_IR (only if data exists)
INSERT INTO equipment_configs (
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
    FALSE, -- no thermostat for clim
    CASE WHEN COALESCE(f.coffret_clim, 0) != 0 THEN TRUE ELSE FALSE END,
    FALSE, -- no timer for clim
    COALESCE(f.Fonctionement_clim, 'unknown'),
    COALESCE(f.Maintenance_clim, 'unknown'),
    f.commentaire_clim,
    f.id as legacy_id
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE COALESCE(f.nb_clim_ir, 0) > 0
AND (SELECT id FROM equipment_categories WHERE category_code = 'CLIM_IR') IS NOT NULL
ON DUPLICATE KEY UPDATE
    quantity_total = VALUES(quantity_total),
    zones = VALUES(zones),
    equipment_types = VALUES(equipment_types),
    has_electrical_panel = VALUES(has_electrical_panel),
    operational_status = VALUES(operational_status),
    maintenance_status = VALUES(maintenance_status),
    comments = VALUES(comments),
    legacy_id = VALUES(legacy_id),
    updated_at = CURRENT_TIMESTAMP;

-- 5️⃣ SYNC GTB DATA (Critical for your testgtb site)
INSERT INTO gtb_site_config (
    site_id, refs, sondes, sondesPresentes, gazCompteur, Izit, modules,
    aeroeau, aerogaz, clim_filaire_simple, clim_filaire_groupe,
    Comptage_Froid, Comptage_Eclairage, eclairage
)
SELECT
    s.id as site_id,
    COALESCE(f.refs, 0),
    -- Handle sondes: "oui"/"non" or numeric
    CASE
        WHEN f.sondes = 'oui' OR f.sondes = '1' THEN 1
        WHEN f.sondes IS NOT NULL AND f.sondes != '' AND f.sondes != 'non' AND f.sondes != '0'
        THEN CAST(f.sondes AS UNSIGNED)
        ELSE 0
    END,
    COALESCE(f.sondesPresentes, 0),
    -- Handle gazCompteur: "oui"/"non" or numeric
    CASE
        WHEN f.gazCompteur = 'oui' OR f.gazCompteur = '1' THEN 1
        WHEN f.gazCompteur IS NOT NULL AND f.gazCompteur != '' AND f.gazCompteur != 'non' AND f.gazCompteur != '0'
        THEN CAST(f.gazCompteur AS UNSIGNED)
        ELSE 0
    END,
    COALESCE(f.Izit, 0),
    -- Handle modules: count comma-separated values
    CASE
        WHEN f.modules IS NOT NULL AND f.modules != '' THEN
            (LENGTH(f.modules) - LENGTH(REPLACE(f.modules, ',', '')) + 1)
        ELSE 0
    END,
    COALESCE(f.aeroeau, 0),
    COALESCE(f.aerogaz, 0),
    COALESCE(f.clim_filaire_simple, 0),
    COALESCE(f.clim_filaire_groupe, 0),
    COALESCE(f.Comptage_Froid, 0),
    COALESCE(f.Comptage_Eclairage, 0),
    COALESCE(f.eclairage, 0)
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE (f.refs IS NOT NULL OR f.sondes IS NOT NULL OR f.modules IS NOT NULL OR
       f.gazCompteur IS NOT NULL OR COALESCE(f.aeroeau, 0) > 0 OR
       COALESCE(f.aerogaz, 0) > 0 OR COALESCE(f.eclairage, 0) > 0)
ON DUPLICATE KEY UPDATE
    refs = VALUES(refs),
    sondes = VALUES(sondes),
    sondesPresentes = VALUES(sondesPresentes),
    gazCompteur = VALUES(gazCompteur),
    Izit = VALUES(Izit),
    modules = VALUES(modules),
    aeroeau = VALUES(aeroeau),
    aerogaz = VALUES(aerogaz),
    clim_filaire_simple = VALUES(clim_filaire_simple),
    clim_filaire_groupe = VALUES(clim_filaire_groupe),
    Comptage_Froid = VALUES(Comptage_Froid),
    Comptage_Eclairage = VALUES(Comptage_Eclairage),
    eclairage = VALUES(eclairage),
    updated_at = CURRENT_TIMESTAMP;

-- 6️⃣ FINAL VERIFICATION
SELECT '🎉 COMPLETE SETUP FINISHED! Verification:' as status;

SELECT 'Sites synced:' as table_name, COUNT(*) as records FROM sites
UNION ALL
SELECT 'Equipment categories:', COUNT(*) FROM equipment_categories WHERE is_active = TRUE
UNION ALL
SELECT 'Equipment configs:', COUNT(*) FROM equipment_configs
UNION ALL
SELECT 'GTB configs:', COUNT(*) FROM gtb_site_config;

-- Verify your specific testgtb data
SELECT 'testgtb GTB data verification:' as info;
SELECT
    site_name,
    sondes,
    gazCompteur,
    modules,
    aeroeau,
    aerogaz,
    eclairage
FROM sites s
LEFT JOIN gtb_site_config g ON g.site_id = s.id
WHERE site_name = 'testgtb';

-- Show all synced sites
SELECT 'All synced sites:' as info;
SELECT site_name, client_name FROM sites ORDER BY site_name;

-- Show equipment categories created
SELECT 'Equipment categories available:' as info;
SELECT category_code, category_name FROM equipment_categories WHERE is_active = TRUE;