-- ===============================================
-- ONE-TIME SYNC: Copy ALL existing data to new schema
-- This syncs your current 13 sites and all equipment/GTB data
-- ===============================================

-- 🚨 IMPORTANT: Run ADD_MISSING_FIELDS_ONLY.sql first if you haven't!

-- 1️⃣ SYNC ALL SITES from form_sql to sites
INSERT INTO sites (site_name, client_name, address, phone_primary, phone_secondary, email)
SELECT DISTINCT
    site as site_name,
    client as client_name,
    address,
    number1 as phone_primary,
    number2 as phone_secondary,
    email
FROM form_sql
WHERE site IS NOT NULL AND site != ''
ON DUPLICATE KEY UPDATE
    client_name = VALUES(client_name),
    address = VALUES(address),
    phone_primary = VALUES(phone_primary),
    phone_secondary = VALUES(phone_secondary),
    email = VALUES(email),
    updated_at = CURRENT_TIMESTAMP;

-- 2️⃣ VERIFY SITE SYNC
SELECT 'Sites synced:' as info, COUNT(*) as count FROM sites;
SELECT 'Original sites in form_sql:' as info, COUNT(DISTINCT site) as count FROM form_sql WHERE site IS NOT NULL;

-- List all synced sites for verification
SELECT site_name, client_name FROM sites ORDER BY site_name;

-- 3️⃣ SYNC EQUIPMENT DATA - AERO
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
WHERE (f.nb_aerotherme > 0 OR f.zone_aerotherme IS NOT NULL AND f.zone_aerotherme != '')
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

-- 4️⃣ SYNC GTB DATA (Critical for your testgtb site)
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
    COALESCE(f.eclairage, 0),
    -- Convert reference fields to JSON arrays
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
WHERE (f.refs IS NOT NULL OR f.sondes IS NOT NULL OR f.modules IS NOT NULL OR
       f.gazCompteur IS NOT NULL OR f.aeroeau > 0 OR f.aerogaz > 0 OR f.eclairage > 0)
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
    ref_Izit = VALUES(ref_Izit),
    updated_at = CURRENT_TIMESTAMP;

-- 5️⃣ SYNC IMAGES from image_sql to site_images
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
    module_type = VALUES(module_type),
    updated_at = CURRENT_TIMESTAMP;

-- 6️⃣ FINAL VERIFICATION
SELECT '🎉 SYNC COMPLETE! Data verification:' as status;

SELECT 'Sites synced:' as table_name, COUNT(*) as records FROM sites
UNION ALL
SELECT 'Equipment configs synced:', COUNT(*) FROM equipment_configs
UNION ALL
SELECT 'GTB configs synced:', COUNT(*) FROM gtb_site_config
UNION ALL
SELECT 'Images synced:', COUNT(*) FROM site_images;

-- Verify your specific testgtb data
SELECT 'testgtb GTB data:' as info;
SELECT
    site_name,
    sondes,
    gazCompteur,
    aeroeau,
    aerogaz,
    eclairage
FROM sites s
JOIN gtb_site_config g ON g.site_id = s.id
WHERE site_name = 'testgtb';

SELECT 'All synced sites:' as info;
SELECT site_name FROM sites ORDER BY site_name;