-- ===============================================
-- QUICK MIGRATION - COPY PASTE THIS INTO MYSQL
-- ===============================================

-- Step 1: Backup existing data
CREATE TABLE form_sql_backup AS SELECT * FROM form_sql;
CREATE TABLE image_sql_backup AS SELECT * FROM image_sql;

-- Step 2: Create sites table
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

-- Step 3: Create equipment categories
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

-- Step 4: Create equipment configs
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id),
    UNIQUE KEY unique_site_category (site_id, category_id),
    INDEX idx_site_config (site_id),
    INDEX idx_category_config (category_id)
);

-- Step 5: Create equipment references
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

-- Step 6: Create improved images table
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_site_images (site_id),
    INDEX idx_image_type (image_type),
    INDEX idx_category (image_category),
    INDEX idx_card (card_id)
);

-- Step 7: Create GTB modules table
CREATE TABLE gtb_modules (
    id INT PRIMARY KEY AUTO_INCREMENT,
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

-- Step 8: Migrate existing sites
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

-- Migration complete!
SELECT 'Migration completed successfully!' as status;