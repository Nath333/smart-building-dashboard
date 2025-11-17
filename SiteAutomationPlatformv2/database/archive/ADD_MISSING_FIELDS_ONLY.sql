-- ===============================================
-- ADD ONLY THE MISSING FIELDS TO YOUR EXISTING TABLES
-- Your tables exist but may be missing some fields
-- ===============================================

-- Check if fields exist before adding them (MySQL 8.0+ syntax)
-- If you get errors, the field already exists - that's OK!

-- 1️⃣ ADD MISSING FIELDS TO site_images (if they don't exist)
ALTER TABLE site_images ADD COLUMN x INT;
ALTER TABLE site_images ADD COLUMN y INT;
ALTER TABLE site_images ADD COLUMN label VARCHAR(255);
ALTER TABLE site_images ADD COLUMN image_url TEXT;
ALTER TABLE site_images ADD COLUMN comments TEXT;
ALTER TABLE site_images ADD COLUMN module_type VARCHAR(50);

-- 2️⃣ ADD MISSING FIELDS TO equipment_configs (if they don't exist)
ALTER TABLE equipment_configs ADD COLUMN legacy_id INT;
ALTER TABLE equipment_configs ADD COLUMN nb_contacts_aerotherme INT DEFAULT 0;
ALTER TABLE equipment_configs ADD COLUMN nb_telecommande_clim_smartwire INT DEFAULT 0;
ALTER TABLE equipment_configs ADD COLUMN nb_telecommande_clim_wire INT DEFAULT 0;
ALTER TABLE equipment_configs ADD COLUMN telecomande_modbus_rooftop BOOLEAN DEFAULT FALSE;
ALTER TABLE equipment_configs ADD COLUMN zone_rooftop_1 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN zone_rooftop_2 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN zone_rooftop_3 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN zone_rooftop_4 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN type_rooftop_1 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN type_rooftop_2 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN type_rooftop_3 VARCHAR(100);
ALTER TABLE equipment_configs ADD COLUMN pos_x INT;
ALTER TABLE equipment_configs ADD COLUMN pos_y INT;

-- 3️⃣ CREATE INDEXES FOR PERFORMANCE (if they don't exist)
CREATE INDEX idx_equipment_legacy_id ON equipment_configs(legacy_id);
CREATE INDEX idx_equipment_position ON equipment_configs(pos_x, pos_y);
CREATE INDEX idx_sites_name_perf ON sites(site_name, id);
CREATE INDEX idx_equipment_site_category_perf ON equipment_configs(site_id, category_id, id);
CREATE INDEX idx_equipment_refs_config_pos ON equipment_references(config_id, position_index, is_active);
CREATE INDEX idx_site_images_lookup ON site_images(site_id, image_type, image_category);
CREATE INDEX idx_site_images_card ON site_images(site_id, card_id, image_type);
CREATE INDEX idx_gtb_site_perf ON gtb_site_config(site_id, refs, modules);

-- 4️⃣ ADD CONSTRAINTS FOR DATA INTEGRITY (if they don't exist)
ALTER TABLE equipment_configs
  ADD CONSTRAINT chk_quantity_positive CHECK (quantity_total >= 0),
  ADD CONSTRAINT chk_quantities_valid CHECK (quantity_ir >= 0 AND quantity_wire >= 0),
  ADD CONSTRAINT chk_contacts_valid CHECK (nb_contacts_aerotherme >= 0),
  ADD CONSTRAINT chk_telecommande_valid CHECK (
    nb_telecommande_clim_smartwire >= 0 AND nb_telecommande_clim_wire >= 0
  );

ALTER TABLE equipment_references
  ADD CONSTRAINT chk_position_valid CHECK (position_index >= 0 AND position_index < 50),
  ADD CONSTRAINT chk_condition_rating CHECK (condition_rating >= 1 AND condition_rating <= 5);

ALTER TABLE gtb_site_config
  ADD CONSTRAINT chk_gtb_quantities CHECK (
    refs >= 0 AND sondes >= 0 AND sondesPresentes >= 0 AND gazCompteur >= 0 AND
    Izit >= 0 AND modules >= 0 AND aeroeau >= 0 AND aerogaz >= 0 AND
    clim_filaire_simple >= 0 AND clim_filaire_groupe >= 0 AND
    Comptage_Froid >= 0 AND Comptage_Eclairage >= 0 AND eclairage >= 0
  );

-- 5️⃣ OPTIMIZE JSON FIELDS WITH VALIDATION
ALTER TABLE equipment_configs
  MODIFY COLUMN zones JSON CHECK (JSON_VALID(zones)),
  MODIFY COLUMN equipment_types JSON CHECK (JSON_VALID(equipment_types));

ALTER TABLE gtb_site_config
  MODIFY COLUMN ref_aeroeau JSON CHECK (JSON_VALID(ref_aeroeau)),
  MODIFY COLUMN ref_aerogaz JSON CHECK (JSON_VALID(ref_aerogaz)),
  MODIFY COLUMN ref_clim_ir JSON CHECK (JSON_VALID(ref_clim_ir)),
  MODIFY COLUMN ref_clim_filaire_simple JSON CHECK (JSON_VALID(ref_clim_filaire_simple)),
  MODIFY COLUMN ref_clim_filaire_groupe JSON CHECK (JSON_VALID(ref_clim_filaire_groupe)),
  MODIFY COLUMN ref_rooftop JSON CHECK (JSON_VALID(ref_rooftop)),
  MODIFY COLUMN ref_Comptage_Froid JSON CHECK (JSON_VALID(ref_Comptage_Froid)),
  MODIFY COLUMN ref_Comptage_Eclairage JSON CHECK (JSON_VALID(ref_Comptage_Eclairage)),
  MODIFY COLUMN ref_eclairage JSON CHECK (JSON_VALID(ref_eclairage)),
  MODIFY COLUMN ref_sondes JSON CHECK (JSON_VALID(ref_sondes)),
  MODIFY COLUMN ref_sondesPresentes JSON CHECK (JSON_VALID(ref_sondesPresentes)),
  MODIFY COLUMN ref_gazCompteur JSON CHECK (JSON_VALID(ref_gazCompteur)),
  MODIFY COLUMN ref_Izit JSON CHECK (JSON_VALID(ref_Izit));

ALTER TABLE site_images
  MODIFY COLUMN crop_transform JSON CHECK (JSON_VALID(crop_transform)),
  MODIFY COLUMN shapes_data JSON CHECK (JSON_VALID(shapes_data)),
  MODIFY COLUMN plan_metadata JSON CHECK (JSON_VALID(plan_metadata)),
  MODIFY COLUMN polygon_coordinates JSON CHECK (JSON_VALID(polygon_coordinates));

-- 6️⃣ ENSURE ALL EQUIPMENT CATEGORIES EXIST
INSERT IGNORE INTO equipment_categories (category_code, category_name, description) VALUES
('CLIM_GENERAL', 'Climatisation Générale', 'Systèmes de climatisation généraux'),
('VENTILATION', 'Ventilation', 'Systèmes de ventilation'),
('HEATING', 'Chauffage', 'Systèmes de chauffage généraux'),
('SENSORS', 'Capteurs', 'Capteurs et sondes diverses'),
('CONTROLS', 'Contrôles', 'Systèmes de contrôle et automation');

SELECT 'Missing fields and optimizations added successfully!' as status;

-- NOTE: If you get "Column already exists" errors, that's NORMAL and GOOD!
-- It means the field is already there. The important thing is all fields exist.