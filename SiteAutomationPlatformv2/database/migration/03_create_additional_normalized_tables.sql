-- =====================================================
-- Additional Database Normalization
-- Works with existing sites, equipment_categories, etc.
-- =====================================================

-- Drop existing conflicting tables if they exist (from previous failed migration)
DROP TABLE IF EXISTS visual_positions;
DROP TABLE IF EXISTS gtb_module_references;
DROP TABLE IF EXISTS gtb_modules;
DROP TABLE IF EXISTS equipment_lighting;
DROP TABLE IF EXISTS climate_references;
DROP TABLE IF EXISTS equipment_climate;
DROP TABLE IF EXISTS rooftop_brands;
DROP TABLE IF EXISTS equipment_rooftop;
DROP TABLE IF EXISTS aerotherme_brands;
DROP TABLE IF EXISTS equipment_aerotherme;

-- 1. Create Equipment: Aerotherme Table
-- Links to existing sites table via site_name
CREATE TABLE IF NOT EXISTS equipment_aerotherme (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL,
    zone_aerotherme VARCHAR(255),
    nb_aerotherme INT,
    thermostat_aerotherme VARCHAR(255),
    nb_contacts_aerotherme INT,
    coffret_aerotherme VARCHAR(255),
    coffret_horloge_aerotherme VARCHAR(255),
    type_aerotherme VARCHAR(255),
    fonctionement_aerotherme TEXT,
    maintenance_aerotherme TEXT,
    commentaire_aero TEXT,
    td_aerotherme VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_site (site_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create Aerotherme Brands Table
CREATE TABLE IF NOT EXISTS aerotherme_brands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL,
    brand_index INT,
    brand_name VARCHAR(255),
    FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_site (site_name),
    UNIQUE KEY unique_site_brand (site_name, brand_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create Equipment: Rooftop Table
CREATE TABLE IF NOT EXISTS equipment_rooftop (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL,
    zone_rooftop VARCHAR(255),
    zone_rooftop_1 VARCHAR(255),
    zone_rooftop_2 VARCHAR(255),
    zone_rooftop_3 VARCHAR(255),
    zone_rooftop_4 VARCHAR(255),
    nb_rooftop INT,
    thermostat_rooftop VARCHAR(255),
    telecomande_modbus_rooftop VARCHAR(255),
    coffret_rooftop VARCHAR(255),
    type_rooftop VARCHAR(255),
    type_rooftop_1 VARCHAR(255),
    type_rooftop_2 VARCHAR(255),
    type_rooftop_3 VARCHAR(255),
    fonctionement_rooftop TEXT,
    maintenance_rooftop TEXT,
    commentaire_rooftop TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_site (site_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Create Rooftop Brands Table
CREATE TABLE IF NOT EXISTS rooftop_brands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL,
    brand_index INT,
    brand_name VARCHAR(255),
    FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_site (site_name),
    UNIQUE KEY unique_site_brand (site_name, brand_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Create Equipment: Climate Control Table
CREATE TABLE IF NOT EXISTS equipment_climate (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL,
    zone_clim VARCHAR(255),
    nb_clim_ir INT,
    nb_clim_wire INT,
    coffret_clim VARCHAR(255),
    type_clim VARCHAR(255),
    fonctionement_clim TEXT,
    maintenance_clim TEXT,
    nb_telecommande_clim_smartwire INT,
    nb_telecommande_clim_wire INT,
    commentaire_clim TEXT,
    td_clim VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_site (site_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Create Climate References Table
CREATE TABLE IF NOT EXISTS climate_references (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL,
    ref_type ENUM('clim_ir', 'clim_wire') NOT NULL,
    ref_index INT,
    ref_value VARCHAR(255),
    FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_site (site_name),
    INDEX idx_type (ref_type),
    UNIQUE KEY unique_site_ref (site_name, ref_type, ref_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Create Equipment: Lighting Table
CREATE TABLE IF NOT EXISTS equipment_lighting (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL,
    eclairage_interieur VARCHAR(255),
    eclairage_contacteur VARCHAR(255),
    eclairage_exterieur VARCHAR(255),
    eclairage_horloge VARCHAR(255),
    commentaire_eclairage TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_site (site_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Create GTB Modules Configuration Table
CREATE TABLE IF NOT EXISTS gtb_modules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL,
    module_type VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 0,
    refs TEXT,
    sondes INT,
    sondes_presentes INT,
    gaz_compteur INT,
    izit INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_site (site_name),
    INDEX idx_module_type (module_type),
    UNIQUE KEY unique_site_module (site_name, module_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Create GTB Module References Table
CREATE TABLE IF NOT EXISTS gtb_module_references (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL,
    module_type VARCHAR(100) NOT NULL,
    ref_index INT,
    ref_value VARCHAR(255),
    FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_site_module (site_name, module_type),
    UNIQUE KEY unique_site_module_ref (site_name, module_type, ref_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Create Visual Positions Table (for draggable elements)
CREATE TABLE IF NOT EXISTS visual_positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL,
    page_type ENUM('vt_plan', 'gtb_plan') NOT NULL,
    element_id VARCHAR(100),
    pos_x DECIMAL(10,2),
    pos_y DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_site_page (site_name, page_type),
    UNIQUE KEY unique_position (site_name, page_type, element_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Tables Created Successfully
-- Next: Run data migration script
-- =====================================================
