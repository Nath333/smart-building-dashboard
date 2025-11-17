-- ===============================================
-- GTB NORMALIZED DATABASE SCHEMA
-- Parallel structure to equipment tables
-- ===============================================

-- GTB Module Categories (like equipment_categories)
CREATE TABLE IF NOT EXISTS gtb_module_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_code VARCHAR(50) UNIQUE NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  default_reference VARCHAR(100),
  icon_name VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- GTB Site Configurations (like equipment_configs)
CREATE TABLE IF NOT EXISTS gtb_site_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  site_id INT NOT NULL,
  category_id INT NOT NULL,
  quantity INT DEFAULT 0,
  is_enabled BOOLEAN DEFAULT FALSE,
  configuration_data JSON,
  installation_notes TEXT,
  operational_status ENUM('working', 'needs_maintenance', 'not_working', 'unknown') DEFAULT 'unknown',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_site_category (site_id, category_id),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES gtb_module_categories(id) ON DELETE CASCADE
);

-- GTB Module References (like equipment_references)
CREATE TABLE IF NOT EXISTS gtb_module_references (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_id INT NOT NULL,
  reference_code VARCHAR(100) NOT NULL,
  reference_name VARCHAR(200),
  position_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  installation_date DATE,
  technical_specs JSON,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (config_id) REFERENCES gtb_site_configs(id) ON DELETE CASCADE,
  INDEX idx_config_position (config_id, position_index)
);

-- GTB Special Configurations (sensors, gas meters, etc.)
CREATE TABLE IF NOT EXISTS gtb_special_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  site_id INT NOT NULL,
  sondes_temperature INT DEFAULT 0,
  sondes_presence INT DEFAULT 0,
  gas_meter_enabled BOOLEAN DEFAULT FALSE,
  izit_coffrets JSON, -- Array of installed coffret types
  special_modules JSON, -- Additional special modules
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_site (site_id),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Insert default GTB module categories
INSERT IGNORE INTO gtb_module_categories (category_code, category_name, description, default_reference, icon_name) VALUES
('AERO_EAU', 'Contacts Aéro Eau', 'Télécommandes pour aérothermes eau', 'cs do12', 'aero_eau'),
('AERO_GAZ', 'Contacts Aéro Gaz', 'Télécommandes pour aérothermes gaz', 'cs do12', 'aero_gaz'),
('CLIM_IR', 'Télécommandes Clim IR', 'Télécommandes infrarouge pour climatisation', 'Intesis IR', 'clim_ir'),
('CLIM_FILAIRE_SIMPLE', 'Clim Filaire Simple', 'Télécommandes filaires simples', 'aidoo pro', 'clim_wire'),
('CLIM_FILAIRE_GROUPE', 'Clim Filaire Groupe', 'Télécommandes filaires groupe', 'aidoo pro', 'clim_group'),
('ROOFTOP', 'Télécommandes Rooftop', 'Télécommandes pour rooftops', 'modbus do12', 'rooftop'),
('COMPTAGE_FROID', 'Compteurs Froid', 'Compteurs de froid', 'mtr5lmod', 'meter_cold'),
('COMPTAGE_ECLAIRAGE', 'Compteurs Éclairage', 'Compteurs éclairage', 'mtr5lmod', 'meter_light'),
('ECLAIRAGE', 'Contacts Éclairage', 'Contacts pour éclairage', 'cs do12', 'lighting');

-- Insert default sites table if not exists
CREATE TABLE IF NOT EXISTS sites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  site_name VARCHAR(255) UNIQUE NOT NULL,
  client_name VARCHAR(255),
  address TEXT,
  phone_primary VARCHAR(50),
  phone_secondary VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Index optimizations for GTB tables
CREATE INDEX IF NOT EXISTS idx_gtb_site_configs_site ON gtb_site_configs(site_id);
CREATE INDEX IF NOT EXISTS idx_gtb_site_configs_category ON gtb_site_configs(category_id);
CREATE INDEX IF NOT EXISTS idx_gtb_module_refs_config ON gtb_module_references(config_id);
CREATE INDEX IF NOT EXISTS idx_gtb_special_site ON gtb_special_configs(site_id);