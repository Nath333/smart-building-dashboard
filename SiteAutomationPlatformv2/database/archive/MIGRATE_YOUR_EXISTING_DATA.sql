-- ===============================================
-- MIGRATE YOUR EXISTING DATA FROM OLD TO NEW SCHEMA
-- This migrates your actual data from form_sql to new tables
-- ===============================================

-- ⚠️ IMPORTANT: Run the ADD_MISSING_FIELDS_ONLY.sql first!

-- 1️⃣ MIGRATE SITES (if not already done)
INSERT IGNORE INTO sites (site_name, client_name, address, phone_primary, phone_secondary, email)
SELECT DISTINCT
    site,
    client,
    address,
    number1,
    number2,
    email
FROM form_sql
WHERE site IS NOT NULL AND site != '';

-- 2️⃣ MIGRATE EQUIPMENT CONFIGURATIONS
-- First, clear any existing equipment configs to avoid duplicates
-- DELETE FROM equipment_configs; -- Uncomment if you want to start fresh

-- AERO equipment
INSERT INTO equipment_configs (
    site_id, category_id, quantity_total, zones, equipment_types,
    has_thermostat, has_electrical_panel, has_timer,
    nb_contacts_aerotherme,
    operational_status, maintenance_status, comments,
    pos_x, pos_y, legacy_id
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
    CASE WHEN f.thermostat_aerotherme IS NOT NULL AND f.thermostat_aerotherme != 0 THEN TRUE ELSE FALSE END,
    CASE WHEN f.coffret_aerotherme IS NOT NULL AND f.coffret_aerotherme != 0 THEN TRUE ELSE FALSE END,
    CASE WHEN f.coffret_horloge_aerotherme IS NOT NULL AND f.coffret_horloge_aerotherme != 0 THEN TRUE ELSE FALSE END,
    f.nb_contacts_aerotherme,
    CASE
        WHEN f.Fonctionement_aerotherme = 'working' THEN 'working'
        WHEN f.Fonctionement_aerotherme = 'broken' THEN 'broken'
        WHEN f.Fonctionement_aerotherme = 'needs_maintenance' THEN 'needs_maintenance'
        ELSE 'unknown'
    END,
    CASE
        WHEN f.Maintenance_aerotherme = 'up_to_date' THEN 'up_to_date'
        WHEN f.Maintenance_aerotherme = 'overdue' THEN 'overdue'
        WHEN f.Maintenance_aerotherme = 'scheduled' THEN 'scheduled'
        ELSE 'unknown'
    END,
    f.commentaire_aero,
    f.pos_x,
    f.pos_y,
    f.id as legacy_id
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE f.nb_aerotherme > 0 OR f.zone_aerotherme IS NOT NULL
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
    legacy_id = VALUES(legacy_id);

-- CLIM_IR equipment
INSERT INTO equipment_configs (
    site_id, category_id, quantity_total, zones, equipment_types,
    has_electrical_panel, nb_telecommande_clim_smartwire,
    operational_status, maintenance_status, comments, legacy_id
)
SELECT
    s.id,
    (SELECT id FROM equipment_categories WHERE category_code = 'CLIM_IR'),
    COALESCE(f.nb_clim_ir, 0),
    CASE
        WHEN f.zone_clim IS NOT NULL AND f.zone_clim != ''
        THEN JSON_ARRAY(f.zone_clim)
        ELSE JSON_ARRAY()
    END,
    CASE
        WHEN f.type_clim IS NOT NULL AND f.type_clim != ''
        THEN JSON_ARRAY(f.type_clim)
        ELSE JSON_ARRAY()
    END,
    CASE WHEN f.coffret_clim IS NOT NULL AND f.coffret_clim != 0 THEN TRUE ELSE FALSE END,
    f.nb_telecommande_clim_smartwire,
    CASE
        WHEN f.Fonctionement_clim = 'working' THEN 'working'
        WHEN f.Fonctionement_clim = 'broken' THEN 'broken'
        WHEN f.Fonctionement_clim = 'needs_maintenance' THEN 'needs_maintenance'
        ELSE 'unknown'
    END,
    CASE
        WHEN f.Maintenance_clim = 'up_to_date' THEN 'up_to_date'
        WHEN f.Maintenance_clim = 'overdue' THEN 'overdue'
        WHEN f.Maintenance_clim = 'scheduled' THEN 'scheduled'
        ELSE 'unknown'
    END,
    f.commentaire_clim,
    f.id
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE f.nb_clim_ir > 0
ON DUPLICATE KEY UPDATE
    quantity_total = VALUES(quantity_total),
    zones = VALUES(zones),
    equipment_types = VALUES(equipment_types),
    has_electrical_panel = VALUES(has_electrical_panel),
    nb_telecommande_clim_smartwire = VALUES(nb_telecommande_clim_smartwire),
    operational_status = VALUES(operational_status),
    maintenance_status = VALUES(maintenance_status),
    comments = VALUES(comments);

-- CLIM_WIRE equipment
INSERT INTO equipment_configs (
    site_id, category_id, quantity_total, zones, equipment_types,
    has_electrical_panel, nb_telecommande_clim_wire,
    operational_status, maintenance_status, comments, legacy_id
)
SELECT
    s.id,
    (SELECT id FROM equipment_categories WHERE category_code = 'CLIM_WIRE'),
    COALESCE(f.nb_clim_wire, 0),
    CASE
        WHEN f.zone_clim IS NOT NULL AND f.zone_clim != ''
        THEN JSON_ARRAY(f.zone_clim)
        ELSE JSON_ARRAY()
    END,
    CASE
        WHEN f.type_clim IS NOT NULL AND f.type_clim != ''
        THEN JSON_ARRAY(f.type_clim)
        ELSE JSON_ARRAY()
    END,
    CASE WHEN f.coffret_clim IS NOT NULL AND f.coffret_clim != 0 THEN TRUE ELSE FALSE END,
    f.nb_telecommande_clim_wire,
    CASE
        WHEN f.Fonctionement_clim = 'working' THEN 'working'
        WHEN f.Fonctionement_clim = 'broken' THEN 'broken'
        WHEN f.Fonctionement_clim = 'needs_maintenance' THEN 'needs_maintenance'
        ELSE 'unknown'
    END,
    CASE
        WHEN f.Maintenance_clim = 'up_to_date' THEN 'up_to_date'
        WHEN f.Maintenance_clim = 'overdue' THEN 'overdue'
        WHEN f.Maintenance_clim = 'scheduled' THEN 'scheduled'
        ELSE 'unknown'
    END,
    f.commentaire_clim,
    f.id
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE f.nb_clim_wire > 0
ON DUPLICATE KEY UPDATE
    quantity_total = VALUES(quantity_total),
    zones = VALUES(zones),
    equipment_types = VALUES(equipment_types),
    has_electrical_panel = VALUES(has_electrical_panel),
    nb_telecommande_clim_wire = VALUES(nb_telecommande_clim_wire),
    operational_status = VALUES(operational_status),
    maintenance_status = VALUES(maintenance_status),
    comments = VALUES(comments);

-- ROOFTOP equipment
INSERT INTO equipment_configs (
    site_id, category_id, quantity_total, zones, equipment_types,
    has_thermostat, has_electrical_panel, telecomande_modbus_rooftop,
    zone_rooftop_1, zone_rooftop_2, zone_rooftop_3, zone_rooftop_4,
    type_rooftop_1, type_rooftop_2, type_rooftop_3,
    operational_status, maintenance_status, comments, legacy_id
)
SELECT
    s.id,
    (SELECT id FROM equipment_categories WHERE category_code = 'ROOFTOP'),
    COALESCE(f.nb_rooftop, 0),
    CASE
        WHEN f.zone_rooftop IS NOT NULL AND f.zone_rooftop != ''
        THEN JSON_ARRAY(f.zone_rooftop)
        ELSE JSON_ARRAY()
    END,
    CASE
        WHEN f.type_rooftop IS NOT NULL AND f.type_rooftop != ''
        THEN JSON_ARRAY(f.type_rooftop)
        ELSE JSON_ARRAY()
    END,
    CASE WHEN f.thermostat_rooftop IS NOT NULL AND f.thermostat_rooftop != 0 THEN TRUE ELSE FALSE END,
    CASE WHEN f.coffret_rooftop IS NOT NULL AND f.coffret_rooftop != 0 THEN TRUE ELSE FALSE END,
    CASE WHEN f.telecomande_modbus_rooftop IS NOT NULL AND f.telecomande_modbus_rooftop != 0 THEN TRUE ELSE FALSE END,
    f.zone_rooftop_1,
    f.zone_rooftop_2,
    f.zone_rooftop_3,
    f.zone_rooftop_4,
    f.type_rooftop_1,
    f.type_rooftop_2,
    f.type_rooftop_3,
    CASE
        WHEN f.Fonctionement_rooftop = 'working' THEN 'working'
        WHEN f.Fonctionement_rooftop = 'broken' THEN 'broken'
        WHEN f.Fonctionement_rooftop = 'needs_maintenance' THEN 'needs_maintenance'
        ELSE 'unknown'
    END,
    CASE
        WHEN f.Maintenance_rooftop = 'up_to_date' THEN 'up_to_date'
        WHEN f.Maintenance_rooftop = 'overdue' THEN 'overdue'
        WHEN f.Maintenance_rooftop = 'scheduled' THEN 'scheduled'
        ELSE 'unknown'
    END,
    f.commentaire_rooftop,
    f.id
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE f.nb_rooftop > 0 OR f.zone_rooftop IS NOT NULL
ON DUPLICATE KEY UPDATE
    quantity_total = VALUES(quantity_total),
    zones = VALUES(zones),
    equipment_types = VALUES(equipment_types),
    has_thermostat = VALUES(has_thermostat),
    has_electrical_panel = VALUES(has_electrical_panel),
    telecomande_modbus_rooftop = VALUES(telecomande_modbus_rooftop),
    zone_rooftop_1 = VALUES(zone_rooftop_1),
    zone_rooftop_2 = VALUES(zone_rooftop_2),
    zone_rooftop_3 = VALUES(zone_rooftop_3),
    zone_rooftop_4 = VALUES(zone_rooftop_4),
    type_rooftop_1 = VALUES(type_rooftop_1),
    type_rooftop_2 = VALUES(type_rooftop_2),
    type_rooftop_3 = VALUES(type_rooftop_3),
    operational_status = VALUES(operational_status),
    maintenance_status = VALUES(maintenance_status),
    comments = VALUES(comments);

-- LIGHTING equipment
INSERT INTO equipment_configs (
    site_id, category_id, quantity_total, quantity_ir,
    has_electrical_panel, has_timer,
    comments, legacy_id
)
SELECT
    s.id,
    (SELECT id FROM equipment_categories WHERE category_code = 'LIGHTING'),
    COALESCE(f.Eclairage_interieur, 0),
    COALESCE(f.Eclairage_exterieur, 0),
    CASE WHEN f.Eclairage_contacteur IS NOT NULL AND f.Eclairage_contacteur != 0 THEN TRUE ELSE FALSE END,
    CASE WHEN f.Eclairage_horloge IS NOT NULL AND f.Eclairage_horloge != 0 THEN TRUE ELSE FALSE END,
    f.commentaire_eclairage,
    f.id
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE f.Eclairage_interieur > 0 OR f.Eclairage_exterieur > 0 OR f.commentaire_eclairage IS NOT NULL
ON DUPLICATE KEY UPDATE
    quantity_total = VALUES(quantity_total),
    quantity_ir = VALUES(quantity_ir),
    has_electrical_panel = VALUES(has_electrical_panel),
    has_timer = VALUES(has_timer),
    comments = VALUES(comments);

-- 3️⃣ MIGRATE EQUIPMENT REFERENCES
-- Helper function to create references from marque fields

-- AERO references
INSERT INTO equipment_references (config_id, reference_code, brand_name, position_index, is_active)
SELECT
    ec.id,
    CASE
        WHEN n.pos = 0 THEN f.marque_aerotherme_0
        WHEN n.pos = 1 THEN f.marque_aerotherme_1
        WHEN n.pos = 2 THEN f.marque_aerotherme_2
        WHEN n.pos = 3 THEN f.marque_aerotherme_3
        WHEN n.pos = 4 THEN f.marque_aerotherme_4
        WHEN n.pos = 5 THEN f.marque_aerotherme_5
        WHEN n.pos = 6 THEN f.marque_aerotherme_6
        WHEN n.pos = 7 THEN f.marque_aerotherme_7
        WHEN n.pos = 8 THEN f.marque_aerotherme_8
        WHEN n.pos = 9 THEN f.marque_aerotherme_9
    END as reference_code,
    'Unknown' as brand_name,
    n.pos,
    TRUE
FROM form_sql f
JOIN sites s ON s.site_name = f.site
JOIN equipment_configs ec ON ec.site_id = s.id
    AND ec.category_id = (SELECT id FROM equipment_categories WHERE category_code = 'AERO')
CROSS JOIN (
    SELECT 0 as pos UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
) n
WHERE CASE
    WHEN n.pos = 0 THEN f.marque_aerotherme_0
    WHEN n.pos = 1 THEN f.marque_aerotherme_1
    WHEN n.pos = 2 THEN f.marque_aerotherme_2
    WHEN n.pos = 3 THEN f.marque_aerotherme_3
    WHEN n.pos = 4 THEN f.marque_aerotherme_4
    WHEN n.pos = 5 THEN f.marque_aerotherme_5
    WHEN n.pos = 6 THEN f.marque_aerotherme_6
    WHEN n.pos = 7 THEN f.marque_aerotherme_7
    WHEN n.pos = 8 THEN f.marque_aerotherme_8
    WHEN n.pos = 9 THEN f.marque_aerotherme_9
END IS NOT NULL AND CASE
    WHEN n.pos = 0 THEN f.marque_aerotherme_0
    WHEN n.pos = 1 THEN f.marque_aerotherme_1
    WHEN n.pos = 2 THEN f.marque_aerotherme_2
    WHEN n.pos = 3 THEN f.marque_aerotherme_3
    WHEN n.pos = 4 THEN f.marque_aerotherme_4
    WHEN n.pos = 5 THEN f.marque_aerotherme_5
    WHEN n.pos = 6 THEN f.marque_aerotherme_6
    WHEN n.pos = 7 THEN f.marque_aerotherme_7
    WHEN n.pos = 8 THEN f.marque_aerotherme_8
    WHEN n.pos = 9 THEN f.marque_aerotherme_9
END != '';

-- 4️⃣ MIGRATE GTB CONFIGURATIONS
INSERT INTO gtb_site_config (
    site_id, refs, sondes, sondesPresentes, gazCompteur, Izit, modules,
    aeroeau, aerogaz, clim_filaire_simple, clim_filaire_groupe,
    Comptage_Froid, Comptage_Eclairage, eclairage,
    ref_aeroeau, ref_aerogaz, ref_clim_ir, ref_clim_filaire_simple,
    ref_clim_filaire_groupe, ref_rooftop, ref_Comptage_Froid,
    ref_Comptage_Eclairage, ref_eclairage, ref_sondes,
    ref_sondesPresentes, ref_gazCompteur, ref_Izit
)
SELECT
    s.id,
    COALESCE(f.refs, 0),
    CASE
        WHEN f.sondes = 'oui' OR f.sondes = '1' OR f.sondes = 1 THEN 1
        WHEN f.sondes IS NOT NULL AND f.sondes != '' AND f.sondes != 'non' AND f.sondes != '0' THEN CAST(f.sondes AS UNSIGNED)
        ELSE 0
    END,
    COALESCE(f.sondesPresentes, 0),
    CASE
        WHEN f.gazCompteur = 'oui' OR f.gazCompteur = '1' THEN 1
        WHEN f.gazCompteur IS NOT NULL AND f.gazCompteur != '' AND f.gazCompteur != 'non' AND f.gazCompteur != '0' THEN CAST(f.gazCompteur AS UNSIGNED)
        ELSE 0
    END,
    COALESCE(f.Izit, 0),
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
    COALESCE(f.eclairage, 0),
    CASE WHEN f.ref_aeroeau IS NOT NULL AND f.ref_aeroeau != '' THEN JSON_ARRAY(f.ref_aeroeau) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_aerogaz IS NOT NULL AND f.ref_aerogaz != '' THEN JSON_ARRAY(f.ref_aerogaz) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_clim_ir IS NOT NULL AND f.ref_clim_ir != '' THEN JSON_ARRAY(f.ref_clim_ir) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_clim_filaire_simple IS NOT NULL AND f.ref_clim_filaire_simple != '' THEN JSON_ARRAY(f.ref_clim_filaire_simple) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_clim_filaire_groupe IS NOT NULL AND f.ref_clim_filaire_groupe != '' THEN JSON_ARRAY(f.ref_clim_filaire_groupe) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_rooftop IS NOT NULL AND f.ref_rooftop != '' THEN JSON_ARRAY(f.ref_rooftop) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_Comptage_Froid IS NOT NULL AND f.ref_Comptage_Froid != '' THEN JSON_ARRAY(f.ref_Comptage_Froid) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_Comptage_Eclairage IS NOT NULL AND f.ref_Comptage_Eclairage != '' THEN JSON_ARRAY(f.ref_Comptage_Eclairage) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_eclairage IS NOT NULL AND f.ref_eclairage != '' THEN JSON_ARRAY(f.ref_eclairage) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_sondes IS NOT NULL AND f.ref_sondes != '' THEN JSON_ARRAY(f.ref_sondes) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_sondesPresentes IS NOT NULL AND f.ref_sondesPresentes != '' THEN JSON_ARRAY(f.ref_sondesPresentes) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_gazCompteur IS NOT NULL AND f.ref_gazCompteur != '' THEN JSON_ARRAY(f.ref_gazCompteur) ELSE JSON_ARRAY() END,
    CASE WHEN f.ref_Izit IS NOT NULL AND f.ref_Izit != '' THEN JSON_ARRAY(f.ref_Izit) ELSE JSON_ARRAY() END
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE f.refs IS NOT NULL OR f.sondes IS NOT NULL OR f.modules IS NOT NULL OR f.gazCompteur IS NOT NULL
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
    ref_aeroeau = VALUES(ref_aeroeau),
    ref_aerogaz = VALUES(ref_aerogaz),
    ref_clim_ir = VALUES(ref_clim_ir),
    ref_clim_filaire_simple = VALUES(ref_clim_filaire_simple),
    ref_clim_filaire_groupe = VALUES(ref_clim_filaire_groupe),
    ref_rooftop = VALUES(ref_rooftop),
    ref_Comptage_Froid = VALUES(ref_Comptage_Froid),
    ref_Comptage_Eclairage = VALUES(ref_Comptage_Eclairage),
    ref_eclairage = VALUES(ref_eclairage),
    ref_sondes = VALUES(ref_sondes),
    ref_sondesPresentes = VALUES(ref_sondesPresentes),
    ref_gazCompteur = VALUES(ref_gazCompteur),
    ref_Izit = VALUES(ref_Izit);

-- 5️⃣ MIGRATE IMAGES FROM image_sql TO site_images
INSERT INTO site_images (
    site_id, image_type, image_category, image_title,
    image_url_viewer, image_url_thumb, image_url_medium, delete_url,
    original_width, original_height, shapes_data, card_id,
    x, y, label, image_url, comments, module_type
)
SELECT
    s.id,
    CASE
        WHEN i.type = 'visual_plan' THEN 'visual_plan'
        WHEN i.type = 'surface_plan' THEN 'surface_plan'
        WHEN i.type = 'gtb_plan' THEN 'gtb_plan'
        ELSE 'equipment_photo'
    END,
    i.type,
    i.title,
    i.url_viewer,
    i.url_thumb,
    i.url_medium,
    i.delete_url,
    i.width,
    i.height,
    CASE WHEN i.shapes IS NOT NULL AND i.shapes != '' THEN CAST(i.shapes AS JSON) ELSE NULL END,
    i.card_id,
    i.x,
    i.y,
    i.label,
    i.image_url,
    i.comments,
    i.module_type
FROM image_sql i
JOIN sites s ON s.site_name = i.site
ON DUPLICATE KEY UPDATE
    image_type = VALUES(image_type),
    image_category = VALUES(image_category),
    image_title = VALUES(image_title),
    image_url_viewer = VALUES(image_url_viewer),
    image_url_thumb = VALUES(image_url_thumb),
    image_url_medium = VALUES(image_url_medium),
    delete_url = VALUES(delete_url),
    original_width = VALUES(original_width),
    original_height = VALUES(original_height),
    shapes_data = VALUES(shapes_data),
    card_id = VALUES(card_id),
    x = VALUES(x),
    y = VALUES(y),
    label = VALUES(label),
    image_url = VALUES(image_url),
    comments = VALUES(comments),
    module_type = VALUES(module_type);

-- 6️⃣ VERIFICATION QUERIES
SELECT 'Data migration completed!' as status;

SELECT
    'Sites migrated:' as info,
    COUNT(*) as count
FROM sites;

SELECT
    'Equipment configs migrated:' as info,
    COUNT(*) as count
FROM equipment_configs;

SELECT
    'GTB configs migrated:' as info,
    COUNT(*) as count
FROM gtb_site_config;

SELECT
    'Images migrated:' as info,
    COUNT(*) as count
FROM site_images;

-- Show sample data for verification
SELECT
    s.site_name,
    ec.quantity_total,
    cat.category_name,
    ec.comments
FROM sites s
JOIN equipment_configs ec ON ec.site_id = s.id
JOIN equipment_categories cat ON cat.id = ec.category_id
LIMIT 5;