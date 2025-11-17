-- ============================================
-- CLEANUP DUPLICATE EQUIPMENT ENTRIES
-- ============================================
-- This script removes duplicate equipment entries,
-- keeping only the latest entry per site

USE avancement2;

-- Show current duplicates
SELECT 'BEFORE CLEANUP - equipment_aerotherme duplicates:' AS status;
SELECT site_name, COUNT(*) as count, GROUP_CONCAT(id ORDER BY id) as ids
FROM equipment_aerotherme
GROUP BY site_name
HAVING COUNT(*) > 1;

-- Delete duplicates from equipment_aerotherme (keep latest)
DELETE t1 FROM equipment_aerotherme t1
INNER JOIN equipment_aerotherme t2
WHERE t1.site_name = t2.site_name AND t1.id < t2.id;

-- Delete duplicates from equipment_rooftop (keep latest)
DELETE t1 FROM equipment_rooftop t1
INNER JOIN equipment_rooftop t2
WHERE t1.site_name = t2.site_name AND t1.id < t2.id;

-- Delete duplicates from equipment_climate (keep latest)
DELETE t1 FROM equipment_climate t1
INNER JOIN equipment_climate t2
WHERE t1.site_name = t2.site_name AND t1.id < t2.id;

-- Delete duplicates from equipment_lighting (keep latest)
DELETE t1 FROM equipment_lighting t1
INNER JOIN equipment_lighting t2
WHERE t1.site_name = t2.site_name AND t1.id < t2.id;

-- Show cleanup result
SELECT 'AFTER CLEANUP - equipment_aerotherme:' AS status;
SELECT id, site_name, nb_aerotherme FROM equipment_aerotherme ORDER BY site_name;

-- Add UNIQUE constraints
ALTER TABLE equipment_aerotherme ADD UNIQUE KEY unique_site_aero (site_name);
ALTER TABLE equipment_rooftop ADD UNIQUE KEY unique_site_roof (site_name);
ALTER TABLE equipment_climate ADD UNIQUE KEY unique_site_clim (site_name);
ALTER TABLE equipment_lighting ADD UNIQUE KEY unique_site_light (site_name);

SELECT 'UNIQUE constraints added successfully!' AS status;
