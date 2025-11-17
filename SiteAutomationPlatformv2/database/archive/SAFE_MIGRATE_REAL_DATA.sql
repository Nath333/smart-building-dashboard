-- ===============================================
-- SAFE MIGRATION: REAL DATA TO PARALLEL ENDPOINTS
-- This COPIES your real data to normalized schema WITHOUT touching original
-- ===============================================

-- 🛡️ SAFETY GUARANTEES:
-- ✅ Only COPIES data (never deletes from original tables)
-- ✅ Uses separate normalized tables (sites, equipment_configs, gtb_site_config)
-- ✅ Original form_sql and image_sql completely untouched
-- ✅ If anything goes wrong, your original data is 100% safe

-- ===============================================
-- STEP 1: COPY ALL REAL SITES (from form_sql → sites)
-- ===============================================
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

-- ===============================================
-- STEP 2: COPY REAL GTB DATA (form_sql → gtb_site_config)
-- ===============================================
INSERT INTO gtb_site_config (
    site_id, refs, sondes, sondesPresentes, gazCompteur, Izit, modules,
    aeroeau, aerogaz, clim_filaire_simple, clim_filaire_groupe,
    Comptage_Froid, Comptage_Eclairage, eclairage
)
SELECT
    s.id as site_id,
    COALESCE(f.refs, 0),
    -- Smart conversion: "oui"/"non" → 1/0, numbers stay numbers
    CASE
        WHEN f.sondes = 'oui' OR f.sondes = '1' THEN 1
        WHEN f.sondes IS NOT NULL AND f.sondes != '' AND f.sondes != 'non' AND f.sondes != '0'
        THEN CAST(f.sondes AS UNSIGNED)
        ELSE 0
    END,
    COALESCE(f.sondesPresentes, 0),
    -- Handle gazCompteur: "oui" → 1, everything else → 0 or number
    CASE
        WHEN f.gazCompteur = 'oui' OR f.gazCompteur = '1' THEN 1
        WHEN f.gazCompteur IS NOT NULL AND f.gazCompteur != '' AND f.gazCompteur != 'non' AND f.gazCompteur != '0'
        THEN CAST(f.gazCompteur AS UNSIGNED)
        ELSE 0
    END,
    COALESCE(f.Izit, 0),
    -- Count modules: "aeroeau, aerogaz, eclairage" → 3
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

-- ===============================================
-- STEP 3: COPY REAL EQUIPMENT DATA (form_sql → equipment_configs)
-- ===============================================

-- 🔧 AERO Equipment (where nb_aerotherme > 0)
INSERT INTO equipment_configs (
    site_id, category_id, quantity_total, zones, equipment_types,
    has_thermostat, has_electrical_panel, has_timer,
    nb_contacts_aerotherme, operational_status, maintenance_status,
    comments, pos_x, pos_y
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
    f.pos_y
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE COALESCE(f.nb_aerotherme, 0) > 0
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
    updated_at = CURRENT_TIMESTAMP;

-- 🔧 CLIM IR Equipment (where nb_clim_ir > 0)
INSERT INTO equipment_configs (
    site_id, category_id, quantity_total, zones, equipment_types,
    has_thermostat, has_electrical_panel, operational_status, maintenance_status, comments
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
    FALSE, -- clim doesn't have thermostat
    CASE WHEN COALESCE(f.coffret_clim, 0) != 0 THEN TRUE ELSE FALSE END,
    COALESCE(f.Fonctionement_clim, 'unknown'),
    COALESCE(f.Maintenance_clim, 'unknown'),
    f.commentaire_clim
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
    updated_at = CURRENT_TIMESTAMP;

-- ===============================================
-- STEP 4: VERIFICATION & COMPARISON
-- ===============================================
SELECT '🎉 REAL DATA MIGRATION COMPLETE!' as status;

-- Show migration summary
SELECT 'Migration Summary:' as info;
SELECT 'Sites migrated:' as table_name, COUNT(*) as records FROM sites
UNION ALL
SELECT 'GTB configs migrated:', COUNT(*) FROM gtb_site_config
UNION ALL
SELECT 'Equipment configs migrated:', COUNT(*) FROM equipment_configs;

-- ✅ VERIFY YOUR TESTGTB DATA (CRITICAL TEST)
SELECT '🧪 TESTGTB VERIFICATION (Original vs Parallel):' as test;

-- Show testgtb GTB data in parallel schema
SELECT 'testgtb GTB (PARALLEL SCHEMA):' as source;
SELECT
    'Parallel Schema' as schema_type,
    sondes,
    gazCompteur,
    modules,
    aeroeau,
    aerogaz,
    eclairage
FROM gtb_site_config g
JOIN sites s ON s.id = g.site_id
WHERE s.site_name = 'testgtb';

-- Show what we can compare with from original (just the key fields)
SELECT 'Compare with Original (form_sql):' as note;
SELECT 'Run this to see original:' as instruction;
SELECT 'curl -X POST http://localhost:4001/get-page2 -H "Content-Type: application/json" -d \'{"site":"testgtb"}\' | grep sondes' as command;

-- Show all sites with GTB data for verification
SELECT 'All sites with GTB data in parallel schema:' as info;
SELECT s.site_name, g.sondes, g.gazCompteur, g.aeroeau, g.aerogaz, g.eclairage
FROM gtb_site_config g
JOIN sites s ON s.id = g.site_id
ORDER BY s.site_name;