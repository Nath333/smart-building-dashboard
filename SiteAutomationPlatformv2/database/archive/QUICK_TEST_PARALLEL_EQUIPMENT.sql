-- ===============================================
-- QUICK TEST FOR PARALLEL EQUIPMENT ENDPOINTS
-- Just adds minimal data to test without affecting existing system
-- ===============================================

-- 1. Ensure equipment categories exist (needed for foreign keys)
INSERT IGNORE INTO equipment_categories (category_code, category_name, description, is_active) VALUES
('AERO', 'Aérothermes', 'Systèmes de chauffage aérothermes', TRUE),
('CLIM_IR', 'Climatisation IR', 'Climatisation avec télécommande infrarouge', TRUE),
('CLIM_WIRE', 'Climatisation Filaire', 'Climatisation avec commande filaire', TRUE),
('ROOFTOP', 'Rooftop', 'Unités de traitement d\'air en toiture', TRUE),
('LIGHTING', 'Éclairage', 'Systèmes d\'éclairage intérieur et extérieur', TRUE);

-- 2. Ensure testgtb site exists in sites table (for testing)
INSERT IGNORE INTO sites (site_name, client_name, address, phone_primary, phone_secondary, email)
SELECT 'testgtb', 'Test', '123 Test St', '123', '456', 'test@example.com'
WHERE NOT EXISTS (SELECT 1 FROM sites WHERE site_name = 'testgtb');

-- 3. Add some test equipment config for testgtb (if it doesn't exist)
INSERT IGNORE INTO equipment_configs (
    site_id, category_id, quantity_total, zones, equipment_types,
    has_thermostat, has_electrical_panel, has_timer,
    operational_status, maintenance_status, comments, legacy_id
)
SELECT
    s.id as site_id,
    (SELECT id FROM equipment_categories WHERE category_code = 'AERO') as category_id,
    3 as quantity_total,
    JSON_ARRAY('Zone Test') as zones,
    JSON_ARRAY('Type Test') as equipment_types,
    TRUE,
    TRUE,
    FALSE,
    'working',
    'up_to_date',
    'Test equipment for parallel endpoint testing',
    999 as legacy_id
FROM sites s
WHERE s.site_name = 'testgtb'
AND NOT EXISTS (
    SELECT 1 FROM equipment_configs ec
    JOIN sites s2 ON s2.id = ec.site_id
    WHERE s2.site_name = 'testgtb'
);

-- 4. Add GTB config for testgtb (matching your original data)
INSERT IGNORE INTO gtb_site_config (
    site_id, refs, sondes, sondesPresentes, gazCompteur, Izit, modules,
    aeroeau, aerogaz, clim_filaire_simple, clim_filaire_groupe,
    Comptage_Froid, Comptage_Eclairage, eclairage
)
SELECT
    s.id as site_id,
    0, 1, 0, 1, 0, 3, 2, 1, 0, 0, 0, 0, 3
FROM sites s
WHERE s.site_name = 'testgtb'
AND NOT EXISTS (
    SELECT 1 FROM gtb_site_config g
    JOIN sites s2 ON s2.id = g.site_id
    WHERE s2.site_name = 'testgtb'
);

-- 5. Verification
SELECT '🧪 PARALLEL TEST DATA READY' as status;

SELECT 'Equipment Categories:' as info, COUNT(*) as count FROM equipment_categories WHERE is_active = TRUE
UNION ALL
SELECT 'Sites with testgtb:', COUNT(*) FROM sites WHERE site_name = 'testgtb'
UNION ALL
SELECT 'Equipment configs for testgtb:', COUNT(*) FROM equipment_configs ec JOIN sites s ON s.id = ec.site_id WHERE s.site_name = 'testgtb'
UNION ALL
SELECT 'GTB configs for testgtb:', COUNT(*) FROM gtb_site_config g JOIN sites s ON s.id = g.site_id WHERE s.site_name = 'testgtb';

-- Show what we have for testgtb
SELECT 'testgtb Equipment Data:' as info;
SELECT
    cat.category_name,
    ec.quantity_total,
    ec.has_thermostat,
    ec.has_electrical_panel,
    ec.operational_status
FROM equipment_configs ec
JOIN sites s ON s.id = ec.site_id
JOIN equipment_categories cat ON cat.id = ec.category_id
WHERE s.site_name = 'testgtb';

SELECT 'testgtb GTB Data:' as info;
SELECT sondes, gazCompteur, aeroeau, aerogaz, eclairage
FROM gtb_site_config g
JOIN sites s ON s.id = g.site_id
WHERE s.site_name = 'testgtb';