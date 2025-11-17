-- Migration: Create comptage (metering) tables for equipment tracking
-- Created: 2025-10-16
-- Purpose: Track individual metering devices across different equipment categories

-- Table: equipment_comptage_aerotherme
CREATE TABLE IF NOT EXISTS equipment_comptage_aerotherme (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    zone VARCHAR(100) DEFAULT NULL COMMENT 'Localisation/zone of the comptage',
    nb INT DEFAULT 1 COMMENT 'Number of comptages',
    type VARCHAR(100) DEFAULT NULL COMMENT 'Type de comptage',
    connection_type VARCHAR(100) DEFAULT NULL COMMENT 'Type de connexion',
    puissance DECIMAL(10,2) DEFAULT NULL COMMENT 'Puissance totale in Watts',
    commentaire TEXT DEFAULT NULL,
    etat_vetuste VARCHAR(50) DEFAULT NULL COMMENT 'État de vétusté (condition)',
    localisation VARCHAR(255) DEFAULT NULL COMMENT 'Specific location',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_site_zone (site_name, zone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: equipment_comptage_climate
CREATE TABLE IF NOT EXISTS equipment_comptage_climate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    zone VARCHAR(100) DEFAULT NULL COMMENT 'Localisation/zone of the comptage',
    nb INT DEFAULT 1 COMMENT 'Number of comptages',
    type VARCHAR(100) DEFAULT NULL COMMENT 'Type de comptage',
    connection_type VARCHAR(100) DEFAULT NULL COMMENT 'Type de connexion',
    puissance DECIMAL(10,2) DEFAULT NULL COMMENT 'Puissance totale in Watts',
    commentaire TEXT DEFAULT NULL,
    etat_vetuste VARCHAR(50) DEFAULT NULL COMMENT 'État de vétusté (condition)',
    localisation VARCHAR(255) DEFAULT NULL COMMENT 'Specific location',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_site_zone (site_name, zone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: equipment_comptage_lighting
CREATE TABLE IF NOT EXISTS equipment_comptage_lighting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    zone VARCHAR(100) DEFAULT NULL COMMENT 'Localisation/zone of the comptage',
    nb INT DEFAULT 1 COMMENT 'Number of comptages',
    type VARCHAR(100) DEFAULT NULL COMMENT 'Type de comptage',
    connection_type VARCHAR(100) DEFAULT NULL COMMENT 'Type de connexion',
    puissance DECIMAL(10,2) DEFAULT NULL COMMENT 'Puissance totale in Watts',
    commentaire TEXT DEFAULT NULL,
    etat_vetuste VARCHAR(50) DEFAULT NULL COMMENT 'État de vétusté (condition)',
    localisation VARCHAR(255) DEFAULT NULL COMMENT 'Specific location',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_site_zone (site_name, zone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: equipment_comptage_rooftop
CREATE TABLE IF NOT EXISTS equipment_comptage_rooftop (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    zone VARCHAR(100) DEFAULT NULL COMMENT 'Localisation/zone of the comptage',
    nb INT DEFAULT 1 COMMENT 'Number of comptages',
    type VARCHAR(100) DEFAULT NULL COMMENT 'Type de comptage',
    connection_type VARCHAR(100) DEFAULT NULL COMMENT 'Type de connexion',
    puissance DECIMAL(10,2) DEFAULT NULL COMMENT 'Puissance totale in Watts',
    commentaire TEXT DEFAULT NULL,
    etat_vetuste VARCHAR(50) DEFAULT NULL COMMENT 'État de vétusté (condition)',
    localisation VARCHAR(255) DEFAULT NULL COMMENT 'Specific location',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_site_zone (site_name, zone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
