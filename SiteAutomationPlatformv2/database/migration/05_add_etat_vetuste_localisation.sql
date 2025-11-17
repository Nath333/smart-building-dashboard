-- Add etat_vetuste and localisation fields to all equipment tables
-- Migration: 05_add_etat_vetuste_localisation.sql
-- Date: 2025-10-15

-- Add to equipment_aerotherme
ALTER TABLE equipment_aerotherme
ADD COLUMN IF NOT EXISTS etat_vetuste ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon, yellow=moyen, red=mauvais',
ADD COLUMN IF NOT EXISTS localisation VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement',
ADD COLUMN IF NOT EXISTS localisation_comptage VARCHAR(255) DEFAULT NULL COMMENT 'Localisation du comptage';

-- Add to equipment_climate
ALTER TABLE equipment_climate
ADD COLUMN IF NOT EXISTS etat_vetuste ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon, yellow=moyen, red=mauvais',
ADD COLUMN IF NOT EXISTS localisation VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement',
ADD COLUMN IF NOT EXISTS localisation_comptage VARCHAR(255) DEFAULT NULL COMMENT 'Localisation du comptage';

-- Add to equipment_rooftop
ALTER TABLE equipment_rooftop
ADD COLUMN IF NOT EXISTS etat_vetuste ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon, yellow=moyen, red=mauvais',
ADD COLUMN IF NOT EXISTS localisation VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement',
ADD COLUMN IF NOT EXISTS localisation_comptage VARCHAR(255) DEFAULT NULL COMMENT 'Localisation du comptage';

-- Add to equipment_lighting
ALTER TABLE equipment_lighting
ADD COLUMN IF NOT EXISTS etat_vetuste ENUM('green', 'yellow', 'red') DEFAULT NULL COMMENT 'État de vétusté: green=bon, yellow=moyen, red=mauvais',
ADD COLUMN IF NOT EXISTS localisation VARCHAR(255) DEFAULT NULL COMMENT 'Localisation de l\'équipement',
ADD COLUMN IF NOT EXISTS localisation_comptage VARCHAR(255) DEFAULT NULL COMMENT 'Localisation du comptage';

-- Verify changes
SELECT 'Migration completed successfully' AS status;
