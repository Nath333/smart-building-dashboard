-- Add localisation and etat_vetuste fields to all equipment tables
-- Migration: 08_add_localisation_etat_vetuste.sql (Fixed for MySQL compatibility)
-- Date: 2025-01-16

-- =====================================================
-- AEROTHERME
-- =====================================================
ALTER TABLE equipment_aerotherme
ADD COLUMN etat_vetuste_aerotherme ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon état, yellow=état moyen, red=mauvais état',
ADD COLUMN localisation_aerotherme VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement aérotherme';

-- =====================================================
-- CLIMATE (CLIM)
-- =====================================================
ALTER TABLE equipment_climate
ADD COLUMN etat_vetuste_clim ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon état, yellow=état moyen, red=mauvais état',
ADD COLUMN localisation_clim VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement climatisation';

-- =====================================================
-- ROOFTOP
-- =====================================================
ALTER TABLE equipment_rooftop
ADD COLUMN etat_vetuste_rooftop ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon état, yellow=état moyen, red=mauvais état',
ADD COLUMN localisation_rooftop VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement rooftop';

-- =====================================================
-- LIGHTING (ECLAIRAGE)
-- =====================================================
ALTER TABLE equipment_lighting
ADD COLUMN etat_vetuste_eclairage ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon état, yellow=état moyen, red=mauvais état',
ADD COLUMN localisation_eclairage VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement éclairage';

-- Verify changes
SELECT 'Migration 08 completed successfully - localisation and etat_vetuste fields added' AS status;
