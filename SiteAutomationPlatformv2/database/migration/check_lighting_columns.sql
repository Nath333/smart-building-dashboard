-- Run this query to see your actual table structure
SELECT
    ORDINAL_POSITION,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'equipment_lighting'
ORDER BY ORDINAL_POSITION;

-- Also show your actual data with column names
SELECT * FROM equipment_lighting
WHERE site_name = 'Bricomarché Chatillon-en-Michaille'
AND zone_eclairage = 'surface_de_vente';
