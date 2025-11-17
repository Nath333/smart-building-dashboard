-- Add localisation and etat_vetuste fields to all equipment tables
-- Migration: 08_add_localisation_etat_vetuste.sql
-- Date: 2025-01-16
-- Description: Adds localisation and état de vétusté fields to normalized equipment tables

-- =====================================================
-- AEROTHERME
-- =====================================================
ALTER TABLE equipment_aerotherme
ADD COLUMN IF NOT EXISTS etat_vetuste_aerotherme ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon état, yellow=état moyen, red=mauvais état',
ADD COLUMN IF NOT EXISTS localisation_aerotherme VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement aérotherme';

-- =====================================================
-- CLIMATE (CLIM)
-- =====================================================
ALTER TABLE equipment_climate
ADD COLUMN IF NOT EXISTS etat_vetuste_clim ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon état, yellow=état moyen, red=mauvais état',
ADD COLUMN IF NOT EXISTS localisation_clim VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement climatisation';

-- =====================================================
-- ROOFTOP
-- =====================================================
ALTER TABLE equipment_rooftop
ADD COLUMN IF NOT EXISTS etat_vetuste_rooftop ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon état, yellow=état moyen, red=mauvais état',
ADD COLUMN IF NOT EXISTS localisation_rooftop VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement rooftop';

-- =====================================================
-- LIGHTING (ECLAIRAGE)
-- =====================================================
ALTER TABLE equipment_lighting
ADD COLUMN IF NOT EXISTS etat_vetuste_eclairage ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon état, yellow=état moyen, red=mauvais état',
ADD COLUMN IF NOT EXISTS localisation_eclairage VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement éclairage';

-- =====================================================
-- COMPTAGE (if table exists)
-- =====================================================
-- Note: Comptage might be stored differently, adjust if needed
-- CREATE TABLE IF NOT EXISTS equipment_comptage (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     site_name VARCHAR(255) NOT NULL,
--     etat_vetuste_comptage ENUM('green', 'yellow', 'red') DEFAULT NULL,
--     localisation_comptage_loc VARCHAR(255) DEFAULT NULL,
--     nb_comptage INT DEFAULT 0,
--     commentaire_comptage TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE
-- );

-- Verify changes
SELECT 'Migration 08 completed successfully - localisation and etat_vetuste fields added' AS status;

-- Show updated table structures
SHOW COLUMNS FROM equipment_aerotherme;
SHOW COLUMNS FROM equipment_climate;
SHOW COLUMNS FROM equipment_rooftop;
SHOW COLUMNS FROM equipment_lighting;
