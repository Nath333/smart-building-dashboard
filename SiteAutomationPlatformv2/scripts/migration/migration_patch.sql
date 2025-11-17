-- SAFE MIGRATION - ADD NEW ENDPOINTS ALONGSIDE OLD ONES
-- This won't break existing functionality

-- Just run this to complete the table structure:
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
    clim_filaire_simple INT DEFAULT 0,
    clim_filaire_groupe INT DEFAULT 0,
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
    UNIQUE KEY unique_site_gtb (site_id)
);

-- Your app keeps working exactly as before
-- New tables are ready for gradual migration when YOU want