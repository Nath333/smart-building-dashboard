-- ===============================================
-- IMPROVED DATABASE SCHEMA MIGRATION
-- From: Single 150+ column table (form_sql)
-- To: Normalized, maintainable structure
-- ===============================================

-- 🔧 BACKUP EXISTING DATA FIRST
CREATE TABLE form_sql_backup AS SELECT * FROM form_sql;
CREATE TABLE image_sql_backup AS SELECT * FROM image_sql;

-- ===============================================
-- 1️⃣ SITES TABLE - Core Site Information
-- ===============================================
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

    INDEX idx_site_name (site_name),
    INDEX idx_client (client_name)
);

-- ===============================================
-- 2️⃣ EQUIPMENT_CATEGORIES - Master Equipment Types
-- ===============================================
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
('LIGHTING', 'Éclairage', 'Systèmes d\'éclairage intérieur/extérieur');

-- ===============================================
-- 3️⃣ EQUIPMENT_CONFIGS - Main Equipment Configuration
-- ===============================================
CREATE TABLE equipment_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT NOT NULL,
    category_id INT NOT NULL,

    -- Quantities
    quantity_total INT DEFAULT 0,
    quantity_ir INT DEFAULT 0,
    quantity_wire INT DEFAULT 0,

    -- Zones (JSON array instead of CSV)
    zones JSON,

    -- Types (JSON array instead of CSV)
    equipment_types JSON,

    -- Control Configuration
    has_thermostat BOOLEAN DEFAULT FALSE,
    has_remote_control BOOLEAN DEFAULT FALSE,
    has_modbus BOOLEAN DEFAULT FALSE,
    has_electrical_panel BOOLEAN DEFAULT FALSE,
    has_timer BOOLEAN DEFAULT FALSE,

    -- Status
    operational_status ENUM('working', 'needs_maintenance', 'broken', 'unknown') DEFAULT 'unknown',
    maintenance_status ENUM('up_to_date', 'overdue', 'scheduled', 'unknown') DEFAULT 'unknown',

    -- Comments
    comments TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id),

    UNIQUE KEY unique_site_category (site_id, category_id),
    INDEX idx_site_config (site_id),
    INDEX idx_category_config (category_id)
);

-- ===============================================
-- 4️⃣ EQUIPMENT_REFERENCES - Individual Equipment Items
-- ===============================================
CREATE TABLE equipment_references (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_id INT NOT NULL,

    -- Reference Information
    reference_code VARCHAR(100),
    brand_name VARCHAR(100),
    model_name VARCHAR(100),
    serial_number VARCHAR(100),

    -- Installation Details
    installation_zone VARCHAR(50),
    installation_date DATE,
    position_index INT DEFAULT 0,

    -- Technical Specs (JSON for flexibility)
    technical_specs JSON,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    condition_rating TINYINT CHECK (condition_rating >= 1 AND condition_rating <= 5),

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (config_id) REFERENCES equipment_configs(id) ON DELETE CASCADE,

    INDEX idx_config_ref (config_id),
    INDEX idx_reference (reference_code),
    INDEX idx_brand (brand_name),
    INDEX idx_position (config_id, position_index)
);

-- ===============================================
-- 5️⃣ IMPROVED IMAGES TABLE - Better Structure
-- ===============================================
CREATE TABLE site_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT NOT NULL,

    -- Image Type & Context
    image_type ENUM('site_plan', 'equipment_photo', 'visual_plan', 'surface_plan', 'gtb_plan') NOT NULL,
    image_category VARCHAR(50), -- 'aero', 'clim', 'rooftop', etc.
    image_title VARCHAR(200),

    -- Image Storage
    image_url_viewer TEXT NOT NULL,
    image_url_thumb TEXT,
    image_url_medium TEXT,
    delete_url TEXT,

    -- Image Properties
    original_width INT,
    original_height INT,
    file_size_bytes INT,
    mime_type VARCHAR(50),

    -- Crop/Transform Data (JSON for flexibility)
    crop_transform JSON,

    -- Plan-Specific Data
    shapes_data JSON, -- Icon positions, polygons, etc.
    plan_metadata JSON, -- Additional plan-specific info

    -- Card/Surface Specific
    card_id VARCHAR(50),
    polygon_coordinates JSON,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,

    INDEX idx_site_images (site_id),
    INDEX idx_image_type (image_type),
    INDEX idx_category (image_category),
    INDEX idx_card (card_id)
);

-- ===============================================
-- 6️⃣ GTB MODULES CONFIGURATION
-- ===============================================
CREATE TABLE gtb_modules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT NOT NULL,

    -- Module Type
    module_type VARCHAR(50) NOT NULL,
    module_name VARCHAR(100),

    -- Configuration
    quantity INT DEFAULT 0,

    -- References (JSON array for flexibility)
    module_references JSON,

    -- Special Modules
    is_sensor BOOLEAN DEFAULT FALSE,
    is_control_unit BOOLEAN DEFAULT FALSE,

    -- Position (for GTB plan)
    plan_position JSON, -- {x, y, width, height}

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,

    INDEX idx_site_gtb (site_id),
    INDEX idx_module_type (module_type)
);

-- ===============================================
-- 7️⃣ DATA MIGRATION FROM OLD SCHEMA
-- ===============================================

-- Migrate Sites
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

-- Migrate Equipment Configs - AERO
INSERT INTO equipment_configs (site_id, category_id, quantity_total, zones, equipment_types,
                              has_thermostat, has_electrical_panel, has_timer,
                              operational_status, maintenance_status, comments)
SELECT
    s.id,
    (SELECT id FROM equipment_categories WHERE category_code = 'AERO'),
    COALESCE(f.nb_aerotherme, 0),
    CASE
        WHEN f.zone_aerotherme IS NOT NULL THEN JSON_ARRAY(f.zone_aerotherme)
        ELSE JSON_ARRAY()
    END,
    CASE
        WHEN f.type_aerotherme IS NOT NULL THEN JSON_ARRAY(f.type_aerotherme)
        ELSE JSON_ARRAY()
    END,
    CASE WHEN f.thermostat_aerotherme IS NOT NULL THEN TRUE ELSE FALSE END,
    CASE WHEN f.coffret_aerotherme IS NOT NULL THEN TRUE ELSE FALSE END,
    CASE WHEN f.coffret_horloge_aerotherme IS NOT NULL THEN TRUE ELSE FALSE END,
    CASE
        WHEN f.Fonctionement_aerotherme = 'working' THEN 'working'
        WHEN f.Fonctionement_aerotherme = 'broken' THEN 'broken'
        ELSE 'unknown'
    END,
    CASE
        WHEN f.Maintenance_aerotherme = 'up_to_date' THEN 'up_to_date'
        WHEN f.Maintenance_aerotherme = 'overdue' THEN 'overdue'
        ELSE 'unknown'
    END,
    f.commentaire_aero
FROM form_sql f
JOIN sites s ON s.site_name = f.site
WHERE f.nb_aerotherme > 0 OR f.zone_aerotherme IS NOT NULL;

-- Migrate Equipment References - AERO
INSERT INTO equipment_references (config_id, reference_code, brand_name, position_index)
SELECT
    ec.id,
    CASE
        WHEN i = 0 THEN f.marque_aerotherme_0
        WHEN i = 1 THEN f.marque_aerotherme_1
        WHEN i = 2 THEN f.marque_aerotherme_2
        WHEN i = 3 THEN f.marque_aerotherme_3
        WHEN i = 4 THEN f.marque_aerotherme_4
        WHEN i = 5 THEN f.marque_aerotherme_5
        WHEN i = 6 THEN f.marque_aerotherme_6
        WHEN i = 7 THEN f.marque_aerotherme_7
        WHEN i = 8 THEN f.marque_aerotherme_8
        WHEN i = 9 THEN f.marque_aerotherme_9
    END,
    'Unknown',
    i
FROM form_sql f
JOIN sites s ON s.site_name = f.site
JOIN equipment_configs ec ON ec.site_id = s.id
JOIN equipment_categories cat ON cat.id = ec.category_id AND cat.category_code = 'AERO'
CROSS JOIN (
    SELECT 0 as i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
) positions
WHERE i < COALESCE(f.nb_aerotherme, 0)
AND CASE
    WHEN i = 0 THEN f.marque_aerotherme_0
    WHEN i = 1 THEN f.marque_aerotherme_1
    WHEN i = 2 THEN f.marque_aerotherme_2
    WHEN i = 3 THEN f.marque_aerotherme_3
    WHEN i = 4 THEN f.marque_aerotherme_4
    WHEN i = 5 THEN f.marque_aerotherme_5
    WHEN i = 6 THEN f.marque_aerotherme_6
    WHEN i = 7 THEN f.marque_aerotherme_7
    WHEN i = 8 THEN f.marque_aerotherme_8
    WHEN i = 9 THEN f.marque_aerotherme_9
END IS NOT NULL;

-- Similar migrations for CLIM_IR, CLIM_WIRE, ROOFTOP... (abbreviated for space)

-- Migrate Images
INSERT INTO site_images (site_id, image_type, image_category, image_title,
                        image_url_viewer, image_url_thumb, image_url_medium, delete_url,
                        original_width, original_height, shapes_data, card_id, polygon_coordinates)
SELECT
    s.id,
    CASE
        WHEN i.type = 'visual_plan' THEN 'visual_plan'
        WHEN i.type = 'surface_plan' THEN 'surface_plan'
        WHEN i.type = 'gtb_plan' THEN 'gtb_plan'
        ELSE 'equipment_photo'
    END,
    LOWER(i.type),
    i.title,
    i.url_viewer,
    i.url_thumb,
    i.url_medium,
    i.delete_url,
    i.width,
    i.height,
    CASE WHEN i.shapes IS NOT NULL THEN CAST(i.shapes AS JSON) ELSE NULL END,
    i.card_id,
    CASE WHEN i.x IS NOT NULL AND i.y IS NOT NULL THEN JSON_OBJECT('x', i.x, 'y', i.y) ELSE NULL END
FROM image_sql i
JOIN sites s ON s.site_name = i.site;

-- ===============================================
-- 8️⃣ CLEANUP & OPTIMIZATION
-- ===============================================

-- Add useful views for backward compatibility
CREATE VIEW equipment_summary AS
SELECT
    s.site_name,
    ec.category_id,
    cat.category_name,
    ec.quantity_total,
    ec.zones,
    ec.equipment_types,
    ec.comments,
    COUNT(er.id) as reference_count
FROM sites s
JOIN equipment_configs ec ON ec.site_id = s.id
JOIN equipment_categories cat ON cat.id = ec.category_id
LEFT JOIN equipment_references er ON er.config_id = ec.id
GROUP BY s.id, ec.id;

-- Create indexes for performance
CREATE INDEX idx_sites_name ON sites(site_name);
CREATE INDEX idx_equipment_site_cat ON equipment_configs(site_id, category_id);
CREATE INDEX idx_references_config ON equipment_references(config_id);
CREATE INDEX idx_images_site_type ON site_images(site_id, image_type);

-- ===============================================
-- 🎯 PERFORMANCE & STORAGE IMPROVEMENTS
-- ===============================================

-- Before: 150+ columns × thousands of rows = massive NULL storage
-- After: Normalized tables with only relevant data stored

-- JSON Fields Benefits:
-- - zones: ["Zone A", "Zone B"] instead of CSV "Zone A, Zone B"
-- - equipment_types: ["Type1", "Type2"] instead of multiple columns
-- - technical_specs: {"power": "5kW", "voltage": "230V"} - flexible

-- Storage Reduction Estimate:
-- Old: ~500MB for 1000 sites (mostly NULL columns)
-- New: ~50MB for 1000 sites (normalized data only)

COMMIT;