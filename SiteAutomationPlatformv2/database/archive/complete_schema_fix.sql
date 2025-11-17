-- ===============================================
-- COMPLETE SCHEMA FIX - ALL MISSING FIELDS
-- ===============================================

-- 1️⃣ Add missing fields to equipment_configs
ALTER TABLE equipment_configs ADD COLUMN nb_contacts_aerotherme INT DEFAULT 0;
ALTER TABLE equipment_configs ADD COLUMN nb_telecommande_clim_smartwire INT DEFAULT 0;
ALTER TABLE equipment_configs ADD COLUMN nb_telecommande_clim_wire INT DEFAULT 0;
ALTER TABLE equipment_configs ADD COLUMN telecomande_modbus_rooftop BOOLEAN DEFAULT FALSE;

-- Rooftop specific zones and types
ALTER TABLE equipment_configs ADD COLUMN zone_rooftop_1 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN zone_rooftop_2 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN zone_rooftop_3 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN zone_rooftop_4 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN type_rooftop_1 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN type_rooftop_2 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN type_rooftop_3 VARCHAR(100);

-- Position coordinates
ALTER TABLE equipment_configs ADD COLUMN pos_x INT;
ALTER TABLE equipment_configs ADD COLUMN pos_y INT;

-- 2️⃣ Add missing equipment categories
INSERT INTO equipment_categories (category_code, category_name, description) VALUES
('AERO_EAU', 'Aérotherme Eau', 'Systèmes de chauffage aérotherme à eau'),
('AERO_GAZ', 'Aérotherme Gaz', 'Systèmes de chauffage aérotherme à gaz'),
('CLIM_FILAIRE_SIMPLE', 'Climatisation Filaire Simple', 'Climatisation filaire individuelle'),
('CLIM_FILAIRE_GROUPE', 'Climatisation Filaire Groupe', 'Climatisation filaire en groupe'),
('COMPTAGE_FROID', 'Comptage Froid', 'Systèmes de comptage de froid'),
('COMPTAGE_ECLAIRAGE', 'Comptage Éclairage', 'Systèmes de comptage éclairage'),
('ECLAIRAGE_GENERAL', 'Éclairage Général', 'Systèmes d\'éclairage général');

-- 3️⃣ Create GTB modules table (was missing)
CREATE TABLE gtb_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_id INT NOT NULL,
    module_type VARCHAR(50) NOT NULL,
    module_name VARCHAR(100),
    quantity INT DEFAULT 0,
    module_references JSON,
    is_sensor BOOLEAN DEFAULT FALSE,
    is_control_unit BOOLEAN DEFAULT FALSE,
    plan_position JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_site_gtb (site_id),
    INDEX idx_module_type (module_type)
);

-- 4️⃣ Create GTB configuration table for Page 5
CREATE TABLE gtb_site_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_id INT NOT NULL,

    -- GTB Module quantities
    refs INT DEFAULT 0,
    sondes INT DEFAULT 0,
    sondesPresentes INT DEFAULT 0,
    gazCompteur INT DEFAULT 0,
    Izit INT DEFAULT 0,
    modules INT DEFAULT 0,

    -- Additional equipment
    aeroeau INT DEFAULT 0,
    aerogaz INT DEFAULT 0,
    clim_ir INT DEFAULT 0,
    clim_filaire_simple INT DEFAULT 0,
    clim_filaire_groupe INT DEFAULT 0,
    rooftop INT DEFAULT 0,
    Comptage_Froid INT DEFAULT 0,
    Comptage_Eclairage INT DEFAULT 0,
    eclairage INT DEFAULT 0,

    -- References (JSON arrays)
    ref_aeroeau JSON,
    ref_aerogaz JSON,
    ref_clim_ir JSON,
    ref_clim_filaire_simple JSON,
    ref_clim_filaire_groupe JSON,
    ref_rooftop JSON,
    ref_Comptage_Froid JSON,
    ref_Comptage_Eclairage JSON,
    ref_eclairage JSON,
    ref_sondes JSON,
    ref_sondesPresentes JSON,
    ref_gazCompteur JSON,
    ref_Izit JSON,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY unique_site_gtb (site_id),
    INDEX idx_site_gtb_config (site_id)
);

-- 5️⃣ Create comprehensive view for backward compatibility
CREATE VIEW legacy_form_view AS
SELECT
    s.id,
    s.site_name as site,
    s.client_name as client,
    s.address,
    s.phone_primary as number1,
    s.phone_secondary as number2,
    s.email,
    s.created_at as submitted_at,

    -- Aero fields
    COALESCE(aero_config.zones, '[]') as zone_aerotherme,
    COALESCE(aero_config.quantity_total, 0) as nb_aerotherme,
    COALESCE(aero_config.has_thermostat, 0) as thermostat_aerotherme,
    COALESCE(aero_config.nb_contacts_aerotherme, 0) as nb_contacts_aerotherme,
    COALESCE(aero_config.has_electrical_panel, 0) as coffret_aerotherme,
    COALESCE(aero_config.has_timer, 0) as coffret_horloge_aerotherme,
    COALESCE(aero_config.equipment_types, '[]') as type_aerotherme,
    COALESCE(aero_config.operational_status, 'unknown') as Fonctionement_aerotherme,
    COALESCE(aero_config.maintenance_status, 'unknown') as Maintenance_aerotherme,
    aero_config.comments as commentaire_aero,

    -- Clim fields
    COALESCE(clim_ir_config.zones, '[]') as zone_clim,
    COALESCE(clim_ir_config.quantity_total, 0) as nb_clim_ir,
    COALESCE(clim_wire_config.quantity_total, 0) as nb_clim_wire,
    COALESCE(clim_ir_config.has_electrical_panel, 0) as coffret_clim,
    COALESCE(clim_ir_config.equipment_types, '[]') as type_clim,
    COALESCE(clim_ir_config.operational_status, 'unknown') as Fonctionement_clim,
    COALESCE(clim_ir_config.maintenance_status, 'unknown') as Maintenance_clim,
    COALESCE(clim_ir_config.nb_telecommande_clim_smartwire, 0) as nb_telecommande_clim_smartwire,
    COALESCE(clim_ir_config.nb_telecommande_clim_wire, 0) as nb_telecommande_clim_wire,
    clim_ir_config.comments as commentaire_clim,

    -- Rooftop fields
    COALESCE(rooftop_config.zones, '[]') as zone_rooftop,
    COALESCE(rooftop_config.zone_rooftop_1, '') as zone_rooftop_1,
    COALESCE(rooftop_config.zone_rooftop_2, '') as zone_rooftop_2,
    COALESCE(rooftop_config.zone_rooftop_3, '') as zone_rooftop_3,
    COALESCE(rooftop_config.zone_rooftop_4, '') as zone_rooftop_4,
    COALESCE(rooftop_config.quantity_total, 0) as nb_rooftop,
    COALESCE(rooftop_config.has_thermostat, 0) as thermostat_rooftop,
    COALESCE(rooftop_config.telecomande_modbus_rooftop, 0) as telecomande_modbus_rooftop,
    COALESCE(rooftop_config.has_electrical_panel, 0) as coffret_rooftop,
    COALESCE(rooftop_config.equipment_types, '[]') as type_rooftop,
    COALESCE(rooftop_config.type_rooftop_1, '') as type_rooftop_1,
    COALESCE(rooftop_config.type_rooftop_2, '') as type_rooftop_2,
    COALESCE(rooftop_config.type_rooftop_3, '') as type_rooftop_3,
    COALESCE(rooftop_config.operational_status, 'unknown') as Fonctionement_rooftop,
    COALESCE(rooftop_config.maintenance_status, 'unknown') as Maintenance_rooftop,
    rooftop_config.comments as commentaire_rooftop,

    -- Lighting fields
    COALESCE(lighting_config.quantity_total, 0) as Eclairage_interieur,
    COALESCE(lighting_config.has_electrical_panel, 0) as Eclairage_contacteur,
    COALESCE(lighting_config.quantity_ir, 0) as Eclairage_exterieur,
    COALESCE(lighting_config.has_timer, 0) as Eclairage_horloge,
    lighting_config.comments as commentaire_eclairage,

    -- Position
    COALESCE(aero_config.pos_x, rooftop_config.pos_x) as pos_x,
    COALESCE(aero_config.pos_y, rooftop_config.pos_y) as pos_y,

    -- GTB fields
    COALESCE(gtb.refs, 0) as refs,
    COALESCE(gtb.sondes, 0) as sondes,
    COALESCE(gtb.sondesPresentes, 0) as sondesPresentes,
    COALESCE(gtb.gazCompteur, 0) as gazCompteur,
    COALESCE(gtb.Izit, 0) as Izit,
    COALESCE(gtb.modules, 0) as modules,
    COALESCE(gtb.aeroeau, 0) as aeroeau,
    COALESCE(gtb.aerogaz, 0) as aerogaz,
    COALESCE(gtb.clim_filaire_simple, 0) as clim_filaire_simple,
    COALESCE(gtb.clim_filaire_groupe, 0) as clim_filaire_groupe,
    COALESCE(gtb.Comptage_Froid, 0) as Comptage_Froid,
    COALESCE(gtb.Comptage_Eclairage, 0) as Comptage_Eclairage,
    COALESCE(gtb.eclairage, 0) as eclairage

FROM sites s
LEFT JOIN equipment_configs aero_config ON s.id = aero_config.site_id
    AND aero_config.category_id = (SELECT id FROM equipment_categories WHERE category_code = 'AERO')
LEFT JOIN equipment_configs clim_ir_config ON s.id = clim_ir_config.site_id
    AND clim_ir_config.category_id = (SELECT id FROM equipment_categories WHERE category_code = 'CLIM_IR')
LEFT JOIN equipment_configs clim_wire_config ON s.id = clim_wire_config.site_id
    AND clim_wire_config.category_id = (SELECT id FROM equipment_categories WHERE category_code = 'CLIM_WIRE')
LEFT JOIN equipment_configs rooftop_config ON s.id = rooftop_config.site_id
    AND rooftop_config.category_id = (SELECT id FROM equipment_categories WHERE category_code = 'ROOFTOP')
LEFT JOIN equipment_configs lighting_config ON s.id = lighting_config.site_id
    AND lighting_config.category_id = (SELECT id FROM equipment_categories WHERE category_code = 'LIGHTING')
LEFT JOIN gtb_site_config gtb ON s.id = gtb.site_id;

-- 6️⃣ Add indexes for performance
CREATE INDEX idx_equipment_pos ON equipment_configs(pos_x, pos_y);
CREATE INDEX idx_equipment_zone ON equipment_configs(zone_rooftop_1, zone_rooftop_2);
CREATE INDEX idx_gtb_modules ON gtb_site_config(refs, sondes, modules);

SELECT 'Complete schema fix applied successfully!' as status;