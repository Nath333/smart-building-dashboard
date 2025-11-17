-- Create devis table for Page 4 (Devis)
-- Stores equipment installation quotes by zone

CREATE TABLE IF NOT EXISTS devis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(255) NOT NULL,
  devis_name VARCHAR(255) NOT NULL DEFAULT 'Devis Principal',
  equipment_type VARCHAR(50) NOT NULL,
  zone_name VARCHAR(100) NOT NULL,
  existing_count INT DEFAULT 0,
  to_install_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_site_devis_equipment_zone (site_name, devis_name, equipment_type, zone_name),
  INDEX idx_site_name (site_name),
  INDEX idx_devis_name (devis_name),
  INDEX idx_equipment_type (equipment_type),
  INDEX idx_zone_name (zone_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
