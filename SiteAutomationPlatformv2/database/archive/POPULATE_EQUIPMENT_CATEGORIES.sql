-- ===============================================
-- POPULATE EQUIPMENT CATEGORIES
-- Adds the standard equipment categories to your empty equipment_categories table
-- ===============================================

-- 1️⃣ INSERT EQUIPMENT CATEGORIES
INSERT INTO equipment_categories (category_code, category_name, description, is_active) VALUES
('AERO', 'Aérothermes', 'Systèmes de chauffage aérothermes', TRUE),
('CLIM_IR', 'Climatisation IR', 'Climatisation avec télécommande infrarouge', TRUE),
('CLIM_WIRE', 'Climatisation Filaire', 'Climatisation avec commande filaire', TRUE),
('ROOFTOP', 'Rooftop', 'Unités de traitement d\'air en toiture', TRUE),
('LIGHTING', 'Éclairage', 'Systèmes d\'éclairage intérieur et extérieur', TRUE),
('GTB_SENSORS', 'Sondes GTB', 'Capteurs et sondes pour GTB', TRUE),
('GTB_MODULES', 'Modules GTB', 'Modules de gestion technique du bâtiment', TRUE),
('ELECTRICAL', 'Coffrets Électriques', 'Coffrets et armoires électriques', TRUE),
('CONTROLS', 'Commandes', 'Télécommandes et systèmes de contrôle', TRUE),
('TIMERS', 'Horloges', 'Systèmes d\'horloge et temporisation', TRUE)
ON DUPLICATE KEY UPDATE
    category_name = VALUES(category_name),
    description = VALUES(description),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;

-- 2️⃣ VERIFY CATEGORIES WERE CREATED
SELECT '✅ Equipment categories created:' as status;
SELECT
    id,
    category_code,
    category_name,
    is_active
FROM equipment_categories
ORDER BY category_code;

-- Count total categories
SELECT COUNT(*) as total_categories FROM equipment_categories WHERE is_active = TRUE;