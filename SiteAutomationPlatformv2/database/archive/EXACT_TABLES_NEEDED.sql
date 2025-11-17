-- ===============================================
-- EXACT TABLES YOU NEED TO CREATE
-- Run this in your MySQL database first
-- ===============================================

-- 1️⃣ SITES TABLE
CREATE TABLE sites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL UNIQUE,
    client_name VARCHAR(255),
    address TEXT,
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_site_name (site_name)
);

-- 2️⃣ EQUIPMENT CATEGORIES
CREATE TABLE equipment_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_code VARCHAR(20) NOT NULL UNIQUE,
    category_name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_code (category_code)
);

-- Insert standard categories
INSERT INTO equipment_categories (category_code, category_name, description) VALUES
('AERO', 'Aérotherme', 'Systèmes de chauffage aérotherme'),
('CLIM_IR', 'Climatisation IR', 'Climatisation avec télécommande infrarouge'),
('CLIM_WIRE', 'Climatisation Filaire', 'Climatisation avec contrôle filaire'),
('ROOFTOP', 'Rooftop', 'Unités de toit climatisation/chauffage'),
('LIGHTING', 'Éclairage', 'Systèmes d\'éclairage intérieur/extérieur'),
('CLIM_GENERAL', 'Climatisation Générale', 'Systèmes de climatisation généraux'),
('VENTILATION', 'Ventilation', 'Systèmes de ventilation'),
('HEATING', 'Chauffage', 'Systèmes de chauffage généraux'),
('SENSORS', 'Capteurs', 'Capteurs et sondes diverses'),
('CONTROLS', 'Contrôles', 'Systèmes de contrôle et automation');

-- 3️⃣ EQUIPMENT CONFIGS
CREATE TABLE equipment_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT NOT NULL,
    category_id INT NOT NULL,
    quantity_total INT DEFAULT 0,
    quantity_ir INT DEFAULT 0,
    quantity_wire INT DEFAULT 0,
    zones JSON,
    equipment_types JSON,
    has_thermostat BOOLEAN DEFAULT FALSE,
    has_remote_control BOOLEAN DEFAULT FALSE,
    has_modbus BOOLEAN DEFAULT FALSE,
    has_electrical_panel BOOLEAN DEFAULT FALSE,
    has_timer BOOLEAN DEFAULT FALSE,
    operational_status ENUM('working', 'needs_maintenance', 'broken', 'unknown') DEFAULT 'unknown',
    maintenance_status ENUM('up_to_date', 'overdue', 'scheduled', 'unknown') DEFAULT 'unknown',
    comments TEXT,
    -- Missing fields from critical_schema_fixes.sql
    nb_contacts_aerotherme INT DEFAULT 0,
    nb_telecommande_clim_smartwire INT DEFAULT 0,
    nb_telecommande_clim_wire INT DEFAULT 0,
    telecomande_modbus_rooftop BOOLEAN DEFAULT FALSE,
    zone_rooftop_1 VARCHAR(100),
    zone_rooftop_2 VARCHAR(100),
    zone_rooftop_3 VARCHAR(100),
    zone_rooftop_4 VARCHAR(100),
    type_rooftop_1 VARCHAR(100),
    type_rooftop_2 VARCHAR(100),
    type_rooftop_3 VARCHAR(100),
    pos_x INT,
    pos_y INT,
    legacy_id INT, -- For position updates compatibility
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id),
    UNIQUE KEY unique_site_category (site_id, category_id),
    INDEX idx_site_config (site_id),
    INDEX idx_category_config (category_id),
    INDEX idx_equipment_legacy_id (legacy_id),
    INDEX idx_equipment_position (pos_x, pos_y)
);

-- 4️⃣ EQUIPMENT REFERENCES
CREATE TABLE equipment_references (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_id INT NOT NULL,
    reference_code VARCHAR(100),
    brand_name VARCHAR(100),
    model_name VARCHAR(100),
    serial_number VARCHAR(100),
    installation_zone VARCHAR(50),
    installation_date DATE,
    position_index INT DEFAULT 0,
    technical_specs JSON,
    is_active BOOLEAN DEFAULT TRUE,
    condition_rating TINYINT CHECK (condition_rating >= 1 AND condition_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (config_id) REFERENCES equipment_configs(id) ON DELETE CASCADE,
    INDEX idx_config_ref (config_id),
    INDEX idx_reference (reference_code),
    INDEX idx_brand (brand_name),
    INDEX idx_position (config_id, position_index)
);

-- 5️⃣ SITE IMAGES (NEW TABLE - NOT MODIFYING YOUR EXISTING image_sql)
CREATE TABLE site_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT NOT NULL,
    image_type ENUM('site_plan', 'equipment_photo', 'visual_plan', 'surface_plan', 'gtb_plan') NOT NULL,
    image_category VARCHAR(50),
    image_title VARCHAR(200),
    image_url_viewer TEXT NOT NULL,
    image_url_thumb TEXT,
    image_url_medium TEXT,
    delete_url TEXT,
    original_width INT,
    original_height INT,
    file_size_bytes INT,
    mime_type VARCHAR(50),
    crop_transform JSON,
    shapes_data JSON,
    plan_metadata JSON,
    card_id VARCHAR(50),
    polygon_coordinates JSON,
    -- Additional fields from critical fixes
    x INT,
    y INT,
    label VARCHAR(255),
    image_url TEXT,
    comments TEXT,
    module_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_site_images (site_id),
    INDEX idx_image_type (image_type),
    INDEX idx_category (image_category),
    INDEX idx_card (card_id),
    INDEX idx_site_images_lookup (site_id, image_type, image_category),
    INDEX idx_site_images_card (site_id, card_id, image_type)
);

-- 6️⃣ GTB SITE CONFIG
CREATE TABLE gtb_site_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_id INT NOT NULL,
    refs INT DEFAULT 0,
    sondes INT DEFAULT 0,
    sondesPresentes INT DEFAULT 0,
    gazCompteur INT DEFAULT 0,
    Izit INT DEFAULT 0,
    modules INT DEFAULT 0,
    aeroeau INT DEFAULT 0,
    aerogaz INT DEFAULT 0,
    clim_ir INT DEFAULT 0,
    clim_filaire_simple INT DEFAULT 0,
    clim_filaire_groupe INT DEFAULT 0,
    rooftop INT DEFAULT 0,
    Comptage_Froid INT DEFAULT 0,
    Comptage_Eclairage INT DEFAULT 0,
    eclairage INT DEFAULT 0,
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
    INDEX idx_site_gtb_config (site_id),
    INDEX idx_gtb_site_perf (site_id, refs, modules)
);

-- 7️⃣ MIGRATE EXISTING DATA FROM OLD TABLES
-- Migrate sites
INSERT INTO sites (site_name, client_name, address, phone_primary, phone_secondary, email)
SELECT DISTINCT
    site,
    client,
    address,
    number1,
    number2,
    email
FROM form_sql
WHERE site IS NOT NULL AND site != '';

-- 8️⃣ ADD PERFORMANCE CONSTRAINTS
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

-- 9️⃣ OPTIMIZE WITH JSON VALIDATION
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

SELECT 'All new tables created successfully! Ready for v2 endpoints.' as status;